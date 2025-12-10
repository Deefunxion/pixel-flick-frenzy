import Game from '@/components/Game';

/**
 * ONE-MORE-FLICK
 * 
 * CONTROLS: SPACE or CLICK
 * GOAL: Flick the white pixel as far as possible
 * 
 * Hold to charge, release to launch.
 * Wind and gravity change every 7 tries.
 * Your best trajectory haunts you as a ghost trail.
 */
const Index = () => {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background">
      <Game />
    </main>
  );
};

export default Index;
