import React, { useState, useRef } from 'react';
import { 
  MapPin, 
  Navigation, 
  RotateCcw, 
  ArrowUp, 
  ArrowDown, 
  ArrowLeft, 
  ArrowRight,
  Crosshair,
  CheckCircle2
} from 'lucide-react';
import { LocationCoordinates } from '../../types';

interface LocationPinPreviewProps {
  location: LocationCoordinates;
  onChange: (updated: LocationCoordinates) => void;
  onResetGps?: () => void;
  isLocating?: boolean;
}

export const LocationPinPreview: React.FC<LocationPinPreviewProps> = ({
  location,
  onChange,
  onResetGps,
  isLocating = false,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isNudging, setIsNudging] = useState(false);

  // Offset in percentage (-40% to +40% from center 50%)
  const offsetX = location.nudgeOffsetX ?? 0;
  const offsetY = location.nudgeOffsetY ?? 0;

  const pinX = 50 + offsetX;
  const pinY = 50 + offsetY;

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mapRef.current) return;
    const rect = mapRef.current.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * 100;
    const clickY = ((e.clientY - rect.top) / rect.height) * 100;

    // Constrain within 10% - 90%
    const boundedX = Math.max(12, Math.min(88, clickX));
    const boundedY = Math.max(12, Math.min(88, clickY));

    const newOffsetX = Math.round(boundedX - 50);
    const newOffsetY = Math.round(boundedY - 50);

    // Approximate lat/lng delta (approx 0.0001 deg per 10% offset)
    const latDelta = -(newOffsetY * 0.00003);
    const lngDelta = (newOffsetX * 0.00003);

    onChange({
      ...location,
      lat: Number((location.lat + latDelta).toFixed(6)),
      lng: Number((location.lng + lngDelta).toFixed(6)),
      nudgeOffsetX: newOffsetX,
      nudgeOffsetY: newOffsetY,
      address: location.address || 'Near Goal Chowk, Sahiwal',
    });
  };

  const handleNudge = (dx: number, dy: number) => {
    const newOffsetX = Math.max(-35, Math.min(35, offsetX + dx));
    const newOffsetY = Math.max(-35, Math.min(35, offsetY + dy));

    const latDelta = -(dy * 0.00003);
    const lngDelta = (dx * 0.00003);

    onChange({
      ...location,
      lat: Number((location.lat + latDelta).toFixed(6)),
      lng: Number((location.lng + lngDelta).toFixed(6)),
      nudgeOffsetX: newOffsetX,
      nudgeOffsetY: newOffsetY,
    });
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Header and status */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 font-semibold text-stone-900">
          <MapPin className="w-3.5 h-3.5 text-[#0F5132]" />
          <span>Incident Location</span>
          {isLocating && (
            <span className="text-[10px] text-emerald-800 font-normal animate-pulse">
              (Acquiring GPS fix...)
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setIsNudging(!isNudging)}
          className="text-[11px] font-semibold text-[#0F5132] hover:underline flex items-center gap-1 cursor-pointer"
        >
          <Crosshair className="w-3 h-3" />
          {isNudging ? 'Done Nudging' : 'Nudge Pin'}
        </button>
      </div>

      {/* Embedded Map Visual Canvas */}
      <div
        ref={mapRef}
        onClick={handleMapClick}
        className="relative h-44 w-full rounded-2xl bg-[#E8EFE9] border border-stone-200 overflow-hidden cursor-crosshair select-none shadow-inner"
        title="Tap anywhere to reposition pin"
      >
        {/* Stylized Sahiwal Vector Map Grid */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-50">
          <defs>
            <pattern id="nudgeGrid" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#D1D5DB" strokeWidth="0.8" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#nudgeGrid)" />
          {/* Roads */}
          <path d="M 0,80 L 400,90" stroke="#FFFFFF" strokeWidth="12" />
          <path d="M 120,0 L 150,200" stroke="#FFFFFF" strokeWidth="10" />
          <path d="M 280,0 L 250,200" stroke="#FFFFFF" strokeWidth="8" />
          {/* Canal line */}
          <path d="M -10,140 Q 150,160 380,120" stroke="#BAE6FD" strokeWidth="6" fill="none" />
        </svg>

        {/* Landmarks Labels */}
        <div className="absolute top-2 left-3 pointer-events-none">
          <span className="text-[9px] font-bold text-stone-500 uppercase tracking-wider bg-white/80 px-1 py-0.5 rounded shadow-2xs">
            Goal Chowk
          </span>
        </div>
        <div className="absolute bottom-2 right-3 pointer-events-none">
          <span className="text-[9px] font-bold text-stone-500 uppercase tracking-wider bg-white/80 px-1 py-0.5 rounded shadow-2xs">
            High Street
          </span>
        </div>

        {/* GPS Radius Accuracy Ring */}
        <div
          style={{ left: `${pinX}%`, top: `${pinY}%` }}
          className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-all duration-150"
        >
          <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-600/30 animate-pulse" />
        </div>

        {/* The Map Pin */}
        <div
          style={{ left: `${pinX}%`, top: `${pinY}%` }}
          className="absolute -translate-x-1/2 -translate-y-full z-20 pointer-events-none transition-all duration-150"
        >
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-[#0F5132] text-white flex items-center justify-center shadow-lg ring-2 ring-white">
              <MapPin className="w-4 h-4 fill-white" />
            </div>
            <div className="w-1.5 h-2 bg-[#0F5132] -mt-0.5 rounded-b-xs" />
            <div className="w-2.5 h-1 bg-stone-900/30 rounded-full blur-2xs mt-0.5" />
          </div>
        </div>

        {/* Tap to Reposition Hint */}
        <div className="absolute bottom-2 start-2 z-10 bg-white/90 backdrop-blur-2xs rounded-lg px-2 py-0.5 text-[10px] text-stone-600 border border-stone-200/80 shadow-2xs flex items-center gap-1 pointer-events-none">
          <Crosshair className="w-2.5 h-2.5 text-[#0F5132]" />
          <span>Tap anywhere to adjust</span>
        </div>

        {/* Re-center GPS button */}
        {onResetGps && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onResetGps();
            }}
            className="absolute top-2 end-2 z-10 w-7 h-7 rounded-xl bg-white/95 text-stone-700 hover:text-emerald-800 border border-stone-200 shadow-xs flex items-center justify-center transition active:scale-95 cursor-pointer"
            title="Snap to current GPS location"
          >
            <Navigation className="w-3.5 h-3.5 text-[#0F5132]" />
          </button>
        )}
      </div>

      {/* Directional Nudge Controller (when nudge mode is active) */}
      {isNudging && (
        <div className="p-2.5 rounded-2xl bg-stone-100/90 border border-stone-200 flex items-center justify-between gap-3 animate-fade-in">
          <div className="text-[11px] text-stone-600">
            <p className="font-semibold text-stone-800">Fine-tune Pin Position</p>
            <p className="text-[10px] text-stone-500">Step 3-5 meters per tap</p>
          </div>

          <div className="grid grid-cols-3 gap-1">
            <div />
            <button
              type="button"
              onClick={() => handleNudge(0, -6)}
              className="w-8 h-8 rounded-xl bg-white border border-stone-200 flex items-center justify-center text-stone-700 hover:bg-stone-50 active:bg-stone-200 transition shadow-2xs cursor-pointer"
              title="Nudge North"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
            <div />

            <button
              type="button"
              onClick={() => handleNudge(-6, 0)}
              className="w-8 h-8 rounded-xl bg-white border border-stone-200 flex items-center justify-center text-stone-700 hover:bg-stone-50 active:bg-stone-200 transition shadow-2xs cursor-pointer"
              title="Nudge West"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                onChange({
                  ...location,
                  nudgeOffsetX: 0,
                  nudgeOffsetY: 0,
                });
              }}
              className="w-8 h-8 rounded-xl bg-white border border-stone-200 flex items-center justify-center text-stone-600 hover:bg-stone-50 active:bg-stone-200 transition shadow-2xs text-[10px] font-bold cursor-pointer"
              title="Reset offset"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => handleNudge(6, 0)}
              className="w-8 h-8 rounded-xl bg-white border border-stone-200 flex items-center justify-center text-stone-700 hover:bg-stone-50 active:bg-stone-200 transition shadow-2xs cursor-pointer"
              title="Nudge East"
            >
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <div />
            <button
              type="button"
              onClick={() => handleNudge(0, 6)}
              className="w-8 h-8 rounded-xl bg-white border border-stone-200 flex items-center justify-center text-stone-700 hover:bg-stone-50 active:bg-stone-200 transition shadow-2xs cursor-pointer"
              title="Nudge South"
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
            <div />
          </div>
        </div>
      )}

      {/* Coordinate & Accuracy Pills */}
      <div className="flex items-center justify-between text-[11px] text-stone-500 px-1">
        <span className="font-mono truncate">
          {location.lat.toFixed(5)}° N, {location.lng.toFixed(5)}° E
        </span>
        <span className="flex items-center gap-1 text-emerald-800 font-medium">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          <span>±{location.accuracyMeters || 10}m accuracy</span>
        </span>
      </div>
    </div>
  );
};
