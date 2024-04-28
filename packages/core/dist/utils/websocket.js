export class WebSocketManager {
    constructor(url) {
        Object.defineProperty(this, "url", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "ws", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "subscriptions", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "maxRetries", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "retryCount", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "retryDelay", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "isConnected", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.url = url;
        this.ws = null;
        this.subscriptions = new Map();
        this.maxRetries = 5;
        this.retryCount = 0;
        this.retryDelay = 2000; // Initial retry delay in milliseconds
        this.isConnected = false;
        if (typeof window !== "undefined") {
            window.addEventListener("focus", this.handleWindowFocus.bind(this));
        }
    }
    connect() {
        if (this.isConnected || this.ws) {
            console.warn("WebSocket connection attempt aborted: already connected.");
            return;
        }
        this.ws = new WebSocket(this.url);
        this.ws.addEventListener("open", () => {
            console.log("[Price Reporter] WebSocket connected.");
            this.isConnected = true;
            this.retryCount = 0;
            this.resubscribeAll();
        });
        this.ws.addEventListener("message", event => {
            try {
                const data = JSON.parse(event.data);
                if (this.subscriptions.has(data.topic)) {
                    const callback = this.subscriptions.get(data.topic);
                    if (callback) {
                        callback(data.price);
                    }
                }
            }
            catch (error) {
                console.error("Error parsing WebSocket message:", error);
            }
        });
        this.ws.addEventListener("error", error => {
            console.error("WebSocket error:", error);
        });
        this.ws.addEventListener("close", () => {
            console.log("[Price Reporter] WebSocket closed. Attempting to reconnect...");
            this.isConnected = false;
            this.ws = null;
            this.reconnect();
        });
    }
    reconnect() {
        if (this.retryCount >= this.maxRetries) {
            console.error("[Price Reporter] Maximum reconnect attempts reached.");
            return;
        }
        const backoffDelay = this.retryDelay * Math.pow(2, this.retryCount);
        const jitter = Math.random() * backoffDelay * 0.3; // Jitter up to 30% of the backoff delay
        const delayWithJitter = backoffDelay + jitter;
        setTimeout(() => {
            console.log(`[Price Reporter] Reconnecting attempt ${this.retryCount + 1}`);
            this.retryCount++;
            this.connect();
        }, delayWithJitter);
    }
    handleWindowFocus() {
        if (!this.isConnected) {
            console.log("[Price Reporter] Window refocused. Attempting to reconnect...");
            this.retryCount = 0;
            this.reconnect();
        }
    }
    subscribe(topic, callback) {
        if (!this.subscriptions.has(topic)) {
            this.subscriptions.set(topic, callback);
            if (this.isConnected && this.ws) {
                this.ws.send(JSON.stringify({ method: "subscribe", topic }));
            }
        }
    }
    resubscribeAll() {
        this.subscriptions.forEach((_, topic) => {
            if (this.isConnected && this.ws) {
                this.ws.send(JSON.stringify({ method: "subscribe", topic }));
            }
        });
    }
    close() {
        if (this.ws) {
            this.ws.close();
            this.isConnected = false;
            this.ws = null;
        }
    }
}
//# sourceMappingURL=websocket.js.map