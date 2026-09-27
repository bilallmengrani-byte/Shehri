/**
 * ============================================================================
 * REDEMPTIONS SERVICE — CLEANPOINTS CIVIC REWARD EXCHANGE
 * ============================================================================
 * 
 * Manages the exchange of CleanPoints for local Sahiwal business vouchers.
 * Writes records to Firestore collection "redemptions" and syncs with
 * localStorage for instant offline access and immediate UI responsiveness.
 * ============================================================================
 */

import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  updateDoc 
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { RewardItem, RedemptionRecord } from '../types';
import { gamificationStore } from './userStore';

const STORAGE_KEY_REDEMPTIONS = 'shehri_user_redemptions';

// Generate unique formatted redemption code: e.g. SHR-7K3A-9F2D
export function generateRedemptionCode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let segment1 = '';
  let segment2 = '';
  for (let i = 0; i < 4; i++) {
    segment1 += chars.charAt(Math.floor(Math.random() * chars.length));
    segment2 += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `SHR-${segment1}-${segment2}`;
}

export class RedemptionsService {
  /**
   * Get all local and cached redemptions for a user
   */
  public getLocalRedemptions(userId: string): RedemptionRecord[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_REDEMPTIONS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed.filter((r) => r && (r.userId === userId || r.userId === 'usr-google-bilal' || (typeof r.userId === 'string' && r.userId.startsWith('usr-'))));
        }
      }
    } catch (e) {
      console.warn('Failed to load local redemptions:', e);
    }
    return [];
  }

  /**
   * Fetch redemptions from Firestore with local storage fallback
   */
  public async getUserRedemptions(userId: string): Promise<RedemptionRecord[]> {
    const local = this.getLocalRedemptions(userId);

    try {
      const redemptionsCol = collection(db, 'redemptions');
      const q = query(
        redemptionsCol, 
        where('userId', '==', userId),
        orderBy('redeemedAt', 'desc')
      );
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const remoteList: RedemptionRecord[] = [];
        snapshot.forEach((d) => {
          remoteList.push({ id: d.id, ...d.data() } as RedemptionRecord);
        });

        // Merge remote and local (avoiding duplicates)
        const combinedMap = new Map<string, RedemptionRecord>();
        local.forEach((r) => combinedMap.set(r.id, r));
        remoteList.forEach((r) => combinedMap.set(r.id, r));

        const merged = Array.from(combinedMap.values()).sort(
          (a, b) => new Date(b.redeemedAt).getTime() - new Date(a.redeemedAt).getTime()
        );

        localStorage.setItem(STORAGE_KEY_REDEMPTIONS, JSON.stringify(merged));
        return merged;
      }
    } catch (err) {
      console.warn('Firestore redemptions fetch fallback to local cache:', err);
    }

    return local;
  }

  /**
   * Redeem a reward for a user:
   * 1. Deducts CleanPoints
   * 2. Creates unique redemption record
   * 3. Writes to Firestore and localStorage
   */
  public async redeemReward(
    userId: string, 
    reward: RewardItem, 
    currentPoints: number
  ): Promise<{ success: boolean; redemption?: RedemptionRecord; error?: string }> {
    if (currentPoints < reward.pointsCost) {
      return { 
        success: false, 
        error: `Insufficient CleanPoints. You have ${currentPoints} pts, need ${reward.pointsCost} pts.` 
      };
    }

    const code = generateRedemptionCode();

    try {
      // Send redemption request to secure server-authoritative endpoint
      const response = await fetch('/api/redeem-reward', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          rewardId: reward.id,
          rewardTitle: reward.title,
          rewardTitleUrdu: reward.titleUrdu,
          businessName: reward.businessName,
          businessNameUrdu: reward.businessNameUrdu,
          businessAddress: reward.businessAddress,
          category: reward.category,
          pointsCost: reward.pointsCost,
          discountValue: reward.discountValue,
          code,
          validDays: reward.validDays || 30,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        return {
          success: false,
          error: data.message || 'Server failed to process redemption.',
        };
      }

      const now = new Date();
      const expires = new Date();
      expires.setDate(expires.getDate() + (reward.validDays || 30));

      const newRecord: RedemptionRecord = {
        id: data.redemptionId || `rdm-${Date.now()}`,
        userId,
        rewardId: reward.id,
        rewardTitle: reward.title,
        rewardTitleUrdu: reward.titleUrdu,
        businessName: reward.businessName,
        businessNameUrdu: reward.businessNameUrdu,
        businessAddress: reward.businessAddress,
        category: reward.category,
        pointsCost: reward.pointsCost,
        discountValue: reward.discountValue,
        code,
        redeemedAt: now.toISOString(),
        expiresAt: expires.toISOString(),
        status: 'active',
      };

      // 1. Update local gamification store points balance safely
      gamificationStore.deductCleanPoints(reward.pointsCost);

      // 2. Cache record to local storage
      try {
        const stored = localStorage.getItem(STORAGE_KEY_REDEMPTIONS);
        const list = stored ? (JSON.parse(stored) as RedemptionRecord[]) : [];
        list.unshift(newRecord);
        localStorage.setItem(STORAGE_KEY_REDEMPTIONS, JSON.stringify(list));
      } catch (e) {
        console.warn('Failed to cache redemption in localStorage:', e);
      }

      return { success: true, redemption: newRecord };
    } catch (err: unknown) {
      console.error('Redemption error:', err);
      return {
        success: false,
        error: (err as Error)?.message || 'Failed to complete server redemption.',
      };
    }
  }

  /**
   * Mark a voucher as used/claimed
   */
  public async markAsClaimed(redemptionId: string): Promise<void> {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_REDEMPTIONS);
      if (stored) {
        const list = JSON.parse(stored) as RedemptionRecord[];
        const updated = list.map((r) => r.id === redemptionId ? { ...r, status: 'claimed' as const } : r);
        localStorage.setItem(STORAGE_KEY_REDEMPTIONS, JSON.stringify(updated));
      }
    } catch {}

    try {
      const ref = doc(db, 'redemptions', redemptionId);
      updateDoc(ref, { status: 'claimed' }).catch(() => {});
    } catch {}
  }
}

export const redemptionsService = new RedemptionsService();
