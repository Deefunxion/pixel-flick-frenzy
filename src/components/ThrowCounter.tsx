import React, { useEffect, useState } from 'react';
import type { ThrowState } from '@/game/engine/types';
import { getMsUntilNextThrow, formatRegenTime } from '@/game/engine/throws';
import { FREE_THROWS_CAP } from '@/game/constants';

interface ThrowCounterProps {
  throwState: ThrowState;
  practiceMode: boolean;
  onShopClick?: () => void;
}

export function ThrowCounter({ throwState, practiceMode, onShopClick }: ThrowCounterProps) {
  const [regenTime, setRegenTime] = useState('');

  // Update regen timer every second
  useEffect(() => {
    if (throwState.isPremium || throwState.freeThrows >= FREE_THROWS_CAP) {
      setRegenTime('');
      return;
    }

    const updateTimer = () => {
      const ms = getMsUntilNextThrow(throwState);
      setRegenTime(formatRegenTime(ms));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [throwState]);

  if (throwState.isPremium) {
    return (
      <div className="flex items-center justify-center gap-2 text-xs text-amber-400">
        <span>👑 PREMIUM</span>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col items-center gap-0.5 cursor-pointer transition-opacity ${
        practiceMode ? 'opacity-60' : ''
      }`}
      onClick={onShopClick}
    >
      <div className="flex items-center gap-3 text-xs">
        <span className="text-green-400">
          🎯 {throwState.freeThrows}
        </span>
        <span className="text-amber-400">
          ⭐ {throwState.permanentThrows}
        </span>
      </div>
      {regenTime && (
        <span className="text-[10px] text-gray-400">
          next: {regenTime}
        </span>
      )}
      {practiceMode && (
        <span className="text-[10px] text-orange-400 animate-pulse">
          PRACTICE MODE
        </span>
      )}
    </div>
  );
}
