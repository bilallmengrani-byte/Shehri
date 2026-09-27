import React, { useState, useEffect } from 'react';
import { 
  User, 
  MapPin, 
  Sparkles, 
  Award, 
  ShieldCheck, 
  CheckCircle2, 
  Settings, 
  ChevronRight, 
  Flame, 
  Scale, 
  Crown, 
  Sliders, 
  X, 
  Lock, 
  Gift, 
  Ticket, 
  ArrowRight,
  ShoppingBag,
  Utensils,
  Smartphone,
  BookOpen,
  HeartPulse,
  Store,
  Layers,
  Info
} from 'lucide-react';
import { Card } from '../ui/Card';
import { gamificationStore } from '../../services/userStore';
import { redemptionsService } from '../../services/redemptionsService';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../contexts/LanguageContext';
import { UserProfile, BadgeItem, RewardItem, RedemptionRecord, RewardCategory } from '../../types';
import { CURRENT_USER } from '../../constants/mockData';
import { MOCK_REWARDS } from '../../constants/rewardsData';
import { SettingsScreen } from '../settings/SettingsScreen';
import { RewardCard } from '../rewards/RewardCard';
import { RedeemConfirmationModal } from '../rewards/RedeemConfirmationModal';
import { RedemptionSuccessModal } from '../rewards/RedemptionSuccessModal';
import { MyVouchersScreen } from '../rewards/MyVouchersScreen';

export const ProfileScreen: React.FC = () => {
  const { user: authUser, userProfile: authProfile, deductCleanPoints } = useAuth();
  const { locale, isRTL, t } = useTranslation();

  const activeProfile = authProfile || gamificationStore.getUser();
  const [user, setUser] = useState<UserProfile>(activeProfile);
  const [profileTab, setProfileTab] = useState<'rewards' | 'impact'>('rewards');
  const [rewardsSubTab, setRewardsSubTab] = useState<'catalog' | 'vouchers'>('catalog');
  const [selectedCategory, setSelectedCategory] = useState<RewardCategory>('all');
  
  // Badges & Settings modals
  const [selectedBadge, setSelectedBadge] = useState<BadgeItem | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  // Rewards redemption states
  const [vouchers, setVouchers] = useState<RedemptionRecord[]>([]);
  const [rewardToRedeem, setRewardToRedeem] = useState<RewardItem | null>(null);
  const [latestRedemption, setLatestRedemption] = useState<RedemptionRecord | null>(null);

  const userId = authUser?.uid || user.uid || user.id;
  const currentPoints = user.cleanPoints ?? 0;
  const userBadges: BadgeItem[] = user.badges || [];

  useEffect(() => {
    if (authProfile) {
      setUser(authProfile);
    }
  }, [authProfile]);

  useEffect(() => {
    const unsub = gamificationStore.subscribe(() => {
      const stored = gamificationStore.getUser();
      if (stored && stored.id) {
        setUser(stored);
      }
    });
    return () => unsub();
  }, []);

  const loadUserVouchers = async () => {
    const list = await redemptionsService.getUserRedemptions(userId);
    setVouchers(list);
  };

  useEffect(() => {
    loadUserVouchers();
  }, [userId]);

  // If user opened Settings, render dedicated SettingsScreen
  if (showSettings) {
    return <SettingsScreen onBack={() => setShowSettings(false)} />;
  }

  // Handle redemption confirmation & Firestore points deduction
  const handleConfirmRedemption = async (reward: RewardItem) => {
    const res = await redemptionsService.redeemReward(userId, reward, currentPoints);
    if (res.success && res.redemption) {
      // Deduct CleanPoints in AuthContext and state
      await deductCleanPoints(reward.pointsCost);
      setUser((prev) => ({ ...prev, cleanPoints: Math.max(0, prev.cleanPoints - reward.pointsCost) }));
      setRewardToRedeem(null);
      setLatestRedemption(res.redemption);
      loadUserVouchers();
    } else {
      throw new Error(res.error || 'Redemption failed');
    }
  };

  const renderBadgeIcon = (iconName: BadgeItem['icon'], isUnlocked: boolean) => {
    const cls = `w-6 h-6 ${isUnlocked ? 'text-amber-500' : 'text-stone-400'}`;
    switch (iconName) {
      case 'Award':
        return <Award className={cls} />;
      case 'ShieldCheck':
        return <ShieldCheck className={cls} />;
      case 'Crown':
        return <Crown className={cls} />;
      case 'Flame':
        return <Flame className={cls} />;
      case 'Scale':
        return <Scale className={cls} />;
      default:
        return <Sparkles className={cls} />;
    }
  };

  const categories: { id: RewardCategory; labelKey: string; icon: React.ReactNode }[] = [
    { id: 'all', labelKey: 'rewards.allCategories', icon: <Layers className="w-3.5 h-3.5" /> },
    { id: 'supermarket', labelKey: 'rewards.catSupermarket', icon: <ShoppingBag className="w-3.5 h-3.5" /> },
    { id: 'food', labelKey: 'rewards.catFood', icon: <Utensils className="w-3.5 h-3.5" /> },
    { id: 'mobile_load', labelKey: 'rewards.catMobileLoad', icon: <Smartphone className="w-3.5 h-3.5" /> },
    { id: 'stationery', labelKey: 'rewards.catStationery', icon: <BookOpen className="w-3.5 h-3.5" /> },
    { id: 'pharmacy', labelKey: 'rewards.catPharmacy', icon: <HeartPulse className="w-3.5 h-3.5" /> },
    { id: 'general', labelKey: 'rewards.catGeneral', icon: <Store className="w-3.5 h-3.5" /> },
  ];

  const filteredRewards = MOCK_REWARDS.filter((reward) => {
    if (selectedCategory === 'all') return true;
    return reward.category === selectedCategory;
  });

  const currentPhotoURL = user.photoURL || authUser?.photoURL;

  return (
    <div className="p-4 flex flex-col gap-4 animate-fade-in pb-12">
      {/* 1. Profile Header Card */}
      <Card variant="default" className="border-stone-200 shadow-2xs">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3.5 min-w-0">
            {/* Avatar Photo / Initials */}
            <div className="w-16 h-16 rounded-3xl overflow-hidden bg-gradient-to-br from-[#0F5132] to-[#0A3B24] text-white flex items-center justify-center font-bold text-xl shadow-md border-2 border-white ring-4 ring-emerald-900/10 shrink-0">
              {currentPhotoURL ? (
                <img
                  src={currentPhotoURL}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{user.name.slice(0, 2).toUpperCase()}</span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-stone-900 truncate">
                  {user.name}
                </h2>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-stone-100 text-stone-700 border border-stone-200 shrink-0">
                  {user.citizenNumber}
                </span>
              </div>
              <p className="text-xs text-stone-500 flex items-center gap-1 mt-0.5 truncate">
                <MapPin className="w-3.5 h-3.5 text-[#0F5132] shrink-0" />
                <span className="truncate">{user.neighborhood || t('common.city')}</span>
              </p>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-[#0F5132] text-[11px] font-bold border border-emerald-300">
                  {t('common.verified') || 'Verified Citizen'}
                </span>
                <span className="text-[11px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full font-bold border border-amber-200">
                  #{user.rank} • {t('common.city')}
                </span>
              </div>
            </div>
          </div>

          {/* Direct Settings Entry Button */}
          <button
            type="button"
            onClick={() => setShowSettings(true)}
            className="p-2.5 rounded-2xl bg-stone-100 hover:bg-stone-200/80 text-stone-700 transition active:scale-95 cursor-pointer border border-stone-200 shadow-2xs shrink-0"
            title={t('settings.title')}
          >
            <Settings className="w-5 h-5 text-stone-700" />
          </button>
        </div>
      </Card>

      {/* 2. Primary Navigation Switcher: [ 🎁 CleanPoints Rewards ] vs [ 🏆 Civic Impact & Badges ] */}
      <div className="flex bg-stone-200/80 p-1.5 rounded-2xl border border-stone-200 gap-1.5 shadow-2xs">
        <button
          type="button"
          onClick={() => setProfileTab('rewards')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
            profileTab === 'rewards'
              ? 'bg-[#0F5132] text-white shadow-xs'
              : 'bg-white/60 text-stone-700 hover:bg-white hover:text-stone-900'
          }`}
        >
          <Gift className={`w-4 h-4 ${profileTab === 'rewards' ? 'fill-amber-300 text-amber-300' : 'text-stone-600'}`} />
          <span className={locale === 'ur' ? 'font-urdu' : ''}>{t('rewards.title')}</span>
          {vouchers.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-stone-950 font-black text-[10px]">
              {vouchers.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setProfileTab('impact')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
            profileTab === 'impact'
              ? 'bg-[#0F5132] text-white shadow-xs'
              : 'bg-white/60 text-stone-700 hover:bg-white hover:text-stone-900'
          }`}
        >
          <Award className={`w-4 h-4 ${profileTab === 'impact' ? 'fill-amber-300 text-amber-300' : 'text-stone-600'}`} />
          <span className={locale === 'ur' ? 'font-urdu' : ''}>{t('profile.badges')} & {t('leaderboard.tabImpact')}</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: REWARDS CATALOG & VOUCHERS WALLET */}
      {/* ========================================================================= */}
      {profileTab === 'rewards' && (
        <div className="space-y-4 animate-fade-in">
          {/* Prominent CleanPoints Balance Card */}
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

              {/* Toggle to My Vouchers Wallet */}
              <button
                type="button"
                onClick={() => setRewardsSubTab(rewardsSubTab === 'catalog' ? 'vouchers' : 'catalog')}
                className="px-3.5 py-2 rounded-2xl bg-white text-stone-900 font-extrabold text-xs shadow-md hover:bg-amber-50 active:scale-95 transition flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Ticket className="w-4 h-4 text-[#0F5132]" />
                <span>{rewardsSubTab === 'catalog' ? `${t('rewards.myVouchers')} (${vouchers.length})` : t('rewards.catalog')}</span>
              </button>
            </div>
          </div>

          {/* Sub-Tab Filter Bar (Catalog vs My Vouchers) */}
          <div className="flex bg-stone-100 p-1 rounded-2xl border border-stone-200">
            <button
              type="button"
              onClick={() => setRewardsSubTab('catalog')}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                rewardsSubTab === 'catalog'
                  ? 'bg-white text-[#0F5132] shadow-xs border border-emerald-200'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Gift className="w-3.5 h-3.5" />
              <span>{t('rewards.catalog')}</span>
            </button>

            <button
              type="button"
              onClick={() => setRewardsSubTab('vouchers')}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                rewardsSubTab === 'vouchers'
                  ? 'bg-white text-[#0F5132] shadow-xs border border-emerald-200'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Ticket className="w-3.5 h-3.5" />
              <span>{t('rewards.myVouchers')}</span>
              {vouchers.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-stone-950 font-black text-[10px]">
                  {vouchers.length}
                </span>
              )}
            </button>
          </div>

          {/* Catalog Grid View */}
          {rewardsSubTab === 'catalog' && (
            <div className="space-y-3.5">
              {/* Category Horizontal Filter Chips */}
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

              {/* Rewards Cards Grid (Rs. 100 off, food, mobile load, discounts) */}
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

              {/* Vendor & Sponsor Note */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 text-xs text-emerald-950 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-[#0F5132] shrink-0 mt-0.5" />
                <p className="leading-relaxed text-[11px]">
                  {t('rewards.sponsorDisclaimer')}
                </p>
              </div>
            </div>
          )}

          {/* My Vouchers Screen */}
          {rewardsSubTab === 'vouchers' && (
            <MyVouchersScreen
              vouchers={vouchers}
              onBrowseRewards={() => setRewardsSubTab('catalog')}
              onRefresh={loadUserVouchers}
            />
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: CIVIC IMPACT STATS & BADGES */}
      {/* ========================================================================= */}
      {profileTab === 'impact' && (
        <div className="space-y-4 animate-fade-in">
          {/* Civic Impact Summary Grid */}
          <div className="grid grid-cols-2 gap-3">
            <Card variant="default" className="border-stone-200/90 shadow-2xs">
              <div className="flex items-center gap-2 text-stone-500 mb-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-medium">{t('profile.cleanupsDone')}</span>
              </div>
              <div className="text-2xl font-bold text-stone-900">
                {user.cleanupsCompleted ?? user.missionsCleaned ?? 0}
              </div>
              <p className="text-[11px] text-stone-400 mt-0.5">
                {t('common.sahiwalPunjab')}
              </p>
            </Card>

            <Card variant="default" className="border-stone-200/90 shadow-2xs">
              <div className="flex items-center gap-2 text-stone-500 mb-1">
                <Award className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-medium">{t('profile.reportsSubmitted')}</span>
              </div>
              <div className="text-2xl font-bold text-stone-900">
                {user.reportsFiled ?? user.missionsReported ?? 0}
              </div>
              <p className="text-[11px] text-stone-400 mt-0.5">
                {t('home.title')}
              </p>
            </Card>
          </div>

          {/* Badges & Civic Achievements */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                {t('profile.badges')}
              </h3>
              <span className="text-xs text-stone-500 font-semibold">
                {userBadges.filter((b) => b.unlocked).length} / {userBadges.length} Unlocked
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {userBadges.map((badge) => {
                const isUnlocked = badge.unlocked;
                return (
                  <div
                    key={badge.id}
                    onClick={() => setSelectedBadge(badge)}
                    className={`p-3 rounded-2xl border text-center flex flex-col items-center justify-between transition-all cursor-pointer ${
                      isUnlocked
                        ? 'bg-white border-amber-200/90 shadow-2xs hover:shadow-xs'
                        : 'bg-stone-100/80 border-stone-200 opacity-60 hover:opacity-80'
                    }`}
                  >
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-1.5 transition-transform ${
                        isUnlocked
                          ? 'bg-amber-100/80 border border-amber-300/60 shadow-inner'
                          : 'bg-stone-200/80 border border-stone-300'
                      }`}
                    >
                      {renderBadgeIcon(badge.icon, isUnlocked)}
                    </div>
                    <div className="text-xs font-bold text-stone-800 line-clamp-1 leading-tight">
                      {badge.name}
                    </div>
                    <div className="text-[10px] text-stone-500 mt-0.5">
                      {isUnlocked ? t('profile.badgeUnlocked') : t('profile.badgeLocked')}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 3. Settings Screen Entry Card (Always visible at bottom) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold text-stone-700 uppercase tracking-wider">
            {t('profile.settings')}
          </h3>
        </div>

        <Card 
          variant="default" 
          padded="none" 
          onClick={() => setShowSettings(true)}
          className="p-4 border-stone-200/90 shadow-2xs hover:border-emerald-600/50 hover:bg-emerald-50/20 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-[#0F5132] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Sliders className="w-5 h-5 text-[#0F5132]" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-stone-800 block">
                  {t('settings.title')}
                </span>
                <span className="text-[11px] text-stone-400 block truncate">
                  {locale === 'ur' ? 'اردو' : 'English'} • {t('settings.notificationsTitle')} • {t('settings.account')}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <span className="px-2.5 py-1 rounded-xl bg-stone-100 text-stone-700 font-bold text-[11px] border border-stone-200">
                {locale === 'en' ? 'EN' : 'اردو'}
              </span>
              <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-[#0F5132] transition rtl-flip" />
            </div>
          </div>
        </Card>
      </div>

      {/* 4. Redeem Confirmation Modal */}
      {rewardToRedeem && (
        <RedeemConfirmationModal
          reward={rewardToRedeem}
          userPoints={currentPoints}
          onConfirm={handleConfirmRedemption}
          onClose={() => setRewardToRedeem(null)}
        />
      )}

      {/* 5. Redemption Success Modal */}
      {latestRedemption && (
        <RedemptionSuccessModal
          redemption={latestRedemption}
          onViewWallet={() => {
            setLatestRedemption(null);
            setProfileTab('rewards');
            setRewardsSubTab('vouchers');
          }}
          onClose={() => setLatestRedemption(null)}
        />
      )}

      {/* 6. Badge Details Modal Dialog */}
      {selectedBadge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-xs bg-white rounded-3xl p-5 shadow-2xl border border-stone-200 text-center relative space-y-3">
            <button
              onClick={() => setSelectedBadge(null)}
              className="absolute top-3 end-3 p-1.5 text-stone-400 hover:text-stone-700 rounded-xl hover:bg-stone-100 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className={`w-16 h-16 rounded-3xl mx-auto flex items-center justify-center ${
              selectedBadge.unlocked
                ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-md ring-4 ring-amber-200/60'
                : 'bg-stone-200 text-stone-400'
            }`}>
              {renderBadgeIcon(selectedBadge.icon, selectedBadge.unlocked)}
            </div>

            <div>
              <h3 className="text-base font-bold text-stone-900">{selectedBadge.name}</h3>
              <p className="text-xs text-stone-600 mt-1 leading-relaxed">{selectedBadge.description}</p>
            </div>

            <div className="pt-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                selectedBadge.unlocked
                  ? 'bg-emerald-100 text-[#0F5132] border border-emerald-300'
                  : 'bg-stone-100 text-stone-500 border border-stone-200'
              }`}>
                {selectedBadge.unlocked ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{t('profile.badgeUnlocked')}</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>{t('profile.badgeLocked')}</span>
                  </>
                )}
              </span>
            </div>

            <button
              onClick={() => setSelectedBadge(null)}
              className="w-full mt-2 py-2 rounded-xl bg-[#0F5132] text-white text-xs font-bold transition active:scale-95 cursor-pointer"
            >
              {t('common.close')}
            </button>
          </div>
        </div>
      )}

      {/* Footer Branding in Active Language */}
      <div className="text-center pt-2 pb-4">
        <p className="text-xs font-urdu text-stone-500 font-medium">
          {locale === 'ur'
            ? 'شہری • ساہیوال صفائی مہم • پنجاب، پاکستان'
            : 'Shehri • Clean Sahiwal Civic Movement • Punjab, Pakistan'}
        </p>
      </div>
    </div>
  );
};
