// src/firebase/dailyLeaderboard.ts

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
import { todayLocalISODate } from '@/game/storage';

export interface DailyLeaderboardEntry {
  uid: string;
  nickname: string;
  score: number;
  stars: number;
  updatedAt: Timestamp;
}

function getCollectionPath(): string {
  const today = todayLocalISODate();
  return `daily_leaderboards/${today}/entries`;
}

export async function getDailyLeaderboard(): Promise<DailyLeaderboardEntry[]> {
  if (!db) return [];

  const q = query(
    collection(db, getCollectionPath()),
    orderBy('score', 'desc'),
    orderBy('stars', 'desc'),
    limit(100)
  );

  try {
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => d.data() as DailyLeaderboardEntry);
  } catch (error) {
    console.error('Error fetching daily leaderboard:', error);
    return [];
  }
}

export async function submitDailyScore(
  userId: string,
  nickname: string,
  score: number,
  stars: number
): Promise<boolean> {
  if (!db) return false;

  try {
    const docRef = doc(db, getCollectionPath(), userId);
    const existing = await getDoc(docRef);

    // Only update if better score
    if (existing.exists()) {
      const current = existing.data() as DailyLeaderboardEntry;
      if (score <= current.score) {
        return false;
      }
    }

    await setDoc(docRef, {
      uid: userId,
      nickname,
      score,
      stars,
      updatedAt: serverTimestamp(),
    });

    return true;
  } catch (error) {
    console.error('Error submitting daily score:', error);
    return false;
  }
}

export async function getUserDailyRank(userId: string): Promise<number | null> {
  if (!db) return null;

  try {
    const docRef = doc(db, getCollectionPath(), userId);
    const userDoc = await getDoc(docRef);

    if (!userDoc.exists()) return null;

    const userScore = userDoc.data().score;

    // Count how many scores are higher
    const q = query(
      collection(db, getCollectionPath()),
      where('score', '>', userScore)
    );

    const countSnapshot = await getCountFromServer(q);
    return countSnapshot.data().count + 1;
  } catch (error) {
    console.error('Error fetching daily rank:', error);
    return null;
  }
}

export async function getUserDailyEntry(userId: string): Promise<DailyLeaderboardEntry | null> {
  if (!db) return null;

  try {
    const docRef = doc(db, getCollectionPath(), userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data() as DailyLeaderboardEntry;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user daily entry:', error);
    return null;
  }
}
