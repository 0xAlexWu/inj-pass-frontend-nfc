/**
 * Wallet context for global state management
 */

'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { LocalKeystore } from '@/types/wallet';
import { loadWallet, hasWallet, deleteWallet } from '@/wallet/keystore';

interface WalletContextType {
  isUnlocked: boolean;
  address: string | null;
  keystore: LocalKeystore | null;
  privateKey: Uint8Array | null;
  unlock: (pk: Uint8Array, ks: LocalKeystore) => void;
  lock: () => void;
  checkExistingWallet: () => boolean;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [keystore, setKeystore] = useState<LocalKeystore | null>(null);
  const [privateKey, setPrivateKey] = useState<Uint8Array | null>(null);

  // Check for existing wallet on mount
  useEffect(() => {
    const existing = loadWallet();
    if (existing) {
      setKeystore(existing);
      setAddress(existing.address);
    }
  }, []);

  const unlock = (pk: Uint8Array, ks: LocalKeystore) => {
    setPrivateKey(pk);
    setKeystore(ks);
    setAddress(ks.address);
    setIsUnlocked(true);
  };

  const lock = () => {
    setPrivateKey(null);
    setIsUnlocked(false);
  };

  const checkExistingWallet = () => {
    return hasWallet();
  };

  return (
    <WalletContext.Provider
      value={{
        isUnlocked,
        address,
        keystore,
        privateKey,
        unlock,
        lock,
        checkExistingWallet,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within WalletProvider');
  }
  return context;
}
