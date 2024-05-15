import type { Address } from 'viem'

/// Header name for the HTTP auth signature
export const RENEGADE_AUTH_HEADER_NAME = 'renegade-auth'
/// Header name for the expiration timestamp of a signature
export const RENEGADE_SIG_EXPIRATION_HEADER_NAME = 'renegade-auth-expiration'

////////////////////////////////////////////////////////////////////////////////
// Wallet
////////////////////////////////////////////////////////////////////////////////

// Create a new wallet
export const CREATE_WALLET_ROUTE = '/wallet'
// Find a wallet in contract storage
export const FIND_WALLET_ROUTE = '/wallet/lookup'
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

export const devnetTokenMapping = {
  tokens: [
    {
      name: 'WBTC',
      ticker: 'WBTC',
      address: '0x11b57fe348584f042e436c6bf7c3c3def171de49',
      decimals: 18,
    },
    {
      name: 'WETH',
      ticker: 'WETH',
      address: '0xa6e41ffd769491a42a6e5ce453259b93983a22ef',
      decimals: 18,
    },
    {
      name: 'BNB',
      ticker: 'BNB',
      address: '0xe1080224b632a93951a7cfa33eeea9fd81558b5e',
      decimals: 18,
    },
    {
      name: 'MATIC',
      ticker: 'MATIC',
      address: '0x7e32b54800705876d3b5cfbc7d9c226a211f7c1a',
      decimals: 18,
    },
    {
      name: 'LDO',
      ticker: 'LDO',
      address: '0x525c2aba45f66987217323e8a05ea400c65d06dc',
      decimals: 18,
    },
    {
      name: 'USDC',
      ticker: 'USDC',
      address: '0x85d9a8a4bd77b9b5559c1b7fcb8ec9635922ed49',
      decimals: 18,
    },
    {
      name: 'USDT',
      ticker: 'USDT',
      address: '0x4a2ba922052ba54e29c5417bc979daaf7d5fe4f4',
      decimals: 18,
    },
    {
      name: 'LINK',
      ticker: 'LINK',
      address: '0x4af567288e68cad4aa93a272fe6139ca53859c70',
      decimals: 18,
    },
    {
      name: 'UNI',
      ticker: 'UNI',
      address: '0x3df948c956e14175f43670407d5796b95bb219d8',
      decimals: 18,
    },
    {
      name: 'SUSHI',
      ticker: 'SUSHI',
      address: '0x75e0e92a79880bd81a69f72983d03c75e2b33dc8',
      decimals: 18,
    },
    {
      name: '1INCH',
      ticker: '1INCH',
      address: '0xf5ffd11a55afd39377411ab9856474d2a7cb697e',
      decimals: 18,
    },
    {
      name: 'AAVE',
      ticker: 'AAVE',
      address: '0x408da76e87511429485c32e4ad647dd14823fdc4',
      decimals: 18,
    },
    {
      name: 'COMP',
      ticker: 'COMP',
      address: '0xdb2d15a3eb70c347e0d2c2c7861cafb946baab48',
      decimals: 18,
    },
    {
      name: 'MKR',
      ticker: 'MKR',
      address: '0xa39ffa43eba037d67a0f4fe91956038aba0ca386',
      decimals: 18,
    },
    {
      name: 'REN',
      ticker: 'REN',
      address: '0xdb3f4ecb0298238a19ec5afd087c6d9df8041919',
      decimals: 18,
    },
    {
      name: 'MANA',
      ticker: 'MANA',
      address: '0x1b9cbdc65a7bebb0be7f18d93a1896ea1fd46d7a',
      decimals: 18,
    },
    {
      name: 'ENS',
      ticker: 'ENS',
      address: '0x47cec0749bd110bc11f9577a70061202b1b6c034',
      decimals: 18,
    },
    {
      name: 'DYDX',
      ticker: 'DYDX',
      address: '0x841118047f42754332d0ad4db8a2893761dd7f5d',
      decimals: 18,
    },
    {
      name: 'CRV',
      ticker: 'CRV',
      address: '0xc2c0c3398915a2d2e9c33c186abfef3192ee25e8',
      decimals: 18,
    },
  ],
}

export const testnetTokenMapping = {
  tokens: [
    {
      name: 'WBTC',
      ticker: 'WBTC',
      address: '0xd542490eba60e4b4d28d23c5b392b1607438f3cc',
      decimals: 18,
    },
    {
      name: 'WETH',
      ticker: 'WETH',
      address: '0x663e903ff15a0e911258cea2116b2071e80fed68',
      decimals: 18,
    },
    {
      name: 'BNB',
      ticker: 'BNB',
      address: '0xed7ec2d4d4d9a6a702769679fb5a36f55ebf197b',
      decimals: 18,
    },
    {
      name: 'MATIC',
      ticker: 'MATIC',
      address: '0x9268bb5c5f6403ff02a89dcff7ddbb07ff046f99',
      decimals: 18,
    },
    {
      name: 'LDO',
      ticker: 'LDO',
      address: '0x22963655fe6ebbfa46400e9f01012e54bae543c4',
      decimals: 18,
    },
    {
      name: 'USDC',
      ticker: 'USDC',
      address: '0xab03a15c0b1bfe992765280247b31a73489aa57b',
      decimals: 18,
    },
    {
      name: 'USDT',
      ticker: 'USDT',
      address: '0xacca32fccaf3220c1a3a31f7a5f879c231320642',
      decimals: 18,
    },
    {
      name: 'LINK',
      ticker: 'LINK',
      address: '0x77edb6f64f86a6794d5da3a34aa9fbbe8e61e852',
      decimals: 18,
    },
    {
      name: 'UNI',
      ticker: 'UNI',
      address: '0xe78b46ae59984d11a215b6f84c7de4cb111ef63c',
      decimals: 18,
    },
    {
      name: 'SUSHI',
      ticker: 'SUSHI',
      address: '0x93fe5ec17f31112dcd25770fbd07270159b67451',
      decimals: 18,
    },
    {
      name: '1INCH',
      ticker: '1INCH',
      address: '0xc6464a3072270a3da814bb0ec2907df935ff839d',
      decimals: 18,
    },
    {
      name: 'AAVE',
      ticker: 'AAVE',
      address: '0x104f5cc5d1593f1ba2a0eecf5882be85e231aca9',
      decimals: 18,
    },
    {
      name: 'COMP',
      ticker: 'COMP',
      address: '0xac3b14cb55c2242bb8ca1dc8269701948cb0c348',
      decimals: 18,
    },
    {
      name: 'MKR',
      ticker: 'MKR',
      address: '0x15f7fe757a582634e1ed105ea68f07f6cf240b37',
      decimals: 18,
    },
    {
      name: 'REN',
      ticker: 'REN',
      address: '0xe7e96cef8812d2d24add2de592b5c786f915f64b',
      decimals: 18,
    },
    {
      name: 'MANA',
      ticker: 'MANA',
      address: '0xb66ff14a830d5527f06e384b309288b843d555c4',
      decimals: 18,
    },
    {
      name: 'ENS',
      ticker: 'ENS',
      address: '0xf5c43ef3d79caf5680584d9087f95d81e75e2ddf',
      decimals: 18,
    },
    {
      name: 'DYDX',
      ticker: 'DYDX',
      address: '0xe85035f1145ac49333d105632a0d254e479a75be',
      decimals: 18,
    },
    {
      name: 'CRV',
      ticker: 'CRV',
      address: '0x47b8399a8a3ad9665e4257904f99eafe043c4f50',
      decimals: 18,
    },
  ],
}

const isDevelopment =
  process.env.RPC_URL?.includes('dev') ||
  process.env.NEXT_PUBLIC_RPC_URL?.includes('dev')

export const tokenMapping = isDevelopment
  ? devnetTokenMapping
  : testnetTokenMapping
