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
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center text-red-400 mb-6">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold mb-2">Wallet Locked</h2>
        <p className="text-gray-400 mb-8">Please unlock your wallet to view your receive address.</p>
        <button 
          onClick={() => router.push('/welcome')}
          className="px-8 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold transition-all"
        >
          Go to Wallet
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 relative z-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-12">
        <button 
          onClick={() => router.back()}
          className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-gray-400 hover:text-white"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-2xl font-bold tracking-tight">Receive Assets</h1>
        <div className="w-12 h-12"></div>
      </div>

      <div className="flex flex-col items-center gap-8">
        {/* QR Code Section */}
        <div className="relative group">
          <div className="absolute -inset-4 bg-blue-500/10 rounded-[3rem] blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
          <div className="relative p-8 rounded-[2.5rem] bg-white border border-white/10 shadow-2xl overflow-hidden">
            <QRCodeSVG
              value={address}
              size={240}
              level="H"
              bgColor="#FFFFFF"
              fgColor="#000000"
              includeMargin={false}
            />
          </div>
          {/* Decorative Elements */}
          <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg transform rotate-12 group-hover:rotate-0 transition-transform">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
        </div>

        <div className="w-full space-y-6 mt-4">
          <div className="text-center">
            <p className="text-gray-400 text-sm mb-4">Your Injective Address</p>
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 font-mono text-sm break-all relative group">
              <span className="text-blue-400">{address}</span>
            </div>
          </div>

          <button 
            onClick={handleCopy}
            className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all transform active:scale-95 ${
              copied ? 'bg-green-500/20 text-green-400 border border-green-500/20' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20'
            }`}
          >
            {copied ? (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Copied to Clipboard
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
                Copy Address
              </>
            )}
          </button>

          {/* Warning Banner */}
          <div className="p-6 rounded-2xl bg-orange-500/5 border border-orange-500/10 flex gap-4 items-start">
            <div className="p-2 rounded-lg bg-orange-500/10 text-orange-400 mt-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <p className="text-orange-400 font-bold text-sm mb-1 text-sm uppercase tracking-wider">Network: Injective</p>
              <p className="text-gray-400 text-sm leading-relaxed">
                Send only INJ tokens to this address over the Injective network. Other tokens or networks will result in permanent loss of funds.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {};
