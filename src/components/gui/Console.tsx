// components/Console.tsx
import { useEffect, useRef } from "react";
import "./Console.css";

interface ConsoleProps {
  messages: string[];
  maxMessages?: number;
}

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
