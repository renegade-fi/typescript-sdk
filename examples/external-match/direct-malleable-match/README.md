# Direct Malleable External Match Example

This example demonstrates how to request a malleable external match directly using the `requestMalleableExternalMatch` method. Unlike regular matches, malleable matches allow you to adjust the base or quote amount within specified bounds before submitting the transaction.

## Key Features

- **Direct Match Request**: Requests a malleable match directly without first getting a quote
- **Partial Fills**: Demonstrates how to set a specific base amount within the allowed bounds

## Usage

```bash
bun run index.ts
```

Or with environment variables:

```bash
API_KEY=your_api_key API_SECRET=your_api_secret PKEY=your_private_key bun run index.ts
```
