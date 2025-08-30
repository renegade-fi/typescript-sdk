/**
 * Minimal logger interface used by the SDK.
 *
 * Implement this interface to integrate your logging library (e.g. pino, winston).
 * The SDK does not log by default; provide a logger via `createConfig({ logging: { logger } })`.
 */
export interface Logger {
    /** Log verbose diagnostic details useful for debugging. */
    debug(message: string, meta?: Record<string, unknown>): void;
    /** Log general informational messages about normal operations. */
    info(message: string, meta?: Record<string, unknown>): void;
    /** Log recoverable issues or potential problems. */
    warn(message: string, meta?: Record<string, unknown>): void;
    /** Log errors and unexpected failures. */
    error(message: string, meta?: Record<string, unknown>): void;
    /**
     * Optionally derive a namespaced child logger with static context.
     * If unsupported, return the base logger.
     */
    child?(context: Record<string, unknown>): Logger;
}

/**
 * Logging configuration passed to `createConfig` or `createExternalKeyConfig`.
 */
export type LoggingOptions = {
    /**
     * Your logger implementation. If omitted, logging is silent by default.
     */
    logger?: Logger;
    /**
     * Optional namespace applied at creation time via `logger.child({ ns })` when supported.
     */
    namespace?: string;
};
