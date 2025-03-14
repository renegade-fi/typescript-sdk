# Native ETH Gas Sponsorship Example

This example demonstrates how to request gas sponsorship (in terms of ETH, see [in-kind gas sponsorship](../in-kind-gas-sponsorship/README.md)) when generating an external match. This allows API users to have their transaction gas costs refunded through a rebate contract.

## Setup

1. Install dependencies:
```bash
pnpm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```
Then replace the values with your own API key and secret.

3. Run the example:
```bash
pnpm start
```

## What's happening?

This example demonstrates how to execute trades with gas sponsorship enabled. The flow is similar to in-kind gas sponsorship (see [in-kind-gas-sponsorship](../in-kind-gas-sponsorship/README.md)), but with the key difference that the gas is sponsored in terms of native ETH.

Here's how it works:

1. Gets a quote for a match with `useGasSponsorship` set to true, `refundNativeEth` set to true, and the `refundAddress` set.
2. Assembles the quote.
3. The bundle includes routing through the gas sponsorship contract
4. At the end of the transaction, the gas sponsorship contract will refund the gas costs to the configured address. You should see the address receive a transfer of ETH approximately equivalent to the gas costs of the transaction.

### Refund Address
The refund address is configurable; if not specified, the transaction will refund `tx.origin`.