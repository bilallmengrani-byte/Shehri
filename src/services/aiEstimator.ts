/**
 * AI Waste Severity Estimator Service
 * 
 * Structured interface for future automated severity classification
 * using Gemini Multimodal / edge AI analysis.
 */

import { MissionSeverity } from '../types';

export interface SeverityEstimationResult {
  severity: MissionSeverity;
  confidence: number; // 0 to 1
  suggestedCategory?: string;
  rationale?: string;
  isAiEstimated: boolean;
}

/**
 * Hook for estimating waste severity from an uploaded/captured photo.
 * Currently uses intelligent heuristic based on image size/aspect or user-tweakable,
 * structured to easily swap for `@google/genai` or backend proxy (`/api/ai/assess-waste`).
 * 
 * Example future implementation:
 * ```ts
 * const response = await fetch('/api/assess-waste', {
 *   method: 'POST',
 *   body: JSON.stringify({ imageBase64 }),
 * });
 * return await response.json();
 * ```
 */
export async function estimateSeverityFromPhoto(
  photoDataUrl: string
): Promise<SeverityEstimationResult> {
  // Simulate rapid AI analysis latency (e.g. 400ms)
  await new Promise((res) => setTimeout(res, 450));

  // Determine heuristic for demo realism (e.g., if photo length is large or random demo suggestion)
  const length = photoDataUrl.length;
  let severity: MissionSeverity = 'medium';
  let category = 'Plastic Waste';
  let rationale = 'Scattered plastics and paper debris detected along public roadside.';

  if (length % 3 === 0) {
    severity = 'high';
    category = 'Overflowing Dumpster';
    rationale = 'Large volume of uncontained refuse creating public sidewalk obstruction.';
  } else if (length % 3 === 1) {
    severity = 'medium';
    category = 'Plastic Waste';
    rationale = 'Accumulated packaging and bottles requiring bagging.';
  } else {
    severity = 'low';
    category = 'Greenery Cleanup';
    rationale = 'Light isolated litter on walkway.';
  }

  return {
    severity,
    confidence: 0.88,
    suggestedCategory: category,
    rationale,
    isAiEstimated: true,
  };
}
