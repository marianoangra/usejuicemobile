// Anúncios premiados (AdMob "rewarded") — wrapper de serviço.
//
// O crédito de pontos NÃO acontece aqui. Como o app paga PIX real, quem credita
// os +10 pts é o SERVIDOR, via AdMob Server-Side Verification (SSV): o app passa
// o uid em serverSideVerificationOptions.userId, o Google chama a Cloud Function
// `admobSSV` (functions/index.js), que valida a assinatura e credita no Firestore.
// O saldo na Home atualiza sozinho pelo snapshot do perfil.
import mobileAds, {
  RewardedAd, RewardedAdEventType, AdEventType,
} from 'react-native-google-mobile-ads';

export const ADMOB_APP_ID     = 'ca-app-pub-8328091197924465~3773866030';
export const REWARDED_UNIT_ID = 'ca-app-pub-8328091197924465/5635936254';

// Usa SEMPRE o bloco real — só assim o AdMob dispara o callback SSV (a URL de
// verificação fica configurada nesse bloco). Em dev registramos o emulador como
// dispositivo de teste (initAds), então ele recebe anúncios de TESTE com
// segurança, mas servidos pelo bloco real → o SSV é acionado.
const UNIT_ID = REWARDED_UNIT_ID;

let _ad = null;
let _pronto = false;
let _carregando = false;
let _sdkIniciado = false;

function initAds() {
  if (_sdkIniciado) return;
  _sdkIniciado = true;
  // Em dev, marca o emulador como dispositivo de teste → recebe anúncios de
  // teste mesmo usando o bloco real. Para testar num CELULAR real, adicione o
  // testDeviceId que o SDK loga no logcat (senão ele serviria anúncios reais).
  const preparar = __DEV__
    ? mobileAds().setRequestConfiguration({ testDeviceIdentifiers: ['EMULATOR'] })
    : Promise.resolve();
  preparar
    .then(() => mobileAds().initialize())
    .catch((e) => console.warn('[ads] init falhou:', e?.message));
}

// Cria e carrega um anúncio premiado vinculado ao uid (p/ o SSV creditar).
export function preloadRewarded(uid) {
  initAds();
  if (!uid) return; // sem uid o SSV não credita ninguém — não desperdiça request
  if (_carregando || _pronto) return;
  _carregando = true;
  _pronto = false;

  const ad = RewardedAd.createForAdRequest(UNIT_ID, {
    requestNonPersonalizedAdsOnly: false,
    serverSideVerificationOptions: {
      userId: uid ?? '', // chega no callback SSV como `user_id`
    },
  });

  const unsubLoaded = ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
    _pronto = true;
    _carregando = false;
  });
  const unsubErro = ad.addAdEventListener(AdEventType.ERROR, (e) => {
    console.warn('[ads] erro ao carregar anúncio:', e?.message);
    _pronto = false;
    _carregando = false;
    _ad = null;
    unsubLoaded();
    unsubErro();
  });

  _ad = ad;
  ad.load();
}

export function isRewardedReady() {
  return _pronto && !!_ad;
}

// Exibe o anúncio. Resolve se o usuário ganhou a recompensa; rejeita se fechou
// antes ou não havia anúncio. O crédito de pontos vem do servidor (SSV).
export async function showRewarded(uid) {
  if (!_pronto || !_ad) throw new Error('ads_indisponivel');
  const ad = _ad;

  return new Promise((resolve, reject) => {
    let recompensou = false;

    const unsubReward = ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
      recompensou = true;
    });
    const unsubClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
      unsubReward();
      unsubClosed();
      _ad = null;
      _pronto = false;
      _carregando = false;
      if (recompensou) resolve({ recompensado: true });
      else reject(new Error('ad_fechado_sem_recompensa'));
    });

    try {
      ad.show();
    } catch (e) {
      unsubReward();
      unsubClosed();
      _ad = null;
      _pronto = false;
      reject(e);
    }
  });
}
