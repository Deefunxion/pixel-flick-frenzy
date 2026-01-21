import React from 'react';
import { ACHIEVEMENTS } from '@/game/engine/achievements';
import { getAchievementReward } from '@/game/engine/achievementClaim';

interface AchievementsPanelProps {
  achievements: Set<string>;
  claimedAchievements: string[];
  onClaimAchievement: (id: string) => void;
}

type AchievementStatus = {
  id: string;
  name: string;
  desc: string;
  reward: number;
  unlocked: boolean;
  claimed: boolean;
};

function getAchievementsStatus(
  achievements: Set<string>,
  claimedIds: string[]
): AchievementStatus[] {
  return Object.entries(ACHIEVEMENTS).map(([id, ach]) => ({
    id,
    name: ach.name,
    desc: ach.desc,
    reward: getAchievementReward(id),
    unlocked: achievements.has(id),
    claimed: claimedIds.includes(id),
  }));
}

export function AchievementsPanel({
  achievements,
  claimedAchievements,
  onClaimAchievement,
}: AchievementsPanelProps) {
  const allAchievements = getAchievementsStatus(achievements, claimedAchievements);

  // Sort: unclaimed first, then claimed, then locked
  const sorted = [...allAchievements].sort((a, b) => {
    // Unclaimed (unlocked but not claimed) comes first
    const aUnclaimed = a.unlocked && !a.claimed;
    const bUnclaimed = b.unlocked && !b.claimed;
    if (aUnclaimed && !bUnclaimed) return -1;
    if (!aUnclaimed && bUnclaimed) return 1;

    // Then claimed
    if (a.claimed && !b.claimed) return -1;
    if (!a.claimed && b.claimed) return 1;

    return 0;
  });

  const unclaimedCount = allAchievements.filter(a => a.unlocked && !a.claimed).length;

  return (
    <div className="bg-slate-800/90 rounded-lg p-3">
      <h3 className="text-amber-400 font-bold text-sm mb-2 flex items-center gap-2">
        Achievements
        {unclaimedCount > 0 && (
          <span className="bg-amber-600 text-white text-xs px-1.5 py-0.5 rounded-full">
            {unclaimedCount} to claim
          </span>
        )}
      </h3>
      <div className="space-y-1.5 max-h-64 overflow-y-auto">
        {sorted.map((ach) => {
          const isUnclaimed = ach.unlocked && !ach.claimed;
          const isClaimed = ach.claimed;
          const isLocked = !ach.unlocked;

          return (
            <div
              key={ach.id}
              className={`flex items-center justify-between text-xs p-2 rounded ${
                isClaimed
                  ? 'bg-green-900/30 text-gray-400'
                  : isUnclaimed
                    ? 'bg-amber-900/40 border border-amber-600/50'
                    : 'bg-slate-700/30 text-gray-500'
              }`}
            >
              <div className="flex-1 min-w-0 mr-2">
                <span className={`font-bold ${
                  isUnclaimed ? 'text-amber-300' : isClaimed ? 'text-green-400' : 'text-gray-500'
                }`}>
                  {isClaimed ? '✓ ' : isUnclaimed ? '★ ' : '☆ '}
                  {ach.name}
                </span>
                <p className="text-gray-400 text-xs truncate opacity-70">
                  {ach.desc}
                </p>
              </div>
              {isUnclaimed && ach.reward > 0 ? (
                <button
                  onClick={() => onClaimAchievement(ach.id)}
                  className="bg-amber-600 hover:bg-amber-500 text-white px-2 py-1 rounded text-xs font-bold whitespace-nowrap transition-colors"
                >
                  +{ach.reward}
                </button>
              ) : ach.reward > 0 ? (
                <span className={`text-xs whitespace-nowrap ${isClaimed ? 'text-green-500' : 'text-gray-600'}`}>
                  {isClaimed ? `✓ +${ach.reward}` : `+${ach.reward}`}
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
      <p className="text-xs text-gray-500 mt-2 text-center">
        {achievements.size}/{Object.keys(ACHIEVEMENTS).length} unlocked
      </p>
    </div>
  );
}
