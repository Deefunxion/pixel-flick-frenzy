import React, { useState, useEffect } from 'react';
import { ACHIEVEMENTS } from '@/game/engine/achievements';
import { getAchievementReward, getClaimableAchievements } from '@/game/engine/achievementClaim';

interface AchievementsPanelProps {
  achievements: Set<string>;
  claimedAchievements: string[];
  onClaimAchievement: (id: string) => void;
  onClaimAll?: () => Promise<void>;
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
  onClaimAll,
}: AchievementsPanelProps) {
  const [allAchievements, setAllAchievements] = useState(() =>
    getAchievementsStatus(achievements, claimedAchievements)
  );
  const [claimingAll, setClaimingAll] = useState(false);
  const [claimProgress, setClaimProgress] = useState(0);
  const [highlightId, setHighlightId] = useState<string | null>(null);

  // Update when props change
  useEffect(() => {
    setAllAchievements(getAchievementsStatus(achievements, claimedAchievements));
  }, [achievements, claimedAchievements]);

  // Sort: unclaimed first, then claimed, then locked
  const sorted = [...allAchievements].sort((a, b) => {
    const aUnclaimed = a.unlocked && !a.claimed;
    const bUnclaimed = b.unlocked && !b.claimed;
    if (aUnclaimed && !bUnclaimed) return -1;
    if (!aUnclaimed && bUnclaimed) return 1;
    if (a.claimed && !b.claimed) return -1;
    if (!a.claimed && b.claimed) return 1;
    return 0;
  });

  const unclaimed = allAchievements.filter(a => a.unlocked && !a.claimed);
  const unclaimedCount = unclaimed.length;
  const totalReward = unclaimed.reduce((sum, a) => sum + a.reward, 0);

  const handleClaimAll = async () => {
    if (claimingAll || unclaimedCount === 0) return;

    setClaimingAll(true);
    setClaimProgress(0);

    const claimable = getClaimableAchievements(achievements, claimedAchievements);

    // Animated cascade: claim one by one with 50ms delay
    for (let i = 0; i < claimable.length; i++) {
      const { id, reward } = claimable[i];
      setHighlightId(id);
      setClaimProgress(prev => prev + reward);

      onClaimAchievement(id);

      // Wait 50ms before next claim
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    setHighlightId(null);
    setClaimingAll(false);

    // Call onClaimAll callback if provided
    onClaimAll?.();
  };

  return (
    <div className="bg-slate-800/90 rounded-lg p-3">
      {/* Header with Claim All button */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-amber-400 font-bold text-sm flex items-center gap-2">
          Achievements
          {unclaimedCount > 0 && (
            <span className="bg-amber-600 text-white text-xs px-1.5 py-0.5 rounded-full">
              {unclaimedCount}
            </span>
          )}
        </h3>

        {/* Claim All Button */}
        {unclaimedCount > 0 && (
          <button
            onClick={handleClaimAll}
            disabled={claimingAll}
            className="bg-amber-600 hover:bg-amber-500 disabled:bg-amber-800 text-white px-3 py-1 rounded text-xs font-bold transition-colors flex items-center gap-1"
          >
            {claimingAll ? (
              <span>+{claimProgress}...</span>
            ) : (
              <span>Claim All (+{totalReward})</span>
            )}
          </button>
        )}
      </div>

      <div className="space-y-1.5 max-h-64 overflow-y-auto">
        {sorted.map((ach) => {
          const isUnclaimed = ach.unlocked && !ach.claimed;
          const isClaimed = ach.claimed;
          const isHighlighted = highlightId === ach.id;

          return (
            <div
              key={ach.id}
              className={`flex items-center justify-between text-xs p-2 rounded transition-all ${
                isHighlighted
                  ? 'bg-amber-500/50 border border-amber-400 scale-[1.02]'
                  : isClaimed
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
              {isUnclaimed && ach.reward > 0 && !claimingAll ? (
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
