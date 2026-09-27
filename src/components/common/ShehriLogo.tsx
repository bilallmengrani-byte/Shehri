import React from 'react';
import { MapPin } from 'lucide-react';

export interface ShehriIconProps {
  size?: number | string;
  variant?: 'badge' | 'flat';
  theme?: 'dark' | 'light' | 'emerald';
  className?: string;
}

/**
 * Geometric, modern Shehri Icon Mark
 * Blends a civic location-pin silhouette with a flourishing clean leaf,
 * an action checkmark in warm amber, and a civic cleanliness sparkle.
 */
export const ShehriIcon: React.FC<ShehriIconProps> = ({
  size = 36,
  variant = 'badge',
  theme = 'emerald',
  className = '',
}) => {
  const isBadge = variant === 'badge';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 select-none ${className}`}
      aria-hidden="true"
    >
      <defs>
        {/* Deep Green Civic Gradient */}
        <linearGradient id="shehriGreenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#14663F" />
          <stop offset="60%" stopColor="#0F5132" />
          <stop offset="100%" stopColor="#0A3822" />
        </linearGradient>

        {/* Emerald Leaf Gradient */}
        <linearGradient id="shehriLeafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4ADE80" />
          <stop offset="100%" stopColor="#16A34A" />
        </linearGradient>

        {/* Radiant Amber Action Gradient */}
        <linearGradient id="shehriAmberGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FCD34D" />
          <stop offset="50%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>

        {/* Soft Drop Shadow */}
        <filter id="shehriMarkGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000000" floodOpacity={0.25} />
        </filter>
      </defs>

      {/* Rounded Civic Badge Container */}
      {isBadge && (
        <>
          <rect width="100" height="100" rx="26" fill="url(#shehriGreenGrad)" />
          <rect
            x="3.5"
            y="3.5"
            width="93"
            height="93"
            rx="23"
            stroke="white"
            strokeWidth="1.5"
            strokeOpacity="0.16"
          />
        </>
      )}

      {/* Group centered motif */}
      <g filter={isBadge ? 'url(#shehriMarkGlow)' : undefined}>
        {/* Left Leaf Half */}
        <path
          d="M 50 16 C 31 16 19 32 19 50 C 19 67 36 78 50 85 C 47.5 68 46 45 50 16 Z"
          fill={isBadge || theme === 'light' ? '#FFFFFF' : '#0F5132'}
          fillOpacity={isBadge || theme === 'light' ? 0.96 : 1}
        />

        {/* Right Leaf Half (Fresh Emerald Renewal) */}
        <path
          d="M 50 16 C 46 45 47.5 68 50 85 C 64 78 81 67 81 50 C 81 32 69 16 50 16 Z"
          fill="url(#shehriLeafGrad)"
        />

        {/* Center Leaf Rib */}
        <path
          d="M 50 20 L 50 80"
          stroke={isBadge || theme === 'light' ? '#0F5132' : '#FFFFFF'}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeOpacity={isBadge || theme === 'light' ? 0.35 : 0.4}
        />

        {/* Civic Amber Checkmark */}
        <path
          d="M 33 52 L 45 64 L 69 38"
          stroke="url(#shehriAmberGrad)"
          strokeWidth="6.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Cleanliness Sparkle */}
        <path
          d="M 68 22 Q 68 29 75 29 Q 68 29 68 36 Q 68 29 61 29 Q 68 29 68 22 Z"
          fill="url(#shehriAmberGrad)"
        />
      </g>
    </svg>
  );
};

export interface ShehriLogoProps {
  layout?: 'horizontal' | 'stacked' | 'icon-only';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  theme?: 'dark' | 'light' | 'emerald';
  iconVariant?: 'badge' | 'flat';
  showCityBadge?: boolean;
  showTagline?: boolean;
  customTagline?: string;
  className?: string;
  onClick?: () => void;
}

export const ShehriLogo: React.FC<ShehriLogoProps> = ({
  layout = 'horizontal',
  size = 'md',
  theme = 'dark',
  iconVariant = 'badge',
  showCityBadge = true,
  showTagline = false,
  customTagline,
  className = '',
  onClick,
}) => {
  const sizeConfig = {
    sm: {
      icon: 28,
      urduText: 'text-xl',
      badgeText: 'text-[9px]',
      gap: 'gap-2',
    },
    md: {
      icon: 34,
      urduText: 'text-2xl',
      badgeText: 'text-[10px]',
      gap: 'gap-2.5',
    },
    lg: {
      icon: 46,
      urduText: 'text-3xl',
      badgeText: 'text-xs',
      gap: 'gap-3',
    },
    xl: {
      icon: 64,
      urduText: 'text-4xl',
      badgeText: 'text-xs',
      gap: 'gap-4',
    },
  }[size];

  const isLight = theme === 'light';
  const urduColor = isLight ? 'text-white' : 'text-[#0F5132] dark:text-emerald-400';
  const taglineColor = isLight ? 'text-emerald-100/90' : 'text-stone-600 dark:text-stone-300';

  if (layout === 'icon-only') {
    return (
      <div 
        onClick={onClick}
        className={`inline-flex items-center justify-center ${onClick ? 'cursor-pointer' : ''} ${className}`}
      >
        <ShehriIcon 
          size={sizeConfig.icon} 
          variant={iconVariant} 
          theme={isLight ? 'light' : 'dark'} 
        />
      </div>
    );
  }

  // Stacked Lockup (Splash & Onboarding)
  if (layout === 'stacked') {
    return (
      <div
        onClick={onClick}
        className={`flex flex-col items-center text-center select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
      >
        <div className="transform transition hover:scale-105 active:scale-95 duration-200">
          <ShehriIcon
            size={sizeConfig.icon}
            variant={iconVariant}
            theme={isLight ? 'light' : 'dark'}
          />
        </div>

        <div className="mt-3 flex flex-col items-center">
          <span
            className={`font-urdu ${sizeConfig.urduText} ${urduColor} drop-shadow-xs leading-none px-1 pb-2`}
            dir="rtl"
            lang="ur"
            title="شہری"
          >
            شہری
          </span>

          {showCityBadge && (
            <div className="flex items-center gap-1.5 mt-3.5 text-xs font-semibold text-stone-500 dark:text-stone-400">
              <MapPin className="w-3.5 h-3.5 text-[#0F5132] dark:text-emerald-400 shrink-0" />
              <span className="tracking-wide">Sahiwal</span>
            </div>
          )}
        </div>

        {showTagline && (
          <p 
            className={`text-xs ${taglineColor} font-medium mt-2 max-w-xs leading-relaxed text-center`}
          >
            {customTagline || 'Clean Sahiwal, Together'}
          </p>
        )}
      </div>
    );
  }

  // Horizontal Lockup (Header and Navigation Bars)
  // Clear visual separation: Wordmark "شہری" + Distinct Location Indicator
  return (
    <div
      onClick={onClick}
      className={`flex items-center ${sizeConfig.gap} select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      <ShehriIcon
        size={sizeConfig.icon}
        variant={iconVariant}
        theme={isLight ? 'light' : 'dark'}
      />

      <div className="flex flex-col justify-center min-w-0">
        <div className="flex items-baseline gap-1.5 pb-1">
          <span
            className={`font-urdu ${sizeConfig.urduText} ${urduColor} leading-none tracking-normal inline-block`}
            dir="rtl"
            lang="ur"
            title="شہری"
          >
            شہری
          </span>
          <span className={`text-[10px] font-bold tracking-tight ${isLight ? 'text-emerald-200/80' : 'text-stone-400'} uppercase hidden sm:inline`}>
            Shehri
          </span>
        </div>

        {showCityBadge && (
          <div className="flex items-center gap-1.5 text-[10px] text-stone-500 dark:text-stone-400 font-medium leading-tight mt-3">
            <MapPin className="w-3 h-3 text-[#0F5132] dark:text-emerald-400 shrink-0" />
            <span className="leading-none text-[10px] font-semibold tracking-wide">Sahiwal</span>
          </div>
        )}
      </div>
    </div>
  );
};
