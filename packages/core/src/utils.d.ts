/* tslint:disable */
/* eslint-disable */
/**
* @param {string} wallet_id
* @param {string} blinder_seed
* @param {string} share_seed
* @param {string} pk_root
* @param {string} sk_match
* @param {string} symmetric_key
* @returns {Promise<any>}
*/
export function find_external_wallet(wallet_id: string, blinder_seed: string, share_seed: string, pk_root: string, sk_match: string, symmetric_key: string): Promise<any>;
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
* @param {string | undefined} seed
* @param {string} wallet_str
* @param {string} from_addr
* @param {string} mint
* @param {string} amount
* @param {string} permit_nonce
* @param {string} permit_deadline
* @param {string} permit_signature
* @param {string | undefined} [new_public_key]
* @param {Function | undefined} [sign_message]
* @returns {Promise<any>}
*/
export function deposit(seed: string | undefined, wallet_str: string, from_addr: string, mint: string, amount: string, permit_nonce: string, permit_deadline: string, permit_signature: string, new_public_key?: string, sign_message?: Function): Promise<any>;
/**
* @param {string} chain
* @param {string | undefined} seed
* @param {string} wallet_str
* @param {string} mint
* @param {string} amount
* @param {string} destination_addr
* @param {string | undefined} [new_public_key]
* @param {Function | undefined} [sign_message]
* @returns {Promise<any>}
*/
export function withdraw(chain: string, seed: string | undefined, wallet_str: string, mint: string, amount: string, destination_addr: string, new_public_key?: string, sign_message?: Function): Promise<any>;
/**
* @param {string | undefined} seed
* @param {string} wallet_str
* @param {string} id
* @param {string} base_mint
* @param {string} quote_mint
* @param {string} side
* @param {string} amount
* @param {string} worst_case_price
* @param {string} min_fill_size
* @param {boolean} allow_external_matches
* @param {string | undefined} [new_public_key]
* @param {Function | undefined} [sign_message]
* @returns {Promise<any>}
*/
export function new_order(seed: string | undefined, wallet_str: string, id: string, base_mint: string, quote_mint: string, side: string, amount: string, worst_case_price: string, min_fill_size: string, allow_external_matches: boolean, new_public_key?: string, sign_message?: Function): Promise<any>;
/**
* @param {string | undefined} seed
* @param {string} wallet_str
* @param {string} id
* @param {string} base_mint
* @param {string} quote_mint
* @param {string} side
* @param {string} amount
* @param {string} worst_case_price
* @param {string} min_fill_size
* @param {boolean} allow_external_matches
* @param {string} matching_pool
* @param {string | undefined} [new_public_key]
* @param {Function | undefined} [sign_message]
* @returns {Promise<any>}
*/
export function new_order_in_matching_pool(seed: string | undefined, wallet_str: string, id: string, base_mint: string, quote_mint: string, side: string, amount: string, worst_case_price: string, min_fill_size: string, allow_external_matches: boolean, matching_pool: string, new_public_key?: string, sign_message?: Function): Promise<any>;
/**
* @param {string | undefined} seed
* @param {string} wallet_str
* @param {string} order_id
* @param {string | undefined} [new_public_key]
* @param {Function | undefined} [sign_message]
* @returns {Promise<any>}
*/
export function cancel_order(seed: string | undefined, wallet_str: string, order_id: string, new_public_key?: string, sign_message?: Function): Promise<any>;
/**
* @param {string | undefined} seed
* @param {string} wallet_str
* @param {string} id
* @param {string} base_mint
* @param {string} quote_mint
* @param {string} side
* @param {string} amount
* @param {string} worst_case_price
* @param {string} min_fill_size
* @param {boolean} allow_external_matches
* @param {string | undefined} [new_public_key]
* @param {Function | undefined} [sign_message]
* @returns {Promise<any>}
*/
export function update_order(seed: string | undefined, wallet_str: string, id: string, base_mint: string, quote_mint: string, side: string, amount: string, worst_case_price: string, min_fill_size: string, allow_external_matches: boolean, new_public_key?: string, sign_message?: Function): Promise<any>;
/**
* @param {string} base_mint
* @param {string} quote_mint
* @param {string} side
* @param {string} base_amount
* @param {string} quote_amount
* @param {string} min_fill_size
* @param {boolean} do_gas_estimation
* @param {string} receiver_address
* @returns {any}
*/
export function new_external_order(base_mint: string, quote_mint: string, side: string, base_amount: string, quote_amount: string, min_fill_size: string, do_gas_estimation: boolean, receiver_address: string): any;
/**
* @param {string} base_mint
* @param {string} quote_mint
* @param {string} side
* @param {string} base_amount
* @param {string} quote_amount
* @param {string} min_fill_size
* @returns {any}
*/
export function new_external_quote_request(base_mint: string, quote_mint: string, side: string, base_amount: string, quote_amount: string, min_fill_size: string): any;
/**
* @param {boolean} do_gas_estimation
* @param {boolean} allow_shared
* @param {string} updated_order
* @param {string} sponsored_quote_response
* @param {string} receiver_address
* @returns {any}
*/
export function assemble_external_match(do_gas_estimation: boolean, allow_shared: boolean, updated_order: string, sponsored_quote_response: string, receiver_address: string): any;
/**
* @param {string} wallet_id
* @param {string} blinder_seed
* @param {string} share_seed
* @param {string} pk_root
* @param {string} sk_match
* @param {string} symmetric_key
* @returns {Promise<any>}
*/
export function create_external_wallet(wallet_id: string, blinder_seed: string, share_seed: string, pk_root: string, sk_match: string, symmetric_key: string): Promise<any>;
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
* @param {string} wallet_str
* @returns {any}
*/
export function wallet_nullifier(wallet_str: string): any;
/**
* @param {Function} sign_message
* @returns {Promise<any>}
*/
export function generate_wallet_secrets(sign_message: Function): Promise<any>;
/**
* @param {string} path
* @param {any} headers
* @param {string} body
* @param {string} key
* @returns {string}
*/
export function create_request_signature(path: string, headers: any, body: string, key: string): string;
/**
* @param {string} b64_key
* @returns {string}
*/
export function b64_to_hex_hmac_key(b64_key: string): string;
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
* @param {string | undefined} [seed]
* @param {bigint | undefined} [nonce]
* @param {string | undefined} [public_key]
* @returns {any[]}
*/
export function get_pk_root_scalars(seed?: string, nonce?: bigint, public_key?: string): any[];
/**
* @param {string} seed
* @returns {any}
*/
export function get_symmetric_key(seed: string): any;
