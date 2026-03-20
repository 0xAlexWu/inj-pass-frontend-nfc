'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

interface NinjaMinerGameProps {
  walletAddress?: string;
}

interface TapMinerState {
  ninjaBalance: number;
  cooldownEndsAt: number;
  sessionStartedAt: number;
  sessionEndsAt: number;
  sessionEarned: number;
  tutorialDismissed: boolean;
}

interface TapBurst {
  id: number;
  amount: number;
  x: number;
  y: number;
}

const STORAGE_PREFIX = 'inj-pass:ninja-miner:';
const BALANCE_EVENT = 'inj-pass:ninja-balance-update';
const DEFAULT_NINJA_BALANCE = 22;
const SESSION_DURATION_MS = 15_000;
const COOLDOWN_MS = 8 * 60 * 60 * 1000;

function roundTo(value: number, digits = 2) {
  return Number(value.toFixed(digits));
}

function getStorageKey(walletAddress?: string) {
  return `${STORAGE_PREFIX}${walletAddress || 'guest'}`;
}

function createInitialState(): TapMinerState {
  return {
    ninjaBalance: DEFAULT_NINJA_BALANCE,
    cooldownEndsAt: 0,
    sessionStartedAt: 0,
    sessionEndsAt: 0,
    sessionEarned: 0,
    tutorialDismissed: false,
  };
}

function normalizeState(state: TapMinerState, now: number): TapMinerState {
  const next = { ...state };

  if (next.sessionEndsAt > 0 && now >= next.sessionEndsAt) {
    next.sessionStartedAt = 0;
    next.sessionEndsAt = 0;
  }

  if (next.cooldownEndsAt > 0 && now >= next.cooldownEndsAt) {
    next.cooldownEndsAt = 0;
  }

  return next;
}

function restoreState(walletAddress?: string): TapMinerState {
  if (typeof window === 'undefined') {
    return createInitialState();
  }

  const now = Date.now();

  try {
    const raw = window.localStorage.getItem(getStorageKey(walletAddress));
    if (!raw) {
      return createInitialState();
    }

    const parsed = JSON.parse(raw) as Partial<TapMinerState> & { ninjaBalance?: number };
    return normalizeState(
      {
        ninjaBalance: typeof parsed.ninjaBalance === 'number' ? roundTo(parsed.ninjaBalance, 2) : DEFAULT_NINJA_BALANCE,
        cooldownEndsAt: typeof parsed.cooldownEndsAt === 'number' ? parsed.cooldownEndsAt : 0,
        sessionStartedAt: typeof parsed.sessionStartedAt === 'number' ? parsed.sessionStartedAt : 0,
        sessionEndsAt: typeof parsed.sessionEndsAt === 'number' ? parsed.sessionEndsAt : 0,
        sessionEarned: typeof parsed.sessionEarned === 'number' ? roundTo(parsed.sessionEarned, 2) : 0,
        tutorialDismissed: parsed.tutorialDismissed === true,
      },
      now
    );
  } catch (error) {
    console.error('Failed to restore ninja tap state:', error);
    return createInitialState();
  }
}

function formatDuration(ms: number) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function randomReward() {
  return roundTo((Math.floor(Math.random() * 9) + 1) / 100, 2);
}

export default function NinjaMinerGame({ walletAddress }: NinjaMinerGameProps) {
  const { theme } = useTheme();
  const [gameState, setGameState] = useState<TapMinerState>(() => createInitialState());
  const [bursts, setBursts] = useState<TapBurst[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setGameState(restoreState(walletAddress));
      setNow(Date.now());
      setHydrated(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [walletAddress]);

  useEffect(() => {
    if (!hydrated) return;

    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 120);

    return () => window.clearInterval(timer);
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated) return;

    const storageKey = getStorageKey(walletAddress);
    window.localStorage.setItem(storageKey, JSON.stringify(gameState));
    window.dispatchEvent(new CustomEvent(BALANCE_EVENT, {
      detail: { walletAddress, ninjaBalance: gameState.ninjaBalance },
    }));
  }, [gameState, hydrated, walletAddress]);

  const normalizedState = useMemo(() => normalizeState(gameState, now), [gameState, now]);
  const isActive = normalizedState.sessionEndsAt > now;
  const isCoolingDown = !isActive && normalizedState.cooldownEndsAt > now;
  const activeRemainingMs = Math.max(0, normalizedState.sessionEndsAt - now);
  const cooldownRemainingMs = Math.max(0, normalizedState.cooldownEndsAt - now);
  const activeProgress = isActive ? (activeRemainingMs / SESSION_DURATION_MS) * 100 : 0;
  const cooldownProgress = isCoolingDown
    ? ((COOLDOWN_MS - cooldownRemainingMs) / COOLDOWN_MS) * 100
    : 0;
  const progressValue = isActive ? activeProgress : isCoolingDown ? cooldownProgress : 100;
  const isLight = theme === 'light';
  const showTutorial = !normalizedState.tutorialDismissed && !isCoolingDown;

  const progressLabel = isActive
    ? `${(activeRemainingMs / 1000).toFixed(1)}s`
    : isCoolingDown
      ? `Reset in ${formatDuration(cooldownRemainingMs)}`
      : 'Ready';

  const spawnBurst = (amount: number) => {
    const burst = {
      id: Date.now() + Math.floor(Math.random() * 10_000),
      amount,
      x: Math.round((Math.random() - 0.5) * 88),
      y: Math.round(Math.random() * -26),
    };

    setBursts((current) => [...current, burst]);
    window.setTimeout(() => {
      setBursts((current) => current.filter((item) => item.id !== burst.id));
    }, 900);
  };

  const handleTap = () => {
    if (!hydrated || isCoolingDown) return;

    const tapAt = Date.now();
    const reward = randomReward();

    setGameState((current) => {
      const synced = normalizeState(current, tapAt);
      const sessionAlreadyActive = synced.sessionEndsAt > tapAt;
      return {
        ninjaBalance: roundTo(synced.ninjaBalance + reward, 2),
        sessionStartedAt: sessionAlreadyActive ? synced.sessionStartedAt : tapAt,
        sessionEndsAt: sessionAlreadyActive ? synced.sessionEndsAt : tapAt + SESSION_DURATION_MS,
        cooldownEndsAt: sessionAlreadyActive ? synced.cooldownEndsAt : tapAt + SESSION_DURATION_MS + COOLDOWN_MS,
        sessionEarned: roundTo((sessionAlreadyActive ? synced.sessionEarned : 0) + reward, 2),
        tutorialDismissed: true,
      };
    });

    setNow(tapAt);
    spawnBurst(reward);
  };

  if (!hydrated) {
    return (
      <div
        className={`flex h-full items-center justify-center rounded-[28px] border px-6 py-6 ${
          isLight ? 'border-slate-300/70 bg-white/75 text-slate-500' : 'border-white/10 bg-black/30 text-gray-500'
        }`}
      >
        Preparing NINJA...
      </div>
    );
  }

  return (
    <div
      className={`flex h-full flex-col items-center justify-center rounded-[28px] border px-6 py-7 ${
        isLight ? 'border-slate-300/70 bg-white/72' : 'border-white/10 bg-black/30'
      }`}
    >
      <div className="mb-4 flex w-full items-start justify-end">
        <div
          className={`rounded-full border px-3.5 py-1.5 text-right ${
            isLight ? 'border-slate-300/80 bg-white/88' : 'border-white/10 bg-white/[0.05]'
          }`}
        >
          <div className={`text-[10px] font-semibold uppercase tracking-[0.2em] ${isLight ? 'text-slate-500' : 'text-gray-500'}`}>
            Earned
          </div>
          <div className={`mt-0.5 font-mono text-sm font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
            +{normalizedState.sessionEarned.toFixed(2)} NINJA
          </div>
        </div>
      </div>

      <div className="relative flex flex-1 items-center justify-center">
        {bursts.map((burst) => (
          <div
            key={burst.id}
            className="tap-burst pointer-events-none absolute z-20 font-mono text-sm font-semibold text-[#8f76ff]"
            style={{ transform: `translate(${burst.x}px, ${burst.y}px)` }}
          >
            +{burst.amount.toFixed(2)}
          </div>
        ))}

        {showTutorial && (
          <div className="tutorial-guide pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
            <div className="tutorial-hand-wrap">
              <div className={`tutorial-touch-ring ${isLight ? 'border-slate-400/45' : 'border-white/18'}`} />
              <div className={`tutorial-hand ${isLight ? 'bg-slate-900 text-white' : 'bg-white text-black'}`}>
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9.5 11.5V7.2a1.2 1.2 0 1 1 2.4 0v4.3" />
                  <path d="M11.9 11.4V5.8a1.2 1.2 0 1 1 2.4 0v5.4" />
                  <path d="M14.3 11.8V7.6a1.2 1.2 0 1 1 2.4 0v6.1c0 3-2.2 5.3-5 5.3-2.6 0-4.4-1.7-5-4.3l-.8-3.3a1.15 1.15 0 1 1 2.2-.6l.7 2.2V9.7a1.2 1.2 0 1 1 2.4 0v1.8" />
                </svg>
              </div>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={handleTap}
          disabled={isCoolingDown}
          className={`ninja-tap-shell ${isActive ? 'is-active' : ''} ${isCoolingDown ? 'is-cooling' : ''} ${
            isLight ? 'border-slate-300/75 bg-slate-100/80' : 'border-white/10 bg-white/[0.04]'
          }`}
          aria-label={isCoolingDown ? 'NINJA tap cooldown active' : 'Tap NINJA'}
        >
          <div className={`ninja-logo-wrap ${isLight ? 'bg-white/85' : 'bg-black/35'}`}>
            <Image
              src="/NIJIA.png"
              alt="NINJA"
              width={152}
              height={152}
              className="h-32 w-32 select-none object-contain md:h-36 md:w-36"
              priority={false}
            />
          </div>
        </button>
      </div>

      <div className="w-full max-w-[360px] space-y-2">
        <div className={`h-2 overflow-hidden rounded-full ${isLight ? 'bg-slate-200/90' : 'bg-white/8'}`}>
          <div
            className={`h-full rounded-full transition-[width,background-color] duration-150 ${
              isActive
                ? 'bg-[#8f76ff]'
                : isCoolingDown
                  ? isLight
                    ? 'bg-slate-500/80'
                    : 'bg-white/28'
                  : isLight
                    ? 'bg-slate-900'
                    : 'bg-white/90'
            }`}
            style={{ width: `${Math.max(0, Math.min(100, progressValue))}%` }}
          />
        </div>

        <div className={`text-center text-[11px] font-semibold uppercase tracking-[0.18em] ${isLight ? 'text-slate-500' : 'text-gray-500'}`}>
          {progressLabel}
        </div>
      </div>

      <style jsx>{`
        .ninja-tap-shell {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 15rem;
          height: 15rem;
          border-radius: 999px;
          transition: transform 180ms ease, opacity 180ms ease, border-color 180ms ease, box-shadow 180ms ease;
          overflow: hidden;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
        }

        .ninja-tap-shell:not(.is-cooling) {
          cursor: pointer;
        }

        .ninja-tap-shell:not(.is-cooling):hover {
          transform: translateY(-2px) scale(1.01);
        }

        .ninja-tap-shell:not(.is-cooling):active {
          transform: scale(0.985);
        }

        .ninja-tap-shell.is-active {
          box-shadow: 0 0 0 1px rgba(143, 118, 255, 0.15), 0 0 32px rgba(143, 118, 255, 0.12);
        }

        .ninja-tap-shell.is-cooling {
          opacity: 0.5;
          filter: grayscale(0.08);
          cursor: not-allowed;
        }

        .ninja-tap-shell::after {
          content: '';
          position: absolute;
          inset: -30%;
          background: linear-gradient(115deg, transparent 28%, rgba(255,255,255,0.22) 48%, transparent 68%);
          transform: translateX(-130%) rotate(12deg);
          animation: crestSweep 6.8s linear infinite;
          pointer-events: none;
        }

        .ninja-logo-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 11rem;
          height: 11rem;
          border-radius: 999px;
          backdrop-filter: blur(18px);
        }

        .tutorial-hand-wrap {
          position: absolute;
          right: calc(50% - 112px);
          bottom: calc(50% - 104px);
          animation: tutorialFloat 1.9s ease-in-out infinite;
        }

        .tutorial-hand {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 2.3rem;
          height: 2.3rem;
          border-radius: 999px;
          box-shadow: 0 10px 28px rgba(15, 23, 42, 0.18);
        }

        .tutorial-touch-ring {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 2.9rem;
          height: 2.9rem;
          border-radius: 999px;
          border: 1px solid;
          transform: translate(-50%, -50%);
          animation: tutorialPulse 1.9s ease-out infinite;
        }

        .tap-burst {
          animation: tapBurstFloat 880ms cubic-bezier(0.2, 0.9, 0.18, 1) forwards;
          text-shadow: 0 6px 18px rgba(143, 118, 255, 0.22);
        }

        @keyframes crestSweep {
          0% {
            transform: translateX(-130%) rotate(12deg);
            opacity: 0;
          }
          18% {
            opacity: 0.7;
          }
          52% {
            opacity: 0.12;
          }
          100% {
            transform: translateX(130%) rotate(12deg);
            opacity: 0;
          }
        }

        @keyframes tapBurstFloat {
          0% {
            opacity: 0;
          }
          12% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: translateY(-52px);
          }
        }

        @keyframes tutorialFloat {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(7px);
          }
        }

        @keyframes tutorialPulse {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.62);
          }
          20% {
            opacity: 0.75;
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(1.18);
          }
        }
      `}</style>
    </div>
  );
}
