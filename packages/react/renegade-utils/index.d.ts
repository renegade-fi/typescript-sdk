/* tslint:disable */
/* eslint-disable */
/**
* @param {string} sk_root
* @returns {any}
*/
export function create_wallet(sk_root: string): any;
/**
* @param {string} sk_root
* @returns {any}
*/
export function find_wallet(sk_root: string): any;
/**
* @param {string} sk_root
* @returns {any}
*/
export function derive_blinder_share(sk_root: string): any;
/**
* @param {string} sk_root
* @returns {any}
*/
export function wallet_id(sk_root: string): any;
/**
* @param {string} wallet_str
* @param {string} from_addr
* @param {string} mint
* @param {string} amount
* @param {string} permit_nonce
* @param {string} permit_deadline
* @param {string} permit_signature
* @returns {any}
*/
export function deposit(wallet_str: string, from_addr: string, mint: string, amount: string, permit_nonce: string, permit_deadline: string, permit_signature: string): any;
/**
* @param {string} wallet_str
* @param {string} mint
* @param {string} amount
* @param {string} destination_addr
* @returns {any}
*/
export function withdraw(wallet_str: string, mint: string, amount: string, destination_addr: string): any;
/**
* @param {string} wallet_str
* @param {string} id
* @param {string} base_mint
* @param {string} quote_mint
* @param {string} side
* @param {string} amount
* @returns {any}
*/
export function new_order(wallet_str: string, id: string, base_mint: string, quote_mint: string, side: string, amount: string): any;
/**
* @param {string} wallet_str
* @param {string} order_id
* @returns {any}
*/
export function cancel_order(wallet_str: string, order_id: string): any;
/**
* Build authentication headers for a request
* @param {string} sk_root
* @param {string} req
* @param {bigint} current_timestamp
* @returns {any[]}
*/
export function build_auth_headers(sk_root: string, req: string, current_timestamp: bigint): any[];
/**
* @param {string} seed
* @returns {any}
*/
export function derive_signing_key_from_seed(seed: string): any;
/**
* @param {string} sk_root
* @returns {any}
*/
export function get_pk_root(sk_root: string): any;
/**
* @param {string} sk_root
* @returns {any[]}
*/
export function pk_root_scalars(sk_root: string): any[];
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
  readonly deposit: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number, l: number, m: number, n: number, o: number) => void;
  readonly withdraw: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number) => void;
  readonly new_order: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number, l: number, m: number) => void;
  readonly cancel_order: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly build_auth_headers: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly derive_signing_key_from_seed: (a: number, b: number) => number;
  readonly get_pk_root: (a: number, b: number) => number;
  readonly pk_root_scalars: (a: number, b: number, c: number) => void;
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
