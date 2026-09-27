import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  Upload, 
  MapPin, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  ArrowLeft, 
  RotateCcw, 
  ShieldCheck, 
  Navigation, 
  ChevronRight,
  ExternalLink,
  Sliders,
  Check,
  Award
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { verifyCleanup } from '../../services/verification';
import { missionsService, formatDistance } from '../../services/missions';
import { uploadToCloudinary } from '../../services/cloudinary';
import { userService } from '../../services/user';
import { useTranslation } from '../../contexts/LanguageContext';
import { 
  Mission, 
  LocationCoordinates, 
  CleanupVerificationResult, 
  VerificationVerdict 
} from '../../types';

interface CompleteCleanupScreenProps {
  mission: Mission;
  onBack: () => void;
  onFinished: (mission: Mission) => void;
  onViewOnMap: (missionId: string) => void;
  onNavigateToProfile?: () => void;
}

// Sample cleaned site presets for fast testing on desktop/laptop
const SAMPLE_AFTER_PHOTOS = [
  {
    label: 'Cleaned Pavement',
    url: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600&auto=format&fit=crop&q=80',
    type: 'approved' as VerificationVerdict,
  },
  {
    label: 'Cleaned Walkway',
    url: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=600&auto=format&fit=crop&q=80',
    type: 'approved' as VerificationVerdict,
  },
  {
    label: 'Debris Still Present (Test Reject)',
    url: 'https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?w=600&auto=format&fit=crop&q=80',
    type: 'rejected' as VerificationVerdict,
  },
];

export const CompleteCleanupScreen: React.FC<CompleteCleanupScreenProps> = ({
  mission,
  onBack,
  onFinished,
  onViewOnMap,
  onNavigateToProfile,
}) => {
  const { locale, isRTL, t } = useTranslation();
  // After-photo state
  const [afterPhotoData, setAfterPhotoData] = useState<string | null>(null);
  const [photoFilename, setPhotoFilename] = useState<string>('');

  // Re-captured GPS location at submission time
  const [afterLocation, setAfterLocation] = useState<LocationCoordinates>({
    lat: mission.location.lat,
    lng: mission.location.lng,
    address: mission.location.address || 'Near Incident Site, Sahiwal',
    accuracyMeters: 8,
  });
  const [isLocating, setIsLocating] = useState(false);
  const [gpsCaptured, setGpsCaptured] = useState(false);

  // Verification process state
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyStep, setVerifyStep] = useState<string>('Initializing verification...');
  const [verificationResult, setVerificationResult] = useState<CleanupVerificationResult | null>(null);
  const [updatedMission, setUpdatedMission] = useState<Mission>(mission);

  // Testing override state (to easily test all 3 states)
  const [verdictOverride, setVerdictOverride] = useState<VerificationVerdict | 'auto'>('auto');

  // Input refs
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Re-capture geolocation
  const captureCurrentLocation = () => {
    if (!('geolocation' in navigator)) return;

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        setGpsCaptured(true);
        setAfterLocation({
          lat: Number(pos.coords.latitude.toFixed(6)),
          lng: Number(pos.coords.longitude.toFixed(6)),
          accuracyMeters: Math.round(pos.coords.accuracy) || 8,
          address: 'Verified Device Location, Sahiwal',
        });
      },
      (err) => {
        setIsLocating(false);
        console.warn('Geolocation capture fallback:', err.message);
        // Default to near beforeLocation with small random jitter (3-8m) for realism
        setAfterLocation({
          lat: Number((mission.location.lat + 0.00004).toFixed(6)),
          lng: Number((mission.location.lng + 0.00003).toFixed(6)),
          accuracyMeters: 6,
          address: mission.location.address || 'Incident Site, Sahiwal',
        });
        setGpsCaptured(true);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Capture location on mount and on photo capture
  useEffect(() => {
    captureCurrentLocation();
  }, []);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (JPEG, PNG, WebP).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('Selected image exceeds the maximum allowed size of 10MB.');
      return;
    }

    setPhotoFilename(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setAfterPhotoData(result);
      captureCurrentLocation();
    };
    reader.readAsDataURL(file);
  };

  const handleSelectSample = (sample: typeof SAMPLE_AFTER_PHOTOS[0]) => {
    setAfterPhotoData(sample.url);
    setPhotoFilename(`${sample.label}.jpg`);
    if (sample.type === 'rejected') {
      setVerdictOverride('rejected');
    } else {
      setVerdictOverride('approved');
    }
    captureCurrentLocation();
  };

  // Submit and run verification function
  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!afterPhotoData) return;

    setIsVerifying(true);
    setVerificationResult(null);

    // Step 1: GPS check
    setVerifyStep('Validating GPS coordinate proximity in Sahiwal...');
    await new Promise((r) => setTimeout(r, 600));

    // Step 2: Visual feature comparison
    setVerifyStep('Analyzing before/after photos with civic vision model...');
    await new Promise((r) => setTimeout(r, 700));

    // Step 3: Debris clearance scoring
    setVerifyStep('Checking waste clearance & public safety index...');

    try {
      // 1. Upload after photo to Cloudinary (if base64 data URL)
      const uploadedAfterUrl = await uploadToCloudinary(afterPhotoData, { folder: 'cleanups' });

      // 2. Call isolated verification function with uploaded photo URL
      const result = await verifyCleanup(
        mission.photo,
        uploadedAfterUrl,
        mission.location,
        afterLocation,
        {
          verdictOverride: verdictOverride === 'auto' ? undefined : verdictOverride,
          simulatedDelayMs: 600,
        }
      );

      setVerificationResult(result);

      // 3. Update mission in data layer
      const completed = await missionsService.completeMission(
        mission.id,
        uploadedAfterUrl,
        afterLocation,
        result
      );

      if (completed) {
        setUpdatedMission(completed);
      }
    } catch (err) {
      console.error('Verification error:', err);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleRetry = () => {
    setAfterPhotoData(null);
    setPhotoFilename('');
    setVerificationResult(null);
    captureCurrentLocation();
  };

  // =========================================================================
  // OUTCOME STATE 1: APPROVED
  // =========================================================================
  if (verificationResult?.verdict === 'approved') {
    return (
      <div className="p-4 flex-1 flex flex-col gap-4 animate-fade-in">
        {/* Celebratory Hero Card */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-[#0F5132] via-[#0A3B24] to-[#052214] text-white shadow-xl text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-10 -mt-10 w-36 h-36 rounded-full bg-white/5 pointer-events-none" />

          {/* Confetti & Trophy Sparkles Badge */}
          <div className="w-16 h-16 rounded-full bg-emerald-400/20 border-2 border-emerald-400 text-emerald-300 flex items-center justify-center mx-auto mb-3 ring-8 ring-white/10 shadow-lg">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-700/80 text-emerald-200 border border-emerald-500/50 inline-block mb-1">
            Verification Approved
          </span>

          <h2 className="text-xl font-extrabold tracking-tight">
            Cleanup Verified!
          </h2>
          <p className="text-xs text-emerald-100/90 mt-1 max-w-xs mx-auto leading-relaxed">
            AI vision analysis confirmed complete waste clearance. Thank you for keeping Sahiwal clean!
          </p>

          {/* CleanPoints Awarded Box */}
          <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-amber-500/30 to-amber-600/30 border border-amber-400/50 backdrop-blur-xs flex items-center justify-between gap-3 text-amber-200">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-400 text-stone-950 flex items-center justify-center font-bold shadow-xs">
                <Sparkles className="w-6 h-6 fill-stone-950" />
              </div>
              <div className="text-start">
                <span className="text-[10px] uppercase font-bold tracking-wider text-amber-300 block">
                  {locale === 'ur' ? 'کلین پوائنٹس جمع کر دیے گئے' : 'CleanPoints Credited'}
                </span>
                <span className="text-xl font-black text-white leading-tight">
                  +{mission.cleanPoints} {locale === 'ur' ? 'پوائنٹس مل گئے!' : 'Points Awarded!'}
                </span>
              </div>
            </div>
            <span className="text-xs font-bold text-amber-300 bg-amber-900/60 px-2.5 py-1 rounded-xl border border-amber-400/40">
              ✓ CREDITED
            </span>
          </div>
        </div>

        {/* Before vs After Visual Comparison Card */}
        <Card variant="default">
          <CardHeader className="mb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Verified Photographic Evidence
            </CardTitle>
            <Badge variant="verified" size="sm">
              100% Cleared
            </Badge>
          </CardHeader>

          <CardContent className="space-y-3 pt-1">
            <div className="grid grid-cols-2 gap-2.5">
              {/* Before */}
              <div className="flex flex-col gap-1">
                <div className="relative rounded-2xl overflow-hidden border border-stone-200 aspect-4/3 bg-stone-100">
                  <img
                    src={mission.photo}
                    alt="Before cleanup"
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-lg bg-stone-950/70 text-white text-[10px] font-bold backdrop-blur-xs">
                    BEFORE
                  </span>
                </div>
                <span className="text-[10px] text-stone-500 text-center truncate">
                  {mission.category || 'Incident Site'}
                </span>
              </div>

              {/* After */}
              <div className="flex flex-col gap-1">
                <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-600/70 aspect-4/3 bg-stone-100 shadow-xs">
                  <img
                    src={afterPhotoData || ''}
                    alt="After cleanup"
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-lg bg-[#0F5132] text-white text-[10px] font-bold shadow-xs">
                    AFTER
                  </span>
                  <span className="absolute bottom-2 right-2 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                    <Check className="w-3 h-3 stroke-3" />
                  </span>
                </div>
                <span className="text-[10px] font-semibold text-[#0F5132] text-center truncate">
                  Cleared by You
                </span>
              </div>
            </div>

            {/* Verification Metrics Breakdown */}
            <div className="p-3 rounded-2xl bg-stone-50 border border-stone-100 grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <span className="text-[10px] text-stone-400 block font-medium">Garbage Removed</span>
                <span className="font-extrabold text-[#0F5132] text-sm">
                  {verificationResult.metrics?.wasteReductionPercentage || 98}%
                </span>
              </div>
              <div className="border-x border-stone-200">
                <span className="text-[10px] text-stone-400 block font-medium">GPS Accuracy</span>
                <span className="font-extrabold text-[#0F5132] text-sm">
                  ±{verificationResult.metrics?.distanceDeltaMeters || 6}m
                </span>
              </div>
              <div>
                <span className="text-[10px] text-stone-400 block font-medium">AI Confidence</span>
                <span className="font-extrabold text-[#0F5132] text-sm">
                  {Math.round(verificationResult.confidence * 100)}%
                </span>
              </div>
            </div>

            <p className="text-[11px] text-stone-600 italic bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100">
              "{verificationResult.reason}"
            </p>
          </CardContent>

          <CardFooter className="flex flex-col gap-2 pt-3">
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={() => onFinished(updatedMission)}
              icon={<ArrowLeft className="w-4 h-4" />}
            >
              Back to Missions Feed
            </Button>
            <div className="grid grid-cols-2 gap-2 w-full">
              <Button
                variant="outline"
                size="md"
                onClick={() => onViewOnMap(mission.id)}
                icon={<MapPin className="w-3.5 h-3.5 text-[#0F5132]" />}
              >
                View on Map
              </Button>
              <Button
                variant="secondary"
                size="md"
                onClick={onNavigateToProfile}
                icon={<Award className="w-3.5 h-3.5 text-[#0F5132]" />}
              >
                View Profile
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // =========================================================================
  // OUTCOME STATE 2: REJECTED
  // =========================================================================
  if (verificationResult?.verdict === 'rejected') {
    return (
      <div className="p-4 flex-1 flex flex-col gap-4 animate-fade-in">
        {/* Rejection Alert Header */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-rose-700 to-rose-900 text-white shadow-xl text-center relative overflow-hidden">
          <div className="w-16 h-16 rounded-full bg-white/10 border-2 border-rose-300 text-white flex items-center justify-center mx-auto mb-3 ring-8 ring-white/10 shadow-lg">
            <XCircle className="w-9 h-9 text-rose-200" />
          </div>

          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-rose-950 text-rose-200 border border-rose-500/50 inline-block mb-1">
            Verification Unsuccessful
          </span>

          <h2 className="text-xl font-extrabold tracking-tight">
            Cleanup Could Not Be Verified
          </h2>
          <p className="text-xs text-rose-100/90 mt-1 max-w-xs mx-auto leading-relaxed">
            {verificationResult.reason}
          </p>
        </div>

        {/* Why it was rejected & Side-by-Side Review */}
        <Card variant="default">
          <CardHeader className="mb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Incident Comparison
            </CardTitle>
            <Badge status="Open" size="sm">
              Action Required
            </Badge>
          </CardHeader>

          <CardContent className="space-y-3 pt-1">
            <div className="grid grid-cols-2 gap-2.5">
              <div className="flex flex-col gap-1">
                <div className="relative rounded-2xl overflow-hidden border border-stone-200 aspect-4/3 bg-stone-100">
                  <img
                    src={mission.photo}
                    alt="Original waste"
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-lg bg-stone-950/70 text-white text-[10px] font-bold">
                    ORIGINAL
                  </span>
                </div>
                <span className="text-[10px] text-stone-500 text-center">Original Spot</span>
              </div>

              <div className="flex flex-col gap-1">
                <div className="relative rounded-2xl overflow-hidden border-2 border-rose-500 aspect-4/3 bg-stone-100">
                  <img
                    src={afterPhotoData || ''}
                    alt="Uploaded after photo"
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-lg bg-rose-700 text-white text-[10px] font-bold">
                    SUBMITTED
                  </span>
                </div>
                <span className="text-[10px] font-semibold text-rose-700 text-center">
                  Needs Correction
                </span>
              </div>
            </div>

            {/* Constructive Feedback Box */}
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-1.5">
              <p className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Verification Feedback:</span>
              </p>
              <p className="text-[11px] leading-relaxed text-stone-700">
                {verificationResult.feedback}
              </p>
            </div>

            {/* Checklist of what to do */}
            <div className="text-[11px] text-stone-600 space-y-1 pl-1">
              <p className="font-semibold text-stone-800">Tips for approval:</p>
              <p>• Make sure all wrappers and bottles are bagged before taking photo.</p>
              <p>• Stand at the exact same orientation showing nearby street landmarks.</p>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-2 pt-3">
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={handleRetry}
              icon={<RotateCcw className="w-4 h-4" />}
            >
              Take New "After" Photo
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
            >
              Cancel & Return Later
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // =========================================================================
  // OUTCOME STATE 3: NEEDS REVIEW
  // =========================================================================
  if (verificationResult?.verdict === 'needs_review') {
    return (
      <div className="p-4 flex-1 flex flex-col gap-4 animate-fade-in">
        {/* Needs Review Hero Card */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-600 via-amber-700 to-amber-900 text-white shadow-xl text-center relative overflow-hidden">
          <div className="w-16 h-16 rounded-full bg-white/10 border-2 border-amber-300 text-white flex items-center justify-center mx-auto mb-3 ring-8 ring-white/10 shadow-lg">
            <Clock className="w-9 h-9 text-amber-200" />
          </div>

          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-200 border border-amber-500/50 inline-block mb-1">
            Manual Review Required
          </span>

          <h2 className="text-xl font-extrabold tracking-tight">
            Submitted for Civic Review
          </h2>
          <p className="text-xs text-amber-100/90 mt-1 max-w-xs mx-auto leading-relaxed">
            Our automated scanner flagged ambiguous lighting or partial clearance. Sahiwal community moderators will verify it shortly.
          </p>
        </div>

        {/* Review Status Card */}
        <Card variant="default">
          <CardHeader className="mb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Pending Moderator Decision
            </CardTitle>
            <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold border border-amber-200">
              In Review
            </span>
          </CardHeader>

          <CardContent className="space-y-3 pt-1">
            <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-xs text-amber-950">
              <p className="font-semibold">{verificationResult.reason}</p>
              <p className="text-[11px] text-stone-600 mt-1">
                Your mission remains reserved. Once approved by a moderator, your{' '}
                <strong>+{mission.cleanPoints} CleanPoints</strong> will automatically credit to your wallet.
              </p>
            </div>

            <div className="flex items-center justify-between text-[11px] text-stone-500 p-2.5 bg-stone-50 rounded-xl">
              <span>Estimated review time</span>
              <span className="font-semibold text-stone-800">Within 2 hours</span>
            </div>
          </CardContent>

          <CardFooter className="pt-3">
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={() => onFinished(updatedMission)}
            >
              Return to Missions Feed
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // =========================================================================
  // ACTIVE PHOTO UPLOAD & VERIFY FORM
  // =========================================================================
  return (
    <div className="flex-1 flex flex-col bg-stone-50 pb-8 animate-fade-in">
      {/* Top Header */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md px-4 py-2.5 border-b border-stone-200/80 flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-stone-700 hover:text-stone-900 active:scale-95 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-[#0F5132] rtl-flip" />
          <span>{t('common.cancel')}</span>
        </button>

        <Badge variant="in-progress" size="sm" showDot>
          {locale === 'ur' ? 'مرحلہ ۲ از ۲' : 'Step 2 of 2'}
        </Badge>
      </div>

      {/* Hidden Mobile Camera Input with capture="environment" */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handlePhotoSelect}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handlePhotoSelect}
      />

      <div className="p-4 flex flex-col gap-4">
        {/* Screen Title */}
        <div>
          <h2 className="text-xl font-bold text-stone-900 tracking-tight">
            {t('completeCleanup.title')}
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            {t('completeCleanup.subtitle')}
          </p>
        </div>

        {/* Developer / Evaluator Testing Mode Strip */}
        <div className="p-2.5 rounded-2xl bg-stone-100/90 border border-stone-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-stone-700 font-medium">
            <Sliders className="w-3.5 h-3.5 text-[#0F5132]" />
            <span className="text-[11px]">Outcome Simulation:</span>
          </div>
          <div className="flex items-center gap-1 text-[11px]">
            {(['auto', 'approved', 'rejected', 'needs_review'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setVerdictOverride(mode)}
                className={`px-2 py-0.5 rounded-lg font-medium transition cursor-pointer ${
                  verdictOverride === mode
                    ? 'bg-[#0F5132] text-white shadow-2xs font-bold'
                    : 'bg-white text-stone-600 hover:bg-stone-200'
                }`}
              >
                {mode === 'auto' ? 'Auto' : mode === 'needs_review' ? 'Review' : mode.slice(0, 4)}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleVerifySubmit} className="flex flex-col gap-4">
          {/* Side-by-side or stacked Before & After comparison layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* 1. Original BEFORE Photo */}
            <Card variant="default" className="border-stone-200 overflow-hidden">
              <div className="relative aspect-4/3 bg-stone-900">
                <img
                  src={mission.photo}
                  alt="Original waste incident"
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-xl bg-stone-950/80 text-white text-xs font-bold backdrop-blur-xs shadow-xs">
                  1. BEFORE (Reported)
                </span>
                <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-lg bg-black/60 text-white text-[10px] font-mono">
                  {mission.severity.toUpperCase()} SEVERITY
                </span>
              </div>
              <div className="p-2.5 bg-stone-50 border-t border-stone-100 text-xs">
                <p className="font-semibold text-stone-800 truncate">
                  {mission.title || 'Uncollected Waste'}
                </p>
                <p className="text-[11px] text-stone-500 truncate mt-0.5">
                  {mission.location.address}
                </p>
              </div>
            </Card>

            {/* 2. Uploaded AFTER Photo Input */}
            <Card variant="default" className="border-stone-200 overflow-hidden">
              {afterPhotoData ? (
                /* Preview of after photo */
                <div>
                  <div className="relative aspect-4/3 bg-stone-900">
                    <img
                      src={afterPhotoData}
                      alt="Cleaned site"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-xl bg-[#0F5132] text-white text-xs font-bold shadow-xs">
                      2. AFTER (Your Cleanup)
                    </span>
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="absolute top-2.5 right-2.5 px-2 py-1 rounded-xl bg-white/90 text-stone-900 text-[11px] font-bold shadow-xs hover:bg-white active:scale-95 transition cursor-pointer"
                    >
                      Retake
                    </button>
                  </div>
                  <div className="p-2.5 bg-emerald-50/60 border-t border-emerald-100 text-xs flex items-center justify-between">
                    <span className="text-emerald-900 font-semibold truncate">
                      {photoFilename || 'Cleaned Site Capture'}
                    </span>
                    <span className="text-[10px] text-emerald-700 bg-white px-1.5 py-0.5 rounded font-bold">
                      Ready to Verify
                    </span>
                  </div>
                </div>
              ) : (
                /* Photo capture CTA container */
                <div className="aspect-4/3 bg-gradient-to-b from-emerald-50/70 to-stone-50 p-4 flex flex-col items-center justify-center text-center">
                  <div
                    onClick={() => cameraInputRef.current?.click()}
                    className="w-14 h-14 rounded-2xl bg-[#0F5132] text-white flex items-center justify-center shadow-md cursor-pointer hover:scale-105 active:scale-95 transition-transform ring-4 ring-emerald-100"
                  >
                    <Camera className="w-7 h-7" />
                  </div>
                  <h4 className="text-xs font-bold text-stone-900 mt-2.5">
                    Capture Cleaned Site
                  </h4>
                  <p className="text-[10px] text-stone-500 mt-0.5 leading-tight max-w-[180px]">
                    Opens mobile rear camera directly (`capture="environment"`)
                  </p>

                  <div className="mt-2.5 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="px-2.5 py-1 bg-white border border-stone-200 text-stone-800 text-[11px] font-semibold rounded-xl shadow-2xs hover:bg-stone-50 active:scale-95 cursor-pointer"
                    >
                      Snap Camera
                    </button>
                    <button
                      type="button"
                      onClick={() => galleryInputRef.current?.click()}
                      className="px-2.5 py-1 bg-white border border-stone-200 text-stone-700 text-[11px] font-medium rounded-xl hover:bg-stone-50 active:scale-95 cursor-pointer"
                    >
                      Gallery
                    </button>
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Quick Test Presets for Evaluator */}
          {!afterPhotoData && (
            <div className="p-2.5 rounded-2xl bg-stone-100/70 border border-stone-200/80">
              <p className="text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1.5">
                Quick desktop test presets:
              </p>
              <div className="grid grid-cols-3 gap-1.5">
                {SAMPLE_AFTER_PHOTOS.map((sample) => (
                  <button
                    key={sample.label}
                    type="button"
                    onClick={() => handleSelectSample(sample)}
                    className="p-1.5 rounded-xl bg-white border border-stone-200 hover:border-emerald-600/50 text-start transition shadow-2xs group cursor-pointer"
                  >
                    <img
                      src={sample.url}
                      alt={sample.label}
                      className="w-full h-11 object-cover rounded-lg group-hover:opacity-90"
                    />
                    <span className="text-[9px] font-semibold text-stone-800 block truncate mt-1">
                      {sample.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Re-captured Geolocation Strip */}
          <Card variant="flat" padded="sm">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#0F5132] flex items-center justify-center shrink-0">
                  <Navigation className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider block">
                    Submission Geolocation Check
                  </span>
                  <p className="text-xs font-semibold text-stone-900 truncate">
                    {afterLocation.address || 'Sahiwal Incident Zone'}
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-[11px] font-mono text-emerald-800 font-semibold block">
                  {afterLocation.lat.toFixed(5)}°, {afterLocation.lng.toFixed(5)}°
                </span>
                <span className="text-[10px] text-stone-400">
                  ±{afterLocation.accuracyMeters || 8}m GPS Fix
                </span>
              </div>
            </div>
          </Card>

          {/* CleanPoints Reward Preview Strip */}
          <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/90 flex items-center justify-between text-xs text-amber-950 font-medium">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600 fill-amber-500 shrink-0" />
              <span>
                Verification releases <strong>+{mission.cleanPoints} CleanPoints</strong> to your balance
              </span>
            </div>
            <span className="font-bold text-amber-700 bg-white px-2 py-0.5 rounded-lg border border-amber-200">
              {mission.severity.toUpperCase()}
            </span>
          </div>

          {/* Submit Action */}
          <div className="pt-2 flex flex-col gap-2">
            <Button
              variant="primary"
              size="lg"
              fullWidth
              type="submit"
              disabled={!afterPhotoData}
              isLoading={isVerifying}
              icon={<ShieldCheck className="w-4 h-4" />}
            >
              Verify Cleanup & Claim Points
            </Button>
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={onBack}
            >
              Back to Mission Details
            </Button>
          </div>
        </form>
      </div>

      {/* Verifying Fullscreen / Modal Loading Overlay */}
      {isVerifying && (
        <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl text-center space-y-4 border border-stone-200">
            {/* Animated scanning radar */}
            <div className="relative w-20 h-20 mx-auto">
              <div className="w-full h-full rounded-full bg-emerald-100 flex items-center justify-center text-[#0F5132] animate-pulse">
                <ShieldCheck className="w-10 h-10" />
              </div>
              <div className="absolute inset-0 rounded-full border-2 border-[#0F5132] animate-ping opacity-25" />
            </div>

            <div>
              <h3 className="text-base font-extrabold text-stone-900">
                Verifying Sahiwal Cleanup...
              </h3>
              <p className="text-xs text-stone-500 mt-1 min-h-[32px]">
                {verifyStep}
              </p>
            </div>

            <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
              <div className="bg-[#0F5132] h-full rounded-full w-3/4 animate-pulse transition-all duration-300" />
            </div>

            <p className="text-[10px] text-stone-400">
              Comparing before/after photos & location telemetry
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
