//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

contract SnakeGame {
    enum Direction { UP, RIGHT, DOWN, LEFT }

    struct GameSession {
        address player;      // session wallet (msg.sender)
        address mainWallet;  // main wallet passed by client
        uint64 startTime;
        uint64 endTime;
        uint32 score;
        uint32 moveCount;
        bool isActive;
    }

    struct LeaderboardEntry {
        address player;      // main wallet address shown on leaderboard
        uint32 score;
        uint32 moveCount;
        uint256 gameId;
    }

    uint256 public nextGameId;
    mapping(uint256 => GameSession) public games;
    mapping(address => uint256) public activeGame;

    uint256 public constant MAX_LEADERBOARD = 10;
    LeaderboardEntry[] public leaderboard;

    event GameStarted(uint256 indexed gameId, address indexed player, address indexed mainWallet, uint64 startTime);
    event DirectionChanged(uint256 indexed gameId, address indexed player, Direction direction, uint32 moveCount);
    event GameEnded(uint256 indexed gameId, address indexed player, address indexed mainWallet, uint32 score, uint32 moveCount);

    function startGame(address mainWallet) external returns (uint256 gameId) {
        if (activeGame[msg.sender] != 0) {
            GameSession storage prev = games[activeGame[msg.sender]];
            if (prev.isActive) {
                prev.isActive = false;
                prev.endTime = uint64(block.timestamp);
            }
        }

        gameId = ++nextGameId;
        games[gameId] = GameSession({
            player: msg.sender,
            mainWallet: mainWallet,
            startTime: uint64(block.timestamp),
            endTime: 0,
            score: 0,
            moveCount: 0,
            isActive: true
        });
        activeGame[msg.sender] = gameId;

        emit GameStarted(gameId, msg.sender, mainWallet, uint64(block.timestamp));
    }

    function changeDirection(uint256 gameId, Direction direction) external {
        GameSession storage game = games[gameId];
        require(game.isActive, "Game not active");
        require(game.player == msg.sender, "Not your game");

        game.moveCount++;
        emit DirectionChanged(gameId, msg.sender, direction, game.moveCount);
    }

    function endGame(uint256 gameId, uint32 score) external {
        GameSession storage game = games[gameId];
        require(game.isActive, "Game not active");
        require(game.player == msg.sender, "Not your game");

        game.isActive = false;
        game.endTime = uint64(block.timestamp);
        game.score = score;

        // Only update leaderboard for non-zero scores
        if (score > 0) {
            address displayAddress = game.mainWallet != address(0) ? game.mainWallet : msg.sender;
            _updateLeaderboard(gameId, displayAddress, score, game.moveCount);
            emit GameEnded(gameId, msg.sender, game.mainWallet, score, game.moveCount);
        }
    }

    function _updateLeaderboard(uint256 gameId, address player, uint32 score, uint32 moveCount) internal {
        LeaderboardEntry memory entry = LeaderboardEntry({
            player: player,
            score: score,
            moveCount: moveCount,
            gameId: gameId
        });

        if (leaderboard.length < MAX_LEADERBOARD) {
            leaderboard.push(entry);
            _sortLeaderboard();
            return;
        }

        if (score > leaderboard[leaderboard.length - 1].score) {
            leaderboard[leaderboard.length - 1] = entry;
            _sortLeaderboard();
        }
    }

    function _sortLeaderboard() internal {
        uint256 len = leaderboard.length;
        for (uint256 i = 1; i < len; i++) {
            LeaderboardEntry memory key = leaderboard[i];
            uint256 j = i;
            while (j > 0 && leaderboard[j - 1].score < key.score) {
                leaderboard[j] = leaderboard[j - 1];
                j--;
            }
            leaderboard[j] = key;
        }
    }

    function getLeaderboard() external view returns (LeaderboardEntry[] memory) {
        return leaderboard;
    }

    function getGame(uint256 gameId) external view returns (GameSession memory) {
        return games[gameId];
    }
}
