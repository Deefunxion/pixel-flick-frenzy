// src/components/LevelEditor.tsx
import { useState, useCallback, useEffect, useRef } from 'react';
import type { ArcadeLevel, DoodlePlacement, SpringPlacement, SpringDirection, DoodleSize, PortalExitDirection, HazardPlacement, WindZonePlacement, WindDirection, GravityWellPlacement, GravityWellType, FrictionZonePlacement, FrictionType } from '@/game/engine/arcade/types';
import type { GhostInput } from '@/game/engine/arcade/generator/types';
import { ARCADE_LEVELS } from '@/game/engine/arcade/levels';
import { W, H } from '@/game/constants';
import { assetPath } from '@/lib/assetPath';
import { backgroundRenderer } from '@/game/engine/backgroundRenderer';
import { GeneratorModal } from './GeneratorModal';

type EditorTool = 'select' | 'doodle' | 'spring' | 'portal' | 'hazard' | 'wind' | 'gravity' | 'friction' | 'eraser';
type SelectedObject =
  | { type: 'doodle'; index: number }
  | { type: 'spring'; index: number }
  | { type: 'portal' }
  | { type: 'hazard'; index: number }
  | { type: 'windZone'; index: number }
  | { type: 'gravityWell'; index: number }
  | { type: 'frictionZone'; index: number }
  | null;

interface LevelEditorProps {
  onClose: () => void;
  onTestLevel: (level: ArcadeLevel) => void;
  initialLevel?: number; // Open editor at this level (e.g., current arcade level)
}

// History for undo/redo
interface HistoryState {
  past: ArcadeLevel[];
  present: ArcadeLevel;
  future: ArcadeLevel[];
}

// Sprite cache for actual preview
const spriteCache = new Map<string, HTMLImageElement>();

function loadSprite(name: string): HTMLImageElement | null {
  if (spriteCache.has(name)) {
    const img = spriteCache.get(name)!;
    return img.complete && img.naturalWidth > 0 ? img : null;
  }
  const img = new Image();
  img.src = assetPath(`/assets/pickables/${name}.png`);
  spriteCache.set(name, img);
  return null;
}

// Preload common sprites
['coin', 'star'].forEach(loadSprite);

// Arcade sprite cache for editor previews
const arcadeSpriteCache = new Map<string, HTMLImageElement>();

function loadArcadeSprite(path: string): HTMLImageElement | null {
  if (arcadeSpriteCache.has(path)) {
    const img = arcadeSpriteCache.get(path)!;
    return img.complete && img.naturalWidth > 0 ? img : null;
  }
  const img = new Image();
  img.src = assetPath(path);
  arcadeSpriteCache.set(path, img);
  return null;
}

// Arcade sprite paths for editor
const ARCADE_SPRITE_PATHS = {
  hazards: {
    spike: '/assets/arcade/hazards/spike1a.png',
    saw: '/assets/arcade/hazards/saw1a.png',
    fire: '/assets/arcade/hazards/fire1a.png',
  },
  springs: '/assets/arcade/springs/spring1a.png',
  portals: {
    blue: '/assets/arcade/portals/portal_blue_1.png',
    green: '/assets/arcade/portals/portal_green_1.png',
    orange: '/assets/arcade/portals/portal_orange_1.png',
    pink: '/assets/arcade/portals/portal_pink_1.png',
    purple: '/assets/arcade/portals/portal_purple_1.png',
    yellow: '/assets/arcade/portals/portal_yellow_1.png',
  },
  zones: {
    ice: '/assets/arcade/zones/ice1a.png',
    sticky: '/assets/arcade/zones/sticky1a.png',
    wind: '/assets/arcade/zones/wind1a.png',
  },
} as const;

// Portal color names for colorId lookup
const PORTAL_COLOR_NAMES = ['blue', 'green', 'orange', 'pink', 'purple', 'yellow'] as const;

// Preload arcade sprites on module load
Object.values(ARCADE_SPRITE_PATHS.hazards).forEach(loadArcadeSprite);
loadArcadeSprite(ARCADE_SPRITE_PATHS.springs);
Object.values(ARCADE_SPRITE_PATHS.portals).forEach(loadArcadeSprite);
Object.values(ARCADE_SPRITE_PATHS.zones).forEach(loadArcadeSprite);

// Generate empty level template
function getEmptyLevel(id: number): ArcadeLevel {
  return {
    id,
    landingTarget: 410 + Math.min(id - 1, 9),
    doodles: [],
    springs: [],
    portal: null,
  };
}

export function LevelEditor({ onClose, onTestLevel, initialLevel }: LevelEditorProps) {
  // History state for undo/redo
  const [history, setHistory] = useState<HistoryState>(() => {
    // Start at initialLevel if provided, otherwise level 1
    const startId = initialLevel ?? 1;
    const existing = ARCADE_LEVELS.find(l => l.id === startId);
    const initial = existing ? structuredClone(existing) : getEmptyLevel(startId);
    return { past: [], present: initial, future: [] };
  });

  const level = history.present;

  const [tool, setTool] = useState<EditorTool>('select');
  const [selected, setSelected] = useState<SelectedObject>(null);

  // New object defaults
  const [newDoodleSize, setNewDoodleSize] = useState<DoodleSize>('large');
  const [newDoodleSprite, setNewDoodleSprite] = useState('coin');
  const [newDoodleScale, setNewDoodleScale] = useState(1.0);
  const [newDoodleRotation, setNewDoodleRotation] = useState(0);
  const [newSpringDirection, setNewSpringDirection] = useState<SpringDirection>('up');
  const [newSpringStrength, setNewSpringStrength] = useState(1.0);
  const [newSpringScale, setNewSpringScale] = useState(1.0);
  const [newSpringRotation, setNewSpringRotation] = useState(0);
  const [newPortalExitDir, setNewPortalExitDir] = useState<PortalExitDirection>('straight');
  const [newPortalExitSpeed, setNewPortalExitSpeed] = useState(1.0);
  const [newPortalScale, setNewPortalScale] = useState(1.0);

  // Hazard tool state
  const [newHazardSprite, setNewHazardSprite] = useState<'spike' | 'saw' | 'fire'>('spike');
  const [newHazardScale, setNewHazardScale] = useState(1.0);
  const [newHazardRadius, setNewHazardRadius] = useState(12);
  const [newHazardRotation, setNewHazardRotation] = useState(0);

  // Wind zone tool state
  const [newWindDirection, setNewWindDirection] = useState<WindDirection>('right');
  const [newWindStrength, setNewWindStrength] = useState(0.25);
  const [newWindWidth, setNewWindWidth] = useState(80);
  const [newWindHeight, setNewWindHeight] = useState(60);

  // Gravity well tool state
  const [newGravityType, setNewGravityType] = useState<GravityWellType>('attract');
  const [newGravityRadius, setNewGravityRadius] = useState(50);
  const [newGravityStrength, setNewGravityStrength] = useState(0.2);
  const [newGravityScale, setNewGravityScale] = useState(1.0);

  // Friction zone tool state
  const [newFrictionType, setNewFrictionType] = useState<FrictionType>('ice');
  const [newFrictionWidth, setNewFrictionWidth] = useState(60);

  const [portalStep, setPortalStep] = useState<'entry' | 'exit'>('entry');
  const [pendingPortalEntry, setPendingPortalEntry] = useState<{ x: number; y: number } | null>(null);
  const [dragging, setDragging] = useState<{ type: 'doodle' | 'spring' | 'portal-entry' | 'portal-exit' | 'hazard' | 'windZone' | 'gravityWell' | 'frictionZone'; index: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [swapping, setSwapping] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [, setSpriteLoadTick] = useState(0);
  const [bgReady, setBgReady] = useState(false);
  const [canvasScale, setCanvasScale] = useState(1); // Auto-fit scale

  const canvasRef = useRef<HTMLDivElement>(null);
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  // Trigger re-render when sprites load
  useEffect(() => {
    const interval = setInterval(() => {
      let anyLoading = false;
      spriteCache.forEach(img => {
        if (!img.complete) anyLoading = true;
      });
      if (anyLoading) setSpriteLoadTick(t => t + 1);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // Auto-fit canvas to available space
  useEffect(() => {
    const calculateScale = () => {
      const container = canvasContainerRef.current;
      if (!container) return;

      const padding = 32; // p-4 = 16px * 2
      const availableWidth = container.clientWidth - padding;
      const availableHeight = container.clientHeight - padding;

      const canvasWidth = W * 2; // 960
      const canvasHeight = H * 2; // 480

      // Calculate scale to fit, capped at 1 (don't zoom in beyond 100%)
      const scaleX = availableWidth / canvasWidth;
      const scaleY = availableHeight / canvasHeight;
      const newScale = Math.min(1, scaleX, scaleY);

      setCanvasScale(newScale);
    };

    calculateScale();
    window.addEventListener('resize', calculateScale);
    return () => window.removeEventListener('resize', calculateScale);
  }, []);

  // Load and render background
  useEffect(() => {
    const renderBackground = async () => {
      if (!bgCanvasRef.current) return;

      // Preload if not ready
      if (!backgroundRenderer.isReady()) {
        await backgroundRenderer.preload();
      }

      const canvas = bgCanvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Render at 2x scale for the editor
      ctx.save();
      ctx.scale(2, 2);
      backgroundRenderer.update(0, performance.now()); // No wind, static background
      backgroundRenderer.render(ctx);
      ctx.restore();

      setBgReady(true);
    };

    renderBackground();
  }, []);

  // Update level with history tracking
  const updateLevel = useCallback((updater: (prev: ArcadeLevel) => ArcadeLevel) => {
    setHistory(h => ({
      past: [...h.past, h.present],
      present: updater(h.present),
      future: [],
    }));
  }, []);

  // Set level directly (for loading)
  const setLevel = useCallback((newLevel: ArcadeLevel) => {
    setHistory({ past: [], present: newLevel, future: [] });
    setSelected(null);
  }, []);

  // Undo
  const undo = useCallback(() => {
    setHistory(h => {
      if (h.past.length === 0) return h;
      const previous = h.past[h.past.length - 1];
      return {
        past: h.past.slice(0, -1),
        present: previous,
        future: [h.present, ...h.future],
      };
    });
  }, []);

  // Redo
  const redo = useCallback(() => {
    setHistory(h => {
      if (h.future.length === 0) return h;
      const next = h.future[0];
      return {
        past: [...h.past, h.present],
        present: next,
        future: h.future.slice(1),
      };
    });
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        undo();
      } else if (e.ctrlKey && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) {
        e.preventDefault();
        redo();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selected) {
          e.preventDefault();
          deleteSelected();
        }
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [undo, redo, selected]);

  const loadLevel = useCallback((id: number) => {
    const existing = ARCADE_LEVELS.find(l => l.id === id);
    setLevel(existing ? structuredClone(existing) : getEmptyLevel(id));
    setPendingPortalEntry(null);
    setPortalStep('entry');
  }, [setLevel]);

  const getCanvasCoords = (e: React.MouseEvent | MouseEvent): { x: number; y: number } => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    const scaleX = W / rect.width;
    const scaleY = H / rect.height;
    return {
      x: Math.round((e.clientX - rect.left) * scaleX),
      y: Math.round((e.clientY - rect.top) * scaleY),
    };
  };

  const deleteSelected = useCallback(() => {
    if (!selected) return;
    if (selected.type === 'doodle') {
      updateLevel(prev => ({
        ...prev,
        doodles: prev.doodles.filter((_, i) => i !== selected.index).map((d, i) => ({ ...d, sequence: i + 1 })),
      }));
    } else if (selected.type === 'spring') {
      updateLevel(prev => ({
        ...prev,
        springs: prev.springs.filter((_, i) => i !== selected.index),
      }));
    } else if (selected.type === 'portal') {
      updateLevel(prev => ({ ...prev, portal: null }));
    } else if (selected.type === 'hazard') {
      updateLevel(prev => ({
        ...prev,
        hazards: (prev.hazards || []).filter((_, i) => i !== selected.index),
      }));
    } else if (selected.type === 'windZone') {
      updateLevel(prev => ({
        ...prev,
        windZones: (prev.windZones || []).filter((_, i) => i !== selected.index),
      }));
    } else if (selected.type === 'gravityWell') {
      updateLevel(prev => ({
        ...prev,
        gravityWells: (prev.gravityWells || []).filter((_, i) => i !== selected.index),
      }));
    } else if (selected.type === 'frictionZone') {
      updateLevel(prev => ({
        ...prev,
        frictionZones: (prev.frictionZones || []).filter((_, i) => i !== selected.index),
      }));
    }
    setSelected(null);
  }, [selected, updateLevel]);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (dragging) return;
    const { x, y } = getCanvasCoords(e);

    if (tool === 'select') {
      // Check what was clicked
      const doodleIdx = level.doodles.findIndex(d =>
        Math.abs(d.x - x) < 20 && Math.abs(d.y - y) < 20
      );
      if (doodleIdx >= 0) {
        setSelected({ type: 'doodle', index: doodleIdx });
        return;
      }

      const springIdx = level.springs.findIndex(s =>
        Math.abs(s.x - x) < 16 && Math.abs(s.y - y) < 16
      );
      if (springIdx >= 0) {
        setSelected({ type: 'spring', index: springIdx });
        return;
      }

      if (level.portal) {
        if ((Math.abs(level.portal.entry.x - x) < 16 && Math.abs(level.portal.entry.y - y) < 16) ||
            (Math.abs(level.portal.exit.x - x) < 16 && Math.abs(level.portal.exit.y - y) < 16)) {
          setSelected({ type: 'portal' });
          return;
        }
      }

      const hazardIdx = (level.hazards || []).findIndex(h =>
        Math.sqrt(Math.pow(h.x - x, 2) + Math.pow(h.y - y, 2)) < h.radius + 5
      );
      if (hazardIdx >= 0) {
        setSelected({ type: 'hazard', index: hazardIdx });
        return;
      }

      const windIdx = (level.windZones || []).findIndex(w =>
        x >= w.x - w.width / 2 && x <= w.x + w.width / 2 &&
        y >= w.y - w.height / 2 && y <= w.y + w.height / 2
      );
      if (windIdx >= 0) {
        setSelected({ type: 'windZone', index: windIdx });
        return;
      }

      const gravityIdx = (level.gravityWells || []).findIndex(g =>
        Math.sqrt(Math.pow(g.x - x, 2) + Math.pow(g.y - y, 2)) < g.radius
      );
      if (gravityIdx >= 0) {
        setSelected({ type: 'gravityWell', index: gravityIdx });
        return;
      }

      const frictionIdx = (level.frictionZones || []).findIndex(f =>
        x >= f.x - f.width / 2 && x <= f.x + f.width / 2 && Math.abs(f.y - y) < 10
      );
      if (frictionIdx >= 0) {
        setSelected({ type: 'frictionZone', index: frictionIdx });
        return;
      }

      setSelected(null);
    } else if (tool === 'doodle') {
      const newDoodle: DoodlePlacement = {
        x, y,
        size: newDoodleSize,
        sprite: newDoodleSprite,
        sequence: level.doodles.length + 1,
        scale: newDoodleScale !== 1.0 ? newDoodleScale : undefined,
        rotation: newDoodleRotation !== 0 ? newDoodleRotation : undefined,
      };
      updateLevel(prev => ({
        ...prev,
        doodles: [...prev.doodles, newDoodle],
      }));
    } else if (tool === 'spring') {
      const newSpring: SpringPlacement = {
        x, y,
        direction: newSpringDirection,
        strength: newSpringStrength !== 1.0 ? newSpringStrength : undefined,
        scale: newSpringScale !== 1.0 ? newSpringScale : undefined,
        rotation: newSpringRotation !== 0 ? newSpringRotation : undefined,
      };
      updateLevel(prev => ({
        ...prev,
        springs: [...prev.springs, newSpring],
      }));
    } else if (tool === 'portal') {
      if (portalStep === 'entry') {
        setPendingPortalEntry({ x, y });
        setPortalStep('exit');
      } else {
        if (pendingPortalEntry) {
          updateLevel(prev => ({
            ...prev,
            portal: {
              entry: pendingPortalEntry,
              exit: { x, y },
              exitDirection: newPortalExitDir !== 'straight' ? newPortalExitDir : undefined,
              exitSpeed: newPortalExitSpeed !== 1.0 ? newPortalExitSpeed : undefined,
              scale: newPortalScale !== 1.0 ? newPortalScale : undefined,
            },
          }));
        }
        setPendingPortalEntry(null);
        setPortalStep('entry');
      }
    } else if (tool === 'hazard') {
      const newHazard: HazardPlacement = {
        x, y,
        radius: newHazardRadius,
        sprite: newHazardSprite,
        scale: newHazardScale !== 1.0 ? newHazardScale : undefined,
        rotation: newHazardRotation !== 0 ? newHazardRotation : undefined,
      };
      updateLevel(prev => ({
        ...prev,
        hazards: [...(prev.hazards || []), newHazard],
      }));
    } else if (tool === 'wind') {
      const newZone: WindZonePlacement = {
        x, y,
        width: newWindWidth,
        height: newWindHeight,
        direction: newWindDirection,
        strength: newWindStrength,
      };
      updateLevel(prev => ({
        ...prev,
        windZones: [...(prev.windZones || []), newZone],
      }));
    } else if (tool === 'gravity') {
      const newWell: GravityWellPlacement = {
        x, y,
        type: newGravityType,
        radius: newGravityRadius,
        strength: newGravityStrength,
        scale: newGravityScale !== 1.0 ? newGravityScale : undefined,
      };
      updateLevel(prev => ({
        ...prev,
        gravityWells: [...(prev.gravityWells || []), newWell],
      }));
    } else if (tool === 'friction') {
      const newZone: FrictionZonePlacement = {
        x,
        y: 220, // Always at ground level
        width: newFrictionWidth,
        type: newFrictionType,
      };
      updateLevel(prev => ({
        ...prev,
        frictionZones: [...(prev.frictionZones || []), newZone],
      }));
    } else if (tool === 'eraser') {
      const doodleIdx = level.doodles.findIndex(d =>
        Math.abs(d.x - x) < 20 && Math.abs(d.y - y) < 20
      );
      if (doodleIdx >= 0) {
        updateLevel(prev => ({
          ...prev,
          doodles: prev.doodles.filter((_, i) => i !== doodleIdx).map((d, i) => ({ ...d, sequence: i + 1 })),
        }));
        return;
      }

      const springIdx = level.springs.findIndex(s =>
        Math.abs(s.x - x) < 16 && Math.abs(s.y - y) < 16
      );
      if (springIdx >= 0) {
        updateLevel(prev => ({
          ...prev,
          springs: prev.springs.filter((_, i) => i !== springIdx),
        }));
        return;
      }

      if (level.portal) {
        if (Math.abs(level.portal.entry.x - x) < 16 && Math.abs(level.portal.entry.y - y) < 16 ||
            Math.abs(level.portal.exit.x - x) < 16 && Math.abs(level.portal.exit.y - y) < 16) {
          updateLevel(prev => ({ ...prev, portal: null }));
        }
      }
    }
  }, [tool, newDoodleSize, newDoodleSprite, newDoodleScale, newDoodleRotation,
      newSpringDirection, newSpringStrength, newSpringScale, newSpringRotation,
      newPortalExitDir, newPortalExitSpeed, newPortalScale,
      newHazardSprite, newHazardScale, newHazardRadius, newHazardRotation,
      newWindDirection, newWindStrength, newWindWidth, newWindHeight,
      newGravityType, newGravityRadius, newGravityStrength, newGravityScale,
      newFrictionType, newFrictionWidth,
      portalStep, pendingPortalEntry, level, dragging, updateLevel]);

  // Drag handling
  const handleMouseDown = useCallback((e: React.MouseEvent, type: 'doodle' | 'spring' | 'portal-entry' | 'portal-exit' | 'hazard' | 'windZone' | 'gravityWell' | 'frictionZone', index: number) => {
    if (tool !== 'select') return;
    e.stopPropagation();
    setDragging({ type, index });

    // Also select the object
    if (type === 'doodle') setSelected({ type: 'doodle', index });
    else if (type === 'spring') setSelected({ type: 'spring', index });
    else if (type === 'hazard') setSelected({ type: 'hazard', index });
    else if (type === 'windZone') setSelected({ type: 'windZone', index });
    else if (type === 'gravityWell') setSelected({ type: 'gravityWell', index });
    else if (type === 'frictionZone') setSelected({ type: 'frictionZone', index });
    else setSelected({ type: 'portal' });
  }, [tool]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragging) return;
    const { x, y } = getCanvasCoords(e);

    setHistory(h => {
      const newLevel = structuredClone(h.present);
      if (dragging.type === 'doodle') {
        newLevel.doodles[dragging.index] = { ...newLevel.doodles[dragging.index], x, y };
      } else if (dragging.type === 'spring') {
        newLevel.springs[dragging.index] = { ...newLevel.springs[dragging.index], x, y };
      } else if (dragging.type === 'portal-entry' && newLevel.portal) {
        newLevel.portal = { ...newLevel.portal, entry: { x, y } };
      } else if (dragging.type === 'portal-exit' && newLevel.portal) {
        newLevel.portal = { ...newLevel.portal, exit: { x, y } };
      } else if (dragging.type === 'hazard' && newLevel.hazards) {
        newLevel.hazards[dragging.index] = { ...newLevel.hazards[dragging.index], x, y };
      } else if (dragging.type === 'windZone' && newLevel.windZones) {
        newLevel.windZones[dragging.index] = { ...newLevel.windZones[dragging.index], x, y };
      } else if (dragging.type === 'gravityWell' && newLevel.gravityWells) {
        newLevel.gravityWells[dragging.index] = { ...newLevel.gravityWells[dragging.index], x, y };
      } else if (dragging.type === 'frictionZone' && newLevel.frictionZones) {
        newLevel.frictionZones[dragging.index] = { ...newLevel.frictionZones[dragging.index], x };
      }
      return { ...h, present: newLevel };
    });
  }, [dragging]);

  const handleMouseUp = useCallback(() => {
    if (dragging) {
      setHistory(h => ({
        past: [...h.past.slice(0, -1), h.past[h.past.length - 1] || h.present],
        present: h.present,
        future: [],
      }));
      setDragging(null);
    }
  }, [dragging]);

  useEffect(() => {
    if (dragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragging, handleMouseMove, handleMouseUp]);

  // Update selected object property
  const updateSelectedProperty = useCallback(<K extends string>(key: K, value: any) => {
    if (!selected) return;

    if (selected.type === 'doodle') {
      updateLevel(prev => ({
        ...prev,
        doodles: prev.doodles.map((d, i) =>
          i === selected.index ? { ...d, [key]: value } : d
        ),
      }));
    } else if (selected.type === 'spring') {
      updateLevel(prev => ({
        ...prev,
        springs: prev.springs.map((s, i) =>
          i === selected.index ? { ...s, [key]: value } : s
        ),
      }));
    } else if (selected.type === 'portal' && level.portal) {
      updateLevel(prev => ({
        ...prev,
        portal: prev.portal ? { ...prev.portal, [key]: value } : null,
      }));
    }
  }, [selected, updateLevel, level.portal]);

  // Save level via API (writes to levels-data.json)
  const saveLevel = async () => {
    setSaving(true);
    setSaveStatus('idle');
    try {
      const response = await fetch('/api/save-level', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(level),
      });
      if (!response.ok) throw new Error('Save failed');
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Failed to save level:', error);
      setSaveStatus('error');
      // Fallback to clipboard
      navigator.clipboard.writeText(JSON.stringify(level, null, 2));
    } finally {
      setSaving(false);
    }
  };

  // Handle generated levels from generator modal
  const handleGeneratorComplete = useCallback(async (
    levels: ArcadeLevel[],
    ghostReplays: Record<number, GhostInput[]>
  ) => {
    setShowGenerator(false);

    if (levels.length === 0) {
      alert('No levels were generated.');
      return;
    }

    // Save all generated levels
    let savedCount = 0;
    let failedCount = 0;

    for (const lvl of levels) {
      try {
        const response = await fetch('/api/save-level', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(lvl),
        });
        if (response.ok) {
          savedCount++;
        } else {
          failedCount++;
        }
      } catch (error) {
        console.error(`Failed to save level ${lvl.id}:`, error);
        failedCount++;
      }
    }

    // Save ghost replays to localStorage for future use
    if (Object.keys(ghostReplays).length > 0) {
      try {
        const existing = JSON.parse(localStorage.getItem('ghostReplays') || '{}');
        const merged = { ...existing, ...ghostReplays };
        localStorage.setItem('ghostReplays', JSON.stringify(merged));
      } catch {
        // Ignore localStorage errors
      }
    }

    const message = failedCount > 0
      ? `Saved ${savedCount} levels. ${failedCount} failed to save.`
      : `Successfully saved ${savedCount} levels!`;

    alert(`${message}\n\nRefresh to see the new levels in the dropdown.`);
  }, []);

  // Move level up (swap with previous ID)
  const moveUp = async () => {
    const currentId = level.id;
    const targetId = currentId - 1;
    if (targetId < 1) return;

    // Check if target level exists
    const targetExists = ARCADE_LEVELS.some(l => l.id === targetId);
    if (!targetExists) {
      alert(`Level ${targetId} doesn't exist. Create it first.`);
      return;
    }

    setSwapping(true);
    try {
      const response = await fetch('/api/swap-levels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idA: currentId, idB: targetId }),
      });
      if (!response.ok) throw new Error('Swap failed');

      // Reload the page to get fresh ARCADE_LEVELS
      window.location.reload();
    } catch (error) {
      console.error('Failed to swap levels:', error);
      alert('Failed to swap levels');
    } finally {
      setSwapping(false);
    }
  };

  // Move level down (swap with next ID)
  const moveDown = async () => {
    const currentId = level.id;
    const targetId = currentId + 1;
    if (targetId > 100) return;

    // Check if target level exists
    const targetExists = ARCADE_LEVELS.some(l => l.id === targetId);
    if (!targetExists) {
      alert(`Level ${targetId} doesn't exist. Create it first.`);
      return;
    }

    setSwapping(true);
    try {
      const response = await fetch('/api/swap-levels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idA: currentId, idB: targetId }),
      });
      if (!response.ok) throw new Error('Swap failed');

      // Reload the page to get fresh ARCADE_LEVELS
      window.location.reload();
    } catch (error) {
      console.error('Failed to swap levels:', error);
      alert('Failed to swap levels');
    } finally {
      setSwapping(false);
    }
  };

  const importLevel = () => {
    const json = prompt('Paste level JSON:');
    if (json) {
      try {
        const imported = JSON.parse(json) as ArcadeLevel;
        setLevel(imported);
      } catch {
        alert('Invalid JSON');
      }
    }
  };

  const levelOptions = Array.from({ length: 250 }, (_, i) => i + 1);

  return (
    <div className="fixed inset-0 bg-gray-900 z-50 flex">
      {/* Main editor area */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="bg-gray-800 p-2 flex gap-2 items-center flex-wrap">
          <select
            value={level.id}
            onChange={e => loadLevel(Number(e.target.value))}
            className="bg-gray-700 text-white px-2 py-1 rounded text-sm"
          >
            {levelOptions.map(id => {
              const exists = ARCADE_LEVELS.some(l => l.id === id);
              return (
                <option key={id} value={id}>
                  Level {id} {exists ? '✓' : ''}
                </option>
              );
            })}
          </select>

          {/* Move up/down buttons */}
          <button
            onClick={moveUp}
            disabled={swapping || level.id <= 1 || !ARCADE_LEVELS.some(l => l.id === level.id)}
            className={`px-2 py-1 rounded text-sm ${
              swapping || level.id <= 1 || !ARCADE_LEVELS.some(l => l.id === level.id)
                ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                : 'bg-gray-700 text-white hover:bg-gray-600'
            }`}
            title="Move level up (swap with previous)"
          >
            ↑
          </button>
          <button
            onClick={moveDown}
            disabled={swapping || level.id >= 250 || !ARCADE_LEVELS.some(l => l.id === level.id)}
            className={`px-2 py-1 rounded text-sm ${
              swapping || level.id >= 250 || !ARCADE_LEVELS.some(l => l.id === level.id)
                ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                : 'bg-gray-700 text-white hover:bg-gray-600'
            }`}
            title="Move level down (swap with next)"
          >
            ↓
          </button>

          <div className="border-l border-gray-600 h-6 mx-1" />

          {(['select', 'doodle', 'spring', 'portal', 'hazard', 'wind', 'gravity', 'friction', 'eraser'] as EditorTool[]).map(t => (
            <button
              key={t}
              onClick={() => { setTool(t); setSelected(null); }}
              className={`px-2 py-1 rounded text-sm ${tool === t ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
              title={t.charAt(0).toUpperCase() + t.slice(1)}
            >
              {t === 'select' ? '✋' : t === 'doodle' ? '🪙' : t === 'spring' ? '🔺' : t === 'portal' ? '🌀' : t === 'hazard' ? '⚠️' : t === 'wind' ? '💨' : t === 'gravity' ? '🌀' : t === 'friction' ? '❄️' : '🗑️'}
            </button>
          ))}

          <div className="border-l border-gray-600 h-6 mx-1" />

          <button onClick={undo} disabled={history.past.length === 0}
            className={`px-2 py-1 rounded text-sm ${history.past.length > 0 ? 'bg-gray-700 text-white' : 'bg-gray-800 text-gray-600'}`}>
            ↩
          </button>
          <button onClick={redo} disabled={history.future.length === 0}
            className={`px-2 py-1 rounded text-sm ${history.future.length > 0 ? 'bg-gray-700 text-white' : 'bg-gray-800 text-gray-600'}`}>
            ↪
          </button>

          <div className="flex-1" />

          <label className="text-gray-400 text-xs">Target:</label>
          <input
            type="number" min={400} max={419}
            value={level.landingTarget}
            onChange={e => updateLevel(prev => ({ ...prev, landingTarget: Number(e.target.value) }))}
            className="bg-gray-700 text-white px-2 py-1 rounded w-14 text-sm"
          />

          <button onClick={() => onTestLevel(level)} className="bg-green-600 text-white px-2 py-1 rounded text-sm">▶ Test</button>
          <button onClick={saveLevel} disabled={saving}
            className={`px-2 py-1 rounded text-sm ${saveStatus === 'success' ? 'bg-green-500' : saveStatus === 'error' ? 'bg-orange-500' : 'bg-blue-600'} text-white`}
            title="Save to levels-data.json">
            {saving ? '...' : saveStatus === 'success' ? '✓ Saved!' : saveStatus === 'error' ? '📋 Copied' : '💾 Save'}
          </button>
          <button onClick={importLevel} className="bg-yellow-600 text-white px-2 py-1 rounded text-sm">📥</button>
          <button
            onClick={() => setShowGenerator(true)}
            className="bg-purple-600 text-white px-2 py-1 rounded text-sm hover:bg-purple-500"
            title="Auto-generate levels using Chinese character patterns"
          >
            🎲 Generate
          </button>
          <button onClick={onClose} className="bg-red-600 text-white px-2 py-1 rounded text-sm">✕</button>
        </div>

        {/* Canvas */}
        <div
          ref={canvasContainerRef}
          className="flex-1 flex items-center justify-center p-4 bg-gray-700 overflow-hidden"
        >
          <div
            ref={canvasRef}
            onClick={handleCanvasClick}
            className="relative border-2 border-amber-900 overflow-hidden"
            style={{
              width: W * 2, height: H * 2,
              cursor: tool === 'select' ? 'default' : 'crosshair',
              transform: `scale(${canvasScale})`,
              transformOrigin: 'center center',
            }}
          >
            {/* Game background canvas */}
            <canvas
              ref={bgCanvasRef}
              width={W * 2}
              height={H * 2}
              className="absolute inset-0"
            />

            {/* Loading overlay */}
            {!bgReady && (
              <div className="absolute inset-0 flex items-center justify-center bg-amber-50">
                <span className="text-amber-700">Loading background...</span>
              </div>
            )}

            {/* Grid overlay - semi-transparent for visibility */}
            <div className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: 'repeating-linear-gradient(rgba(100,100,100,0.15) 0px, rgba(100,100,100,0.15) 1px, transparent 1px, transparent 40px), repeating-linear-gradient(90deg, rgba(100,100,100,0.15) 0px, rgba(100,100,100,0.15) 1px, transparent 1px, transparent 40px)',
              }} />

            {/* Cliff edge */}
            <div className="absolute top-0 bottom-0 w-1 bg-red-500 opacity-50" style={{ left: `${(420 / W) * 100}%` }} />

            {/* Landing target */}
            <div className="absolute top-0 bottom-0 w-0.5 bg-green-500" style={{ left: `${(level.landingTarget / W) * 100}%` }} />
            <span className="absolute top-1 text-green-600 text-xs font-mono font-bold" style={{ left: `${(level.landingTarget / W) * 100}%` }}>
              {level.landingTarget}
            </span>

            {/* Doodles */}
            {level.doodles.map((d, i) => {
              const sprite = loadSprite(d.sprite);
              const scale = d.scale ?? 1.0;
              const baseSize = d.size === 'large' ? 48 : 28;
              const size = baseSize * scale;
              const isSelected = selected?.type === 'doodle' && selected.index === i;
              return (
                <div
                  key={`doodle-${i}`}
                  onMouseDown={e => handleMouseDown(e, 'doodle', i)}
                  className={`absolute flex items-center justify-center ${tool === 'select' ? 'cursor-move' : ''}`}
                  style={{
                    left: d.x * 2 - size / 2,
                    top: d.y * 2 - size / 2,
                    width: size, height: size,
                    transform: d.rotation ? `rotate(${d.rotation}deg)` : undefined,
                    outline: isSelected ? '3px solid #3b82f6' : undefined,
                    outlineOffset: '2px',
                  }}
                >
                  {sprite ? (
                    <img src={sprite.src} alt={d.sprite} className="w-full h-full object-contain" />
                  ) : (
                    <div className="w-full h-full rounded-full border-2 border-amber-600 bg-amber-200 flex items-center justify-center">
                      <span className="text-xs">{d.sprite}</span>
                    </div>
                  )}
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center font-bold"
                    style={{ transform: d.rotation ? `rotate(${-d.rotation}deg)` : undefined }}>
                    {d.sequence}
                  </span>
                </div>
              );
            })}

            {/* Springs */}
            {level.springs.map((s, i) => {
              const scale = s.scale ?? 1.0;
              const size = 32 * scale;
              const isSelected = selected?.type === 'spring' && selected.index === i;
              const sprite = loadArcadeSprite(ARCADE_SPRITE_PATHS.springs);
              // Direction rotation angles
              const directionAngle = {
                'up': 0,
                'up-right': 45,
                'up-left': -45,
                'down': 180,
              }[s.direction] ?? 0;
              return (
                <div
                  key={`spring-${i}`}
                  onMouseDown={e => handleMouseDown(e, 'spring', i)}
                  className={`absolute flex items-center justify-center ${tool === 'select' ? 'cursor-move' : ''}`}
                  style={{
                    left: s.x * 2 - size / 2,
                    top: s.y * 2 - size / 2,
                    width: size, height: size,
                    transform: `rotate(${directionAngle + (s.rotation ?? 0)}deg)`,
                    outline: isSelected ? '3px solid #3b82f6' : undefined,
                    outlineOffset: '2px',
                  }}
                >
                  {sprite ? (
                    <img src={sprite.src} alt="spring" className="w-full h-full object-contain" />
                  ) : (
                    <div className="w-full h-full bg-red-400 rounded border-2 border-red-600 flex items-center justify-center shadow-md">
                      <span className="text-white" style={{ fontSize: size * 0.5 }}>
                        {s.direction === 'up' ? '↑' : s.direction === 'down' ? '↓' : s.direction === 'up-left' ? '↖' : '↗'}
                      </span>
                    </div>
                  )}
                  {s.strength && s.strength !== 1.0 && (
                    <span className="absolute -bottom-1 text-xs bg-yellow-500 text-black px-1 rounded"
                      style={{ transform: `rotate(${-(directionAngle + (s.rotation ?? 0))}deg)` }}>
                      ×{s.strength.toFixed(1)}
                    </span>
                  )}
                </div>
              );
            })}

            {/* Portal */}
            {level.portal && (() => {
              const p = level.portal;
              const portalScale = p.scale ?? 1;
              const portalSize = 32 * portalScale;

              // Entry uses blue, exit uses colorId-based color (default orange)
              const entryColorName = 'blue';
              const exitColorName = p.colorId !== undefined ? PORTAL_COLOR_NAMES[p.colorId % 6] : 'orange';
              const entrySprite = loadArcadeSprite(ARCADE_SPRITE_PATHS.portals[entryColorName]);
              const exitSprite = loadArcadeSprite(ARCADE_SPRITE_PATHS.portals[exitColorName]);

              return (
                <>
                  {/* Entry Portal */}
                  <div
                    onMouseDown={e => handleMouseDown(e, 'portal-entry', 0)}
                    className={`absolute flex items-center justify-center ${tool === 'select' ? 'cursor-move' : ''}`}
                    style={{
                      left: p.entry.x * 2 - portalSize / 2,
                      top: p.entry.y * 2 - portalSize / 2,
                      width: portalSize, height: portalSize,
                      outline: selected?.type === 'portal' ? '3px solid #3b82f6' : undefined,
                      outlineOffset: '2px',
                    }}
                  >
                    {entrySprite ? (
                      <img src={entrySprite.src} alt="entry portal" className="w-full h-full object-contain" />
                    ) : (
                      <div className="w-full h-full rounded-full bg-purple-500 border-2 border-purple-700 flex items-center justify-center shadow-lg">
                        <span className="text-white text-xs font-bold">A</span>
                      </div>
                    )}
                  </div>

                  {/* Exit Portal */}
                  <div
                    onMouseDown={e => handleMouseDown(e, 'portal-exit', 0)}
                    className={`absolute flex items-center justify-center ${tool === 'select' ? 'cursor-move' : ''}`}
                    style={{
                      left: p.exit.x * 2 - portalSize / 2,
                      top: p.exit.y * 2 - portalSize / 2,
                      width: portalSize, height: portalSize,
                      outline: selected?.type === 'portal' ? '3px solid #3b82f6' : undefined,
                      outlineOffset: '2px',
                    }}
                  >
                    {exitSprite ? (
                      <img src={exitSprite.src} alt="exit portal" className="w-full h-full object-contain" />
                    ) : (
                      <div className="w-full h-full rounded-full bg-blue-500 border-2 border-blue-700 flex items-center justify-center shadow-lg">
                        <span className="text-white text-xs font-bold">
                          {p.exitDirection === 'up-45' ? '↗' : p.exitDirection === 'down-45' ? '↘' : '→'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Connection line */}
                  <svg className="absolute inset-0 pointer-events-none" style={{ width: W * 2, height: H * 2 }}>
                    <line
                      x1={p.entry.x * 2} y1={p.entry.y * 2}
                      x2={p.exit.x * 2} y2={p.exit.y * 2}
                      stroke="#8b5cf6" strokeWidth="2" strokeDasharray="4" opacity="0.5"
                    />
                  </svg>
                </>
              );
            })()}

            {/* Hazards */}
            {(level.hazards || []).map((h, i) => {
              const scale = h.scale ?? 1.0;
              const size = h.radius * 2 * scale * 2;
              const isSelected = selected?.type === 'hazard' && selected.index === i;
              const spritePath = ARCADE_SPRITE_PATHS.hazards[h.sprite as keyof typeof ARCADE_SPRITE_PATHS.hazards];
              const sprite = spritePath ? loadArcadeSprite(spritePath) : null;
              return (
                <div
                  key={`hazard-${i}`}
                  onMouseDown={e => handleMouseDown(e, 'hazard', i)}
                  className={`absolute flex items-center justify-center ${tool === 'select' ? 'cursor-move' : ''}`}
                  style={{
                    left: h.x * 2 - size / 2,
                    top: h.y * 2 - size / 2,
                    width: size, height: size,
                    transform: h.rotation ? `rotate(${h.rotation}deg)` : undefined,
                    outline: isSelected ? '3px solid #3b82f6' : undefined,
                    outlineOffset: '2px',
                  }}
                >
                  {sprite ? (
                    <img src={sprite.src} alt={h.sprite} className="w-full h-full object-contain" />
                  ) : (
                    <div className={`w-full h-full rounded-full flex items-center justify-center ${
                      h.sprite === 'spike' ? 'bg-gray-600' :
                      h.sprite === 'saw' ? 'bg-gray-400' :
                      'bg-orange-500'
                    }`}>
                      <span className="text-white" style={{ fontSize: size * 0.4 }}>
                        {h.sprite === 'spike' ? '▲' : h.sprite === 'saw' ? '⚙' : '🔥'}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Wind Zones */}
            {(level.windZones || []).map((w, i) => {
              const isSelected = selected?.type === 'windZone' && selected.index === i;
              return (
                <div
                  key={`wind-${i}`}
                  onMouseDown={e => handleMouseDown(e, 'windZone', i)}
                  className={`absolute border-2 border-dashed border-sky-400 bg-sky-300/30 flex items-center justify-center ${tool === 'select' ? 'cursor-move' : ''}`}
                  style={{
                    left: (w.x - w.width / 2) * 2,
                    top: (w.y - w.height / 2) * 2,
                    width: w.width * 2,
                    height: w.height * 2,
                    outline: isSelected ? '3px solid #3b82f6' : undefined,
                    outlineOffset: '2px',
                  }}
                >
                  <span className="text-sky-600 text-2xl">
                    {w.direction === 'left' ? '←' : w.direction === 'right' ? '→' : w.direction === 'up' ? '↑' : '↓'}
                  </span>
                </div>
              );
            })}

            {/* Gravity Wells */}
            {(level.gravityWells || []).map((g, i) => {
              const isSelected = selected?.type === 'gravityWell' && selected.index === i;
              const scale = g.scale ?? 1.0;
              const size = g.radius * 2 * scale * 2;
              return (
                <div
                  key={`gravity-${i}`}
                  onMouseDown={e => handleMouseDown(e, 'gravityWell', i)}
                  className={`absolute rounded-full border-2 border-dashed flex items-center justify-center ${
                    g.type === 'attract' ? 'border-blue-500 bg-blue-500/20' : 'border-red-500 bg-red-500/20'
                  } ${tool === 'select' ? 'cursor-move' : ''}`}
                  style={{
                    left: g.x * 2 - size / 2,
                    top: g.y * 2 - size / 2,
                    width: size,
                    height: size,
                    outline: isSelected ? '3px solid #3b82f6' : undefined,
                    outlineOffset: '2px',
                  }}
                >
                  <span className={`text-2xl ${g.type === 'attract' ? 'text-blue-400' : 'text-red-400'}`}>
                    {g.type === 'attract' ? '◉' : '◎'}
                  </span>
                </div>
              );
            })}

            {/* Friction Zones */}
            {(level.frictionZones || []).map((f, i) => {
              const isSelected = selected?.type === 'frictionZone' && selected.index === i;
              const spritePath = ARCADE_SPRITE_PATHS.zones[f.type];
              const sprite = spritePath ? loadArcadeSprite(spritePath) : null;

              return (
                <div
                  key={`friction-${i}`}
                  onMouseDown={e => handleMouseDown(e, 'frictionZone', i)}
                  className={`absolute flex items-center justify-center overflow-hidden ${tool === 'select' ? 'cursor-move' : ''}`}
                  style={{
                    left: (f.x - f.width / 2) * 2,
                    top: f.y * 2 - 16,
                    width: f.width * 2,
                    height: 32,
                    outline: isSelected ? '3px solid #3b82f6' : undefined,
                    outlineOffset: '2px',
                  }}
                >
                  {sprite ? (
                    <div className="w-full h-full flex">
                      {Array.from({ length: Math.ceil(f.width * 2 / 32) }).map((_, ti) => (
                        <img key={ti} src={sprite.src} alt={f.type} className="h-full" style={{ width: 32 }} />
                      ))}
                    </div>
                  ) : (
                    <div className={`w-full h-full flex items-center justify-center ${
                      f.type === 'ice' ? 'bg-cyan-300/50 border-cyan-400' : 'bg-amber-700/50 border-amber-600'
                    } border-2`}>
                      <span className="text-xs">{f.type === 'ice' ? '❄️' : '🪤'}</span>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Pending portal */}
            {pendingPortalEntry && (
              <div className="absolute w-8 h-8 rounded-full bg-purple-500/50 border-2 border-dashed border-purple-700"
                style={{ left: pendingPortalEntry.x * 2 - 16, top: pendingPortalEntry.y * 2 - 16 }} />
            )}
          </div>
        </div>

        {/* Info bar */}
        <div className="bg-gray-800 p-2 text-gray-400 text-xs flex justify-between">
          <div>
            Doodles: {level.doodles.length} |
            Springs: {level.springs.length} |
            Portal: {level.portal ? 'Yes' : 'No'} |
            Hazards: {(level.hazards || []).length} |
            Wind: {(level.windZones || []).length} |
            Gravity: {(level.gravityWells || []).length} |
            Friction: {(level.frictionZones || []).length}
          </div>
          <div>Ctrl+Z: Undo | Ctrl+Y: Redo | Del: Delete selected</div>
        </div>
      </div>

      {/* Right panel - Properties */}
      <div className="w-64 bg-gray-800 border-l border-gray-700 flex flex-col">
        <div className="p-3 border-b border-gray-700 text-white font-bold text-sm">
          {tool === 'select' ? 'Properties' : `New ${tool.charAt(0).toUpperCase() + tool.slice(1)}`}
        </div>

        <div className="flex-1 overflow-y-auto p-3 text-sm">
          {/* New object settings */}
          {tool === 'doodle' && (
            <div className="space-y-3">
              <div>
                <label className="text-gray-400 text-xs">Sprite</label>
                <select value={newDoodleSprite} onChange={e => setNewDoodleSprite(e.target.value)}
                  className="w-full bg-gray-700 text-white px-2 py-1 rounded mt-1">
                  <option value="coin">Coin</option>
                  <option value="star">Star</option>
                </select>
              </div>
              <div>
                <label className="text-gray-400 text-xs">Base Size</label>
                <select value={newDoodleSize} onChange={e => setNewDoodleSize(e.target.value as DoodleSize)}
                  className="w-full bg-gray-700 text-white px-2 py-1 rounded mt-1">
                  <option value="small">Small</option>
                  <option value="large">Large</option>
                </select>
              </div>
              <div>
                <label className="text-gray-400 text-xs">Scale: {newDoodleScale.toFixed(1)}x</label>
                <input type="range" min="0.5" max="3" step="0.1" value={newDoodleScale}
                  onChange={e => setNewDoodleScale(Number(e.target.value))}
                  className="w-full mt-1" />
              </div>
              <div>
                <label className="text-gray-400 text-xs">Rotation: {newDoodleRotation}°</label>
                <input type="range" min="0" max="360" step="15" value={newDoodleRotation}
                  onChange={e => setNewDoodleRotation(Number(e.target.value))}
                  className="w-full mt-1" />
              </div>
            </div>
          )}

          {tool === 'spring' && (
            <div className="space-y-3">
              <div>
                <label className="text-gray-400 text-xs">Direction</label>
                <select value={newSpringDirection} onChange={e => setNewSpringDirection(e.target.value as SpringDirection)}
                  className="w-full bg-gray-700 text-white px-2 py-1 rounded mt-1">
                  <option value="up">↑ Up</option>
                  <option value="up-left">↖ Up-Left</option>
                  <option value="up-right">↗ Up-Right</option>
                  <option value="down">↓ Down</option>
                </select>
              </div>
              <div>
                <label className="text-gray-400 text-xs">Strength: {newSpringStrength.toFixed(1)}x</label>
                <input type="range" min="0.5" max="3" step="0.1" value={newSpringStrength}
                  onChange={e => setNewSpringStrength(Number(e.target.value))}
                  className="w-full mt-1" />
              </div>
              <div>
                <label className="text-gray-400 text-xs">Scale: {newSpringScale.toFixed(1)}x</label>
                <input type="range" min="0.5" max="2" step="0.1" value={newSpringScale}
                  onChange={e => setNewSpringScale(Number(e.target.value))}
                  className="w-full mt-1" />
              </div>
              <div>
                <label className="text-gray-400 text-xs">Rotation: {newSpringRotation}°</label>
                <input type="range" min="0" max="360" step="15" value={newSpringRotation}
                  onChange={e => setNewSpringRotation(Number(e.target.value))}
                  className="w-full mt-1" />
              </div>
            </div>
          )}

          {tool === 'portal' && (
            <div className="space-y-3">
              <div className="text-yellow-400 text-xs mb-2">
                Click to place {portalStep === 'entry' ? 'ENTRY (A)' : 'EXIT (B)'}
              </div>
              <div>
                <label className="text-gray-400 text-xs">Exit Direction</label>
                <select value={newPortalExitDir} onChange={e => setNewPortalExitDir(e.target.value as PortalExitDirection)}
                  className="w-full bg-gray-700 text-white px-2 py-1 rounded mt-1">
                  <option value="straight">→ Straight</option>
                  <option value="up-45">↗ Up 45°</option>
                  <option value="down-45">↘ Down 45°</option>
                </select>
              </div>
              <div>
                <label className="text-gray-400 text-xs">Exit Speed: {newPortalExitSpeed.toFixed(1)}x</label>
                <input type="range" min="0.5" max="3" step="0.1" value={newPortalExitSpeed}
                  onChange={e => setNewPortalExitSpeed(Number(e.target.value))}
                  className="w-full mt-1" />
              </div>
              <div>
                <label className="text-gray-400 text-xs">Scale: {newPortalScale.toFixed(1)}x</label>
                <input type="range" min="0.5" max="2" step="0.1" value={newPortalScale}
                  onChange={e => setNewPortalScale(Number(e.target.value))}
                  className="w-full mt-1" />
              </div>
            </div>
          )}

          {tool === 'hazard' && (
            <div className="space-y-3">
              <div>
                <label className="text-gray-400 text-xs">Sprite</label>
                <select value={newHazardSprite} onChange={e => setNewHazardSprite(e.target.value as 'spike' | 'saw' | 'fire')}
                  className="w-full bg-gray-700 text-white px-2 py-1 rounded mt-1">
                  <option value="spike">▲ Spike</option>
                  <option value="saw">⚙ Saw</option>
                  <option value="fire">🔥 Fire</option>
                </select>
              </div>
              <div>
                <label className="text-gray-400 text-xs">Radius: {newHazardRadius}px</label>
                <input type="range" min="8" max="30" step="1" value={newHazardRadius}
                  onChange={e => setNewHazardRadius(Number(e.target.value))}
                  className="w-full mt-1" />
              </div>
              <div>
                <label className="text-gray-400 text-xs">Scale: {newHazardScale.toFixed(1)}x</label>
                <input type="range" min="0.5" max="2" step="0.1" value={newHazardScale}
                  onChange={e => setNewHazardScale(Number(e.target.value))}
                  className="w-full mt-1" />
              </div>
              <div>
                <label className="text-gray-400 text-xs">Rotation: {newHazardRotation}°</label>
                <input type="range" min="0" max="360" step="15" value={newHazardRotation}
                  onChange={e => setNewHazardRotation(Number(e.target.value))}
                  className="w-full mt-1" />
              </div>
            </div>
          )}

          {tool === 'wind' && (
            <div className="space-y-3">
              <div>
                <label className="text-gray-400 text-xs">Direction</label>
                <select value={newWindDirection} onChange={e => setNewWindDirection(e.target.value as WindDirection)}
                  className="w-full bg-gray-700 text-white px-2 py-1 rounded mt-1">
                  <option value="left">← Left</option>
                  <option value="right">→ Right</option>
                  <option value="up">↑ Up</option>
                  <option value="down">↓ Down</option>
                </select>
              </div>
              <div>
                <label className="text-gray-400 text-xs">Width: {newWindWidth}px</label>
                <input type="range" min="40" max="200" step="10" value={newWindWidth}
                  onChange={e => setNewWindWidth(Number(e.target.value))}
                  className="w-full mt-1" />
              </div>
              <div>
                <label className="text-gray-400 text-xs">Height: {newWindHeight}px</label>
                <input type="range" min="30" max="150" step="10" value={newWindHeight}
                  onChange={e => setNewWindHeight(Number(e.target.value))}
                  className="w-full mt-1" />
              </div>
              <div>
                <label className="text-gray-400 text-xs">Strength: {newWindStrength.toFixed(2)}</label>
                <input type="range" min="0.05" max="0.5" step="0.05" value={newWindStrength}
                  onChange={e => setNewWindStrength(Number(e.target.value))}
                  className="w-full mt-1" />
              </div>
            </div>
          )}

          {tool === 'gravity' && (
            <div className="space-y-3">
              <div>
                <label className="text-gray-400 text-xs">Type</label>
                <select value={newGravityType} onChange={e => setNewGravityType(e.target.value as GravityWellType)}
                  className="w-full bg-gray-700 text-white px-2 py-1 rounded mt-1">
                  <option value="attract">◉ Attract (Blue)</option>
                  <option value="repel">◎ Repel (Red)</option>
                </select>
              </div>
              <div>
                <label className="text-gray-400 text-xs">Radius: {newGravityRadius}px</label>
                <input type="range" min="30" max="100" step="5" value={newGravityRadius}
                  onChange={e => setNewGravityRadius(Number(e.target.value))}
                  className="w-full mt-1" />
              </div>
              <div>
                <label className="text-gray-400 text-xs">Strength: {newGravityStrength.toFixed(2)}</label>
                <input type="range" min="0.05" max="0.5" step="0.05" value={newGravityStrength}
                  onChange={e => setNewGravityStrength(Number(e.target.value))}
                  className="w-full mt-1" />
              </div>
              <div>
                <label className="text-gray-400 text-xs">Scale: {newGravityScale.toFixed(1)}x</label>
                <input type="range" min="0.5" max="2" step="0.1" value={newGravityScale}
                  onChange={e => setNewGravityScale(Number(e.target.value))}
                  className="w-full mt-1" />
              </div>
            </div>
          )}

          {tool === 'friction' && (
            <div className="space-y-3">
              <div className="text-yellow-400 text-xs mb-2">
                Placed at ground level (y=220)
              </div>
              <div>
                <label className="text-gray-400 text-xs">Type</label>
                <select value={newFrictionType} onChange={e => setNewFrictionType(e.target.value as FrictionType)}
                  className="w-full bg-gray-700 text-white px-2 py-1 rounded mt-1">
                  <option value="ice">❄️ Ice (Slippery)</option>
                  <option value="sticky">🪤 Sticky (Grippy)</option>
                </select>
              </div>
              <div>
                <label className="text-gray-400 text-xs">Width: {newFrictionWidth}px</label>
                <input type="range" min="30" max="150" step="10" value={newFrictionWidth}
                  onChange={e => setNewFrictionWidth(Number(e.target.value))}
                  className="w-full mt-1" />
              </div>
            </div>
          )}

          {/* Selected object properties */}
          {tool === 'select' && selected && (
            <div className="space-y-3">
              {selected.type === 'doodle' && level.doodles[selected.index] && (() => {
                const d = level.doodles[selected.index];
                return (
                  <>
                    <div className="text-white font-bold">Doodle #{d.sequence}</div>
                    <div>
                      <label className="text-gray-400 text-xs">Sprite</label>
                      <select value={d.sprite} onChange={e => updateSelectedProperty('sprite', e.target.value)}
                        className="w-full bg-gray-700 text-white px-2 py-1 rounded mt-1">
                        <option value="coin">Coin</option>
                        <option value="star">Star</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-gray-400 text-xs">Base Size</label>
                      <select value={d.size} onChange={e => updateSelectedProperty('size', e.target.value)}
                        className="w-full bg-gray-700 text-white px-2 py-1 rounded mt-1">
                        <option value="small">Small</option>
                        <option value="large">Large</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-gray-400 text-xs">Scale: {(d.scale ?? 1).toFixed(1)}x</label>
                      <input type="range" min="0.5" max="3" step="0.1" value={d.scale ?? 1}
                        onChange={e => updateSelectedProperty('scale', Number(e.target.value))}
                        className="w-full mt-1" />
                    </div>
                    <div>
                      <label className="text-gray-400 text-xs">Rotation: {d.rotation ?? 0}°</label>
                      <input type="range" min="0" max="360" step="15" value={d.rotation ?? 0}
                        onChange={e => updateSelectedProperty('rotation', Number(e.target.value))}
                        className="w-full mt-1" />
                    </div>
                    <div>
                      <label className="text-gray-400 text-xs">Position</label>
                      <div className="flex gap-2 mt-1">
                        <input type="number" value={d.x} onChange={e => updateSelectedProperty('x', Number(e.target.value))}
                          className="w-1/2 bg-gray-700 text-white px-2 py-1 rounded" placeholder="X" />
                        <input type="number" value={d.y} onChange={e => updateSelectedProperty('y', Number(e.target.value))}
                          className="w-1/2 bg-gray-700 text-white px-2 py-1 rounded" placeholder="Y" />
                      </div>
                    </div>
                  </>
                );
              })()}

              {selected.type === 'spring' && level.springs[selected.index] && (() => {
                const s = level.springs[selected.index];
                return (
                  <>
                    <div className="text-white font-bold">Spring</div>
                    <div>
                      <label className="text-gray-400 text-xs">Direction</label>
                      <select value={s.direction} onChange={e => updateSelectedProperty('direction', e.target.value)}
                        className="w-full bg-gray-700 text-white px-2 py-1 rounded mt-1">
                        <option value="up">↑ Up</option>
                        <option value="up-left">↖ Up-Left</option>
                        <option value="up-right">↗ Up-Right</option>
                        <option value="down">↓ Down</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-gray-400 text-xs">Strength: {(s.strength ?? 1).toFixed(1)}x</label>
                      <input type="range" min="0.5" max="3" step="0.1" value={s.strength ?? 1}
                        onChange={e => updateSelectedProperty('strength', Number(e.target.value))}
                        className="w-full mt-1" />
                    </div>
                    <div>
                      <label className="text-gray-400 text-xs">Scale: {(s.scale ?? 1).toFixed(1)}x</label>
                      <input type="range" min="0.5" max="2" step="0.1" value={s.scale ?? 1}
                        onChange={e => updateSelectedProperty('scale', Number(e.target.value))}
                        className="w-full mt-1" />
                    </div>
                    <div>
                      <label className="text-gray-400 text-xs">Rotation: {s.rotation ?? 0}°</label>
                      <input type="range" min="0" max="360" step="15" value={s.rotation ?? 0}
                        onChange={e => updateSelectedProperty('rotation', Number(e.target.value))}
                        className="w-full mt-1" />
                    </div>
                    <div>
                      <label className="text-gray-400 text-xs">Position</label>
                      <div className="flex gap-2 mt-1">
                        <input type="number" value={s.x} onChange={e => updateSelectedProperty('x', Number(e.target.value))}
                          className="w-1/2 bg-gray-700 text-white px-2 py-1 rounded" placeholder="X" />
                        <input type="number" value={s.y} onChange={e => updateSelectedProperty('y', Number(e.target.value))}
                          className="w-1/2 bg-gray-700 text-white px-2 py-1 rounded" placeholder="Y" />
                      </div>
                    </div>
                  </>
                );
              })()}

              {selected.type === 'portal' && level.portal && (() => {
                const p = level.portal;
                return (
                  <>
                    <div className="text-white font-bold">Portal</div>
                    <div>
                      <label className="text-gray-400 text-xs">Exit Direction</label>
                      <select value={p.exitDirection ?? 'straight'} onChange={e => updateSelectedProperty('exitDirection', e.target.value)}
                        className="w-full bg-gray-700 text-white px-2 py-1 rounded mt-1">
                        <option value="straight">→ Straight</option>
                        <option value="up-45">↗ Up 45°</option>
                        <option value="down-45">↘ Down 45°</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-gray-400 text-xs">Exit Speed: {(p.exitSpeed ?? 1).toFixed(1)}x</label>
                      <input type="range" min="0.5" max="3" step="0.1" value={p.exitSpeed ?? 1}
                        onChange={e => updateSelectedProperty('exitSpeed', Number(e.target.value))}
                        className="w-full mt-1" />
                    </div>
                    <div>
                      <label className="text-gray-400 text-xs">Scale: {(p.scale ?? 1).toFixed(1)}x</label>
                      <input type="range" min="0.5" max="2" step="0.1" value={p.scale ?? 1}
                        onChange={e => updateSelectedProperty('scale', Number(e.target.value))}
                        className="w-full mt-1" />
                    </div>
                    <div className="border-t border-gray-700 pt-2 mt-2">
                      <label className="text-gray-400 text-xs">Entry (A)</label>
                      <div className="flex gap-2 mt-1">
                        <input type="number" value={p.entry.x}
                          onChange={e => updateLevel(prev => prev.portal ? { ...prev, portal: { ...prev.portal, entry: { ...prev.portal.entry, x: Number(e.target.value) } } } : prev)}
                          className="w-1/2 bg-gray-700 text-white px-2 py-1 rounded" placeholder="X" />
                        <input type="number" value={p.entry.y}
                          onChange={e => updateLevel(prev => prev.portal ? { ...prev, portal: { ...prev.portal, entry: { ...prev.portal.entry, y: Number(e.target.value) } } } : prev)}
                          className="w-1/2 bg-gray-700 text-white px-2 py-1 rounded" placeholder="Y" />
                      </div>
                    </div>
                    <div>
                      <label className="text-gray-400 text-xs">Exit (B)</label>
                      <div className="flex gap-2 mt-1">
                        <input type="number" value={p.exit.x}
                          onChange={e => updateLevel(prev => prev.portal ? { ...prev, portal: { ...prev.portal, exit: { ...prev.portal.exit, x: Number(e.target.value) } } } : prev)}
                          className="w-1/2 bg-gray-700 text-white px-2 py-1 rounded" placeholder="X" />
                        <input type="number" value={p.exit.y}
                          onChange={e => updateLevel(prev => prev.portal ? { ...prev, portal: { ...prev.portal, exit: { ...prev.portal.exit, y: Number(e.target.value) } } } : prev)}
                          className="w-1/2 bg-gray-700 text-white px-2 py-1 rounded" placeholder="Y" />
                      </div>
                    </div>
                  </>
                );
              })()}

              <button onClick={deleteSelected} className="w-full bg-red-600 text-white py-2 rounded mt-4">
                🗑️ Delete
              </button>
            </div>
          )}

          {tool === 'select' && !selected && (
            <div className="text-gray-500 text-center mt-8">
              Click an object to select it
            </div>
          )}

          {tool === 'eraser' && (
            <div className="text-gray-400 text-center mt-8">
              Click objects to delete them
            </div>
          )}
        </div>
      </div>

      {/* Generator Modal */}
      {showGenerator && (
        <GeneratorModal
          onClose={() => setShowGenerator(false)}
          onComplete={handleGeneratorComplete}
        />
      )}
    </div>
  );
}
