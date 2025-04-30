### Malleable External Match Example
This example demonstrates how to fetch and assemble a malleable external match. 

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
We cover what an external match is in [External Match Example](../external-match/README.md). A malleable external match is a match that specifies a range of allowable base amounts, rather than an exact amount. This can be used, for example, to fit a Renegade match into a larger route with variable output amounts.

The flow of this example is as follows:

1. Get a quote for the order
2. Assemble the quote into a bundle
3. Test out different values for the base amount
4. Decide on a base amount value, set it, and submit the bundle to the chain

_Note: [In-kind gas sponsorship](../in-kind-gas-sponsorship/README.md) is enabled by default. You can see this by inspecting your resulting TX._
