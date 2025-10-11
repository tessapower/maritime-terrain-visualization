import "./App.css";
import { useState, useEffect } from "react";
import { Console } from "./components/gui/Console";
import { logger } from "./three/utils/Logger";
import { Scene } from "./components/Scene";

function App() {
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    // Subscribe to Logger updates
    const unsubscribe = logger.subscribe(setLogs);

    // Initial messages
    logger.log("INITIALIZING SYSTEM...");
    return unsubscribe;
  }, []);

  return (
    <div style={{ width: "100vw", height: "100vh", margin: 0, padding: 0 }}>
      <Scene />
      <Console messages={logs} />
    </div>
  );
}

export default App;
