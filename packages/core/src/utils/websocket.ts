import { SIG_EXPIRATION_BUFFER_MS } from "../constants.js";
import type { RenegadeConfig } from "../createConfig.js";
import {
    SocketClosedError,
    WebSocketConnectionError,
    WebSocketRequestError,
} from "../errors/websocket.js";
import { addExpiringAuthToHeaders } from "./http.js";

export enum AuthType {
    None = "None",
    Wallet = "Wallet",
    Admin = "Admin",
}

export type RelayerWebsocketParams = {
    config: RenegadeConfig;
    topic: string;
    authType: AuthType;
    onmessage: (this: WebSocket, ev: MessageEvent) => any;
    onopenCallback?: (this: WebSocket, ev: Event) => any;
    oncloseCallback?: (this: WebSocket, ev: CloseEvent) => any;
    onerrorCallback?: (this: WebSocket, ev: Event) => any;
};

type SubscriptionMessage = {
    headers?: Record<string, string>;
    body: SubscriptionBody;
};

type UnsubscriptionMessage = {
    body: UnsubscriptionBody;
};

export type SubscriptionBody = {
    method: "subscribe";
    topic: string;
};

export type UnsubscriptionBody = {
    method: "unsubscribe";
    topic: string;
};

export class RelayerWebsocket {
    private config: RenegadeConfig;
    private topic: string;
    private authType: AuthType;
    private onmessage: (this: WebSocket, ev: MessageEvent) => any;
    private onopenCallback: ((this: WebSocket, ev: Event) => any) | null;
    private oncloseCallback: ((this: WebSocket, ev: CloseEvent) => any) | null;
    private onerrorCallback: ((this: WebSocket, ev: Event) => any) | null;

    private ws: WebSocket | null = null;

    private handleOpen = (event: Event) => {
        if (!this.ws) return;
        const message = this.buildSubscriptionMessage();
        this.request(message);

        return this.onopenCallback?.call(this.ws, event);
    };

    private handleClose = (event: CloseEvent) => {
        this.cleanup();
        return this.oncloseCallback?.call(this.ws!, event);
    };

    private handleError = (event: Event) => {
        this.cleanup();
        return this.onerrorCallback?.call(this.ws!, event);
    };

    constructor(params: RelayerWebsocketParams) {
        this.config = params.config;
        this.topic = params.topic;
        this.authType = params.authType;
        this.onmessage = params.onmessage;
        this.onopenCallback = params.onopenCallback ?? null;
        this.oncloseCallback = params.oncloseCallback ?? null;
        this.onerrorCallback = params.onerrorCallback ?? null;
    }

    // --------------
    // | Public API |
    // --------------

    public async connect(): Promise<void> {
        if (this.ws) {
            throw new Error("WebSocket connection attempt aborted: already connected.");
        }

        const WebSocket = await import("isows").then((module) => module.WebSocket);
        const url = this.config.getWebsocketBaseUrl();
        this.ws = new WebSocket(url);

        this.ws.addEventListener("open", this.handleOpen);
        this.ws.addEventListener("message", this.onmessage);
        this.ws.addEventListener("close", this.handleClose);
        this.ws.addEventListener("error", this.handleError);

        // Wait for the socket to open.
        if (this.ws?.readyState === WebSocket.CONNECTING) {
            await new Promise((resolve, reject) => {
                if (!this.ws) return;
                this.ws.onopen = (event) => resolve(event);
                this.ws.onerror = (error) =>
                    reject(
                        new WebSocketConnectionError({
                            url,
                            cause: error as unknown as Error,
                        }),
                    );
            });
        }
    }

    public close(): void {
        if (!this.ws) {
            return;
        }

        const message = this.buildUnsubscriptionMessage();
        this.request(message);

        this.ws.close();
    }

    // ---------------
    // | Private API |
    // ---------------

    private request(message: SubscriptionMessage | UnsubscriptionMessage): void {
        if (!this.ws || this.ws.readyState !== this.ws.OPEN) {
            throw new WebSocketRequestError({
                body: message,
                url: this.ws?.url || "",
                cause: new SocketClosedError({ url: this.ws?.url }),
            });
        }

        this.ws?.send(JSON.stringify(message));
    }

    private buildSubscriptionMessage(): SubscriptionMessage {
        const body = {
            method: "subscribe" as const,
            topic: this.topic,
        };

        if (this.authType === AuthType.None) {
            return { body };
        }

        const headers = this.buildAuthHeaders(body);
        return {
            headers,
            body,
        };
    }

    private buildUnsubscriptionMessage(): UnsubscriptionMessage {
        return {
            body: {
                method: "unsubscribe" as const,
                topic: this.topic,
            },
        };
    }

    private buildAuthHeaders(body: SubscriptionBody): Record<string, string> {
        const symmetricKey = this.config.getSymmetricKey(this.authType);

        return addExpiringAuthToHeaders(
            this.config,
            body.topic,
            {}, // Headers
            JSON.stringify(body),
            symmetricKey,
            SIG_EXPIRATION_BUFFER_MS,
        );
    }

    private cleanup(): void {
        // Remove all event listeners before nullifying the reference
        if (this.ws) {
            this.ws.removeEventListener("open", this.handleOpen);
            this.ws.removeEventListener("message", this.onmessage);
            this.ws.removeEventListener("close", this.handleClose);
            this.ws.removeEventListener("error", this.handleError);
        }

        // Nullify the WebSocket instance
        this.ws = null;
    }
}
