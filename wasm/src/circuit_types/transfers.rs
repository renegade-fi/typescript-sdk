use crate::{
    errors::ConversionError,
    serde_def_types::{AddressDef, U256Def},
};
use alloy_primitives::{Address, U256 as AlloyU256};
use num_bigint::BigUint;
use ruint::aliases::{U160, U256};
use serde::{Deserialize, Serialize};
use serde_with::serde_as;

use super::Amount;
/// The base external transfer type, not allocated in a constraint system
/// or an MPC circuit
#[derive(Clone, Debug, Default, Serialize, Deserialize, PartialEq)]
pub struct ExternalTransfer {
    /// The address of the account contract to transfer to/from
    pub account_addr: BigUint,
    /// The mint (ERC20 address) of the token to transfer
    pub mint: BigUint,
    /// The amount of the token transferred
    pub amount: Amount,
    /// The direction of transfer
    pub direction: ExternalTransferDirection,
}

/// Represents the direction (deposit/withdraw) of a transfer
#[derive(Copy, Clone, Debug, Serialize, Deserialize, PartialEq, Default)]
pub enum ExternalTransferDirection {
    /// Deposit an ERC20 into the darkpool from an external address
    #[default]
    Deposit = 0,
    /// Withdraw an ERC20 from the darkpool to an external address
    Withdrawal,
}

/// Represents an external transfer of an ERC20 token
#[serde_as]
#[derive(Serialize, Deserialize, Default)]
pub struct ContractExternalTransfer {
    /// The address of the account contract to deposit from or withdraw to
    #[serde_as(as = "AddressDef")]
    pub account_addr: Address,
    /// The mint (contract address) of the token being transferred
    #[serde_as(as = "AddressDef")]
    pub mint: Address,
    /// The amount of the token transferred
    #[serde_as(as = "U256Def")]
    pub amount: AlloyU256,
    /// Whether or not the transfer is a withdrawal (otherwise a deposit)
    pub is_withdrawal: bool,
}

/// Convert an [`ExternalTransfer`] to its corresponding smart contract type
pub fn to_contract_external_transfer(
    external_transfer: &ExternalTransfer,
) -> Result<ContractExternalTransfer, ConversionError> {
    let account_addr: U160 = external_transfer
        .account_addr
        .clone()
        .try_into()
        .map_err(|_| ConversionError::InvalidUint)?;
    let mint: U160 = external_transfer
        .mint
        .clone()
        .try_into()
        .map_err(|_| ConversionError::InvalidUint)?;
    let amount: U256 = external_transfer
        .amount
        .try_into()
        .map_err(|_| ConversionError::InvalidUint)?;

    Ok(ContractExternalTransfer {
        account_addr: Address::from(account_addr),
        mint: Address::from(mint),
        amount,
        is_withdrawal: external_transfer.direction == ExternalTransferDirection::Withdrawal,
    })
}
