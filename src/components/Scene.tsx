/// Scene.tsx: Main Three.js scene component

import { useEffect, useRef } from "react";
import { SceneManager } from "../three/SceneManager";

export const Scene = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneManagerRef = useRef<SceneManager | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Initialize Three.js scene
    sceneManagerRef.current = new SceneManager(canvasRef.current);
    sceneManagerRef.current.init();
    sceneManagerRef.current.start();

    // Cleanup
    return () => {
      sceneManagerRef.current?.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} className="webgl-canvas" />;
};
