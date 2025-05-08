/// Header name for the HTTP auth signature
export const RENEGADE_AUTH_HEADER_NAME = "x-renegade-auth";
/// Header name for the expiration timestamp of a signature
export const RENEGADE_SIG_EXPIRATION_HEADER_NAME = "x-renegade-auth-expiration";
/// Header name for the Renegade SDK version
export const RENEGADE_SDK_VERSION_HEADER = "x-renegade-sdk-version";
/// The Renegade API key header
export const RENEGADE_API_KEY_HEADER = "x-renegade-api-key";
/// The message used to derive the wallet's root key
export const ROOT_KEY_MESSAGE_PREFIX = "Unlock your Renegade Wallet on chain ID:";
/// The amount of buffer time to add to the signature expiration
export const SIG_EXPIRATION_BUFFER_MS = 10_000; // 10 seconds

////////////////////////////////////////////////////////////////////////////////
// Chain IDs
////////////////////////////////////////////////////////////////////////////////

export const CHAIN_IDS = {
    ArbitrumOne: 42161,
    ArbitrumSepolia: 421614,
} as const;

export type ChainId = (typeof CHAIN_IDS)[keyof typeof CHAIN_IDS];

////////////////////////////////////////////////////////////////////////////////
// Environment-Specific Constants
////////////////////////////////////////////////////////////////////////////////

export const PRICE_REPORTER_URL_MAINNET = "mainnet.price-reporter.renegade.fi";
export const PRICE_REPORTER_URL_TESTNET = "testnet.price-reporter.renegade.fi";

export const HSE_URL_MAINNET = "https://mainnet.historical-state.renegade.fi:3000";
export const HSE_URL_TESTNET = "https://testnet.historical-state.renegade.fi:3000";

////////////////////////////////////////////////////////////////////////////////
// Chain-Specific Constants
////////////////////////////////////////////////////////////////////////////////

export const RELAYER_URL_ARBITRUM_ONE = "arbitrum-one.relayer.renegade.fi";
export const RELAYER_URL_ARBITRUM_SEPOLIA = "arbitrum-sepolia.relayer.renegade.fi";

export const AUTH_SERVER_URL_ARBITRUM_ONE = "https://arbitrum-one.auth-server.renegade.fi:3000";
export const AUTH_SERVER_URL_ARBITRUM_SEPOLIA =
    "https://arbitrum-sepolia.auth-server.renegade.fi:3000";

////////////////////////////////////////////////////////////////////////////////
// Deployed Contracts
////////////////////////////////////////////////////////////////////////////////

export const DARKPOOL_ADDRESS_ARBITRUM_ONE = "0x30bD8eAb29181F790D7e495786d4B96d7AfDC518";
export const DARKPOOL_ADDRESS_ARBITRUM_SEPOLIA = "0x9af58f1ff20ab22e819e40b57ffd784d115a9ef5";

export const PERMIT2_ADDRESS_ARBITRUM_ONE = "0x000000000022D473030F116dDEE9F6B43aC78BA3";
export const PERMIT2_ADDRESS_ARBITRUM_SEPOLIA = "0x9458198bcc289c42e460cb8ca143e5854f734442";

////////////////////////////////////////////////////////////////////////////////
// System-Wide Constants
////////////////////////////////////////////////////////////////////////////////

// The system-wide value of MAX_BALANCES; the number of allowable balances a wallet holds
export const MAX_BALANCES = 10;

/// The system-wide value of MAX_ORDERS; the number of allowable orders a wallet holds
export const MAX_ORDERS = 4;

////////////////////////////////////////////////////////////////////////////////
// Wallet
////////////////////////////////////////////////////////////////////////////////

// Create a new wallet
export const CREATE_WALLET_ROUTE = "/wallet";
// Find a wallet in contract storage
export const FIND_WALLET_ROUTE = "/wallet/lookup";
// Refresh a wallet from on-chain state
export const REFRESH_WALLET_ROUTE = (wallet_id: string) => `/wallet/${wallet_id}/refresh`;
// Returns the wallet information for the given id
export const GET_WALLET_ROUTE = (wallet_id: string) => `/wallet/${wallet_id}`;
/// Get the wallet at the "back of the queue", i.e. the speculatively updated
/// wallet as if all enqueued wallet tasks had completed
export const BACK_OF_QUEUE_WALLET_ROUTE = (wallet_id: string) =>
    `/wallet/${wallet_id}/back-of-queue`;
// Route to the orders of a given wallet
export const WALLET_ORDERS_ROUTE = (wallet_id: string) => `/wallet/${wallet_id}/orders`;
// Returns a single order by the given identifier
export const GET_ORDER_BY_ID_ROUTE = (wallet_id: string, order_id: string) =>
    `/wallet/${wallet_id}/orders/${order_id}`;
// Updates a given order
export const UPDATE_ORDER_ROUTE = (wallet_id: string, order_id: string) =>
    `/wallet/${wallet_id}/orders/${order_id}/update`;
// Cancels a given order
export const CANCEL_ORDER_ROUTE = (wallet_id: string, order_id: string) =>
    `/wallet/${wallet_id}/orders/${order_id}/cancel`;
// Returns the balances within a given wallet
export const GET_BALANCES_ROUTE = (wallet_id: string) => `/wallet/${wallet_id}/balances`;
// Returns the balance associated with the given mint
export const GET_BALANCE_BY_MINT_ROUTE = (wallet_id: string, mint: string) =>
    `/wallet/${wallet_id}/balances/${mint}`;
// Deposits an ERC-20 token into the darkpool
export const DEPOSIT_BALANCE_ROUTE = (wallet_id: string) => `/wallet/${wallet_id}/balances/deposit`;
// Withdraws an ERC-20 token from the darkpool
export const WITHDRAW_BALANCE_ROUTE = (wallet_id: string, mint: string) =>
    `/wallet/${wallet_id}/balances/${mint}/withdraw`;
// Pays all wallet fees
export const PAY_FEES_ROUTE = (wallet_id: string) => `/wallet/${wallet_id}/pay-fees`;
// Returns the order history of a wallet
export const ORDER_HISTORY_ROUTE = (wallet_id: string) => `/wallet/${wallet_id}/order-history`;
/// The name of the query parameter specifying the length of the order history
/// to return
export const ORDER_HISTORY_LEN_PARAM = "order_history_len";

////////////////////////////////////////////////////////////////////////////////
// Network
////////////////////////////////////////////////////////////////////////////////

// Returns the full network topology known to the local node
export const GET_NETWORK_TOPOLOGY_ROUTE = "/network";
// Returns the cluster information for the specified cluster
export const GET_CLUSTER_INFO_ROUTE = (cluster_id: string) => `/network/clusters/${cluster_id}`;
// Returns the peer info for a given peer
export const GET_PEER_INFO_ROUTE = (peer_id: string) => `/network/peers/${peer_id}`;

////////////////////////////////////////////////////////////////////////////////
// Order Book
////////////////////////////////////////////////////////////////////////////////

// Returns all known network orders
export const GET_NETWORK_ORDERS_ROUTE = "/order_book/orders";
// Returns the network order information of the specified order
export const GET_NETWORK_ORDER_BY_ID_ROUTE = (order_id: string) => `/order_book/orders/${order_id}`;

////////////////////////////////////////////////////////////////////////////////
// Price Report
////////////////////////////////////////////////////////////////////////////////

// Price report route
export const PRICE_REPORT_ROUTE = "/price_report";

////////////////////////////////////////////////////////////////////////////////
// Task
////////////////////////////////////////////////////////////////////////////////

// Get the status of a task
export const GET_TASK_STATUS_ROUTE = (task_id: string) => `/tasks/${task_id}`;
// Get the task queue of a given wallet
export const GET_TASK_QUEUE_ROUTE = (wallet_id: string) => `/task_queue/${wallet_id}`;
// Get whether the task queue of a given wallet is paused
export const GET_TASK_QUEUE_PAUSED_ROUTE = (wallet_id: string) =>
    `/task_queue/${wallet_id}/is_paused`;
/// The route to fetch task history for a wallet
export const TASK_HISTORY_ROUTE = (wallet_id: string) => `/wallet/${wallet_id}/task-history`;
/// The name of the query parameter specifying the length of the task history
/// to return
export const TASK_HISTORY_LEN_PARAM = "task_history_len";

////////////////////////////////////////////////////////////////////////////////
// Health check
////////////////////////////////////////////////////////////////////////////////

/// Health check
export const PING_ROUTE = "/ping";

////////////////////////////////////////////////////////////////////////////////
// Websockets
////////////////////////////////////////////////////////////////////////////////

// Initiates a handshake with the server
export const HANDSHAKE_ROUTE = "/v0/handshake";
// Retrieves wallet information by wallet ID
export const WALLET_ROUTE = (wallet_id: string) => `/v0/wallet/${wallet_id}`;
// Fetches price reports based on source, base, and quote currencies
export const WS_PRICE_REPORT_ROUTE = (source: string, base: string, quote: string) =>
    `/v0/price_report/${source}/${base}/${quote}`;
// Streams order book events
export const ORDER_BOOK_ROUTE = "/v0/order_book";
/// The network topic, streams events about network peers
export const NETWORK_INFO_ROUTE = "/v0/network";
/// The task status topic, streams information about task statuses
export const TASK_STATUS_ROUTE = (task_id: string) => `/v0/tasks/${task_id}`;
/// The task history topic, streams information about historical tasks
export const WS_TASK_HISTORY_ROUTE = (wallet_id: string) => `/v0/wallet/${wallet_id}/task-history`;
/// The wallet order status topic, streams events about wallet's orders
export const WS_WALLET_ORDERS_ROUTE = (wallet_id: string) => `/v0/wallet/${wallet_id}/order-status`;

////////////////////////////////////////////////////////////////////////////////
// Admin
////////////////////////////////////////////////////////////////////////////////

// Fetches all open orders
export const ADMIN_OPEN_ORDERS_ROUTE = "/admin/open-orders";
// Get the order metadata for a given order
export const ADMIN_ORDER_METADATA_ROUTE = (order_id: string) =>
    `/admin/orders/${order_id}/metadata`;
// Creates a matching pool
export const ADMIN_MATCHING_POOL_CREATE_ROUTE = (matching_pool: string) =>
    `/admin/matching_pools/${matching_pool}`;
// Destroys a matching pool
export const ADMIN_MATCHING_POOL_DESTROY_ROUTE = (matching_pool: string) =>
    `/admin/matching_pools/${matching_pool}/destroy`;
// Creates an order in the given matching pool
export const ADMIN_CREATE_ORDER_IN_MATCHING_POOL_ROUTE = (wallet_id: string) =>
    `/admin/wallet/${wallet_id}/order-in-pool`;
// Route to assign an order to a matching pool
export const ADMIN_ASSIGN_ORDER_ROUTE = (order_id: string, matching_pool: string) =>
    `/admin/orders/${order_id}/assign-pool/${matching_pool}`;
// Route to get the matching pool for an order
export const ADMIN_GET_ORDER_MATCHING_POOL_ROUTE = (order_id: string) =>
    `/admin/orders/${order_id}/matching-pool`;
// Route to get all the matchable order IDs for a given wallet
export const ADMIN_WALLET_MATCHABLE_ORDER_IDS_ROUTE = (wallet_id: string) =>
    `/admin/wallet/${wallet_id}/matchable-order-ids`;
// Route to trigger a snapshot of the relayer
export const ADMIN_TRIGGER_SNAPSHOT_ROUTE = "/admin/trigger-snapshot";

// The admin wallet updates topic, streams opaque event indicating
// updates for all wallets
export const WS_ADMIN_WALLET_UPDATES_ROUTE = "/v0/admin/wallet-updates";

////////////////////////////////////////////////////////////////////////////////
// External Match
////////////////////////////////////////////////////////////////////////////////
/// The route for requesting an external match
export const REQUEST_EXTERNAL_MATCH_ROUTE = "/matching-engine/request-external-match";

/// The route for requesting an external match quote
export const REQUEST_EXTERNAL_MATCH_QUOTE_ROUTE = "/matching-engine/quote";

/// The route for assembling an external match
export const ASSEMBLE_EXTERNAL_MATCH_ROUTE = "/matching-engine/assemble-external-match";
/**
 * The route used to assemble an external match into a malleable bundle
 */
export const ASSEMBLE_MALLEABLE_EXTERNAL_MATCH_ROUTE =
    "/matching-engine/assemble-malleable-external-match";

/// The query parameter for disabling gas sponsorship
export const DISABLE_GAS_SPONSORSHIP_PARAM = "disable_gas_sponsorship";
/// The query parameter for the gas sponsorship refund address
export const REFUND_ADDRESS_PARAM = "refund_address";
/// The query parameter for whether to refund via native ETH
export const REFUND_NATIVE_ETH_PARAM = "refund_native_eth";
