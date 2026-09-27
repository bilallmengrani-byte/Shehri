import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore, Transaction } from 'firebase-admin/firestore';
import {
  VERIFICATION_SYSTEM_INSTRUCTION,
  VERIFICATION_PROMPT,
} from './src/config/verificationPrompt';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Initialize Firebase Admin SDK for server-authoritative trusted writes
if (!getApps().length) {
  try {
    initializeApp({
      projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'gen-lang-client-0075882837',
    });
  } catch (err) {
    console.warn('Firebase Admin init warning:', err);
  }
}
const adminDb = getApps().length > 0 ? getFirestore() : null;

// Support base64 image uploads up to 25MB
app.use(express.json({ limit: '25mb' }));

// Health Check Endpoint for Cold-Start Server Detection
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

/**
 * Helper to convert data URL or HTTP image URL into Gemini inlineData format
 */
async function parseImagePart(photoInput: string): Promise<{ mimeType: string; data: string }> {
  if (!photoInput) {
    throw new Error('Empty image input provided.');
  }

  // Case 1: Data URL (e.g., "data:image/jpeg;base64,xxxx...")
  if (photoInput.startsWith('data:')) {
    const matches = photoInput.match(/^data:([^;]+);base64,(.+)$/);
    if (matches && matches.length === 3) {
      return {
        mimeType: matches[1],
        data: matches[2],
      };
    }
  }

  // Case 2: Standard Base64 string without data prefix
  if (!photoInput.startsWith('http://') && !photoInput.startsWith('https://') && !photoInput.startsWith('/')) {
    return {
      mimeType: 'image/jpeg',
      data: photoInput,
    };
  }

  // Case 3: Remote HTTP/HTTPS image URL or local relative asset path
  let fetchUrl = photoInput;
  if (photoInput.startsWith('/')) {
    fetchUrl = `http://localhost:${PORT}${photoInput}`;
  }

  try {
    const response = await fetch(fetchUrl);
    if (!response.ok) {
      console.warn(`Image fetch HTTP ${response.status} for URL: ${fetchUrl}`);
      // Return 1x1 transparent placeholder GIF base64 if remote image URL fails to load
      return {
        mimeType: 'image/gif',
        data: 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      };
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const arrayBuffer = await response.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString('base64');

    return {
      mimeType: contentType.split(';')[0] || 'image/jpeg',
      data: base64Data,
    };
  } catch (err) {
    console.warn(`Failed to fetch image from URL (${fetchUrl}):`, err);
    return {
      mimeType: 'image/gif',
      data: 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
    };
  }
}

/**
 * Gemini Multimodal Cleanup Verification Endpoint
 */
app.post('/api/verify-cleanup', async (req, res) => {
  try {
    const { beforePhoto, afterPhoto } = req.body;

    if (!beforePhoto || !afterPhoto) {
      return res.status(400).json({
        error: 'Missing required images',
        message: 'Both beforePhoto and afterPhoto are required for verification.',
      });
    }

    // Convert both photos to inlineData base64 parts
    const beforePart = await parseImagePart(beforePhoto);
    const afterPart = await parseImagePart(afterPhoto);

    // Call Gemini Flash multimodal model
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { text: VERIFICATION_PROMPT },
          { inlineData: beforePart },
          { inlineData: afterPart },
        ],
      },
      config: {
        systemInstruction: VERIFICATION_SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            sameLocationLikely: { type: Type.BOOLEAN },
            garbageRemoved: { type: Type.BOOLEAN },
            confidence: { type: Type.NUMBER },
            reasoning: { type: Type.STRING },
          },
          required: ['sameLocationLikely', 'garbageRemoved', 'confidence', 'reasoning'],
        },
      },
    });

    const responseText = response.text?.trim();
    if (!responseText) {
      throw new Error('Gemini returned an empty response.');
    }

    const parsedResult = JSON.parse(responseText);
    return res.json(parsedResult);
  } catch (err: unknown) {
    const errorMessage = (err as Error)?.message || 'Gemini Vision API error';
    console.warn('Gemini cleanup verification server error:', errorMessage);

    // Returning status 500 causes verification.ts to route gracefully to 'needs_review'
    return res.status(500).json({
      error: 'Gemini verification failed',
      message: errorMessage,
    });
  }
});

/**
 * Server-Authoritative Mission Completion Endpoint
 * Called after verification succeeds. Updates mission status to 'verified' and
 * awards CleanPoints to the user's document using Firebase Admin credentials.
 */
app.post('/api/complete-verification', async (req, res) => {
  try {
    const { userId, missionId, cleanPhoto, pointsAwarded = 100, wasteKg = 15 } = req.body;

    if (!userId || !missionId) {
      return res.status(400).json({ error: 'Missing userId or missionId' });
    }

    if (!adminDb) {
      return res.status(500).json({ error: 'Firebase Admin not initialized' });
    }

    const now = new Date().toISOString();

    // 1. Update Mission status in Firestore
    const missionRef = adminDb.collection('missions').doc(missionId);
    await missionRef.set(
      {
        status: 'verified',
        cleanPhoto: cleanPhoto || '',
        verifiedAt: now,
      },
      { merge: true }
    );

    // 2. Award CleanPoints and update user stats atomically in Firestore
    const userRef = adminDb.collection('users').doc(userId);
    await adminDb.runTransaction(async (transaction: Transaction) => {
      const userDoc = await transaction.get(userRef);
      if (userDoc.exists) {
        const data = userDoc.data() || {};
        const currentPoints = Number(data.cleanPoints || 0);
        const currentCleanups = Number(data.cleanupsCompleted || data.missionsCleaned || 0);
        const currentWasteKg = Number(data.wasteDivertedKg || 0);

        transaction.update(userRef, {
          cleanPoints: currentPoints + Number(pointsAwarded),
          cleanupsCompleted: currentCleanups + 1,
          missionsCleaned: currentCleanups + 1,
          verifiedCleanups: (Number(data.verifiedCleanups) || 0) + 1,
          wasteDivertedKg: currentWasteKg + Number(wasteKg),
        });
      }
    });

    return res.json({
      success: true,
      message: `Mission ${missionId} verified. ${pointsAwarded} CleanPoints awarded to user ${userId}.`,
    });
  } catch (err: unknown) {
    console.error('Server verification completion error:', err);
    return res.status(500).json({
      error: 'Failed to complete mission verification on server',
      message: (err as Error)?.message,
    });
  }
});

/**
 * Server-Authoritative Reward Redemption Endpoint
 * Validates citizen point balance, deducts CleanPoints, and issues redemption record.
 */
app.post('/api/redeem-reward', async (req, res) => {
  try {
    const {
      userId,
      rewardId,
      rewardTitle,
      rewardTitleUrdu,
      businessName,
      businessNameUrdu,
      businessAddress,
      category,
      pointsCost,
      discountValue,
      code,
      validDays = 30,
    } = req.body;

    if (!userId || !rewardId || !pointsCost || !code) {
      return res.status(400).json({ error: 'Missing required redemption parameters' });
    }

    if (!adminDb) {
      return res.status(500).json({ error: 'Firebase Admin not initialized' });
    }

    const now = new Date();
    const expires = new Date();
    expires.setDate(expires.getDate() + Number(validDays));

    const redemptionId = `rdm-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const userRef = adminDb.collection('users').doc(userId);
    const redemptionRef = adminDb.collection('redemptions').doc(redemptionId);

    let remainingPoints = 0;

    await adminDb.runTransaction(async (transaction: Transaction) => {
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists) {
        throw new Error('User profile not found');
      }

      const userData = userDoc.data() || {};
      const currentPoints = Number(userData.cleanPoints || 0);

      if (currentPoints < Number(pointsCost)) {
        throw new Error(`Insufficient CleanPoints balance. You have ${currentPoints} pts, required ${pointsCost} pts.`);
      }

      remainingPoints = currentPoints - Number(pointsCost);

      // Deduct points from user profile
      transaction.update(userRef, { cleanPoints: remainingPoints });

      // Create redemption record in Firestore
      transaction.set(redemptionRef, {
        id: redemptionId,
        userId,
        rewardId,
        rewardTitle: rewardTitle || '',
        rewardTitleUrdu: rewardTitleUrdu || '',
        businessName: businessName || '',
        businessNameUrdu: businessNameUrdu || '',
        businessAddress: businessAddress || '',
        category: category || 'voucher',
        pointsCost: Number(pointsCost),
        discountValue: discountValue || '',
        code,
        redeemedAt: now.toISOString(),
        expiresAt: expires.toISOString(),
        status: 'active',
      });
    });

    return res.json({
      success: true,
      remainingPoints,
      redemptionId,
      code,
    });
  } catch (err: unknown) {
    console.error('Server reward redemption error:', err);
    return res.status(400).json({
      error: 'Redemption failed',
      message: (err as Error)?.message || 'Failed to redeem reward on server.',
    });
  }
});

// Configure Vite middleware in development or static serving in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
