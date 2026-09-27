import React from 'react';
import { ArrowLeft, Sliders } from 'lucide-react';
import { useTranslation } from '../../contexts/LanguageContext';
import { AccountSection } from './AccountSection';
import { PreferencesSection } from './PreferencesSection';
import { AccountActionsSection } from './AccountActionsSection';
import { AboutSection } from './AboutSection';

interface SettingsScreenProps {
  onBack: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onBack }) => {
  const { locale, isRTL, t } = useTranslation();

  return (
    <div className="flex-1 flex flex-col bg-stone-50 dark:bg-stone-950 pb-8 animate-fade-in transition-colors duration-200">
      {/* Top Sticky Header */}
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md px-4 py-3 border-b border-stone-200/80 dark:border-stone-800 flex items-center justify-between shadow-2xs">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 active:scale-95 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-[#0F5132] dark:text-emerald-400 rtl-flip" />
          <span>{t('common.back')}</span>
        </button>

        <h2 className={`text-sm font-bold text-stone-900 dark:text-stone-100 ${locale === 'ur' ? 'font-urdu' : ''}`}>
          {t('settings.title')}
        </h2>

        <div className="w-8 flex justify-end">
          <span className="w-7 h-7 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-[#0F5132] dark:text-emerald-400 flex items-center justify-center border border-emerald-200/60 dark:border-emerald-800/60">
            <Sliders className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>

      {/* Main Settings Sections */}
      <div className="p-4 flex flex-col gap-4">
        {/* 1. Account Management (Photo, Name, Email, Password) */}
        <AccountSection />

        {/* 2. Preferences (Theme, Language, Notifications) */}
        <PreferencesSection />

        {/* 3. Account Actions (Sign Out, Delete Account) */}
        <AccountActionsSection />

        {/* 4. About & Legal (App Version, About Shehri, Privacy/Terms) */}
        <AboutSection />

        {/* Footer Tagline */}
        <div className="text-center pt-2 pb-4">
          <p className="text-xs font-urdu text-stone-500 dark:text-stone-400 font-medium">
            {locale === 'ur'
              ? 'شہری • ساہیوال صفائی مہم • پنجاب، پاکستان'
              : 'Shehri • Clean Sahiwal Civic Movement • Punjab, Pakistan'}
          </p>
        </div>
      </div>
    </div>
  );
};
