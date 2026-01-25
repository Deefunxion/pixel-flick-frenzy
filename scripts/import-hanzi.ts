// scripts/import-hanzi.ts
// Run with: npx tsx scripts/import-hanzi.ts
//
// Before running, download graphics.txt from Make Me a Hanzi:
// curl -o data/makemeahanzi/graphics.txt https://raw.githubusercontent.com/skishore/makemeahanzi/master/graphics.txt

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface RawHanziData {
  character: string;
  strokes: string[];
  medians: number[][][]; // Array of strokes, each stroke is array of [x, y] points
}

interface ProcessedCharacter {
  character: string;
  strokeCount: number;
  strokes: Array<{
    path: string;
    points: Array<{ x: number; y: number }>;
  }>;
}

/**
 * Parse SVG path data to extract key points
 * Make Me a Hanzi uses complex SVG paths with M, L, Q, C commands
 */
function parseSVGPath(pathData: string): Array<{ x: number; y: number }> {
  const points: Array<{ x: number; y: number }> = [];

  // Match M (moveto) and L (lineto) commands with coordinates
  const mlRegex = /([ML])\s*(-?\d+(?:\.\d+)?)\s*[,\s]\s*(-?\d+(?:\.\d+)?)/gi;
  let match;

  while ((match = mlRegex.exec(pathData)) !== null) {
    points.push({
      x: parseFloat(match[2]),
      y: parseFloat(match[3]),
    });
  }

  // Match Q (quadratic bezier) - take control point and end point
  const qRegex = /Q\s*(-?\d+(?:\.\d+)?)\s*[,\s]\s*(-?\d+(?:\.\d+)?)\s*[,\s]\s*(-?\d+(?:\.\d+)?)\s*[,\s]\s*(-?\d+(?:\.\d+)?)/gi;
  while ((match = qRegex.exec(pathData)) !== null) {
    // Add endpoint of quadratic curve
    points.push({
      x: parseFloat(match[3]),
      y: parseFloat(match[4]),
    });
  }

  // Match C (cubic bezier) - take end point
  const cRegex = /C\s*(-?\d+(?:\.\d+)?)\s*[,\s]\s*(-?\d+(?:\.\d+)?)\s*[,\s]\s*(-?\d+(?:\.\d+)?)\s*[,\s]\s*(-?\d+(?:\.\d+)?)\s*[,\s]\s*(-?\d+(?:\.\d+)?)\s*[,\s]\s*(-?\d+(?:\.\d+)?)/gi;
  while ((match = cRegex.exec(pathData)) !== null) {
    // Add endpoint of cubic curve
    points.push({
      x: parseFloat(match[5]),
      y: parseFloat(match[6]),
    });
  }

  return points;
}

/**
 * Convert medians (centerline points) to stroke points
 * Medians are more reliable than SVG path parsing for our use case
 */
function mediansToPoints(medians: number[][]): Array<{ x: number; y: number }> {
  return medians.map(point => ({
    x: point[0],
    y: point[1],
  }));
}

async function main() {
  const inputPath = path.join(__dirname, '../data/makemeahanzi/graphics.txt');
  const outputPath = path.join(__dirname, '../public/data/hanzi-strokes.json');

  if (!fs.existsSync(inputPath)) {
    console.error('❌ graphics.txt not found!');
    console.error('');
    console.error('Please download it first:');
    console.error('curl -o data/makemeahanzi/graphics.txt https://raw.githubusercontent.com/skishore/makemeahanzi/master/graphics.txt');
    process.exit(1);
  }

  console.log('📖 Reading graphics.txt...');
  const content = fs.readFileSync(inputPath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());

  console.log(`📊 Processing ${lines.length} characters...`);

  const characters: ProcessedCharacter[] = [];
  let skipped = 0;

  for (const line of lines) {
    try {
      const data: RawHanziData = JSON.parse(line);

      // Use medians (centerline) as primary source - more reliable
      // Each stroke has a median which is an array of [x, y] points
      const strokes = data.medians.map((median, i) => ({
        path: data.strokes[i] || '',
        points: mediansToPoints(median),
      }));

      // Filter: only include characters where each stroke has at least 2 points
      const validStrokes = strokes.filter(s => s.points.length >= 2);

      if (validStrokes.length === data.strokes.length && validStrokes.length > 0) {
        characters.push({
          character: data.character,
          strokeCount: validStrokes.length,
          strokes: validStrokes,
        });
      } else {
        skipped++;
      }
    } catch (e) {
      skipped++;
    }
  }

  // Sort by stroke count for easier browsing
  characters.sort((a, b) => a.strokeCount - b.strokeCount);

  console.log(`✅ Processed ${characters.length} characters (skipped ${skipped})`);

  // Write output
  fs.writeFileSync(outputPath, JSON.stringify(characters, null, 2));
  console.log(`💾 Saved to ${outputPath}`);

  // Show stroke count distribution
  console.log('');
  console.log('📈 Stroke count distribution:');

  const distribution: Record<number, number> = {};
  for (const char of characters) {
    distribution[char.strokeCount] = (distribution[char.strokeCount] || 0) + 1;
  }

  Object.entries(distribution)
    .sort(([a], [b]) => parseInt(a) - parseInt(b))
    .slice(0, 25) // Show first 25 stroke counts
    .forEach(([count, num]) => {
      const bar = '█'.repeat(Math.min(50, Math.floor(num / 50)));
      console.log(`  ${count.padStart(2)} strokes: ${String(num).padStart(4)} chars ${bar}`);
    });

  // Show sample characters for each stroke range
  console.log('');
  console.log('📝 Sample characters by stroke range:');

  const ranges = [
    { label: '1-3', min: 1, max: 3 },
    { label: '4-6', min: 4, max: 6 },
    { label: '7-10', min: 7, max: 10 },
    { label: '11-15', min: 11, max: 15 },
    { label: '16-20', min: 16, max: 20 },
    { label: '21+', min: 21, max: 100 },
  ];

  for (const range of ranges) {
    const chars = characters
      .filter(c => c.strokeCount >= range.min && c.strokeCount <= range.max)
      .slice(0, 10)
      .map(c => c.character)
      .join(' ');
    console.log(`  ${range.label}: ${chars}`);
  }
}

main().catch(console.error);
