// src/firebase/scoreSync.ts
import { doc, updateDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './config';
import { updateLeaderboardScore } from './leaderboard';

export async function syncScoreToFirebase(
  userId: string,
  nickname: string,
  totalScore: number,
  bestThrow: number
): Promise<{ totalUpdated: boolean; throwUpdated: boolean }> {
  const results = {
    totalUpdated: false,
    throwUpdated: false,
  };

  try {
    // Update user profile
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      const currentData = userDoc.data();
      const updates: Record<string, unknown> = {};

      if (totalScore > (currentData.totalScore || 0)) {
        updates.totalScore = totalScore;
      }
      if (bestThrow > (currentData.bestThrow || 0)) {
        updates.bestThrow = bestThrow;
      }

      if (Object.keys(updates).length > 0) {
        updates.updatedAt = serverTimestamp();
        await updateDoc(userRef, updates);
      }
    }

    // Update leaderboards (only on personal best)
    results.totalUpdated = await updateLeaderboardScore('totalScore', userId, nickname, totalScore);
    results.throwUpdated = await updateLeaderboardScore('bestThrow', userId, nickname, bestThrow);

    return results;
  } catch (error) {
    console.error('Error syncing score to Firebase:', error);
    return results;
  }
}
