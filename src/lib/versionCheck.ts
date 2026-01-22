/**
 * Version Check System
 *
 * Automatically detects when a new build is deployed and forces
 * a cache refresh. Essential for users accessing via social media
 * links who don't know how to manually clear browser cache.
 */

// Injected by Vite at build time
declare const __BUILD_TIME__: string;

const VERSION_KEY = 'omf_build_version';
const RELOAD_FLAG_KEY = 'omf_just_reloaded';

/**
 * Keys to preserve during cache clear (user data we don't want to lose)
 */
const PRESERVE_KEYS = [
  // Game progress
  'omf_best',
  'omf_total_score',
  'omf_zeno_target',
  'omf_zeno_level',
  'omf_stats',
  'omf_achievements',
  'omf_total_falls',
  // User settings
  'omf_sound_on',
  'omf_music_volume',
  'omf_sfx_volume',
  'omf_reduce_fx',
  'omf_theme',
  // Auth
  'onboarding_complete',
  // Throw system
  'omf_throw_state',
  'omf_daily_tasks',
  'omf_milestones_claimed',
  // Tutorial progress (keep so they don't see tutorials again)
  'tutorial_charge_seen',
  'tutorial_air_seen',
  'tutorial_slide_seen',
];

/**
 * Check if a new version is available and handle cache refresh
 * Call this at app startup before any heavy initialization
 */
export function checkVersionAndRefresh(): boolean {
  // Skip in development
  if (import.meta.env.DEV) {
    return false;
  }

  try {
    const currentBuildTime = __BUILD_TIME__;
    const storedBuildTime = localStorage.getItem(VERSION_KEY);
    const justReloaded = sessionStorage.getItem(RELOAD_FLAG_KEY);

    // First time visitor - just store version
    if (!storedBuildTime) {
      localStorage.setItem(VERSION_KEY, currentBuildTime);
      console.log('[VersionCheck] First visit, storing version:', currentBuildTime);
      return false;
    }

    // Same version - all good
    if (storedBuildTime === currentBuildTime) {
      return false;
    }

    // Version mismatch! New build detected
    console.log('[VersionCheck] New version detected!');
    console.log('[VersionCheck] Old:', storedBuildTime);
    console.log('[VersionCheck] New:', currentBuildTime);

    // Prevent infinite reload loop
    if (justReloaded) {
      console.warn('[VersionCheck] Already reloaded once, skipping to prevent loop');
      localStorage.setItem(VERSION_KEY, currentBuildTime);
      sessionStorage.removeItem(RELOAD_FLAG_KEY);
      return false;
    }

    // Preserve important user data
    const preserved: Record<string, string | null> = {};
    PRESERVE_KEYS.forEach(key => {
      preserved[key] = localStorage.getItem(key);
    });

    // Clear all localStorage
    localStorage.clear();

    // Restore preserved data
    Object.entries(preserved).forEach(([key, value]) => {
      if (value !== null) {
        localStorage.setItem(key, value);
      }
    });

    // Store new version
    localStorage.setItem(VERSION_KEY, currentBuildTime);

    // Set reload flag to prevent infinite loop
    sessionStorage.setItem(RELOAD_FLAG_KEY, 'true');

    // Clear browser caches if available
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          caches.delete(name);
          console.log('[VersionCheck] Cleared cache:', name);
        });
      });
    }

    // Force reload with cache bypass
    console.log('[VersionCheck] Reloading to apply new version...');
    window.location.reload();
    return true; // Indicates reload initiated

  } catch (error) {
    console.error('[VersionCheck] Error during version check:', error);
    return false;
  }
}

/**
 * Get current build version (for display in UI if needed)
 */
export function getBuildVersion(): string {
  try {
    return __BUILD_TIME__;
  } catch {
    return 'unknown';
  }
}
