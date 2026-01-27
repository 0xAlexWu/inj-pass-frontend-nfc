'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/contexts/WalletContext';
import { estimateGas, sendTransaction } from '@/wallet/chain';
import { INJECTIVE_TESTNET, GasEstimate } from '@/types/chain';

export default function SendPage() {
  const router = useRouter();
  const { isUnlocked, privateKey } = useWallet();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [gasEstimate, setGasEstimate] = useState<GasEstimate | null>(null);
  const [loading, setLoading] = useState(false);
  const [estimating, setEstimating] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [error, setError] = useState('');

  const handleEstimate = async () => {
    if (!recipient || !amount || !privateKey) return;

    setEstimating(true);
    setError('');
    
    try {
      const estimate = await estimateGas(
        '', // from address not needed for estimate
        recipient,
        amount,
        undefined,
        INJECTIVE_TESTNET
      );
      setGasEstimate(estimate);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to estimate gas');
    } finally {
      setEstimating(false);
    }
  };

  const handleSend = async () => {
    if (!recipient || !amount || !privateKey) return;

    setLoading(true);
    setError('');
    setTxHash('');
    
    try {
      const hash = await sendTransaction(
        privateKey,
        recipient,
        amount,
        undefined,
        INJECTIVE_TESTNET
      );
      
      setTxHash(hash);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send transaction');
    } finally {
      setLoading(false);
    }
  };

  if (!isUnlocked) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>Please unlock your wallet first</div>
        <button onClick={() => router.push('/welcome')} style={styles.btn}>
          Go to Wallet
        </button>
      </div>
    );
  }

  if (txHash) {
    return (
      <div style={styles.container}>
        <div style={styles.success}>
          <div style={styles.successIcon}>✅</div>
          <h2 style={styles.successTitle}>Transaction Sent!</h2>
          <div style={styles.txHash}>
            <div style={styles.label}>Transaction Hash</div>
            <div style={styles.hashValue}>{txHash.slice(0, 10)}...{txHash.slice(-8)}</div>
            <button
              onClick={() => navigator.clipboard.writeText(txHash)}
              style={styles.copyBtn}
            >
              Copy Full Hash
            </button>
          </div>
          <a
            href={`${INJECTIVE_TESTNET.explorerUrl}/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            style={styles.explorerLink}
          >
            View on Explorer →
          </a>
          <button onClick={() => router.push('/dashboard')} style={styles.primaryBtn}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <button 
          onClick={() => router.back()}
          className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-gray-400 hover:text-white"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 style={styles.title}>Send INJ</h1>
        <div style={{ width: '60px' }} />
      </header>

      {error && (
        <div style={styles.errorBanner}>
          {error}
        </div>
      )}

      <div style={styles.form}>
        <div style={styles.field}>
          <label style={styles.label}>Recipient Address</label>
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="0x..."
            style={styles.input}
          />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Amount (INJ)</label>
          <input
            type="text"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.001"
            style={styles.input}
          />
        </div>

        <button
          onClick={handleEstimate}
          disabled={!recipient || !amount || estimating}
          style={styles.estimateBtn}
        >
          {estimating ? 'Estimating...' : '⛽ Estimate Gas'}
        </button>

        {gasEstimate && (
          <div style={styles.gasCard}>
            <div style={styles.gasRow}>
              <span>Gas Limit:</span>
              <span>{gasEstimate.gasLimit.toString()}</span>
            </div>
            <div style={styles.gasRow}>
              <span>Max Fee:</span>
              <span>{(Number(gasEstimate.maxFeePerGas) / 1e9).toFixed(2)} Gwei</span>
            </div>
            <div style={styles.gasRow}>
              <span>Est. Cost:</span>
              <span>{(Number(gasEstimate.totalCost) / 1e18).toFixed(6)} INJ</span>
            </div>
          </div>
        )}

        <button
          onClick={handleSend}
          disabled={!recipient || !amount || loading || !gasEstimate}
          style={{
            ...styles.primaryBtn,
            opacity: !recipient || !amount || loading || !gasEstimate ? 0.5 : 1,
          }}
        >
          {loading ? 'Sending...' : '📤 Send Transaction'}
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    padding: '1.5rem',
    backgroundColor: 'var(--bg-color)',
    maxWidth: '600px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
  },
  backBtn: {
    padding: '0.5rem 1rem',
    fontSize: '0.875rem',
    backgroundColor: 'transparent',
    border: 'none',
    color: 'var(--primary-text)',
    cursor: 'pointer',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: 'var(--primary-text)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  label: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: 'var(--primary-text)',
  },
  input: {
    padding: '0.75rem',
    fontSize: '1rem',
    border: '2px solid var(--surface-border)',
    borderRadius: '8px',
    backgroundColor: 'var(--surface)',
    color: 'var(--primary-text)',
    fontFamily: 'monospace',
  },
  estimateBtn: {
    padding: '0.75rem',
    fontSize: '0.875rem',
    backgroundColor: 'var(--surface-muted)',
    border: '2px solid var(--surface-border)',
    borderRadius: '8px',
    color: 'var(--primary-text)',
    cursor: 'pointer',
  },
  gasCard: {
    padding: '1rem',
    backgroundColor: 'var(--surface-muted)',
    borderRadius: '8px',
    fontSize: '0.875rem',
  },
  gasRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '0.5rem 0',
    color: 'var(--primary-text)',
  },
  primaryBtn: {
    padding: '1rem',
    fontSize: '1rem',
    fontWeight: '600',
    backgroundColor: 'var(--accent-color)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
  },
  errorBanner: {
    padding: '1rem',
    marginBottom: '1.5rem',
    backgroundColor: '#FEE',
    border: '1px solid #F88',
    borderRadius: '8px',
    color: '#C00',
    fontSize: '0.875rem',
  },
  error: {
    textAlign: 'center',
    padding: '2rem',
    color: 'var(--secondary-text)',
  },
  btn: {
    padding: '0.75rem 1.5rem',
    fontSize: '1rem',
    backgroundColor: 'var(--accent-color)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    margin: '0 auto',
    display: 'block',
  },
  success: {
    textAlign: 'center',
    paddingTop: '3rem',
  },
  successIcon: {
    fontSize: '4rem',
    marginBottom: '1rem',
  },
  successTitle: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: 'var(--primary-text)',
    marginBottom: '2rem',
  },
  txHash: {
    padding: '1.5rem',
    backgroundColor: 'var(--surface-muted)',
    borderRadius: '12px',
    marginBottom: '1rem',
  },
  hashValue: {
    fontSize: '1rem',
    fontFamily: 'monospace',
    color: 'var(--primary-text)',
    marginTop: '0.5rem',
    marginBottom: '1rem',
  },
  copyBtn: {
    padding: '0.5rem 1rem',
    fontSize: '0.875rem',
    backgroundColor: 'var(--accent-color)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  explorerLink: {
    display: 'inline-block',
    padding: '0.75rem 1.5rem',
    marginBottom: '2rem',
    fontSize: '0.875rem',
    color: 'var(--accent-color)',
    textDecoration: 'none',
    border: '2px solid var(--accent-color)',
    borderRadius: '8px',
  },
};
