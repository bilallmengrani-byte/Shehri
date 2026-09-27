import React, { useState } from 'react';
import { X, ShieldCheck, FileText } from 'lucide-react';
import { useTranslation } from '../../contexts/LanguageContext';

interface PrivacyTermsModalProps {
  initialTab?: 'privacy' | 'terms';
  onClose: () => void;
}

export const PrivacyTermsModal: React.FC<PrivacyTermsModalProps> = ({
  initialTab = 'privacy',
  onClose,
}) => {
  const [tab, setTab] = useState<'privacy' | 'terms'>(initialTab);
  const { locale, t } = useTranslation();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
      <div className="w-full max-w-md bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-stone-200/80 dark:border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-[#0F5132] dark:text-emerald-400">
              {tab === 'privacy' ? (
                <ShieldCheck className="w-5 h-5" />
              ) : (
                <FileText className="w-5 h-5" />
              )}
            </span>
            <div>
              <h3 className={`text-sm font-bold text-stone-900 dark:text-stone-100 ${locale === 'ur' ? 'font-urdu' : ''}`}>
                {tab === 'privacy' ? t('settings.privacyPolicy') : t('settings.termsOfService')}
              </h3>
              <p className="text-[11px] text-stone-400 dark:text-stone-500">Shehri • Sahiwal Civic Movement</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer"
            aria-label={t('common.close')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="p-3 bg-stone-50 dark:bg-stone-850 border-b border-stone-100 dark:border-stone-800 flex gap-2">
          <button
            onClick={() => setTab('privacy')}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition cursor-pointer text-center ${
              tab === 'privacy'
                ? 'bg-white dark:bg-stone-900 text-[#0F5132] dark:text-emerald-400 shadow-xs border border-emerald-200 dark:border-emerald-800'
                : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            {t('settings.privacyPolicy')}
          </button>
          <button
            onClick={() => setTab('terms')}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition cursor-pointer text-center ${
              tab === 'terms'
                ? 'bg-white dark:bg-stone-900 text-[#0F5132] dark:text-emerald-400 shadow-xs border border-emerald-200 dark:border-emerald-800'
                : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            {t('settings.termsOfService')}
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
          {tab === 'privacy' ? (
            locale === 'ur' ? (
              <div className="space-y-3 font-urdu text-right" dir="rtl">
                <h4 className="font-bold text-stone-900 dark:text-stone-100 text-sm">۱. معلومات کا تحفظ</h4>
                <p>
                  شہری ایپ صرف ساہیوال میں بلدیاتی صفائی مشنز اور کچرے کے مقامات کے اندراج کے لیے ضروری کوائف (نام، ای میل، اور جی پی ایس مقام) اکٹھا کرتی ہے۔ ہم آپ کی ذاتی معلومات کسی تجارتی ادارے کے ساتھ فروخت یا شیئر نہیں کرتے۔
                </p>
                <h4 className="font-bold text-stone-900 dark:text-stone-100 text-sm">۲. جغرافیائی مقام (GPS) کا استعمال</h4>
                <p>
                  جب آپ کچرے کی تصویر لیتے ہیں یا صفائی کی تصدیق کرتے ہیں، تو آپ کا مقام صرف ساہیوال میونسپل ریڈار پر کچرے کی جگہ کی درست تصدیق کے لیے استعمال ہوتا ہے۔
                </p>
                <h4 className="font-bold text-stone-900 dark:text-stone-100 text-sm">۳. اکاؤنٹ کا خاتمہ</h4>
                <p>
                  آپ سیٹنگز اسکرین سے کسی بھی وقت اپنا اکاؤنٹ مستقل حذف کر سکتے ہیں۔ آپ کے تمام ذاتی کوائف فوری طور پر حذف کر دیے جائیں گے جبکہ تاریخی صفائی رپورٹس میں آپ کا نام 'سابق شہری' میں بدل جائے گا۔
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <h4 className="font-bold text-stone-900 dark:text-stone-100 text-sm">1. Citizen Data & Privacy</h4>
                <p>
                  Shehri collects minimal personal data (full name, email address, profile photo, and GPS coordinates) solely to power neighborhood waste resolution, volunteer missions, and civic gamification in Sahiwal. We do not sell or monetize citizen data.
                </p>
                <h4 className="font-bold text-stone-900 dark:text-stone-100 text-sm">2. Geolocation & Camera Permissions</h4>
                <p>
                  Precise GPS coordinates are requested strictly when documenting uncollected waste or verifying cleanup after-photos. These coordinates anchor public cleanup pins on the Sahiwal municipal radar.
                </p>
                <h4 className="font-bold text-stone-900 dark:text-stone-100 text-sm">3. Right to Erasure</h4>
                <p>
                  Citizens maintain full control over their account. Deleting your account from Settings removes your authentication credentials and personal profile doc. Past cleanup contributions remain on the civic ledger with your identity permanently scrubbed to "Former Citizen".
                </p>
              </div>
            )
          ) : (
            locale === 'ur' ? (
              <div className="space-y-3 font-urdu text-right" dir="rtl">
                <h4 className="font-bold text-stone-900 dark:text-stone-100 text-sm">۱. شہری ضابطہ اخلاق</h4>
                <p>
                  شہری پلیٹ فارم پر صرف ساہیوال کی حدود میں حقیقی کچرے اور بلدیاتی مسائل کی درست تصاویر اپلوڈ کریں۔ غلط، گمراہ کن یا غیر متعلقہ تصاویر اپلوڈ کرنے سے اکاؤنٹ معطل ہو سکتا ہے۔
                </p>
                <h4 className="font-bold text-stone-900 dark:text-stone-100 text-sm">۲. رضاکارانہ صفائی مشنز</h4>
                <p>
                  صفائی مشن قبول کرنے والے شہری اپنی حفاظت کے ذمہ دار خود ہیں۔ ہمیشہ مناسب دستانے، حفاظتی ماسک اور کچرا جمع کرنے کے تھیلے استعمال کریں۔
                </p>
                <h4 className="font-bold text-stone-900 dark:text-stone-100 text-sm">۳. کلین پوائنٹس اور اعزازی بیجز</h4>
                <p>
                  کلین پوائنٹس کمیونٹی کی حوصلہ افزائی کے لیے اعزازی علامات ہیں اور ان کی کوئی مالی یا نقدی حیثیت نہیں ہے۔
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <h4 className="font-bold text-stone-900 dark:text-stone-100 text-sm">1. Community Code of Conduct</h4>
                <p>
                  Reports submitted to Shehri must reflect genuine public sanitation, overflowing dumpsters, or litter conditions within Sahiwal. Fabricating or spamming false reports will result in profile deactivation.
                </p>
                <h4 className="font-bold text-stone-900 dark:text-stone-100 text-sm">2. Volunteer Safety & Protocol</h4>
                <p>
                  Volunteers undertaking cleanup missions are expected to observe standard safety precautions, including sturdy protective gloves and proper waste handling tools. Shehri is an organizing platform for civic cooperation.
                </p>
                <h4 className="font-bold text-stone-900 dark:text-stone-100 text-sm">3. CleanPoints & Recognition</h4>
                <p>
                  CleanPoints and civic badges serve as honorary recognition of civic pride. They do not constitute financial tender and cannot be redeemed for fiat currency.
                </p>
              </div>
            )
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-stone-50 dark:bg-stone-850 border-t border-stone-200/80 dark:border-stone-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#0F5132] dark:bg-emerald-600 hover:bg-[#0A3B24] dark:hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition cursor-pointer active:scale-95"
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
};
