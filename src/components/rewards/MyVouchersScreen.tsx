import React, { useState } from 'react';
import { 
  Sparkles, 
  Store, 
  MapPin, 
  Calendar, 
  Copy, 
  Check, 
  CheckCircle2, 
  Ticket, 
  ArrowRight,
  ExternalLink,
  ShoppingBag,
  Clock
} from 'lucide-react';
import { RedemptionRecord } from '../../types';
import { useTranslation } from '../../contexts/LanguageContext';
import { redemptionsService } from '../../services/redemptionsService';
import { Button } from '../ui/Button';

interface MyVouchersScreenProps {
  vouchers: RedemptionRecord[];
  onBrowseRewards: () => void;
  onRefresh: () => void;
}

export const MyVouchersScreen: React.FC<MyVouchersScreenProps> = ({
  vouchers,
  onBrowseRewards,
  onRefresh,
}) => {
  const { locale, isRTL, t } = useTranslation();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const handleCopyCode = async (id: string, code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2500);
    } catch {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2500);
    }
  };

  const handleMarkAsClaimed = async (id: string) => {
    setClaimingId(id);
    try {
      await redemptionsService.markAsClaimed(id);
      onRefresh();
    } catch (err) {
      console.error('Failed to mark voucher as claimed:', err);
    } finally {
      setClaimingId(null);
    }
  };

  if (vouchers.length === 0) {
    return (
      <div className="p-8 text-center flex flex-col items-center justify-center bg-white rounded-3xl border border-stone-200/80 shadow-2xs space-y-4 my-2">
        <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-900 flex items-center justify-center shadow-inner">
          <Ticket className="w-8 h-8 text-amber-700" />
        </div>
        <div className="space-y-1 max-w-xs">
          <h3 className={`text-base font-bold text-stone-900 ${locale === 'ur' ? 'font-urdu' : ''}`}>
            {t('rewards.emptyVouchersTitle')}
          </h3>
          <p className="text-xs text-stone-500 leading-relaxed">
            {t('rewards.emptyVouchersDesc')}
          </p>
        </div>
        <Button
          type="button"
          variant="primary"
          size="md"
          onClick={onBrowseRewards}
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 fill-amber-300" />
            <span>{t('rewards.redeemFirst')}</span>
          </div>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3.5">
      {vouchers.map((voucher) => {
        const isActive = voucher.status === 'active';
        const isCopied = copiedId === voucher.id;
        const businessName = locale === 'ur' && voucher.businessNameUrdu ? voucher.businessNameUrdu : voucher.businessName;
        const rewardTitle = locale === 'ur' && voucher.rewardTitleUrdu ? voucher.rewardTitleUrdu : voucher.rewardTitle;
        const formattedDate = new Date(voucher.redeemedAt).toLocaleDateString(locale === 'ur' ? 'ur-PK' : 'en-US', {
          day: 'numeric',
          month: 'short',
        });
        const formattedExpiry = new Date(voucher.expiresAt).toLocaleDateString(locale === 'ur' ? 'ur-PK' : 'en-US', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        });

        return (
          <div
            key={voucher.id}
            className={`rounded-3xl border overflow-hidden transition-all ${
              isActive
                ? 'bg-white border-amber-200/90 shadow-2xs hover:shadow-xs'
                : 'bg-stone-50/80 border-stone-200/70 opacity-75'
            }`}
          >
            {/* Top Bar with Merchant & Status */}
            <div className="p-4 pb-2 border-b border-stone-100 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-xs font-bold text-stone-900">
                  <Store className="w-3.5 h-3.5 text-[#0F5132] shrink-0" />
                  <span className="truncate">{businessName}</span>
                </div>
                <h4 className="text-sm font-bold text-stone-800 mt-0.5 leading-snug">
                  {rewardTitle}
                </h4>
                {voucher.businessAddress && (
                  <p className="text-[11px] text-stone-500 truncate mt-0.5">
                    📍 {voucher.businessAddress}
                  </p>
                )}
              </div>

              <span
                className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold uppercase tracking-wider shrink-0 border ${
                  isActive
                    ? 'bg-emerald-50 text-[#0F5132] border-emerald-300'
                    : 'bg-stone-200 text-stone-600 border-stone-300'
                }`}
              >
                {isActive ? t('rewards.activeVoucher') : t('rewards.claimedVoucher')}
              </span>
            </div>

            {/* Voucher Code Box & Actions */}
            <div className="p-4 bg-stone-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
              {/* Code Display */}
              <div className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-2 bg-white px-3 py-2 rounded-2xl border border-stone-200/90 shadow-2xs">
                <div>
                  <span className="text-[9px] uppercase font-bold text-stone-400 block leading-none">
                    {t('rewards.voucherCode')}
                  </span>
                  <span className="font-mono text-sm font-black text-[#0F5132] tracking-wider select-all">
                    {voucher.code}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopyCode(voucher.id, voucher.code)}
                  className={`p-2 rounded-xl transition cursor-pointer shrink-0 ${
                    isCopied
                      ? 'bg-emerald-600 text-white'
                      : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                  }`}
                  title={t('rewards.copyCode')}
                >
                  {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Action Buttons & Expiry */}
              <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-2 shrink-0">
                <span className="text-[11px] text-stone-500">
                  {t('rewards.validUntil')}: <strong className="text-stone-700">{formattedExpiry}</strong>
                </span>

                {isActive && (
                  <button
                    type="button"
                    disabled={claimingId === voucher.id}
                    onClick={() => handleMarkAsClaimed(voucher.id)}
                    className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition cursor-pointer active:scale-95 border border-stone-200"
                  >
                    {t('rewards.markAsUsed')}
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
