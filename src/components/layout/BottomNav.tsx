import React from 'react';
import { Map, Target, Plus, Trophy, User } from 'lucide-react';
import { useTranslation } from '../../contexts/LanguageContext';
import { TabType } from '../../types';

interface BottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  const { t } = useTranslation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-t border-stone-200/90 dark:border-stone-800 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] w-full max-w-md sm:max-w-[430px] mx-auto">
      <div className="flex items-center justify-around px-2 py-1.5 safe-bottom">
        {/* Tab 1: Home (Map) */}
        <button
          onClick={() => onTabChange('home')}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 px-1 rounded-2xl transition-all duration-150 cursor-pointer ${
            activeTab === 'home'
              ? 'text-[#0F5132] dark:text-emerald-400 font-semibold'
              : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
          }`}
        >
          <div
            className={`p-1 rounded-xl transition-colors ${
              activeTab === 'home' ? 'bg-emerald-100 dark:bg-emerald-950/70 text-[#0F5132] dark:text-emerald-400' : ''
            }`}
          >
            <Map className="w-5 h-5" strokeWidth={activeTab === 'home' ? 2.4 : 1.8} />
          </div>
          <span className="text-[11px] leading-tight mt-0.5">{t('nav.home')}</span>
        </button>

        {/* Tab 2: Missions */}
        <button
          onClick={() => onTabChange('missions')}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 px-1 rounded-2xl transition-all duration-150 cursor-pointer ${
            activeTab === 'missions'
              ? 'text-[#0F5132] dark:text-emerald-400 font-semibold'
              : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
          }`}
        >
          <div
            className={`p-1 rounded-xl transition-colors ${
              activeTab === 'missions' ? 'bg-emerald-100 dark:bg-emerald-950/70 text-[#0F5132] dark:text-emerald-400' : ''
            }`}
          >
            <Target className="w-5 h-5" strokeWidth={activeTab === 'missions' ? 2.4 : 1.8} />
          </div>
          <span className="text-[11px] leading-tight mt-0.5">{t('nav.missions')}</span>
        </button>

        {/* Tab 3: Center FAB - Report */}
        <div className="relative -top-4 flex flex-col items-center">
          <button
            onClick={() => onTabChange('report')}
            aria-label={t('nav.report')}
            className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg shadow-emerald-950/25 transition-all duration-200 cursor-pointer active:scale-95 ring-4 ring-white dark:ring-stone-900 ${
              activeTab === 'report'
                ? 'bg-amber-500 hover:bg-amber-600 text-stone-950 ring-amber-200 dark:ring-amber-900/60'
                : 'bg-[#0F5132] dark:bg-emerald-600 hover:bg-[#0A3B24] dark:hover:bg-emerald-500'
            }`}
          >
            <Plus className="w-7 h-7" strokeWidth={2.6} />
          </button>
          <span
            className={`text-[11px] font-semibold tracking-tight mt-1 leading-none ${
              activeTab === 'report' ? 'text-amber-700 dark:text-amber-400' : 'text-stone-600 dark:text-stone-400'
            }`}
          >
            {t('nav.report')}
          </span>
        </div>

        {/* Tab 4: Leaderboard */}
        <button
          onClick={() => onTabChange('leaderboard')}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 px-1 rounded-2xl transition-all duration-150 cursor-pointer ${
            activeTab === 'leaderboard'
              ? 'text-[#0F5132] dark:text-emerald-400 font-semibold'
              : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
          }`}
        >
          <div
            className={`p-1 rounded-xl transition-colors ${
              activeTab === 'leaderboard' ? 'bg-emerald-100 dark:bg-emerald-950/70 text-[#0F5132] dark:text-emerald-400' : ''
            }`}
          >
            <Trophy className="w-5 h-5" strokeWidth={activeTab === 'leaderboard' ? 2.4 : 1.8} />
          </div>
          <span className="text-[11px] leading-tight mt-0.5">{t('nav.leaderboard')}</span>
        </button>

        {/* Tab 5: Profile */}
        <button
          onClick={() => onTabChange('profile')}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 px-1 rounded-2xl transition-all duration-150 cursor-pointer ${
            activeTab === 'profile'
              ? 'text-[#0F5132] dark:text-emerald-400 font-semibold'
              : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
          }`}
        >
          <div
            className={`p-1 rounded-xl transition-colors ${
              activeTab === 'profile' ? 'bg-emerald-100 dark:bg-emerald-950/70 text-[#0F5132] dark:text-emerald-400' : ''
            }`}
          >
            <User className="w-5 h-5" strokeWidth={activeTab === 'profile' ? 2.4 : 1.8} />
          </div>
          <span className="text-[11px] leading-tight mt-0.5">{t('nav.profile')}</span>
        </button>
      </div>
    </nav>
  );
};
