// scripts/classify-characters.ts
// Run with: npx tsx scripts/classify-characters.ts

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

import { classifyCharacter } from '../src/game/engine/arcade/generator/character-classifier';
import type { CharacterData, Archetype } from '../src/game/engine/arcade/generator/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INPUT_PATH = path.join(__dirname, '../public/data/hanzi-strokes.json');
const OUTPUT_PATH = path.join(__dirname, '../public/data/hanzi-classified.json');

interface ClassifiedOutput {
  character: string;
  strokeCount: number;
  archetype: Archetype;
  strokes: CharacterData['strokes'];
}

async function main() {
  console.log('📖 Loading character database...');

  if (!fs.existsSync(INPUT_PATH)) {
    console.error('❌ hanzi-strokes.json not found!');
    console.error('');
    console.error('Please run import-hanzi.ts first:');
    console.error('npx tsx scripts/import-hanzi.ts');
    process.exit(1);
  }

  const raw = fs.readFileSync(INPUT_PATH, 'utf-8');
  const characters: CharacterData[] = JSON.parse(raw);

  console.log(`🔬 Classifying ${characters.length} characters...`);

  const classified: ClassifiedOutput[] = [];
  const stats: Record<Archetype, number> = {
    runner: 0, diver: 0, climber: 0, zigzag: 0,
    perimeter: 0, split: 0, general: 0
  };

  for (const char of characters) {
    const result = classifyCharacter(char);
    stats[result.archetype]++;

    classified.push({
      character: char.character,
      strokeCount: char.strokeCount,
      archetype: result.archetype,
      strokes: char.strokes,
    });
  }

  console.log('');
  console.log('📊 Classification results:');
  for (const [arch, count] of Object.entries(stats)) {
    const pct = ((count / characters.length) * 100).toFixed(1);
    const bar = '█'.repeat(Math.min(40, Math.floor(count / 200)));
    console.log(`  ${arch.padEnd(10)}: ${String(count).padStart(5)} (${pct.padStart(5)}%) ${bar}`);
  }

  console.log('');
  console.log(`💾 Writing to ${OUTPUT_PATH}...`);
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(classified, null, 2));

  // Show sample characters for each archetype
  console.log('');
  console.log('📝 Sample characters by archetype:');

  const archetypes: Archetype[] = ['runner', 'diver', 'climber', 'zigzag', 'perimeter', 'split', 'general'];
  for (const arch of archetypes) {
    const samples = classified
      .filter(c => c.archetype === arch)
      .slice(0, 10)
      .map(c => c.character)
      .join(' ');
    console.log(`  ${arch.padEnd(10)}: ${samples}`);
  }

  console.log('');
  console.log('✅ Done!');
}

main().catch(console.error);
