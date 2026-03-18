'use client';

import { useEffect, useMemo, useState } from 'react';

type MinerMode = 'mining' | 'sleeping';
type ShopItemId = 'rice_ball' | 'ramen' | 'citrus_soda' | 'festival_bento';

interface NinjaMinerGameProps {
  walletAddress?: string;
}

interface GameState {
  ninjaBalance: number;
  stamina: number;
  mode: MinerMode;
  shiftCount: number;
  combo: number;
  depth: number;
  lifetimeMined: number;
  rareFinds: number;
  speedBoostUntil: number;
  updatedAt: number;
  logs: string[];
}

interface ShopItem {
  id: ShopItemId;
  name: string;
  price: number;
  energy: number;
  description: string;
  accent: string;
  accentSoft: string;
  glyph: 'triangle' | 'bowl' | 'can' | 'box';
  speedBoostSeconds?: number;
  wakeOnServe?: boolean;
}

const STORAGE_PREFIX = 'inj-pass:ninja-miner:';
const MAX_STAMINA = 100;
const BASE_MINE_RATE = 0.34;
const BASE_STAMINA_DRAIN = 2.8;
const BASE_SLEEP_RECOVERY = 5.4;
const MAX_SIM_SECONDS = 900;

const SHOP_ITEMS: ShopItem[] = [
  {
    id: 'rice_ball',
    name: 'Rice Ball',
    price: 8,
    energy: 16,
    description: 'Fast snack for short shifts.',
    accent: '#22c55e',
    accentSoft: 'rgba(34,197,94,0.16)',
    glyph: 'triangle',
  },
  {
    id: 'ramen',
    name: 'Night Ramen',
    price: 18,
    energy: 30,
    description: 'Warm bowl that wakes him up fast.',
    accent: '#f97316',
    accentSoft: 'rgba(249,115,22,0.16)',
    glyph: 'bowl',
    wakeOnServe: true,
  },
  {
    id: 'citrus_soda',
    name: 'Citrus Soda',
    price: 24,
    energy: 18,
    description: 'Adds energy and a 45s speed burst.',
    accent: '#06b6d4',
    accentSoft: 'rgba(6,182,212,0.16)',
    glyph: 'can',
    speedBoostSeconds: 45,
  },
  {
    id: 'festival_bento',
    name: 'Festival Bento',
    price: 40,
    energy: 48,
    description: 'Premium meal for deep mine runs.',
    accent: '#8b5cf6',
    accentSoft: 'rgba(139,92,246,0.16)',
    glyph: 'box',
    speedBoostSeconds: 25,
    wakeOnServe: true,
  },
];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function roundTo(value: number, digits = 2) {
  return Number(value.toFixed(digits));
}

function createInitialState(now: number): GameState {
  return {
    ninjaBalance: 22,
    stamina: 84,
    mode: 'mining',
    shiftCount: 1,
    combo: 0,
    depth: 12,
    lifetimeMined: 22,
    rareFinds: 0,
    speedBoostUntil: 0,
    updatedAt: now,
    logs: [
      'Shift started. Miner entered the Ninja seam.',
      'Wallet credited with the starter supply.',
    ],
  };
}

function pushLog(state: GameState, message: string) {
  if (state.logs[0] === message) {
    return state;
  }

  return {
    ...state,
    logs: [message, ...state.logs].slice(0, 6),
  };
}

function simulateGameState(input: GameState, now: number) {
  const next = {
    ...input,
    logs: [...input.logs],
  };

  const elapsedSeconds = Math.max(
    0,
    Math.min(MAX_SIM_SECONDS, Math.floor((now - input.updatedAt) / 1000))
  );

  if (elapsedSeconds === 0) {
    return { ...input, updatedAt: now };
  }

  for (let index = 0; index < elapsedSeconds; index += 1) {
    const tickTime = input.updatedAt + (index + 1) * 1000;
    const isBoosted = tickTime < next.speedBoostUntil;
    const miningRate = BASE_MINE_RATE * (isBoosted ? 1.75 : 1);
    const staminaDrain = BASE_STAMINA_DRAIN * (isBoosted ? 1.12 : 1);

    if (next.mode === 'mining') {
      next.ninjaBalance += miningRate;
      next.lifetimeMined += miningRate;
      next.depth += 0.18 * (isBoosted ? 1.28 : 1);
      next.combo += 1;
      next.stamina = clamp(next.stamina - staminaDrain, 0, MAX_STAMINA);

      if (next.combo > 0 && next.combo % 18 === 0) {
        next.ninjaBalance += 1.2;
        next.lifetimeMined += 1.2;
        next.rareFinds += 1;
        Object.assign(next, pushLog(next, 'Rare ore pocket cracked. Bonus NINJA added.'));
      }

      if (next.stamina <= 8) {
        next.mode = 'sleeping';
        next.shiftCount += 1;
        next.combo = 0;
        Object.assign(next, pushLog(next, 'Miner collapsed into sleep. Auto-rest engaged.'));
      }
    } else {
      next.stamina = clamp(next.stamina + BASE_SLEEP_RECOVERY, 0, MAX_STAMINA);

      if (next.stamina >= 84) {
        next.mode = 'mining';
        Object.assign(next, pushLog(next, 'Miner woke up and resumed the shift.'));
      }
    }
  }

  next.ninjaBalance = roundTo(next.ninjaBalance, 2);
  next.lifetimeMined = roundTo(next.lifetimeMined, 2);
  next.depth = roundTo(next.depth, 1);
  next.stamina = roundTo(next.stamina, 1);
  next.updatedAt = now;

  return next;
}

function getStorageKey(walletAddress?: string) {
  return `${STORAGE_PREFIX}${walletAddress || 'guest'}`;
}

function getMoodCopy(state: GameState) {
  if (state.mode === 'sleeping') {
    return {
      title: 'Sleep Cycle',
      text: 'The miner is restoring stamina before the next tunnel run.',
    };
  }

  if (state.stamina >= 70) {
    return {
      title: 'Prime Shift',
      text: 'Output is stable and the crew is moving fast.',
    };
  }

  if (state.stamina >= 35) {
    return {
      title: 'Tiring Out',
      text: 'Mining continues, but food will keep the run efficient.',
    };
  }

  return {
    title: 'Exhausted',
    text: 'He is close to sleeping. Feed him or let him rest.',
  };
}

function getShopGlyph(type: ShopItem['glyph']) {
  if (type === 'triangle') {
    return (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
        <path d="M12 4.5 20 18H4L12 4.5Z" fill="currentColor" opacity="0.95" />
        <circle cx="12" cy="13" r="2.2" fill="#0f172a" opacity="0.75" />
      </svg>
    );
  }

  if (type === 'bowl') {
    return (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M5 12h14c0 4.4-2.8 7-7 7s-7-2.6-7-7Z" fill="currentColor" opacity="0.9" stroke="none" />
        <path d="M7 12c.4-1.9 1.3-3 2.8-3s1.8 1.4 3 1.4c1.3 0 1.5-1.4 3-1.4S17.5 10.1 18 12" strokeWidth="1.4" />
        <path d="M8.2 6.3v2.1M12 5v2.4M15.8 6.3v2.1" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    );
  }

  if (type === 'can') {
    return (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <rect x="7" y="4.5" width="10" height="15" rx="3" fill="currentColor" opacity="0.92" stroke="none" />
        <path d="M10 8.2h4M10 11.8h4M10 15.3h4" stroke="#0f172a" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <rect x="5" y="6" width="14" height="12" rx="3" fill="currentColor" opacity="0.92" stroke="none" />
      <path d="M12 6v12M5 12h14" stroke="#0f172a" strokeWidth="1.4" />
    </svg>
  );
}

function formatWalletShort(address?: string) {
  if (!address) return 'No wallet';
  if (address.length < 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function NinjaMinerGame({ walletAddress }: NinjaMinerGameProps) {
  const [gameState, setGameState] = useState<GameState>(() => createInitialState(Date.now()));
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const now = Date.now();
    const storageKey = getStorageKey(walletAddress);

    try {
      const rawState = window.localStorage.getItem(storageKey);
      if (rawState) {
        const parsed = JSON.parse(rawState) as GameState;
        setGameState(simulateGameState(parsed, now));
      } else {
        setGameState(createInitialState(now));
      }
    } catch (error) {
      console.error('Failed to restore ninja miner game:', error);
      setGameState(createInitialState(now));
    } finally {
      setHydrated(true);
    }
  }, [walletAddress]);

  useEffect(() => {
    if (!hydrated) return;

    const storageKey = getStorageKey(walletAddress);
    window.localStorage.setItem(storageKey, JSON.stringify(gameState));
  }, [gameState, hydrated, walletAddress]);

  useEffect(() => {
    if (!hydrated) return;

    const timer = window.setInterval(() => {
      setGameState((current) => simulateGameState(current, Date.now()));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [hydrated]);

  const mood = useMemo(() => getMoodCopy(gameState), [gameState]);
  const isBoosted = gameState.speedBoostUntil > Date.now();
  const boostSecondsLeft = Math.max(
    0,
    Math.ceil((gameState.speedBoostUntil - Date.now()) / 1000)
  );

  const minePerMinute = roundTo(
    BASE_MINE_RATE * (isBoosted ? 1.75 : 1) * 60,
    1
  );

  const serveFood = (item: ShopItem) => {
    setGameState((current) => {
      const synced = simulateGameState(current, Date.now());

      if (synced.ninjaBalance < item.price) {
        return pushLog(synced, `Not enough NINJA for ${item.name}.`);
      }

      const next = {
        ...synced,
        ninjaBalance: roundTo(synced.ninjaBalance - item.price, 2),
        stamina: roundTo(clamp(synced.stamina + item.energy, 0, MAX_STAMINA), 1),
        updatedAt: Date.now(),
      };

      if (item.speedBoostSeconds) {
        next.speedBoostUntil = Date.now() + item.speedBoostSeconds * 1000;
      }

      if (item.wakeOnServe && next.mode === 'sleeping' && next.stamina >= 34) {
        next.mode = 'mining';
      }

      return pushLog(
        next,
        `${item.name} served. +${item.energy} stamina${item.speedBoostSeconds ? ' and speed boost active.' : '.'}`
      );
    });
  };

  const toggleRest = () => {
    setGameState((current) => {
      const synced = simulateGameState(current, Date.now());
      const nextMode: MinerMode = synced.mode === 'mining' ? 'sleeping' : 'mining';
      const nextCombo = nextMode === 'sleeping' ? 0 : synced.combo;
      const nextState = {
        ...synced,
        mode: nextMode,
        combo: nextCombo,
        updatedAt: Date.now(),
      };

      return pushLog(
        nextState,
        nextMode === 'sleeping'
          ? 'Manual rest started. The lamp is dimmed for recovery.'
          : 'Miner was sent back to work.'
      );
    });
  };

  if (!hydrated) {
    return (
      <div className="rounded-[28px] border border-white/10 bg-[#0f1422] p-6 text-sm text-gray-400">
        Preparing the Ninja mine...
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[28px] border border-white/10 bg-[#0b1020]">
      <div className="border-b border-white/8 bg-[#11172b] px-5 py-4 md:px-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-300/80">
              Ninja Mine
            </div>
            <h3 className="mt-2 text-2xl font-bold text-white">Live mining game inside Earn</h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              Your miner digs automatically, grows tired, sleeps when needed, and spends NINJA on food to stay productive.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-2xl border border-white/10 bg-[#0c1326] px-4 py-3">
              <div className="text-[10px] uppercase tracking-[0.24em] text-slate-500">Mode</div>
              <div className="mt-1 flex items-center gap-2 text-sm font-semibold text-white">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    gameState.mode === 'mining' ? 'bg-emerald-400' : 'bg-amber-300'
                  }`}
                />
                <span>{gameState.mode === 'mining' ? 'Mining' : 'Sleeping'}</span>
              </div>
            </div>

            <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.24em] text-cyan-200/80">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 7.5h16v9H4z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 12h5" />
                </svg>
                Wallet
              </div>
              <div className="mt-1 text-lg font-bold text-white">{gameState.ninjaBalance.toFixed(1)} NINJA</div>
              <div className="mt-1 text-xs text-cyan-100/70">{formatWalletShort(walletAddress)}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 p-4 md:p-6 xl:grid-cols-[1.55fr_1fr]">
        <div className="space-y-4">
          <div className="overflow-hidden rounded-[26px] border border-white/8 bg-[#111827]">
            <div className="flex flex-col gap-4 border-b border-white/8 px-5 py-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-[0.24em] text-slate-500">Mine Chamber</div>
                <div className="mt-1 text-lg font-semibold text-white">Depth {gameState.depth.toFixed(1)} m</div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={toggleRest}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                >
                  {gameState.mode === 'mining' ? 'Let Him Sleep' : 'Wake Him Up'}
                </button>
                <div className="rounded-2xl border border-white/10 bg-[#151c31] px-3 py-2 text-sm text-slate-300">
                  {isBoosted ? `Boost ${boostSecondsLeft}s` : 'No Boost'}
                </div>
              </div>
            </div>

            <div className="grid gap-5 px-5 py-5 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-[24px] border border-white/8 bg-[#0d1426] px-5 py-5">
                <div className="relative flex h-[280px] items-end justify-between overflow-hidden rounded-[24px] border border-white/6 bg-[#141b31] px-5 pb-5 pt-8">
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.14),_transparent_48%),linear-gradient(180deg,rgba(255,255,255,0.04),transparent_50%)]" />

                  <div className="absolute left-6 top-6 rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[11px] font-semibold tracking-[0.2em] text-slate-300 uppercase">
                    {mood.title}
                  </div>

                  <div className="relative z-10 flex flex-col items-start">
                    <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Mine Output</div>
                    <div className="mt-2 text-4xl font-bold text-white">{minePerMinute}</div>
                    <div className="mt-1 text-sm text-slate-400">NINJA per minute</div>

                    <div className="mt-6 flex items-center gap-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/8 bg-[#0b1222] text-cyan-300">
                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 4h10v4H7zM6 12h12M7 20h10" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white">{gameState.rareFinds} rare finds</div>
                        <div className="text-xs text-slate-500">Combo reward pockets cracked</div>
                      </div>
                    </div>
                  </div>

                  <div className="relative z-10 flex items-end gap-8">
                    <div className="relative flex items-end">
                      <div
                        className={`miner-shell ${gameState.mode === 'mining' ? 'is-mining' : 'is-sleeping'}`}
                      >
                        <div className="miner-helmet" />
                        <div className="miner-face" />
                        <div className="miner-body" />
                        <div className="miner-arm miner-arm-left" />
                        <div className="miner-arm miner-arm-right" />
                        <div className="miner-leg miner-leg-left" />
                        <div className="miner-leg miner-leg-right" />
                        <div className="pickaxe">
                          <div className="pickaxe-stick" />
                          <div className="pickaxe-head" />
                        </div>
                        {gameState.mode === 'sleeping' && (
                          <div className="sleep-bubble">
                            <span>Z</span>
                            <span>Z</span>
                            <span>Z</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="relative h-[170px] w-[170px] rounded-[36px] bg-[#10182d]">
                      <div className="absolute inset-x-7 bottom-0 h-[126px] rounded-t-[32px] bg-[#0a1020]" />
                      <div className="ore-stack">
                        <span className="ore ore-a" />
                        <span className="ore ore-b" />
                        <span className="ore ore-c" />
                        <span className="ore ore-d" />
                      </div>
                      {gameState.mode === 'mining' && <div className="spark-ring" />}
                    </div>
                  </div>
                </div>

                <div className="mt-4 rounded-[22px] border border-white/8 bg-[#0c1324] p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-[10px] uppercase tracking-[0.24em] text-slate-500">Stamina</div>
                      <div className="mt-1 text-2xl font-bold text-white">{gameState.stamina.toFixed(0)}%</div>
                    </div>
                    <div className="max-w-sm text-sm leading-6 text-slate-400">{mood.text}</div>
                  </div>

                  <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/6">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        gameState.stamina >= 60
                          ? 'bg-emerald-400'
                          : gameState.stamina >= 30
                            ? 'bg-amber-300'
                            : 'bg-rose-400'
                      }`}
                      style={{ width: `${gameState.stamina}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-3">
                <div className="rounded-[24px] border border-white/8 bg-[#0d1426] p-4">
                  <div className="text-[10px] uppercase tracking-[0.24em] text-slate-500">Shift Stats</div>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-white/8 bg-[#121a31] p-4">
                      <div className="text-xs text-slate-500">Lifetime</div>
                      <div className="mt-2 text-xl font-bold text-white">{gameState.lifetimeMined.toFixed(1)}</div>
                      <div className="text-xs text-slate-400">NINJA mined</div>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-[#121a31] p-4">
                      <div className="text-xs text-slate-500">Current Combo</div>
                      <div className="mt-2 text-xl font-bold text-white">{gameState.combo}</div>
                      <div className="text-xs text-slate-400">clean strikes</div>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-[#121a31] p-4">
                      <div className="text-xs text-slate-500">Shift Count</div>
                      <div className="mt-2 text-xl font-bold text-white">{gameState.shiftCount}</div>
                      <div className="text-xs text-slate-400">runs started</div>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-[#121a31] p-4">
                      <div className="text-xs text-slate-500">Boost State</div>
                      <div className="mt-2 text-xl font-bold text-white">
                        {isBoosted ? `${boostSecondsLeft}s` : 'Idle'}
                      </div>
                      <div className="text-xs text-slate-400">soda effect</div>
                    </div>
                  </div>
                </div>

                <div className="rounded-[24px] border border-white/8 bg-[#0d1426] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-[10px] uppercase tracking-[0.24em] text-slate-500">Activity Feed</div>
                      <div className="mt-1 text-sm font-semibold text-white">Mine journal</div>
                    </div>
                    <div className="rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.24em] text-slate-400">
                      Live
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    {gameState.logs.map((entry, index) => (
                      <div
                        key={`${entry}-${index}`}
                        className="rounded-2xl border border-white/6 bg-[#121a31] px-3 py-3 text-sm text-slate-300"
                      >
                        {entry}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-[26px] border border-white/8 bg-[#111827] p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-[10px] uppercase tracking-[0.24em] text-slate-500">Supply Shop</div>
                <div className="mt-1 text-lg font-semibold text-white">Feed the miner</div>
              </div>
              <div className="rounded-2xl border border-white/8 bg-[#0c1324] px-3 py-2 text-right">
                <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Budget</div>
                <div className="mt-1 text-base font-bold text-white">{gameState.ninjaBalance.toFixed(1)} NINJA</div>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {SHOP_ITEMS.map((item) => {
                const affordable = gameState.ninjaBalance >= item.price;

                return (
                  <div
                    key={item.id}
                    className="rounded-[22px] border border-white/8 bg-[#0d1426] p-4"
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10"
                        style={{ backgroundColor: item.accentSoft, color: item.accent }}
                      >
                        {getShopGlyph(item.glyph)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="text-base font-semibold text-white">{item.name}</div>
                          <span className="rounded-full border border-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.22em] text-slate-400">
                            +{item.energy} stamina
                          </span>
                        </div>
                        <div className="mt-1 text-sm leading-6 text-slate-400">{item.description}</div>
                        {item.speedBoostSeconds ? (
                          <div className="mt-2 text-xs text-cyan-300">
                            Includes {item.speedBoostSeconds}s mining burst.
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold text-white">{item.price} NINJA</div>
                      <button
                        onClick={() => serveFood(item)}
                        disabled={!affordable}
                        className={`rounded-2xl px-4 py-2 text-sm font-semibold transition-colors ${
                          affordable
                            ? 'bg-white text-slate-900 hover:bg-slate-100'
                            : 'cursor-not-allowed bg-white/6 text-slate-500'
                        }`}
                      >
                        Buy and Serve
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-[26px] border border-white/8 bg-[#111827] p-5">
            <div className="text-[10px] uppercase tracking-[0.24em] text-slate-500">Game Notes</div>
            <div className="mt-3 space-y-3 text-sm leading-6 text-slate-400">
              <p>Mining runs automatically while the tab is open. Stamina drains over time, and the miner sleeps when exhausted.</p>
              <p>Food from the shop instantly restores energy. Soda and bento add a temporary production burst.</p>
              <p>Long mining combos crack rare pockets and award bonus NINJA. Rest strategically to preserve momentum.</p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .miner-shell {
          position: relative;
          width: 112px;
          height: 170px;
        }

        .miner-shell.is-mining {
          animation: minerBob 2s ease-in-out infinite;
        }

        .miner-helmet {
          position: absolute;
          top: 16px;
          left: 26px;
          width: 60px;
          height: 30px;
          border-radius: 20px 20px 14px 14px;
          background: #f59e0b;
        }

        .miner-helmet::after {
          content: '';
          position: absolute;
          left: 10px;
          right: 10px;
          top: 12px;
          height: 4px;
          border-radius: 999px;
          background: rgba(15, 23, 42, 0.32);
        }

        .miner-face {
          position: absolute;
          top: 38px;
          left: 34px;
          width: 42px;
          height: 34px;
          border-radius: 18px;
          background: #f4c7a1;
        }

        .miner-body {
          position: absolute;
          top: 72px;
          left: 28px;
          width: 54px;
          height: 52px;
          border-radius: 20px;
          background: #1d4ed8;
        }

        .miner-arm,
        .miner-leg {
          position: absolute;
          border-radius: 999px;
          background: #f4c7a1;
        }

        .miner-arm {
          top: 80px;
          width: 14px;
          height: 54px;
        }

        .miner-arm-left {
          left: 18px;
          transform: rotate(18deg);
        }

        .miner-arm-right {
          left: 80px;
          transform: rotate(-16deg);
        }

        .miner-leg {
          top: 118px;
          width: 16px;
          height: 48px;
          background: #0f172a;
        }

        .miner-leg-left {
          left: 34px;
        }

        .miner-leg-right {
          left: 60px;
        }

        .pickaxe {
          position: absolute;
          top: 36px;
          right: -2px;
          width: 50px;
          height: 92px;
          transform-origin: 12px 74px;
        }

        .is-mining .pickaxe {
          animation: pickaxeSwing 0.85s ease-in-out infinite;
        }

        .pickaxe-stick {
          position: absolute;
          left: 18px;
          top: 14px;
          width: 8px;
          height: 72px;
          border-radius: 999px;
          background: #d6a75f;
        }

        .pickaxe-head {
          position: absolute;
          left: 2px;
          top: 0;
          width: 40px;
          height: 22px;
          border-radius: 14px;
          background: #cbd5e1;
        }

        .sleep-bubble {
          position: absolute;
          top: -2px;
          right: -10px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          color: #f8fafc;
          font-weight: 700;
          opacity: 0.8;
          animation: sleepFloat 2.8s ease-in-out infinite;
        }

        .sleep-bubble span:nth-child(2) {
          margin-left: 10px;
        }

        .sleep-bubble span:nth-child(3) {
          margin-left: 18px;
        }

        .ore-stack {
          position: absolute;
          inset: 18px;
        }

        .ore {
          position: absolute;
          display: block;
          border-radius: 24px;
          background: #22d3ee;
          opacity: 0.95;
        }

        .ore-a {
          left: 18px;
          bottom: 28px;
          width: 56px;
          height: 48px;
          background: #22c55e;
        }

        .ore-b {
          right: 22px;
          bottom: 34px;
          width: 44px;
          height: 44px;
          background: #38bdf8;
        }

        .ore-c {
          left: 56px;
          top: 34px;
          width: 52px;
          height: 52px;
          background: #8b5cf6;
        }

        .ore-d {
          left: 30px;
          top: 86px;
          width: 30px;
          height: 30px;
          background: #f59e0b;
        }

        .spark-ring {
          position: absolute;
          inset: 28px;
          border-radius: 999px;
          border: 1px dashed rgba(255, 255, 255, 0.18);
          animation: sparkPulse 2.2s linear infinite;
        }

        @keyframes minerBob {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-5px);
          }
        }

        @keyframes pickaxeSwing {
          0%, 100% {
            transform: rotate(18deg);
          }
          50% {
            transform: rotate(-14deg);
          }
        }

        @keyframes sleepFloat {
          0%, 100% {
            transform: translateY(0);
            opacity: 0.65;
          }
          50% {
            transform: translateY(-8px);
            opacity: 1;
          }
        }

        @keyframes sparkPulse {
          0% {
            transform: scale(0.9);
            opacity: 0.2;
          }
          50% {
            transform: scale(1);
            opacity: 0.55;
          }
          100% {
            transform: scale(1.08);
            opacity: 0.16;
          }
        }
      `}</style>
    </div>
  );
}
