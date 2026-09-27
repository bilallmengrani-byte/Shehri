import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Sparkles, 
  Gift, 
  Ticket, 
  ShoppingBag, 
  Utensils, 
  Smartphone, 
  BookOpen, 
  Store, 
  HeartPulse, 
  Info,
  Layers
} from 'lucide-react';
import { RewardItem, RedemptionRecord, RewardCategory } from '../../types';
import { MOCK_REWARDS } from '../../constants/rewardsData';
import { redemptionsService } from '../../services/redemptionsService';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../contexts/LanguageContext';
import { RewardCard } from './RewardCard';
import { RedeemConfirmationModal } from './RedeemConfirmationModal';
import { RedemptionSuccessModal } from './RedemptionSuccessModal';
import { MyVouchersScreen } from './MyVouchersScreen';

interface RewardsScreenProps {
  onBack: () => void;
}

export const RewardsScreen: React.FC<RewardsScreenProps> = ({ onBack }) => {
  const { user, userProfile, deductCleanPoints } = useAuth();
  const { locale, isRTL, t } = useTranslation();

  // Active view tab: 'catalog' | 'vouchers'
  const [activeSubTab, setActiveSubTab] = useState<'catalog' | 'vouchers'>('catalog');
  
  // Selected category filter
  const [selectedCategory, setSelectedCategory] = useState<RewardCategory>('all');

  // Redemptions list (vouchers)
  const [vouchers, setVouchers] = useState<RedemptionRecord[]>([]);

  // Modal states
  const [rewardToRedeem, setRewardToRedeem] = useState<RewardItem | null>(null);
  const [latestRedemption, setLatestRedemption] = useState<RedemptionRecord | null>(null);

  const currentPoints = userProfile?.cleanPoints ?? 0;
  const userId = user?.uid || '';

  const loadUserVouchers = async () => {
    const list = await redemptionsService.getUserRedemptions(userId);
    setVouchers(list);
  };

  useEffect(() => {
    loadUserVouchers();
  }, [userId]);

  // Handle redemption confirmation
  const handleConfirmRedemption = async (reward: RewardItem) => {
    const res = await redemptionsService.redeemReward(userId, reward, currentPoints);
    if (res.success && res.redemption) {
      // Deduct CleanPoints in AuthContext optimistically
      await deductCleanPoints(reward.pointsCost);
      setRewardToRedeem(null);
      setLatestRedemption(res.redemption);
      loadUserVouchers();
    } else {
      throw new Error(res.error || 'Redemption failed');
    }
  };

  // Filter rewards by category
  const filteredRewards = MOCK_REWARDS.filter((reward) => {
    if (selectedCategory === 'all') return true;
    return reward.category === selectedCategory;
  });

  const categories: { id: RewardCategory; labelKey: string; icon: React.ReactNode }[] = [
    { id: 'all', labelKey: 'rewards.allCategories', icon: <Layers className="w-3.5 h-3.5" /> },
    { id: 'supermarket', labelKey: 'rewards.catSupermarket', icon: <ShoppingBag className="w-3.5 h-3.5" /> },
    { id: 'food', labelKey: 'rewards.catFood', icon: <Utensils className="w-3.5 h-3.5" /> },
    { id: 'mobile_load', labelKey: 'rewards.catMobileLoad', icon: <Smartphone className="w-3.5 h-3.5" /> },
    { id: 'stationery', labelKey: 'rewards.catStationery', icon: <BookOpen className="w-3.5 h-3.5" /> },
    { id: 'pharmacy', labelKey: 'rewards.catPharmacy', icon: <HeartPulse className="w-3.5 h-3.5" /> },
    { id: 'general', labelKey: 'rewards.catGeneral', icon: <Store className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="flex-1 flex flex-col bg-stone-50 pb-10 animate-fade-in">
      {/* 1. Top Sticky Navigation Bar */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md px-4 py-3 border-b border-stone-200/80 flex items-center justify-between shadow-2xs">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-stone-700 hover:text-stone-900 active:scale-95 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-[#0F5132] rtl-flip" />
          <span>{t('common.back')}</span>
        </button>

        <h2 className={`text-sm font-bold text-stone-900 ${locale === 'ur' ? 'font-urdu' : ''}`}>
          {t('rewards.title')}
        </h2>

        <div className="w-8 flex justify-end">
          <span className="w-7 h-7 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center border border-amber-300 shadow-2xs">
            <Gift className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>

      <div className="p-4 flex flex-col gap-4">
        {/* 2. Available CleanPoints Balance Banner */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-amber-500 via-amber-600 to-[#D97706] text-white shadow-lg relative overflow-hidden">
          <div className="absolute top-0 end-0 -me-8 -mt-8 w-32 h-32 rounded-full bg-white/10 pointer-events-none" />
          <div className="absolute bottom-0 end-12 -mb-8 w-24 h-24 rounded-full bg-black/10 pointer-events-none" />

          <div className="relative z-10 flex items-center justify-between">
            <div>
              <span className="text-xs uppercase font-bold tracking-wider text-amber-100 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 fill-amber-300 text-amber-200" />
                <span>{t('rewards.availablePoints')}</span>
              </span>
              <div className="mt-1 text-3xl font-extrabold tracking-tight flex items-baseline gap-1.5">
                <span>{currentPoints.toLocaleString()}</span>
                <span className="text-base font-semibold text-amber-100">
                  {locale === 'ur' ? 'پوائنٹس' : 'pts'}
                </span>
              </div>
              <p className="text-[11px] text-amber-100/90 mt-0.5 max-w-xs leading-relaxed">
                {t('rewards.subtitle')}
              </p>
            </div>

            {/* Quick My Vouchers Pill */}
            <button
              onClick={() => setActiveSubTab('vouchers')}
              className="px-3.5 py-2 rounded-2xl bg-white/20 hover:bg-white/30 backdrop-blur-xs border border-white/30 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95"
            >
              <Ticket className="w-4 h-4" />
              <span>{vouchers.length}</span>
            </button>
          </div>
        </div>

        {/* 3. Sub-Tab Switcher: Catalog vs My Vouchers */}
        <div className="flex bg-stone-200/80 p-1 rounded-2xl border border-stone-200">
          <button
            type="button"
            onClick={() => setActiveSubTab('catalog')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeSubTab === 'catalog'
                ? 'bg-white text-[#0F5132] shadow-xs border border-emerald-100'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Gift className="w-4 h-4" />
            <span>{t('rewards.catalog')}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('vouchers')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeSubTab === 'vouchers'
                ? 'bg-white text-[#0F5132] shadow-xs border border-emerald-100'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Ticket className="w-4 h-4" />
            <span>{t('rewards.myVouchers')}</span>
            {vouchers.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-stone-950 font-black text-[10px]">
                {vouchers.length}
              </span>
            )}
          </button>
        </div>

        {/* 4. Sub-Tab Content: Catalog */}
        {activeSubTab === 'catalog' && (
          <div className="space-y-4">
            {/* Category Filter Horizontal Scroll */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 cursor-pointer shrink-0 border ${
                    selectedCategory === cat.id
                      ? 'bg-[#0F5132] text-white border-[#0F5132] shadow-2xs'
                      : 'bg-white text-stone-700 border-stone-200/90 hover:bg-stone-50'
                  }`}
                >
                  {cat.icon}
                  <span>{t(cat.labelKey)}</span>
                </button>
              ))}
            </div>

            {/* Rewards Catalog Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {filteredRewards.map((reward) => (
                <RewardCard
                  key={reward.id}
                  reward={reward}
                  userPoints={currentPoints}
                  onRedeem={(r) => setRewardToRedeem(r)}
                />
              ))}
            </div>

            {/* Sponsor / Partnership Note */}
            <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 text-xs text-emerald-950 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-[#0F5132] shrink-0 mt-0.5" />
              <p className="leading-relaxed text-[11px]">
                {t('rewards.sponsorDisclaimer')}
              </p>
            </div>
          </div>
        )}

        {/* 5. Sub-Tab Content: My Vouchers */}
        {activeSubTab === 'vouchers' && (
          <MyVouchersScreen
            vouchers={vouchers}
            onBrowseRewards={() => setActiveSubTab('catalog')}
            onRefresh={loadUserVouchers}
          />
        )}
      </div>

      {/* 6. Redeem Confirmation Modal */}
      {rewardToRedeem && (
        <RedeemConfirmationModal
          reward={rewardToRedeem}
          userPoints={currentPoints}
          onConfirm={handleConfirmRedemption}
          onClose={() => setRewardToRedeem(null)}
        />
      )}

      {/* 7. Redemption Success Modal */}
      {latestRedemption && (
        <RedemptionSuccessModal
          redemption={latestRedemption}
          onViewWallet={() => {
            setLatestRedemption(null);
            setActiveSubTab('vouchers');
          }}
          onClose={() => setLatestRedemption(null)}
        />
      )}
    </div>
  );
};
