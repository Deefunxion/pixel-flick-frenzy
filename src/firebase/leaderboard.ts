// src/firebase/leaderboard.ts
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  orderBy,
  limit,
  where,
  getCountFromServer,
  serverTimestamp,
  type Timestamp,
} from 'firebase/firestore';
import { db } from './config';

export type LeaderboardEntry = {
  uid: string;
  nickname: string;
  score: number;
  updatedAt: Timestamp;
};

export type LeaderboardType = 'totalScore' | 'bestThrow' | 'mostFalls';

// Get top 100 for a leaderboard (with tie-breaker ordering)
export async function getLeaderboard(type: LeaderboardType): Promise<LeaderboardEntry[]> {
  try {
    const collectionName = type === 'totalScore' ? 'leaderboard_total' : type === 'bestThrow' ? 'leaderboard_throw' : 'leaderboard_falls';
    const q = query(
      collection(db, collectionName),
      orderBy('score', 'desc'),
      orderBy('updatedAt', 'asc'), // Tie-breaker: earlier timestamp wins
      limit(100)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as LeaderboardEntry);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return [];
  }
}

// Get user's rank in a leaderboard (efficient count query)
export async function getUserRank(type: LeaderboardType, userId: string): Promise<number | null> {
  try {
    const collectionName = type === 'totalScore' ? 'leaderboard_total' : type === 'bestThrow' ? 'leaderboard_throw' : 'leaderboard_falls';
    const userDoc = await getDoc(doc(db, collectionName, userId));

    if (!userDoc.exists()) return null;

    const userScore = userDoc.data().score;

    // Use getCountFromServer for efficient counting (doesn't download docs)
    const q = query(
      collection(db, collectionName),
      where('score', '>', userScore)
    );

    const countSnapshot = await getCountFromServer(q);
    return countSnapshot.data().count + 1; // Rank is count of higher scores + 1
  } catch (error) {
    console.error('Error fetching user rank:', error);
    return null;
  }
}

// Update user's score (only if it's a new personal best)
export async function updateLeaderboardScore(
  type: LeaderboardType,
  userId: string,
  nickname: string,
  newScore: number
): Promise<boolean> {
  try {
    const collectionName = type === 'totalScore' ? 'leaderboard_total' : type === 'bestThrow' ? 'leaderboard_throw' : 'leaderboard_falls';
    const docRef = doc(db, collectionName, userId);
    const existingDoc = await getDoc(docRef);

    // Only update if new score is higher
    if (existingDoc.exists()) {
      const currentScore = existingDoc.data().score;
      if (newScore <= currentScore) {
        return false; // Not a new record
      }
    }

    const entry: Omit<LeaderboardEntry, 'updatedAt'> & { updatedAt: ReturnType<typeof serverTimestamp> } = {
      uid: userId,
      nickname,
      score: newScore,
      updatedAt: serverTimestamp(),
    };

    await setDoc(docRef, entry);
    return true;
  } catch (error) {
    console.error('Error updating leaderboard:', error);
    return false;
  }
}

// Get user's entry for a specific leaderboard
export async function getUserLeaderboardEntry(
  type: LeaderboardType,
  userId: string
): Promise<LeaderboardEntry | null> {
  try {
    const collectionName = type === 'totalScore' ? 'leaderboard_total' : type === 'bestThrow' ? 'leaderboard_throw' : 'leaderboard_falls';
    const docRef = doc(db, collectionName, userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data() as LeaderboardEntry;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user entry:', error);
    return null;
  }
}
