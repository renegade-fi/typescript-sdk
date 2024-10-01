/* tslint:disable */
/* eslint-disable */
/**
* @param {string} seed
* @returns {any}
*/
export function create_wallet(seed: string): any;
/**
* @param {string} seed
* @returns {any}
*/
export function find_wallet(seed: string): any;
/**
* @param {string} seed
* @returns {any}
*/
export function derive_blinder_share(seed: string): any;
/**
* @param {string} seed
* @returns {any}
*/
export function wallet_id(seed: string): any;
/**
* @param {string} seed
* @param {string} wallet_str
* @param {string} from_addr
* @param {string} mint
* @param {string} amount
* @param {string} permit_nonce
* @param {string} permit_deadline
* @param {string} permit_signature
* @returns {any}
*/
export function deposit(seed: string, wallet_str: string, from_addr: string, mint: string, amount: string, permit_nonce: string, permit_deadline: string, permit_signature: string): any;
/**
* @param {string} seed
* @param {string} wallet_str
* @param {string} mint
* @param {string} amount
* @param {string} destination_addr
* @returns {any}
*/
export function withdraw(seed: string, wallet_str: string, mint: string, amount: string, destination_addr: string): any;
/**
* @param {string} seed
* @param {string} wallet_str
* @param {string} id
* @param {string} base_mint
* @param {string} quote_mint
* @param {string} side
* @param {string} amount
* @param {string} worst_case_price
* @param {string} min_fill_size
* @returns {any}
*/
export function new_order(seed: string, wallet_str: string, id: string, base_mint: string, quote_mint: string, side: string, amount: string, worst_case_price: string, min_fill_size: string): any;
/**
* @param {string} seed
* @param {string} wallet_str
* @param {string} id
* @param {string} base_mint
* @param {string} quote_mint
* @param {string} side
* @param {string} amount
* @param {string} worst_case_price
* @param {string} min_fill_size
* @param {string} matching_pool
* @returns {any}
*/
export function new_order_in_matching_pool(seed: string, wallet_str: string, id: string, base_mint: string, quote_mint: string, side: string, amount: string, worst_case_price: string, min_fill_size: string, matching_pool: string): any;
/**
* @param {string} seed
* @param {string} wallet_str
* @param {string} order_id
* @returns {any}
*/
export function cancel_order(seed: string, wallet_str: string, order_id: string): any;
/**
* @param {string} seed
* @param {string} wallet_str
* @param {string} id
* @param {string} base_mint
* @param {string} quote_mint
* @param {string} side
* @param {string} amount
* @param {string} worst_case_price
* @param {string} min_fill_size
* @returns {any}
*/
export function update_order(seed: string, wallet_str: string, id: string, base_mint: string, quote_mint: string, side: string, amount: string, worst_case_price: string, min_fill_size: string): any;
/**
* Build authentication headers for a request
* @param {string} key
* @param {string} req
* @param {bigint} current_timestamp
* @returns {any[]}
*/
export function build_auth_headers_symmetric(key: string, req: string, current_timestamp: bigint): any[];
/**
* Build admin authentication headers
* @param {string} key
* @param {string} req
* @param {bigint} current_timestamp
* @returns {any[]}
*/
export function build_admin_headers(key: string, req: string, current_timestamp: bigint): any[];
/**
* @param {string} seed
* @param {bigint} nonce
* @returns {any}
*/
export function derive_sk_root_from_seed(seed: string, nonce: bigint): any;
/**
* @param {string} seed
* @param {bigint} nonce
* @returns {any}
*/
export function get_pk_root(seed: string, nonce: bigint): any;
/**
* @param {string} seed
* @param {bigint} nonce
* @returns {any[]}
*/
export function get_pk_root_scalars(seed: string, nonce: bigint): any[];
/**
* @param {string} seed
* @returns {any}
*/
export function get_symmetric_key(seed: string): any;
/**
* @param {string} sk_root
* @param {string} message
* @returns {any}
*/
export function sign_message(sk_root: string, message: string): any;
/**
* @param {string} value
* @returns {any}
*/
export function bigint_to_limbs(value: string): any;
