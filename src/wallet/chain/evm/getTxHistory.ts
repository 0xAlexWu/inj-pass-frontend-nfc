/**
 * Get transaction history for an address
 * 
 * Note: Basic implementation using RPC calls
 * For production, consider using block explorer API (e.g., Etherscan-like API)
 */

import { createPublicClient, http, type Address, type Block } from 'viem';
import { TransactionHistory, ChainConfig, DEFAULT_CHAIN } from '@/types/chain';

/**
 * Get recent transactions for an address
 * 
 * @param address - Address to query
 * @param limit - Maximum number of transactions to return
 * @param chain - Chain configuration
 */
export async function getTxHistory(
  address: string,
  limit: number = 10,
  chain: ChainConfig = DEFAULT_CHAIN
): Promise<TransactionHistory[]> {
  try {
    const client = createPublicClient({
      transport: http(chain.rpcUrl),
    });

    // OPTIMIZATION: For testnet/development, return empty array to avoid excessive RPC calls
    // In production, use a block explorer API like Etherscan/Blockscout instead of scanning blocks
    // Scanning blocks one-by-one is inefficient and causes 20+ RPC requests per page load
    
    // TODO: Integrate with Injective Explorer API or indexer service
    // Example: https://testnet.explorer.injective.network/api/...
    
    console.warn('getTxHistory: Block scanning disabled. Use explorer API for transaction history.');
    return [];
  } catch (error) {
    throw new Error(
      `Failed to get transaction history: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Get transaction receipt to check status
 */
export async function getTransactionStatus(
  txHash: string,
  chain: ChainConfig = DEFAULT_CHAIN
): Promise<'pending' | 'success' | 'failed'> {
  try {
    const client = createPublicClient({
      transport: http(chain.rpcUrl),
    });

    const receipt = await client.getTransactionReceipt({
      hash: txHash as `0x${string}`,
    });

    return receipt.status === 'success' ? 'success' : 'failed';
  } catch (error) {
    // If receipt not found, transaction is likely pending
    return 'pending';
  }
}

/**
 * Wait for transaction confirmation
 */
export async function waitForTransaction(
  txHash: string,
  chain: ChainConfig = DEFAULT_CHAIN,
  confirmations: number = 1
): Promise<TransactionHistory> {
  try {
    const client = createPublicClient({
      transport: http(chain.rpcUrl),
    });

    const receipt = await client.waitForTransactionReceipt({
      hash: txHash as `0x${string}`,
      confirmations,
    });

    const block = await client.getBlock({
      blockHash: receipt.blockHash,
    });

    return {
      hash: receipt.transactionHash,
      from: receipt.from,
      to: receipt.to || null,
      value: '0', // Would need full tx data
      timestamp: Number(block.timestamp),
      blockNumber: Number(receipt.blockNumber),
      status: receipt.status === 'success' ? 'success' : 'failed',
      gasUsed: receipt.gasUsed.toString(),
      gasPrice: receipt.effectiveGasPrice.toString(),
    };
  } catch (error) {
    throw new Error(
      `Failed to wait for transaction: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
