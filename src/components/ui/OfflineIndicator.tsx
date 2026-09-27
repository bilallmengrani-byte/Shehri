import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { useTranslation } from '../../contexts/LanguageContext';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  const { locale, t } = useTranslation();

  if (isOnline) return null;

  return (
    <div className={`fixed top-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full bg-stone-900/90 text-white px-3.5 py-1.5 text-xs font-medium shadow-lg backdrop-blur-xs border border-white/10 animate-pulse ${
      locale === 'ur' ? 'font-urdu' : ''
    }`}>
      <WifiOff className="w-3.5 h-3.5 text-amber-400" />
      <span>{locale === 'ur' ? 'آف لائن موڈ — رپورٹیں لوکل محفوظ ہیں' : 'Offline Mode — Reports saved locally'}</span>
    </div>
  );
};
