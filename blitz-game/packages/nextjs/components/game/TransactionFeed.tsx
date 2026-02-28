"use client";

import { useEffect, useState } from "react";
import type { TxRecord } from "~~/hooks/useSnakeGame";

const DIRECTION_ARROW = ["↑", "→", "↓", "←"];
const DIRECTION_LABEL = ["UP", "RIGHT", "DOWN", "LEFT"];
const EXPLORER = "https://testnet.monadexplorer.com/tx/";

function elapsed(from: number, to?: number) {
  const ms = (to ?? Date.now()) - from;
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function TxCard({ tx, isNew }: { tx: TxRecord; isNew: boolean }) {
  const isPending = tx.status === "pending";
  const isConfirmed = tx.status === "confirmed";

  const [, setTick] = useState(0);
  useEffect(() => {
    if (!isPending) return;
    const id = setInterval(() => setTick(t => t + 1), 80);
    return () => clearInterval(id);
  }, [isPending]);

  // Track status change for flash effect
  const [flash, setFlash] = useState(false);
  const [prevStatus, setPrevStatus] = useState(tx.status);
  useEffect(() => {
    if (tx.status !== prevStatus) {
      setPrevStatus(tx.status);
      if (tx.status === "confirmed") {
        setFlash(true);
        const t = setTimeout(() => setFlash(false), 600);
        return () => clearTimeout(t);
      }
    }
  }, [tx.status, prevStatus]);

  return (
    <div
      className={`rounded-lg px-3 py-2.5 border transition-all duration-500 ${
        isNew ? "tx-enter" : ""
      } ${flash ? "tx-confirm-flash" : ""} ${
        isPending
          ? "bg-amber-500/15 border-amber-400/40 shadow-[0_0_12px_rgba(245,158,11,0.15)]"
          : isConfirmed
            ? "bg-emerald-500/10 border-emerald-500/25"
            : "bg-red-500/10 border-red-500/25"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className={`text-xl leading-none transition-colors duration-500 ${
              isPending ? "text-amber-400" : isConfirmed ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {DIRECTION_ARROW[tx.direction]}
          </span>
          <span className="text-sm font-bold font-mono tracking-wide">{DIRECTION_LABEL[tx.direction]}</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {isPending && <span className="loading loading-ring loading-sm text-amber-400" />}
          {isConfirmed && <span className="text-base leading-none text-emerald-400">✓</span>}
          {tx.status === "failed" && <span className="text-base leading-none text-red-400">✗</span>}
          <span
            className={`text-xs font-mono font-semibold transition-colors duration-500 ${
              isPending ? "text-amber-400" : isConfirmed ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {isPending ? "Pending" : isConfirmed ? "Confirmed" : "Failed"}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between mt-1">
        {tx.hash ? (
          <a
            href={`${EXPLORER}${tx.hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] font-mono text-base-content/35 hover:text-primary underline underline-offset-2 truncate max-w-[160px]"
          >
            {tx.hash.slice(0, 8)}…{tx.hash.slice(-5)}
          </a>
        ) : (
          <span className="text-[11px] font-mono text-base-content/20">awaiting hash…</span>
        )}
        <span
          className={`text-sm font-mono font-black shrink-0 ml-2 transition-colors duration-500 ${
            isConfirmed ? "text-emerald-400" : isPending ? "text-amber-400" : "text-red-400"
          }`}
        >
          {isConfirmed && tx.confirmedAt
            ? elapsed(tx.submittedAt, tx.confirmedAt)
            : elapsed(tx.submittedAt)}
        </span>
      </div>
    </div>
  );
}

type Props = {
  txFeed: TxRecord[];
  moveCount: number;
};

export function TransactionFeed({ txFeed, moveCount }: Props) {
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (txFeed.length === 0) {
      setSeenIds(new Set());
      return;
    }
    const timer = setTimeout(() => {
      setSeenIds(new Set(txFeed.map(tx => tx.id)));
    }, 500);
    return () => clearTimeout(timer);
  }, [txFeed]);

  return (
    <div className="card bg-base-200 shadow-lg border border-primary/10 h-full flex flex-col overflow-hidden">
      <div className="card-body p-4 flex flex-col gap-3 h-full overflow-hidden">
        <div className="flex items-center justify-between shrink-0">
          <h3 className="text-lg font-bold font-mono text-primary tracking-wide">Transactions</h3>
          <span className="badge badge-primary font-mono text-sm px-3 py-2">{moveCount} moves</span>
        </div>

        {/* Feed: flex-col-reverse so newest renders at top and scroll stays pinned */}
        <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-1.5 pr-0.5 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
          {txFeed.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center text-base-content/25 font-mono">
              <div className="text-7xl mb-4">🐍</div>
              <div className="text-xl">No moves yet</div>
              <div className="text-base mt-2">Start a game to see transactions</div>
            </div>
          )}
          {txFeed.map(tx => (
            <TxCard key={tx.id} tx={tx} isNew={!seenIds.has(tx.id)} />
          ))}
        </div>
      </div>
    </div>
  );
}
