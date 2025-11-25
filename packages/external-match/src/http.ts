/**
 * HTTP client for making authenticated requests to the Renegade relayer API.
 * This client handles request signing and authentication using HMAC-SHA256.
 */

import { hmac } from "@noble/hashes/hmac";
import { sha256 } from "@noble/hashes/sha2";
import JSONBigInt from "json-bigint";

// Constants for authentication
export const RENEGADE_HEADER_PREFIX = "x-renegade";
export const RENEGADE_AUTH_HEADER = "x-renegade-auth";
export const RENEGADE_AUTH_EXPIRATION_HEADER = "x-renegade-auth-expiration";

// Authentication constants
const REQUEST_SIGNATURE_DURATION_MS = 10 * 1000; // 10 seconds in milliseconds

// Configure JSON-BigInt for parsing and stringifying
const jsonProcessor = JSONBigInt({
    alwaysParseAsBig: true,
    useNativeBigInt: true,
});

/**
 * Stringify object that may contain BigInt values
 */
export const stringifyBody = (data: any) => {
    return jsonProcessor.stringify(data);
};

// Define interface for HTTP response similar to Axios response
export interface HttpResponse<T = any> {
    data: T;
    status: number;
    statusText: string;
    headers: Record<string, string>;
}

/**
 * HTTP client for making authenticated requests to the Renegade relayer API.
 */
export class RelayerHttpClient {
    private baseUrl: string;
    private authKey?: Uint8Array;
    private defaultHeaders: Record<string, string>;

    /**
     * Initialize a new RelayerHttpClient.
     *
     * @param baseUrl The base URL of the relayer API
     * @param authKey The base64-encoded authentication key for request signing
     */
    constructor(baseUrl: string, authKey?: string) {
        this.baseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
        if (authKey) {
            this.authKey = this.decodeBase64(authKey);
        }
        this.defaultHeaders = {
            "Content-Type": "application/json",
            // Ask the server to encode all numeric values as strings.
            Accept: "application/json; number=string",
        };
    }

    /**
     * Make a GET request with custom headers.
     *
     * @param path The API endpoint path
     * @param headers Additional headers to include
     * @returns The API response
     */
    public async get<T>(
        path: string,
        headers: Record<string, string> = {},
    ): Promise<HttpResponse<T>> {
        return this.request<T>("GET", path, undefined, headers);
    }

    /**
     * Make a POST request with custom headers.
     *
     * @param path The API endpoint path
     * @param data The request body to send
     * @param headers Additional headers to include
     * @returns The API response
     */
    public async post<T, D = any>(
        path: string,
        data: D,
        headers: Record<string, string> = {},
    ): Promise<HttpResponse<T>> {
        return this.request<T>("POST", path, data, headers);
    }

    /**
     * Make an HTTP request with authentication.
     *
     * @param method The HTTP method
     * @param path The API endpoint path
     * @param data The request body data
     * @param customHeaders Additional headers to include
     * @returns The API response
     */
    private async request<T>(
        method: string,
        path: string,
        data?: any,
        customHeaders: Record<string, string> = {},
    ): Promise<HttpResponse<T>> {
        const urlPath = path.startsWith("/") ? path.slice(1) : path;
        const url = new URL(urlPath, this.baseUrl);

        // Prepare headers, and add authentication headers
        const headers = { ...this.defaultHeaders, ...customHeaders };
        let fullHeaders = headers;
        if (this.authKey) {
            fullHeaders = this.addAuthHeaders(url.pathname + url.search, headers, data);
        }

        // Prepare request body
        let body: string | undefined;
        if (data !== undefined) {
            body = typeof data === "string" ? data : stringifyBody(data);
        }

        // Make the fetch request
        const response = await fetch(url.toString(), {
            method,
            headers: fullHeaders,
            body,
        });

        // Read the response body
        let responseData: any;
        const contentType = response.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
            responseData = await response.json();
        } else {
            responseData = await response.text();
        }

        // Convert headers to a simple object
        const responseHeaders: Record<string, string> = {};
        response.headers.forEach((value, key) => {
            responseHeaders[key] = value;
        });

        // Return a response object similar to Axios response
        return {
            data: responseData,
            status: response.status,
            statusText: response.statusText,
            headers: responseHeaders,
        };
    }

    /**
     * Add authentication headers to a request.
     */
    private addAuthHeaders(
        path: string,
        headers: Record<string, string>,
        data?: any,
    ): Record<string, string> {
        // Add timestamp and expiry
        const timestamp = Date.now();
        const expiry = timestamp + REQUEST_SIGNATURE_DURATION_MS;
        headers[RENEGADE_AUTH_EXPIRATION_HEADER] = expiry.toString();

        // Compute the MAC signature and
        const macDigest = this.computeRequestMac(path, headers, data);
        headers[RENEGADE_AUTH_HEADER] = this.encodeBase64(Buffer.from(macDigest));
        return headers;
    }

    /**
     * Compute the HMAC-SHA256 MAC for a request.
     *
     * @param path The API endpoint path with query parameters
     * @param headers The request headers
     * @param data The request body data
     * @returns The computed MAC digest
     */
    private computeRequestMac(
        path: string,
        headers: Record<string, string>,
        data?: any,
    ): Uint8Array {
        if (!this.authKey) {
            throw new Error("Auth key is not set");
        }

        // Initialize MAC with auth key
        const mac = hmac.create(sha256, this.authKey);

        // Add path to signature
        const pathBytes = new TextEncoder().encode(path);
        mac.update(pathBytes);

        // Add Renegade headers to signature
        const renegadeHeaders = Object.entries(headers)
            .filter(([key]) => key.toLowerCase().startsWith(RENEGADE_HEADER_PREFIX))
            .filter(([key]) => key.toLowerCase() !== RENEGADE_AUTH_HEADER.toLowerCase())
            .sort(([a], [b]) => a.localeCompare(b));

        for (const [key, value] of renegadeHeaders) {
            mac.update(new TextEncoder().encode(key));
            mac.update(new TextEncoder().encode(value.toString()));
        }

        // Add body to signature
        let body = "";
        if (data !== undefined) {
            body = typeof data === "string" ? data : stringifyBody(data);
        }
        mac.update(new TextEncoder().encode(body));

        // Return the digest
        return mac.digest();
    }

    /**
     * Decode a base64 string to a Uint8Array.
     */
    private decodeBase64(base64: string): Uint8Array {
        return new Uint8Array(Buffer.from(base64, "base64"));
    }

    /**
     * Encode a Uint8Array or Buffer to a base64 string.
     */
    private encodeBase64(data: Uint8Array | Buffer): string {
        const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
        return buffer.toString("base64").replace(/=+$/, "");
    }
}
