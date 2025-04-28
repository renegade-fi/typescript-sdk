import axios, { type AxiosError } from "axios";

export class PriceReporterError extends Error {
    constructor(message: string) {
        super(`PriceReporterError: ${message}`);
        Object.setPrototypeOf(this, PriceReporterError.prototype);
    }
}

export class HttpError extends PriceReporterError {
    public status?: number;
    public details?: unknown;

    /**
     * Creates a new HttpError with detailed error information
     * @param error - The original error (typically an AxiosError)
     * @param url - The URL that was being accessed
     * @param method - The HTTP method that was being used
     * @param customMessage - Optional custom message prefix (defaults to "HTTP request failed")
     */
    constructor(
        error: unknown,
        url: string,
        method: string,
        customMessage = "HTTP request failed",
    ) {
        const requestInfo = `[${method.toUpperCase()}] ${url}`;
        let finalMessage = `${customMessage} - ${requestInfo}`;

        if (axios.isAxiosError(error)) {
            const axiosError = error as AxiosError;
            if (axiosError.response) {
                const { status, statusText, data } = axiosError.response;
                const errorCode = axiosError.code ? ` (${axiosError.code})` : "";
                const errorMessage = typeof data === "string" ? `: ${data}` : "";
                finalMessage = `${finalMessage} - Received ${status} ${statusText}${errorCode}${errorMessage}`;
            } else if (axiosError.request) {
                finalMessage = `${finalMessage} - No response received from server`;
            } else {
                finalMessage = `${finalMessage} - Request failed: ${axiosError.message}`;
            }
        }
        super(finalMessage);
        Object.setPrototypeOf(this, HttpError.prototype);

        if (axios.isAxiosError(error) && error.response) {
            this.status = error.response.status;
            this.details = error.response.data;
        } else {
            this.details = error;
        }
    }
}
