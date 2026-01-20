import React from 'react';

interface PracticeModeOverlayProps {
  visible: boolean;
  onWatchAd?: () => void;
  onBuyThrows?: () => void;
  regenTime: string;
}

export function PracticeModeOverlay({
  visible,
  onWatchAd,
  onBuyThrows,
  regenTime
}: PracticeModeOverlayProps) {
  if (!visible) return null;

  return (
    <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-20 pointer-events-none">
      <div className="bg-slate-800/95 rounded-lg p-4 text-center max-w-xs pointer-events-auto">
        <h3 className="text-orange-400 font-bold text-lg mb-2">
          Practice Mode
        </h3>
        <p className="text-gray-300 text-sm mb-3">
          You're out of throws! Progress is paused, but you can keep practicing.
        </p>

        <div className="space-y-2">
          {onWatchAd && (
            <button
              onClick={onWatchAd}
              className="w-full bg-green-600 hover:bg-green-500 text-white py-2 px-4 rounded text-sm"
            >
              ▶️ Watch Ad (+10 throws)
            </button>
          )}

          {onBuyThrows && (
            <button
              onClick={onBuyThrows}
              className="w-full bg-amber-600 hover:bg-amber-500 text-white py-2 px-4 rounded text-sm"
            >
              ⭐ Get More Throws
            </button>
          )}

          {regenTime && (
            <p className="text-gray-400 text-xs mt-2">
              Free throw in: {regenTime}
            </p>
          )}
        </div>

        <p className="text-gray-500 text-xs mt-3">
          Tap anywhere to continue practicing
        </p>
      </div>
    </div>
  );
}
