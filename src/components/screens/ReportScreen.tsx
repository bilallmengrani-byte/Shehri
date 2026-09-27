import React, { useState, useRef } from 'react';
import { 
  Camera, 
  Upload, 
  MapPin, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  RotateCcw, 
  ExternalLink,
  Info,
  Layers,
  ArrowRight,
  ShieldCheck,
  Check
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { LocationPinPreview } from '../report/LocationPinPreview';
import { missionsService, calculateCleanPoints, SAHIWAL_DEFAULT_COORDS } from '../../services/missions';
import { estimateSeverityFromPhoto, SeverityEstimationResult } from '../../services/aiEstimator';
import { CURRENT_USER } from '../../constants/mockData';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../contexts/LanguageContext';
import { 
  Mission, 
  MissionSeverity, 
  LocationCoordinates, 
  ReportCategory, 
  TabType 
} from '../../types';

interface ReportScreenProps {
  onReportSubmitted?: (createdMission?: Mission) => void;
  onViewOnMap?: (missionId: string) => void;
}

// Sample preset photos for instant testing on any desktop / device
const SAMPLE_PHOTOS = [
  {
    label: 'Roadside Plastics',
    url: 'https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?w=600&auto=format&fit=crop&q=80',
    severity: 'medium' as MissionSeverity,
    category: 'Plastic Waste' as ReportCategory,
    address: 'Near Goal Chowk, High Street, Sahiwal',
  },
  {
    label: 'Overflowing Bin',
    url: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=600&auto=format&fit=crop&q=80',
    severity: 'high' as MissionSeverity,
    category: 'Overflowing Dumpster' as ReportCategory,
    address: 'Farid Town Sector 2 Main Road, Sahiwal',
  },
  {
    label: 'Walkway Litter',
    url: 'https://images.unsplash.com/photo-1604187351574-c75ca79f5807?w=600&auto=format&fit=crop&q=80',
    severity: 'low' as MissionSeverity,
    category: 'Greenery Cleanup' as ReportCategory,
    address: 'Lower Bari Doab Canal Promenade, Sahiwal',
  },
];

export const ReportScreen: React.FC<ReportScreenProps> = ({ 
  onReportSubmitted,
  onViewOnMap 
}) => {
  const { user, userProfile } = useAuth();
  const { locale, isRTL, t } = useTranslation();

  // Photo state
  const [photoData, setPhotoData] = useState<string | null>(null);
  const [photoFilename, setPhotoFilename] = useState<string>('');

  // Geolocation state
  const [location, setLocation] = useState<LocationCoordinates>({
    lat: SAHIWAL_DEFAULT_COORDS.lat,
    lng: SAHIWAL_DEFAULT_COORDS.lng,
    address: SAHIWAL_DEFAULT_COORDS.address,
    accuracyMeters: 10,
    nudgeOffsetX: 0,
    nudgeOffsetY: 0,
  });
  const [isLocating, setIsLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  // Form state
  const [severity, setSeverity] = useState<MissionSeverity>('medium');
  const [category, setCategory] = useState<ReportCategory>('Plastic Waste');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // AI Estimation state (structured for future LLM integration)
  const [aiEstimation, setAiEstimation] = useState<SeverityEstimationResult | null>(null);
  const [isAnalyzingAi, setIsAnalyzingAi] = useState(false);

  // Submission success state
  const [createdMission, setCreatedMission] = useState<Mission | null>(null);

  // File input refs
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Request browser geolocation and attach lat/lng
  const requestGeolocation = () => {
    if (!('geolocation' in navigator)) {
      setGeoError('Geolocation is not supported by your browser. Using Sahiwal center.');
      return;
    }

    setIsLocating(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        const { latitude, longitude, accuracy } = position.coords;
        setLocation((prev) => ({
          ...prev,
          lat: Number(latitude.toFixed(6)),
          lng: Number(longitude.toFixed(6)),
          accuracyMeters: Math.round(accuracy) || 12,
          address: 'Current Device Location, Sahiwal',
          nudgeOffsetX: 0,
          nudgeOffsetY: 0,
        }));
      },
      (error) => {
        setIsLocating(false);
        console.warn('Geolocation error:', error.message);
        setGeoError('GPS access denied or unavailable. Fallback to Sahiwal Goal Chowk (nudge pin to adjust).');
      },
      {
        enableHighAccuracy: true,
        timeout: 9000,
        maximumAge: 10000,
      }
    );
  };

  // Process chosen image file
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoFilename(file.name);

    // Read as DataURL
    const reader = new FileReader();
    reader.onload = async (event) => {
      const result = event.target?.result as string;
      setPhotoData(result);

      // 1. Immediately request browser geolocation upon photo select
      requestGeolocation();

      // 2. Trigger AI severity estimation (ready for Gemini)
      runAiEstimation(result);
    };
    reader.readAsDataURL(file);
  };

  // Run AI severity heuristic / API
  const runAiEstimation = async (imageData: string) => {
    setIsAnalyzingAi(true);
    try {
      const estimation = await estimateSeverityFromPhoto(imageData);
      setAiEstimation(estimation);
      // Auto-set severity if user hasn't explicitly customized it yet
      setSeverity(estimation.severity);
      if (estimation.suggestedCategory) {
        setCategory(estimation.suggestedCategory as ReportCategory);
      }
    } catch (err) {
      console.warn('AI analysis skipped:', err);
    } finally {
      setIsAnalyzingAi(false);
    }
  };

  // Pick a preset sample photo for fast demo testing
  const handleSelectSample = (sample: typeof SAMPLE_PHOTOS[0]) => {
    setPhotoData(sample.url);
    setPhotoFilename(`${sample.label}.jpg`);
    setSeverity(sample.severity);
    setCategory(sample.category);
    setLocation((prev) => ({
      ...prev,
      address: sample.address,
      accuracyMeters: 8,
      nudgeOffsetX: 0,
      nudgeOffsetY: 0,
    }));
    requestGeolocation();
  };

  // Handle Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoData) return;

    setIsSubmitting(true);
    try {
      const newMission = await missionsService.createMission({
        photo: photoData,
        location,
        severity,
        category,
        description,
        reporterId: user?.uid || CURRENT_USER.id,
        reporterName: userProfile?.name || user?.displayName || 'Hamza Khan (You)',
      });

      setCreatedMission(newMission);
      onReportSubmitted?.(newMission);
    } catch (error) {
      console.error('Failed to create mission:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form to report another incident
  const handleReset = () => {
    setPhotoData(null);
    setPhotoFilename('');
    setCreatedMission(null);
    setDescription('');
    setSeverity('medium');
    setAiEstimation(null);
  };

  const calculatedPoints = calculateCleanPoints(severity);

  // -------------------------------------------------------------
  // SUCCESS STATE VIEW
  // -------------------------------------------------------------
  if (createdMission) {
    return (
      <div className="p-4 flex-1 flex flex-col gap-4 animate-fade-in">
        {/* Success Header Card */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-[#0F5132] via-[#0A3B24] to-[#062416] text-white shadow-xl flex flex-col items-center text-center relative overflow-hidden">
          <div className="absolute top-0 end-0 -me-8 -mt-8 w-32 h-32 rounded-full bg-white/5 pointer-events-none" />

          {/* Animated check badge */}
          <div className="w-16 h-16 rounded-full bg-emerald-400/20 border-2 border-emerald-400 text-emerald-300 flex items-center justify-center mb-3 ring-8 ring-white/10 shadow-lg">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <h2 className="text-xl font-extrabold tracking-tight">
            {t('report.reportSuccess')}
          </h2>
          <p className="text-xs text-emerald-100/90 mt-1 max-w-xs leading-relaxed">
            {t('report.reportSuccessMsg')}
          </p>

          {/* CleanPoints Reward Box */}
          <div className="mt-4 w-full p-3.5 rounded-2xl bg-amber-500/20 border border-amber-400/40 backdrop-blur-xs flex items-center justify-between gap-3 text-amber-200">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-400 text-stone-950 flex items-center justify-center font-bold shadow-xs">
                <Sparkles className="w-5 h-5 fill-stone-950" />
              </div>
              <div className="text-start">
                <span className="text-[10px] uppercase font-bold tracking-wider text-amber-300 block">
                  {t('missions.estimatedReward')}
                </span>
                <span className="text-lg font-black text-white leading-tight">
                  +{createdMission.cleanPoints} {t('common.cleanPoints')}
                </span>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-amber-300 bg-amber-900/50 px-2 py-1 rounded-lg border border-amber-400/30">
              {createdMission.severity.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Mission Summary Card */}
        <Card variant="default" className="border-stone-200 shadow-sm">
          <CardHeader className="mb-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge status={locale === 'ur' ? 'کھلا ہے' : 'Open'} size="sm" showDot />
                <span className="text-[11px] text-stone-500 font-medium">
                  {t(`categories.${createdMission.category}`) || createdMission.category}
                </span>
              </div>
              <CardTitle className="text-sm font-bold text-stone-900">
                {createdMission.title}
              </CardTitle>
            </div>
            <span className="text-[10px] font-mono text-stone-400 bg-stone-100 px-2 py-1 rounded-md">
              {createdMission.id.slice(0, 12)}
            </span>
          </CardHeader>

          <CardContent className="space-y-3 pt-1">
            {/* Thumbnail + Location Summary */}
            <div className="flex items-center gap-3 p-2 bg-stone-50 rounded-2xl border border-stone-100">
              <img
                src={createdMission.photo}
                alt="Reported incident"
                className="w-16 h-16 rounded-xl object-cover border border-stone-200 shrink-0"
              />
              <div className="min-w-0 text-xs">
                <p className="font-semibold text-stone-800 flex items-center gap-1 truncate">
                  <MapPin className="w-3.5 h-3.5 text-[#0F5132] shrink-0" />
                  <span>{createdMission.location.address}</span>
                </p>
                <p className="text-[11px] font-mono text-stone-500 mt-0.5 truncate">
                  {createdMission.location.lat.toFixed(4)}°, {createdMission.location.lng.toFixed(4)}°
                </p>
                <p className="text-[11px] text-stone-400 mt-1">
                  {t('common.status')}: {t('status.open')}
                </p>
              </div>
            </div>

            {createdMission.description && (
              <p className="text-xs text-stone-600 bg-white p-2 rounded-xl border border-stone-100 italic">
                "{createdMission.description}"
              </p>
            )}
          </CardContent>

          <CardFooter className="flex flex-col gap-2 pt-3">
            {/* Primary Action: View on map */}
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={() => {
                if (onViewOnMap) {
                  onViewOnMap(createdMission.id);
                } else if (onReportSubmitted) {
                  onReportSubmitted(createdMission);
                }
              }}
              icon={<ArrowRight className="w-4 h-4 rtl-flip" />}
              iconPosition="right"
            >
              {t('report.viewOnMapBtn')}
            </Button>

            {/* Secondary Action: Report another */}
            <Button
              variant="ghost"
              size="sm"
              fullWidth
              onClick={handleReset}
              icon={<RotateCcw className="w-3.5 h-3.5 rtl-flip" />}
            >
              {t('report.reportAnother')}
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // -------------------------------------------------------------
  // ACTIVE REPORTING FLOW
  // -------------------------------------------------------------
  return (
    <div className="p-4 flex flex-col gap-4">
      {/* Title */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-stone-900 tracking-tight">
            {t('report.title')}
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            {t('report.subtitle')}
          </p>
        </div>
        <span className="p-2 rounded-2xl bg-emerald-100 text-[#0F5132] shadow-2xs">
          <Camera className="w-5 h-5" />
        </span>
      </div>

      {/* Hidden browser file inputs */}
      {/* 1. Camera input with capture="environment" for mobile phone camera */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />
      {/* 2. Standard file picker for existing photos */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Step 1: Camera / Photo Capture Card */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-[#0F5132] text-white text-[10px] font-bold flex items-center justify-center">
                1
              </span>
              <span>{t('report.photoEvidence')}</span>
            </label>
            {photoData && (
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="text-[11px] font-semibold text-[#0F5132] hover:underline cursor-pointer"
              >
                {t('report.takePhoto')}
              </button>
            )}
          </div>

          {!photoData ? (
            <div className="flex flex-col gap-2.5">
              {/* Primary Camera Touch Target */}
              <div
                onClick={() => cameraInputRef.current?.click()}
                className="p-6 rounded-3xl border-2 border-dashed border-emerald-700/40 bg-gradient-to-b from-emerald-50/60 to-stone-50 hover:bg-emerald-50/90 transition-all cursor-pointer flex flex-col items-center justify-center text-center group shadow-xs active:scale-[0.99]"
              >
                <div className="w-16 h-16 rounded-3xl bg-[#0F5132] text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform ring-4 ring-emerald-100">
                  <Camera className="w-8 h-8" />
                </div>
                <h3 className="text-sm font-bold text-stone-900 mt-3">
                  {t('report.takePhoto')}
                </h3>
                <p className="text-xs text-stone-500 mt-0.5 max-w-xs leading-relaxed">
                  {t('report.photoDesc')}
                </p>
                <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-stone-200 text-stone-800 text-xs font-semibold shadow-2xs">
                  <Camera className="w-3.5 h-3.5 text-[#0F5132]" />
                  <span>{t('report.takePhoto')}</span>
                </div>
              </div>

              {/* Secondary Upload & Desktop Preset Bar */}
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  fullWidth
                  icon={<Upload className="w-3.5 h-3.5" />}
                  onClick={() => galleryInputRef.current?.click()}
                  className="text-xs"
                >
                  {t('report.uploadPhoto')}
                </Button>
              </div>

              {/* Instant Test Presets for Quick Evaluation */}
              <div className="p-2.5 rounded-2xl bg-stone-100/70 border border-stone-200/80">
                <p className="text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1.5">
                  {t('report.quickSamples')}
                </p>
                <div className="grid grid-cols-3 gap-1.5">
                  {SAMPLE_PHOTOS.map((sample) => (
                    <button
                      key={sample.label}
                      type="button"
                      onClick={() => handleSelectSample(sample)}
                      className="p-1.5 rounded-xl bg-white border border-stone-200 hover:border-emerald-600/50 text-start transition shadow-2xs group cursor-pointer"
                    >
                      <img
                        src={sample.url}
                        alt={sample.label}
                        className="w-full h-12 object-cover rounded-lg group-hover:opacity-90"
                      />
                      <span className="text-[10px] font-semibold text-stone-800 block truncate mt-1">
                        {sample.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Photo Preview Card */
            <div className="relative rounded-3xl overflow-hidden border border-stone-200 shadow-sm bg-stone-900 group">
              <img
                src={photoData}
                alt="Selected waste incident"
                className="w-full h-52 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-black/30 pointer-events-none" />

              {/* Top status pills with logical start-3 and end-3 */}
              <div className="absolute top-3 start-3 end-3 flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-medium flex items-center gap-1.5 border border-white/20">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>{locale === 'ur' ? 'تصویر تیار ہے' : 'Photo Ready'}</span>
                </span>

                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="px-2.5 py-1 rounded-full bg-white/90 text-stone-900 text-[11px] font-bold hover:bg-white active:scale-95 transition shadow-xs cursor-pointer"
                >
                  {t('report.changeSeverity')}
                </button>
              </div>

              {/* Bottom photo metadata with logical start-3 and end-3 */}
              <div className="absolute bottom-3 start-3 end-3 flex items-center justify-between text-white text-xs">
                <span className="text-[11px] text-stone-200 truncate">
                  {photoFilename || t('report.photoEvidence')}
                </span>
                {isAnalyzingAi ? (
                  <span className="text-[11px] text-amber-300 font-semibold flex items-center gap-1 animate-pulse">
                    <Sparkles className="w-3 h-3" /> {t('report.aiAnalyzing')}
                  </span>
                ) : aiEstimation ? (
                  <span className="text-[11px] text-emerald-300 font-semibold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> {t('report.aiAnalysis')}
                  </span>
                ) : null}
              </div>
            </div>
          )}
        </div>

        {/* Step 2: Location Preview with Pin Nudge */}
        {photoData && (
          <div className="animate-fade-in flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-[#0F5132] text-white text-[10px] font-bold flex items-center justify-center">
                  2
                </span>
                <span>{t('report.locationTitle')}</span>
              </label>
              <button
                type="button"
                onClick={requestGeolocation}
                className="text-[11px] font-semibold text-[#0F5132] hover:underline cursor-pointer"
              >
                {t('report.currentGPS')}
              </button>
            </div>

            {geoError && (
              <div className="p-2.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
                <Info className="w-4 h-4 text-amber-600 shrink-0" />
                <p className="text-[11px] leading-tight">{geoError}</p>
              </div>
            )}

            {/* Embedded interactive pin map */}
            <LocationPinPreview
              location={location}
              onChange={setLocation}
              onResetGps={requestGeolocation}
              isLocating={isLocating}
            />
          </div>
        )}

        {/* Step 3: Severity Selector & CleanPoints Preview */}
        {photoData && (
          <div className="animate-fade-in flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-[#0F5132] text-white text-[10px] font-bold flex items-center justify-center">
                  3
                </span>
                <span>{t('missions.severityLevel')}</span>
              </label>

              {aiEstimation && (
                <span className="text-[10px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" /> {t('report.aiSuggestedSeverity')}: {aiEstimation.severity.toUpperCase()}
                </span>
              )}
            </div>

            {/* 3 Severity Cards */}
            <div className="grid grid-cols-3 gap-2">
              {/* Low */}
              <div
                onClick={() => setSeverity('low')}
                className={`p-3 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                  severity === 'low'
                    ? 'border-emerald-700 bg-emerald-50/70 shadow-xs ring-2 ring-emerald-700/20'
                    : 'border-stone-200 bg-white hover:bg-stone-50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-stone-900">{t('severity.lowShort')}</span>
                    {severity === 'low' && (
                      <span className="w-4 h-4 rounded-full bg-[#0F5132] text-white flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 stroke-3" />
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-stone-500 leading-tight">
                    {locale === 'ur' ? 'چھوٹا کچرا یا لفافے' : 'Small litter, scattered wrappers'}
                  </p>
                </div>
                <div className="mt-2.5 pt-2 border-t border-stone-100 flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-amber-700 flex items-center gap-0.5">
                    <Sparkles className="w-3 h-3 fill-amber-500 text-amber-600" />
                    +10
                  </span>
                  <span className="text-[9px] text-stone-400">{t('common.points')}</span>
                </div>
              </div>

              {/* Medium */}
              <div
                onClick={() => setSeverity('medium')}
                className={`p-3 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                  severity === 'medium'
                    ? 'border-amber-500 bg-amber-50/70 shadow-xs ring-2 ring-amber-500/20'
                    : 'border-stone-200 bg-white hover:bg-stone-50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-stone-900">{t('severity.mediumShort')}</span>
                    {severity === 'medium' && (
                      <span className="w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 stroke-3" />
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-stone-500 leading-tight">
                    {locale === 'ur' ? 'کچرے کا ڈھیر یا تھیلے' : 'Multiple sacks or pile'}
                  </p>
                </div>
                <div className="mt-2.5 pt-2 border-t border-stone-100 flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-amber-700 flex items-center gap-0.5">
                    <Sparkles className="w-3 h-3 fill-amber-500 text-amber-600" />
                    +25
                  </span>
                  <span className="text-[9px] text-stone-400">{t('common.points')}</span>
                </div>
              </div>

              {/* High */}
              <div
                onClick={() => setSeverity('high')}
                className={`p-3 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                  severity === 'high'
                    ? 'border-rose-600 bg-rose-50/70 shadow-xs ring-2 ring-rose-600/20'
                    : 'border-stone-200 bg-white hover:bg-stone-50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-stone-900">{t('severity.highShort')}</span>
                    {severity === 'high' && (
                      <span className="w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 stroke-3" />
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-stone-500 leading-tight">
                    {locale === 'ur' ? 'بھرا کوڑے دان یا بند راستہ' : 'Overflowing dumpster, road block'}
                  </p>
                </div>
                <div className="mt-2.5 pt-2 border-t border-stone-100 flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-amber-700 flex items-center gap-0.5">
                    <Sparkles className="w-3 h-3 fill-amber-500 text-amber-600" />
                    +50
                  </span>
                  <span className="text-[9px] text-stone-400">{t('common.points')}</span>
                </div>
              </div>
            </div>

            {/* AI Estimation Note if present */}
            {aiEstimation?.rationale && (
              <div className="p-2.5 rounded-xl bg-stone-100 text-stone-600 text-[11px] flex items-center gap-2 border border-stone-200/80">
                <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <p>
                  <span className="font-semibold text-stone-800">{t('report.aiAnalysis')}:</span> {aiEstimation.rationale}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Category & Description */}
        {photoData && (
          <div className="animate-fade-in flex flex-col gap-3">
            <div>
              <label className="text-xs font-bold text-stone-800 mb-1.5 block">
                {t('report.selectCategory')}
              </label>
              <div className="flex flex-wrap gap-1.5">
                {(
                  [
                    'Plastic Waste',
                    'Overflowing Dumpster',
                    'Construction Debris',
                    'Drainage Blockage',
                    'Greenery Cleanup',
                  ] as ReportCategory[]
                ).map((cat) => {
                  const isSelected = category === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                        isSelected
                          ? 'bg-[#0F5132] text-white shadow-xs font-semibold'
                          : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-50'
                      }`}
                    >
                      {t(`categories.${cat}`) || cat}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-stone-800 mb-1.5 block">
                {t('report.descriptionLabel')}
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('report.descriptionPlaceholder')}
                className="w-full p-3 rounded-2xl border border-stone-200 bg-white text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#0F5132]/30 focus:border-[#0F5132] transition"
              />
            </div>

            {/* Total CleanPoints Reward Highlight */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-50 to-emerald-50 border border-amber-200 flex items-center justify-between text-xs text-stone-900">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-bold shadow-xs">
                  <Sparkles className="w-4 h-4 fill-stone-950" />
                </div>
                <div>
                  <span className="font-bold block text-stone-900">
                    {t('report.potentialPoints', { points: calculatedPoints })}
                  </span>
                  <span className="text-[10px] text-stone-500">
                    {t('common.sahiwalPunjab')}
                  </span>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider bg-white px-2 py-1 rounded-lg border border-emerald-200 shadow-2xs">
                {severity}
              </span>
            </div>

            {/* Submit Action */}
            <div className="pt-1 flex flex-col gap-2">
              <Button
                variant="primary"
                size="lg"
                fullWidth
                type="submit"
                isLoading={isSubmitting}
                icon={<CheckCircle2 className="w-4 h-4" />}
              >
                {t('report.submitReport')}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={handleReset}
              >
                {t('common.cancel')}
              </Button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};
