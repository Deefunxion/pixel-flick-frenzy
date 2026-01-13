import { createRoot } from "react-dom/client";
import { polyfillCanvas } from "./game/engine/canvasPolyfills";
import { initSentry } from "./lib/sentry";
import App from "./App.tsx";
import "./index.css";

// Initialize error tracking first
initSentry();

// Apply polyfills before any canvas rendering
polyfillCanvas();

createRoot(document.getElementById("root")!).render(<App />);
