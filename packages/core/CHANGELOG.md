# @renegade-fi/core

## 0.5.2

### Patch Changes

- core: define standalone PriceReporterClient

## 0.5.1

### Patch Changes

- core: define and handle ws errors

## 0.5.0

### Minor Changes

- core: Use HSE in order history and task history actions

## 0.4.19

### Patch Changes

- add getTaskQueuePaused action

## 0.4.18

### Patch Changes

- core, node: Accept key config in execute transfer actions

## 0.4.17

### Patch Changes

- Return raw POST data if JSON cannot be parsed

## 0.4.16

### Patch Changes

- include query string in auth path

## 0.4.15

### Patch Changes

- expose history length params & useQuery util

## 0.4.14

### Patch Changes

- wasm: sign wallet using correct signing key

## 0.4.13

### Patch Changes

- implement external key management

## 0.4.12

### Patch Changes

- Added support for order updates between quote and assemble calls

## 0.4.11

### Patch Changes

- use getDefaultQuoteToken method instead of DEFAULT_QUOTES constant

## 0.4.10

### Patch Changes

- format token mapping from env var

## 0.4.9

### Patch Changes

- defer token mapping fetch to consumer

## 0.4.8

### Patch Changes

- export default quote & load token mapping method

## 0.4.6

### Patch Changes

- Use consistent naming in `getExternalMatchQuote`

## 0.4.5

### Patch Changes

- Add quote/assemble actions for external match client

## 0.4.4

### Patch Changes

- core: add fee details to external match bundle response

## 0.4.3

### Patch Changes

- core: allow `quote_amount` in external order, and `do_gas_estimation`

## 0.4.2

### Patch Changes

- wasm, core, react, node: add action to request external match bundles

## 0.4.1

### Patch Changes

- react: revert es module interop

## 0.4.0

### Minor Changes

- wasm: include public blinder in create-wallet

## 0.3.8

### Patch Changes

- Actions & utils for the new admin APIs

## 0.3.7

### Patch Changes

- core: tidy up

## 0.3.6

### Patch Changes

- wasm, core, react: update to api auth v2

## 0.3.5

### Patch Changes

- core: set defaults for worst case price and min fill size'

## 0.3.4

### Patch Changes

- core: expose limit parameter for getOrderHistory

## 0.3.3

### Patch Changes

- core: set default min fill size when creating an order

## 0.3.2

### Patch Changes

- wasm, core: add min fill amount

## 0.3.1

### Patch Changes

- chore: update metadata

## 0.3.0

### Minor Changes

- wasm, core: implement worst case price

## 0.2.0

### Minor Changes

- meta: ensure cookie storage rename
- ensure storage rename

## 0.1.0

### Minor Changes

- core: new storage key

## 0.0.53

### Patch Changes

- core, react: scrub console logs

## 0.0.52

### Patch Changes

- core: add refresh wallet task def

## 0.0.51

### Patch Changes

- pre-mainnet release

## 0.0.50

### Patch Changes

- wasm, core, react, node: implement keychain rotation

## 0.0.49

### Patch Changes

- wasm, core: update wallet parameterization

## 0.0.48

### Patch Changes

- order mutation & timestamped prices

## 0.0.47

### Patch Changes

- core: types: order: use timestamped prices in partial order fills

## 0.0.46

### Patch Changes

- core: allow client to get logs and force create wallet in connect

## 0.0.45

### Patch Changes

- core: prevent create wallet when rpc getLogs req fails

## 0.0.44

### Patch Changes

- set viem as config option and export cookie storage module

## 0.0.43

### Patch Changes

- core, react: delay setting init flag until after rehydration

## 0.0.42

### Patch Changes

- core: Add Arbitrum Sepolia

## 0.0.41

### Patch Changes

- core, react: changes for quoter dashboard

## 0.0.40

### Patch Changes

- core: downstream API changes for orders / tasks

## 0.0.39

### Patch Changes

- core: react, remove `seed` parameter, fix connect / reconnect logic

## 0.0.38

### Patch Changes

- core, react: add ping query, fix lookup wallet log

## 0.0.37

### Patch Changes

- core: increase lookup wallet timeout

## 0.0.36

### Patch Changes

- core: add refresh wallet action

## 0.0.35

### Patch Changes

- use proxied exports

## 0.0.34

### Patch Changes

- export hooks

## 0.0.33

### Patch Changes

- add back of queue queries, remove placeholder block explorer url

## 0.0.32

### Patch Changes

- react: prevent orderbook refetching

## 0.0.31

### Patch Changes

- use react-query for queries

## 0.0.30

### Patch Changes

- set token mapping using env var

## 0.0.29

### Patch Changes

- use core connect function in all packages

## 0.0.28

### Patch Changes

- update testnet token mapping

## 0.0.27

### Patch Changes

- add function to wait for wallet indexing completion

## 0.0.26

### Patch Changes

- prevent deposit if MAX_BALANCES would be exceeded

## 0.0.25

### Patch Changes

- core, react: fix bigint parsing error

## 0.0.24

### Patch Changes

- adjust decimal count in formatAmount fn

## 0.0.23

### Patch Changes

- core: error if order would result in too many balances

## 0.0.22

### Patch Changes

- use env variable for network detection

## 0.0.21

### Patch Changes

- wasm: implement fix for signature generation

## 0.0.20

### Patch Changes

- wasm: implement fix for signature generation

## 0.0.19

### Patch Changes

- Add function to reinitialize store if user does not want persistence

## 0.0.18

### Patch Changes

- Parse all numerical values as bigint

## 0.0.17

### Patch Changes

- Move node specific connect logic

## 0.0.16

### Patch Changes

- Add /v0 suffix

## 0.0.15

### Patch Changes

- Allow for insecure transport to be set in config

## 0.0.14

### Patch Changes

- Handle lookup/create wallet errors gracefully

## 0.0.13

### Patch Changes

- Init node package

## 0.0.12

### Patch Changes

- remove /dist from vc

## 0.0.11

### Patch Changes

- Queue withdraw after pay fees

## 0.0.10

### Patch Changes

- Prevent orderbook jitter

## 0.0.9

### Patch Changes

- Add Biome

## 0.0.8

### Patch Changes

- Fix useBalances filter

## 0.0.7

### Patch Changes

- Add missing Task types

## 0.0.6

### Patch Changes

- Add task history hooks

## 0.0.5

### Patch Changes

- add fees action and hook

## 0.0.4

### Patch Changes

- add back of queue route

## 0.0.3

### Patch Changes

- add rpc url as config parameter

## 0.0.2

### Patch Changes

- add darkpool contract addr as config parameter

## 0.0.1

### Patch Changes

- Initialize
