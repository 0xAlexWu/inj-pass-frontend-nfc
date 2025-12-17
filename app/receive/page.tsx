'use client';

import { useRouter } from 'next/navigation';
import { useWallet } from '@/contexts/WalletContext';
import { QRCodeSVG } from 'qrcode.react';
import { useState } from 'react';

export default function ReceivePage() {
  const router = useRouter();
  const { isUnlocked, address } = useWallet();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isUnlocked || !address) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>Please unlock your wallet first</div>
        <button onClick={() => router.push('/welcome')} style={styles.btn}>
          Go to Wallet
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <button onClick={() => router.back()} style={styles.backBtn}>
          ← Back
        </button>
        <h1 style={styles.title}>Receive INJ</h1>
        <div style={{ width: '60px' }} />
      </header>

      <div style={styles.content}>
        <div style={styles.instructions}>
          Share this address to receive INJ tokens
        </div>

        <div style={styles.qrContainer}>
          <QRCodeSVG
            value={address}
            size={220}
            level="M"
            bgColor="var(--surface)"
            fgColor="var(--primary-text)"
          />
        </div>

        <div style={styles.addressCard}>
          <div style={styles.addressLabel}>Your Address</div>
          <div style={styles.addressValue}>
            {address.slice(0, 20)}...
            <br />
            ...{address.slice(-20)}
          </div>
        </div>

        <button onClick={handleCopy} style={styles.copyButton}>
          {copied ? '✓ Copied!' : '📋 Copy Address'}
        </button>

        <div style={styles.warning}>
          <div style={styles.warningIcon}>⚠️</div>
          <div style={styles.warningText}>
            Only send INJ tokens on Injective EVM network to this address.
            Sending other tokens or using wrong network may result in permanent loss.
          </div>
        </div>
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
  content: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1.5rem',
  },
  instructions: {
    fontSize: '0.875rem',
    color: 'var(--secondary-text)',
    textAlign: 'center',
  },
  qrContainer: {
    padding: '1.5rem',
    backgroundColor: 'var(--surface)',
    borderRadius: '16px',
    border: '2px solid var(--surface-border)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
  },
  addressCard: {
    width: '100%',
    padding: '1.5rem',
    backgroundColor: 'var(--surface-muted)',
    borderRadius: '12px',
    textAlign: 'center',
  },
  addressLabel: {
    fontSize: '0.75rem',
    fontWeight: '600',
    color: 'var(--secondary-text)',
    textTransform: 'uppercase',
    marginBottom: '0.5rem',
  },
  addressValue: {
    fontSize: '0.875rem',
    fontFamily: 'monospace',
    color: 'var(--primary-text)',
    wordBreak: 'break-all',
    lineHeight: '1.6',
  },
  copyButton: {
    width: '100%',
    padding: '1rem',
    fontSize: '1rem',
    fontWeight: '600',
    backgroundColor: 'var(--accent-color)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'transform 0.1s',
  },
  warning: {
    display: 'flex',
    gap: '0.75rem',
    padding: '1rem',
    backgroundColor: '#FFF3CD',
    border: '1px solid #FFD700',
    borderRadius: '8px',
    marginTop: '1rem',
  },
  warningIcon: {
    fontSize: '1.25rem',
    flexShrink: 0,
  },
  warningText: {
    fontSize: '0.75rem',
    color: '#856404',
    lineHeight: '1.5',
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
};
