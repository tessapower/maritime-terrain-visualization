// Logger.ts: A simple logger.

import { getRandomJargon } from "./Jargon";

type LogCallback = (messages: string[]) => void;

interface LogEntry {
  message: string;
  timestamp: number; // Unix timestamp in ms
}

/**
 * Provides logging functionality with timestamped messages and fun jargon.
 * Supports listeners for log updates and automatic cleanup of old messages.
 */
class Logger {
  private entries: LogEntry[] = [];
  private listeners: LogCallback[] = [];
  private cleanupIntervalId: number | null = null;
  private jargonIntervalId: number | null = null;

  // Configuration
  // Keep logs for x seconds
  private readonly maxAge = 12000;
  // x seconds of no new logs = "inactive"
  private readonly inactivityThreshold = 2000;
  private readonly cleanupInterval = 500;
  private lastLogTime = 0;
  // Silly things
  private readonly jargonMinInterval = 3000; // Min 3 seconds between jargon
  private readonly jargonMaxInterval = 8000; // Max 8 seconds between jargon
  private lastJargonTime = 0;

  constructor() {
    this.startCleanupTimer();
    this.startJargonTimer();
  }

  log(message: string): void {
    const timestamp = Date.now();
    const timeStr = new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hour12: false,
    }).format(new Date());

    this.entries.push({
      message: `[${timeStr}] ${message}`,
      timestamp: timestamp,
    });

    this.lastLogTime = timestamp;
    this.notifyListeners();
  }

  private startCleanupTimer(): void {
    this.cleanupIntervalId = window.setInterval(() => {
      this.cleanupOldestLog();
    }, this.cleanupInterval);
  }

  private startJargonTimer(): void {
    const scheduleNextJargon = () => {
      // Random interval between min and max
      const interval =
        this.jargonMinInterval +
        Math.random() * (this.jargonMaxInterval - this.jargonMinInterval);

      this.jargonIntervalId = window.setTimeout(() => {
        this.maybeLogJargon();
        scheduleNextJargon(); // Schedule next one
      }, interval);
    };

    scheduleNextJargon();
  }

  private maybeLogJargon(): void {
    const now = Date.now();
    const timeSinceLastLog = now - this.lastLogTime;
    const timeSinceLastJargon = now - this.lastJargonTime;

    // Only log jargon if:
    // 1. We've been inactive for a while
    // 2. Haven't logged jargon too recently
    if (
      timeSinceLastLog > this.inactivityThreshold &&
      timeSinceLastJargon > this.jargonMinInterval
    ) {
      const jargon = getRandomJargon();
      this.log(jargon);
      this.lastJargonTime = now;
    }
  }

  private cleanupOldestLog(): void {
    const now = Date.now();
    const timeSinceLastLog = now - this.lastLogTime;

    // Only remove old logs if we've been inactive
    if (timeSinceLastLog < this.inactivityThreshold) {
      return;
    }

    // Check if oldest entry is too old
    if (this.entries.length > 0) {
      const oldest = this.entries[0];
      const age = now - oldest.timestamp;

      if (age > this.maxAge) {
        // Remove only the oldest entry
        this.entries.shift(); // Remove first element
        this.notifyListeners();
      }
    }
  }

  subscribe(callback: LogCallback): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  private notifyListeners(): void {
    const messages = this.entries.map((e) => e.message);
    this.listeners.forEach((listener) => listener(messages));
  }

  getMessages(): string[] {
    return this.entries.map((e) => e.message);
  }

  destroy(): void {
    if (this.cleanupIntervalId !== null) clearInterval(this.cleanupIntervalId);
    if (this.jargonIntervalId !== null) clearTimeout(this.jargonIntervalId);
  }
}

export const logger = new Logger();
