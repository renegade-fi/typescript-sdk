import type { Address } from "viem";
export declare const RENEGADE_AUTH_HEADER_NAME = "renegade-auth";
export declare const RENEGADE_SIG_EXPIRATION_HEADER_NAME = "renegade-auth-expiration";
export declare const CREATE_WALLET_ROUTE = "/wallet";
export declare const FIND_WALLET_ROUTE = "/wallet/lookup";
export declare const GET_WALLET_ROUTE: (wallet_id: string) => string;
export declare const BACK_OF_QUEUE_WALLET_ROUTE: (wallet_id: string) => string;
export declare const WALLET_ORDERS_ROUTE: (wallet_id: string) => string;
export declare const GET_ORDER_BY_ID_ROUTE: (wallet_id: string, order_id: string) => string;
export declare const UPDATE_ORDER_ROUTE: (wallet_id: string, order_id: string) => string;
export declare const CANCEL_ORDER_ROUTE: (wallet_id: string, order_id: string) => string;
export declare const GET_BALANCES_ROUTE: (wallet_id: string) => string;
export declare const GET_BALANCE_BY_MINT_ROUTE: (wallet_id: string, mint: string) => string;
export declare const DEPOSIT_BALANCE_ROUTE: (wallet_id: string) => string;
export declare const WITHDRAW_BALANCE_ROUTE: (wallet_id: string, mint: string) => string;
export declare const PAY_FEES_ROUTE: (wallet_id: string) => string;
export declare const ORDER_HISTORY_ROUTE: (wallet_id: string) => string;
export declare const GET_NETWORK_TOPOLOGY_ROUTE = "/network";
export declare const GET_CLUSTER_INFO_ROUTE: (cluster_id: string) => string;
export declare const GET_PEER_INFO_ROUTE: (peer_id: string) => string;
export declare const GET_NETWORK_ORDERS_ROUTE = "/order_book/orders";
export declare const GET_NETWORK_ORDER_BY_ID_ROUTE: (order_id: string) => string;
export declare const PRICE_REPORT_ROUTE = "/price_report";
export declare const GET_TASK_STATUS_ROUTE: (task_id: string) => string;
export declare const GET_TASK_QUEUE_ROUTE: (wallet_id: string) => string;
export declare const HANDSHAKE_ROUTE = "/v0/handshake";
export declare const WALLET_ROUTE: (wallet_id: string) => string;
export declare const WS_PRICE_REPORT_ROUTE: (source: string, base: string, quote: string) => string;
export declare const ORDER_BOOK_ROUTE = "/v0/order_book";
export declare const NETWORK_INFO_ROUTE = "/v0/network";
export declare const TASK_STATUS_ROUTE: (task_id: string) => string;
export declare const WS_WALLET_ORDERS_ROUTE: (wallet_id: string) => string;
export declare const PRICE_REPORTER_TOPIC: (exchange: string, base: Address, quote: Address) => string;
export declare const devnetTokenMapping: {
    tokens: {
        name: string;
        ticker: string;
        address: string;
        decimals: number;
    }[];
};
export declare const testnetTokenMapping: {
    tokens: {
        name: string;
        ticker: string;
        address: string;
        decimals: number;
    }[];
};
export declare const tokenMapping: {
    tokens: {
        name: string;
        ticker: string;
        address: string;
        decimals: number;
    }[];
};
//# sourceMappingURL=constants.d.ts.map