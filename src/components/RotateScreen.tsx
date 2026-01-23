// src/components/RotateScreen.tsx
import { useEffect, useState } from 'react';
import { assetPath } from '@/lib/assetPath';

const ZENO_FRAMES = [
  assetPath('/assets/sprites/zenoflip/zenotwist1.png'),
  assetPath('/assets/sprites/zenoflip/zenotwist2.png'),
  assetPath('/assets/sprites/zenoflip/zenotwist3.png'),
  assetPath('/assets/sprites/zenoflip/zenotwist4.png'),
];

export function RotateScreen() {
  const [frame, setFrame] = useState(0);

  // Animate Zeno spin
  useEffect(() => {
    const interval = setInterval(() => {
      setFrame((f) => (f + 1) % 4);
    }, 150);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: '#f5f0e1',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '24px',
        fontFamily: '"Comic Sans MS", cursive, sans-serif',
      }}
    >
      {/* Spinning Zeno */}
      <img
        src={ZENO_FRAMES[frame]}
        alt="Zeno spinning"
        style={{
          width: '120px',
          height: '120px',
          objectFit: 'contain',
        }}
      />

      {/* Animated phone icon */}
      <div
        style={{
          fontSize: '48px',
          animation: 'rotatePhone 1.5s ease-in-out infinite',
        }}
      >
        📱
      </div>

      {/* Text prompt */}
      <p
        style={{
          color: '#1e3a5f',
          fontSize: '18px',
          fontWeight: 'bold',
          textAlign: 'center',
          margin: 0,
        }}
      >
        Rotate for best experience!
      </p>

      {/* CSS animation */}
      <style>{`
        @keyframes rotatePhone {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(90deg); }
        }
      `}</style>
    </div>
  );
}
