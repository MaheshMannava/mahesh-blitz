"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Address, WalletClient, decodeEventLog, encodeFunctionData, getContract } from "viem";
import { useAccount } from "wagmi";
import { SNAKE_GAME_ABI } from "~~/contracts/snakeGameAbi";
import { useSessionWallet } from "~~/hooks/useSessionWallet";

export const GRID_SIZE = 30;
export const TICK_MS = 200;
export const GAME_DURATION = 60;

export enum Direction {
  UP = 0,
  RIGHT = 1,
  DOWN = 2,
  LEFT = 3,
}

export type Position = { x: number; y: number };

export type TxRecord = {
  id: string;
  hash?: `0x${string}`;
  direction: Direction;
  submittedAt: number;
  confirmedAt?: number;
  status: "pending" | "confirmed" | "failed";
};

type GameState = "idle" | "playing" | "ended";

function randomFood(snake: Position[]): Position {
  let pos: Position;
  do {
    pos = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
  } while (snake.some(s => s.x === pos.x && s.y === pos.y));
  return pos;
}

const DIRECTION_VECTORS: Record<Direction, Position> = {
  [Direction.UP]: { x: 0, y: -1 },
  [Direction.RIGHT]: { x: 1, y: 0 },
  [Direction.DOWN]: { x: 0, y: 1 },
  [Direction.LEFT]: { x: -1, y: 0 },
};

const OPPOSITES: Record<Direction, Direction> = {
  [Direction.UP]: Direction.DOWN,
  [Direction.DOWN]: Direction.UP,
  [Direction.LEFT]: Direction.RIGHT,
  [Direction.RIGHT]: Direction.LEFT,
};

const INITIAL_SNAKE: Position[] = [
  { x: 15, y: 15 },
  { x: 14, y: 15 },
  { x: 13, y: 15 },
  { x: 12, y: 15 },
];

export function useSnakeGame(contractAddress?: Address) {
  const { walletClient, publicClient, account } = useSessionWallet();
  const { address: mainWallet } = useAccount();

  const [snake, setSnake] = useState<Position[]>(INITIAL_SNAKE);
  const [food, setFood] = useState<Position>({ x: 15, y: 15 });
  const [direction, setDirection] = useState<Direction>(Direction.RIGHT);
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState<GameState>("idle");
  const [gameId, setGameId] = useState<bigint | null>(null);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [txFeed, setTxFeed] = useState<TxRecord[]>([]);
  const [moveCount, setMoveCount] = useState(0);
  const [isTxPending, setIsTxPending] = useState(false);

  const directionRef = useRef(direction);
  const snakeRef = useRef(snake);
  const foodRef = useRef(food);
  const scoreRef = useRef(score);
  const gameStateRef = useRef(gameState);
  const gameIdRef = useRef(gameId);
  const isTxPendingRef = useRef(false);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => { directionRef.current = direction; }, [direction]);
  useEffect(() => { snakeRef.current = snake; }, [snake]);
  useEffect(() => { foodRef.current = food; }, [food]);
  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);
  useEffect(() => { gameIdRef.current = gameId; }, [gameId]);

  const getContractInstance = useCallback(() => {
    if (!walletClient || !contractAddress) return null;
    return getContract({
      address: contractAddress,
      abi: SNAKE_GAME_ABI,
      client: { public: publicClient, wallet: walletClient as WalletClient },
    });
  }, [walletClient, publicClient, contractAddress]);

  const tick = useCallback(() => {
    if (gameStateRef.current !== "playing") return;

    const currentSnake = snakeRef.current;
    const currentDir = directionRef.current;
    const currentFood = foodRef.current;
    const head = currentSnake[0];
    const vec = DIRECTION_VECTORS[currentDir];
    const newHead: Position = { x: head.x + vec.x, y: head.y + vec.y };

    if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
      endGame();
      return;
    }

    const willGrow = newHead.x === currentFood.x && newHead.y === currentFood.y;
    const body = willGrow ? currentSnake : currentSnake.slice(0, -1);
    if (body.some(s => s.x === newHead.x && s.y === newHead.y)) {
      endGame();
      return;
    }

    let newSnake: Position[];
    if (willGrow) {
      newSnake = [newHead, ...currentSnake];
      setScore(prev => prev + 1);
      scoreRef.current += 1;
      const newFood = randomFood(newSnake);
      setFood(newFood);
      foodRef.current = newFood;
    } else {
      newSnake = [newHead, ...currentSnake.slice(0, -1)];
    }

    setSnake(newSnake);
    snakeRef.current = newSnake;
  }, []);

  const endGame = useCallback(async () => {
    if (gameStateRef.current !== "playing") return;
    setGameState("ended");
    gameStateRef.current = "ended";
    setIsTxPending(false);
    isTxPendingRef.current = false;

    if (tickRef.current) clearInterval(tickRef.current);
    if (timerRef.current) clearInterval(timerRef.current);

    const contract = getContractInstance();
    const gId = gameIdRef.current;
    if (contract && gId && account) {
      try {
        await (contract.write as any).endGame([gId, Number(scoreRef.current)], { account });
      } catch (e) {
        console.error("endGame tx failed:", e);
      }
    }
  }, [getContractInstance, account]);

  const changeDirection = useCallback(
    async (newDir: Direction) => {
      if (gameStateRef.current !== "playing") return;
      if (OPPOSITES[newDir] === directionRef.current) return;
      if (newDir === directionRef.current) return;

      directionRef.current = newDir;
      setDirection(newDir);

      if (isTxPendingRef.current) return;

      if (!walletClient || !contractAddress || !account) return;
      const gId = gameIdRef.current;
      if (!gId) return;

      isTxPendingRef.current = true;
      setIsTxPending(true);
      setMoveCount(prev => prev + 1);

      const txId = `tx-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      try {
        // Encode calldata ourselves and use sendTransaction with fixed gas
        // to skip eth_estimateGas round trip — changeDirection is a simple storage write
        const data = encodeFunctionData({
          abi: SNAKE_GAME_ABI,
          functionName: "changeDirection",
          args: [gId, newDir],
        });

        const hash = await walletClient.sendTransaction({
          to: contractAddress,
          data,
          gas: 100_000n,
          account,
        });

        // submittedAt = right after we get the hash back (tx is in mempool)
        const submittedAt = Date.now();

        setTxFeed(prev => [
          { id: txId, hash, direction: newDir, submittedAt, status: "pending" as const },
          ...prev.slice(0, 49),
        ]);

        const receipt = await publicClient.waitForTransactionReceipt({ hash, confirmations: 1 });
        setTxFeed(prev =>
          prev.map(tx =>
            tx.id === txId
              ? { ...tx, status: (receipt.status === "success" ? "confirmed" : "failed") as const, confirmedAt: Date.now() }
              : tx,
          ),
        );
      } catch (err) {
        console.error("direction tx failed:", err);
        setTxFeed(prev => [
          { id: txId, direction: newDir, submittedAt: Date.now(), status: "failed" as const, confirmedAt: Date.now() },
          ...prev.slice(0, 49),
        ]);
      } finally {
        isTxPendingRef.current = false;
        setIsTxPending(false);
      }
    },
    [walletClient, contractAddress, account, publicClient],
  );

  const startGame = useCallback(async () => {
    const contract = getContractInstance();
    if (!contract || !account || !contractAddress) return;

    setSnake(INITIAL_SNAKE);
    snakeRef.current = INITIAL_SNAKE;
    setFood({ x: 22, y: 15 });
    foodRef.current = { x: 22, y: 15 };
    setDirection(Direction.RIGHT);
    directionRef.current = Direction.RIGHT;
    setScore(0);
    scoreRef.current = 0;
    setTimeLeft(GAME_DURATION);
    setTxFeed([]);
    setMoveCount(0);
    setIsTxPending(false);
    isTxPendingRef.current = false;

    try {
      const playerAddress = mainWallet ?? account.address;
      const hash = await (contract.write as any).startGame([playerAddress], { account });
      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      let gId: bigint | null = null;
      for (const log of receipt.logs) {
        try {
          const decoded = decodeEventLog({ abi: SNAKE_GAME_ABI, data: log.data, topics: log.topics });
          if (decoded.eventName === "GameStarted") {
            gId = (decoded.args as any).gameId;
            break;
          }
        } catch {
          // Not our event
        }
      }

      if (!gId) {
        const nextId = await publicClient.readContract({
          address: contractAddress,
          abi: SNAKE_GAME_ABI,
          functionName: "nextGameId",
        });
        gId = nextId as bigint;
      }

      setGameId(gId);
      gameIdRef.current = gId;
      setGameState("playing");
      gameStateRef.current = "playing";

      tickRef.current = setInterval(tick, TICK_MS);
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            endGame();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (e) {
      console.error("Failed to start game:", e);
    }
  }, [getContractInstance, account, publicClient, contractAddress, tick, endGame, mainWallet]);

  useEffect(() => {
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return {
    snake,
    food,
    direction,
    score,
    gameState,
    gameId,
    timeLeft,
    txFeed,
    moveCount,
    isTxPending,
    startGame,
    endGame,
    changeDirection,
  };
}
