// API response types for the Renegade direct match API
// Only ring0-relevant fields are fully typed; rings 1-3 fields are noted as TODOs

/** Request body for POST /v2/account */
export interface CreateAccountRequest {
    account_id: string;
    address: string;
    master_view_seed: string;
    auth_hmac_key: string;
    schnorr_public_key: string;
}

/** Request body for POST /v2/account/:account_id/orders */
export interface CreateOrderRequest {
    order: ApiOrderCore;
    auth: OrderAuth;
    precompute_cancellation_proof: boolean;
}

/** Request body for POST /v2/relayer-admin/account/:account_id/orders/create-order-in-pool */
export interface CreateOrderInPoolRequest {
    order: ApiOrderCore;
    auth: OrderAuth;
    matching_pool: string;
}

/** Response for POST /v2/account/:account_id/orders */
export interface CreateOrderResponse {
    task_id: string;
    completed: boolean;
}

/** Order authorization — Ring 0 only, other rings are TODO */
export interface OrderAuth {
    public_order: {
        permit: ApiPublicIntentPermit;
        intent_signature: SignatureWithNonce;
    };
    // TODO: natively_settled_private_order — ring 1
    // TODO: renegade_settled_order — rings 2-3
}

/** A public intent permit for a Ring 0 order */
export interface ApiPublicIntentPermit {
    intent: ApiIntent;
    executor: string;
}

/** An ECDSA signature with a nonce for replay protection */
export interface SignatureWithNonce {
    nonce: string; // U256 as decimal string
    signature: string; // base64-encoded 65 bytes (r || s || v)
}

/** Parameters for placing a Ring 0 (public) order */
export interface PlaceOrderParams {
    inputMint: string;
    outputMint: string;
    inputAmount: bigint;
    minOutputAmount?: bigint;
    minFillSize?: bigint;
    allowExternalMatches?: boolean;
}

/** Response for GET /v2/account/:account_id/orders */
export interface GetOrdersResponse {
    orders: ApiOrder[];
    next_page_token?: number;
}

/** Response for GET /v2/account/:account_id/orders/:order_id */
export interface GetOrderByIdResponse {
    order: ApiOrder;
    auth: OrderAuth;
}

/** Request body for POST /v2/account/:account_id/orders/:order_id/update */
export interface UpdateOrderRequest {
    order: ApiOrderCore;
}

/** Response for POST /v2/account/:account_id/orders/:order_id/update */
export interface UpdateOrderResponse {
    order: ApiOrder;
}

/** Parameters for updating an existing order */
export interface UpdateOrderParams {
    orderId: string;
    minFillSize?: bigint;
    allowExternalMatches?: boolean;
}

/** Request body for POST /v2/account/:account_id/orders/:order_id/cancel */
export interface CancelOrderRequest {
    cancel_signature: SignatureWithNonce;
}

/** Response for POST /v2/account/:account_id/orders/:order_id/cancel */
export interface CancelOrderResponse {
    task_id: string;
    completed: boolean;
}

/** The response wrapper for GET /v2/account/:account_id */
export interface GetAccountResponse {
    account: ApiAccount;
}

/** An account managed by the relayer */
export interface ApiAccount {
    id: string;
    orders: ApiOrder[];
    balances: ApiBalance[];
}

/** A full order with metadata */
export interface ApiOrder {
    id: string;
    order: ApiOrderCore;
    state: OrderState;
    fills: ApiPartialOrderFill[];
    created: number;
    // TODO: recovery_stream — rings 1-3 (PoseidonCSPRNG state)
    // TODO: share_stream — rings 1-3 (PoseidonCSPRNG state)
    // TODO: public_shares — rings 1-3 (order secret shares)
    [key: string]: unknown;
}

/** Core order data */
export interface ApiOrderCore {
    id: string;
    intent: ApiIntent;
    min_fill_size: string;
    order_type: OrderType;
    allow_external_matches: boolean;
}

/** The intent of an order */
export interface ApiIntent {
    in_token: string;
    out_token: string;
    owner: string;
    min_price: string;
    amount_in: string;
}

/** Order type corresponding to privacy rings */
export type OrderType =
    | "public_order" // ring 0
    | "natively_settled_private_order" // ring 1
    | "renegade_settled_public_fill_order" // ring 2
    | "renegade_settled_private_fill_order"; // ring 3

/** The state of an order */
export type OrderState = "created" | "matching" | "settling_match" | "filled" | "cancelled";

/** A partial fill of an order */
export interface ApiPartialOrderFill {
    amount: string;
    price: { price: string; timestamp: number };
    fees: { relayer_fee: string; protocol_fee: string };
    tx_hash: string;
}

// --- Balance types ---

/** Response for GET /v2/account/:account_id/balances */
export interface GetBalancesResponse {
    balances: ApiBalance[];
}

/** Response for GET /v2/account/:account_id/balances/:mint */
export interface GetBalanceByMintResponse {
    balance: ApiBalance;
}

// --- Sync types ---

/** Request body for POST /v2/account/:account_id/sync */
export interface SyncAccountRequest {
    account_id: string;
    master_view_seed: string;
    auth_hmac_key: string;
    schnorr_public_key: string;
}

/** Response for POST /v2/account/:account_id/sync */
export interface SyncAccountResponse {
    task_id: string;
    completed: boolean;
}

/** A balance in an account */
export interface ApiBalance {
    mint: string;
    owner: string;
    amount: string;
    relayer_fee_balance: string;
    protocol_fee_balance: string;
    relayer_fee_recipient: string;
    // TODO: authority — rings 1-3 (Schnorr public key)
    // TODO: recovery_stream — rings 1-3 (PoseidonCSPRNG state)
    // TODO: share_stream — rings 1-3 (PoseidonCSPRNG state)
    // TODO: public_shares — rings 1-3 (balance secret shares)
    [key: string]: unknown;
}
