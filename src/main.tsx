/**
 * main.tsx: Entry point for the Maritime Terrain Visualization React
 * application. Sets up global styles and renders the App component into
 * the root DOM node.
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./lil-gui-theme.css";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
