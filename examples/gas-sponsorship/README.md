# Gas Sponsorship Example

This example demonstrates how to use the Renegade gas sponsorship feature. For now, it uses the same flow as the external match example, but will be updated with gas sponsorship specific functionality.

## Setup

1. Install dependencies:
```bash
pnpm install
```

2. Set up environment variables:
```bash
export GAS_SPONSORSHIP_KEY="your-api-key"
export GAS_SPONSORSHIP_SECRET="your-api-secret"
export PKEY="your-private-key"
export RPC_URL="your-rpc-url" # Optional, defaults to Arbitrum Sepolia public RPC
```

3. Run the example:
```bash
pnpm start
```

## What's happening?

Currently this example follows the same flow as the external match example:

1. Gets a quote for a trade
2. Assembles the quote into a bundle
3. Submits the transaction to the chain

This will be updated with gas sponsorship specific functionality in future updates. 