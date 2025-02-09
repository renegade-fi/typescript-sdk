# Gas Sponsorship Example

This example demonstrates how to request gas sponsorship when generating an external match. This allows API users to have their transaction gas costs refunded through a rebate contract.

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

This example demonstrates how to execute trades with gas sponsorship enabled. The flow is similar to a regular external match (see [external-match](../external-match/README.md)), but with the key difference that the transaction is routed through a gas sponsorship contract that refunds gas costs to the configured address.

Here's how it works:

1. Gets a quote for a match
2. Assembles the quote into a bundle with `requestGasSponsorship` set to true
3. The bundle includes routing through the gas sponsorship contract
4. At the end of the transaction, the gas sponsorship contract will refund the gas costs to the configured address.

### Refund Address
The refund address is configurable; if not specified, the transaction will refund `tx.origin`.