// src/components/WorldSelect.tsx

import { WORLDS, GALAXIES } from '@/game/engine/arcade/progression';
import {
  isWorldUnlocked,
  getWorldProgress,
} from '@/game/engine/arcade/progression';
import type { ArcadeState } from '@/game/engine/arcade/types';

interface WorldSelectProps {
  arcadeState: ArcadeState;
  onSelectWorld: (worldId: number) => void;
  onClose: () => void;
}

export function WorldSelect({ arcadeState, onSelectWorld, onClose }: WorldSelectProps) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-2">
      <div
        className="rounded-lg p-4 w-full flex flex-col"
        style={{
          background: '#f5f0e1',
          border: '3px solid #1e3a5f',
          boxShadow: '4px 4px 0 rgba(0,0,0,0.2)',
          maxWidth: 'min(500px, 95vw)',
          maxHeight: 'min(600px, 90vh)',
        }}
      >
        {/* Header */}
        <div
          className="flex justify-between items-center pb-2 mb-3"
          style={{ borderBottom: '2px solid #1e3a5f' }}
        >
          <h2 style={{ fontFamily: '"Comic Sans MS", cursive', fontSize: '18px', fontWeight: 'bold', color: '#1e3a5f' }}>
            Select World
          </h2>
          <button onClick={onClose} className="hover:opacity-70 px-2" style={{ color: '#1e3a5f', fontSize: '24px', fontWeight: 'bold' }}>
            ×
          </button>
        </div>

        {/* Galaxy sections */}
        <div className="overflow-y-auto flex-1 space-y-4" style={{ minHeight: 0 }}>
          {GALAXIES.map(galaxy => (
            <div key={galaxy.id}>
              {/* Galaxy header */}
              <div
                className="px-2 py-1 rounded mb-2"
                style={{ background: galaxy.colorPalette.accent + '30', borderLeft: `4px solid ${galaxy.colorPalette.accent}` }}
              >
                <span style={{ fontFamily: '"Comic Sans MS", cursive', fontSize: '14px', fontWeight: 'bold', color: '#1e3a5f' }}>
                  {galaxy.name}
                </span>
              </div>

              {/* Worlds in galaxy */}
              <div className="grid grid-cols-5 gap-2">
                {galaxy.worlds.map(worldId => {
                  const world = WORLDS[worldId - 1];
                  const unlocked = isWorldUnlocked(worldId, arcadeState);
                  const progress = getWorldProgress(worldId, arcadeState);

                  return (
                    <button
                      key={worldId}
                      onClick={() => unlocked && onSelectWorld(worldId)}
                      disabled={!unlocked}
                      className="aspect-square rounded flex flex-col items-center justify-center transition-transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        background: unlocked ? '#f5f0e1' : '#e0dcd0',
                        border: `2px solid ${unlocked ? '#1e3a5f' : '#999'}`,
                      }}
                    >
                      <span style={{ fontFamily: '"Comic Sans MS", cursive', fontSize: '16px', fontWeight: 'bold', color: unlocked ? '#1e3a5f' : '#999' }}>
                        {unlocked ? worldId : '🔒'}
                      </span>
                      {unlocked && (
                        <span style={{ fontSize: '10px', color: '#d35400' }}>
                          {progress.starsEarned}/{progress.starsTotal}★
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
