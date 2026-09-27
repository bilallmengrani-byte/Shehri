import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Copy, 
  Check, 
  Store, 
  MapPin, 
  Calendar, 
  Sparkles, 
  QrCode, 
  Share2, 
  ArrowRight,
  X
} from 'lucide-react';
import { RedemptionRecord } from '../../types';
import { useTranslation } from '../../contexts/LanguageContext';
import { Button } from '../ui/Button';

interface RedemptionSuccessModalProps {
  redemption: RedemptionRecord;
  onViewWallet: () => void;
  onClose: () => void;
}

export const RedemptionSuccessModal: React.FC<RedemptionSuccessModalProps> = ({
  redemption,
  onViewWallet,
  onClose,
}) => {
  const { locale, isRTL, t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(redemption.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const businessName = locale === 'ur' && redemption.businessNameUrdu ? redemption.businessNameUrdu : redemption.businessName;
  const rewardTitle = locale === 'ur' && redemption.rewardTitleUrdu ? redemption.rewardTitleUrdu : redemption.rewardTitle;
  const formattedExpiry = new Date(redemption.expiresAt).toLocaleDateString(locale === 'ur' ? 'ur-PK' : 'en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 animate-fade-in">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top Celebration Card */}
        <div className="p-5 bg-gradient-to-br from-[#0F5132] via-[#0A3B24] to-[#052214] text-white text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-28 h-28 rounded-full bg-white/5 pointer-events-none" />
          
          <button
            onClick={onClose}
            className="absolute top-3 end-3 p-1.5 text-emerald-200/80 hover:text-white rounded-xl transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="w-12 h-12 rounded-2xl bg-amber-400 text-stone-950 flex items-center justify-center mx-auto mb-2.5 shadow-md">
            <Sparkles className="w-6 h-6 fill-stone-950" />
          </div>

          <h3 className="text-base font-extrabold tracking-tight">
            {t('rewards.successTitle')}
          </h3>
          <p className="text-[11px] text-emerald-100/90 mt-0.5 max-w-xs mx-auto">
            {t('rewards.successSubtitle')}
          </p>
        </div>

        {/* Voucher Ticket Center */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Ticket Shape */}
          <div className="p-4 rounded-3xl bg-amber-50/50 border-2 border-dashed border-amber-300 relative text-center space-y-3 shadow-2xs">
            <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-amber-900">
              <Store className="w-4 h-4 text-[#0F5132]" />
              <span>{businessName}</span>
            </div>

            <div className="text-sm font-extrabold text-stone-900">
              {rewardTitle}
            </div>

            {/* Large Copyable Voucher Code Box */}
            <div className="py-3 px-4 rounded-2xl bg-white border border-amber-300 shadow-inner flex flex-col items-center justify-center gap-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                {t('rewards.voucherCode')}
              </span>
              <div className="font-mono text-xl font-black text-[#0F5132] tracking-wider select-all">
                {redemption.code}
              </div>

              {/* Pseudo Barcode Aesthetics */}
              <div className="flex items-center justify-center gap-1 h-4 w-36 opacity-70 my-0.5">
                {[2, 1, 3, 1, 2, 4, 1, 2, 3, 1, 2, 1, 3, 2].map((w, i) => (
                  <div key={i} className="bg-stone-800 h-full rounded-xs" style={{ width: `${w * 2}px` }} />
                ))}
              </div>
            </div>

            {/* Copy Button */}
            <button
              type="button"
              onClick={handleCopyCode}
              className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-amber-500 hover:bg-amber-600 text-stone-950 active:scale-98'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>{t('rewards.copied')}</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>{t('rewards.copyCode')}</span>
                </>
              )}
            </button>

            {/* Expiry date */}
            <div className="flex items-center justify-center gap-1 text-[11px] text-stone-500 pt-1">
              <Calendar className="w-3 h-3 text-stone-400" />
              <span>{t('rewards.validUntil')}: <strong className="text-stone-700">{formattedExpiry}</strong></span>
            </div>
          </div>

          {/* Instructions Box */}
          <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 text-xs space-y-1.5">
            <span className="font-bold text-stone-800 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#0F5132]" />
              <span>{t('rewards.instructionsTitle')}</span>
            </span>
            <p className="text-[11px] text-stone-600 leading-relaxed">
              {t('rewards.instructionsText')}
            </p>
            {redemption.businessAddress && (
              <p className="text-[11px] font-semibold text-emerald-800 pt-1 border-t border-stone-200/60 truncate">
                📍 {redemption.businessAddress}
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-stone-50 border-t border-stone-100 flex flex-col gap-2">
          <Button
            type="button"
            variant="primary"
            size="md"
            fullWidth
            onClick={onViewWallet}
          >
            <div className="flex items-center justify-center gap-2">
              <span>{t('rewards.viewInWallet')}</span>
              <ArrowRight className="w-4 h-4 rtl-flip" />
            </div>
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            fullWidth
            onClick={onClose}
          >
            {t('rewards.browseMore')}
          </Button>
        </div>
      </div>
    </div>
  );
};
