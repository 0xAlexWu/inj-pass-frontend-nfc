/**
 * Chain configuration types
 */

import type { Chain } from 'viem';

export interface ChainConfig {
  id: number;
  name: string;
  rpcUrl: string;
  explorerUrl: string;
  explorerApiUrl: string; // Blockscout API base URL (separate from frontend)
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

export interface TransactionRequest {
  to: string;
  value?: bigint;
  data?: `0x${string}`;
  gasLimit?: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
}

export interface TransactionReceipt {
  hash: string;
  from: string;
  to: string | null;
  value: bigint;
  gasUsed: bigint;
  effectiveGasPrice: bigint;
  blockNumber: bigint;
  blockHash: string;
  status: 'success' | 'reverted';
  timestamp?: number;
}

export interface TransactionHistory {
  hash: string;
  from: string;
  to: string | null;
  value: string; // Wei as string
  timestamp: number;
  blockNumber: number;
  status: 'pending' | 'success' | 'failed';
  gasUsed?: string;
  gasPrice?: string;
}

export interface Balance {
  value: bigint;
  formatted: string;
  decimals: number;
  symbol: string;
}

export interface GasEstimate {
  gasLimit: bigint;
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
  totalCost: bigint; // in wei
}

// Injective EVM Testnet
export const INJECTIVE_TESTNET: ChainConfig = {
  id: 1439,
  name: 'Injective EVM Testnet',
  rpcUrl: 'https://k8s.testnet.json-rpc.injective.network/',
  explorerUrl: 'https://testnet.blockscout.injective.network',
  explorerApiUrl: 'https://testnet.blockscout-api.injective.network',
  nativeCurrency: {
    name: 'Injective',
    symbol: 'INJ',
    decimals: 18,
  },
};

// Injective EVM Mainnet - CORRECT Configuration
export const INJECTIVE_MAINNET: ChainConfig = {
  id: 1776,  // Correct Chain ID for Injective EVM Mainnet
  name: 'Injective EVM',
  rpcUrl: 'https://sentry.evm-rpc.injective.network/',
  explorerUrl: 'https://blockscout.injective.network',
  explorerApiUrl: 'https://blockscout-api.injective.network',
  nativeCurrency: {
    name: 'Injective',
    symbol: 'INJ',
    decimals: 18,
  },
};

// Viem-compatible Chain configs for DEX swap - MAINNET (CORRECT)
export const INJECTIVE_MAINNET_CHAIN: Chain = {
  id: 1776,  // Correct Chain ID
  name: 'Injective EVM',
  nativeCurrency: {
    name: 'Injective',
    symbol: 'INJ',
    decimals: 18,
  },
  rpcUrls: {
    default: { 
      http: ['https://sentry.evm-rpc.injective.network/']
    },
  },
  blockExplorers: {
    default: { 
      name: 'Blockscout', 
      url: 'https://blockscout.injective.network' 
    },
  },
};

export const INJECTIVE_TESTNET_CHAIN: Chain = {
  id: 1439,
  name: 'Injective EVM Testnet',
  nativeCurrency: {
    name: 'Injective',
    symbol: 'INJ',
    decimals: 18,
  },
  rpcUrls: {
    default: { 
      http: ['https://k8s.testnet.json-rpc.injective.network/']
    },
  },
  blockExplorers: {
    default: { 
      name: 'Blockscout', 
      url: 'https://testnet.blockscout.injective.network' 
    },
  },
};

// Injective Cosmos Network Configuration
export interface CosmosChainConfig {
  chainId: string;
  chainName: string;
  rpc: string;
  rest: string;
  grpc: string;
  explorerUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
    denom: string;
  };
}

// Injective Cosmos Mainnet (injective-1)
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

// Default chain - USE MAINNET
export const DEFAULT_CHAIN = INJECTIVE_MAINNET;
export const DEFAULT_COSMOS_CHAIN = INJECTIVE_COSMOS_MAINNET;
