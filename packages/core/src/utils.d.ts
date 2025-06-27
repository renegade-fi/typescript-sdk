/* tslint:disable */
/* eslint-disable */
export function create_request_signature(path: string, headers: any, body: string, key: string): string;
export function b64_to_hex_hmac_key(b64_key: string): string;
export function derive_sk_root_from_seed(seed: string, nonce: bigint): any;
export function get_pk_root(seed: string, nonce: bigint): any;
export function get_pk_root_scalars(seed?: string | null, nonce?: bigint | null, public_key?: string | null): any[];
export function get_symmetric_key(seed: string): any;
export function create_external_wallet(wallet_id: string, blinder_seed: string, share_seed: string, pk_root: string, sk_match: string, symmetric_key: string): Promise<any>;
export function find_external_wallet(wallet_id: string, blinder_seed: string, share_seed: string, pk_root: string, sk_match: string, symmetric_key: string): Promise<any>;
export function generate_wallet_secrets(sign_message: Function): Promise<any>;
export function create_wallet(seed: string): any;
export function find_wallet(seed: string): any;
export function derive_blinder_share(seed: string): any;
export function wallet_id(seed: string): any;
export function deposit(seed: string | null | undefined, wallet_str: string, from_addr: string, mint: string, amount: string, permit_nonce: string, permit_deadline: string, permit_signature: string, new_public_key?: string | null, sign_message?: Function | null): Promise<any>;
export function withdraw(chain: string, seed: string | null | undefined, wallet_str: string, mint: string, amount: string, destination_addr: string, new_public_key?: string | null, sign_message?: Function | null): Promise<any>;
export function new_order(seed: string | null | undefined, wallet_str: string, id: string, base_mint: string, quote_mint: string, side: string, amount: string, worst_case_price: string, min_fill_size: string, allow_external_matches: boolean, new_public_key?: string | null, sign_message?: Function | null): Promise<any>;
export function new_order_in_matching_pool(seed: string | null | undefined, wallet_str: string, id: string, base_mint: string, quote_mint: string, side: string, amount: string, worst_case_price: string, min_fill_size: string, allow_external_matches: boolean, matching_pool: string, new_public_key?: string | null, sign_message?: Function | null): Promise<any>;
export function cancel_order(seed: string | null | undefined, wallet_str: string, order_id: string, new_public_key?: string | null, sign_message?: Function | null): Promise<any>;
export function update_order(seed: string | null | undefined, wallet_str: string, id: string, base_mint: string, quote_mint: string, side: string, amount: string, worst_case_price: string, min_fill_size: string, allow_external_matches: boolean, new_public_key?: string | null, sign_message?: Function | null): Promise<any>;
export function new_external_order(base_mint: string, quote_mint: string, side: string, base_amount: string, quote_amount: string, min_fill_size: string, do_gas_estimation: boolean, receiver_address: string): any;
export function new_external_quote_request(base_mint: string, quote_mint: string, side: string, base_amount: string, quote_amount: string, min_fill_size: string): any;
export function assemble_external_match(do_gas_estimation: boolean, allow_shared: boolean, updated_order: string, sponsored_quote_response: string, receiver_address: string): any;
