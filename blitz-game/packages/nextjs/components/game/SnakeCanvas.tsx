"use client";

import { useCallback, useEffect, useRef } from "react";
import { Direction, GRID_SIZE, TICK_MS, type Position } from "~~/hooks/useSnakeGame";

type SnakeCanvasProps = {
  snake: Position[];
  food: Position;
  gameState: "idle" | "playing" | "ended";
  isTxPending: boolean;
  onDirectionChange: (dir: Direction) => void;
};

const CANVAS_SIZE = 600;
const CELL_SIZE = CANVAS_SIZE / GRID_SIZE;

const SNAKE_YELLOW = "#F5D800";
const SNAKE_YELLOW_DARK = "#C9A800";
const SNAKE_YELLOW_LIGHT = "#FFE84D";

function drawRoundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawEyes(ctx: CanvasRenderingContext2D, segment: Position, direction: Direction, cellSize: number) {
  const cx = segment.x * cellSize + cellSize / 2;
  const cy = segment.y * cellSize + cellSize / 2;

  // Eye positions relative to direction
  const eyeForward = cellSize * 0.2;
  const eyeSide = cellSize * 0.24;
  const eyeR = cellSize * 0.14;
  const pupilR = eyeR * 0.52;

  let eye1: [number, number], eye2: [number, number];
  switch (direction) {
    case Direction.RIGHT:
      eye1 = [cx + eyeForward, cy - eyeSide];
      eye2 = [cx + eyeForward, cy + eyeSide];
      break;
    case Direction.LEFT:
      eye1 = [cx - eyeForward, cy - eyeSide];
      eye2 = [cx - eyeForward, cy + eyeSide];
      break;
    case Direction.UP:
      eye1 = [cx - eyeSide, cy - eyeForward];
      eye2 = [cx + eyeSide, cy - eyeForward];
      break;
    case Direction.DOWN:
    default:
      eye1 = [cx - eyeSide, cy + eyeForward];
      eye2 = [cx + eyeSide, cy + eyeForward];
  }

  [eye1, eye2].forEach(([ex, ey]) => {
    // White
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(ex, ey, eyeR, 0, Math.PI * 2);
    ctx.fill();
    // Dark border on eye
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 0.8;
    ctx.stroke();
    // Pupil
    ctx.fillStyle = "#111";
    ctx.beginPath();
    ctx.arc(ex, ey, pupilR, 0, Math.PI * 2);
    ctx.fill();
    // Eye shine
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.beginPath();
    ctx.arc(ex - pupilR * 0.4, ey - pupilR * 0.4, pupilR * 0.35, 0, Math.PI * 2);
    ctx.fill();
  });
}

export function SnakeCanvas({ snake, food, gameState, isTxPending, onDirectionChange }: SnakeCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const isTxPendingRef = useRef(isTxPending);
  const directionRef = useRef<Direction>(Direction.RIGHT);

  // Interpolation state — track previous snake positions and the time of the last tick
  const prevSnakeRef = useRef<Position[]>(snake);
  const lastTickTimeRef = useRef(performance.now());

  useEffect(() => {
    isTxPendingRef.current = isTxPending;
  }, [isTxPending]);

  // When the snake prop changes (a tick happened), save previous positions and record time
  useEffect(() => {
    prevSnakeRef.current = snake;
    lastTickTimeRef.current = performance.now();
  }, [snake]);

  const draw = useCallback(
    (currentDirection: Direction, t: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dpr = typeof window !== "undefined" ? (window.devicePixelRatio || 1) : 1;
      const displaySize = canvas.clientWidth || CANVAS_SIZE;
      const physicalSize = Math.round(displaySize * dpr);
      if (canvas.width !== physicalSize || canvas.height !== physicalSize) {
        canvas.width = physicalSize;
        canvas.height = physicalSize;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const S = displaySize;
      const cellSize = S / GRID_SIZE;

      // Interpolation factor 0→1 between prev and current snake positions
      const elapsed = t - lastTickTimeRef.current;
      const lerp = Math.min(elapsed / TICK_MS, 1);

      ctx.fillStyle = "#0f0a1e";
      ctx.fillRect(0, 0, S, S);

      ctx.fillStyle = "#1e1540";
      for (let x = 0; x <= GRID_SIZE; x++) {
        for (let y = 0; y <= GRID_SIZE; y++) {
          ctx.beginPath();
          ctx.arc(x * cellSize, y * cellSize, 0.9, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Food
      const pulse = 0.88 + 0.12 * Math.sin(t / 180);
      const fx = food.x * cellSize + cellSize / 2;
      const fy = food.y * cellSize + cellSize / 2;
      const foodR = (cellSize / 2 - 1) * pulse;

      const grd = ctx.createRadialGradient(fx, fy, 0, fx, fy, foodR * 3);
      grd.addColorStop(0, "rgba(255,51,102,0.4)");
      grd.addColorStop(1, "rgba(255,51,102,0)");
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(fx, fy, foodR * 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowColor = "#ff3366";
      ctx.shadowBlur = 20;
      ctx.fillStyle = "#ff3366";
      ctx.beginPath();
      ctx.arc(fx, fy, foodR, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.beginPath();
      ctx.arc(fx - foodR * 0.3, fy - foodR * 0.3, foodR * 0.3, 0, Math.PI * 2);
      ctx.fill();

      // Snake with interpolation
      const prev = prevSnakeRef.current;
      const len = snake.length;
      for (let i = len - 1; i >= 0; i--) {
        const segment = snake[i];
        const isHead = i === 0;
        const isTail = i === len - 1;

        // Interpolate from previous position to current
        let drawX: number, drawY: number;
        if (gameState === "playing" && i < prev.length) {
          drawX = (prev[i].x + (segment.x - prev[i].x) * lerp) * cellSize;
          drawY = (prev[i].y + (segment.y - prev[i].y) * lerp) * cellSize;
        } else {
          drawX = segment.x * cellSize;
          drawY = segment.y * cellSize;
        }

        const pad = isHead ? 3 : isTail ? 5 : 4;
        const size = cellSize - pad * 2;
        const radius = isHead ? cellSize * 0.28 : isTail ? cellSize * 0.26 : cellSize * 0.2;

        ctx.fillStyle = SNAKE_YELLOW_DARK;
        drawRoundRect(ctx, drawX + pad - 1, drawY + pad - 1, size + 2, size + 2, radius + 1);
        ctx.fill();

        ctx.fillStyle = SNAKE_YELLOW;
        drawRoundRect(ctx, drawX + pad, drawY + pad, size, size, radius);
        ctx.fill();

        ctx.fillStyle = SNAKE_YELLOW_LIGHT;
        drawRoundRect(ctx, drawX + pad + 2, drawY + pad + 2, size * 0.55, size * 0.3, radius * 0.5);
        ctx.fill();

        if (isHead) {
          const interpSegment = { x: drawX / cellSize, y: drawY / cellSize };
          drawEyes(ctx, interpSegment, currentDirection, cellSize);
        }

        if (!isHead && !isTail) {
          ctx.strokeStyle = SNAKE_YELLOW_DARK;
          ctx.lineWidth = 1;
          ctx.globalAlpha = 0.3;
          ctx.beginPath();
          ctx.moveTo(drawX + pad, drawY + cellSize / 2);
          ctx.lineTo(drawX + pad + size, drawY + cellSize / 2);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
      }

      if (isTxPendingRef.current && gameState === "playing") {
        const alpha = 0.35 + 0.45 * Math.abs(Math.sin(t / 220));
        ctx.strokeStyle = `rgba(245,158,11,${alpha})`;
        ctx.lineWidth = 4;
        ctx.strokeRect(2, 2, S - 4, S - 4);
      }

      if (gameState === "ended") {
        ctx.fillStyle = "rgba(15,10,30,0.85)";
        ctx.fillRect(0, 0, S, S);
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#ffffff";
        ctx.font = `${Math.round(S * 0.075)}px 'Archivo Black', sans-serif`;
        ctx.fillText("GAME OVER", S / 2, S / 2 - S * 0.055);
        ctx.font = `${Math.round(S * 0.033)}px 'DM Mono', monospace`;
        ctx.fillStyle = "#836FFF";
        ctx.fillText("Press Start to play again", S / 2, S / 2 + S * 0.04);
        ctx.textBaseline = "alphabetic";
      }

      if (gameState === "idle") {
        ctx.fillStyle = "rgba(15,10,30,0.78)";
        ctx.fillRect(0, 0, S, S);
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = SNAKE_YELLOW;
        ctx.font = `${Math.round(S * 0.065)}px 'Archivo Black', sans-serif`;
        ctx.fillText("START THE GAME", S / 2, S / 2 - S * 0.05);
        ctx.font = `${Math.round(S * 0.045)}px 'DM Mono', monospace`;
        ctx.fillStyle = "rgba(255,255,255,0.9)";
        ctx.fillText("Every move is a transaction", S / 2, S / 2 + S * 0.055);
        ctx.textBaseline = "alphabetic";
      }
    },
    [snake, food, gameState],
  );

  useEffect(() => {
    let frame: number;
    const loop = (t: number) => {
      draw(directionRef.current, t);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [draw]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      let newDir: Direction | null = null;
      switch (e.key) {
        case "ArrowUp":    case "w": case "W": e.preventDefault(); newDir = Direction.UP;    break;
        case "ArrowRight": case "d": case "D": e.preventDefault(); newDir = Direction.RIGHT; break;
        case "ArrowDown":  case "s": case "S": e.preventDefault(); newDir = Direction.DOWN;  break;
        case "ArrowLeft":  case "a": case "A": e.preventDefault(); newDir = Direction.LEFT;  break;
      }
      if (newDir !== null) {
        directionRef.current = newDir;
        onDirectionChange(newDir);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onDirectionChange]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStartRef.current) return;
      const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
      const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
      if (Math.abs(dx) < 30 && Math.abs(dy) < 30) return;
      let newDir: Direction;
      if (Math.abs(dx) > Math.abs(dy)) {
        newDir = dx > 0 ? Direction.RIGHT : Direction.LEFT;
      } else {
        newDir = dy > 0 ? Direction.DOWN : Direction.UP;
      }
      directionRef.current = newDir;
      onDirectionChange(newDir);
      touchStartRef.current = null;
    },
    [onDirectionChange],
  );

  return (
    <div className="w-full h-full flex items-center">
      <canvas
        ref={canvasRef}
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        className={`rounded-xl transition-all duration-150 w-full aspect-square block ${
          isTxPending && gameState === "playing" ? "border-2 border-warning/60" : "border border-[#1e1540]"
        }`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{ touchAction: "none", maxHeight: "100%" }}
      />
    </div>
  );
}
