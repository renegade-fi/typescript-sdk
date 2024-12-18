//! Defines exports to interact with the Relayer API using a Bring Your Own Key
//! (BYOK) approach.

mod create_wallet;
mod deposit;
mod parse;
mod signature;

pub use {deposit::byok_deposit, signature::generate_signature};
