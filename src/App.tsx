/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AppShell } from './components/layout/AppShell';
import { HomeScreen } from './components/screens/HomeScreen';
import { MissionsScreen } from './components/screens/MissionsScreen';
import { ReportScreen } from './components/screens/ReportScreen';
import { LeaderboardScreen } from './components/screens/LeaderboardScreen';
import { ProfileScreen } from './components/screens/ProfileScreen';
import { AuthScreen } from './components/auth/AuthScreen';
import { SplashScreen } from './components/common/SplashScreen';
import { TabType, Mission } from './types';

function MainApp() {
  const { user, loading } = useAuth();
  
  // Splash screen state
  const [splashVisible, setSplashVisible] = useState(true);
  const [splashFading, setSplashFading] = useState(false);
  const [isServerWakingUp, setIsServerWakingUp] = useState(false);
  const hasTriggeredDismissalRef = useRef(false);
  
  // Routing state
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [showInitialLogin, setShowInitialLogin] = useState(false);

  const [focusedMissionId, setFocusedMissionId] = useState<string | undefined>(undefined);
  const [selectedMissionForDetail, setSelectedMissionForDetail] = useState<string | undefined>(undefined);

  // Trigger smooth dismissal of splash screen
  const triggerDismissal = () => {
    if (hasTriggeredDismissalRef.current) return;
    hasTriggeredDismissalRef.current = true;

    // Check user auth state to route accordingly
    if (!user) {
      setShowInitialLogin(true);
    } else {
      setShowInitialLogin(false);
      setActiveTab('home');
    }

    // Begin light fade-out
    setSplashFading(true);
    setTimeout(() => {
      setSplashVisible(false);
    }, 450);
  };

  // Ping server health on mount & check for cold-start delay
  useEffect(() => {
    // Ping server health endpoint to wake up cold instance
    fetch('/api/health').catch(() => {});

    // If initial loading takes longer than 3 seconds (cold start), display friendly message
    const coldStartTimer = setTimeout(() => {
      if (loading && !hasTriggeredDismissalRef.current) {
        setIsServerWakingUp(true);
      }
    }, 3000);

    return () => clearTimeout(coldStartTimer);
  }, []);

  // React to auth loading state completion
  useEffect(() => {
    if (!loading && !hasTriggeredDismissalRef.current) {
      // Small delay for clean minimum presentation (350ms)
      const t = setTimeout(() => {
        setIsServerWakingUp(false);
        triggerDismissal();
      }, 350);
      return () => clearTimeout(t);
    }
  }, [loading, user]);

  // Safety failsafe: if server takes unusually long (> 45s) or fails, dismiss splash gracefully
  useEffect(() => {
    const failsafe = setTimeout(() => {
      triggerDismissal();
    }, 45000);
    return () => clearTimeout(failsafe);
  }, []);

  const handleViewMissionOnMap = (missionId: string) => {
    setFocusedMissionId(missionId);
    setActiveTab('home');
  };

  const handleOpenMissionDetailInFeed = (missionId: string) => {
    setSelectedMissionForDetail(missionId);
    setActiveTab('missions');
  };

  const renderCurrentScreen = () => {
    // If not signed in on app launch, route directly to Login screen
    if (showInitialLogin && !user) {
      return (
        <AuthScreen
          redirectReason="Sign in with your Sahiwal citizen account to get started."
          initialMode="login"
          onSuccess={() => {
            setShowInitialLogin(false);
            setActiveTab('home');
          }}
          onExploreAsGuest={() => {
            setShowInitialLogin(false);
            setActiveTab('home');
          }}
        />
      );
    }

    // Protected Screen 1: Report Waste
    if (activeTab === 'report' && !user) {
      return (
        <AuthScreen
          redirectReason="Sign in with your Sahiwal citizen account to report uncollected trash and earn CleanPoints."
          onSuccess={() => setActiveTab('report')}
        />
      );
    }

    // Protected Screen 2: Missions Feed & Details
    if (activeTab === 'missions' && !user) {
      return (
        <AuthScreen
          redirectReason="Sign in to accept cleanup missions, verify debris removal, and earn civic rewards."
          onSuccess={() => setActiveTab('missions')}
        />
      );
    }

    // Protected Screen 3: Citizen Profile & Wallet
    if (activeTab === 'profile' && !user) {
      return (
        <AuthScreen
          redirectReason="Sign in to view your citizen profile, CleanPoints wallet, and unlocked badges."
          onSuccess={() => setActiveTab('profile')}
        />
      );
    }

    // Render tab screens
    switch (activeTab) {
      case 'home':
        return (
          <HomeScreen 
            onNavigateToTab={setActiveTab} 
            focusedReportId={focusedMissionId}
            onOpenMissionDetail={handleOpenMissionDetailInFeed}
          />
        );
      case 'missions':
        return (
          <MissionsScreen 
            onNavigateToTab={setActiveTab}
            onViewOnMap={handleViewMissionOnMap}
            initialSelectedMissionId={selectedMissionForDetail}
          />
        );
      case 'report':
        return (
          <ReportScreen 
            onReportSubmitted={(createdMission?: Mission) => {
              if (createdMission) {
                setFocusedMissionId(createdMission.id);
              }
            }}
            onViewOnMap={handleViewMissionOnMap}
          />
        );
      case 'leaderboard':
        return <LeaderboardScreen />;
      case 'profile':
        return <ProfileScreen />;
      default:
        return (
          <HomeScreen 
            onNavigateToTab={setActiveTab} 
            focusedReportId={focusedMissionId} 
          />
        );
    }
  };

  return (
    <>
      {/* Full-screen Splash Gate with smooth light fade-out */}
      {splashVisible && (
        <SplashScreen 
          isFadingOut={splashFading}
          isServerWakingUp={isServerWakingUp}
          onDismiss={triggerDismissal}
        />
      )}

      {/* Main Application Shell */}
      <AppShell
        activeTab={activeTab}
        onTabChange={(tab) => {
          if (tab !== 'missions') setSelectedMissionForDetail(undefined);
          if (showInitialLogin) setShowInitialLogin(false);
          setActiveTab(tab);
        }}
      >
        {renderCurrentScreen()}
      </AppShell>
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <MainApp />
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
