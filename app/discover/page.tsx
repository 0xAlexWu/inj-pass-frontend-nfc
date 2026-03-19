'use client';

import { useRouter } from 'next/navigation';
import { useWallet } from '@/contexts/WalletContext';
import { useState } from 'react';
import AccountHeader from '../components/AccountHeader';

type DAppCategory = 'all' | 'defi' | 'nft' | 'game' | 'social' | 'dao';
type EmbeddedSurface = 'discover' | 'agent';

interface DApp {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: DAppCategory;
  url: string;
  featured?: boolean;
}

const DAPPS: DApp[] = [
  {
    id: '9',
    name: 'Omisper',
    description: 'Decentralized Social Platform',
    icon: '/omisper.png',
    category: 'social',
    url: 'https://omisper-front.pages.dev/',
    featured: true,
  },
  {
    id: '10',
    name: 'Hash Mahjong',
    description: 'Injective EVM Mini Game',
    icon: '/hashmahjong.png',
    category: 'game',
    url: 'https://hash-mahjong-two.vercel.app/',
    featured: true,
  },
  {
    id: '1',
    name: 'Helix',
    description: 'Decentralized Derivatives Trading',
    icon: 'https://www.google.com/s2/favicons?domain=helixapp.com&sz=128',
    category: 'defi',
    url: 'https://helixapp.com',
    featured: true,
  },
  {
    id: '2',
    name: 'Name Service',
    description: '.inj Domain Names',
    icon: 'https://www.google.com/s2/favicons?domain=inj.space.id&sz=128',
    category: 'defi',
    url: 'https://www.inj.space.id/',
    featured: true,
  },
  {
    id: '3',
    name: 'Paradyze',
    description: 'Yield & Structured Products',
    icon: 'https://www.google.com/s2/favicons?domain=paradyze.io&sz=128',
    category: 'defi',
    url: 'https://www.paradyze.io/',
  },
  {
    id: '4',
    name: 'Talis',
    description: 'NFT Marketplace',
    icon: 'https://www.google.com/s2/favicons?domain=talis.art&sz=128',
    category: 'nft',
    url: 'https://talis.art',
  },
  {
    id: '5',
    name: 'Rarible',
    description: 'Multichain NFT Marketplace',
    icon: 'https://www.google.com/s2/favicons?domain=rarible.com&sz=128',
    category: 'nft',
    url: 'https://rarible.com',
  },
  {
    id: '8',
    name: 'n1nj4',
    description: 'NFT Marketplace',
    icon: 'https://www.google.com/s2/favicons?domain=n1nj4.fun&sz=128',
    category: 'nft',
    url: 'https://www.n1nj4.fun/',
  },
  {
    id: '6',
    name: 'Injective Hub',
    description: 'Governance & Staking',
    icon: 'https://www.google.com/s2/favicons?domain=hub.injective.network&sz=128',
    category: 'dao',
    url: 'https://hub.injective.network',
  },
  {
    id: '7',
    name: 'Choice',
    description: 'DEX Aggregator & Vaults',
    icon: 'https://www.google.com/s2/favicons?domain=choice.exchange&sz=128',
    category: 'defi',
    url: 'https://choice.exchange',
  },
];

const CATEGORIES = [
  { id: 'all', name: 'New' },
  { id: 'defi', name: 'DeFi' },
  { id: 'nft', name: 'NFT' },
  { id: 'game', name: 'Game' },
  { id: 'social', name: 'Social' },
] as const;

function SearchBox({
  value,
  onChange,
  onClear,
}: {
  value: string;
  onChange: (next: string) => void;
  onClear: () => void;
}) {
  return (
    <div className="relative">
      <input
        type="text"
        placeholder="Search dApps..."
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-11 pr-11 text-sm text-white placeholder-gray-500 outline-none transition-all focus:border-white/20"
      />
      <svg className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <circle cx="11" cy="11" r="8" strokeWidth={2} />
        <path d="m21 21-4.35-4.35" strokeWidth={2} strokeLinecap="round" />
      </svg>
      {value && (
        <button
          onClick={onClear}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-white"
          title="Clear search"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

export default function DiscoverPage() {
  const router = useRouter();
  const { isUnlocked, address, isCheckingSession } = useWallet();
  const [activeCategory, setActiveCategory] = useState<DAppCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [embeddedSurface, setEmbeddedSurface] = useState<EmbeddedSurface>('discover');
  const [isEmbedded] = useState(() => {
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).get('embed') === '1';
  });

  const navigateApp = (path: string) => {
    if (typeof window !== 'undefined' && isEmbedded && window.top) {
      window.top.location.assign(path);
      return;
    }
    router.push(path);
  };

  const handleDAppClick = (dapp: DApp) => {
    window.open(dapp.url, '_blank', 'noopener,noreferrer');
  };

  if (isCheckingSession) {
    return (
      <div className={`flex items-center justify-center ${isEmbedded ? 'h-full bg-black' : 'min-h-screen bg-black'}`}>
        <div className="h-8 w-8 rounded-full border-2 border-white/15 border-t-white animate-spin" />
      </div>
    );
  }

  if (!isUnlocked) {
    navigateApp('/');
    return null;
  }

  const filteredDapps = DAPPS.filter((dapp) => {
    const matchesCategory = activeCategory === 'all' || dapp.category === activeCategory;
    const matchesSearch =
      dapp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dapp.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const featuredDapps = DAPPS.filter((dapp) => dapp.featured);

  return (
    <div className={isEmbedded ? 'h-full bg-black' : 'min-h-screen bg-black'}>
      {!isEmbedded && (
        <div className="bg-gradient-to-b from-white/5 to-transparent border-b border-white/5 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="mb-6">
              <AccountHeader
                address={address || undefined}
                showFaucetButton={true}
                onFaucetClick={() => navigateApp('/faucet')}
                showScanButton={true}
                onScanClick={() => {}}
              />
            </div>
            <div className="rounded-2xl border border-white/10 bg-black p-4">
              <SearchBox value={searchQuery} onChange={setSearchQuery} onClear={() => setSearchQuery('')} />
            </div>
          </div>
        </div>
      )}

      {isEmbedded ? (
        <div className="flex h-full flex-col gap-4 p-4">
          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0">
                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gray-500">Discover</div>
                <div className="mt-1 text-base font-bold text-white">Explore apps horizontally</div>
                <div className="mt-1 max-w-2xl text-sm text-gray-400">
                  Browse Injective apps in one rail. AI is now folded into this same surface instead of taking another full container.
                </div>
              </div>

              <div className="flex w-full flex-col gap-3 xl:w-[420px] xl:flex-shrink-0">
                <SearchBox value={searchQuery} onChange={setSearchQuery} onClear={() => setSearchQuery('')} />
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                  {CATEGORIES.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setActiveCategory(category.id as DAppCategory)}
                      className={`flex items-center gap-2 whitespace-nowrap rounded-full border px-4 py-2.5 text-xs font-semibold transition-all ${
                        activeCategory === category.id
                          ? 'border-white bg-white text-black'
                          : 'border-white/10 bg-white/[0.03] text-gray-300 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <span>{category.name}</span>
                      <span className={`text-[10px] ${activeCategory === category.id ? 'text-black/70' : 'text-gray-500'}`}>
                        {category.id === 'all' ? DAPPS.length : DAPPS.filter((dapp) => dapp.category === category.id).length}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {embeddedSurface === 'discover' ? (
            <div className="flex min-h-0 flex-1 flex-col rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4">
              {!searchQuery && (
                <div className="mb-5">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gray-500">Featured</div>
                    <div className="text-xs text-gray-500">Swipe sideways</div>
                  </div>

                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    <button
                      onClick={() => setEmbeddedSurface('agent')}
                      className="group relative min-w-[280px] rounded-[1.6rem] border border-[#6e5dff]/25 bg-[radial-gradient(circle_at_top_left,rgba(110,93,255,0.28),transparent_52%),linear-gradient(135deg,rgba(76,58,249,0.24),rgba(255,255,255,0.04))] p-5 text-left transition-all hover:border-[#8b7bff]/45 hover:translate-y-[-1px]"
                    >
                      <div className="absolute right-4 top-4 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-100">
                        AI
                      </div>
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-xl text-white shadow-[0_12px_30px_rgba(76,58,249,0.18)]">
                        λ
                      </div>
                      <div className="mt-4">
                        <div className="text-lg font-bold text-white">Lambda Agent</div>
                        <div className="mt-2 text-sm leading-6 text-blue-100/85">
                          Ask about balances, swaps, and wallet actions without leaving Discover.
                        </div>
                      </div>
                      <div className="mt-5 flex items-center justify-between text-xs text-blue-100/80">
                        <span>Open AI workspace</span>
                        <span className="rounded-full border border-white/10 bg-white/10 px-2.5 py-1">Embedded</span>
                      </div>
                    </button>

                    {featuredDapps.map((dapp) => (
                      <button
                        key={dapp.id}
                        onClick={() => handleDAppClick(dapp)}
                        className="min-w-[260px] rounded-[1.6rem] border border-white/10 bg-white/[0.04] p-5 text-left transition-all hover:bg-white/10 hover:translate-y-[-1px]"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-white p-2 shadow-lg">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={dapp.icon} alt={dapp.name} className="h-full w-full object-contain" />
                          </div>
                          <div className="min-w-0">
                            <div className="truncate text-sm font-bold text-white">{dapp.name}</div>
                            <div className="mt-1 text-xs uppercase tracking-[0.18em] text-gray-500">{dapp.category}</div>
                          </div>
                        </div>
                        <div className="mt-4 line-clamp-2 text-sm leading-6 text-gray-400">{dapp.description}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mb-3 flex items-center justify-between">
                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gray-500">
                  {activeCategory === 'all' ? 'App rail' : `${CATEGORIES.find((item) => item.id === activeCategory)?.name} rail`}
                </div>
                <div className="text-xs text-gray-500">{filteredDapps.length} results</div>
              </div>

              {filteredDapps.length === 0 ? (
                <div className="flex min-h-[220px] flex-1 items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 text-center text-sm text-gray-400">
                  Try adjusting your search or filters.
                </div>
              ) : (
                <div className="flex min-h-0 flex-1 gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {filteredDapps.map((dapp) => (
                    <button
                      key={dapp.id}
                      onClick={() => handleDAppClick(dapp)}
                      className="flex min-h-[240px] min-w-[250px] flex-col justify-between rounded-[1.6rem] border border-white/10 bg-white/[0.04] p-5 text-left transition-all hover:bg-white/10 hover:translate-y-[-1px]"
                    >
                      <div>
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-white p-2 shadow-lg">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={dapp.icon} alt={dapp.name} className="h-full w-full object-contain" />
                          </div>
                          <div className="min-w-0">
                            <div className="truncate text-sm font-bold text-white">{dapp.name}</div>
                            <div className="mt-1 text-xs uppercase tracking-[0.18em] text-gray-500">{dapp.category}</div>
                          </div>
                        </div>
                        <div className="mt-4 line-clamp-3 text-sm leading-6 text-gray-400">{dapp.description}</div>
                      </div>

                      <div className="mt-6 flex items-center justify-between gap-3">
                        <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[11px] text-gray-400">
                          Launch app
                        </span>
                        <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17L17 7M17 7H8m9 0v9" />
                        </svg>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.03]">
              <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-4">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gray-500">Lambda Agent</div>
                  <div className="mt-1 text-sm font-semibold text-white">AI wallet workspace inside Discover</div>
                </div>
                <button
                  onClick={() => setEmbeddedSurface('discover')}
                  className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-2 text-xs font-semibold text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
                >
                  Back to apps
                </button>
              </div>

              <div className="min-h-0 flex-1 bg-black">
                <iframe
                  src="/agents?embed=1"
                  title="Embedded lambda agent"
                  className="h-full w-full border-0 bg-black"
                  loading="lazy"
                />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-4 py-6">
          {!searchQuery && (
            <div className="mb-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400">Featured</h2>
              </div>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
                {featuredDapps.map((dapp) => (
                  <div key={dapp.id} onClick={() => handleDAppClick(dapp)} className="group flex cursor-pointer flex-col items-center gap-2">
                    <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-white p-2 shadow-lg transition-all group-hover:scale-110 hover:bg-gray-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={dapp.icon} alt={dapp.name} className="h-full w-full object-contain" />
                    </div>
                    <div className="w-full text-center">
                      <h3 className="truncate text-sm font-bold text-white">{dapp.name}</h3>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="relative mb-6 rounded-xl bg-white/5 p-1">
            <div
              className="absolute top-1 bottom-1 bg-white rounded-lg transition-all duration-300 ease-out shadow-lg"
              style={{
                width: 'calc(20% - 0.2rem)',
                left:
                  activeCategory === 'all'
                    ? '0.25rem'
                    : activeCategory === 'defi'
                      ? 'calc(20% + 0.05rem)'
                      : activeCategory === 'nft'
                        ? 'calc(40% + 0.1rem)'
                        : activeCategory === 'game'
                          ? 'calc(60% + 0.15rem)'
                          : 'calc(80% + 0.2rem)',
              }}
            />

            <div className="relative flex gap-1 overflow-x-auto scrollbar-hide">
              {CATEGORIES.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id as DAppCategory)}
                  className={`flex min-w-0 flex-1 items-center justify-center whitespace-nowrap rounded-lg px-4 py-3 text-sm font-bold transition-all duration-300 ease-out ${
                    activeCategory === category.id ? 'text-black scale-105' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400">
                {activeCategory === 'all' ? 'All dApps' : `${CATEGORIES.find((item) => item.id === activeCategory)?.name} dApps`}
              </h2>
            </div>

            {filteredDapps.length === 0 ? (
              <div className="py-16 text-center text-gray-500">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/5">
                  <svg className="h-8 w-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <p className="mb-1 text-lg font-bold">No dApps found</p>
                <p className="text-xs text-gray-500">Try adjusting your search or filters</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
                {filteredDapps.map((dapp) => (
                  <div key={dapp.id} onClick={() => handleDAppClick(dapp)} className="group flex cursor-pointer flex-col items-center gap-2">
                    <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-white p-2 shadow-lg transition-all group-hover:scale-110 hover:bg-gray-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={dapp.icon} alt={dapp.name} className="h-full w-full object-contain" />
                    </div>
                    <div className="w-full text-center">
                      <h3 className="truncate text-sm font-bold text-white">{dapp.name}</h3>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
