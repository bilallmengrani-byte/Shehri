import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Locate, Plus, Minus, RotateCcw } from 'lucide-react';
import { Mission, WasteHotspot } from '../../types';
import { SAHIWAL_DEFAULT_COORDS } from '../../services/missions';
import { CHRONIC_HOTSPOTS } from '../../services/userStore';

interface SahiwalLeafletMapProps {
  missions: Mission[];
  selectedMissionId?: string;
  onSelectMission: (mission: Mission) => void;
  userCoords?: { lat: number; lng: number };
  showHotspots?: boolean;
  hotspots?: WasteHotspot[];
  onSelectHotspot?: (hotspot: WasteHotspot) => void;
  selectedHotspotId?: string;
  className?: string;
  interactive?: boolean;
}

// Fix default Leaflet icon paths if any default markers are instantiated
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Generate custom HTML Leaflet divIcon based on mission severity and selection
function createCustomPin(mission: Mission, isSelected: boolean): L.DivIcon {
  const isHigh = mission.severity === 'high';
  const isMedium = mission.severity === 'medium';
  
  // Severity colors: High = rose-600, Medium = amber-500, Low = deep green #0F5132
  const bgClass = isHigh
    ? 'bg-rose-600 text-white'
    : isMedium
    ? 'bg-amber-500 text-stone-950'
    : 'bg-[#0F5132] text-white';

  const ringClass = isSelected
    ? 'ring-4 ring-emerald-500 ring-offset-2 scale-110 z-50 shadow-xl'
    : 'ring-2 ring-white hover:scale-105 shadow-md';

  const html = `
    <div class="relative flex items-center justify-center transition-all duration-200 cursor-pointer group">
      <!-- Selected Active Halo -->
      ${isSelected ? `<div class="absolute -inset-2 rounded-2xl bg-emerald-500/30 animate-ping pointer-events-none"></div>` : ''}

      <!-- Main Icon Pin Container -->
      <div class="w-9 h-9 rounded-2xl ${bgClass} flex items-center justify-center ${ringClass} transition-transform">
        ${
          mission.status === 'in_progress'
            ? `<svg class="w-4 h-4 text-current" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`
            : isHigh
            ? `<svg class="w-4 h-4 text-current" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>`
            : `<svg class="w-4 h-4 text-current" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>`
        }
      </div>

      <!-- CleanPoints Reward Pill -->
      <span class="absolute -top-2 -right-2 text-[9px] font-black px-1.5 py-0.5 bg-amber-400 text-stone-950 rounded-full border border-amber-500 shadow-xs leading-none">
        +${mission.cleanPoints}
      </span>

      <!-- Pin bottom pointer triangle -->
      <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 ${bgClass.split(' ')[0]}"></div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'shehri-custom-pin',
    iconSize: [36, 36],
    iconAnchor: [18, 36],
  });
}

// Generate chronic recurring hotspot marker icon
function createHotspotIcon(hotspot: WasteHotspot, isSelected: boolean): L.DivIcon {
  const ringClass = isSelected
    ? 'ring-4 ring-rose-500 ring-offset-2 scale-110 z-50'
    : 'ring-2 ring-white hover:scale-105 shadow-lg';

  const html = `
    <div class="relative flex items-center justify-center cursor-pointer transition-all duration-200">
      <div class="absolute -inset-2 rounded-full bg-rose-600/25 animate-ping pointer-events-none"></div>
      
      <div class="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-600 to-rose-950 text-white flex items-center justify-center shadow-xl ${ringClass} border border-rose-300">
        <svg class="w-5 h-5 text-amber-300 animate-pulse" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2c1.171 3.513 4 5.5 4 8.5 0 3.038-2.462 5.5-5.5 5.5S5 13.538 5 10.5C5 7.5 7.829 5.513 9 2c1 2 2 3 3 0z"/>
        </svg>
      </div>

      <span class="absolute -top-2 -right-2 text-[9px] font-black px-1.5 py-0.5 bg-rose-700 text-white rounded-full border border-white shadow-sm leading-none">
        ${hotspot.reportCount}×
      </span>
      <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-rose-950"></div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'shehri-hotspot-pin',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
  });
}

// User location pulse pin
function createUserLocationIcon(): L.DivIcon {
  const html = `
    <div class="relative flex items-center justify-center">
      <div class="w-4 h-4 rounded-full bg-blue-600 ring-4 ring-blue-300 shadow-md"></div>
      <div class="absolute w-8 h-8 rounded-full bg-blue-400/30 animate-ping pointer-events-none"></div>
    </div>
  `;
  return L.divIcon({
    html,
    className: 'shehri-user-pin',
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

export const SahiwalLeafletMap: React.FC<SahiwalLeafletMapProps> = ({
  missions,
  selectedMissionId,
  onSelectMission,
  userCoords,
  showHotspots = false,
  hotspots = CHRONIC_HOTSPOTS,
  onSelectHotspot,
  selectedHotspotId,
  className = 'h-full w-full',
  interactive = true,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const hotspotsLayerRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const initialLat = SAHIWAL_DEFAULT_COORDS.lat;
      const initialLng = SAHIWAL_DEFAULT_COORDS.lng;

      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: 14,
        zoomControl: false, // Custom styled zoom controls
        attributionControl: false,
        dragging: interactive,
        scrollWheelZoom: interactive ? 'center' : false,
        touchZoom: interactive,
        doubleClickZoom: interactive,
      });

      // 100% Free OpenStreetMap Tile Layer (No API key required)
      const tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        subdomains: ['a', 'b', 'c'],
        attribution: '&copy; OpenStreetMap contributors',
      });

      tiles.addTo(map);

      // Small OSM attribution
      L.control
        .attribution({
          position: 'bottomright',
          prefix: false,
        })
        .addAttribution('&copy; <a href="https://openstreetmap.org" class="text-[9px] text-stone-400">OSM</a>')
        .addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      hotspotsLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;

      // Invalidate size after layout renders
      const t1 = setTimeout(() => map.invalidateSize(), 150);
      const t2 = setTimeout(() => map.invalidateSize(), 500);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [interactive]);

  // Handle ResizeObserver to keep Leaflet map tiles perfectly sized
  useEffect(() => {
    if (!mapContainerRef.current) return;
    const observer = new ResizeObserver(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    });
    observer.observe(mapContainerRef.current);
    return () => observer.disconnect();
  }, []);

  // Update Mission Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layer = markersLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();

    missions.forEach((mission) => {
      const isSelected = mission.id === selectedMissionId;
      const icon = createCustomPin(mission, isSelected);

      const marker = L.marker([mission.location.lat, mission.location.lng], {
        icon,
        opacity: showHotspots ? 0.35 : 1,
        zIndexOffset: isSelected ? 1000 : 0,
      });

      marker.on('click', () => {
        onSelectMission(mission);
        // Pan offset so pin stays above bottom sheet
        map.panTo([mission.location.lat - 0.002, mission.location.lng], { animate: true, duration: 0.4 });
      });

      marker.addTo(layer);
    });

    // Update user marker if coordinates available
    if (userCoords) {
      if (!userMarkerRef.current) {
        userMarkerRef.current = L.marker([userCoords.lat, userCoords.lng], {
          icon: createUserLocationIcon(),
          zIndexOffset: 500,
        }).addTo(map);
      } else {
        userMarkerRef.current.setLatLng([userCoords.lat, userCoords.lng]);
      }
    }
  }, [missions, selectedMissionId, userCoords, onSelectMission, showHotspots]);

  // Auto-pan map when selectedMissionId changes externally
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedMissionId || showHotspots) return;

    const matched = missions.find((m) => m.id === selectedMissionId);
    if (matched) {
      map.panTo([matched.location.lat - 0.002, matched.location.lng], {
        animate: true,
        duration: 0.4,
      });
    }
  }, [selectedMissionId, missions, showHotspots]);

  // Update Chronic Hotspots Layer
  useEffect(() => {
    const map = mapInstanceRef.current;
    const hotspotLayer = hotspotsLayerRef.current;
    if (!map || !hotspotLayer) return;

    hotspotLayer.clearLayers();

    if (showHotspots) {
      hotspots.forEach((spot) => {
        const isSelected = spot.id === selectedHotspotId;
        const icon = createHotspotIcon(spot, isSelected);

        // Draw radial heat circle
        const radiusMeters = spot.reportCount * 45;
        const heatCircle = L.circle([spot.lat, spot.lng], {
          color: '#E11D48',
          fillColor: '#F43F5E',
          fillOpacity: 0.16,
          weight: 1.5,
          dashArray: '4, 4',
          radius: radiusMeters,
        });
        heatCircle.addTo(hotspotLayer);

        // Hotspot Pin Marker
        const marker = L.marker([spot.lat, spot.lng], {
          icon,
          zIndexOffset: isSelected ? 2000 : 1500,
        });

        marker.on('click', () => {
          if (onSelectHotspot) onSelectHotspot(spot);
          map.panTo([spot.lat - 0.002, spot.lng], { animate: true, duration: 0.4 });
        });

        marker.addTo(hotspotLayer);
      });
    }
  }, [showHotspots, hotspots, selectedHotspotId, onSelectHotspot]);

  // Auto-pan map when selectedHotspotId changes externally
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedHotspotId || !showHotspots) return;

    const targetSpot = hotspots.find((h) => h.id === selectedHotspotId);
    if (targetSpot) {
      map.panTo([targetSpot.lat - 0.002, targetSpot.lng], {
        animate: true,
        duration: 0.4,
      });
    }
  }, [selectedHotspotId, showHotspots, hotspots]);

  // Handler to recenter on Sahiwal Center / User
  const handleRecenter = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.invalidateSize();
    const targetLat = userCoords?.lat || SAHIWAL_DEFAULT_COORDS.lat;
    const targetLng = userCoords?.lng || SAHIWAL_DEFAULT_COORDS.lng;
    map.flyTo([targetLat - 0.0015, targetLng], 14, { duration: 0.6 });
  };

  const handleZoomIn = () => {
    mapInstanceRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapInstanceRef.current?.zoomOut();
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div ref={mapContainerRef} className="w-full h-full min-h-[300px]" />

      {/* Floating Map Controls (Zoom In, Zoom Out, Recenter) */}
      {interactive && (
        <div className="absolute end-3 top-16 z-20 flex flex-col gap-1.5">
          <button
            type="button"
            onClick={handleRecenter}
            className="w-9 h-9 rounded-xl bg-white/95 backdrop-blur-md text-stone-800 border border-stone-200 shadow-md flex items-center justify-center hover:bg-stone-50 active:scale-95 transition cursor-pointer"
            title="Recenter on Sahiwal"
          >
            <Locate className="w-4 h-4 text-[#0F5132]" />
          </button>

          <div className="flex flex-col rounded-xl bg-white/95 backdrop-blur-md border border-stone-200 shadow-md overflow-hidden">
            <button
              type="button"
              onClick={handleZoomIn}
              className="w-9 h-8 text-stone-800 hover:bg-stone-100 flex items-center justify-center border-b border-stone-100 active:bg-stone-200 transition cursor-pointer font-bold"
              title="Zoom In"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleZoomOut}
              className="w-9 h-8 text-stone-800 hover:bg-stone-100 flex items-center justify-center active:bg-stone-200 transition cursor-pointer font-bold"
              title="Zoom Out"
            >
              <Minus className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
