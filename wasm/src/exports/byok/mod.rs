//! Defines exports to interact with the Relayer API using a Bring Your Own Key
//! (BYOK) approach.

mod create_wallet;
mod deposit;
mod generate_wallet_secrets;
mod get_pk_root_scalars;
mod key_rotation;
mod parameters;
mod signature;
mod utils;
mod withdraw;

pub use {deposit::byok_deposit, signature::generate_signature};
