//! Defines exports for the deposit task using a Bring Your Own Key (BYOK) approach.
pub mod error;
pub mod handler;
pub mod parse;

pub use self::{error::DepositError, handler::byok_deposit, parse::DepositParameters};
