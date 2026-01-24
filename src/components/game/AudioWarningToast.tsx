import type { Theme } from '@/game/themes';

type AudioWarningToastProps = {
  show: boolean;
  theme: Theme;
  onDismiss: () => void;
  onRetry: () => void;
};

export function AudioWarningToast({ show, theme, onDismiss, onRetry }: AudioWarningToastProps) {
  if (!show) return null;

  return (
    <div
      className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50
                 px-4 py-3 rounded-lg shadow-lg max-w-xs animate-bounce"
      style={{
        backgroundColor: theme.uiBg,
        border: `2px solid ${theme.danger}`,
        boxShadow: `0 4px 20px ${theme.danger}40`
      }}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl">🔇</span>
        <div className="flex-1">
          <p className="text-sm font-bold" style={{ color: theme.danger }}>
            Sound Blocked
          </p>
          <p className="text-xs mt-1" style={{ color: theme.uiText, opacity: 0.8 }}>
            iOS requires a tap to enable audio
          </p>
          <div className="flex gap-2 mt-2">
            <button
              onClick={onRetry}
              className="px-3 py-1 rounded text-xs font-bold"
              style={{ backgroundColor: theme.accent1, color: theme.background }}
            >
              Enable Sound
            </button>
            <button
              onClick={onDismiss}
              className="px-3 py-1 rounded text-xs"
              style={{ color: theme.uiText, opacity: 0.7 }}
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
