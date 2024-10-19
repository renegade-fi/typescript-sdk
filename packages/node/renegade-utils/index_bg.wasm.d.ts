/* tslint:disable */
/* eslint-disable */
export const memory: WebAssembly.Memory;
export function create_wallet(a: number, b: number, c: number): void;
export function find_wallet(a: number, b: number, c: number): void;
export function derive_blinder_share(a: number, b: number, c: number): void;
export function wallet_id(a: number, b: number, c: number): void;
export function deposit(a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number, l: number, m: number, n: number, o: number, p: number, q: number): void;
export function withdraw(a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number): void;
export function new_order(a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number, l: number, m: number, n: number, o: number, p: number, q: number, r: number, s: number, t: number): void;
export function new_order_in_matching_pool(a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number, l: number, m: number, n: number, o: number, p: number, q: number, r: number, s: number, t: number, u: number, v: number): void;
export function cancel_order(a: number, b: number, c: number, d: number, e: number, f: number, g: number): void;
export function update_order(a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number, l: number, m: number, n: number, o: number, p: number, q: number, r: number, s: number, t: number): void;
export function build_auth_headers_symmetric(a: number, b: number, c: number, d: number, e: number, f: number): void;
export function build_admin_headers(a: number, b: number, c: number, d: number, e: number, f: number): void;
export function derive_sk_root_from_seed(a: number, b: number, c: number): number;
export function get_pk_root(a: number, b: number, c: number): number;
export function get_pk_root_scalars(a: number, b: number, c: number, d: number): void;
export function get_symmetric_key(a: number, b: number): number;
export function sign_message(a: number, b: number, c: number, d: number): number;
export function bigint_to_limbs(a: number, b: number): number;
export function __wbindgen_add_to_stack_pointer(a: number): number;
export function __wbindgen_malloc(a: number, b: number): number;
export function __wbindgen_realloc(a: number, b: number, c: number, d: number): number;
export function __wbindgen_free(a: number, b: number, c: number): void;
export function __wbindgen_exn_store(a: number): void;
