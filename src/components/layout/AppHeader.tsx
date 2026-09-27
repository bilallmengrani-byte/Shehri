import React, { useState, useEffect } from 'react';
import { Sparkles, LogIn } from 'lucide-react';
import { userService } from '../../services/user';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../contexts/LanguageContext';
import { ShehriLogo } from '../common/ShehriLogo';
import { TabType, UserProfile } from '../../types';

interface AppHeaderProps {
  activeTab: TabType;
  onNavigate?: (tab: TabType) => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ activeTab, onNavigate }) => {
  const { user: authUser, userProfile: authProfile } = useAuth();
  const { locale, isRTL, t } = useTranslation();

  const currentPoints = authProfile?.cleanPoints ?? 0;
  const currentPhotoURL = authProfile?.photoURL || authUser?.photoURL;
  const displayName = authProfile?.name || authUser?.displayName || 'Citizen';

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-b border-stone-200/80 dark:border-stone-800 px-4 py-2.5 flex items-center justify-between gap-3 transition-colors">
      {/* Brand Lockup */}
      <div 
        onClick={() => onNavigate?.('home')}
        className="flex items-center cursor-pointer hover:opacity-90 transition min-w-0 shrink-0"
      >
        <ShehriLogo
          layout="horizontal"
          size="md"
          theme="dark"
          showCityBadge={true}
        />
      </div>

      {/* Right Action Bar: Points Pill & User Profile */}
      <div className="flex items-center gap-2 shrink-0">
        {authUser ? (
          <>
            {/* CleanPoints Action Pill */}
            <button
              onClick={() => onNavigate?.('profile')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50/90 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-200/90 dark:border-amber-700/60 text-stone-900 dark:text-amber-200 text-xs font-bold active:scale-95 transition cursor-pointer shadow-2xs"
              title={t('profile.cleanPoints')}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 fill-amber-500 dark:fill-amber-400 shrink-0" />
              <span className="tabular-nums font-black">{currentPoints.toLocaleString()}</span>
              <span className="text-[10px] text-amber-800 dark:text-amber-300 font-bold opacity-90">
                {locale === 'ur' ? 'پوائنٹس' : 'pts'}
              </span>
            </button>

            {/* Profile Avatar / Initials */}
            <button
              onClick={() => onNavigate?.('profile')}
              aria-label={t('nav.profile')}
              className="w-8 h-8 rounded-full overflow-hidden bg-[#0F5132] dark:bg-emerald-600 text-white font-extrabold text-xs flex items-center justify-center border border-emerald-800 dark:border-emerald-500 ring-2 ring-emerald-900/10 dark:ring-emerald-400/20 hover:ring-emerald-600 active:scale-95 transition cursor-pointer shrink-0 shadow-2xs"
            >
              {currentPhotoURL ? (
                <img src={currentPhotoURL} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <span>{displayName.slice(0, 2).toUpperCase()}</span>
              )}
            </button>
          </>
        ) : (
          <button
            onClick={() => onNavigate?.('profile')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#0F5132] dark:bg-emerald-600 text-white text-xs font-bold hover:bg-[#0c4027] dark:hover:bg-emerald-500 active:scale-95 transition shadow-xs cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5 rtl-flip" />
            <span>{t('auth.login')}</span>
          </button>
        )}
      </div>
    </header>
  );
};
