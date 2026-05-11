import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'pages.manifesto' });
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    openGraph: {
      title: t('metaTitle'),
      description: t('metaDescription'),
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: t('metaTitle'),
      description: t('metaDescription'),
    },
  };
}

export default async function ManifestoPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <article className="relative pt-28 pb-24 md:pt-36 md:pb-32">
      {/* Hero */}
      <header className="mx-auto max-w-[920px] px-5 md:px-8">
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.32em] text-white/65">
          Manifesto
        </p>
        <h1 className="metal-text mt-5 text-[clamp(36px,5.2vw,68px)] font-black leading-[1.04] tracking-[-0.02em]">
          Manifesto Juice
        </h1>
        <p className="mt-6 text-[clamp(17px,1.8vw,22px)] italic font-light leading-relaxed text-white/65" style={{ fontFamily: "'Instrument Serif', serif" }}>
          De Cripto no Bolso para o mundo. Por que agora, por que Solana,
          e o que continua exatamente igual.
        </p>
      </header>

      {/* Body */}
      <div className="mx-auto mt-16 max-w-[760px] px-5 md:mt-20 md:px-8">

        {/* Section 1 */}
        <section>
          <h2 className="metal-text text-[clamp(22px,2.6vw,32px)] font-black tracking-[-0.02em] leading-tight">
            A história não começa hoje
          </h2>
          <div className="mt-6 space-y-5 text-[clamp(15px,1.4vw,18px)] leading-[1.7] text-white/75">
            <p>
              Começou com <strong className="text-white">Cripto no Bolso</strong> —
              uma ideia teimosa de que cripto não era pra poucos, era pra
              qualquer um com um celular na mão.
            </p>
            <p>
              De Cripto no Bolso virou <strong className="text-white">CNB</strong>.
              E de CNB nasceu uma operação real:{' '}
              <strong className="text-white">
                mais de 400 rigs de mineração vendidas e instaladas em todo o
                Brasil
              </strong>
              . Hardware que não era promessa de whitepaper — era ferro,
              cabo, watt, e gente minerando de verdade nos cantos mais
              improváveis do país.
            </p>
            <p>
              Esse caminho nos levou para os palcos.{' '}
              <strong className="text-white">
                Palestras, congressos, feiras internacionais.
              </strong>{' '}
              Cada lugar onde o futuro do dinheiro estava sendo discutido,
              a gente estava lá — não como espectador, mas como quem já
              tinha calo na mão de fazer cripto acontecer fora da bolha.
            </p>
            <p>
              Quando lançamos o <strong className="text-white">CNB Mobile</strong>,
              foi a evolução natural. Mineração exige rig, consumo, espaço,
              conhecimento. Carregar o celular, todo mundo já faz. Pegamos
              o gesto mais banal do dia e transformamos em renda: cada
              minuto plugado vira pontos, cada ponto vira dinheiro real.
              Sem catch, sem letras miúdas, sem economia paralela. Energia
              entra, valor sai.
            </p>
            <p>
              Mais de <strong className="text-white">5.000 usuários ativos</strong>{' '}
              depois, a tese se provou. Pessoas reais, em milhares de
              casas, transformando o tempo morto do carregador em renda
              todos os dias. Pequeno no começo. Inegável agora.
            </p>
          </div>
        </section>

        <Divider />

        {/* Section 2 */}
        <section>
          <h2 className="metal-text text-[clamp(22px,2.6vw,32px)] font-black tracking-[-0.02em] leading-tight">
            Por que CNB Mobile virou Juice
          </h2>
          <div className="mt-6 space-y-5 text-[clamp(15px,1.4vw,18px)] leading-[1.7] text-white/75">
            <p>Porque chegou a hora de sair do Brasil.</p>
            <p>
              CNB era nosso, brasileiro, local — fez seu papel e fez bem.
              Mas <strong className="text-white">Juice</strong> — gíria
              global para bateria, para energia, para o combustível que
              move qualquer coisa — é o nome que funciona em qualquer
              idioma, em qualquer país, em qualquer carregador do planeta.
            </p>
            <p>
              Não é só um rebrand.{' '}
              <strong className="text-white">
                É uma declaração de intenção.
              </strong>{' '}
              Estamos indo para o mercado mundial.
            </p>
          </div>
        </section>

        <Divider />

        {/* Section 3 */}
        <section>
          <h2 className="metal-text text-[clamp(22px,2.6vw,32px)] font-black tracking-[-0.02em] leading-tight">
            Por que agora
          </h2>
          <div className="mt-6 space-y-5 text-[clamp(15px,1.4vw,18px)] leading-[1.7] text-white/75">
            <p>
              Porque o que era um sistema de pontos com saque em PIX agora
              é uma rede de incentivos rodando sobre{' '}
              <strong className="text-white">Solana</strong>. Pagamentos
              instantâneos. Pagamentos globais. Pagamentos em cripto, com a
              velocidade e o custo que só uma blockchain de verdade
              entrega.
            </p>
            <p>E não estamos fazendo isso sozinhos.</p>
            <p>
              A{' '}
              <strong className="text-white">
                Solana Foundation está com a gente nessa transição
              </strong>{' '}
              — acompanhando de perto, validando arquitetura, abrindo
              portas. Para uma equipe que começou regional, ter esse nível
              de parceria não é detalhe. É o oxigênio que torna o salto
              possível.
            </p>
            <p className="text-white/85">
              Saímos da carteira local. Entramos na economia digital global.
            </p>
          </div>
        </section>

        <Divider />

        {/* Section 4 */}
        <section>
          <h2 className="metal-text text-[clamp(22px,2.6vw,32px)] font-black tracking-[-0.02em] leading-tight">
            O que continua exatamente o mesmo
          </h2>
          <div className="mt-6 space-y-5 text-[clamp(15px,1.4vw,18px)] leading-[1.7] text-white/75">
            <p>
              O DNA. A obsessão por entregar o melhor serviço para o
              usuário que confiou na gente quando ainda éramos só CNB
              Mobile.
            </p>
            <p>
              Cada decisão de produto, cada linha de código, cada release
              vai continuar sendo guiada pela mesma pergunta de sempre:
            </p>
            <blockquote
              className="my-2 rounded-r-md border-l-2 py-3 pl-5 text-[clamp(16px,1.55vw,20px)] italic text-white/85"
              style={{
                borderColor: 'var(--primary-light, #c6ff4a)',
                backgroundColor: 'rgba(198,255,74,0.04)',
              }}
            >
              <strong className="not-italic text-white">
                Isso recompensa quem carrega? Isso é justo? Isso é melhor
                que ontem?
              </strong>
            </blockquote>
            <p>Se a resposta for não, a gente refaz.</p>
          </div>
        </section>

        <Divider />

        {/* Section 5 */}
        <section>
          <h2 className="metal-text text-[clamp(22px,2.6vw,32px)] font-black tracking-[-0.02em] leading-tight">
            O que vem por aí
          </h2>
          <div className="mt-6 space-y-5 text-[clamp(15px,1.4vw,18px)] leading-[1.7] text-white/75">
            <p>
              Mais países. Mais idiomas. Mais formas de ganhar. Pagamentos
              que chegam em segundos, não em dias. Uma comunidade global de
              pessoas que entendem uma coisa simples:{' '}
              <strong className="text-white">
                energia tem valor, e esse valor pertence a quem fornece.
              </strong>
            </p>
          </div>
        </section>

        {/* Sign-off */}
        <div className="mt-14 border-t border-white/10 pt-10 md:mt-20 md:pt-12">
          <p className="text-[clamp(18px,1.8vw,24px)] leading-relaxed text-white/85">
            <strong className="text-white">CNB Mobile abriu a porta.</strong>
            <br />
            Juice atravessa a fronteira.
          </p>
          <p
            className="mt-6 text-[clamp(20px,2vw,26px)] italic font-light text-white/85"
            style={{ fontFamily: "'Instrument Serif', serif" }}
          >
            Bem-vindos.
          </p>
          <p className="mt-10 font-mono text-[11px] uppercase tracking-[0.32em] text-white/65">
            — Equipe Juice
          </p>
          <a
            href="https://usejuicemobile.com"
            className="mt-2 inline-block text-sm text-white/60 transition-colors hover:text-white/85"
            style={{ color: 'var(--primary-light, #c6ff4a)' }}
          >
            usejuicemobile.com
          </a>
        </div>

      </div>
    </article>
  );
}

function Divider() {
  return (
    <div
      aria-hidden
      className="mx-auto my-12 h-px max-w-[160px] md:my-16"
      style={{
        background:
          'linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)',
      }}
    />
  );
}
