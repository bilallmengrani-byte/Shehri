import React, { useState } from 'react';
import { 
  ArrowLeft, 
  MapPin, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  UserCheck, 
  ExternalLink,
  Camera,
  Award
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { SahiwalLeafletMap } from '../map/SahiwalLeafletMap';
import { MissionAcceptedConfirmation } from './MissionAcceptedConfirmation';
import { CompleteCleanupScreen } from './CompleteCleanupScreen';
import { missionsService, formatDistance } from '../../services/missions';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../contexts/LanguageContext';
import { Mission } from '../../types';

interface MissionDetailScreenProps {
  mission: Mission;
  onBack: () => void;
  onViewOnMap: (missionId: string) => void;
  onCleanNow?: (mission: Mission) => void;
  onNavigateToProfile?: () => void;
}

export const MissionDetailScreen: React.FC<MissionDetailScreenProps> = ({
  mission: initialMission,
  onBack,
  onViewOnMap,
  onCleanNow,
  onNavigateToProfile,
}) => {
  const { user, userProfile } = useAuth();
  const { locale, isRTL, t } = useTranslation();
  const currentUserId = user?.uid || '';
  const currentUserName = userProfile?.name || user?.displayName || 'Sahiwal Citizen';

  const [mission, setMission] = useState<Mission>(initialMission);
  const [isAccepting, setIsAccepting] = useState(false);
  const [acceptedSuccess, setAcceptedSuccess] = useState(false);
  const [isSelfCleanAction, setIsSelfCleanAction] = useState(false);
  const [isCompletingCleanup, setIsCompletingCleanup] = useState(false);

  const isReporter = mission.reporterId === currentUserId;
  const isAssignedToCurrentUser = mission.volunteerId === currentUserId;
  const isAssignedToOther = !!mission.volunteerId && mission.volunteerId !== currentUserId;

  const handleAcceptMission = async (selfClean: boolean = false) => {
    setIsAccepting(true);
    setIsSelfCleanAction(selfClean);
    try {
      const updated = await missionsService.acceptMission(mission.id, currentUserId, currentUserName);
      if (updated) {
        setMission(updated);
        setAcceptedSuccess(true);
      }
    } catch (error) {
      console.error('Failed to accept mission:', error);
    } finally {
      setIsAccepting(false);
    }
  };

  // If user clicked through to submit after-photo cleanup proof
  if (isCompletingCleanup) {
    return (
      <CompleteCleanupScreen
        mission={mission}
        onBack={() => setIsCompletingCleanup(false)}
        onFinished={(updated) => {
          setMission(updated);
          setIsCompletingCleanup(false);
        }}
        onViewOnMap={onViewOnMap}
        onNavigateToProfile={onNavigateToProfile}
      />
    );
  }

  // If user just accepted the mission, show confirmation card
  if (acceptedSuccess) {
    return (
      <MissionAcceptedConfirmation
        mission={mission}
        isSelfClean={isSelfCleanAction}
        onProceedToClean={() => {
          setAcceptedSuccess(false);
          setIsCompletingCleanup(true);
        }}
        onViewOnMap={() => onViewOnMap(mission.id)}
        onClose={onBack}
      />
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-stone-50 pb-8 animate-fade-in">
      {/* Top Sticky Header */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md px-4 py-2.5 border-b border-stone-200/80 flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-stone-700 hover:text-stone-900 active:scale-95 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-[#0F5132] rtl-flip" />
          <span>{t('common.back')}</span>
        </button>

        <div className="flex items-center gap-1.5">
          <Badge
            status={
              mission.status === 'open'
                ? (locale === 'ur' ? 'کھلا ہے' : 'Open')
                : mission.status === 'in_progress'
                ? (locale === 'ur' ? 'جاری ہے' : 'In Progress')
                : (locale === 'ur' ? 'حل شدہ' : 'Resolved')
            }
            size="sm"
            showDot
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-4 flex flex-col gap-4">
        {/* Full Before Photo Card */}
        <div className="rounded-3xl overflow-hidden border border-stone-200 shadow-sm relative group bg-stone-900">
          <img
            src={mission.photo}
            alt={mission.title || 'Reported Waste'}
            className="w-full h-64 sm:h-72 object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-stone-950/20 pointer-events-none" />

          {/* Severity & Points Top Bar with logical start-3 end-3 */}
          <div className="absolute top-3 start-3 end-3 flex items-center justify-between">
            <span
              className={`px-3 py-1 rounded-full text-white text-xs font-bold shadow-md uppercase tracking-wider ${
                mission.severity === 'high'
                  ? 'bg-rose-600'
                  : mission.severity === 'medium'
                  ? 'bg-amber-500'
                  : 'bg-[#0F5132]'
              }`}
            >
              {t(`severity.${mission.severity}`)}
            </span>

            <div className="px-3 py-1 rounded-full bg-amber-400 text-stone-950 font-black text-xs flex items-center gap-1 shadow-md">
              <Sparkles className="w-3.5 h-3.5 fill-stone-950" />
              <span>+{mission.cleanPoints} {t('common.points')}</span>
            </div>
          </div>

          {/* Bottom Photo Overlay */}
          <div className="absolute bottom-3 start-3 end-3 text-white">
            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-300">
              {t('completeCleanup.originalReport')}
            </span>
            <h2 className="text-base font-bold leading-tight drop-shadow-sm truncate">
              {mission.title || t('missions.title')}
            </h2>
          </div>
        </div>

        {/* Reporter Self-Completion Callout (if original reporter) */}
        {isReporter && mission.status === 'open' && (
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-50 to-emerald-50 border border-amber-300/80 shadow-2xs flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center shrink-0 font-bold">
              <Award className="w-5 h-5 fill-stone-950" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-stone-900">
                {locale === 'ur' ? 'آپ نے یہ رپورٹ درج کی ہے!' : 'You reported this spot!'}
              </h4>
              <p className="text-[11px] text-stone-600 mt-0.5 leading-relaxed">
                {locale === 'ur'
                  ? `آپ خود صفائی کر کے پورے +${mission.cleanPoints} پوائنٹس حاصل کر سکتے ہیں، یا رضاکاروں کے لیے کھلا رہنے دیں۔`
                  : `As the original reporter, you can clean it yourself to claim the full +${mission.cleanPoints} CleanPoints.`}
              </p>
            </div>
          </div>
        )}

        {/* Location & Map Snippet Card */}
        <Card variant="default">
          <CardHeader className="mb-2">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400">
                {t('report.locationTitle')}
              </span>
              <CardTitle className="text-sm font-bold text-stone-900 flex items-center gap-1.5 mt-0.5">
                <MapPin className="w-4 h-4 text-[#0F5132] shrink-0" />
                <span>{mission.location.address}</span>
              </CardTitle>
            </div>
            <span className="text-xs font-semibold text-[#0F5132] bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
              {formatDistance(mission.distanceKm)}
            </span>
          </CardHeader>

          <CardContent className="space-y-3 pt-1">
            {/* Interactive Leaflet Snippet */}
            <div className="rounded-2xl overflow-hidden border border-stone-200 h-36 relative shadow-inner">
              <SahiwalLeafletMap
                missions={[mission]}
                selectedMissionId={mission.id}
                onSelectMission={() => {}}
                className="h-full w-full"
                interactive={false}
              />
              <button
                type="button"
                onClick={() => onViewOnMap(mission.id)}
                className="absolute bottom-2 end-2 z-20 px-2.5 py-1 rounded-xl bg-white/95 text-stone-800 text-[11px] font-semibold border border-stone-200 shadow-sm hover:bg-white active:scale-95 transition flex items-center gap-1 cursor-pointer"
              >
                <span>{t('common.viewOnMap')}</span>
                <ExternalLink className="w-3 h-3 text-[#0F5132] rtl-flip" />
              </button>
            </div>

            <div className="flex items-center justify-between text-[11px] text-stone-500 font-mono">
              <span>GPS: {mission.location.lat.toFixed(5)}°, {mission.location.lng.toFixed(5)}°</span>
              <span>±{mission.location.accuracyMeters || 10}{t('common.meters')}</span>
            </div>
          </CardContent>
        </Card>

        {/* Mission Details & Description */}
        <Card variant="default">
          <CardHeader className="mb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-stone-500">
              {t('missions.missionDetails')}
            </CardTitle>
            <Badge variant="primary" size="sm">
              {t(`categories.${mission.category}`) || mission.category}
            </Badge>
          </CardHeader>

          <CardContent className="space-y-2.5 text-xs text-stone-700">
            {mission.description ? (
              <p className="leading-relaxed bg-stone-50 p-3 rounded-2xl border border-stone-100 italic">
                "{mission.description}"
              </p>
            ) : (
              <p className="text-stone-400 italic">
                {t('missions.emptyStateDesc')}
              </p>
            )}

            <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
              <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-100">
                <span className="text-stone-400 block">{t('common.cleanPoints')}</span>
                <span className="font-extrabold text-amber-700 flex items-center gap-1 mt-0.5">
                  <Sparkles className="w-3 h-3 fill-amber-500 text-amber-600" />
                  +{mission.cleanPoints} {t('common.points')}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-100">
                <span className="text-stone-400 block">{t('missions.severityLevel')}</span>
                <span className="font-extrabold text-stone-800 uppercase mt-0.5 block">
                  {t(`severity.${mission.severity}`)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reporter Info Card */}
        <Card variant="flat" padded="sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-[#0F5132] font-bold text-sm flex items-center justify-center shrink-0 border border-emerald-200">
                {mission.reporterName ? mission.reporterName.slice(0, 2).toUpperCase() : 'SW'}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-stone-900">
                    {mission.reporterName || t('leaderboard.citizen')}
                  </span>
                  <span className="text-[10px] text-emerald-800 bg-emerald-100 px-1 py-0.2 rounded font-medium">
                    {t('common.verified')}
                  </span>
                </div>
                <p className="text-[11px] text-stone-500 flex items-center gap-1 mt-0.5">
                  <Clock className="w-3 h-3" />
                  <span>{t('missions.reportedBy')}: {new Date(mission.createdAt).toLocaleDateString()}</span>
                </p>
              </div>
            </div>

            <span className="text-[10px] font-mono text-stone-400">
              #{mission.reporterId.slice(0, 8)}
            </span>
          </div>
        </Card>

        {/* Action Button Section */}
        <div className="pt-2 flex flex-col gap-2">
          {mission.status === 'open' ? (
            <>
              {isReporter ? (
                /* Original reporter dual options */
                <div className="flex flex-col gap-2">
                  <Button
                    variant="accent"
                    size="lg"
                    fullWidth
                    isLoading={isAccepting}
                    onClick={() => handleAcceptMission(true)}
                    icon={<Award className="w-4 h-4 fill-white" />}
                  >
                    {locale === 'ur'
                      ? `خود صفائی کریں (+${mission.cleanPoints} پوائنٹس)`
                      : `Clean It Yourself (+${mission.cleanPoints} pts)`}
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    fullWidth
                    isLoading={isAccepting}
                    onClick={() => handleAcceptMission(false)}
                    icon={<UserCheck className="w-4 h-4" />}
                  >
                    {t('home.acceptMission')}
                  </Button>
                </div>
              ) : (
                /* Regular volunteer acceptance */
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  isLoading={isAccepting}
                  onClick={() => handleAcceptMission(false)}
                  icon={<UserCheck className="w-4 h-4" />}
                >
                  {t('home.acceptMission')} (+{mission.cleanPoints} {t('common.points')})
                </Button>
              )}
            </>
          ) : mission.status === 'in_progress' ? (
            isAssignedToCurrentUser ? (
              /* Already accepted by current user */
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={() => setIsCompletingCleanup(true)}
                icon={<Camera className="w-4 h-4" />}
              >
                {t('completeCleanup.title')} ({t('completeCleanup.uploadAfterPhoto')})
              </Button>
            ) : (
              /* Claimed by someone else */
              <div className="p-3 rounded-2xl bg-stone-100 text-stone-600 text-xs text-center border border-stone-200">
                <span className="font-semibold text-stone-800">{t('home.alreadyAccepted')}:</span>{' '}
                {mission.volunteerName || t('missions.assignedVolunteer')}
              </div>
            )
          ) : (
            /* Resolved */
            <div className="p-3 rounded-2xl bg-emerald-50 text-[#0F5132] text-xs text-center font-semibold border border-emerald-200">
              ✓ {locale === 'ur' ? 'یہ مشن کامیابی سے مکمل اور تصدیق شدہ ہے!' : 'This mission has been cleaned and verified!'}
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewOnMap(mission.id)}
            icon={<MapPin className="w-3.5 h-3.5 text-[#0F5132]" />}
          >
            {t('common.viewOnMap')}
          </Button>
        </div>
      </div>
    </div>
  );
};
