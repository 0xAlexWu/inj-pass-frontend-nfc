/**
 * Send Cosmos transaction using Injective SDK
 */

import { 
  ChainGrpcBankApi,
  MsgSend,
  PrivateKey,
  TxGrpcApi,
  createTransaction,
  TxClient,
  BigNumberInBase,
} from '@injectivelabs/sdk-ts';
import { getNetworkEndpoints, Network } from '@injectivelabs/networks';
import type { CosmosChainConfig } from '@/types/chain';
import { DEFAULT_COSMOS_CHAIN } from '@/types/chain';

/**
 * Send a Cosmos transaction on Injective
 * 
 * @param privateKeyBytes - Private key (32 bytes)
 * @param toAddress - Recipient address (inj1...)
 * @param amount - Amount to send (in INJ as string)
 * @param chain - Cosmos chain configuration
 * @returns Transaction hash
 */
export async function sendCosmosTransaction(
  privateKeyBytes: Uint8Array,
  toAddress: string,
  amount: string,
  chain: CosmosChainConfig = DEFAULT_COSMOS_CHAIN
): Promise<string> {
  try {
    // Convert private key bytes to hex string
    const privateKeyHex = Array.from(privateKeyBytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    
    // Create PrivateKey instance
    const privateKey = PrivateKey.fromHex(privateKeyHex);
    const publicKey = privateKey.toPublicKey();
    const injectiveAddress = publicKey.toAddress().toBech32();

    console.log('[Cosmos] Sending from:', injectiveAddress, 'to:', toAddress);

    // Get network endpoints
    const endpoints = getNetworkEndpoints(Network.Mainnet);
    
    // Create gRPC clients
    const txClient = new TxClient({
      endpoints,
    });

    const chainGrpcBankApi = new ChainGrpcBankApi(endpoints.grpc);

    // Get account details (for sequence number)
    const accountDetails = await txClient.fetchAccount(injectiveAddress);
    const { baseAccount } = accountDetails;

    // Convert amount to base denom (multiply by 10^18)
    const amountInWei = new BigNumberInBase(amount).times(1e18).toFixed(0);

    // Create MsgSend
    const msg = MsgSend.fromJSON({
      srcInjectiveAddress: injectiveAddress,
      dstInjectiveAddress: toAddress,
      amount: {
        denom: 'inj',
        amount: amountInWei,
      },
    });

    // Prepare transaction
    const { signBytes, txRaw } = createTransaction({
      message: msg,
      memo: '',
      fee: {
        amount: [
          {
            denom: 'inj',
            amount: '200000000000000', // 0.0002 INJ
          },
        ],
        gas: '100000',
      },
      pubKey: publicKey.toBase64(),
      sequence: baseAccount.sequence,
      accountNumber: baseAccount.accountNumber,
      chainId: chain.chainId,
    });

    // Sign transaction
    const signature = await privateKey.sign(Buffer.from(signBytes));

    // Set signature
    txRaw.signatures = [signature];

    // Broadcast transaction
    const txGrpcApi = new TxGrpcApi(endpoints.grpc);
    const response = await txGrpcApi.broadcast(txRaw);

    if (response.code !== 0) {
      throw new Error(`Transaction failed: ${response.rawLog}`);
    }

    console.log('[Cosmos] Transaction sent:', response.txHash);
    return response.txHash;
  } catch (error) {
    console.error('[Cosmos] Send transaction error:', error);
    throw new Error(
      `Failed to send Cosmos transaction: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Estimate Cosmos transaction fee
 */
export async function estimateCosmosFee(): Promise<{
  amount: string;
  gas: string;
}> {
  return {
    amount: '0.0002', // 0.0002 INJ
    gas: '100000',
  };
}
