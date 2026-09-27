import React, { useState, useEffect } from 'react';
import { Globe, Bell, Check, Sliders, Sun, Moon, Monitor } from 'lucide-react';
import { Card } from '../ui/Card';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';

export const PreferencesSection: React.FC = () => {
  const { userProfile, updateNotificationPreferences } = useAuth();
  const { locale, setLocale, isRTL, t } = useTranslation();
  const { theme, setTheme } = useTheme();

  // Notification state initialized from userProfile or default true
  const [missionAccepted, setMissionAccepted] = useState(
    userProfile?.notifications?.missionAccepted ?? true
  );
  const [cleanupVerified, setCleanupVerified] = useState(
    userProfile?.notifications?.cleanupVerified ?? true
  );
  const [newMissionNearby, setNewMissionNearby] = useState(
    userProfile?.notifications?.newMissionNearby ?? true
  );

  const [savingNotice, setSavingNotice] = useState(false);

  useEffect(() => {
    if (userProfile?.notifications) {
      setMissionAccepted(userProfile.notifications.missionAccepted ?? true);
      setCleanupVerified(userProfile.notifications.cleanupVerified ?? true);
      setNewMissionNearby(userProfile.notifications.newMissionNearby ?? true);
    }
  }, [userProfile]);

  const handleToggle = async (
    key: 'missionAccepted' | 'cleanupVerified' | 'newMissionNearby',
    value: boolean
  ) => {
    let nextMissionAccepted = missionAccepted;
    let nextCleanupVerified = cleanupVerified;
    let nextNewMissionNearby = newMissionNearby;

    if (key === 'missionAccepted') {
      setMissionAccepted(value);
      nextMissionAccepted = value;
    } else if (key === 'cleanupVerified') {
      setCleanupVerified(value);
      nextCleanupVerified = value;
    } else if (key === 'newMissionNearby') {
      setNewMissionNearby(value);
      nextNewMissionNearby = value;
    }

    setSavingNotice(true);
    try {
      await updateNotificationPreferences({
        missionAccepted: nextMissionAccepted,
        cleanupVerified: nextCleanupVerified,
        newMissionNearby: nextNewMissionNearby,
      });
      setTimeout(() => setSavingNotice(false), 2000);
    } catch (err) {
      console.error('Failed to update notification preferences:', err);
      setSavingNotice(false);
    }
  };

  return (
    <Card variant="default" padded="none" className="overflow-hidden border-stone-200/90 dark:border-stone-800 shadow-2xs">
      {/* Section Header */}
      <div className="p-4 bg-gradient-to-r from-emerald-50/60 to-stone-50 dark:from-emerald-950/40 dark:to-stone-900 border-b border-stone-200/70 dark:border-stone-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-xl bg-[#0F5132] dark:bg-emerald-600 text-white flex items-center justify-center">
            <Sliders className="w-4 h-4" />
          </span>
          <h3 className="text-xs font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wider">
            {t('settings.preferences')}
          </h3>
        </div>
        {savingNotice && (
          <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1 animate-fade-in">
            <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            {t('settings.saved')}
          </span>
        )}
      </div>

      <div className="divide-y divide-stone-100 dark:divide-stone-800 p-4 space-y-4">
        {/* 1. Theme Control (Light Mode Default) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200/80">
              <Sun className="w-4 h-4 text-amber-500" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-stone-800 block">
                {locale === 'ur' ? 'ایپ تھیم' : 'App Theme'}
              </span>
              <span className="text-[11px] text-stone-400 block truncate">
                {locale === 'ur' ? 'لائٹ تھیم فعال ہے' : 'Light Mode active'}
              </span>
            </div>
          </div>

          {/* Theme Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-amber-50 text-amber-800 font-bold text-xs shrink-0 border border-amber-200">
            <Sun className="w-3.5 h-3.5 text-amber-500" />
            <span>{locale === 'ur' ? 'روشنی (لائٹ)' : 'Light Mode'}</span>
          </div>
        </div>

        {/* 2. Language Toggle (EN / اردو) */}
        <div className="flex items-center justify-between gap-3 pt-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-2xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 flex items-center justify-center shrink-0">
              <Globe className="w-4 h-4 text-[#0F5132] dark:text-emerald-400" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-stone-800 dark:text-stone-200 block">
                {t('settings.languageToggle')}
              </span>
              <span className="text-[11px] text-stone-400 dark:text-stone-500 block truncate">
                {t('settings.languageToggleDesc')}
              </span>
            </div>
          </div>

          {/* Segmented Control */}
          <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-800 p-1 rounded-2xl text-xs shrink-0 border border-stone-200 dark:border-stone-700">
            <button
              type="button"
              onClick={() => setLocale('en')}
              className={`px-3 py-1.5 rounded-xl transition font-bold cursor-pointer text-xs ${
                locale === 'en'
                  ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs border border-stone-200/80 dark:border-stone-700'
                  : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
              }`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setLocale('ur')}
              className={`px-3 py-1.5 rounded-xl transition font-bold font-urdu cursor-pointer text-xs ${
                locale === 'ur'
                  ? 'bg-white dark:bg-stone-900 text-[#0F5132] dark:text-emerald-400 shadow-xs border border-emerald-300 dark:border-emerald-700'
                  : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
              }`}
            >
              اردو
            </button>
          </div>
        </div>

        {/* 3. Notification Preferences Section */}
        <div className="pt-3 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Bell className="w-4 h-4 text-stone-500 dark:text-stone-400" />
            <h4 className="text-xs font-bold text-stone-800 dark:text-stone-200">
              {t('settings.notificationsTitle')}
            </h4>
          </div>

          {/* Toggle 1: Mission Claimed */}
          <div className="flex items-center justify-between p-2.5 rounded-2xl bg-stone-50 dark:bg-stone-850 hover:bg-stone-100/70 dark:hover:bg-stone-800 transition border border-stone-150 dark:border-stone-800 gap-3">
            <div className="min-w-0">
              <span className="text-xs font-semibold text-stone-800 dark:text-stone-200 block">
                {t('settings.notifMissionAccepted')}
              </span>
              <span className="text-[11px] text-stone-500 dark:text-stone-400 block truncate">
                {t('settings.notifMissionAcceptedDesc')}
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={missionAccepted}
                onChange={(e) => handleToggle('missionAccepted', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-6 bg-stone-300 dark:bg-stone-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0F5132] dark:peer-checked:bg-emerald-600" />
            </label>
          </div>

          {/* Toggle 2: Cleanup Verified */}
          <div className="flex items-center justify-between p-2.5 rounded-2xl bg-stone-50 dark:bg-stone-850 hover:bg-stone-100/70 dark:hover:bg-stone-800 transition border border-stone-150 dark:border-stone-800 gap-3">
            <div className="min-w-0">
              <span className="text-xs font-semibold text-stone-800 dark:text-stone-200 block">
                {t('settings.notifCleanupVerified')}
              </span>
              <span className="text-[11px] text-stone-500 dark:text-stone-400 block truncate">
                {t('settings.notifCleanupVerifiedDesc')}
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={cleanupVerified}
                onChange={(e) => handleToggle('cleanupVerified', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-6 bg-stone-300 dark:bg-stone-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0F5132] dark:peer-checked:bg-emerald-600" />
            </label>
          </div>

          {/* Toggle 3: New Mission Nearby */}
          <div className="flex items-center justify-between p-2.5 rounded-2xl bg-stone-50 dark:bg-stone-850 hover:bg-stone-100/70 dark:hover:bg-stone-800 transition border border-stone-150 dark:border-stone-800 gap-3">
            <div className="min-w-0">
              <span className="text-xs font-semibold text-stone-800 dark:text-stone-200 block">
                {t('settings.notifNewMissionNearby')}
              </span>
              <span className="text-[11px] text-stone-500 dark:text-stone-400 block truncate">
                {t('settings.notifNewMissionNearbyDesc')}
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={newMissionNearby}
                onChange={(e) => handleToggle('newMissionNearby', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-6 bg-stone-300 dark:bg-stone-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0F5132] dark:peer-checked:bg-emerald-600" />
            </label>
          </div>
        </div>
      </div>
    </Card>
  );
};
