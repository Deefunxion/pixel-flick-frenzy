// src/lib/assetPath.ts

/**
 * Utility to resolve asset paths correctly for both Firebase and itch.io builds.
 *
 * Firebase hosting uses absolute paths (base: "/")
 * itch.io uses relative paths (base: "./")
 *
 * Vite sets import.meta.env.BASE_URL based on the build mode.
 */

/**
 * Resolve an asset path using the correct base URL for the current build.
 * @param path - Asset path starting with "/" (e.g., "/assets/sprites/zeno.png")
 * @returns Resolved path with correct base URL
 */
export function assetPath(path: string): string {
  // Remove leading slash if present, since BASE_URL already handles it
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${import.meta.env.BASE_URL}${cleanPath}`;
}
