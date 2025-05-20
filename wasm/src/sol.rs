//! Relevant Solidity ABI definitions from the Renegade contracts

use alloy_sol_types::sol;

// Base-specific ABI definitions
sol! {
    enum TransferType {
        Deposit,
        Withdrawal,
    }

    struct ExternalTransfer {
        address account;
        address mint;
        uint256 amount;
        TransferType transferType;
    }
}
