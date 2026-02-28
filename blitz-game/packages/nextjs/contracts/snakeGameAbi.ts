export const SNAKE_GAME_ABI = [
  {
    inputs: [{ internalType: "address", name: "mainWallet", type: "address" }],
    name: "startGame",
    outputs: [{ internalType: "uint256", name: "gameId", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "gameId", type: "uint256" },
      { internalType: "uint8", name: "direction", type: "uint8" },
    ],
    name: "changeDirection",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "gameId", type: "uint256" },
      { internalType: "uint32", name: "score", type: "uint32" },
    ],
    name: "endGame",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "getLeaderboard",
    outputs: [
      {
        components: [
          { internalType: "address", name: "player", type: "address" },
          { internalType: "uint32", name: "score", type: "uint32" },
          { internalType: "uint32", name: "moveCount", type: "uint32" },
          { internalType: "uint256", name: "gameId", type: "uint256" },
        ],
        internalType: "struct SnakeGame.LeaderboardEntry[]",
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "gameId", type: "uint256" }],
    name: "getGame",
    outputs: [
      {
        components: [
          { internalType: "address", name: "player", type: "address" },
          { internalType: "address", name: "mainWallet", type: "address" },
          { internalType: "uint64", name: "startTime", type: "uint64" },
          { internalType: "uint64", name: "endTime", type: "uint64" },
          { internalType: "uint32", name: "score", type: "uint32" },
          { internalType: "uint32", name: "moveCount", type: "uint32" },
          { internalType: "bool", name: "isActive", type: "bool" },
        ],
        internalType: "struct SnakeGame.GameSession",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "nextGameId",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "gameId", type: "uint256" },
      { indexed: true, internalType: "address", name: "player", type: "address" },
      { indexed: true, internalType: "address", name: "mainWallet", type: "address" },
      { indexed: false, internalType: "uint64", name: "startTime", type: "uint64" },
    ],
    name: "GameStarted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "gameId", type: "uint256" },
      { indexed: true, internalType: "address", name: "player", type: "address" },
      { indexed: false, internalType: "uint8", name: "direction", type: "uint8" },
      { indexed: false, internalType: "uint32", name: "moveCount", type: "uint32" },
    ],
    name: "DirectionChanged",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "gameId", type: "uint256" },
      { indexed: true, internalType: "address", name: "player", type: "address" },
      { indexed: true, internalType: "address", name: "mainWallet", type: "address" },
      { indexed: false, internalType: "uint32", name: "score", type: "uint32" },
      { indexed: false, internalType: "uint32", name: "moveCount", type: "uint32" },
    ],
    name: "GameEnded",
    type: "event",
  },
] as const;
