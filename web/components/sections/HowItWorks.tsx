'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Zap, Trophy, Wallet, type LucideIcon } from 'lucide-react';
import { SectionBadge } from '@/components/ui/SectionBadge';
import { PhoneMockup } from '@/components/ui/PhoneMockup';
import { MockedChargingScreen } from '@/components/ui/MockedChargingScreen';
import { UsbCable } from '@/components/ui/UsbCable';
import { cn } from '@/lib/cn';
import { useMetalSpotlight } from '@/lib/useMetalSpotlight';

const STEPS: Array<{
  key: 'step1' | 'step2' | 'step3';
  icon: LucideIcon;
  image?: string;
  alt: string;
}> = [
  { key: 'step1', icon: Zap, alt: 'Carregar' },
  { key: 'step2', icon: Trophy, image: '/images/screen-missions.png', alt: 'Missões' },
  { key: 'step3', icon: Wallet, image: '/images/screen-profile.png', alt: 'Perfil' },
];

export function HowItWorks() {
  const t = useTranslations('howItWorks');
  const titleRef = useMetalSpotlight<HTMLHeadingElement>();

  return (
    <section id="how-it-works" className="relative py-24 md:py-32">
      <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="mx-auto max-w-[1280px] px-5 md:px-8">
        <div className="max-w-2xl">
          <SectionBadge>{t('badge')}</SectionBadge>
          <h2 ref={titleRef} className="section-title mt-5 metal-text">{t('title')}</h2>
          <p className="mt-5 max-w-xl text-base md:text-lg text-white/55 leading-relaxed">
            {t('subtitle')}
          </p>
        </div>

        <div className="mt-16 relative">
          {/* Vertical connector */}
          <div
            aria-hidden
            className="absolute left-1/2 top-12 bottom-12 hidden lg:block w-px bg-gradient-to-b from-transparent via-primary/20 to-transparent -translate-x-1/2"
          />

          <div className="flex flex-col gap-20 md:gap-28">
            {STEPS.map((step, i) => {
              const isReverse = i % 2 === 1;
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.key}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-100px' }}
                  transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                  className={cn(
                    'grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center',
                    isReverse && 'lg:[direction:rtl]'
                  )}
                >
                  {/* Copy */}
                  <div className="group/step lg:col-span-7 lg:[direction:ltr]">
                    <div className="flex items-center gap-3 mb-7">
                      <span
                        aria-hidden
                        className="h-px w-8 bg-gradient-to-r from-transparent to-secondary-light/40"
                      />
                      <span className="font-mono text-[10px] uppercase tracking-[0.32em] font-medium text-secondary-light/85">
                        {t(`${step.key}.label`)}
                      </span>
                    </div>
                    <div className="metal-step-icon inline-flex h-16 w-16 items-center justify-center rounded-2xl text-secondary-light">
                      <Icon className="h-7 w-7" />
                    </div>
                    <h3 className="mt-6 text-3xl md:text-4xl font-bold tracking-tight text-white">
                      {t(`${step.key}.title`)}
                    </h3>
                    <p className="mt-4 max-w-md text-white/60 leading-relaxed text-base md:text-lg">
                      {t(`${step.key}.description`)}
                    </p>
                  </div>
                  {/* Phone */}
                  <div className="lg:col-span-5 flex justify-center lg:[direction:ltr]">
                    {step.key === 'step1' ? (
                      <div className="relative flex flex-col items-center">
                        <PhoneMockup
                          alt={step.alt}
                          width={260}
                          height={562}
                          tilt={false}
                        >
                          <MockedChargingScreen />
                        </PhoneMockup>
                        <UsbCable className="-mt-px relative z-10" />
                      </div>
                    ) : (
                      <PhoneMockup
                        src={step.image}
                        alt={step.alt}
                        width={260}
                        height={562}
                        tilt={false}
                      />
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
