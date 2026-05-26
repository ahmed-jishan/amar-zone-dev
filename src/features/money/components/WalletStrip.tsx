'use client';

import type { Wallet } from '@/lib/types';
import { formatCurrency } from '../utils';

interface Props {
  wallets: Wallet[];
  selectedWalletId: string | null;
  currencySymbol: string;
  onSelect: (id: string) => void;
  onOpenTools: () => void;
}

export default function WalletStrip({ wallets, selectedWalletId, currencySymbol, onSelect, onOpenTools }: Props) {
  if (!wallets.length) return null;

  return (
    <section className="mb-5">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-[1.2px]" style={{ color: 'var(--mon-text-3)' }}>
          Wallets
        </p>
        <button
          type="button"
          onClick={onOpenTools}
          className="rounded-full px-2.5 py-1 text-[11px] font-bold transition-all active:scale-95"
          style={{ color: 'var(--mon-gold)', background: 'var(--mon-gold-bg)', border: '1px solid var(--mon-gold-glow)' }}
        >
          Tools
        </button>
      </div>
      <div className="flex gap-2.5 overflow-x-auto pb-1">
        {wallets.map((wallet) => {
          const active = wallet.id === selectedWalletId || (!selectedWalletId && wallet.isDefault);
          return (
            <button
              key={wallet.id}
              type="button"
              onClick={() => onSelect(wallet.id)}
              className="min-w-[152px] shrink-0 rounded-[18px] p-3.5 text-left transition-all duration-200 active:scale-[0.98]"
              style={{
                background: active
                  ? 'linear-gradient(135deg, var(--mon-gold-bg), var(--mon-surface-1))'
                  : 'var(--mon-surface-1)',
                border: `1px solid ${active ? 'var(--mon-gold-glow)' : 'transparent'}`,
                boxShadow: active ? '0 12px 26px rgba(201,168,76,0.14)' : 'var(--mon-shadow-sm)',
              }}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-[18px]">{wallet.icon}</span>
                {wallet.isDefault && (
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ color: 'var(--mon-gold)', background: 'var(--mon-gold-bg)' }}>
                    Default
                  </span>
                )}
              </div>
              <p className="truncate text-[13px] font-semibold" style={{ color: 'var(--mon-text-2)' }}>{wallet.name}</p>
              <p className="mt-0.5 text-[17px] font-black" style={{ color: wallet.balance >= 0 ? 'var(--mon-text-1)' : 'var(--mon-expense)' }}>
                {formatCurrency(wallet.balance, currencySymbol)}
              </p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
