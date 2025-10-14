// Console.tsx: A simple console component to display log messages.

import { useEffect, useRef } from "react";
import "./Console.css";

interface ConsoleProps {
  messages: string[];
  maxMessages?: number;
}

/**
 * React component for displaying log messages in a scrollable console view.
 * Auto-scrolls to the latest message and limits the number of visible messages.
 */
export const Console = ({ messages, maxMessages = 6 }: ConsoleProps) => {
  const consoleRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [messages]);

  // Show only last N messages
  const visibleMessages = messages.slice(-maxMessages);

  return (
    <div className="console" ref={consoleRef}>
      {visibleMessages.map((msg, i) => (
        <div key={i} className="console-line">
          {msg}
        </div>
      ))}
    </div>
  );
};
