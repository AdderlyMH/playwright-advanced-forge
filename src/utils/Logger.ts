/**
 * Lightweight logging utility for consistent, level-based console output.
 */
export class Logger {
  static info(message: string, ...args: unknown[]): void {
    console.log(`[INFO] ${message}`, ...args);
  }

  static error(message: string, error?: unknown): void {
    console.error(`[ERROR] ${message}`, error ?? '');
  }

  static debug(message: string, ...args: unknown[]): void {
    if (process.env.DEBUG) {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  }
}
