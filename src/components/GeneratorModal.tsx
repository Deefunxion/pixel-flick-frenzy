// src/components/GeneratorModal.tsx
import { useState, useCallback } from 'react';
import { LevelGenerator } from '@/game/engine/arcade/generator/level-generator';
import type { ArcadeLevel } from '@/game/engine/arcade/types';
import type { GenerationResult, GhostInput } from '@/game/engine/arcade/generator/types';

interface GeneratorModalProps {
  onClose: () => void;
  onComplete: (levels: ArcadeLevel[], ghostReplays: Record<number, GhostInput[]>) => void;
}

export function GeneratorModal({ onClose, onComplete }: GeneratorModalProps) {
  const [seed, setSeed] = useState('');
  const [startLevel, setStartLevel] = useState(11);
  const [endLevel, setEndLevel] = useState(50);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [currentResult, setCurrentResult] = useState<GenerationResult | null>(null);
  const [failed, setFailed] = useState<number[]>([]);
  const [completed, setCompleted] = useState(false);
  const [generatedLevels, setGeneratedLevels] = useState<ArcadeLevel[]>([]);
  const [generatedReplays, setGeneratedReplays] = useState<Record<number, GhostInput[]>>({});

  const handleGenerate = useCallback(async () => {
    if (!seed.trim()) {
      alert('Please enter a seed');
      return;
    }

    if (startLevel > endLevel) {
      alert('Start level must be less than or equal to end level');
      return;
    }

    setGenerating(true);
    setFailed([]);
    setCompleted(false);
    setProgress({ current: 0, total: endLevel - startLevel + 1 });

    try {
      const generator = new LevelGenerator();
      await generator.initialize();

      const result = await generator.generateBatch(
        startLevel,
        endLevel,
        seed,
        (current, total, genResult) => {
          setProgress({ current, total });
          setCurrentResult(genResult);
          if (!genResult.success) {
            setFailed(prev => [...prev, startLevel + current - 1]);
          }
        }
      );

      setGeneratedLevels(result.levels);
      setGeneratedReplays(result.ghostReplays);
      setCompleted(true);

      if (result.failed.length === 0) {
        // Auto-complete if all succeeded
        onComplete(result.levels, result.ghostReplays);
      }
    } catch (error) {
      console.error('Generation failed:', error);
      alert('Generation failed. Check console for details.');
    } finally {
      setGenerating(false);
    }
  }, [seed, startLevel, endLevel, onComplete]);

  const handleConfirm = useCallback(() => {
    onComplete(generatedLevels, generatedReplays);
  }, [generatedLevels, generatedReplays, onComplete]);

  const progressPercent = progress.total > 0
    ? Math.round((progress.current / progress.total) * 100)
    : 0;

  const successCount = progress.current - failed.length;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60]">
      <div className="bg-gray-800 rounded-lg p-6 w-[500px] max-w-[90vw] max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-white mb-4">🎲 Level Generator</h2>

        {!generating && !completed ? (
          <>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-1">Seed</label>
                <input
                  type="text"
                  value={seed}
                  onChange={e => setSeed(e.target.value)}
                  placeholder="e.g., MYLEVELS2024"
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded"
                />
                <p className="text-gray-500 text-xs mt-1">
                  Same seed + range = same levels (reproducible)
                </p>
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-gray-400 text-sm mb-1">Start Level</label>
                  <input
                    type="number"
                    min={1}
                    max={250}
                    value={startLevel}
                    onChange={e => setStartLevel(Number(e.target.value))}
                    className="w-full bg-gray-700 text-white px-3 py-2 rounded"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-gray-400 text-sm mb-1">End Level</label>
                  <input
                    type="number"
                    min={1}
                    max={250}
                    value={endLevel}
                    onChange={e => setEndLevel(Number(e.target.value))}
                    className="w-full bg-gray-700 text-white px-3 py-2 rounded"
                  />
                </div>
              </div>

              <div className="bg-gray-700 rounded p-3 text-sm">
                <p className="text-gray-300">
                  Preview: <span className="text-white font-bold">{Math.max(0, endLevel - startLevel + 1)}</span> levels
                </p>
                <p className="text-gray-400 text-xs mt-1">
                  Uses Chinese character strokes as path templates.
                  Levels are validated with physics simulation.
                </p>
              </div>

              <div className="bg-blue-900/30 border border-blue-700 rounded p-3 text-sm">
                <p className="text-blue-300 font-bold mb-1">How it works:</p>
                <ul className="text-blue-200 text-xs space-y-1">
                  <li>• Picks Chinese character based on level difficulty</li>
                  <li>• Places doodles at stroke endpoints</li>
                  <li>• Adds springs (level 11+) and portals (level 21+)</li>
                  <li>• Validates each level is completable via simulation</li>
                  <li>• Saves ghost replay data for solutions</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={onClose}
                className="flex-1 bg-gray-600 text-white py-2 rounded hover:bg-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerate}
                disabled={!seed.trim()}
                className={`flex-1 py-2 rounded font-bold ${
                  seed.trim()
                    ? 'bg-purple-600 text-white hover:bg-purple-500'
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
              >
                Generate & Validate
              </button>
            </div>
          </>
        ) : generating ? (
          <div className="space-y-4">
            <div className="bg-gray-700 rounded-full h-4 overflow-hidden">
              <div
                className="bg-purple-500 h-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <p className="text-center text-gray-300">
              {progress.current} / {progress.total} ({progressPercent}%)
            </p>

            {currentResult && (
              <div className={`text-sm p-2 rounded ${
                currentResult.success
                  ? 'bg-green-900/50 text-green-300'
                  : 'bg-red-900/50 text-red-300'
              }`}>
                Level {startLevel + progress.current - 1}:
                {currentResult.success
                  ? ` ✓ Generated (${currentResult.level?.doodles.length} doodles)`
                  : ` ✗ ${currentResult.error}`}
              </div>
            )}

            {failed.length > 0 && (
              <div className="text-yellow-400 text-sm">
                <span className="font-bold">Failed ({failed.length}):</span>{' '}
                {failed.slice(0, 10).join(', ')}
                {failed.length > 10 && ` +${failed.length - 10} more`}
              </div>
            )}

            <p className="text-gray-500 text-xs text-center">
              Generating levels... This may take a moment.
            </p>
          </div>
        ) : completed ? (
          <div className="space-y-4">
            <div className="bg-green-900/30 border border-green-700 rounded p-4 text-center">
              <p className="text-green-300 text-lg font-bold">Generation Complete!</p>
              <p className="text-green-400 text-sm mt-1">
                {successCount} of {progress.total} levels generated successfully
              </p>
            </div>

            {failed.length > 0 && (
              <div className="bg-yellow-900/30 border border-yellow-700 rounded p-3">
                <p className="text-yellow-300 font-bold text-sm">
                  {failed.length} levels failed validation:
                </p>
                <p className="text-yellow-400 text-xs mt-1">
                  {failed.slice(0, 15).join(', ')}
                  {failed.length > 15 && ` +${failed.length - 15} more`}
                </p>
                <p className="text-yellow-500 text-xs mt-2">
                  You can manually edit these levels in the editor.
                </p>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={onClose}
                className="flex-1 bg-gray-600 text-white py-2 rounded hover:bg-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-500 font-bold"
              >
                Save {successCount} Levels
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
