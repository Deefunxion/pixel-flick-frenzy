import { createRoot } from "react-dom/client";
import { polyfillCanvas } from "./game/engine/canvasPolyfills";
import { initSentry } from "./lib/sentry";
import { checkVersionAndRefresh } from "./lib/versionCheck";
import App from "./App.tsx";
import "./index.css";

// Check for new version and auto-refresh if needed (before heavy initialization)
// This prevents users on cached versions from seeing stale game builds
if (checkVersionAndRefresh()) {
  // Reload initiated, stop execution
  throw new Error('Version update in progress');
}

// Initialize error tracking first
initSentry();

// Apply polyfills before any canvas rendering
polyfillCanvas();

createRoot(document.getElementById("root")!).render(<App />);
