import React, { useState } from 'react';
import { Share2, PlusSquare, X } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { useTranslation } from '../../contexts/LanguageContext';
import { ShehriIcon } from '../common/ShehriLogo';

export const PWAInstallBanner: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const { locale, isRTL, t } = useTranslation();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  if (isInstalled || isDismissed) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <div className="mx-4 mb-3 p-3 bg-gradient-to-r from-[#0F5132] to-[#0A3B24] rounded-2xl text-white shadow-md flex items-center justify-between gap-3 animate-fade-in border border-emerald-800/40">
        <div className="flex items-center gap-2.5 min-w-0">
          <ShehriIcon size={34} variant="badge" />
          <div className="min-w-0">
            <p className={`text-sm font-bold text-white leading-tight truncate ${locale === 'ur' ? 'font-urdu' : ''}`}>
              {t('pwa.installTitle')}
            </p>
            <p className="text-[11px] text-emerald-100/80 truncate">
              {t('pwa.installSubtitle')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={install}
            className={`px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-stone-900 font-semibold text-xs rounded-xl shadow-xs transition active:scale-95 cursor-pointer ${
              locale === 'ur' ? 'font-urdu' : ''
            }`}
          >
            {t('pwa.installBtn')}
          </button>
          <button
            onClick={() => setIsDismissed(true)}
            aria-label={t('common.dismiss')}
            className="p-1 text-emerald-200/70 hover:text-white transition rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <div className="mx-4 mb-3 p-3 bg-gradient-to-r from-[#0F5132] to-[#0A3B24] rounded-2xl text-white shadow-md flex items-center justify-between gap-3 border border-emerald-800/40">
          <div className="flex items-center gap-2.5 min-w-0">
            <ShehriIcon size={34} variant="badge" />
            <div className="min-w-0">
              <p className={`text-sm font-bold text-white leading-tight truncate ${locale === 'ur' ? 'font-urdu' : ''}`}>
                {t('pwa.iosTitle')}
              </p>
              <p className="text-[11px] text-emerald-100/80 truncate">
                {t('pwa.iosSubtitle')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setShowIOSGuide(true)}
              className={`px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-stone-900 font-semibold text-xs rounded-xl shadow-xs transition active:scale-95 cursor-pointer ${
                locale === 'ur' ? 'font-urdu' : ''
              }`}
            >
              {t('common.howTo')}
            </button>
            <button
              onClick={() => setIsDismissed(true)}
              aria-label={t('common.dismiss')}
              className="p-1 text-emerald-200/70 hover:text-white transition rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
            <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl border border-stone-200">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <div className="flex items-center gap-2">
                  <ShehriIcon size={32} variant="badge" />
                  <div>
                    <h3 className={`text-sm font-bold text-stone-900 ${locale === 'ur' ? 'font-urdu' : ''}`}>
                      {t('pwa.iosTitle')}
                    </h3>
                    <p className="text-xs text-stone-500">{t('pwa.iosSubtitle')}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 text-stone-400 hover:text-stone-600 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 space-y-3 text-xs text-stone-700">
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-stone-50 border border-stone-100">
                  <div className="w-6 h-6 rounded-lg bg-emerald-100 text-[#0F5132] flex items-center justify-center shrink-0 font-bold">
                    1
                  </div>
                  <p>
                    {t('pwa.iosStep1')}{' '}
                    <Share2 className="w-3.5 h-3.5 inline text-blue-600 -mt-0.5" />.
                  </p>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-stone-50 border border-stone-100">
                  <div className="w-6 h-6 rounded-lg bg-emerald-100 text-[#0F5132] flex items-center justify-center shrink-0 font-bold">
                    2
                  </div>
                  <p>
                    {t('pwa.iosStep2')}{' '}
                    <PlusSquare className="w-3.5 h-3.5 inline text-stone-700 -mt-0.5" />.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-4 w-full py-2.5 rounded-2xl bg-[#0F5132] text-white font-medium text-xs hover:bg-[#0A3B24] transition cursor-pointer"
              >
                {t('common.close')}
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
