import React from 'react';
import { 
  CheckCircle2, 
  Sparkles, 
  MapPin, 
  Camera, 
  Map, 
  ArrowRight,
  Navigation
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { useTranslation } from '../../contexts/LanguageContext';
import { Mission } from '../../types';
import { formatDistance } from '../../services/missions';

interface MissionAcceptedConfirmationProps {
  mission: Mission;
  isSelfClean?: boolean;
  onProceedToClean: () => void;
  onViewOnMap: () => void;
  onClose: () => void;
}

export const MissionAcceptedConfirmation: React.FC<MissionAcceptedConfirmationProps> = ({
  mission,
  isSelfClean = false,
  onProceedToClean,
  onViewOnMap,
  onClose,
}) => {
  const { locale, isRTL, t } = useTranslation();

  return (
    <div className="p-4 flex-1 flex flex-col gap-4 animate-fade-in">
      {/* Top Hero Card */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-[#0F5132] via-[#0A3B24] to-[#062416] text-white shadow-xl text-center relative overflow-hidden">
        <div className="absolute top-0 end-0 -me-10 -mt-10 w-36 h-36 rounded-full bg-white/5 pointer-events-none" />

        {/* Success Icon */}
        <div className="w-16 h-16 rounded-full bg-emerald-400/20 border-2 border-emerald-400 text-emerald-300 flex items-center justify-center mx-auto mb-3 ring-8 ring-white/10 shadow-lg">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-800/80 text-emerald-200 border border-emerald-600/50 inline-block mb-1">
          {locale === 'ur' ? 'مشن منظور' : 'Mission Claimed'}
        </span>

        <h2 className="text-xl font-extrabold tracking-tight">
          {t('missions.missionAcceptedTitle')}
        </h2>
        <p className="text-xs text-emerald-100/90 mt-1 max-w-xs mx-auto leading-relaxed">
          {t('missions.missionAcceptedMsg')}
        </p>

        {/* Reward Callout */}
        <div className="mt-4 p-3 rounded-2xl bg-amber-500/20 border border-amber-400/40 backdrop-blur-xs flex items-center justify-between gap-3 text-amber-200">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 fill-amber-300 text-amber-200" />
            <span className="text-xs font-semibold">{t('missions.reward', { points: mission.cleanPoints })}</span>
          </div>
          <span className="text-xs font-bold text-white bg-amber-600/60 px-2 py-0.5 rounded-md">
            +{mission.cleanPoints} {t('common.points')}
          </span>
        </div>
      </div>

      {/* Mission Summary Card */}
      <Card variant="default">
        <div className="flex items-center gap-3">
          <img
            src={mission.photo}
            alt={mission.title}
            className="w-16 h-16 rounded-2xl object-cover border border-stone-200 shrink-0"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 mb-0.5">
              <Badge status={locale === 'ur' ? 'جاری ہے' : 'In Progress'} size="sm" showDot />
              <span className="text-[11px] text-stone-500 font-medium truncate">
                {formatDistance(mission.distanceKm)}
              </span>
            </div>
            <h3 className="text-sm font-bold text-stone-900 truncate">
              {mission.title}
            </h3>
            <p className="text-xs text-stone-500 flex items-center gap-1 truncate mt-0.5">
              <MapPin className="w-3 h-3 text-[#0F5132] shrink-0" />
              <span className="truncate">{mission.location.address}</span>
            </p>
          </div>
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col gap-2 pt-2">
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={onProceedToClean}
          icon={<Camera className="w-4 h-4" />}
        >
          {t('missions.completeCleanup')}
        </Button>

        <Button
          variant="secondary"
          size="md"
          fullWidth
          onClick={onViewOnMap}
          icon={<Map className="w-4 h-4" />}
        >
          {t('common.viewOnMap')}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          fullWidth
          onClick={onClose}
        >
          {t('common.back')}
        </Button>
      </div>
    </div>
  );
};
