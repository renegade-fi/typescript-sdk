import type { Logger, LoggingOptions } from "./types.js";

/**
 * A logger that performs no operations. Used when no consumer logger is provided.
 */
export class NoopLogger implements Logger {
    debug(): void {}
    info(): void {}
    warn(): void {}
    error(): void {}
}

/**
 * A thin console-backed logger primarily for development/testing.
 * Not used by default; consumers should inject their own logger.
 */
export class ConsoleLogger implements Logger {
    private readonly baseMeta: Record<string, unknown>;

    constructor(options?: { baseMeta?: Record<string, unknown> }) {
        this.baseMeta = options?.baseMeta ?? {};
    }

    /** Merge static base metadata into per-call metadata. */
    private mix(meta?: Record<string, unknown>) {
        return this.baseMeta && Object.keys(this.baseMeta).length > 0
            ? { ...this.baseMeta, ...(meta ?? {}) }
            : meta;
    }

    debug(message: string, meta?: Record<string, unknown>): void {
        console.debug(message, this.mix(meta));
    }
    info(message: string, meta?: Record<string, unknown>): void {
        console.info(message, this.mix(meta));
    }
    warn(message: string, meta?: Record<string, unknown>): void {
        console.warn(message, this.mix(meta));
    }
    error(message: string, meta?: Record<string, unknown>): void {
        console.error(message, this.mix(meta));
    }

    child(context: Record<string, unknown>): Logger {
        const merged = { ...this.baseMeta, ...context };
        return new ConsoleLogger({ baseMeta: merged });
    }
}

export function createLogger(options?: LoggingOptions): Logger {
    // Prefer consumer-provided logger if available
    if (options?.logger) {
        const base =
            options.namespace && options.logger.child
                ? options.logger.child({ ns: options.namespace })
                : options.logger;
        return base;
    }
    // Default to silent if no logger provided
    return new NoopLogger();
}

export function childLogger(base: Logger, context: Record<string, unknown>): Logger {
    return base.child ? base.child(context) : base;
}
