//! Defines exports to interact with the Relayer API using a Bring Your Own Key
//! (BYOK) approach.

mod deposit;
mod error;
mod signature;

pub use {
    deposit::{byok_deposit, DepositError, DepositParameters},
    signature::generate_signature,
};
