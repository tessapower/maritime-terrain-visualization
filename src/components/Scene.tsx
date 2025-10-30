// Scene.tsx: Main scene component for rendering Three.js content.
//
// Uses React hooks to manage the lifecycle of the Three.js scene.
// Initializes the SceneManager and attaches it to a canvas element.
// Cleans up resources on component unmount.

import { useEffect, useRef } from "react";
import { SceneMgr } from "../three/SceneMgr";

/**
 * Main React component for rendering the Three.js scene.
 * Initializes and manages the SceneManager lifecycle and attaches it
 * to a canvas element.
 */
export const Scene = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneManagerRef = useRef<SceneMgr | null>(null);

  useEffect((): (() => void) | undefined => {
    if (!canvasRef.current) return;

    // Initialize Three.js scene
    sceneManagerRef.current = new SceneMgr(canvasRef.current);
    sceneManagerRef.current.start();

    // Cleanup
    return () => {
      sceneManagerRef.current?.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} className="webgl-canvas" />;
};
