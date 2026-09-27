/**
 * Data Layer: Missions Service
 * 
 * Connected to Firebase Cloud Firestore (Collection: "missions").
 * Real-time synchronization via onSnapshot, persisting Sahiwal civic missions.
 */

import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  onSnapshot, 
  increment,
  query,
  orderBy
} from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { 
  Mission, 
  MissionSeverity, 
  MissionStatus, 
  LocationCoordinates, 
  CleanupVerificationResult 
} from '../types';
import { userService } from './user';
import { sanitizeText } from '../utils/sanitize';

export interface CreateMissionInput {
  photo: string;
  location: LocationCoordinates;
  severity: MissionSeverity;
  description?: string;
  reporterId: string;
  reporterName?: string;
  category?: string;
}

// Sahiwal Default Anchor (Goal Chowk coordinates)
export const SAHIWAL_DEFAULT_COORDS = {
  lat: 30.6682,
  lng: 73.1114,
  address: 'Near Goal Chowk, High Street, Sahiwal',
};

export const SAHIWAL_MAX_RADIUS_KM = 50;

export interface AnchorLocationResult {
  coords: { lat: number; lng: number };
  isFallback: boolean;
  distanceFromSahiwalKm?: number;
}

/**
 * Returns Sahiwal center anchor coordinates if user coords are unavailable, denied,
 * or fall outside the 50km radius of Sahiwal city center.
 */
export function getSahiwalAnchorLocation(
  userCoords?: { lat: number; lng: number } | null
): AnchorLocationResult {
  if (!userCoords || typeof userCoords.lat !== 'number' || typeof userCoords.lng !== 'number') {
    return {
      coords: { lat: SAHIWAL_DEFAULT_COORDS.lat, lng: SAHIWAL_DEFAULT_COORDS.lng },
      isFallback: true,
    };
  }

  const distFromSahiwal = calculateDistanceKm(
    userCoords.lat,
    userCoords.lng,
    SAHIWAL_DEFAULT_COORDS.lat,
    SAHIWAL_DEFAULT_COORDS.lng
  );

  if (distFromSahiwal > SAHIWAL_MAX_RADIUS_KM) {
    return {
      coords: { lat: SAHIWAL_DEFAULT_COORDS.lat, lng: SAHIWAL_DEFAULT_COORDS.lng },
      isFallback: true,
      distanceFromSahiwalKm: distFromSahiwal,
    };
  }

  return {
    coords: userCoords,
    isFallback: false,
    distanceFromSahiwalKm: distFromSahiwal,
  };
}

// Calculate Haversine distance between two coordinates in kilometers
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

// Format distance string (e.g. "350 m away" or "1.4 km away")
export function formatDistance(distanceKm?: number): string {
  if (distanceKm === undefined || isNaN(distanceKm)) return 'Nearby Sahiwal';
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m away`;
  }
  return `${distanceKm.toFixed(1)} km away`;
}

// Calculate CleanPoints based on severity
export function calculateCleanPoints(severity: MissionSeverity): number {
  switch (severity) {
    case 'low':
      return 10;
    case 'medium':
      return 25;
    case 'high':
      return 50;
    default:
      return 10;
  }
}

// Seed missions for Sahiwal landmarks when Firestore is freshly provisioned
const INITIAL_MISSIONS: Mission[] = [
  {
    id: 'mis-1',
    photo: 'https://images.unsplash.com/photo-1605600659908-0ef719419d41?w=600&auto=format&fit=crop&q=80',
    location: {
      lat: 30.6682,
      lng: 73.1114,
      address: 'Near Goal Chowk, High Street, Sahiwal',
      accuracyMeters: 8,
      nudgeOffsetX: 0,
      nudgeOffsetY: 0,
    },
    severity: 'high',
    status: 'open',
    createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    reporterId: 'usr-901',
    reporterName: 'Tariq Mehmood (Farid Town)',
    description: 'Piles of polythene shopping bags and discarded fruit crates clogging bazaar corner.',
    cleanPoints: 50,
    category: 'Plastic Waste',
    title: 'Plastic Waste near Goal Chowk Bazaar',
  },
  {
    id: 'mis-2',
    photo: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=600&auto=format&fit=crop&q=80',
    location: {
      lat: 30.6750,
      lng: 73.1040,
      address: 'Farid Town Sector 2 Main Market, Sahiwal',
      accuracyMeters: 10,
      nudgeOffsetX: 0,
      nudgeOffsetY: 0,
    },
    severity: 'medium',
    status: 'open',
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    reporterId: 'usr-902',
    reporterName: 'Ayesha Malik',
    description: 'Overflowing commercial waste container spilling onto the pedestrian sidewalk.',
    cleanPoints: 25,
    category: 'Overflowing Dumpster',
    title: 'Overflowing Dumpster at Farid Town',
  },
  {
    id: 'mis-3',
    photo: 'https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?w=600&auto=format&fit=crop&q=80',
    location: {
      lat: 30.6610,
      lng: 73.1250,
      address: 'Lower Bari Doab Canal Road Walkway, Sahiwal',
      accuracyMeters: 12,
      nudgeOffsetX: 0,
      nudgeOffsetY: 0,
    },
    severity: 'low',
    status: 'open',
    createdAt: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
    reporterId: 'usr-903',
    reporterName: 'Bilal Mengrani',
    description: 'Scattered beverage cartons and disposable wrappers along recreational walking track.',
    cleanPoints: 10,
    category: 'Plastic Waste',
    title: 'Canal Road Walkway Litter',
  },
  {
    id: 'mis-4',
    photo: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600&auto=format&fit=crop&q=80',
    location: {
      lat: 30.6720,
      lng: 73.1180,
      address: 'Govt. Post Graduate College Road, Sahiwal',
      accuracyMeters: 6,
      nudgeOffsetX: 0,
      nudgeOffsetY: 0,
    },
    severity: 'medium',
    status: 'open',
    createdAt: new Date(Date.now() - 1000 * 60 * 50).toISOString(),
    reporterId: 'usr-1042',
    reporterName: 'Hamza Khan (You)',
    description: 'Discarded paper handouts and plastic snack wrappers blocking drainage inlet near college gate.',
    cleanPoints: 25,
    category: 'Drainage Blockage',
    title: 'Drainage Blockage at College Road',
  },
  {
    id: 'mis-5',
    photo: 'https://images.unsplash.com/photo-1528190336454-13cd56b45b5a?w=600&auto=format&fit=crop&q=80',
    location: {
      lat: 30.6645,
      lng: 73.1090,
      address: 'Montgomery Railway Colony Park, Sahiwal',
      accuracyMeters: 15,
      nudgeOffsetX: 0,
      nudgeOffsetY: 0,
    },
    severity: 'low',
    status: 'in_progress',
    createdAt: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    reporterId: 'usr-904',
    reporterName: 'Zubair Akhtar',
    volunteerId: 'usr-1042',
    volunteerName: 'Hamza Khan (You)',
    acceptedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    description: 'Dry tree branches and park visitor litter ready for community bagging.',
    cleanPoints: 10,
    category: 'Greenery Cleanup',
    title: 'Railway Colony Park Cleanup',
  },
];

class MissionsService {
  private missions: Mission[] = [...INITIAL_MISSIONS];
  private listeners: Array<(missions: Mission[]) => void> = [];
  private unsubscribeFirestore: (() => void) | null = null;
  private isInitialized = false;

  constructor() {
    auth.onAuthStateChanged((fbUser) => {
      if (fbUser) {
        this.initFirestoreListener();
      } else {
        if (this.unsubscribeFirestore) {
          this.unsubscribeFirestore();
          this.unsubscribeFirestore = null;
        }
      }
    });
  }

  /**
   * Real-time Firestore synchronization
   */
  private initFirestoreListener() {
    if (this.unsubscribeFirestore) {
      this.unsubscribeFirestore();
      this.unsubscribeFirestore = null;
    }
    if (!auth.currentUser) return;

    try {
      const missionsCol = collection(db, 'missions');
      
      this.unsubscribeFirestore = onSnapshot(
        missionsCol,
        async (snapshot) => {
          if (snapshot.empty && !this.isInitialized) {
            // First time setup: seed initial Sahiwal missions into Firestore
            this.isInitialized = true;
            await this.seedInitialMissions();
            return;
          }

          this.isInitialized = true;
          const remoteMissions: Mission[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            remoteMissions.push({
              id: docSnap.id,
              photo: data.photo || '',
              afterPhoto: data.afterPhoto,
              location: data.location || { lat: SAHIWAL_DEFAULT_COORDS.lat, lng: SAHIWAL_DEFAULT_COORDS.lng },
              afterLocation: data.afterLocation,
              severity: data.severity || 'low',
              status: data.status || 'open',
              createdAt: data.createdAt || new Date().toISOString(),
              reporterId: data.reporterId || 'usr-anonymous',
              reporterName: data.reporterName || 'Sahiwal Citizen',
              volunteerId: data.volunteerId,
              volunteerName: data.volunteerName,
              acceptedAt: data.acceptedAt,
              completedAt: data.completedAt,
              verifiedAt: data.verifiedAt,
              verificationResult: data.verificationResult,
              description: data.description,
              cleanPoints: data.cleanPoints ?? calculateCleanPoints(data.severity || 'low'),
              category: data.category || 'General Litter',
              title: data.title || 'Reported Incident',
            });
          });

          // Sort by creation time descending (newest first)
          remoteMissions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

          this.missions = remoteMissions.length > 0 ? remoteMissions : [...INITIAL_MISSIONS];
          this.notifyListeners();
        },
        (error) => {
          console.warn('Firestore onSnapshot error, using local fallback:', error);
          this.notifyListeners();
        }
      );
    } catch (err) {
      console.warn('Failed to initialize Firestore listener for missions:', err);
    }
  }

  /**
   * Seed initial missions into Firestore
   */
  private async seedInitialMissions() {
    try {
      for (const m of INITIAL_MISSIONS) {
        const ref = doc(db, 'missions', m.id);
        await setDoc(ref, m);
      }
    } catch (e) {
      console.warn('Could not seed initial missions to Firestore:', e);
    }
  }

  private notifyListeners() {
    const list = [...this.missions];
    this.listeners.forEach((listener) => listener(list));
  }

  /**
   * Subscribe to mission updates across the applet
   */
  public subscribe(listener: (missions: Mission[]) => void): () => void {
    this.listeners.push(listener);
    // Initial call
    listener([...this.missions]);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  /**
   * Query all missions from Firestore
   */
  public async getMissions(): Promise<Mission[]> {
    try {
      const snapshot = await getDocs(collection(db, 'missions'));
      if (!snapshot.empty) {
        const list: Mission[] = [];
        snapshot.forEach((d) => {
          list.push({ id: d.id, ...d.data() } as Mission);
        });
        return list;
      }
    } catch (e) {
      console.warn('getMissions Firestore query error:', e);
    }
    return [...this.missions];
  }

  /**
   * Retrieve single mission by id
   */
  public async getMissionById(id: string): Promise<Mission | null> {
    try {
      const snap = await getDoc(doc(db, 'missions', id));
      if (snap.exists()) {
        return { id: snap.id, ...snap.data() } as Mission;
      }
    } catch (e) {
      console.warn('getMissionById error:', e);
    }
    return this.missions.find((m) => m.id === id) || null;
  }

  /**
   * Create a new mission from citizen report in Firestore
   */
  public async createMission(input: CreateMissionInput): Promise<Mission> {
    const cleanPoints = calculateCleanPoints(input.severity);
    const missionId = `mis-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    const cleanDescription = sanitizeText(input.description?.trim());
    const cleanAddress = sanitizeText(input.location.address || 'Goal Chowk Area, Sahiwal');
    const cleanReporterName = sanitizeText(input.reporterName || 'Sahiwal Citizen');

    const newMission: Mission = {
      id: missionId,
      photo: input.photo,
      location: {
        lat: input.location.lat,
        lng: input.location.lng,
        address: cleanAddress,
        accuracyMeters: input.location.accuracyMeters || 10,
        nudgeOffsetX: input.location.nudgeOffsetX || 0,
        nudgeOffsetY: input.location.nudgeOffsetY || 0,
      },
      severity: input.severity,
      status: 'open',
      createdAt: new Date().toISOString(),
      reporterId: input.reporterId || auth.currentUser?.uid || 'usr-sahiwal-citizen',
      reporterName: cleanReporterName,
      description: cleanDescription || '',
      cleanPoints,
      category: input.category || 'Plastic Waste',
      title: cleanDescription
        ? cleanDescription.slice(0, 38) + (cleanDescription.length > 38 ? '...' : '')
        : `${input.category || 'Waste'} near ${cleanAddress.split(',')[0]}`,
    };

    // Update local cache optimistically
    this.missions.unshift(newMission);
    this.notifyListeners();

    // Write to Firestore "missions" collection
    try {
      const missionRef = doc(db, 'missions', missionId);
      await setDoc(missionRef, sanitizeForFirestore(newMission));

      // Increment reporter's missionsReported in Firestore "users"
      if (input.reporterId && auth.currentUser?.uid === input.reporterId) {
        const userRef = doc(db, 'users', input.reporterId);
        await updateDoc(userRef, {
          missionsReported: increment(1),
        }).catch(() => {});
      }
    } catch (err) {
      console.warn('Firestore create mission notice:', err);
    }

    return newMission;
  }

  /**
   * Accept a mission: updates status to "in_progress" and assigns volunteerId in Firestore
   */
  public async acceptMission(
    missionId: string,
    volunteerId: string,
    volunteerName: string = 'Hamza Khan (You)'
  ): Promise<Mission | null> {
    const index = this.missions.findIndex((m) => m.id === missionId);
    if (index === -1) return null;

    const acceptedAt = new Date().toISOString();
    this.missions[index] = {
      ...this.missions[index],
      status: 'in_progress',
      volunteerId,
      volunteerName,
      acceptedAt,
    };
    this.notifyListeners();

    // Update in Firestore
    try {
      const missionRef = doc(db, 'missions', missionId);
      await updateDoc(
        missionRef,
        sanitizeForFirestore({
          status: 'in_progress',
          volunteerId,
          volunteerName,
          acceptedAt,
        })
      ).catch((e) => console.warn('Firestore accept mission notice:', e));
    } catch (err) {
      console.warn('Firestore accept mission exception:', err);
    }

    return this.missions[index];
  }

  /**
   * Complete cleanup on a mission in Firestore:
   * Sets afterPhoto, afterLocation, verificationResult, and if approved sets status to 'verified'
   * and awards CleanPoints to the volunteer!
   */
  public async completeMission(
    missionId: string,
    afterPhoto: string,
    afterLocation: LocationCoordinates,
    verification: CleanupVerificationResult
  ): Promise<Mission | null> {
    const index = this.missions.findIndex((m) => m.id === missionId);
    if (index === -1) return null;

    const currentMission = this.missions[index];
    let nextStatus: MissionStatus = currentMission.status;

    if (verification.verdict === 'approved') {
      nextStatus = 'verified';
    } else if (verification.verdict === 'needs_review') {
      nextStatus = 'needs_review';
    } else {
      nextStatus = 'in_progress';
    }

    const completedAt = new Date().toISOString();
    const verifiedAt = verification.verdict === 'approved' ? completedAt : undefined;

    this.missions[index] = {
      ...currentMission,
      afterPhoto,
      afterLocation,
      completedAt,
      verifiedAt,
      verificationResult: verification,
      status: nextStatus,
    };
    this.notifyListeners();

    // Update in Firestore
    // Note: 'verified' status and user CleanPoints are set server-side via /api/complete-verification
    try {
      const missionRef = doc(db, 'missions', missionId);
      const clientStatus = nextStatus === 'verified' ? 'submitted' : nextStatus;
      await updateDoc(
        missionRef,
        sanitizeForFirestore({
          afterPhoto,
          afterLocation,
          completedAt,
          verifiedAt: verifiedAt || null,
          verificationResult: verification,
          status: clientStatus,
        })
      ).catch((e) => console.warn('Firestore complete mission notice:', e));

      // Award points to user state
      if (verification.verdict === 'approved' && currentMission.volunteerId) {
        const wasteDiverted =
          currentMission.severity === 'high' ? 15 : currentMission.severity === 'medium' ? 8 : 4;
        userService.awardCleanPoints(currentMission.cleanPoints, wasteDiverted);
      }
    } catch (err) {
      console.warn('Firestore complete mission exception:', err);
    }

    return this.missions[index];
  }

  /**
   * Update status of a mission in Firestore
   */
  public async updateMissionStatus(id: string, status: MissionStatus): Promise<Mission | null> {
    const index = this.missions.findIndex((m) => m.id === id);
    if (index === -1) return null;

    this.missions[index] = {
      ...this.missions[index],
      status,
    };
    this.notifyListeners();

    try {
      const missionRef = doc(db, 'missions', id);
      await updateDoc(missionRef, { status }).catch((e) => console.warn('Firestore update status notice:', e));
    } catch (err) {
      console.warn('Firestore update status exception:', err);
    }

    return this.missions[index];
  }
}

/**
 * Utility function to recursively strip undefined properties from objects
 * to satisfy Firestore setDoc / updateDoc requirements.
 */
function sanitizeForFirestore<T extends Record<string, any>>(obj: T): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) {
      continue;
    }
    if (value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      result[key] = sanitizeForFirestore(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

export const missionsService = new MissionsService();
