/**
 * Clean Verification Service
 * 
 * Compares "before" and "after" evidence photos via server-side Gemini Multimodal Vision API
 * combined with GPS geolocation coordinates.
 */

import { CleanupVerificationResult, LocationCoordinates, VerificationVerdict } from '../types';
import { calculateDistanceKm } from './missions';
import { auth } from '../firebase/config';

export interface VerificationOptions {
  /** Optional override for testing all 3 UI states directly */
  verdictOverride?: VerificationVerdict;
  simulatedDelayMs?: number;
  missionId?: string;
  pointsAwarded?: number;
  wasteKg?: number;
}

export interface GeminiVerificationResponse {
  sameLocationLikely: boolean;
  garbageRemoved: boolean;
  confidence: number;
  reasoning: string;
}

/**
 * Main verification function called on cleanup submission.
 * Calls backend `/api/verify-cleanup` (Gemini API) and combines with GPS validation.
 * 
 * @param beforePhoto Base64 data URL or remote image URL of original waste
 * @param afterPhoto Base64 data URL of user's cleaned site photo
 * @param beforeLocation LocationCoordinates of original report
 * @param afterLocation LocationCoordinates captured at submission time
 * @param options Optional configuration for testing/overrides
 * @returns Structured CleanupVerificationResult
 */
export async function verifyCleanup(
  beforePhoto: string,
  afterPhoto: string,
  beforeLocation: LocationCoordinates,
  afterLocation: LocationCoordinates,
  options?: VerificationOptions
): Promise<CleanupVerificationResult> {
  // 1. Check if developer override is selected for rapid UI testing
  if (options?.verdictOverride) {
    if (options.simulatedDelayMs) {
      await new Promise((res) => setTimeout(res, options.simulatedDelayMs));
    }
    return generateOverrideResult(options.verdictOverride, beforeLocation, afterLocation);
  }

  // 2. Validate input photos
  if (!afterPhoto) {
    return {
      locationMatch: false,
      garbageRemoved: false,
      confidence: 0.95,
      verdict: 'rejected',
      reason: 'No evidence photo provided for cleanup verification.',
      feedback: 'Please capture a clear photo of the cleaned site.',
    };
  }

  // 3. Calculate GPS distance match
  let distanceMeters = 0;
  let gpsLocationMatch = true;

  if (beforeLocation && afterLocation) {
    const distKm = calculateDistanceKm(
      beforeLocation.lat,
      beforeLocation.lng,
      afterLocation.lat,
      afterLocation.lng
    );
    distanceMeters = Math.round(distKm * 1000);

    // If more than 300 meters away from original site, flag location mismatch
    if (distanceMeters > 300) {
      gpsLocationMatch = false;
    }
  }

  // 4. Call Server-Side Gemini Multimodal Vision API
  let geminiResult: GeminiVerificationResponse | null = null;
  let geminiCallError: string | null = null;

  try {
    const controller = new AbortController();
    // 15 second timeout safety net
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch('/api/verify-cleanup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        beforePhoto,
        afterPhoto,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      geminiResult = await response.json();
    } else {
      const errData = await response.json().catch(() => ({}));
      geminiCallError = errData?.message || `Server responded with status ${response.status}`;
    }
  } catch (err: unknown) {
    const errorObj = err as Error;
    if (errorObj?.name === 'AbortError') {
      geminiCallError = 'Gemini API call timed out after 15 seconds.';
    } else {
      geminiCallError = errorObj?.message || 'Network error communicating with verification service.';
    }
    console.warn('Gemini verification error:', geminiCallError);
  }

  // 5. Fallback rule: If Gemini call fails, times out, or errors, route to needs_review with explicit API error reason
  if (!geminiResult) {
    const apiErrorMessage = geminiCallError || 'Verification service connection issue';
    return {
      locationMatch: gpsLocationMatch,
      garbageRemoved: false,
      confidence: 0.5,
      verdict: 'needs_review',
      reason: `[API Error] ${apiErrorMessage}`,
      feedback: `Gemini API Call Unsuccessful: ${apiErrorMessage}. Submission has been safely routed to Sahiwal civic moderators for manual confirmation.`,
      metrics: {
        wasteReductionPercentage: 70,
        distanceDeltaMeters: distanceMeters,
      },
    };
  }

  // 6. Combine Gemini Multimodal Vision analysis with GPS location check
  const { sameLocationLikely, garbageRemoved, confidence, reasoning } = geminiResult;
  const isHighConfidence = confidence >= 0.6;

  // Case A: Rejected
  // If garbage is clearly NOT removed, or location clearly doesn't match (visual or > 300m GPS)
  if (!garbageRemoved || !gpsLocationMatch || (!sameLocationLikely && confidence >= 0.7)) {
    let rejectionReason = reasoning;
    let rejectionFeedback = reasoning || 'Remaining waste detected in after-photo. Please clear the site completely and snap a new photo.';

    if (!gpsLocationMatch) {
      rejectionReason = `GPS location does not match incident site (detected ${distanceMeters}m away from original spot).`;
      rejectionFeedback = 'Please ensure you are standing at the original Sahiwal location when snapping the after photo.';
    } else if (!sameLocationLikely) {
      rejectionReason = `Visual background does not match original report location. ${reasoning}`;
      rejectionFeedback = `The surrounding background or landmarks do not match the original reported location. (${reasoning})`;
    }

    return {
      locationMatch: gpsLocationMatch && sameLocationLikely,
      garbageRemoved,
      confidence,
      verdict: 'rejected',
      reason: rejectionReason,
      feedback: rejectionFeedback,
      metrics: {
        wasteReductionPercentage: garbageRemoved ? 35 : 10,
        distanceDeltaMeters: distanceMeters,
      },
    };
  }

  // Case B: Approved
  // Gemini confirms garbage removed AND same location AND GPS match AND confidence >= 0.6
  if (garbageRemoved && sameLocationLikely && gpsLocationMatch && isHighConfidence) {
    // Notify server to perform trusted status update & award CleanPoints
    const currentUserId = auth.currentUser?.uid;
    if (currentUserId && options?.missionId) {
      fetch('/api/complete-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUserId,
          missionId: options.missionId,
          cleanPhoto: afterPhoto,
          pointsAwarded: options.pointsAwarded || 100,
          wasteKg: options.wasteKg || 15,
        }),
      }).catch((e) => console.warn('Server completion call error:', e));
    }

    return {
      locationMatch: true,
      garbageRemoved: true,
      confidence,
      verdict: 'approved',
      reason: reasoning || 'Visual analysis confirms waste removed and site restored.',
      feedback: 'Excellent work! The site has been safely cleared and restored for the community.',
      metrics: {
        wasteReductionPercentage: Math.max(90, Math.round(confidence * 100)),
        distanceDeltaMeters: distanceMeters || 5,
      },
    };
  }

  // Case C: Needs Review (Genuine Gemini low confidence, lighting, or mixed signals)
  return {
    locationMatch: sameLocationLikely && gpsLocationMatch,
    garbageRemoved,
    confidence,
    verdict: 'needs_review',
    reason: reasoning || 'Image lighting or angle requires human moderator confirmation.',
    feedback: `Gemini AI Vision Analysis (${Math.round(confidence * 100)}% confidence): ${reasoning || 'Lighting or angle requires human moderator confirmation.'}`,
    metrics: {
      wasteReductionPercentage: 80,
      distanceDeltaMeters: distanceMeters,
    },
  };
}

/**
 * Helper to generate mock results for explicit test overrides
 */
function generateOverrideResult(
  verdict: VerificationVerdict,
  beforeLocation: LocationCoordinates,
  afterLocation: LocationCoordinates
): CleanupVerificationResult {
  const distMeters = Math.round(
    calculateDistanceKm(
      beforeLocation.lat,
      beforeLocation.lng,
      afterLocation.lat,
      afterLocation.lng
    ) * 1000
  );

  switch (verdict) {
    case 'approved':
      return {
        locationMatch: true,
        garbageRemoved: true,
        confidence: 0.96,
        verdict: 'approved',
        reason: 'Visual comparison confirms full removal of waste and clear ground surface.',
        feedback: 'Great cleanup! CleanPoints have been credited to your balance.',
        metrics: {
          wasteReductionPercentage: 99,
          distanceDeltaMeters: distMeters || 4,
        },
      };

    case 'rejected':
      return {
        locationMatch: true,
        garbageRemoved: false,
        confidence: 0.88,
        verdict: 'rejected',
        reason: 'Significant waste remains visible along the sidewalk in after-photo.',
        feedback: 'Remaining plastic bags and packaging were detected. Please clear the area fully.',
        metrics: {
          wasteReductionPercentage: 35,
          distanceDeltaMeters: distMeters || 12,
        },
      };

    case 'needs_review':
      return {
        locationMatch: true,
        garbageRemoved: true,
        confidence: 0.65,
        verdict: 'needs_review',
        reason: 'Image angle differs from original; lighting conditions require human moderator validation.',
        feedback: 'Your cleanup is under review by Sahiwal civic moderators. You will receive points once confirmed.',
        metrics: {
          wasteReductionPercentage: 80,
          distanceDeltaMeters: distMeters || 18,
        },
      };
  }
}
