export type TabType = 'home' | 'missions' | 'report' | 'leaderboard' | 'profile';

export type ReportStatus = 'Open' | 'In Progress' | 'Verified' | 'Resolved';

export type MissionSeverity = 'low' | 'medium' | 'high';
export type MissionStatus = 'open' | 'in_progress' | 'verified' | 'resolved' | 'needs_review';

export type VerificationVerdict = 'approved' | 'rejected' | 'needs_review';

export interface CleanupVerificationResult {
  locationMatch: boolean;
  garbageRemoved: boolean;
  confidence: number; // 0 to 1
  verdict: VerificationVerdict;
  reason?: string;
  feedback?: string;
  metrics?: {
    wasteReductionPercentage?: number;
    distanceDeltaMeters?: number;
  };
}

export interface LocationCoordinates {
  lat: number;
  lng: number;
  address?: string;
  accuracyMeters?: number;
  nudgeOffsetX?: number; // visual offset on preview map (-50 to +50)
  nudgeOffsetY?: number;
}

export interface Mission {
  id: string;
  photo: string;
  afterPhoto?: string;
  location: LocationCoordinates;
  afterLocation?: LocationCoordinates;
  severity: MissionSeverity;
  status: MissionStatus;
  createdAt: string; // ISO 8601
  reporterId: string;
  reporterName?: string;
  volunteerId?: string;
  volunteerName?: string;
  acceptedAt?: string;
  completedAt?: string;
  verifiedAt?: string;
  verificationResult?: CleanupVerificationResult;
  description?: string;
  cleanPoints: number;
  category?: string;
  title?: string;
  distanceKm?: number;
}

export interface WasteHotspot {
  id: string;
  name: string;
  landmark: string;
  lat: number;
  lng: number;
  reportCount: number;
  severity: MissionSeverity;
  totalKgEstimated: number;
  lastReportedAgo: string;
  recurringIssue: string;
}

export type ReportCategory = 
  | 'Plastic Waste' 
  | 'Overflowing Dumpster' 
  | 'Construction Debris' 
  | 'Drainage Blockage' 
  | 'Greenery Cleanup';

export interface CleanupReport {
  id: string;
  title: string;
  category: ReportCategory;
  locationName: string;
  coordinates: { x: number; y: number }; // percentage coordinates for vector map
  latLng?: { lat: number; lng: number };
  status: ReportStatus;
  urgency: 'Low' | 'Medium' | 'High';
  cleanPointsReward: number;
  reportedAt: string;
  reporterName: string;
  imageUrl?: string;
  description: string;
  upvotes: number;
}

export interface CleanupMission {
  id: string;
  title: string;
  neighborhood: string;
  date: string;
  time: string;
  participantsCount: number;
  maxParticipants: number;
  rewardPoints: number;
  status: 'Active' | 'Upcoming' | 'Completed';
  organizer: string;
  wasteTargetKg: number;
  collectedKg: number;
  description: string;
}

export interface CitizenRank {
  rank: number;
  id: string;
  name: string;
  avatarSeed: string;
  neighborhood: string;
  points: number;
  reportsResolved: number;
  badgeTitle: string;
  isCurrentUser?: boolean;
}

export interface NeighborhoodLeaderboardEntry {
  id: string;
  name: string;
  points: number;
  activeVolunteers: number;
  cleanupsCount: number;
  isUserNeighborhood?: boolean;
}

export interface BadgeItem {
  id: string;
  name: string;
  description: string;
  icon: 'Award' | 'ShieldCheck' | 'Sparkles' | 'Flame' | 'Scale' | 'Target' | 'Crown';
  unlocked: boolean;
  unlockedAt?: string;
  progress: { current: number; total: number };
  category: 'cleanup' | 'reports' | 'streak' | 'points';
}

export interface UserProfile {
  id: string;
  uid?: string;
  name: string;
  email?: string;
  photoURL?: string;
  citizenNumber?: string;
  neighborhood?: string;
  city?: string;
  cleanPoints: number;
  rank?: number;
  missionsReported: number;
  missionsCleaned: number;
  cleanupsCompleted?: number;
  reportsFiled?: number;
  verifiedCleanups?: number;
  wasteDivertedKg?: number;
  streakDays?: number;
  badges: BadgeItem[];
  notifications?: {
    missionAccepted: boolean;
    cleanupVerified: boolean;
    newMissionNearby: boolean;
  };
  createdAt?: string;
}

export type RewardCategory = 
  | 'all'
  | 'supermarket' 
  | 'food' 
  | 'general' 
  | 'mobile_load' 
  | 'stationery' 
  | 'pharmacy';

export interface RewardItem {
  id: string;
  title: string;
  titleUrdu?: string;
  businessName: string;
  businessNameUrdu?: string;
  businessAddress: string;
  businessAddressUrdu?: string;
  category: 'supermarket' | 'food' | 'general' | 'mobile_load' | 'stationery' | 'pharmacy';
  pointsCost: number;
  discountValue: string;
  discountValueUrdu?: string;
  description: string;
  descriptionUrdu?: string;
  terms: string;
  termsUrdu?: string;
  logoUrl?: string;
  badgeTag?: string;
  badgeTagUrdu?: string;
  validDays: number;
}

export interface RedemptionRecord {
  id: string;
  userId: string;
  rewardId: string;
  rewardTitle: string;
  rewardTitleUrdu?: string;
  businessName: string;
  businessNameUrdu?: string;
  businessAddress?: string;
  category: 'supermarket' | 'food' | 'general' | 'mobile_load' | 'stationery' | 'pharmacy';
  pointsCost: number;
  discountValue: string;
  code: string;
  redeemedAt: string; // ISO 8601
  expiresAt: string; // ISO 8601
  status: 'active' | 'claimed' | 'expired';
}
