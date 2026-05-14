'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Send } from 'lucide-react';

const BOT_URL = 'https://t.me/JuiceMobileBot';

export function TelegramBubble() {
  const t = useTranslations('nav');

  return (
    <motion.a
      href={BOT_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t('telegramBot')}
      initial={{ opacity: 0, y: 16, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="group fixed bottom-6 right-6 z-50 inline-flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-[#229ED9] text-white shadow-[0_10px_30px_-8px_rgba(34,158,217,0.55)] transition-all hover:scale-105 hover:bg-[#1B8AC0] hover:shadow-[0_14px_36px_-8px_rgba(34,158,217,0.7)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#229ED9]/60 md:bottom-8 md:right-8"
    >
      <Send className="h-6 w-6 -translate-x-[1px] translate-y-[1px]" aria-hidden />
      <span className="absolute right-[calc(100%+10px)] top-1/2 -translate-y-1/2 whitespace-nowrap rounded-md border border-white/10 bg-black/85 px-2.5 py-1 text-xs font-medium text-white opacity-0 shadow-lg backdrop-blur-md transition-opacity group-hover:opacity-100 pointer-events-none hidden md:block">
        {t('telegramBot')}
      </span>
    </motion.a>
  );
}
