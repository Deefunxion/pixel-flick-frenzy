/**
 * Landing Grade System
 *
 * Calculates letter grades (S/A/B/C/D) based on:
 * - Distance from target
 * - Rings passed
 * - Speed control (landing velocity)
 * - Edge proximity bonus
 */

export type Grade = 'S' | 'A' | 'B' | 'C' | 'D';

export interface GradeResult {
  grade: Grade;
  score: number;  // 0-100
  breakdown: {
    distance: number;    // 0-40
    rings: number;       // 0-30
    speedControl: number; // 0-20
    edgeBonus: number;   // 0-10
  };
  comment: string;
}

// Grade thresholds
const GRADE_THRESHOLDS: Record<Grade, number> = {
  S: 90,
  A: 70,
  B: 50,
  C: 30,
  D: 0,
};

// Coach comments per grade (English only)
const COMMENTS: Record<Grade, string[]> = {
  S: ['FLAWLESS!', 'LEGENDARY!', 'MASTERFUL!', 'PERFECT!'],
  A: ['Solid!', 'Clean run!', 'Nice work!', 'Great job!'],
  B: ['Not bad!', 'Getting there!', 'Keep it up!', 'Good effort!'],
  C: ['Room to improve', 'Keep trying!', 'You got this!'],
  D: ['Ouch...', 'Shake it off!', 'Try again!'],
};

// Tips for C/D grades
const TIPS = [
  'Tip: Try less power next time',
  'Tip: Use brake near the edge',
  'Tip: Aim for the rings!',
  'Tip: Watch your landing speed',
  'Tip: Hold to charge longer',
];

/**
 * Calculate landing grade
 */
export function calculateGrade(
  landingX: number,
  targetX: number,
  ringsPassedThisThrow: number,
  landingVelocity: number,  // Absolute velocity at landing
  fellOff: boolean
): GradeResult {
  // If fell off, always D
  if (fellOff) {
    return {
      grade: 'D',
      score: 0,
      breakdown: { distance: 0, rings: 0, speedControl: 0, edgeBonus: 0 },
      comment: getRandomComment('D'),
    };
  }

  // Distance score (0-40 points)
  // Perfect = within 2px of target
  const distFromTarget = Math.abs(landingX - targetX);
  let distanceScore: number;
  if (distFromTarget < 2) {
    distanceScore = 40;  // Perfect
  } else if (distFromTarget < 5) {
    distanceScore = 35;  // Excellent
  } else if (distFromTarget < 10) {
    distanceScore = 30;  // Great
  } else if (distFromTarget < 20) {
    distanceScore = 20;  // Good
  } else if (distFromTarget < 50) {
    distanceScore = 10;  // Okay
  } else {
    distanceScore = Math.max(0, 5 - distFromTarget / 100);  // Poor
  }

  // Rings score (0-30 points, 10 per ring)
  const ringsScore = Math.min(30, ringsPassedThisThrow * 10);

  // Speed control score (0-20 points)
  // Lower landing velocity = better control
  let speedScore: number;
  if (landingVelocity < 1) {
    speedScore = 20;  // Perfect stop
  } else if (landingVelocity < 2) {
    speedScore = 15;  // Great control
  } else if (landingVelocity < 3) {
    speedScore = 10;  // Good
  } else if (landingVelocity < 5) {
    speedScore = 5;   // Okay
  } else {
    speedScore = 0;   // Fast landing
  }

  // Edge proximity bonus (0-10 points)
  // Bonus for landing close to 420 without falling
  let edgeBonus = 0;
  if (landingX >= 415) {
    edgeBonus = 10;  // Maximum risk
  } else if (landingX >= 410) {
    edgeBonus = 7;
  } else if (landingX >= 400) {
    edgeBonus = 4;
  }

  const totalScore = distanceScore + ringsScore + speedScore + edgeBonus;

  // Determine grade
  let grade: Grade = 'D';
  for (const [g, threshold] of Object.entries(GRADE_THRESHOLDS) as [Grade, number][]) {
    if (totalScore >= threshold) {
      grade = g;
      break;
    }
  }

  return {
    grade,
    score: totalScore,
    breakdown: {
      distance: distanceScore,
      rings: ringsScore,
      speedControl: speedScore,
      edgeBonus,
    },
    comment: getRandomComment(grade),
  };
}

function getRandomComment(grade: Grade): string {
  const comments = COMMENTS[grade];
  return comments[Math.floor(Math.random() * comments.length)];
}

export function getRandomTip(): string {
  return TIPS[Math.floor(Math.random() * TIPS.length)];
}

// Grade colors
export const GRADE_COLORS: Record<Grade, string> = {
  S: '#FFD700',  // Gold
  A: '#C0C0C0',  // Silver
  B: '#CD7F32',  // Bronze
  C: '#808080',  // Gray
  D: '#4A4A4A',  // Dark gray
};

// Grade should show confetti
export function shouldShowConfetti(grade: Grade): boolean {
  return grade === 'S' || grade === 'A';
}
