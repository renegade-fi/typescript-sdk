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
* @param {boolean} allow_external_matches
* @returns {any}
*/
export function new_order(seed: string, wallet_str: string, id: string, base_mint: string, quote_mint: string, side: string, amount: string, worst_case_price: string, min_fill_size: string, allow_external_matches: boolean): any;
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
* @param {boolean} allow_external_matches
* @param {string} matching_pool
* @returns {any}
*/
export function new_order_in_matching_pool(seed: string, wallet_str: string, id: string, base_mint: string, quote_mint: string, side: string, amount: string, worst_case_price: string, min_fill_size: string, allow_external_matches: boolean, matching_pool: string): any;
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
* @param {boolean} allow_external_matches
* @returns {any}
*/
export function update_order(seed: string, wallet_str: string, id: string, base_mint: string, quote_mint: string, side: string, amount: string, worst_case_price: string, min_fill_size: string, allow_external_matches: boolean): any;
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

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly create_wallet: (a: number, b: number, c: number) => void;
  readonly find_wallet: (a: number, b: number, c: number) => void;
  readonly derive_blinder_share: (a: number, b: number, c: number) => void;
  readonly wallet_id: (a: number, b: number, c: number) => void;
  readonly deposit: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number, l: number, m: number, n: number, o: number, p: number, q: number) => void;
  readonly withdraw: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number) => void;
  readonly new_order: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number, l: number, m: number, n: number, o: number, p: number, q: number, r: number, s: number, t: number) => void;
  readonly new_order_in_matching_pool: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number, l: number, m: number, n: number, o: number, p: number, q: number, r: number, s: number, t: number, u: number, v: number) => void;
  readonly cancel_order: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
  readonly update_order: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number, l: number, m: number, n: number, o: number, p: number, q: number, r: number, s: number, t: number) => void;
  readonly build_auth_headers_symmetric: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly build_admin_headers: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly derive_sk_root_from_seed: (a: number, b: number, c: number) => number;
  readonly get_pk_root: (a: number, b: number, c: number) => number;
  readonly get_pk_root_scalars: (a: number, b: number, c: number, d: number) => void;
  readonly get_symmetric_key: (a: number, b: number) => number;
  readonly sign_message: (a: number, b: number, c: number, d: number) => number;
  readonly bigint_to_limbs: (a: number, b: number) => number;
  readonly __wbindgen_add_to_stack_pointer: (a: number) => number;
  readonly __wbindgen_malloc: (a: number, b: number) => number;
  readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
  readonly __wbindgen_free: (a: number, b: number, c: number) => void;
  readonly __wbindgen_exn_store: (a: number) => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;
/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {SyncInitInput} module
*
* @returns {InitOutput}
*/
export function initSync(module: SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {InitInput | Promise<InitInput>} module_or_path
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: InitInput | Promise<InitInput>): Promise<InitOutput>;
