# Smart Network Routing

## Overview

The Send page now automatically detects the recipient address type and uses the appropriate Injective network for transactions.

## How It Works

### Address Detection

1. **EVM Addresses** (0x...): 42 characters starting with "0x"
2. **Cosmos Addresses** (inj1...): Bech32 format starting with "inj1"

### Network Selection

| Address Type | Network Used | Chain ID | RPC Endpoint |
|-------------|-------------|----------|--------------|
| `0x...` | Injective EVM | 1776 | https://sentry.evm-rpc.injective.network/ |
| `inj1...` | Injective Cosmos | injective-1 | https://sentry.tm.injective.network:443 |

## Features

### 1. Address Conversion
- Click the conversion button to switch between EVM and Cosmos formats
- Uses official Injective SDK for accurate conversion
- Example: `0x52626849f76523100b2321b98d31f7d275ff95d6` ↔ `inj12f3xsj0hv533qzeryxuc6v0h6f6ll9wk4fhz52`

### 2. Network Indicator
- Visual indicator shows which network will be used
- Displays chain ID and network type
- Updates automatically when recipient address changes

### 3. Gas Estimation
- **EVM**: Dynamic gas estimation using JSON-RPC
- **Cosmos**: Fixed fee estimation (~0.0002 INJ)

### 4. Transaction Flow

#### EVM Transaction (0x... addresses)
```typescript
// Uses viem library
sendTransaction(
  privateKey,
  recipientAddress, // 0x...
  amount,
  undefined,
  INJECTIVE_MAINNET // Chain ID 1776
)
```

#### Cosmos Transaction (inj1... addresses)
```typescript
// Uses @injectivelabs/sdk-ts
sendCosmosTransaction(
  privateKey,
  recipientAddress, // inj1...
  amount,
  INJECTIVE_COSMOS_MAINNET // Chain ID injective-1
)
```

## Configuration

### EVM Network (src/types/chain.ts)
```typescript
export const INJECTIVE_MAINNET: ChainConfig = {
  id: 1776,
  name: 'Injective EVM',
  rpcUrl: 'https://sentry.evm-rpc.injective.network/',
  explorerUrl: 'https://blockscout.injective.network',
  nativeCurrency: {
    name: 'Injective',
    symbol: 'INJ',
    decimals: 18,
  },
};
```

### Cosmos Network (src/types/chain.ts)
```typescript
export const INJECTIVE_COSMOS_MAINNET: CosmosChainConfig = {
  chainId: 'injective-1',
  chainName: 'Injective',
  rpc: 'https://sentry.tm.injective.network:443',
  rest: 'https://sentry.lcd.injective.network:443',
  grpc: 'sentry.chain.grpc.injective.network:443',
  explorerUrl: 'https://explorer.injective.network',
  nativeCurrency: {
    name: 'Injective',
    symbol: 'INJ',
    decimals: 18,
    denom: 'inj',
  },
};
```

## User Experience

### Sending to EVM Address
1. Enter or scan recipient address (0x...)
2. See "Using EVM Network" indicator
3. Enter amount
4. View gas estimate (dynamic calculation)
5. Send transaction
6. Transaction executed on Injective EVM (chain 1776)

### Sending to Cosmos Address
1. Enter or scan recipient address (inj1...)
   - Or convert from EVM address using conversion button
2. See "Using Cosmos Network" indicator
3. Enter amount
4. View fixed fee estimate (~0.0002 INJ)
5. Send transaction
6. Transaction executed on Injective Cosmos (injective-1)

## Benefits

1. **Seamless Experience**: Users don't need to manually select networks
2. **Error Prevention**: Prevents sending to wrong network
3. **Flexibility**: Supports both EVM and Cosmos ecosystems
4. **Accuracy**: Uses official Injective SDK for address conversion

## Technical Details

### Dependencies
- `viem`: EVM transaction handling
- `@injectivelabs/sdk-ts`: Cosmos transaction handling
- `@injectivelabs/networks`: Network configuration

### Files Modified
- `app/send/page.tsx`: UI and routing logic
- `src/types/chain.ts`: Network configurations
- `src/wallet/chain/cosmos/sendTransaction.ts`: Cosmos transaction implementation

## Testing

### Test EVM Transaction
```
Recipient: 0x52626849f76523100b2321b98d31f7d275ff95d6
Expected Network: Injective EVM (1776)
Expected Indicator: "Using EVM Network"
```

### Test Cosmos Transaction
```
Recipient: inj12f3xsj0hv533qzeryxuc6v0h6f6ll9wk4fhz52
Expected Network: Injective Cosmos (injective-1)
Expected Indicator: "Using Cosmos Network"
```

### Test Conversion
```
Input: 0x52626849f76523100b2321b98d31f7d275ff95d6
Click Convert →
Output: inj12f3xsj0hv533qzeryxuc6v0h6f6ll9wk4fhz52
Network Changes: EVM → Cosmos
```
