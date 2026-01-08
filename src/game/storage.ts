import { STORAGE_VERSION } from './constants';

const PREFIX = `omf_v${STORAGE_VERSION}_`;

function safeJsonParse<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export function loadNumber(key: string, fallback: number, legacyKey?: string): number {
  const v = localStorage.getItem(PREFIX + key);
  const n = v == null ? NaN : Number(v);
  if (Number.isFinite(n)) return n;

  if (legacyKey) {
    const legacy = localStorage.getItem(legacyKey);
    const ln = legacy == null ? NaN : Number(legacy);
    if (Number.isFinite(ln)) {
      saveNumber(key, ln);
      return ln;
    }
  }

  return fallback;
}

export function saveNumber(key: string, value: number) {
  localStorage.setItem(PREFIX + key, String(value));
}

export function loadString(key: string, fallback: string, legacyKey?: string): string {
  const v = localStorage.getItem(PREFIX + key);
  if (v != null) return v;

  if (legacyKey) {
    const legacy = localStorage.getItem(legacyKey);
    if (legacy != null) {
      saveString(key, legacy);
      return legacy;
    }
  }

  return fallback;
}

export function saveString(key: string, value: string) {
  localStorage.setItem(PREFIX + key, value);
}

export function loadJson<T>(key: string, fallback: T, legacyKey?: string): T {
  const parsed = safeJsonParse<T>(localStorage.getItem(PREFIX + key));
  if (parsed != null) return parsed;

  if (legacyKey) {
    const legacyParsed = safeJsonParse<T>(localStorage.getItem(legacyKey));
    if (legacyParsed != null) {
      saveJson(key, legacyParsed);
      return legacyParsed;
    }
  }

  return fallback;
}

export function saveJson(key: string, value: unknown) {
  localStorage.setItem(PREFIX + key, JSON.stringify(value));
}

export function loadStringSet(key: string, legacyKey?: string): Set<string> {
  const arr = loadJson<string[]>(key, [], legacyKey);
  return new Set(arr);
}

export function saveStringSet(key: string, set: Set<string>) {
  saveJson(key, [...set]);
}

export type DailyStats = {
  date: string; // YYYY-MM-DD
  bestDistance: number;
  bestScore: number;
};

export function todayLocalISODate(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function loadDailyStats(): DailyStats {
  const today = todayLocalISODate();
  const stored = loadJson<DailyStats>('daily_stats', { date: today, bestDistance: 0, bestScore: 0 }, 'omf_daily_stats');
  if (stored.date !== today) {
    const reset: DailyStats = { date: today, bestDistance: 0, bestScore: 0 };
    saveJson('daily_stats', reset);
    return reset;
  }
  return stored;
}

export function saveDailyStats(stats: DailyStats) {
  saveJson('daily_stats', stats);
}

export function dailySeedFromDate(date: string): number {
  // Deterministic, simple hash -> positive int
  let h = 2166136261;
  for (let i = 0; i < date.length; i++) {
    h ^= date.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

// History tracking for stats page
export type HistoryEntry = {
  date: string;
  bestDistance: number;
  throws: number;
  score: number;
};

export function loadHistory(): HistoryEntry[] {
  return loadJson<HistoryEntry[]>('history', [], 'omf_history');
}

export function saveHistory(history: HistoryEntry[]) {
  // Keep only last 30 days
  const trimmed = history.slice(-30);
  saveJson('history', trimmed);
}

export function updateTodayHistory(bestDistance: number, throws: number, score: number) {
  const today = todayLocalISODate();
  const history = loadHistory();

  const todayIndex = history.findIndex(h => h.date === today);
  if (todayIndex >= 0) {
    history[todayIndex] = {
      date: today,
      bestDistance: Math.max(history[todayIndex].bestDistance, bestDistance),
      throws: throws,
      score: Math.max(history[todayIndex].score, score),
    };
  } else {
    history.push({ date: today, bestDistance, throws, score });
  }

  saveHistory(history);
}
