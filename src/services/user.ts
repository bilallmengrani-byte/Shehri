/**
 * User Service (Delegates to centralized GamificationStore)
 * 
 * Synchronizes user profile and awards CleanPoints upon verified cleanup.
 */

import { UserProfile } from '../types';
import { gamificationStore } from './userStore';

class UserService {
  public subscribe(listener: (user: UserProfile) => void): () => void {
    return gamificationStore.subscribe(() => {
      listener(gamificationStore.getUser());
    });
  }

  public getUser(): UserProfile {
    return gamificationStore.getUser();
  }

  public awardCleanPoints(points: number, wasteKg: number = 8): UserProfile {
    return gamificationStore.awardCleanPoints(points, wasteKg);
  }

  public incrementReportsFiled(): void {
    gamificationStore.incrementReportsFiled();
  }

  public resetUser(): UserProfile {
    gamificationStore.resetToDefault();
    return gamificationStore.getUser();
  }
}

export const userService = new UserService();
