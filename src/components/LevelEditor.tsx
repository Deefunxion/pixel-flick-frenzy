// src/components/LevelEditor.tsx
import { useState, useCallback } from 'react';
import type { ArcadeLevel, DoodlePlacement, SpringPlacement, PortalPair, SpringDirection, DoodleSize } from '@/game/engine/arcade/types';
import { ARCADE_LEVELS } from '@/game/engine/arcade/levels';
import { W, H } from '@/game/constants';

type EditorTool = 'select' | 'doodle' | 'spring' | 'portal' | 'eraser';

interface LevelEditorProps {
  onClose: () => void;
  onTestLevel: (level: ArcadeLevel) => void;
}

export function LevelEditor({ onClose, onTestLevel }: LevelEditorProps) {
  const [levelId, setLevelId] = useState(1);
  const [level, setLevel] = useState<ArcadeLevel>(() => structuredClone(ARCADE_LEVELS[0]));
  const [tool, setTool] = useState<EditorTool>('select');
  const [doodleSize, setDoodleSize] = useState<DoodleSize>('large');
  const [doodleSprite, setDoodleSprite] = useState('star');
  const [springDirection, setSpringDirection] = useState<SpringDirection>('up');
  const [portalStep, setPortalStep] = useState<'entry' | 'exit'>('entry');
  const [pendingPortalEntry, setPendingPortalEntry] = useState<{ x: number; y: number } | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<{ type: 'doodle' | 'spring'; index: number } | null>(null);

  const loadLevel = useCallback((id: number) => {
    const original = ARCADE_LEVELS.find(l => l.id === id);
    if (original) {
      setLevel(structuredClone(original));
      setLevelId(id);
      setSelectedIndex(null);
    }
  }, []);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const scaleX = W / rect.width;
    const scaleY = H / rect.height;
    const x = Math.round((e.clientX - rect.left) * scaleX);
    const y = Math.round((e.clientY - rect.top) * scaleY);

    if (tool === 'doodle') {
      const newDoodle: DoodlePlacement = {
        x,
        y,
        size: doodleSize,
        sprite: doodleSprite,
        sequence: level.doodles.length + 1,
      };
      setLevel(prev => ({
        ...prev,
        doodles: [...prev.doodles, newDoodle],
      }));
    } else if (tool === 'spring') {
      const newSpring: SpringPlacement = { x, y, direction: springDirection };
      setLevel(prev => ({
        ...prev,
        springs: [...prev.springs, newSpring],
      }));
    } else if (tool === 'portal') {
      if (portalStep === 'entry') {
        setPendingPortalEntry({ x, y });
        setPortalStep('exit');
      } else {
        if (pendingPortalEntry) {
          setLevel(prev => ({
            ...prev,
            portal: { entry: pendingPortalEntry, exit: { x, y } },
          }));
        }
        setPendingPortalEntry(null);
        setPortalStep('entry');
      }
    } else if (tool === 'eraser') {
      // Check doodles
      const doodleIdx = level.doodles.findIndex(d =>
        Math.abs(d.x - x) < 20 && Math.abs(d.y - y) < 20
      );
      if (doodleIdx >= 0) {
        setLevel(prev => ({
          ...prev,
          doodles: prev.doodles.filter((_, i) => i !== doodleIdx).map((d, i) => ({ ...d, sequence: i + 1 })),
        }));
        return;
      }

      // Check springs
      const springIdx = level.springs.findIndex(s =>
        Math.abs(s.x - x) < 20 && Math.abs(s.y - y) < 20
      );
      if (springIdx >= 0) {
        setLevel(prev => ({
          ...prev,
          springs: prev.springs.filter((_, i) => i !== springIdx),
        }));
        return;
      }

      // Check portal
      if (level.portal) {
        if (Math.abs(level.portal.entry.x - x) < 20 && Math.abs(level.portal.entry.y - y) < 20) {
          setLevel(prev => ({ ...prev, portal: null }));
        } else if (Math.abs(level.portal.exit.x - x) < 20 && Math.abs(level.portal.exit.y - y) < 20) {
          setLevel(prev => ({ ...prev, portal: null }));
        }
      }
    }
  }, [tool, doodleSize, doodleSprite, springDirection, portalStep, pendingPortalEntry, level]);

  const exportLevel = () => {
    const json = JSON.stringify(level, null, 2);
    navigator.clipboard.writeText(json);
    alert('Level JSON copied to clipboard!');
  };

  const importLevel = () => {
    const json = prompt('Paste level JSON:');
    if (json) {
      try {
        const imported = JSON.parse(json) as ArcadeLevel;
        setLevel(imported);
        setLevelId(imported.id);
      } catch {
        alert('Invalid JSON');
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col">
      {/* Toolbar */}
      <div className="bg-gray-800 p-2 flex gap-2 items-center flex-wrap">
        <select
          value={levelId}
          onChange={e => loadLevel(Number(e.target.value))}
          className="bg-gray-700 text-white px-2 py-1 rounded"
        >
          {ARCADE_LEVELS.map(l => (
            <option key={l.id} value={l.id}>Level {l.id}</option>
          ))}
        </select>

        <div className="border-l border-gray-600 h-6 mx-2" />

        {(['select', 'doodle', 'spring', 'portal', 'eraser'] as EditorTool[]).map(t => (
          <button
            key={t}
            onClick={() => setTool(t)}
            className={`px-3 py-1 rounded capitalize ${tool === t ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
          >
            {t}
          </button>
        ))}

        {tool === 'doodle' && (
          <>
            <select
              value={doodleSize}
              onChange={e => setDoodleSize(e.target.value as DoodleSize)}
              className="bg-gray-700 text-white px-2 py-1 rounded ml-2"
            >
              <option value="small">Small</option>
              <option value="large">Large</option>
            </select>
            <input
              value={doodleSprite}
              onChange={e => setDoodleSprite(e.target.value)}
              placeholder="Sprite name"
              className="bg-gray-700 text-white px-2 py-1 rounded w-24"
            />
          </>
        )}

        {tool === 'spring' && (
          <select
            value={springDirection}
            onChange={e => setSpringDirection(e.target.value as SpringDirection)}
            className="bg-gray-700 text-white px-2 py-1 rounded ml-2"
          >
            <option value="up">Up</option>
            <option value="up-left">Up-Left</option>
            <option value="up-right">Up-Right</option>
            <option value="down">Down</option>
          </select>
        )}

        {tool === 'portal' && (
          <span className="text-yellow-400 ml-2">
            Click to place {portalStep === 'entry' ? 'ENTRY' : 'EXIT'}
          </span>
        )}

        <div className="flex-1" />

        <button onClick={() => onTestLevel(level)} className="bg-green-600 text-white px-3 py-1 rounded">
          Test
        </button>
        <button onClick={exportLevel} className="bg-blue-600 text-white px-3 py-1 rounded">
          Export
        </button>
        <button onClick={importLevel} className="bg-yellow-600 text-white px-3 py-1 rounded">
          Import
        </button>
        <button onClick={onClose} className="bg-red-600 text-white px-3 py-1 rounded">
          Close
        </button>
      </div>

      {/* Canvas area */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div
          onClick={handleCanvasClick}
          className="relative bg-amber-50 border-2 border-amber-900 cursor-crosshair"
          style={{ width: W * 2, height: H * 2 }}
        >
          {/* Landing target line */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-green-500"
            style={{ left: `${(level.landingTarget / W) * 100}%` }}
          />
          <span
            className="absolute top-1 text-green-600 text-xs font-mono"
            style={{ left: `${(level.landingTarget / W) * 100}%` }}
          >
            {level.landingTarget}
          </span>

          {/* Doodles */}
          {level.doodles.map((d, i) => (
            <div
              key={`doodle-${i}`}
              className="absolute flex items-center justify-center rounded-full border-2 border-amber-600 bg-amber-200"
              style={{
                left: d.x * 2 - (d.size === 'large' ? 18 : 10),
                top: d.y * 2 - (d.size === 'large' ? 18 : 10),
                width: d.size === 'large' ? 36 : 20,
                height: d.size === 'large' ? 36 : 20,
              }}
            >
              <span className="text-xs font-bold">{d.sequence}</span>
            </div>
          ))}

          {/* Springs */}
          {level.springs.map((s, i) => (
            <div
              key={`spring-${i}`}
              className="absolute flex items-center justify-center"
              style={{
                left: s.x * 2 - 12,
                top: s.y * 2 - 12,
                width: 24,
                height: 24,
              }}
            >
              <div className="w-full h-full bg-red-400 rounded border-2 border-red-600 flex items-center justify-center">
                <span className="text-white text-xs">
                  {s.direction === 'up' ? '↑' : s.direction === 'down' ? '↓' : s.direction === 'up-left' ? '↖' : '↗'}
                </span>
              </div>
            </div>
          ))}

          {/* Portal */}
          {level.portal && (
            <>
              <div
                className="absolute w-6 h-6 rounded-full bg-purple-500 border-2 border-purple-700 flex items-center justify-center"
                style={{ left: level.portal.entry.x * 2 - 12, top: level.portal.entry.y * 2 - 12 }}
              >
                <span className="text-white text-xs">IN</span>
              </div>
              <div
                className="absolute w-6 h-6 rounded-full bg-blue-500 border-2 border-blue-700 flex items-center justify-center"
                style={{ left: level.portal.exit.x * 2 - 12, top: level.portal.exit.y * 2 - 12 }}
              >
                <span className="text-white text-xs">OUT</span>
              </div>
            </>
          )}

          {/* Pending portal entry */}
          {pendingPortalEntry && (
            <div
              className="absolute w-6 h-6 rounded-full bg-purple-500/50 border-2 border-dashed border-purple-700"
              style={{ left: pendingPortalEntry.x * 2 - 12, top: pendingPortalEntry.y * 2 - 12 }}
            />
          )}
        </div>
      </div>

      {/* Info bar */}
      <div className="bg-gray-800 p-2 text-gray-400 text-sm">
        Doodles: {level.doodles.length} | Springs: {level.springs.length} | Portal: {level.portal ? 'Yes' : 'No'} | Target: {level.landingTarget}
      </div>
    </div>
  );
}
