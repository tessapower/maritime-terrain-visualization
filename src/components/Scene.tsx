// Scene.tsx: Main scene component for rendering Three.js content.
//
// Uses React hooks to manage the lifecycle of the Three.js scene.
// Initializes the SceneManager and attaches it to a canvas element.
// Cleans up resources on component unmount.

import { useEffect, useRef } from "react";
import { SceneManager } from "../three/SceneManager";

/**
 * Main React component for rendering the Three.js scene.
 * Initializes and manages the SceneManager lifecycle and attaches it
 * to a canvas element.
 */
export const Scene = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneManagerRef = useRef<SceneManager | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Initialize Three.js scene
    sceneManagerRef.current = new SceneManager(canvasRef.current);
    sceneManagerRef.current.start();

    // Cleanup
    return () => {
      sceneManagerRef.current?.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} className="webgl-canvas" />;
};
