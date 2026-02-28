"use client";

import { useEffect, useState } from "react";
import { Address, createPublicClient, http } from "viem";
import { SNAKE_GAME_ABI } from "~~/contracts/snakeGameAbi";
import { MONAD_RPC_HTTP, monadTestnet } from "~~/scaffold.config";

type LeaderboardEntry = {
  player: string;
  score: number;
  moveCount: number;
  gameId: bigint;
};

type LeaderboardProps = {
  contractAddress?: Address;
  refreshTrigger?: number;
};

const client = createPublicClient({
  chain: monadTestnet,
  transport: http(MONAD_RPC_HTTP),
});

export function Leaderboard({ contractAddress, refreshTrigger }: LeaderboardProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchLeaderboard = async () => {
    if (!contractAddress) return;
    setIsLoading(true);
    try {
      const result = await client.readContract({
        address: contractAddress,
        abi: SNAKE_GAME_ABI,
        functionName: "getLeaderboard",
      });

      const parsed = (result as any[]).map((e: any) => ({
        player: String(e.player),
        score: Number(e.score),
        moveCount: Number(e.moveCount),
        gameId: BigInt(e.gameId),
      }));
      setEntries(parsed);
    } catch (err) {
      console.error("Leaderboard fetch error:", err);
    }
    setIsLoading(false);
  };

  // Fetch on mount, on refreshTrigger change (game ended), and every 20s
  useEffect(() => {
    if (!contractAddress) return;
    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 20000);
    return () => clearInterval(interval);
  }, [contractAddress]);

  // Immediate re-fetch when a game ends (triggered from parent)
  useEffect(() => {
    if (!refreshTrigger || !contractAddress) return;
    // Small delay to give the chain time to process endGame tx
    const t = setTimeout(fetchLeaderboard, 3000);
    return () => clearTimeout(t);
  }, [refreshTrigger, contractAddress]);

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="card bg-base-200 shadow-lg border border-primary/10 shrink-0">
      <div className="card-body p-3 gap-2">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm font-mono text-primary tracking-wide">Leaderboard</h3>
          {isLoading && <span className="loading loading-spinner loading-xs opacity-50" />}
        </div>

        {!isLoading && entries.length === 0 && (
          <p className="text-xs text-base-content/30 text-center py-2 font-mono">No scores yet</p>
        )}

        {entries.length > 0 && (
          <div className="flex flex-col gap-1">
            {entries.map((entry, i) => (
              <div
                key={`${entry.gameId}`}
                className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg font-mono text-xs ${
                  i === 0 ? "bg-primary/10 border border-primary/20" : "bg-base-300/50"
                }`}
              >
                <span className="text-sm w-4 text-center">{medals[i] ?? `${i + 1}`}</span>
                <a
                  href={`https://testnet.monadscan.com/address/${entry.player}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-base-content/60 hover:text-primary truncate flex-1 text-[10px]"
                >
                  {entry.player.slice(0, 6)}...{entry.player.slice(-4)}
                </a>
                <span className={`font-bold text-sm ${i === 0 ? "text-primary" : "text-base-content/80"}`}>
                  {entry.score}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
