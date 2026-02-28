"use client";

import { Address } from "viem";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { SessionWallet } from "~~/components/game/SessionWallet";
import { SnakeCanvas } from "~~/components/game/SnakeCanvas";
import { TransactionFeed } from "~~/components/game/TransactionFeed";
import { useSessionWallet } from "~~/hooks/useSessionWallet";
import { GAME_DURATION, useSnakeGame } from "~~/hooks/useSnakeGame";

const SNAKE_GAME_ADDRESS = process.env.NEXT_PUBLIC_SNAKE_GAME_ADDRESS as Address | undefined;

const Home: NextPage = () => {
  const { isConnected } = useAccount();
  const { hasSessionKey, isFunded } = useSessionWallet();
  const { snake, food, score, gameState, timeLeft, txFeed, moveCount, isTxPending, startGame, changeDirection } =
    useSnakeGame(SNAKE_GAME_ADDRESS);

  const canPlay = isConnected && hasSessionKey && isFunded && !!SNAKE_GAME_ADDRESS;

  return (
    <div className="flex flex-row h-full gap-2 p-2 overflow-hidden">

      {/* LEFT — image at top + title, image at bottom, pinned to corners */}
      <div className="hidden lg:flex flex-col justify-between w-48 shrink-0 h-full">
        <div>
          <img
            src="/pepe-monad.png"
            alt="Pepe Monad"
            className="rounded-xl opacity-95 hover:opacity-100 transition-opacity w-full"
            style={{ objectFit: "contain", display: "block" }}
          />
        </div>
        <div>
          <img
            src="/pepe3monad.png"
            alt="Monad Gang"
            className="rounded-xl opacity-95 hover:opacity-100 transition-opacity w-full"
            style={{ objectFit: "contain", display: "block" }}
          />
        </div>
      </div>

      {/* CENTER — Canvas fills full width, no horizontal gaps */}
      <div className="flex flex-col flex-1 min-w-0 gap-1 overflow-hidden">
        {/* Stats row — compact */}
        <div className="flex items-center justify-between px-1 shrink-0">
          <div className="flex items-center gap-6">
            <div className="text-center leading-none">
              <div className="text-[9px] text-base-content/40 font-mono uppercase tracking-widest">Score</div>
              <div className="text-3xl font-black font-mono text-primary">{score}</div>
            </div>
            <div className="text-center leading-none">
              <div className="text-[9px] text-base-content/40 font-mono uppercase tracking-widest">Time</div>
              <div className={`text-3xl font-black font-mono ${timeLeft <= 10 ? "text-error animate-pulse" : ""}`}>
                {timeLeft}s
              </div>
            </div>
            <div className="text-center leading-none">
              <div className="text-[9px] text-base-content/40 font-mono uppercase tracking-widest">Length</div>
              <div className="text-3xl font-black font-mono">{snake.length}</div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {gameState === "playing" && isTxPending && (
              <>
                <span className="loading loading-ring loading-xs text-warning" />
                <span className="text-[10px] text-warning/70 font-mono">confirming...</span>
              </>
            )}
            {gameState === "playing" && !isTxPending && (
              <span className="text-[10px] text-base-content/25 font-mono">WASD / arrows</span>
            )}
          </div>
        </div>

        {/* Timer bar */}
        <progress
          className={`progress w-full h-[3px] shrink-0 ${timeLeft <= 10 ? "progress-error" : "progress-primary"}`}
          value={timeLeft}
          max={GAME_DURATION}
        />

        {/* Canvas — full width of center column, square */}
        <div className="flex-1 min-h-0 w-full overflow-hidden">
          <SnakeCanvas
            snake={snake}
            food={food}
            gameState={gameState}
            isTxPending={isTxPending}
            onDirectionChange={changeDirection}
          />
        </div>

        {/* Start button */}
        <div className="flex items-center justify-center gap-3 shrink-0 py-1">
          {!isConnected && <span className="text-xs text-warning font-mono">Connect wallet</span>}
          {isConnected && !hasSessionKey && <span className="text-xs text-warning font-mono">Generate session key →</span>}
          {isConnected && hasSessionKey && !isFunded && <span className="text-xs text-warning font-mono">Fund session wallet →</span>}
          <button
            className="btn btn-primary btn-sm font-mono px-8"
            onClick={startGame}
            disabled={!canPlay || gameState === "playing"}
          >
            {gameState === "playing" ? "IN PROGRESS..." : gameState === "ended" ? "PLAY AGAIN" : "START GAME"}
          </button>
        </div>

        {/* Mobile d-pad */}
        <div className="grid grid-cols-3 gap-1 lg:hidden shrink-0 w-fit mx-auto">
          <div />
          <button className="btn btn-square btn-xs btn-outline" onClick={() => changeDirection(0)} disabled={gameState !== "playing"}>↑</button>
          <div />
          <button className="btn btn-square btn-xs btn-outline" onClick={() => changeDirection(3)} disabled={gameState !== "playing"}>←</button>
          <button className="btn btn-square btn-xs btn-outline" onClick={() => changeDirection(2)} disabled={gameState !== "playing"}>↓</button>
          <button className="btn btn-square btn-xs btn-outline" onClick={() => changeDirection(1)} disabled={gameState !== "playing"}>→</button>
        </div>
      </div>

      {/* RIGHT — Tx feed fills height, session wallet pinned bottom */}
      <div className="hidden lg:flex flex-col gap-2 w-96 shrink-0 overflow-hidden">
        <div className="flex-1 min-h-0 overflow-hidden">
          <TransactionFeed txFeed={txFeed} moveCount={moveCount} />
        </div>
        <div className="shrink-0">
          <SessionWallet />
        </div>
      </div>

    </div>
  );
};

export default Home;
