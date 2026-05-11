import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { TokenomicsHero } from '@/components/sections/tokenomics/TokenomicsHero';
import { Overview } from '@/components/sections/tokenomics/Overview';
import { Distribution } from '@/components/sections/tokenomics/Distribution';
import { EmissionCurve } from '@/components/sections/tokenomics/EmissionCurve';
import { Utility } from '@/components/sections/tokenomics/Utility';
import { Burn } from '@/components/sections/tokenomics/Burn';
import { Staking } from '@/components/sections/tokenomics/Staking';
import { PointsConverter } from '@/components/sections/tokenomics/PointsConverter';
import { WhySolana } from '@/components/sections/tokenomics/WhySolana';
import { Roadmap } from '@/components/sections/tokenomics/Roadmap';
import { TokenomicsFaq } from '@/components/sections/tokenomics/TokenomicsFaq';
import { FinalCta } from '@/components/sections/tokenomics/FinalCta';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'pages.tokenomics' });
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    openGraph: {
      title: t('metaTitle'),
      description: t('metaDescription'),
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: t('metaTitle'),
      description: t('metaDescription'),
    },
  };
}

export default async function TokenomicsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <TokenomicsHero />
      <Overview />
      <Distribution />
      <EmissionCurve />
      <Utility />
      <Burn />
      <Staking />
      <PointsConverter />
      <WhySolana />
      <Roadmap />
      <TokenomicsFaq />
      <FinalCta />
    </>
  );
}
