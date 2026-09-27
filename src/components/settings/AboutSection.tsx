import React, { useState } from 'react';
import { Info, ShieldCheck, FileText, ChevronRight, Smartphone } from 'lucide-react';
import { Card } from '../ui/Card';
import { useTranslation } from '../../contexts/LanguageContext';
import { PrivacyTermsModal } from './PrivacyTermsModal';

export const AboutSection: React.FC = () => {
  const { locale, isRTL, t } = useTranslation();
  const [modalTab, setModalTab] = useState<'privacy' | 'terms' | null>(null);

  return (
    <>
      <Card variant="default" padded="none" className="overflow-hidden border-stone-200/90 dark:border-stone-800 shadow-2xs">
        {/* Section Header */}
        <div className="p-4 bg-gradient-to-r from-emerald-50/60 to-stone-50 dark:from-emerald-950/40 dark:to-stone-900 border-b border-stone-200/70 dark:border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-xl bg-[#0F5132] dark:bg-emerald-600 text-white flex items-center justify-center">
              <Info className="w-4 h-4" />
            </span>
            <h3 className="text-xs font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wider">
              {t('settings.about')}
            </h3>
          </div>
        </div>

        <div className="divide-y divide-stone-100 dark:divide-stone-800 p-4 space-y-3">
          {/* App Edition & Version */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2.5">
              <Smartphone className="w-4 h-4 text-stone-500 dark:text-stone-400" />
              <span className="font-urdu font-bold text-stone-800 dark:text-stone-200 text-sm">
                شہری (ساہیوال ایڈیشن)
              </span>
            </div>
            <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">
              {t('settings.appVersion')}
            </span>
          </div>

          {/* Short About Shehri Description */}
          <div className="pt-3">
            <p className={`text-xs text-stone-600 dark:text-stone-300 leading-relaxed bg-stone-50 dark:bg-stone-850 p-3 rounded-2xl border border-stone-100 dark:border-stone-800 ${locale === 'ur' ? 'font-urdu' : ''}`}>
              {t('settings.aboutDesc')}
            </p>
          </div>

          {/* Legal / Policy Links */}
          <div className="pt-2 space-y-1.5">
            <button
              type="button"
              onClick={() => setModalTab('privacy')}
              className="w-full p-2.5 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800 flex items-center justify-between text-xs text-stone-800 dark:text-stone-200 font-medium transition cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                <span>{t('settings.privacyPolicy')}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-stone-400 dark:text-stone-500 rtl-flip" />
            </button>

            <button
              type="button"
              onClick={() => setModalTab('terms')}
              className="w-full p-2.5 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800 flex items-center justify-between text-xs text-stone-800 dark:text-stone-200 font-medium transition cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-stone-600 dark:text-stone-400" />
                <span>{t('settings.termsOfService')}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-stone-400 dark:text-stone-500 rtl-flip" />
            </button>
          </div>
        </div>
      </Card>

      {/* Modal View for Privacy Policy & Terms */}
      {modalTab && (
        <PrivacyTermsModal
          initialTab={modalTab}
          onClose={() => setModalTab(null)}
        />
      )}
    </>
  );
};
