import invariant from 'tiny-invariant'
import type { Address } from 'viem'

/// Header name for the HTTP auth signature
export const RENEGADE_AUTH_HEADER_NAME = 'renegade-auth'
/// Header name for the expiration timestamp of a signature
export const RENEGADE_SIG_EXPIRATION_HEADER_NAME = 'renegade-auth-expiration'
/// The message used to derive the wallet's root key
export const ROOT_KEY_MESSAGE_PREFIX =
  'Unlock your Renegade Wallet on chain ID:'

////////////////////////////////////////////////////////////////////////////////
// System-Wide Constants
////////////////////////////////////////////////////////////////////////////////

// The system-wide value of MAX_BALANCES; the number of allowable balances a wallet holds
export const MAX_BALANCES = 5

/// The system-wide value of MAX_ORDERS; the number of allowable orders a wallet holds
export const MAX_ORDERS = 5

////////////////////////////////////////////////////////////////////////////////
// Wallet
////////////////////////////////////////////////////////////////////////////////

// Create a new wallet
export const CREATE_WALLET_ROUTE = '/wallet'
// Find a wallet in contract storage
export const FIND_WALLET_ROUTE = '/wallet/lookup'
// Refresh a wallet from on-chain state
export const REFRESH_WALLET_ROUTE = (wallet_id: string) =>
  `/wallet/${wallet_id}/refresh`
// Returns the wallet information for the given id
export const GET_WALLET_ROUTE = (wallet_id: string) => `/wallet/${wallet_id}`
/// Get the wallet at the "back of the queue", i.e. the speculatively updated
/// wallet as if all enqueued wallet tasks had completed
export const BACK_OF_QUEUE_WALLET_ROUTE = (wallet_id: string) =>
  `/wallet/${wallet_id}/back-of-queue`
// Route to the orders of a given wallet
export const WALLET_ORDERS_ROUTE = (wallet_id: string) =>
  `/wallet/${wallet_id}/orders`
// Returns a single order by the given identifier
export const GET_ORDER_BY_ID_ROUTE = (wallet_id: string, order_id: string) =>
  `/wallet/${wallet_id}/orders/${order_id}`
// Updates a given order
export const UPDATE_ORDER_ROUTE = (wallet_id: string, order_id: string) =>
  `/wallet/${wallet_id}/orders/${order_id}/update`
// Cancels a given order
export const CANCEL_ORDER_ROUTE = (wallet_id: string, order_id: string) =>
  `/wallet/${wallet_id}/orders/${order_id}/cancel`
// Returns the balances within a given wallet
export const GET_BALANCES_ROUTE = (wallet_id: string) =>
  `/wallet/${wallet_id}/balances`
// Returns the balance associated with the given mint
export const GET_BALANCE_BY_MINT_ROUTE = (wallet_id: string, mint: string) =>
  `/wallet/${wallet_id}/balances/${mint}`
// Deposits an ERC-20 token into the darkpool
export const DEPOSIT_BALANCE_ROUTE = (wallet_id: string) =>
  `/wallet/${wallet_id}/balances/deposit`
// Withdraws an ERC-20 token from the darkpool
export const WITHDRAW_BALANCE_ROUTE = (wallet_id: string, mint: string) =>
  `/wallet/${wallet_id}/balances/${mint}/withdraw`
// Pays all wallet fees
export const PAY_FEES_ROUTE = (wallet_id: string) =>
  `/wallet/${wallet_id}/pay-fees`
// Returns the order history of a wallet
export const ORDER_HISTORY_ROUTE = (wallet_id: string) =>
  `/wallet/${wallet_id}/order-history`

////////////////////////////////////////////////////////////////////////////////
// Network
////////////////////////////////////////////////////////////////////////////////

// Returns the full network topology known to the local node
export const GET_NETWORK_TOPOLOGY_ROUTE = '/network'
// Returns the cluster information for the specified cluster
export const GET_CLUSTER_INFO_ROUTE = (cluster_id: string) =>
  `/network/clusters/${cluster_id}`
// Returns the peer info for a given peer
export const GET_PEER_INFO_ROUTE = (peer_id: string) =>
  `/network/peers/${peer_id}`

////////////////////////////////////////////////////////////////////////////////
// Order Book
////////////////////////////////////////////////////////////////////////////////

// Returns all known network orders
export const GET_NETWORK_ORDERS_ROUTE = '/order_book/orders'
// Returns the network order information of the specified order
export const GET_NETWORK_ORDER_BY_ID_ROUTE = (order_id: string) =>
  `/order_book/orders/${order_id}`

////////////////////////////////////////////////////////////////////////////////
// Price Report
////////////////////////////////////////////////////////////////////////////////

// Price report route
export const PRICE_REPORT_ROUTE = '/price_report'

////////////////////////////////////////////////////////////////////////////////
// Task
////////////////////////////////////////////////////////////////////////////////

// Get the status of a task
export const GET_TASK_STATUS_ROUTE = (task_id: string) => `/tasks/${task_id}`
// Get the task queue of a given wallet
export const GET_TASK_QUEUE_ROUTE = (wallet_id: string) =>
  `/task_queue/${wallet_id}`
/// The route to fetch task history for a wallet
export const TASK_HISTORY_ROUTE = (wallet_id: string) =>
  `/wallet/${wallet_id}/task-history`

////////////////////////////////////////////////////////////////////////////////
// Health check
////////////////////////////////////////////////////////////////////////////////

/// Health check
export const PING_ROUTE = '/ping'

////////////////////////////////////////////////////////////////////////////////
// Websockets
////////////////////////////////////////////////////////////////////////////////

// Initiates a handshake with the server
export const HANDSHAKE_ROUTE = '/v0/handshake'
// Retrieves wallet information by wallet ID
export const WALLET_ROUTE = (wallet_id: string) => `/v0/wallet/${wallet_id}`
// Fetches price reports based on source, base, and quote currencies
export const WS_PRICE_REPORT_ROUTE = (
  source: string,
  base: string,
  quote: string,
) => `/v0/price_report/${source}/${base}/${quote}`
// Streams order book events
export const ORDER_BOOK_ROUTE = '/v0/order_book'
/// The network topic, streams events about network peers
export const NETWORK_INFO_ROUTE = '/v0/network'
/// The task status topic, streams information about task statuses
export const TASK_STATUS_ROUTE = (task_id: string) => `/v0/tasks/${task_id}`
/// The task history topic, streams information about historical tasks
export const WS_TASK_HISTORY_ROUTE = (wallet_id: string) =>
  `/v0/wallet/${wallet_id}/task-history`
/// The wallet order status topic, streams events about wallet's orders
export const WS_WALLET_ORDERS_ROUTE = (wallet_id: string) =>
  `/v0/wallet/${wallet_id}/order-status`

////////////////////////////////////////////////////////////////////////////////
// Price Reporter
////////////////////////////////////////////////////////////////////////////////

export const PRICE_REPORTER_TOPIC = (
  exchange: string,
  base: Address,
  quote: Address,
) => `${exchange}-${base.toLowerCase()}-${quote.toLowerCase()}`

// HTTP GET route to fetch price from price reporter
export const PRICE_REPORTER_ROUTE = (
  exchange: string,
  base: Address,
  quote: Address,
) => `/price/${PRICE_REPORTER_TOPIC(exchange, base, quote)}`

////////////////////////////////////////////////////////////////////////////////
// Token
////////////////////////////////////////////////////////////////////////////////

invariant(
  process.env.NEXT_PUBLIC_TOKEN_MAPPING || process.env.TOKEN_MAPPING,
  'TOKEN_MAPPING is not set',
)

export const tokenMapping = JSON.parse(
  process.env.NEXT_PUBLIC_TOKEN_MAPPING ?? process.env.TOKEN_MAPPING ?? '{}',
) as {
  tokens: Array<{
    name: string
    ticker: string
    address: Address
    decimals: number
  }>
}
