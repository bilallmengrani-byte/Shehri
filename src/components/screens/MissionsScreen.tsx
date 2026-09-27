import React, { useState, useEffect } from 'react';
import { 
  Target, 
  MapPin, 
  Sparkles, 
  ChevronRight, 
  Navigation, 
  Search
} from 'lucide-react';
import { Button } from '../ui/Button';
import { MissionDetailScreen } from '../missions/MissionDetailScreen';
import { 
  missionsService, 
  calculateDistanceKm, 
  formatDistance, 
  SAHIWAL_DEFAULT_COORDS,
  getSahiwalAnchorLocation
} from '../../services/missions';
import { CURRENT_USER } from '../../constants/mockData';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../contexts/LanguageContext';
import { Mission, TabType } from '../../types';

interface MissionsScreenProps {
  onNavigateToTab?: (tab: TabType) => void;
  onViewOnMap?: (missionId: string) => void;
  initialSelectedMissionId?: string;
}

export const MissionsScreen: React.FC<MissionsScreenProps> = ({
  onNavigateToTab,
  onViewOnMap,
  initialSelectedMissionId,
}) => {
  const { user } = useAuth();
  const { locale, isRTL, t } = useTranslation();
  const currentUserId = user?.uid || CURRENT_USER.id;

  const [missions, setMissions] = useState<Mission[]>([]);
  const [filter, setFilter] = useState<'all' | 'open' | 'in_progress' | 'mine'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);

  // User location for distance calculation
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number }>({
    lat: SAHIWAL_DEFAULT_COORDS.lat,
    lng: SAHIWAL_DEFAULT_COORDS.lng,
  });
  const [isFallbackLocation, setIsFallbackLocation] = useState(true);

  // Track GPS & validate Sahiwal radius
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const result = getSahiwalAnchorLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
          setUserCoords(result.coords);
          setIsFallbackLocation(result.isFallback);
        },
        () => {
          const fallback = getSahiwalAnchorLocation(null);
          setUserCoords(fallback.coords);
          setIsFallbackLocation(true);
        },
        { enableHighAccuracy: false, timeout: 5000 }
      );
    }
  }, []);

  // Fetch live missions
  useEffect(() => {
    const unsubscribe = missionsService.subscribe((list: Mission[]) => {
      const withDistance = list.map((m) => {
        const dist = calculateDistanceKm(
          userCoords.lat,
          userCoords.lng,
          m.location.lat,
          m.location.lng
        );
        return { ...m, distanceKm: dist };
      });

      // Sort nearest-first
      withDistance.sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));
      setMissions(withDistance);

      if (initialSelectedMissionId) {
        const found = withDistance.find((m) => m.id === initialSelectedMissionId);
        if (found) setSelectedMission(found);
      }
    });

    return () => unsubscribe();
  }, [userCoords, initialSelectedMissionId]);

  // Filter missions
  const safeMissions = Array.isArray(missions) ? missions : [];
  const filteredMissions = safeMissions.filter((m) => {
    if (filter === 'open') return m.status === 'open';
    if (filter === 'in_progress') return m.status === 'in_progress';
    if (filter === 'mine') {
      return m.reporterId === currentUserId || m.volunteerId === currentUserId;
    }
    return true;
  }).filter((m) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      m.title?.toLowerCase().includes(query) ||
      m.location?.address?.toLowerCase().includes(query) ||
      m.category?.toLowerCase().includes(query)
    );
  });

  // If a mission is selected, display the full MissionDetailScreen
  if (selectedMission) {
    return (
      <MissionDetailScreen
        mission={selectedMission}
        onBack={() => setSelectedMission(null)}
        onViewOnMap={(missionId) => {
          setSelectedMission(null);
          if (onViewOnMap) {
            onViewOnMap(missionId);
          } else if (onNavigateToTab) {
            onNavigateToTab('home');
          }
        }}
        onNavigateToProfile={() => onNavigateToTab?.('profile')}
      />
    );
  }

  return (
    <div className="p-4 flex flex-col gap-3.5 pb-12 animate-fade-in bg-stone-50 dark:bg-stone-950 transition-colors duration-200">
      {/* Screen Title & Live Missions Count */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100 tracking-tight">
              {t('missions.title')}
            </h2>
            {isFallbackLocation && (
              <span className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 text-[10px] font-bold border border-stone-200 dark:border-stone-700 flex items-center gap-1 shrink-0">
                <MapPin className="w-3 h-3 text-[#0F5132] dark:text-emerald-400" />
                <span>Showing Sahiwal view</span>
              </span>
            )}
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            {t('missions.subtitle')}
          </p>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-[#0F5132] dark:text-emerald-300 text-xs font-bold border border-emerald-300 dark:border-emerald-800/60 shrink-0">
          {safeMissions.filter((m) => m.status === 'open').length} {t('status.open')}
        </span>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-stone-400 dark:text-stone-500 absolute start-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('missions.searchPlaceholder')}
          className="w-full ps-9 pe-4 py-2.5 bg-white dark:bg-stone-900 rounded-2xl text-xs text-stone-800 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 border border-stone-200/80 dark:border-stone-800 focus:outline-none focus:ring-2 focus:ring-[#0F5132]/30 dark:focus:ring-emerald-500/30 transition shadow-2xs"
        />
      </div>

      {/* Filter Segmented Control */}
      <div className="flex items-center gap-1 p-1 bg-stone-200/70 dark:bg-stone-850 rounded-2xl border border-stone-200 dark:border-stone-800">
        <button
          onClick={() => setFilter('all')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition cursor-pointer text-center ${
            filter === 'all'
              ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
          }`}
        >
          {t('common.filter')} ({missions.length})
        </button>
        <button
          onClick={() => setFilter('open')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition cursor-pointer text-center ${
            filter === 'open'
              ? 'bg-white dark:bg-stone-900 text-[#0F5132] dark:text-emerald-400 shadow-xs'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
          }`}
        >
          {t('status.open')}
        </button>
        <button
          onClick={() => setFilter('in_progress')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition cursor-pointer text-center ${
            filter === 'in_progress'
              ? 'bg-white dark:bg-stone-900 text-amber-800 dark:text-amber-400 shadow-xs'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
          }`}
        >
          {t('status.in_progress')}
        </button>
        <button
          onClick={() => setFilter('mine')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition cursor-pointer text-center ${
            filter === 'mine'
              ? 'bg-white dark:bg-stone-900 text-emerald-900 dark:text-emerald-300 shadow-xs'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
          }`}
        >
          {t('missions.filterMine')}
        </button>
      </div>

      {/* Nearest-Sorted Mission Cards List */}
      <div className="flex flex-col gap-3">
        {filteredMissions.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xs">
            <Target className="w-10 h-10 text-stone-300 dark:text-stone-700 mx-auto mb-2" />
            <p className="text-sm font-bold text-stone-800 dark:text-stone-200">
              {t('missions.emptyState')}
            </p>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
              {t('missions.emptyStateDesc')}
            </p>
            <Button
              variant="primary"
              size="sm"
              className="mt-4"
              onClick={() => onNavigateToTab?.('report')}
            >
              {t('missions.reportNew')}
            </Button>
          </div>
        ) : (
          filteredMissions.map((m) => {
            const isReporter = m.reporterId === currentUserId;

            return (
              <div
                key={m.id}
                onClick={() => setSelectedMission(m)}
                className="p-3.5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 shadow-2xs hover:shadow-md hover:border-emerald-600/40 dark:hover:border-emerald-500/40 transition-all cursor-pointer group flex flex-col gap-2.5"
              >
                <div className="flex items-start gap-3">
                  {/* Before Photo Thumbnail */}
                  <div className="relative w-20 h-20 rounded-2xl overflow-hidden shrink-0 border border-stone-200 dark:border-stone-800 bg-stone-100 dark:bg-stone-800">
                    <img
                      src={m.photo}
                      alt={m.title || 'Waste'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <span
                      className={`absolute top-0 start-0 w-3 h-3 rounded-br-lg ${
                        m.severity === 'high'
                          ? 'bg-rose-600'
                          : m.severity === 'medium'
                          ? 'bg-amber-500'
                          : 'bg-[#0F5132] dark:bg-emerald-500'
                      }`}
                    />
                  </div>

                  {/* Mission Info Body */}
                  <div className="min-w-0 flex-1">
                    {/* Top Row: Distance & Points Reward */}
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-400 flex items-center gap-1">
                        <Navigation className="w-3 h-3 text-[#0F5132] dark:text-emerald-400" />
                        <span>{formatDistance(m.distanceKm)}</span>
                      </span>

                      <div className="px-2.5 py-0.5 rounded-xl bg-amber-500 dark:bg-amber-500 text-stone-950 dark:text-stone-950 text-xs font-black flex items-center gap-1 shadow-2xs">
                        <Sparkles className="w-3 h-3 fill-stone-950" />
                        <span>+{m.cleanPoints} pts</span>
                      </div>
                    </div>

                    {/* Mission Title */}
                    <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 leading-snug line-clamp-1 group-hover:text-[#0F5132] dark:group-hover:text-emerald-400 transition-colors">
                      {m.title || t('missions.title')}
                    </h3>
                    <p className="text-xs text-stone-500 dark:text-stone-400 flex items-center gap-1 mt-0.5 truncate">
                      <MapPin className="w-3 h-3 text-stone-400 dark:text-stone-500 shrink-0" />
                      <span className="truncate">{m.location.address}</span>
                    </p>
                  </div>
                </div>

                {/* Bottom Meta & Action */}
                <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5 text-[11px] text-stone-500 dark:text-stone-400 font-medium">
                    <span className={m.status === 'open' ? 'text-emerald-700 dark:text-emerald-400 font-bold' : 'text-amber-700 dark:text-amber-400 font-bold'}>
                      {m.status === 'open' ? t('status.open') : t('status.in_progress')}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{t(`categories.${m.category}`) || m.category}</span>
                    {isReporter && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-amber-800 dark:text-amber-300 font-bold">
                          ★ {locale === 'ur' ? 'آپ کی رپورٹ' : 'Your Report'}
                        </span>
                      </>
                    )}
                  </div>

                  <span className="font-bold text-[#0F5132] dark:text-emerald-400 flex items-center gap-0.5 text-xs group-hover:translate-x-0.5 transition-transform">
                    <span>{t('common.viewDetails')}</span>
                    <ChevronRight className="w-3.5 h-3.5 rtl-flip" />
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
