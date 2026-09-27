import React from 'react';
import { 
  ShoppingBag, 
  Utensils, 
  Smartphone, 
  BookOpen, 
  Sparkles, 
  MapPin, 
  Store, 
  Check, 
  Lock, 
  HeartPulse, 
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import { RewardItem, RewardCategory } from '../../types';
import { useTranslation } from '../../contexts/LanguageContext';

interface RewardCardProps {
  reward: RewardItem;
  userPoints: number;
  onRedeem: (reward: RewardItem) => void;
}

export const RewardCard: React.FC<RewardCardProps> = ({
  reward,
  userPoints,
  onRedeem,
}) => {
  const { locale, isRTL, t } = useTranslation();
  const canAfford = userPoints >= reward.pointsCost;
  const pointsNeeded = reward.pointsCost - userPoints;

  const renderCategoryIcon = (category: RewardItem['category']) => {
    const cls = 'w-4 h-4';
    switch (category) {
      case 'supermarket':
        return <ShoppingBag className={cls} />;
      case 'food':
        return <Utensils className={cls} />;
      case 'mobile_load':
        return <Smartphone className={cls} />;
      case 'stationery':
        return <BookOpen className={cls} />;
      case 'pharmacy':
        return <HeartPulse className={cls} />;
      case 'general':
      default:
        return <Store className={cls} />;
    }
  };

  const getCategoryColor = (category: RewardItem['category']) => {
    switch (category) {
      case 'supermarket':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'food':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'mobile_load':
        return 'bg-sky-50 text-sky-800 border-sky-200';
      case 'stationery':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      case 'pharmacy':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      case 'general':
      default:
        return 'bg-stone-100 text-stone-800 border-stone-200';
    }
  };

  const getCategoryLabel = (category: RewardItem['category']) => {
    switch (category) {
      case 'supermarket':
        return t('rewards.catSupermarket');
      case 'food':
        return t('rewards.catFood');
      case 'mobile_load':
        return t('rewards.catMobileLoad');
      case 'stationery':
        return t('rewards.catStationery');
      case 'pharmacy':
        return t('rewards.catPharmacy');
      case 'general':
      default:
        return t('rewards.catGeneral');
    }
  };

  const title = locale === 'ur' && reward.titleUrdu ? reward.titleUrdu : reward.title;
  const businessName = locale === 'ur' && reward.businessNameUrdu ? reward.businessNameUrdu : reward.businessName;
  const businessAddress = locale === 'ur' && reward.businessAddressUrdu ? reward.businessAddressUrdu : reward.businessAddress;
  const discountValue = locale === 'ur' && reward.discountValueUrdu ? reward.discountValueUrdu : reward.discountValue;
  const description = locale === 'ur' && reward.descriptionUrdu ? reward.descriptionUrdu : reward.description;
  const badgeTag = locale === 'ur' && reward.badgeTagUrdu ? reward.badgeTagUrdu : reward.badgeTag;

  return (
    <div
      className={`rounded-3xl border transition-all duration-200 flex flex-col justify-between overflow-hidden relative ${
        canAfford
          ? 'bg-white border-stone-200/90 shadow-2xs hover:shadow-md hover:border-emerald-600/40 group'
          : 'bg-stone-50/90 border-stone-200/70 opacity-80'
      }`}
    >
      {/* Top Banner with Image / Vendor Badge */}
      <div className="p-4 pb-2">
        <div className="flex items-start justify-between gap-2.5 mb-2">
          {/* Vendor Logo & Category */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-12 h-12 rounded-2xl overflow-hidden bg-stone-100 border border-stone-200 shadow-2xs shrink-0 relative">
              {reward.logoUrl ? (
                <img
                  src={reward.logoUrl}
                  alt={businessName}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-emerald-100 text-[#0F5132]">
                  {renderCategoryIcon(reward.category)}
                </div>
              )}
            </div>

            <div className="min-w-0">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border ${getCategoryColor(reward.category)}`}>
                {renderCategoryIcon(reward.category)}
                <span>{getCategoryLabel(reward.category)}</span>
              </span>
              <h4 className="text-xs font-bold text-stone-900 truncate mt-0.5">
                {businessName}
              </h4>
            </div>
          </div>

          {/* Points Cost Pill */}
          <div className={`px-2.5 py-1 rounded-xl text-xs font-black shrink-0 flex items-center gap-1 shadow-2xs ${
            canAfford
              ? 'bg-amber-100 text-amber-950 border border-amber-300'
              : 'bg-stone-200 text-stone-600 border border-stone-300'
          }`}>
            <Sparkles className="w-3.5 h-3.5 fill-amber-500 text-amber-600 shrink-0" />
            <span>{reward.pointsCost}</span>
            <span className="text-[10px] font-semibold opacity-80">{locale === 'ur' ? 'پوائنٹس' : 'pts'}</span>
          </div>
        </div>

        {/* Reward Title & Value */}
        <div className="mt-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-black px-2 py-0.5 rounded-md bg-[#0F5132] text-white">
              {discountValue}
            </span>
            {badgeTag && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                {badgeTag}
              </span>
            )}
          </div>
          <h3 className="text-sm font-bold text-stone-900 mt-1.5 leading-snug">
            {title}
          </h3>
          <p className="text-xs text-stone-500 mt-1 line-clamp-2 leading-relaxed">
            {description}
          </p>
        </div>
      </div>

      {/* Footer Details & Action Button */}
      <div className="p-4 pt-2 border-t border-stone-100 bg-stone-50/50 mt-2">
        <div className="flex items-center gap-1 text-[11px] text-stone-500 truncate mb-3">
          <MapPin className="w-3 h-3 text-[#0F5132] shrink-0" />
          <span className="truncate">{businessAddress}</span>
        </div>

        {canAfford ? (
          <button
            type="button"
            onClick={() => onRedeem(reward)}
            className="w-full py-2.5 px-3 rounded-2xl bg-[#0F5132] hover:bg-[#0A3B24] text-white text-xs font-bold transition-all shadow-xs active:scale-98 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>{t('rewards.redeemBtn')}</span>
            <ArrowRight className="w-3.5 h-3.5 rtl-flip" />
          </button>
        ) : (
          <div className="w-full py-2 px-3 rounded-2xl bg-stone-200/80 text-stone-500 text-xs font-semibold flex items-center justify-center gap-1.5 text-center">
            <Lock className="w-3.5 h-3.5 text-stone-400 shrink-0" />
            <span>
              {t('rewards.needMorePoints', { count: pointsNeeded })}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
