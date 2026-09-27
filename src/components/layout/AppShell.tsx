import React from 'react';
import { AppHeader } from './AppHeader';
import { BottomNav } from './BottomNav';
import { OfflineIndicator } from '../ui/OfflineIndicator';
import { PWAInstallBanner } from '../ui/PWAInstallBanner';
import { TabType } from '../../types';

interface AppShellProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  activeTab,
  onTabChange,
  children,
}) => {
  return (
    /* Outer Desktop Backdrop: Neutral, elegant Sahiwal eco backdrop on viewports >= 640px (sm:) */
    <div className="min-h-screen w-full bg-stone-100 dark:bg-stone-950 sm:bg-gradient-to-br sm:from-stone-900 sm:via-[#082216] sm:to-stone-950 sm:dark:from-stone-950 sm:dark:via-[#04140c] sm:dark:to-stone-950 flex flex-col items-center justify-start text-stone-900 dark:text-stone-100 font-sans antialiased transition-colors duration-200 sm:py-6 sm:px-4">
      {/* Offline Status Toast */}
      <OfflineIndicator />

      {/* Desktop Preview Header Badge (Visible on desktop viewports >= 640px) */}
      <div className="hidden sm:flex items-center justify-between w-full max-w-[430px] mb-2 px-2 text-stone-400 dark:text-stone-500 text-xs font-semibold tracking-wide select-none">
        <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Shehri Sahiwal
        </span>
        <span className="opacity-80 text-[11px] font-mono bg-stone-800/80 dark:bg-stone-900/90 text-stone-300 dark:text-stone-400 px-2 py-0.5 rounded-full border border-stone-700/60 dark:border-stone-800">
          Phone Preview (430px)
        </span>
      </div>

      {/* Mobile App Frame: Edge-to-edge on mobile (<640px), constrained 430px phone frame with border/shadow on desktop (>=640px) */}
      <div className="w-full sm:max-w-[430px] min-h-screen sm:min-h-[850px] bg-stone-50 dark:bg-stone-900 shadow-2xl sm:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6)] flex flex-col relative border-x sm:border border-stone-200/80 dark:border-stone-800/90 sm:rounded-[28px] sm:overflow-hidden transition-all duration-200">
        {/* App Top Bar */}
        <AppHeader activeTab={activeTab} onNavigate={onTabChange} />

        {/* PWA Install Banner */}
        <div className="pt-2">
          <PWAInstallBanner />
        </div>

        {/* Primary Screen Area */}
        <main className="flex-1 pb-24 overflow-y-auto overflow-x-hidden flex flex-col">
          {children}
        </main>

        {/* Bottom Tab Navigation */}
        <BottomNav activeTab={activeTab} onTabChange={onTabChange} />
      </div>
    </div>
  );
};
