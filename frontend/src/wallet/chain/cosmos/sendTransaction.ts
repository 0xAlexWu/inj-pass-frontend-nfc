/**
 * Send Cosmos transaction using Injective SDK
 * All signing happens on the client side
 */

import {
  ChainRestAuthApi,
  createTransaction,
  MsgSend,
  TxClient,
  BaseAccount,
} from '@injectivelabs/sdk-ts';

const DEFAULT_FEE = {
  amount: [{ denom: 'inj', amount: '5000000000000000' }],
  gas: '200000',
};
import { Network, getNetworkEndpoints } from '@injectivelabs/networks';
import { PrivateKey } from '@injectivelabs/sdk-ts/dist/core/accounts/PrivateKey';

const INJECTIVE_NETWORK = Network.Mainnet;
const endpoints = getNetworkEndpoints(INJECTIVE_NETWORK);

/**
 * Send a Cosmos transaction
 * 
 * @param privateKey - Private key bytes (32 bytes)
 * @param to - Recipient Cosmos address (inj1...)
 * @param value - Amount to send (in INJ as string)
 */
export async function sendCosmosTransaction(
  privateKey: Uint8Array,
  to: string,
  value: string
): Promise<string> {
  try {
    // Convert private key to hex string
    const privateKeyHex = Array.from(privateKey)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    
    // Create private key instance
    const privateKeyInstance = PrivateKey.fromHex(privateKeyHex);
    const injectiveAddress = privateKeyInstance.toBech32('inj');
    
    const chainRestAuthApi = new ChainRestAuthApi(endpoints.lcd);

    // Get account details
    const accountDetailsResponse = await chainRestAuthApi.fetchAccount(injectiveAddress);
    const baseAccount = BaseAccount.fromRestApi(accountDetailsResponse);
    
    // Convert amount to proper format (INJ has 18 decimals)
    const amountInWei = BigInt(Math.floor(parseFloat(value) * 1e18));
    
    // Create MsgSend message
    const msg = MsgSend.fromJSON({
      amount: {
        denom: 'inj',
        amount: amountInWei.toString(),
      },
      srcInjectiveAddress: injectiveAddress,
      dstInjectiveAddress: to,
    });
    
    // Create transaction
    const { signBytes, txRaw } = createTransaction({
      message: msg,
      memo: '',
      fee: DEFAULT_FEE,
      pubKey: privateKeyInstance.toPublicKey().toBase64(),
      sequence: baseAccount.sequence,
      accountNumber: baseAccount.accountNumber,
      chainId: INJECTIVE_NETWORK.chainId,
    });
    
    // Sign transaction
    const signature = await privateKeyInstance.sign(Buffer.from(signBytes));
    
    // Append signature
    txRaw.signatures = [signature];
    
    // Broadcast transaction
    const txClient = new TxClient(endpoints.lcd);
    const response = await txClient.broadcast(txRaw);
    
    if (response.code !== 0) {
      throw new Error(`Transaction failed: ${response.rawLog || response.message || 'Unknown error'}`);
    }
    
    return response.txHash;
  } catch (error) {
    throw new Error(
      `Failed to send Cosmos transaction: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

