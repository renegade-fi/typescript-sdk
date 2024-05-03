import type { Address, Hex } from 'viem';
export type Exchange = 'binance' | 'coinbase' | 'kraken' | 'okx';
export type NetworkOrder = {
    id: string;
    public_share_nullifier: number[];
    local: boolean;
    cluster: string;
    state: string;
    validity_proofs: (ValidityProof | number[])[];
    timestamp: number;
};
type ValidityProof = {
    statement: {
        original_shares_nullifier?: number[];
        reblinded_private_share_commitment?: number[];
        merkle_root?: number[];
        indices?: {
            balance_send: number;
            balance_receive: number;
            order: number;
        };
    };
    proof: string;
};
export type Order = {
    id: string;
    quote_mint: Address;
    base_mint: Address;
    side: 'Buy' | 'Sell';
    type: 'Midpoint';
    worst_case_price: string;
    amount: bigint;
};
export type Balance = {
    mint: Address;
    amount: bigint;
    relayer_fee_balance: bigint;
    protocol_fee_balance: bigint;
};
export type KeyChain = {
    public_keys: {
        pk_root: Hex;
        pk_match: Hex;
    };
    private_keys: {
        sk_root: Hex;
        sk_match: Hex;
    };
};
export type Wallet = {
    id: string;
    orders: Order[];
    balances: Balance[];
    key_chain: KeyChain;
    managing_cluster: Hex;
    match_fee: bigint;
    blinded_public_shares: bigint[][];
    private_shares: bigint[][];
    blinder: bigint[];
};
export type OldTask = {
    id: string;
    description: string;
    state: string;
    committed: boolean;
};
export declare enum OrderState {
    Created = "Created",
    Matching = "Matching",
    SettlingMatch = "SettlingMatch",
    Filled = "Filled",
    Cancelled = "Cancelled"
}
export type OrderMetadata = {
    id: string;
    state: OrderState;
    filled: bigint;
    created: number;
    data: Order;
};
export {};
//# sourceMappingURL=wallet.d.ts.map