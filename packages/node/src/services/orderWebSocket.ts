import {
    AuthType,
    getWalletId,
    type OrderMetadata,
    RelayerWebsocket,
    type RenegadeConfig,
    WS_WALLET_ORDERS_ROUTE,
} from "@renegade-fi/core";

interface OrderWebSocketOptions {
    config: RenegadeConfig;
    onUpdate: (order: OrderMetadata) => void;
}

export function createOrderWebSocket(options: OrderWebSocketOptions) {
    return new OrderWebSocketImpl(options);
}

class OrderWebSocketImpl {
    config: RenegadeConfig;
    ws: RelayerWebsocket | null = null;
    callback: (order: OrderMetadata) => void;
    walletId: string;

    constructor(options: OrderWebSocketOptions) {
        this.config = options.config;
        this.callback = options.onUpdate;
        this.walletId = getWalletId(this.config);
    }

    connect() {
        if (this.ws) return;

        this.ws = new RelayerWebsocket({
            config: this.config,
            topic: WS_WALLET_ORDERS_ROUTE(this.walletId),
            authType: AuthType.Wallet,
            onmessage: (event) => this.handleMessage(event),
            oncloseCallback: () => this.handleClose(),
            onerrorCallback: () => this.handleError(),
        });

        this.ws.connect();
    }

    disconnect() {
        this.ws?.close();
        this.ws = null;
    }

    handleMessage(event: MessageEvent) {
        try {
            const message = JSON.parse(event.data, (key, value) => {
                if (typeof value === "number" && key !== "price") {
                    return BigInt(value);
                }
                return value;
            });

            if (
                message.topic === WS_WALLET_ORDERS_ROUTE(this.walletId) &&
                message.event?.type === "OrderMetadataUpdated" &&
                message.event?.order
            ) {
                this.callback(message.event.order);
            }
        } catch (error) {
            const logger = this.config.getLogger("node:services:orderWebSocket");
            const msg = error instanceof Error ? error.message : String(error);
            logger.error(`Error processing WebSocket message: ${msg}`, {
                walletId: this.walletId,
            });
        }
    }

    handleClose() {
        const logger = this.config.getLogger("node:services:orderWebSocket");
        logger.debug("WebSocket connection closed", { walletId: this.walletId });
        this.ws = null;
    }

    handleError() {
        const logger = this.config.getLogger("node:services:orderWebSocket");
        logger.error("WebSocket connection error", { walletId: this.walletId });
        this.ws = null;
    }
}
