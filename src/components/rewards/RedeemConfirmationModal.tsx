import React, { useState } from 'react';
import { X, Sparkles, AlertCircle, ArrowRight, ShieldCheck, Store, MapPin, Loader2 } from 'lucide-react';
import { RewardItem } from '../../types';
import { useTranslation } from '../../contexts/LanguageContext';
import { Button } from '../ui/Button';

interface RedeemConfirmationModalProps {
  reward: RewardItem;
  userPoints: number;
  onConfirm: (reward: RewardItem) => Promise<void>;
  onClose: () => void;
}

export const RedeemConfirmationModal: React.FC<RedeemConfirmationModalProps> = ({
  reward,
  userPoints,
  onConfirm,
  onClose,
}) => {
  const { locale, isRTL, t } = useTranslation();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const remainingBalance = Math.max(0, userPoints - reward.pointsCost);

  const title = locale === 'ur' && reward.titleUrdu ? reward.titleUrdu : reward.title;
  const businessName = locale === 'ur' && reward.businessNameUrdu ? reward.businessNameUrdu : reward.businessName;
  const businessAddress = locale === 'ur' && reward.businessAddressUrdu ? reward.businessAddressUrdu : reward.businessAddress;
  const terms = locale === 'ur' && reward.termsUrdu ? reward.termsUrdu : reward.terms;

  const handleConfirm = async () => {
    setIsProcessing(true);
    setErrorMsg(null);
    try {
      await onConfirm(reward);
    } catch (err: unknown) {
      console.error('Redemption error:', err);
      setErrorMsg((err as Error)?.message || 'Failed to complete redemption. Please try again.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-emerald-50/80 to-amber-50/50 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4 fill-white" />
            </span>
            <div>
              <h3 className={`text-sm font-bold text-stone-900 ${locale === 'ur' ? 'font-urdu' : ''}`}>
                {t('rewards.redeemModalTitle')}
              </h3>
              <p className="text-[11px] text-stone-500">Sahiwal Civic Rewards</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-xl hover:bg-stone-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs text-stone-700">
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Reward Summary Card */}
          <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/90 space-y-2">
            <div className="flex items-center gap-2 text-stone-900 font-bold text-sm">
              <Store className="w-4 h-4 text-[#0F5132]" />
              <span>{businessName}</span>
            </div>
            <p className="text-xs font-semibold text-stone-800">{title}</p>
            <div className="flex items-center gap-1 text-[11px] text-stone-500">
              <MapPin className="w-3 h-3 text-stone-400 shrink-0" />
              <span className="truncate">{businessAddress}</span>
            </div>
          </div>

          {/* CleanPoints Calculation Breakdown */}
          <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-stone-600">{t('rewards.currentBalance')}:</span>
              <span className="font-bold text-stone-900">{userPoints} pts</span>
            </div>
            <div className="flex items-center justify-between text-xs text-amber-900 font-bold border-t border-amber-200/60 pt-1.5">
              <span>{t('rewards.cost')}:</span>
              <span>- {reward.pointsCost} pts</span>
            </div>
            <div className="flex items-center justify-between text-xs text-emerald-800 font-black border-t border-amber-200/60 pt-1.5">
              <span>{t('rewards.remainingBalance')}:</span>
              <span className="text-sm font-extrabold">{remainingBalance} pts</span>
            </div>
          </div>

          {/* Terms info */}
          <div className="text-[11px] text-stone-500 bg-stone-50 p-2.5 rounded-xl border border-stone-150 leading-relaxed">
            <span className="font-bold text-stone-700 block mb-0.5">Note / شرائط:</span>
            {terms}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-stone-50 border-t border-stone-100 flex flex-col gap-2">
          <Button
            type="button"
            variant="primary"
            size="md"
            fullWidth
            disabled={isProcessing}
            loading={isProcessing}
            onClick={handleConfirm}
          >
            <div className="flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 fill-amber-300 text-amber-200" />
              <span>{isProcessing ? t('rewards.processing') : t('rewards.confirmRedeemBtn')}</span>
            </div>
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            fullWidth
            disabled={isProcessing}
            onClick={onClose}
          >
            {t('common.cancel')}
          </Button>
        </div>
      </div>
    </div>
  );
};
