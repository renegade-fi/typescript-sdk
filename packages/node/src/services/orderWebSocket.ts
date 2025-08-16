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
            console.error("Error processing WebSocket message:", error);
        }
    }

    handleClose() {
        console.log("WebSocket connection closed");
        this.ws = null;
    }

    handleError() {
        console.error("WebSocket connection error");
        this.ws = null;
    }
}
