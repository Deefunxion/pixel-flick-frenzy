export type SessionGoalId =
  | 'beat_target_once'
  | 'two_perfects'
  | 'reach_multiplier_3'
  | 'no_falls_5'
  | 'land_5_times'
  | 'score_250';

export type SessionGoal = {
  id: SessionGoalId;
  label: string;
  progress: number;
  target: number;
  done: boolean;
};

const GOALS: Array<Omit<SessionGoal, 'progress' | 'done'>> = [
  { id: 'beat_target_once', label: 'Beat target (1)', target: 1 },
  { id: 'two_perfects', label: 'Perfect landings (2)', target: 2 },
  { id: 'reach_multiplier_3', label: 'Reach x3.0 (1)', target: 1 },
  { id: 'no_falls_5', label: 'No falls (5 throws)', target: 5 },
  { id: 'land_5_times', label: 'Safe landings (5)', target: 5 },
  { id: 'score_250', label: 'Score (250)', target: 250 },
];

export function newSessionGoals(): SessionGoal[] {
  // pick 3 distinct goals
  const pool = [...GOALS];
  const picked: SessionGoal[] = [];
  for (let i = 0; i < 3; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    const g = pool.splice(idx, 1)[0];
    picked.push({ ...g, progress: 0, done: false });
  }
  return picked;
}

export function updateGoals(goals: SessionGoal[], delta: Partial<Record<SessionGoalId, number>>): SessionGoal[] {
  return goals.map((g) => {
    const inc = delta[g.id] ?? 0;
    const nextProgress = Math.min(g.target, g.progress + inc);
    return { ...g, progress: nextProgress, done: nextProgress >= g.target };
  });
}
