import React, { useState, useEffect } from 'react';
import { 
  Flame, 
  MapPin, 
  Sparkles, 
  ArrowRight, 
  Navigation, 
  CheckCircle2, 
  ChevronUp,
  ChevronDown,
  Clock,
  Layers,
  Info,
  X
} from 'lucide-react';
import { Mission, TabType, WasteHotspot } from '../../types';
import { SahiwalLeafletMap } from '../map/SahiwalLeafletMap';
import { CHRONIC_HOTSPOTS } from '../../services/userStore';
import { SAHIWAL_DEFAULT_COORDS, formatDistance, missionsService, getSahiwalAnchorLocation } from '../../services/missions';
import { useTranslation } from '../../contexts/LanguageContext';
import { Button } from '../ui/Button';
import { MissionDetailScreen } from '../missions/MissionDetailScreen';

interface HomeScreenProps {
  missions?: Mission[];
  onNavigateToTab: (tab: TabType) => void;
  activeMissionId?: string;
  focusedReportId?: string;
  setActiveMissionId?: (id: string) => void;
  onOpenMissionDetail?: (missionId: string) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  missions: propMissions,
  onNavigateToTab,
  activeMissionId: propActiveMissionId,
  focusedReportId,
  setActiveMissionId: propSetActiveMissionId,
  onOpenMissionDetail,
}) => {
  const { locale, isRTL, t } = useTranslation();

  // Internal missions fallback if not passed directly via props
  const [internalMissions, setInternalMissions] = useState<Mission[]>(propMissions || []);
  const [internalActiveMissionId, setInternalActiveMissionId] = useState<string | undefined>(
    propActiveMissionId || focusedReportId
  );

  useEffect(() => {
    if (focusedReportId) {
      setInternalActiveMissionId(focusedReportId);
    }
  }, [focusedReportId]);

  useEffect(() => {
    if (propMissions && propMissions.length > 0) return;
    const unsub = missionsService.subscribe((list) => {
      setInternalMissions(list);
    });
    return () => unsub();
  }, [propMissions]);

  const missions = (propMissions && propMissions.length > 0) ? propMissions : internalMissions;
  const activeMissionId = propActiveMissionId || internalActiveMissionId;
  const setActiveMissionId = (id: string) => {
    setInternalActiveMissionId(id);
    propSetActiveMissionId?.(id);
  };

  // Filter state: 'All' | 'open' | 'high' | 'medium' | 'low'
  const [selectedFilter, setSelectedFilter] = useState<'All' | 'open' | 'high' | 'medium' | 'low'>('All');
  
  // Chronic Hotspots toggle
  const [showHotspots, setShowHotspots] = useState(false);
  const [selectedHotspot, setSelectedHotspot] = useState<WasteHotspot | null>(null);

  // Bottom Sheet expansion state: false (peek mode) | true (expanded full list)
  const [sheetExpanded, setSheetExpanded] = useState(false);

  // Legend collapsible toggle
  const [showLegendDetails, setShowLegendDetails] = useState(false);

  // Detail inspection view state
  const [inspectingMission, setInspectingMission] = useState<Mission | null>(null);

  // User GPS coordinates (Defaults to Sahiwal center if denied/unavailable or outside 50km radius)
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number }>({
    lat: SAHIWAL_DEFAULT_COORDS.lat,
    lng: SAHIWAL_DEFAULT_COORDS.lng,
  });
  const [isFallbackLocation, setIsFallbackLocation] = useState(true);

  // Check browser live location; fallback to Sahiwal if outside radius or unavailable
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

  // Filter missions
  const safeMissions = Array.isArray(missions) ? missions : [];
  const filteredMissions = safeMissions.filter((m) => {
    if (selectedFilter === 'All') return true;
    if (selectedFilter === 'open') return m.status === 'open';
    if (selectedFilter === 'high') return m.severity === 'high';
    if (selectedFilter === 'medium') return m.severity === 'medium';
    if (selectedFilter === 'low') return m.severity === 'low';
    return true;
  });

  const activeMission = safeMissions.find((m) => m.id === activeMissionId) || filteredMissions[0] || safeMissions[0];

  // If inspecting a mission directly on Home tab
  if (inspectingMission) {
    return (
      <MissionDetailScreen
        mission={inspectingMission}
        onBack={() => setInspectingMission(null)}
        onViewOnMap={(missionId) => {
          setInspectingMission(null);
          setActiveMissionId(missionId);
        }}
        onNavigateToProfile={() => onNavigateToTab('profile')}
      />
    );
  }

  return (
    <div className="flex-1 flex flex-col relative h-[calc(100vh-116px)] overflow-hidden bg-stone-100 dark:bg-stone-950 animate-fade-in transition-colors duration-200">
      {/* 1. Refined Filter Bar: Single Clean Row with Fluid Scroll and Clear Labels */}
      <div className="z-20 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-b border-stone-200/90 dark:border-stone-800 px-3.5 py-2 shadow-2xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
          {/* Chronic Hotspots Toggle Pill */}
          <button
            type="button"
            onClick={() => {
              const next = !showHotspots;
              setShowHotspots(next);
              if (next && !selectedHotspot) {
                setSelectedHotspot(CHRONIC_HOTSPOTS[0]);
              }
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95 ${
              showHotspots
                ? 'bg-rose-600 text-white shadow-xs ring-2 ring-rose-300 dark:ring-rose-800'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 border border-stone-200/90 dark:border-stone-700'
            }`}
          >
            <Flame
              className={`w-3.5 h-3.5 ${
                showHotspots ? 'text-amber-300 fill-amber-300' : 'text-rose-500 dark:text-rose-400'
              }`}
            />
            <span className="whitespace-nowrap">{t('home.chronicHotspots')}</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-950/30 text-white">
              {CHRONIC_HOTSPOTS.length}
            </span>
          </button>

          <div className="w-px h-5 bg-stone-200 dark:bg-stone-800 mx-0.5 shrink-0" />

          {/* Standard Filter Chips */}
          <button
            type="button"
            onClick={() => setSelectedFilter('All')}
            className={`px-3 py-1.5 rounded-full whitespace-nowrap text-xs font-bold transition cursor-pointer shrink-0 ${
              selectedFilter === 'All'
                ? 'bg-[#0F5132] dark:bg-emerald-600 text-white shadow-xs'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 border border-stone-200/80 dark:border-stone-700'
            }`}
          >
            {t('home.filterAll')} ({missions.length})
          </button>

          <button
            type="button"
            onClick={() => setSelectedFilter('open')}
            className={`px-3 py-1.5 rounded-full whitespace-nowrap text-xs font-bold transition cursor-pointer shrink-0 ${
              selectedFilter === 'open'
                ? 'bg-[#0F5132] dark:bg-emerald-600 text-white shadow-xs'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 border border-stone-200/80 dark:border-stone-700'
            }`}
          >
            {t('status.open')} ({safeMissions.filter((m) => m.status === 'open').length})
          </button>

          <button
            type="button"
            onClick={() => setSelectedFilter('high')}
            className={`px-3 py-1.5 rounded-full whitespace-nowrap text-xs font-bold transition cursor-pointer shrink-0 flex items-center gap-1 ${
              selectedFilter === 'high'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 border border-stone-200/80 dark:border-stone-700'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-600 shrink-0" />
            <span>{t('severity.highShort')} (+50)</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedFilter('medium')}
            className={`px-3 py-1.5 rounded-full whitespace-nowrap text-xs font-bold transition cursor-pointer shrink-0 flex items-center gap-1 ${
              selectedFilter === 'medium'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 border border-stone-200/80 dark:border-stone-700'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
            <span>{t('severity.mediumShort')} (+25)</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedFilter('low')}
            className={`px-3 py-1.5 rounded-full whitespace-nowrap text-xs font-bold transition cursor-pointer shrink-0 flex items-center gap-1 ${
              selectedFilter === 'low'
                ? 'bg-[#0F5132] dark:bg-emerald-600 text-white shadow-xs'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 border border-stone-200/80 dark:border-stone-700'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#0F5132] dark:bg-emerald-400 shrink-0" />
            <span>{t('severity.lowShort')} (+10)</span>
          </button>
        </div>
      </div>

      {/* 2. Interactive Map Viewport with Balanced Spatial Presence */}
      <div className="relative flex-1 w-full overflow-hidden select-none bg-stone-200 dark:bg-stone-900">
        <SahiwalLeafletMap
          missions={filteredMissions}
          selectedMissionId={activeMission?.id}
          onSelectMission={(m) => {
            setActiveMissionId(m.id);
            setSelectedHotspot(null);
          }}
          userCoords={userCoords}
          showHotspots={showHotspots}
          hotspots={CHRONIC_HOTSPOTS}
          selectedHotspotId={selectedHotspot?.id}
          onSelectHotspot={(spot) => {
            setSelectedHotspot(spot);
          }}
          className="h-full w-full"
        />

        {/* GPS Status Pill: Top-Start Corner */}
        <div className="absolute top-3 start-3 z-20 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md rounded-xl px-2.5 py-1 text-[10px] font-semibold text-stone-700 dark:text-stone-200 border border-stone-200/90 dark:border-stone-800 shadow-2xs pointer-events-none flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <span>{isFallbackLocation ? 'Showing Sahiwal view' : 'Sahiwal Radar'}</span>
          <span className="text-stone-400 dark:text-stone-500">· {filteredMissions.length} spots</span>
        </div>

        {/* Floating Corner Legend Badge */}
        <div className="absolute top-3 end-3 z-20">
          <button
            type="button"
            onClick={() => setShowLegendDetails(!showLegendDetails)}
            className="bg-white/95 dark:bg-stone-900/95 backdrop-blur-md rounded-2xl px-2.5 py-1 text-[10px] text-stone-700 dark:text-stone-200 border border-stone-200/90 dark:border-stone-800 shadow-sm flex items-center gap-1.5 cursor-pointer hover:bg-white dark:hover:bg-stone-900 active:scale-95 transition"
            title="Map points legend"
          >
            {showHotspots ? (
              <span className="flex items-center gap-1 font-bold text-rose-700 dark:text-rose-400">
                <Flame className="w-3 h-3 text-rose-600 fill-rose-500" />
                <span>Hotspots</span>
              </span>
            ) : (
              <div className="flex items-center gap-1.5 font-bold">
                <span className="flex items-center gap-0.5 text-rose-700 dark:text-rose-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-600" /> 50pt
                </span>
                <span className="text-stone-300 dark:text-stone-700">·</span>
                <span className="flex items-center gap-0.5 text-amber-700 dark:text-amber-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> 25pt
                </span>
                <span className="text-stone-300 dark:text-stone-700">·</span>
                <span className="flex items-center gap-0.5 text-emerald-800 dark:text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0F5132] dark:bg-emerald-500" /> 10pt
                </span>
              </div>
            )}
          </button>
        </div>
      </div>

      {/* 3. Draggable / Expandable Bottom Sheet for Mission Action Card */}
      <div 
        className={`absolute start-0 end-0 bottom-0 z-30 bg-white dark:bg-stone-900 rounded-t-3xl shadow-[0_-8px_30px_rgba(0,0,0,0.12)] border-t border-stone-200 dark:border-stone-800 transition-all duration-300 flex flex-col ${
          sheetExpanded ? 'h-[78%]' : 'h-[250px]'
        }`}
      >
        {/* Drag Handle Bar & Section Header */}
        <div 
          onClick={() => setSheetExpanded(!sheetExpanded)}
          className="p-2.5 pb-1 flex flex-col items-center justify-center cursor-pointer select-none hover:bg-stone-50/80 dark:hover:bg-stone-800/80 transition rounded-t-3xl"
        >
          <div className="w-10 h-1 rounded-full bg-stone-300 dark:bg-stone-700 mb-1" />
          
          <div className="w-full px-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800 dark:text-stone-200">
              <MapPin className="w-3.5 h-3.5 text-[#0F5132] dark:text-emerald-400" />
              <span>{showHotspots ? 'Chronic Hotspot Target' : t('home.nearbyMissions')}</span>
              <span className="px-1.5 py-0.2 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 text-[10px] font-bold">
                {showHotspots ? CHRONIC_HOTSPOTS.length : filteredMissions.length}
              </span>
            </div>

            <button
              type="button"
              className="text-[11px] font-bold text-[#0F5132] dark:text-emerald-400 flex items-center gap-0.5 hover:underline"
            >
              <span>{sheetExpanded ? t('common.close') : t('missions.filterAll')}</span>
              {sheetExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Bottom Sheet Content Body */}
        <div className="px-3.5 pb-3 overflow-y-auto flex-1 space-y-2.5">
          {showHotspots && selectedHotspot ? (
            /* CHRONIC HOTSPOT SPOTLIGHT CARD */
            <div className="rounded-2xl border-2 border-rose-300 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/30 p-3 shadow-xs space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="px-2 py-0.5 rounded-md bg-rose-600 text-white text-[10px] font-extrabold flex items-center gap-1">
                      <Flame className="w-3 h-3 fill-white" />
                      <span>HOTSPOT</span>
                    </span>
                    <span className="text-[10px] font-bold text-rose-800 dark:text-rose-300">
                      {selectedHotspot.reportCount}× reports
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">{selectedHotspot.name}</h4>
                  <p className="text-xs text-stone-600 dark:text-stone-400 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-[#0F5132] dark:text-emerald-400 shrink-0" />
                    <span>{selectedHotspot.landmark}</span>
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-black text-rose-700 dark:text-rose-400 block">
                    ~{selectedHotspot.totalKgEstimated} kg
                  </span>
                  <span className="text-[10px] text-stone-500 dark:text-stone-400">waste diverted</span>
                </div>
              </div>

              <div className="p-2 rounded-xl bg-white dark:bg-stone-850 border border-rose-200 dark:border-rose-900/40 text-stone-700 dark:text-stone-300 text-xs leading-relaxed">
                <span className="font-bold text-rose-900 dark:text-rose-300 block text-[10px] mb-0.5">Issue Pattern:</span>
                {selectedHotspot.recurringIssue}
              </div>

              <div className="flex items-center justify-between gap-2 pt-0.5">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowHotspots(false)}
                  className="text-xs flex-1 py-1.5"
                >
                  View Mission Pins
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    const matched = missions.find(
                      (m) =>
                        m.location.address?.toLowerCase().includes(selectedHotspot.name.toLowerCase().split(' ')[0]) ||
                        m.title?.toLowerCase().includes(selectedHotspot.name.toLowerCase().split(' ')[0])
                    );
                    if (matched) {
                      setInspectingMission(matched);
                    } else {
                      onNavigateToTab('missions');
                    }
                  }}
                  className="text-xs flex-1 py-1.5"
                >
                  <span>{t('home.inspectHotspot')}</span>
                  <ArrowRight className="w-3.5 h-3.5 rtl-flip" />
                </Button>
              </div>
            </div>
          ) : (
            /* SELECTED MISSION CARD */
            activeMission && (
              <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-3 shadow-xs space-y-2">
                <div className="flex items-start justify-between gap-2.5">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 text-[10px] text-stone-500 dark:text-stone-400 mb-0.5 font-medium">
                      <span>{t(`categories.${activeMission.category}`) || activeMission.category}</span>
                      <span aria-hidden="true">·</span>
                      <span className={activeMission.status === 'open' ? 'text-emerald-700 dark:text-emerald-400 font-bold' : 'text-amber-700 dark:text-amber-400 font-bold'}>
                        {activeMission.status === 'open' ? t('status.open') : t('status.inProgress')}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 leading-snug truncate">
                      {activeMission.title}
                    </h3>
                    <p className="text-xs text-stone-500 dark:text-stone-400 flex items-center gap-1 mt-0.5 truncate">
                      <MapPin className="w-3 h-3 text-stone-400 dark:text-stone-500 shrink-0" />
                      <span className="truncate">{activeMission.location.address}</span>
                    </p>
                  </div>

                  <div className="flex flex-col items-end shrink-0">
                    <span className="px-2.5 py-1 rounded-xl bg-amber-500 dark:bg-amber-500 text-stone-950 dark:text-stone-950 text-xs font-black flex items-center gap-1 shadow-2xs border border-amber-600/20">
                      <Sparkles className="w-3 h-3 fill-stone-950" />
                      +{activeMission.cleanPoints} pts
                    </span>
                    <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-400 mt-1 flex items-center gap-0.5">
                      <Navigation className="w-3 h-3 text-[#0F5132] dark:text-emerald-400" />
                      <span>{formatDistance(activeMission.distanceKm)}</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 p-2 bg-stone-50 dark:bg-stone-850 rounded-xl border border-stone-100 dark:border-stone-800">
                  <img
                    src={activeMission.photo}
                    alt={activeMission.title}
                    className="w-12 h-12 rounded-xl object-cover border border-stone-200 dark:border-stone-700 shrink-0"
                  />
                  <div className="min-w-0 flex-1 text-xs">
                    <p className="text-stone-700 dark:text-stone-300 line-clamp-1 leading-relaxed">
                      {activeMission.description || t('missions.emptyStateDesc')}
                    </p>
                    <p className="text-[10px] text-stone-400 dark:text-stone-500 mt-0.5">
                      {t('missions.reportedBy')} {activeMission.reporterName || 'Citizen'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-0.5">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex-1 text-xs py-1.5"
                    onClick={() => onNavigateToTab('missions')}
                  >
                    {t('missions.filterAll')}
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    className="flex-1 text-xs py-1.5"
                    onClick={() => setInspectingMission(activeMission)}
                  >
                    <span>{t('home.acceptMission')}</span>
                    <ArrowRight className="w-3.5 h-3.5 rtl-flip" />
                  </Button>
                </div>
              </div>
            )
          )}

          {sheetExpanded && (
            <div className="space-y-2 pt-2 border-t border-stone-200 dark:border-stone-800">
              <h4 className="text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider">
                All Filtered Spots ({filteredMissions.length})
              </h4>
              <div className="space-y-2">
                {filteredMissions
                  .filter((m) => m.id !== activeMission?.id)
                  .map((mission) => (
                    <div
                      key={mission.id}
                      onClick={() => {
                        setActiveMissionId(mission.id);
                        setSheetExpanded(false);
                      }}
                      className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-850 hover:bg-stone-100/80 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-800 flex items-center justify-between gap-3 cursor-pointer transition active:scale-98"
                    >
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">
                          {mission.title}
                        </h4>
                        <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate mt-0.5">
                          {mission.location.address}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-lg border border-amber-200 dark:border-amber-800/60">
                          +{mission.cleanPoints} pts
                        </span>
                        <span className="text-[10px] text-stone-500 dark:text-stone-400">
                          {formatDistance(mission.distanceKm)}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
