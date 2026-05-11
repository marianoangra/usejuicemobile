'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { Wallet, CheckCircle2, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/cn';

interface WalletConnectButtonProps {
  className?: string;
}

function shortAddress(addr: string) {
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

/**
 * Brand-styled wallet connect button. Hides the default purple/blue
 * Phantom UI in favor of our metal/champagne look. Uses the headless
 * useWallet + useWalletModal hooks; the modal itself stays default
 * (wallet-adapter-react-ui's bundled styles cover it acceptably).
 */
export function WalletConnectButton({ className }: WalletConnectButtonProps) {
  const t = useTranslations('walletButton');
  const { publicKey, connected, disconnect, connecting } = useWallet();
  const { setVisible } = useWalletModal();

  if (connected && publicKey) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <span className="metal-card inline-flex items-center gap-2 rounded-xl px-4 py-2.5">
          <CheckCircle2 className="h-4 w-4 text-secondary-light" />
          <span className="font-mono text-sm text-white tabular-nums">
            {shortAddress(publicKey.toBase58())}
          </span>
        </span>
        <button
          type="button"
          onClick={() => disconnect()}
          aria-label={t('disconnect')}
          className="rounded-xl border border-white/10 bg-white/[0.02] p-2.5 text-white/55 transition-colors hover:bg-white/[0.05] hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setVisible(true)}
      disabled={connecting}
      className={cn(
        'metal-cta inline-flex items-center justify-center gap-2 rounded-[16px] px-6 py-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60',
        className,
      )}
    >
      <Wallet className="h-4 w-4" />
      {connecting ? t('connecting') : t('connect')}
    </button>
  );
}
