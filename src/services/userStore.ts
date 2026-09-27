/**
 * Centralized Gamification & User Store
 * 
 * Synchronized with Firebase Cloud Firestore (Collection: "users").
 * Manages the citizen user profile, CleanPoints balance, badges (locked/unlocked),
 * and dynamic Individual & Neighborhood Leaderboard rankings in real-time.
 */

import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  onSnapshot, 
  increment,
  query,
  orderBy
} from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { 
  UserProfile, 
  CitizenRank, 
  NeighborhoodLeaderboardEntry, 
  BadgeItem,
  WasteHotspot 
} from '../types';

// Initial Badges with locked/unlocked concepts for new citizens
export const NEW_USER_BADGES: BadgeItem[] = [
  {
    id: 'b-first-clean',
    name: 'First Cleanup',
    description: 'Complete your first verified cleanup mission in Sahiwal.',
    icon: 'Award',
    unlocked: false,
    progress: { current: 0, total: 1 },
    category: 'cleanup',
  },
  {
    id: 'b-5-verified',
    name: '5 Missions Verified',
    description: 'Resolve 5 waste incidents validated by civic vision.',
    icon: 'ShieldCheck',
    unlocked: false,
    progress: { current: 0, total: 5 },
    category: 'cleanup',
  },
  {
    id: 'b-hero',
    name: 'Neighborhood Hero',
    description: 'Amass 1,000+ CleanPoints keeping Sahiwal clean.',
    icon: 'Crown',
    unlocked: false,
    progress: { current: 0, total: 1000 },
    category: 'points',
  },
  {
    id: 'b-streak-7',
    name: 'Streak: 7 Days',
    description: 'Log in or report civic actions 7 consecutive days.',
    icon: 'Flame',
    unlocked: false,
    progress: { current: 1, total: 7 },
    category: 'streak',
  },
  {
    id: 'b-diverter-50',
    name: 'Waste Diverter: 50kg',
    description: 'Safely divert 50 kg of refuse from Sahiwal waterways.',
    icon: 'Scale',
    unlocked: false,
    progress: { current: 0, total: 50 },
    category: 'cleanup',
  },
];

const INITIAL_BADGES = NEW_USER_BADGES;

// Initial mock individual citizens seeded into Firestore
const INITIAL_CITIZENS: Omit<CitizenRank, 'rank'>[] = [
  {
    id: 'usr-seed-1',
    name: 'Tariq Mehmood',
    avatarSeed: 'TM',
    neighborhood: 'Farid Town',
    points: 2450,
    reportsResolved: 34,
    badgeTitle: 'Chief Eco Champion',
  },
  {
    id: 'usr-seed-2',
    name: 'Ayesha Malik',
    avatarSeed: 'AM',
    neighborhood: 'Civil Lines',
    points: 2180,
    reportsResolved: 29,
    badgeTitle: 'Waste Crusader',
  },
  {
    id: 'usr-seed-3',
    name: 'Bilal Mengrani',
    avatarSeed: 'BM',
    neighborhood: 'Canal View',
    points: 1940,
    reportsResolved: 26,
    badgeTitle: 'Civic Guardian',
  },
  {
    id: 'usr-seed-4',
    name: 'Zubair Akhtar',
    avatarSeed: 'ZA',
    neighborhood: 'High Street',
    points: 1620,
    reportsResolved: 21,
    badgeTitle: 'Neighborhood Lead',
  },
  {
    id: 'usr-seed-5',
    name: 'Dr. Fatima Noor',
    avatarSeed: 'FN',
    neighborhood: 'College Road',
    points: 1480,
    reportsResolved: 19,
    badgeTitle: 'Health & Clean Advocate',
  },
  {
    id: 'usr-seed-6',
    name: 'Zainab Bibi',
    avatarSeed: 'ZB',
    neighborhood: 'Montgomery Colony',
    points: 1120,
    reportsResolved: 15,
    badgeTitle: 'Eco Volunteer',
  },
  {
    id: 'usr-seed-7',
    name: 'Usman Ali',
    avatarSeed: 'UA',
    neighborhood: 'Farid Town',
    points: 980,
    reportsResolved: 13,
    badgeTitle: 'Park Steward',
  },
];

// Initial neighborhood totals
const INITIAL_NEIGHBORHOODS: NeighborhoodLeaderboardEntry[] = [
  {
    id: 'n-farid',
    name: 'Farid Town',
    points: 12400,
    activeVolunteers: 114,
    cleanupsCount: 68,
    isUserNeighborhood: true,
  },
  {
    id: 'n-civic',
    name: 'Civil Lines',
    points: 9600,
    activeVolunteers: 82,
    cleanupsCount: 45,
  },
  {
    id: 'n-highst',
    name: 'High Street & Goal Chowk',
    points: 8950,
    activeVolunteers: 76,
    cleanupsCount: 59,
  },
  {
    id: 'n-canal',
    name: 'Canal View Colony',
    points: 6100,
    activeVolunteers: 49,
    cleanupsCount: 31,
  },
  {
    id: 'n-college',
    name: 'College Road Area',
    points: 4800,
    activeVolunteers: 43,
    cleanupsCount: 27,
  },
];

// Chronic hotspots data with 2+ reports historically
export const CHRONIC_HOTSPOTS: WasteHotspot[] = [
  {
    id: 'hotspot-1',
    name: 'Goal Chowk Market Alley',
    landmark: 'Behind Fruit & Veg Bazaar stalls, Goal Chowk',
    lat: 30.6695,
    lng: 73.1128,
    reportCount: 4,
    severity: 'high',
    totalKgEstimated: 190,
    lastReportedAgo: '25 mins ago',
    recurringIssue: 'Nightly commercial produce crate & polythene dumping',
  },
  {
    id: 'hotspot-2',
    name: 'Farid Town Sector 2 Container',
    landmark: 'Central Commercial Area opposite Main Masjid',
    lat: 30.6750,
    lng: 73.1040,
    reportCount: 3,
    severity: 'medium',
    totalKgEstimated: 125,
    lastReportedAgo: '2 hours ago',
    recurringIssue: 'Overflowing municipal bin spilling into tree verge',
  },
  {
    id: 'hotspot-3',
    name: 'College Road Storm Grate',
    landmark: 'Govt. Post Graduate College Main Gate',
    lat: 30.6720,
    lng: 73.1180,
    reportCount: 3,
    severity: 'medium',
    totalKgEstimated: 85,
    lastReportedAgo: '40 mins ago',
    recurringIssue: 'Disposable tea cups & plastic bottles blocking water drain',
  },
  {
    id: 'hotspot-4',
    name: 'Lower Bari Doab Canal Road',
    landmark: 'Heritage Walk Track kilometer 1.5',
    lat: 30.6610,
    lng: 73.1250,
    reportCount: 2,
    severity: 'low',
    totalKgEstimated: 60,
    lastReportedAgo: 'Yesterday',
    recurringIssue: 'Pedestrian snack wrapper litter along walking embankment',
  },
];

const DEFAULT_USER: UserProfile = {
  id: '',
  uid: '',
  name: 'New Citizen',
  citizenNumber: 'SWL-0000',
  neighborhood: 'Farid Town',
  city: 'Sahiwal, Punjab',
  cleanPoints: 0,
  rank: 1,
  missionsReported: 0,
  missionsCleaned: 0,
  verifiedCleanups: 0,
  wasteDivertedKg: 0,
  streakDays: 1,
  badges: NEW_USER_BADGES,
};

class GamificationStore {
  private user: UserProfile = { ...DEFAULT_USER };
  private otherCitizens: Omit<CitizenRank, 'rank'>[] = [...INITIAL_CITIZENS];
  private neighborhoods: NeighborhoodLeaderboardEntry[] = [...INITIAL_NEIGHBORHOODS];
  private listeners: Array<() => void> = [];
  private unsubscribeFirestoreUsers: (() => void) | null = null;
  private isSeeded = false;

  constructor() {
    this.evaluateBadges();
    auth.onAuthStateChanged((fbUser) => {
      if (fbUser) {
        this.initFirestoreUsersListener();
      } else {
        if (this.unsubscribeFirestoreUsers) {
          this.unsubscribeFirestoreUsers();
          this.unsubscribeFirestoreUsers = null;
        }
      }
    });
  }

  /**
   * Listen to real-time users collection in Firestore for leaderboard
   */
  private initFirestoreUsersListener() {
    if (this.unsubscribeFirestoreUsers) {
      this.unsubscribeFirestoreUsers();
      this.unsubscribeFirestoreUsers = null;
    }
    if (!auth.currentUser) return;

    try {
      const usersCol = collection(db, 'users');
      this.unsubscribeFirestoreUsers = onSnapshot(
        usersCol,
        async (snapshot) => {
          if (snapshot.empty && !this.isSeeded) {
            this.isSeeded = true;
            await this.seedInitialCitizens();
            return;
          }

          this.isSeeded = true;
          const remoteCitizens: Omit<CitizenRank, 'rank'>[] = [];
          const currentUid = auth.currentUser?.uid || this.user.uid || this.user.id;

          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const id = docSnap.id;
            
            // If this doc is the current logged-in user, update current user state
            if (currentUid && (id === currentUid || id === this.user.id || id === this.user.uid)) {
              this.user = {
                id,
                uid: id,
                name: data.name || 'Sahiwal Citizen',
                email: data.email || '',
                photoURL: data.photoURL || '',
                citizenNumber: data.citizenNumber || `SWL-${id.slice(0, 4).toUpperCase()}`,
                neighborhood: data.neighborhood || 'Farid Town',
                city: data.city || 'Sahiwal, Punjab',
                cleanPoints: data.cleanPoints ?? 0,
                rank: data.rank ?? 1,
                missionsReported: data.missionsReported ?? 0,
                missionsCleaned: data.missionsCleaned ?? 0,
                verifiedCleanups: data.verifiedCleanups ?? 0,
                wasteDivertedKg: data.wasteDivertedKg ?? 0,
                streakDays: data.streakDays ?? 1,
                badges: data.badges && data.badges.length > 0 ? data.badges : INITIAL_BADGES,
                createdAt: data.createdAt,
              };
              this.evaluateBadges();
            } else {
              remoteCitizens.push({
                id,
                name: data.name || 'Citizen',
                avatarSeed: (data.name || 'SC').slice(0, 2).toUpperCase(),
                neighborhood: data.neighborhood || 'Farid Town',
                points: data.cleanPoints ?? 0,
                reportsResolved: data.verifiedCleanups ?? (data.missionsCleaned ?? 0),
                badgeTitle: (data.cleanPoints ?? 0) >= 1000 ? 'Neighborhood Hero' : 'Eco Vigilante',
              });
            }
          });

          if (remoteCitizens.length > 0) {
            this.otherCitizens = remoteCitizens;
          }
          this.recomputeRank();
          this.recomputeNeighborhoods();
          this.notify();
        },
        (err) => {
          console.warn('Firestore users onSnapshot error:', err);
        }
      );
    } catch (err) {
      console.warn('Failed to listen to users collection in Firestore:', err);
    }
  }

  /**
   * Seed initial mock citizens into Firestore "users" collection
   */
  private async seedInitialCitizens() {
    try {
      for (const c of INITIAL_CITIZENS) {
        const ref = doc(db, 'users', c.id);
        await setDoc(ref, {
          uid: c.id,
          name: c.name,
          email: `${c.avatarSeed.toLowerCase()}@shehri.sahiwal.pk`,
          photoURL: '',
          cleanPoints: c.points,
          missionsReported: Math.floor(c.reportsResolved * 0.8),
          missionsCleaned: c.reportsResolved,
          verifiedCleanups: c.reportsResolved,
          wasteDivertedKg: c.reportsResolved * 6,
          streakDays: 7,
          badges: INITIAL_BADGES,
          neighborhood: c.neighborhood,
          city: 'Sahiwal, Punjab',
          citizenNumber: `SWL-${c.id.slice(-4).toUpperCase()}`,
          createdAt: new Date().toISOString(),
        });
      }
    } catch (e) {
      console.warn('Error seeding mock citizens to Firestore:', e);
    }
  }

  private notify() {
    this.listeners.forEach((fn) => fn());
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    listener();
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  public getUser(): UserProfile {
    return { ...this.user };
  }

  public setUserProfile(profile: UserProfile): void {
    this.user = { ...profile };
    this.evaluateBadges();
    this.recomputeRank();
    this.notify();
  }

  /**
   * Re-evaluates all badges dynamically when user stats or points change
   */
  private evaluateBadges(): boolean {
    let changed = false;
    const now = 'Just now';

    this.user.badges = (this.user.badges || INITIAL_BADGES).map((badge) => {
      let currentProgress = badge.progress?.current ?? 0;
      let isUnlocked = badge.unlocked;

      if (badge.id === 'b-first-clean') {
        currentProgress = Math.min(1, this.user.missionsCleaned);
        if (!isUnlocked && currentProgress >= 1) {
          isUnlocked = true;
          badge.unlockedAt = now;
          changed = true;
        }
      } else if (badge.id === 'b-5-verified') {
        currentProgress = Math.min(5, this.user.verifiedCleanups ?? 0);
        if (!isUnlocked && currentProgress >= 5) {
          isUnlocked = true;
          badge.unlockedAt = now;
          changed = true;
        }
      } else if (badge.id === 'b-hero') {
        currentProgress = Math.min(1000, this.user.cleanPoints);
        if (!isUnlocked && currentProgress >= 1000) {
          isUnlocked = true;
          badge.unlockedAt = now;
          changed = true;
        }
      } else if (badge.id === 'b-streak-7') {
        currentProgress = Math.min(7, this.user.streakDays ?? 1);
        if (!isUnlocked && currentProgress >= 7) {
          isUnlocked = true;
          badge.unlockedAt = now;
          changed = true;
        }
      } else if (badge.id === 'b-diverter-50') {
        currentProgress = Math.min(50, this.user.wasteDivertedKg ?? 0);
        if (!isUnlocked && currentProgress >= 50) {
          isUnlocked = true;
          badge.unlockedAt = now;
          changed = true;
        }
      }

      return {
        ...badge,
        unlocked: isUnlocked,
        progress: {
          current: currentProgress,
          total: badge.progress?.total ?? 1,
        },
      };
    });

    return changed;
  }

  /**
   * Awards points when a cleanup is approved in verification
   */
  public awardCleanPoints(points: number, wasteKg: number = 8): UserProfile {
    const currentUid = auth.currentUser?.uid || this.user.uid || this.user.id;

    // 1. Update local user metrics optimistically
    this.user = {
      ...this.user,
      cleanPoints: this.user.cleanPoints + points,
      missionsCleaned: this.user.missionsCleaned + 1,
      verifiedCleanups: (this.user.verifiedCleanups || 0) + 1,
      wasteDivertedKg: (this.user.wasteDivertedKg || 0) + wasteKg,
    };

    // 2. Evaluate dynamic badge unlocks
    this.evaluateBadges();

    // 3. Write updates to Firestore "users" collection
    if (currentUid) {
      try {
        const userDocRef = doc(db, 'users', currentUid);
        updateDoc(userDocRef, {
          cleanPoints: increment(points),
          missionsCleaned: increment(1),
          verifiedCleanups: increment(1),
          wasteDivertedKg: increment(wasteKg),
          badges: this.user.badges,
        }).catch((err) => console.warn('Failed to update Firestore user points:', err));
      } catch (err) {
        console.warn('Firestore user update error:', err);
      }
    }

    // 4. Re-calculate rank
    this.recomputeRank();
    this.recomputeNeighborhoods();
    this.notify();
    return { ...this.user };
  }

  /**
   * Deduct CleanPoints when a civic reward voucher is redeemed
   */
  public deductCleanPoints(points: number): UserProfile {
    const currentUid = auth.currentUser?.uid || this.user.uid || this.user.id;

    // 1. Deduct points locally and update state
    this.user = {
      ...this.user,
      cleanPoints: Math.max(0, this.user.cleanPoints - points),
    };

    // 2. Sync deduction to Firestore users collection
    if (currentUid) {
      try {
        const userDocRef = doc(db, 'users', currentUid);
        updateDoc(userDocRef, {
          cleanPoints: increment(-points),
        }).catch((err) => console.warn('Failed to deduct Firestore user points:', err));
      } catch (err) {
        console.warn('Firestore user deduct points error:', err);
      }
    }

    // 3. Re-calculate rank
    this.recomputeRank();
    this.recomputeNeighborhoods();
    this.notify();
    return { ...this.user };
  }

  /**
   * Track when user files a new report
   */
  public incrementReportsFiled(): void {
    const currentUid = auth.currentUser?.uid || this.user.uid || this.user.id;
    this.user = {
      ...this.user,
      missionsReported: this.user.missionsReported + 1,
    };

    if (currentUid) {
      try {
        const userDocRef = doc(db, 'users', currentUid);
        updateDoc(userDocRef, {
          missionsReported: increment(1),
        }).catch(() => {});
      } catch {}
    }
    this.notify();
  }

  /**
   * Dynamically recompute current user's rank against all citizens
   */
  private recomputeRank(): void {
    const all = [
      ...this.otherCitizens,
      {
        id: this.user.id,
        name: `${this.user.name} (You)`,
        avatarSeed: (this.user.name || 'You').slice(0, 2).toUpperCase(),
        neighborhood: this.user.neighborhood || 'Farid Town',
        points: this.user.cleanPoints,
        reportsResolved: this.user.verifiedCleanups ?? this.user.missionsCleaned,
        badgeTitle: this.user.cleanPoints >= 1000 ? 'Neighborhood Hero' : 'Eco Vigilante',
      },
    ].sort((a, b) => b.points - a.points);

    const userIndex = all.findIndex((c) => c.id === this.user.id);
    this.user.rank = userIndex !== -1 ? userIndex + 1 : 8;
  }

  /**
   * Recompute neighborhood points aggregating live users
   */
  private recomputeNeighborhoods(): void {
    this.neighborhoods = this.neighborhoods.map((n) => {
      if (n.isUserNeighborhood || n.name.includes(this.user.neighborhood?.split(',')[0] || 'Farid Town')) {
        return {
          ...n,
          points: 12400 + Math.max(0, this.user.cleanPoints - 850),
          cleanupsCount: 68 + Math.max(0, this.user.missionsCleaned - 3),
        };
      }
      return n;
    });
  }

  /**
   * Returns individual leaderboard with ranks 1..N and user highlighted
   */
  public getIndividualLeaderboard(): CitizenRank[] {
    const list: Omit<CitizenRank, 'rank'>[] = [
      ...this.otherCitizens,
      {
        id: this.user.id,
        name: `${this.user.name} (You)`,
        avatarSeed: (this.user.name || 'You').slice(0, 2).toUpperCase(),
        neighborhood: this.user.neighborhood || 'Farid Town',
        points: this.user.cleanPoints,
        reportsResolved: this.user.verifiedCleanups ?? this.user.missionsCleaned,
        badgeTitle: this.user.cleanPoints >= 1000 ? 'Neighborhood Hero' : 'Eco Vigilante',
        isCurrentUser: true,
      },
    ];

    list.sort((a, b) => b.points - a.points);

    return list.map((item, idx) => ({
      ...item,
      rank: idx + 1,
      isCurrentUser: item.id === this.user.id,
    }));
  }

  /**
   * Returns neighborhood leaderboard sorted by points
   */
  public getNeighborhoodLeaderboard(): NeighborhoodLeaderboardEntry[] {
    const list = [...this.neighborhoods];
    list.sort((a, b) => b.points - a.points);
    return list;
  }

  public resetToDefault(): void {
    this.user = { ...DEFAULT_USER };
    this.otherCitizens = [...INITIAL_CITIZENS];
    this.neighborhoods = [...INITIAL_NEIGHBORHOODS];
    this.notify();
  }
}

export const gamificationStore = new GamificationStore();
