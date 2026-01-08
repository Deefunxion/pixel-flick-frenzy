import Game from '@/components/Game';

/**
 * ONE-MORE-FLICK
 * 
 * CONTROLS: SPACE or CLICK (hold)
 * AIM: Drag up/down while holding (or Arrow keys)
 * GOAL: Land as close as possible to the cliff edge without falling
 * 
 * Hold to charge, release to launch.
 * Wind changes every 5 throws.
 * Your best run haunts you as a ghost trail.
 */
const Index = () => {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background">
      <Game />
    </main>
  );
};

export default Index;
