import React from 'react';
import { ShehriLogo } from './ShehriLogo';
import { useTranslation } from '../../contexts/LanguageContext';
import { Server } from 'lucide-react';

interface SplashScreenProps {
  isFadingOut?: boolean;
  isServerWakingUp?: boolean;
  onDismiss?: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ 
  isFadingOut = false,
  isServerWakingUp = false,
  onDismiss
}) => {
  const { locale, toggleLocale, isRTL, t } = useTranslation();

  return (
    <div
      onClick={() => onDismiss?.()}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-between p-6 bg-[#0F5132] text-white select-none transition-all duration-400 ease-out ${
        isFadingOut ? 'opacity-0 scale-[1.01] pointer-events-none' : 'opacity-100 scale-100'
      }`}
      aria-label="Loading Shehri"
    >
      {/* Top bar with civic location pill and quick language toggle */}
      <div className="w-full max-w-sm pt-6 flex items-center justify-between gap-2">
        <span 
          className={`text-xs font-bold text-emerald-200/90 bg-white/10 px-3 py-1 rounded-full border border-white/10 backdrop-blur-xs tracking-normal ${
            locale === 'ur' ? 'font-urdu' : ''
          }`}
        >
          {t('splash.locationPill')}
        </span>

        {/* Splash Language Toggle (EN / اردو) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleLocale();
          }}
          className="flex items-center gap-1 px-3 py-1 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 text-white text-xs font-bold transition border border-white/20 backdrop-blur-xs cursor-pointer"
          title={locale === 'en' ? 'اردو میں تبدیل کریں' : 'Switch to English'}
        >
          <span>{locale === 'en' ? 'اردو' : 'English'}</span>
        </button>
      </div>

      {/* Center Logo & Branding */}
      <div className="flex flex-col items-center text-center -mt-6 max-w-xs">
        <ShehriLogo
          layout="stacked"
          size="xl"
          theme="light"
          showCityBadge={true}
          showTagline={true}
          customTagline={t('splash.tagline')}
        />

        {/* Amber Accent Loading Indicator or Cold-Start Server Waking Up Notice */}
        <div className="mt-8 flex flex-col items-center gap-3 w-full">
          {/* Thin Progress Bar in Amber Accent */}
          <div className="w-36 h-1.5 bg-black/30 rounded-full overflow-hidden border border-white/15 shadow-inner">
            <div className="h-full bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 rounded-full animate-shehri-progress" />
          </div>

          {isServerWakingUp ? (
            /* Cold-Start Server Warm-Up Banner (Triggers after 3s delay on idle/free-tier hosting) */
            <div className="mt-2 w-full p-3.5 rounded-2xl bg-amber-500/20 border border-amber-400/40 backdrop-blur-md flex flex-col items-center text-center gap-1.5 animate-fade-in shadow-lg">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                <Server className="w-4 h-4 animate-spin text-amber-400 shrink-0" />
                <span>
                  {locale === 'ur' 
                    ? 'شہری سرور بیدار ہو رہا ہے...' 
                    : 'Waking up Shehri server...'}
                </span>
              </div>
              <p className={`text-[11px] text-amber-100/90 leading-tight ${locale === 'ur' ? 'font-urdu' : ''}`}>
                {locale === 'ur'
                  ? 'پہلے لوڈ پر ایک منٹ تک لگ سکتا ہے۔ ساہیوال کی خدمات بیدار ہو رہی ہیں۔'
                  : 'This can take up to a minute on first load. Thanks for your patience!'}
              </p>
            </div>
          ) : (
            /* Standard Fast-Load Pulsing Dots */
            <div className="flex items-center gap-1.5 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400/90 animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400/90 animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400/90 animate-bounce" />
            </div>
          )}
        </div>
      </div>

      {/* Footer text in current locale */}
      <div className="pb-4 text-center">
        <p className={`text-xs text-emerald-200/80 font-medium ${locale === 'ur' ? 'font-urdu' : ''}`}>
          {t('splash.footerText')}
        </p>
      </div>
    </div>
  );
};
