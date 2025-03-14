# In-Kind Gas Sponsorship Example

This example demonstrates how to request gas sponsorship "in-kind," i.e. in terms of the user's buy-side token, when generating an external match. When the `refundAddress` is left unset, the rebate goes to the receiver of the match. This is reflected both in `ExternalMatchQuote.receive`, and as a better price in `ExternalMatchQuote.price`, in the API response. This form of gas sponsorship is on by default.

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

1. Gets a quote for a match with `disableGasSponsorship` set to false, `refundNativeEth` set to false, and the `refundAddress` unset.
2. Assembles the quote with the `receiverAddress` set.
3. The bundle includes routing through the gas sponsorship contract
4. At the end of the transaction, the gas sponsorship contract will refund the gas costs to the receiver of the match. You should see the address receive a transfer of the buy-side token approximately equivalent to the costs of the transaction.

### Refund Address
The refund address is configurable; if not specified, the transaction will refund the `receiverAddress` of the match.