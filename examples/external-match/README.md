### External Match Example
This example demonstrates how to fetch and assemble an external match. 

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
An external match is a match between an order internal to the darkpool, and an order external to the darkpool. An external party (this script) requests a quote for the order, and assembles the quote into a bundle, if the quote is acceptable. The bundle contains a transaction which may be submitted on-chain to settle the match.

The flow of this example is as follows:

1. Get a quote for the order
2. Assemble the quote into a bundle
3. Submit the bundle to the chain
