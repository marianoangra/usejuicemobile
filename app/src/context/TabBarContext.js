// Visibilidade do menu inferior (FloatingTabBar) — auto-hide no scroll.
//
// Dois contextos de propósito:
//  - VisibilityCtx: o booleano `escondido`. Muda a cada hide/show — só o
//    FloatingTabBar consome, então só ele re-renderiza.
//  - ActionsCtx: { esconder, mostrar }. Valor estável (memoizado) — as telas
//    consomem isto via useTabBarScroll() e NÃO re-renderizam quando o menu
//    some/aparece. Importante: HomeScreen/ProfileScreen são telas grandes.
import React, {
  createContext, useContext, useState, useCallback, useRef, useMemo,
} from 'react';

const VisibilityCtx = createContext(false);
const ActionsCtx = createContext({ esconder() {}, mostrar() {} });

export function TabBarProvider({ children }) {
  const [escondido, setEscondido] = useState(false);
  const esconder = useCallback(() => setEscondido(true), []);
  const mostrar  = useCallback(() => setEscondido(false), []);
  const actions  = useMemo(() => ({ esconder, mostrar }), [esconder, mostrar]);
  return (
    <ActionsCtx.Provider value={actions}>
      <VisibilityCtx.Provider value={escondido}>
        {children}
      </VisibilityCtx.Provider>
    </ActionsCtx.Provider>
  );
}

// Para o FloatingTabBar — re-renderiza quando a visibilidade muda.
export function useTabBarEscondido() {
  return useContext(VisibilityCtx);
}

// Ações estáveis (esconder/mostrar) — não causam re-render por mudança de valor.
export function useTabBarActions() {
  return useContext(ActionsCtx);
}

// Espalhe o retorno deste hook na ScrollView/FlatList da tela:
//   const barraScroll = useTabBarScroll();
//   <ScrollView {...barraScroll} />
// Esconde o menu ao rolar pra baixo; mostra ao rolar pra cima ou no topo.
const LIMIAR_PX = 8; // movimento mínimo pra reagir (evita tremido)

export function useTabBarScroll() {
  const { esconder, mostrar } = useContext(ActionsCtx);
  const ultimoY = useRef(0);

  const onScroll = useCallback((e) => {
    const y = e?.nativeEvent?.contentOffset?.y ?? 0;
    const dy = y - ultimoY.current;
    if (y <= 0) mostrar();
    else if (dy > LIMIAR_PX) esconder();
    else if (dy < -LIMIAR_PX) mostrar();
    ultimoY.current = y;
  }, [esconder, mostrar]);

  return { onScroll, scrollEventThrottle: 16 };
}
