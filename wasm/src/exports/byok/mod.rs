//! Defines exports to interact with the Relayer API using a Bring Your Own Key
//! (BYOK) approach.

mod create_wallet;
mod deposit;
mod generate_wallet_secrets;
mod get_pk_root_scalars;
mod parameters;
mod signature;
mod utils;

pub use {deposit::byok_deposit, signature::generate_signature};