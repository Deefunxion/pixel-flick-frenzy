// src/firebase/sync.ts
import { doc, getDoc, updateDoc, serverTimestamp, type Timestamp } from 'firebase/firestore';
import { db } from './config';
import { type UserProfile } from './auth';
import {
  loadJson,
  loadNumber,
  loadStringSet,
  saveJson,
  saveNumber,
  saveStringSet,
  loadString,
  saveString,
} from '@/game/storage';

export type ArcadeStars = { allDoodles: boolean; inOrder: boolean; landedInZone: boolean };

export type LocalData = {
  totalScore: number;
  bestThrow: number;
  achievements: string[];
  unlockedThemes: string[];
  stats: UserProfile['stats'];
  settings: UserProfile['settings'];
  settingsUpdatedAt?: number; // Unix timestamp for local comparison
  arcadeProgress: {
    starsPerLevel: Record<number, ArcadeStars>;
    highestLevelReached: number;
  };
};

// Load all local data
export function getLocalData(): LocalData {
  const arcadeState = loadJson<{ starsPerLevel?: Record<number, ArcadeStars>; currentLevelId?: number }>(
    'arcade_state',
    { starsPerLevel: {}, currentLevelId: 1 }
  );

  return {
    totalScore: loadNumber('total_score', 0, 'omf_total_score'),
    bestThrow: loadNumber('best', 0, 'omf_best'),
    achievements: [...loadStringSet('achievements', 'omf_achievements')],
    unlockedThemes: [...loadStringSet('unlocked_themes', 'omf_unlocked_themes')],
    stats: loadJson('stats', {
      totalThrows: 0,
      successfulLandings: 0,
      totalDistance: 0,
      perfectLandings: 0,
      maxMultiplier: 1,
    }, 'omf_stats'),
    settings: {
      reduceFx: loadJson('reduce_fx', false, 'omf_reduce_fx'),
      themeId: loadString('theme_id', 'flipbook', 'omf_theme_id'),
      audioVolume: loadNumber('audio_volume', 0.7, 'omf_audio_volume'),
      audioMuted: loadJson('audio_muted', false, 'omf_audio_muted'),
    },
    settingsUpdatedAt: loadNumber('settings_updated_at', 0),
    arcadeProgress: {
      starsPerLevel: arcadeState.starsPerLevel || {},
      highestLevelReached: arcadeState.currentLevelId || 1,
    },
  };
}

// Save all data locally
export function saveLocalData(data: LocalData) {
  saveNumber('total_score', data.totalScore);
  saveNumber('best', data.bestThrow);
  saveStringSet('achievements', new Set(data.achievements));
  saveStringSet('unlocked_themes', new Set(data.unlockedThemes));
  saveJson('stats', data.stats);
  saveJson('reduce_fx', data.settings.reduceFx);
  saveString('theme_id', data.settings.themeId);
  saveNumber('audio_volume', data.settings.audioVolume);
  saveJson('audio_muted', data.settings.audioMuted);
  if (data.settingsUpdatedAt) {
    saveNumber('settings_updated_at', data.settingsUpdatedAt);
  }
  // Save arcade progress
  if (data.arcadeProgress) {
    saveJson('arcade_state', {
      starsPerLevel: data.arcadeProgress.starsPerLevel,
      currentLevelId: data.arcadeProgress.highestLevelReached,
    });
  }
}

// Convert Firestore Timestamp to Unix ms
function timestampToMs(ts: Timestamp | undefined): number {
  return ts ? ts.toMillis() : 0;
}

// Merge arcade stars (keep best achievements per level)
function mergeArcadeStars(
  local: Record<number, ArcadeStars>,
  cloud: Record<number, ArcadeStars> | undefined
): Record<number, ArcadeStars> {
  if (!cloud) return local;

  const merged: Record<number, ArcadeStars> = {};
  const allLevels = new Set([
    ...Object.keys(local).map(Number),
    ...Object.keys(cloud).map(Number),
  ]);

  allLevels.forEach(levelId => {
    const l = local[levelId] || { allDoodles: false, inOrder: false, landedInZone: false };
    const c = cloud[levelId] || { allDoodles: false, inOrder: false, landedInZone: false };
    merged[levelId] = {
      allDoodles: l.allDoodles || c.allDoodles,
      inOrder: l.inOrder || c.inOrder,
      landedInZone: l.landedInZone || c.landedInZone,
    };
  });

  return merged;
}

// Merge local and cloud data (keep highest/best, most recent settings)
export function mergeData(
  local: LocalData,
  cloud: Partial<UserProfile>,
  cloudSettingsUpdatedAt?: Timestamp
): LocalData {
  const cloudSettingsMs = timestampToMs(cloudSettingsUpdatedAt);
  const localSettingsMs = local.settingsUpdatedAt || 0;

  // Settings: use whichever is more recent
  const useCloudSettings = cloudSettingsMs > localSettingsMs;

  return {
    // Keep highest scores
    totalScore: Math.max(local.totalScore, cloud.totalScore || 0),
    bestThrow: Math.max(local.bestThrow, cloud.bestThrow || 0),

    // Union of achievements and themes
    achievements: [...new Set([...local.achievements, ...(cloud.achievements || [])])],
    unlockedThemes: [...new Set([...local.unlockedThemes, ...(cloud.unlockedThemes || [])])],

    // Keep highest stats
    stats: {
      totalThrows: Math.max(local.stats.totalThrows, cloud.stats?.totalThrows || 0),
      successfulLandings: Math.max(local.stats.successfulLandings, cloud.stats?.successfulLandings || 0),
      totalDistance: Math.max(local.stats.totalDistance, cloud.stats?.totalDistance || 0),
      perfectLandings: Math.max(local.stats.perfectLandings, cloud.stats?.perfectLandings || 0),
      maxMultiplier: Math.max(local.stats.maxMultiplier, cloud.stats?.maxMultiplier || 1),
    },

    // Settings: use most recent
    settings: useCloudSettings && cloud.settings ? cloud.settings : local.settings,
    settingsUpdatedAt: Math.max(localSettingsMs, cloudSettingsMs),

    // Merge arcade progress (keep best stars per level, highest level reached)
    arcadeProgress: {
      starsPerLevel: mergeArcadeStars(
        local.arcadeProgress?.starsPerLevel || {},
        cloud.arcadeProgress?.starsPerLevel
      ),
      highestLevelReached: Math.max(
        local.arcadeProgress?.highestLevelReached || 1,
        cloud.arcadeProgress?.highestLevelReached || 1
      ),
    },
  };
}

// Sync data after Google account link
export async function syncAfterGoogleLink(userId: string): Promise<LocalData> {
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);

  const localData = getLocalData();

  if (userDoc.exists()) {
    const cloudData = userDoc.data() as UserProfile;
    const mergedData = mergeData(localData, cloudData, cloudData.settingsUpdatedAt);

    // Save merged data locally
    saveLocalData(mergedData);

    // Update cloud with merged data
    await updateDoc(userRef, {
      totalScore: mergedData.totalScore,
      bestThrow: mergedData.bestThrow,
      achievements: mergedData.achievements,
      unlockedThemes: mergedData.unlockedThemes,
      stats: mergedData.stats,
      settings: mergedData.settings,
      settingsUpdatedAt: serverTimestamp(),
      arcadeProgress: mergedData.arcadeProgress,
    });

    return mergedData;
  }

  return localData;
}

// Pull data from cloud on login
export async function pullCloudData(userId: string): Promise<LocalData | null> {
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);

  if (userDoc.exists()) {
    const cloudData = userDoc.data() as UserProfile;
    const localData = getLocalData();
    const mergedData = mergeData(localData, cloudData, cloudData.settingsUpdatedAt);

    // Save merged data locally
    saveLocalData(mergedData);

    return mergedData;
  }

  return null;
}
