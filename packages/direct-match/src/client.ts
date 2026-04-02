import { RelayerHttpClient } from "@renegade-fi/http-client";
import { encodeAbiParameters, type Hex, keccak256, toBytes } from "viem";
import type { PrivateKeyAccount } from "viem/accounts";

import { AccountSecrets } from "./secrets.js";
import type {
    ApiAccount,
    ApiBalance,
    ApiOrder,
    ApiOrderCore,
    ApiPublicIntentPermit,
    CancelOrderRequest,
    CancelOrderResponse,
    CreateAccountRequest,
    CreateOrderInPoolRequest,
    CreateOrderRequest,
    CreateOrderResponse,
    GetAccountResponse,
    GetBalanceByMintResponse,
    GetBalancesResponse,
    GetOrderByIdResponse,
    GetOrdersResponse,
    OrderAuth,
    PlaceOrderParams,
    SignatureWithNonce,
    SyncAccountRequest,
    SyncAccountResponse,
    UpdateOrderParams,
    UpdateOrderResponse,
} from "./types.js";
import { toBase64NoPad } from "./utils.js";

// Chain IDs
const ARBITRUM_ONE_CHAIN_ID = 42161;
const ARBITRUM_SEPOLIA_CHAIN_ID = 421614;
const BASE_MAINNET_CHAIN_ID = 8453;
const BASE_SEPOLIA_CHAIN_ID = 84532;

// Relayer server URLs
const ARBITRUM_SEPOLIA_RELAYER_BASE_URL = "https://arbitrum-sepolia.v2.relayer.renegade.fi";
const ARBITRUM_ONE_RELAYER_BASE_URL = "https://arbitrum-one.v2.relayer.renegade.fi";
const BASE_SEPOLIA_RELAYER_BASE_URL = "https://base-sepolia.v2.relayer.renegade.fi";
const BASE_MAINNET_RELAYER_BASE_URL = "https://base-mainnet.v2.relayer.renegade.fi";

// Executor addresses per chain (from rust-sdk config.rs)
const EXECUTOR_ADDRESSES: Record<number, string> = {
    [ARBITRUM_ONE_CHAIN_ID]: "0x336A6b8AE5589d40ba4391020649E268E8323CA1",
    [ARBITRUM_SEPOLIA_CHAIN_ID]: "0x9094314D60e3eF5fC73df548A3dD7b1Cd9798729",
    [BASE_MAINNET_CHAIN_ID]: "0x1b5A1833d8566FACb138aa6BF1cd040f572B1D56",
    [BASE_SEPOLIA_CHAIN_ID]: "0x5E2ca57B7F09Cf3DAca07c67CC65e1BfbDf346b0",
};

// Cancel domain separator, matching the contract's CANCEL_DOMAIN
const CANCEL_DOMAIN = new TextEncoder().encode("cancel");

// ABI type definition for PublicIntentPermit (reused across sign and cancel)
const PERMIT_ABI = [
    {
        type: "tuple",
        components: [
            {
                type: "tuple",
                name: "intent",
                components: [
                    { type: "address", name: "inToken" },
                    { type: "address", name: "outToken" },
                    { type: "address", name: "owner" },
                    {
                        type: "tuple",
                        name: "minPrice",
                        components: [{ type: "uint256", name: "repr" }],
                    },
                    { type: "uint256", name: "amountIn" },
                ],
            },
            { type: "address", name: "executor" },
        ],
    },
] as const;

/**
 * Client for interacting with the Renegade direct match API.
 */
export class DirectMatchClient {
    readonly account: PrivateKeyAccount;
    readonly secrets: AccountSecrets;
    readonly httpClient: RelayerHttpClient;
    readonly chainId: number;
    readonly executorAddress: string;

    private constructor(
        baseUrl: string,
        account: PrivateKeyAccount,
        secrets: AccountSecrets,
        chainId: number,
    ) {
        this.account = account;
        this.secrets = secrets;
        this.httpClient = new RelayerHttpClient(baseUrl, secrets.authHmacKeyBase64());
        this.chainId = chainId;
        this.executorAddress = EXECUTOR_ADDRESSES[chainId]!;
    }

    // ---------------------
    // | Factory Methods   |
    // ---------------------

    private static async create(
        baseUrl: string,
        account: PrivateKeyAccount,
        chainId: number,
    ): Promise<DirectMatchClient> {
        const secrets = await AccountSecrets.create(account, chainId);
        return new DirectMatchClient(baseUrl, account, secrets, chainId);
    }

    static async newArbitrumSepoliaClient(account: PrivateKeyAccount): Promise<DirectMatchClient> {
        return DirectMatchClient.create(
            ARBITRUM_SEPOLIA_RELAYER_BASE_URL,
            account,
            ARBITRUM_SEPOLIA_CHAIN_ID,
        );
    }

    static async newArbitrumOneClient(account: PrivateKeyAccount): Promise<DirectMatchClient> {
        return DirectMatchClient.create(
            ARBITRUM_ONE_RELAYER_BASE_URL,
            account,
            ARBITRUM_ONE_CHAIN_ID,
        );
    }

    static async newBaseSepoliaClient(account: PrivateKeyAccount): Promise<DirectMatchClient> {
        return DirectMatchClient.create(
            BASE_SEPOLIA_RELAYER_BASE_URL,
            account,
            BASE_SEPOLIA_CHAIN_ID,
        );
    }

    static async newBaseMainnetClient(account: PrivateKeyAccount): Promise<DirectMatchClient> {
        return DirectMatchClient.create(
            BASE_MAINNET_RELAYER_BASE_URL,
            account,
            BASE_MAINNET_CHAIN_ID,
        );
    }

    // ---------------------
    // | Account Actions   |
    // ---------------------

    /**
     * Create a new account on the relayer.
     *
     * Sends the derived account secrets so the relayer can manage
     * the account's orders and balances.
     */
    async createAccount(): Promise<void> {
        const request: CreateAccountRequest = {
            account_id: this.secrets.accountId,
            address: this.account.address,
            master_view_seed: this.secrets.masterViewSeed,
            auth_hmac_key: this.secrets.authHmacKeyBase64(),
            schnorr_public_key: this.secrets.schnorrPublicKey,
        };

        const response = await this.httpClient.post("/v2/account", request);
        if (response.status < 200 || response.status >= 300) {
            throw new Error(
                `createAccount failed (${response.status}): ${JSON.stringify(response.data)}`,
            );
        }
    }

    /**
     * Look up this client's account by its ID.
     *
     * Returns the account's orders and balances.
     * Throws if the account does not exist.
     */
    async getAccount(): Promise<ApiAccount> {
        const path = `/v2/account/${this.secrets.accountId}`;
        const response = await this.httpClient.get<GetAccountResponse>(path);
        if (response.status < 200 || response.status >= 300) {
            throw new Error(
                `getAccount failed (${response.status}): ${JSON.stringify(response.data)}`,
            );
        }
        return response.data.account;
    }

    /**
     * Sync the account with on-chain state.
     *
     * Triggers the relayer to re-scan on-chain balances for this account.
     * Needed for Ring 0 so the matching engine knows EOA token balances.
     */
    async syncAccount(): Promise<void> {
        const request: SyncAccountRequest = {
            account_id: this.secrets.accountId,
            master_view_seed: this.secrets.masterViewSeedHex(),
            auth_hmac_key: this.secrets.authHmacKeyBase64(),
            schnorr_public_key: this.secrets.schnorrPublicKey,
        };

        const path = `/v2/account/${this.secrets.accountId}/sync`;
        const response = await this.httpClient.post<SyncAccountResponse>(path, request);
        if (response.status < 200 || response.status >= 300) {
            throw new Error(
                `syncAccount failed (${response.status}): ${JSON.stringify(response.data)}`,
            );
        }
    }

    // -----------------------
    // | Balance Actions     |
    // -----------------------

    /**
     * Fetch all balances in the account.
     */
    async getBalances(): Promise<ApiBalance[]> {
        const path = `/v2/account/${this.secrets.accountId}/balances`;
        const response = await this.httpClient.get<GetBalancesResponse>(path);
        if (response.status < 200 || response.status >= 300) {
            throw new Error(
                `getBalances failed (${response.status}): ${JSON.stringify(response.data)}`,
            );
        }
        return response.data.balances;
    }

    /**
     * Fetch a single balance by token mint address.
     */
    async getBalanceByMint(mint: string): Promise<ApiBalance> {
        const path = `/v2/account/${this.secrets.accountId}/balances/${mint}`;
        const response = await this.httpClient.get<GetBalanceByMintResponse>(path);
        if (response.status < 200 || response.status >= 300) {
            throw new Error(
                `getBalanceByMint failed (${response.status}): ${JSON.stringify(response.data)}`,
            );
        }
        return response.data.balance;
    }

    // ---------------------
    // | Order Actions     |
    // ---------------------

    /**
     * Place a Ring 0 (public) order.
     *
     * Builds the order, signs a PublicIntentPermit, and POSTs to the relayer.
     */
    async placeOrder(params: PlaceOrderParams): Promise<void> {
        const order = this.buildOrderCore(params);
        const auth = await this.buildPublicOrderAuth(order);

        const request: CreateOrderRequest = {
            order,
            auth,
            precompute_cancellation_proof: false,
        };

        const path = `/v2/account/${this.secrets.accountId}/orders`;
        const response = await this.httpClient.post<CreateOrderResponse>(path, request);
        if (response.status < 200 || response.status >= 300) {
            throw new Error(
                `placeOrder failed (${response.status}): ${JSON.stringify(response.data)}`,
            );
        }
    }

    /**
     * Place a Ring 0 (public) order in a specific matching pool.
     *
     * Uses the admin endpoint, which requires an admin HMAC key.
     */
    async placeOrderInPool(
        params: PlaceOrderParams,
        matchingPool: string,
        adminKey: string,
    ): Promise<void> {
        const order = this.buildOrderCore(params);
        const auth = await this.buildPublicOrderAuth(order);

        const request: CreateOrderInPoolRequest = {
            order,
            auth,
            matching_pool: matchingPool,
        };

        const adminClient = new RelayerHttpClient(this.httpClient.getBaseUrl(), adminKey);
        const path = `/v2/relayer-admin/account/${this.secrets.accountId}/orders/create-order-in-pool`;
        const response = await adminClient.post<CreateOrderResponse>(path, request);
        if (response.status < 200 || response.status >= 300) {
            throw new Error(
                `placeOrderInPool failed (${response.status}): ${JSON.stringify(response.data)}`,
            );
        }
    }

    /**
     * Fetch all orders in the account with pagination.
     */
    async getOrders(includeHistoric: boolean): Promise<ApiOrder[]> {
        const allOrders: ApiOrder[] = [];
        let pageToken: number | undefined;

        do {
            let query = `include_historic_orders=${includeHistoric}`;
            if (pageToken !== undefined) {
                query += `&page_token=${pageToken}`;
            }
            const path = `/v2/account/${this.secrets.accountId}/orders?${query}`;
            const response = await this.httpClient.get<GetOrdersResponse>(path);
            if (response.status < 200 || response.status >= 300) {
                throw new Error(
                    `getOrders failed (${response.status}): ${JSON.stringify(response.data)}`,
                );
            }
            allOrders.push(...response.data.orders);
            pageToken = response.data.next_page_token;
        } while (pageToken !== undefined);

        return allOrders;
    }

    /**
     * Fetch a single order by ID.
     */
    async getOrder(orderId: string): Promise<ApiOrder> {
        const { order } = await this.getOrderWithAuth(orderId);
        return order;
    }

    /**
     * Update an existing order's min_fill_size or allow_external_matches.
     *
     * Fetches the current order, applies the updates, and POSTs the modified order.
     */
    async updateOrder(params: UpdateOrderParams): Promise<ApiOrder> {
        const { order: current } = await this.getOrderWithAuth(params.orderId);
        const updated = { ...current.order };

        if (params.minFillSize !== undefined) {
            updated.min_fill_size = params.minFillSize.toString();
        }
        if (params.allowExternalMatches !== undefined) {
            updated.allow_external_matches = params.allowExternalMatches;
        }

        const path = `/v2/account/${this.secrets.accountId}/orders/${params.orderId}/update`;
        const response = await this.httpClient.post<UpdateOrderResponse>(path, { order: updated });
        if (response.status < 200 || response.status >= 300) {
            throw new Error(
                `updateOrder failed (${response.status}): ${JSON.stringify(response.data)}`,
            );
        }
        return response.data.order;
    }

    /**
     * Cancel a Ring 0 (public) order by ID.
     *
     * Fetches the order's auth, computes the cancel nullifier, signs it,
     * and POSTs the cancellation request.
     */
    async cancelOrder(orderId: string): Promise<void> {
        // Fetch order with its auth (needed to compute nullifier)
        const { auth } = await this.getOrderWithAuth(orderId);
        if (!auth.public_order) {
            throw new Error(`cancelOrder: order ${orderId} is not a Ring 0 (public) order`);
        }
        const { permit, intent_signature } = auth.public_order;

        // ABI-encode the permit and compute its hash
        const abiEncoded = encodePermit(permit);
        const intentHash = toBytes(keccak256(abiEncoded));

        // Compute nullifier: keccak256(intentHash || originalNonce_be_32)
        const originalNonceBytes = bigIntToBytes32(BigInt(intent_signature.nonce));
        const nullifierInput = new Uint8Array(32 + 32);
        nullifierInput.set(intentHash, 0);
        nullifierInput.set(originalNonceBytes, 32);
        const nullifier = toBytes(keccak256(nullifierInput));

        // Build cancel payload: "cancel" || nullifier
        const cancelPayload = new Uint8Array(CANCEL_DOMAIN.length + 32);
        cancelPayload.set(CANCEL_DOMAIN, 0);
        cancelPayload.set(nullifier, CANCEL_DOMAIN.length);

        // Sign the cancel payload
        const cancelSignature = await this.signWithNonce(cancelPayload);

        const request: CancelOrderRequest = { cancel_signature: cancelSignature };
        const path = `/v2/account/${this.secrets.accountId}/orders/${orderId}/cancel`;
        const response = await this.httpClient.post<CancelOrderResponse>(path, request);
        if (response.status < 200 || response.status >= 300) {
            throw new Error(
                `cancelOrder failed (${response.status}): ${JSON.stringify(response.data)}`,
            );
        }
    }

    // ---------------------
    // | Private Helpers   |
    // ---------------------

    /** Fetch an order with its auth from the relayer */
    private async getOrderWithAuth(orderId: string): Promise<GetOrderByIdResponse> {
        const path = `/v2/account/${this.secrets.accountId}/orders/${orderId}`;
        const response = await this.httpClient.get<GetOrderByIdResponse>(path);
        if (response.status < 200 || response.status >= 300) {
            throw new Error(
                `getOrder failed (${response.status}): ${JSON.stringify(response.data)}`,
            );
        }
        return response.data;
    }

    private buildOrderCore(params: PlaceOrderParams): ApiOrderCore {
        const minPrice = params.minOutputAmount
            ? ceilDiv(params.minOutputAmount, params.inputAmount).toString()
            : "0";

        return {
            id: crypto.randomUUID(),
            intent: {
                in_token: params.inputMint,
                out_token: params.outputMint,
                owner: this.account.address,
                min_price: minPrice,
                amount_in: params.inputAmount.toString(),
            },
            min_fill_size: (params.minFillSize ?? 0n).toString(),
            order_type: "public_order",
            allow_external_matches: params.allowExternalMatches ?? true,
        };
    }

    /** Build OrderAuth for a Ring 0 (public) order */
    private async buildPublicOrderAuth(order: ApiOrderCore): Promise<OrderAuth> {
        const permit: ApiPublicIntentPermit = {
            intent: order.intent,
            executor: this.executorAddress,
        };

        const abiEncoded = encodePermit(permit);
        const intentSignature = await this.signWithNonce(toBytes(abiEncoded));

        return {
            public_order: {
                permit,
                intent_signature: intentSignature,
            },
        };
    }

    /**
     * Sign a payload using the Renegade SignatureWithNonce scheme.
     *
     * Computes: sign(keccak256(keccak256(payload) || nonce || chainId))
     */
    private async signWithNonce(payload: Uint8Array): Promise<SignatureWithNonce> {
        const payloadDigest = toBytes(keccak256(payload));

        const nonceBytes = crypto.getRandomValues(new Uint8Array(32));
        const nonceBigInt = bytesToBigInt(nonceBytes);

        const chainIdBytes = bigIntToBytes32(BigInt(this.chainId));

        const message = new Uint8Array(32 + 32 + 32);
        message.set(payloadDigest, 0);
        message.set(nonceBytes, 32);
        message.set(chainIdBytes, 64);
        const finalDigest = keccak256(message);

        const sig: Hex = await this.account.sign({ hash: finalDigest });
        const sigBytes = toBytes(sig);

        return {
            nonce: nonceBigInt.toString(),
            signature: toBase64NoPad(sigBytes),
        };
    }
}

// -----------
// | Helpers |
// -----------

/** ABI-encode a PublicIntentPermit struct */
function encodePermit(permit: ApiPublicIntentPermit): Hex {
    return encodeAbiParameters(PERMIT_ABI, [
        {
            intent: {
                inToken: permit.intent.in_token as Hex,
                outToken: permit.intent.out_token as Hex,
                owner: permit.intent.owner as Hex,
                minPrice: { repr: BigInt(permit.intent.min_price) },
                amountIn: BigInt(permit.intent.amount_in),
            },
            executor: permit.executor as Hex,
        },
    ]);
}

/** Ceiling division for bigints */
function ceilDiv(a: bigint, b: bigint): bigint {
    return (a + b - 1n) / b;
}

/** Convert big-endian bytes to bigint */
function bytesToBigInt(bytes: Uint8Array): bigint {
    let value = 0n;
    for (const byte of bytes) {
        value = (value << 8n) | BigInt(byte);
    }
    return value;
}

/** Convert bigint to big-endian 32 bytes */
function bigIntToBytes32(n: bigint): Uint8Array {
    const bytes = new Uint8Array(32);
    let v = n;
    for (let i = 31; i >= 0; i--) {
        bytes[i] = Number(v & 0xffn);
        v >>= 8n;
    }
    return bytes;
}
