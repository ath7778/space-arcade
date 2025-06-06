document.addEventListener('DOMContentLoaded', function() {
    const starsContainer = document.querySelector('.stars-container');
    if (starsContainer) {
        createStars(starsContainer, 100);
    }
    
    const gameBoard = document.getElementById('gameBoard');
    
    let gameRunning = false;
    let gamePaused = false;
    let currentLevel = 1;
    let moves = 0;
    let timeSeconds = 0;
    let timer = null;
    let timerStarted = false;
    let hintsUsed = 0;
    
    let playerPosition = { row: 0, col: 0 };
    let goalPosition = { row: 0, col: 0 };
    let teleporters = [];
    let board = [];
    let moveHistory = [];
    
    const totalLevels = 10;
    
    const pathTypes = {
        'I': { north: true, south: true, east: false, west: false },
        'L': { north: true, south: false, east: true, west: false },
        'T': { north: true, south: false, east: true, west: true },
        '-': { north: false, south: false, east: true, west: true },
        '+': { north: true, south: true, east: true, west: true },
        '\\': { north: false, south: true, east: true, west: false },
        '/': { north: false, south: true, east: false, west: true },
        '⊥': { north: false, south: true, east: true, west: true }
    };
    
    const levelDefinitions = [
        {
            size: 3,
            player: { row: 0, col: 0 },
            goal: { row: 2, col: 2 },
            teleporters: [],
            tiles: [
                { row: 0, col: 0, type: 'L', rotation: 1, locked: false },
                { row: 0, col: 1, type: '-', rotation: 0, locked: false },
                { row: 0, col: 2, type: '\\', rotation: 0, locked: false },
                { row: 1, col: 0, type: 'I', rotation: 0, locked: false },
                { row: 1, col: 1, type: '+', rotation: 0, locked: true },
                { row: 1, col: 2, type: 'I', rotation: 0, locked: false },
                { row: 2, col: 0, type: '/', rotation: 0, locked: false },
                { row: 2, col: 1, type: '-', rotation: 0, locked: false },
                { row: 2, col: 2, type: 'L', rotation: 2, locked: false }
            ]
        },
        {
            size: 4,
            player: { row: 0, col: 0 },
            goal: { row: 3, col: 3 },
            teleporters: [],
            tiles: [
                { row: 0, col: 0, type: 'L', rotation: 1, locked: false },
                { row: 0, col: 1, type: '-', rotation: 0, locked: false },
                { row: 0, col: 2, type: 'T', rotation: 0, locked: false },
                { row: 0, col: 3, type: '\\', rotation: 0, locked: false },
                { row: 1, col: 0, type: 'I', rotation: 0, locked: false },
                { row: 1, col: 1, type: 'L', rotation: 0, locked: true },
                { row: 1, col: 2, type: 'I', rotation: 0, locked: false },
                { row: 1, col: 3, type: 'I', rotation: 0, locked: false },
                { row: 2, col: 0, type: 'T', rotation: 3, locked: false },
                { row: 2, col: 1, type: '\\', rotation: 0, locked: false },
                { row: 2, col: 2, type: 'L', rotation: 3, locked: true },
                { row: 2, col: 3, type: 'I', rotation: 0, locked: false },
                { row: 3, col: 0, type: '/', rotation: 0, locked: false },
                { row: 3, col: 1, type: '-', rotation: 0, locked: false },
                { row: 3, col: 2, type: '-', rotation: 0, locked: false },
                { row: 3, col: 3, type: 'L', rotation: 2, locked: false }
            ]
        },
        {
            size: 4,
            player: { row: 0, col: 0 },
            goal: { row: 3, col: 3 },
            teleporters: [
                { row: 1, col: 1, target: { row: 2, col: 2 } }
            ],
            tiles: [
                { row: 0, col: 0, type: 'L', rotation: 1, locked: false },
                { row: 0, col: 1, type: '-', rotation: 0, locked: false },
                { row: 0, col: 2, type: '⊥', rotation: 0, locked: false },
                { row: 0, col: 3, type: '\\', rotation: 0, locked: false },
                { row: 1, col: 0, type: 'I', rotation: 0, locked: false },
                { row: 1, col: 1, type: '+', rotation: 0, locked: true },
                { row: 1, col: 2, type: 'I', rotation: 0, locked: false },
                { row: 1, col: 3, type: 'I', rotation: 0, locked: false },
                { row: 2, col: 0, type: '⊥', rotation: 3, locked: false },
                { row: 2, col: 1, type: 'I', rotation: 0, locked: false },
                { row: 2, col: 2, type: '+', rotation: 0, locked: true },
                { row: 2, col: 3, type: 'I', rotation: 0, locked: false },
                { row: 3, col: 0, type: '/', rotation: 0, locked: false },
                { row: 3, col: 1, type: '-', rotation: 0, locked: false },
                { row: 3, col: 2, type: '-', rotation: 0, locked: false },
                { row: 3, col: 3, type: 'L', rotation: 2, locked: false }
            ]
        }
    ];
    
    for (let i = 3; i < totalLevels; i++) {
        levelDefinitions.push(generateLevel(i + 2));
    }
    
    function generateLevel(size) {
        const level = {
            size: size,
            player: { row: 0, col: 0 },
            goal: { row: size - 1, col: size - 1 },
            teleporters: [],
            tiles: []
        };
        
        const pathTypeKeys = Object.keys(pathTypes);
        
        for (let row = 0; row < size; row++) {
            for (let col = 0; col < size; col++) {
                const randomType = pathTypeKeys[Math.floor(Math.random() * pathTypeKeys.length)];
                const randomRotation = Math.floor(Math.random() * 4);
                const locked = Math.random() < 0.1; // 10% chance of being locked
                
                level.tiles.push({
                    row: row,
                    col: col,
                    type: randomType,
                    rotation: randomRotation,
                    locked: locked
                });
            }
        }
        
        if (size > 3 && Math.random() < 0.5) {
            const teleporterRow1 = Math.floor(Math.random() * size);
            const teleporterCol1 = Math.floor(Math.random() * size);
            let teleporterRow2 = Math.floor(Math.random() * size);
            let teleporterCol2 = Math.floor(Math.random() * size);
            
            while (teleporterRow1 === teleporterRow2 && teleporterCol1 === teleporterCol2) {
                teleporterRow2 = Math.floor(Math.random() * size);
                teleporterCol2 = Math.floor(Math.random() * size);
            }
            
            level.teleporters.push({
                row: teleporterRow1,
                col: teleporterCol1,
                target: { row: teleporterRow2, col: teleporterCol2 }
            });
        }
        
        return level;
    }
    
    function startGame() {
        gameRunning = true;
        gamePaused = false;
        currentLevel = 1;
        moves = 0;
        timeSeconds = 0;
        hintsUsed = 0;
        
        if (timer) {
            clearInterval(timer);
        }
        
        loadLevel(currentLevel);
        updateStats();
        
        document.getElementById('startScreen').classList.add('hidden');
        
        startTimer();
    }
    
    function startTimer() {
        if (timer) {
            clearInterval(timer);
        }
        
        timerStarted = true;
        timer = setInterval(function() {
            if (!gamePaused && gameRunning) {
                timeSeconds++;
                updateStats();
            }
        }, 1000);
    }
    
    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    function updateStats() {
        document.getElementById('timeDisplay').innerText = `Time: ${formatTime(timeSeconds)}`;
        document.getElementById('movesDisplay').innerText = `Moves: ${moves}`;
        document.getElementById('levelDisplay').innerText = `Level: ${currentLevel}`;
    }
    
    function loadLevel(levelNum) {
        const level = levelDefinitions[levelNum - 1];
        
        playerPosition = { ...level.player };
        goalPosition = { ...level.goal };
        teleporters = [...level.teleporters];
        board = [];
        moveHistory = [];
        
        for (let i = 0; i < level.size; i++) {
            const row = [];
            for (let j = 0; j < level.size; j++) {
                row.push(null);
            }
            board.push(row);
        }
        
        level.tiles.forEach(tile => {
            board[tile.row][tile.col] = {
                type: tile.type,
                rotation: tile.rotation,
                locked: tile.locked
            };
        });
        
        renderBoard();
    }
    
    function renderBoard() {
        gameBoard.innerHTML = '';
        gameBoard.style.gridTemplateColumns = `repeat(${board.length}, 1fr)`;
        gameBoard.style.gridTemplateRows = `repeat(${board.length}, 1fr)`;
        
        for (let row = 0; row < board.length; row++) {
            for (let col = 0; col < board[row].length; col++) {
                const tile = board[row][col];
                
                const tileElement = document.createElement('div');
                tileElement.className = 'tile';
                tileElement.dataset.row = row;
                tileElement.dataset.col = col;
                
                if (tile.locked) {
                    tileElement.classList.add('locked');
                }
                
                const pathSegment = document.createElement('div');
                pathSegment.className = 'path-segment';
                pathSegment.style.transform = `rotate(${tile.rotation * 90}deg)`;
                
                const originalPathType = pathTypes[tile.type];
                const rotatedPathType = getRotatedPaths(originalPathType, tile.rotation);
                
                if (rotatedPathType.north) {
                    const northPath = document.createElement('div');
                    northPath.className = 'path-north';
                    pathSegment.appendChild(northPath);
                }
                
                if (rotatedPathType.south) {
                    const southPath = document.createElement('div');
                    southPath.className = 'path-south';
                    pathSegment.appendChild(southPath);
                }
                
                if (rotatedPathType.east) {
                    const eastPath = document.createElement('div');
                    eastPath.className = 'path-east';
                    pathSegment.appendChild(eastPath);
                }
                
                if (rotatedPathType.west) {
                    const westPath = document.createElement('div');
                    westPath.className = 'path-west';
                    pathSegment.appendChild(westPath);
                }
                
                const centerPath = document.createElement('div');
                centerPath.className = 'path-center';
                pathSegment.appendChild(centerPath);
                
                tileElement.appendChild(pathSegment);
                
                if (row === playerPosition.row && col === playerPosition.col) {
                    const shipElement = document.createElement('div');
                    shipElement.className = 'ship';
                    tileElement.appendChild(shipElement);
                }
                
                if (row === goalPosition.row && col === goalPosition.col) {
                    const beaconElement = document.createElement('div');
                    beaconElement.className = 'beacon';
                    tileElement.appendChild(beaconElement);
                }
                
                teleporters.forEach(teleporter => {
                    if (row === teleporter.row && col === teleporter.col) {
                        const teleporterElement = document.createElement('div');
                        teleporterElement.className = 'teleporter';
                        tileElement.appendChild(teleporterElement);
                    }
                });
                
                if (!tile.locked) {
                    tileElement.addEventListener('click', function() {
                        if (gameRunning && !gamePaused) {
                            rotateTile(row, col);
                        }
                    });
                }
                
                gameBoard.appendChild(tileElement);
            }
        }
        
        checkPlayerPath();
    }
    
    function getRotatedPaths(pathType, rotation) {
        const result = { north: false, south: false, east: false, west: false };
        
        if (rotation === 0) {
            return { ...pathType };
        }
        
        if (rotation === 1) {
            result.north = pathType.west;
            result.east = pathType.north;
            result.south = pathType.east;
            result.west = pathType.south;
        } else if (rotation === 2) {
            result.north = pathType.south;
            result.east = pathType.west;
            result.south = pathType.north;
            result.west = pathType.east;
        } else if (rotation === 3) {
            result.north = pathType.east;
            result.east = pathType.south;
            result.south = pathType.west;
            result.west = pathType.north;
        }
        
        return result;
    }
    
    function rotateTile(row, col) {
        if (!timerStarted) {
            startTimer();
        }
        
        const tile = board[row][col];
        
        if (tile.locked) {
            return;
        }
        
        moveHistory.push({
            row: row,
            col: col,
            previousRotation: tile.rotation
        });
        
        tile.rotation = (tile.rotation + 1) % 4;
        moves++;
        
        updateStats();
        renderBoard();
        
        const teleporter = findTeleporter(playerPosition.row, playerPosition.col);
        if (teleporter) {
            teleportPlayer(teleporter);
        }
        
        checkWinCondition();
    }
    
    function checkWinCondition() {
        if (playerPosition.row === goalPosition.row && playerPosition.col === goalPosition.col) {
            if (currentLevel === totalLevels) {
                gameOver();
            } else {
                levelComplete();
            }
        }
    }
    
    function findTeleporter(row, col) {
        return teleporters.find(t => t.row === row && t.col === col);
    }
    
    function teleportPlayer(teleporter) {
        playerPosition = { ...teleporter.target };
        renderBoard();
    }
    
    function checkPlayerPath() {
        const visited = Array(board.length).fill().map(() => Array(board[0].length).fill(false));
        const queue = [{ ...playerPosition }];
        visited[playerPosition.row][playerPosition.col] = true;
        
        while (queue.length > 0) {
            const current = queue.shift();
            
            if (current.row === goalPosition.row && current.col === goalPosition.col) {
                return;
            }
            
            const neighbors = getConnectedNeighbors(current.row, current.col);
            
            for (const neighbor of neighbors) {
                if (!visited[neighbor.row][neighbor.col]) {
                    visited[neighbor.row][neighbor.col] = true;
                    queue.push(neighbor);
                    
                    const teleporter = findTeleporter(neighbor.row, neighbor.col);
                    if (teleporter && !visited[teleporter.target.row][teleporter.target.col]) {
                        visited[teleporter.target.row][teleporter.target.col] = true;
                        queue.push({ ...teleporter.target });
                    }
                }
            }
        }
    }
    
    function getConnectedNeighbors(row, col) {
        const neighbors = [];
        const currentTile = board[row][col];
        const currentPaths = getRotatedPaths(pathTypes[currentTile.type], currentTile.rotation);
        
        const directions = [
            { dir: 'north', row: row - 1, col: col },
            { dir: 'south', row: row + 1, col: col },
            { dir: 'east', row: row, col: col + 1 },
            { dir: 'west', row: row, col: col - 1 }
        ];
        
        for (const direction of directions) {
            if (direction.row >= 0 && direction.row < board.length &&
                direction.col >= 0 && direction.col < board[0].length) {
                
                const neighborTile = board[direction.row][direction.col];
                const neighborPaths = getRotatedPaths(pathTypes[neighborTile.type], neighborTile.rotation);
                
                const isConnected = (direction.dir === 'north' && currentPaths.north && neighborPaths.south) ||
                                   (direction.dir === 'south' && currentPaths.south && neighborPaths.north) ||
                                   (direction.dir === 'east' && currentPaths.east && neighborPaths.west) ||
                                   (direction.dir === 'west' && currentPaths.west && neighborPaths.east);
                
                if (isConnected) {
                    neighbors.push({ row: direction.row, col: direction.col });
                }
            }
        }
        
        return neighbors;
    }
    
    function undoMove() {
        if (moveHistory.length === 0) {
            return;
        }
        
        const lastMove = moveHistory.pop();
        board[lastMove.row][lastMove.col].rotation = lastMove.previousRotation;
        
        if (moves > 0) {
            moves--;
        }
        
        updateStats();
        renderBoard();
    }
    
    function resetLevel() {
        loadLevel(currentLevel);
        moves = 0;
        updateStats();
    }
    
    function showHint() {
        if (hintsUsed >= 3) {
            return;
        }
        
        hintsUsed++;
        
        const nonLockedTiles = [];
        
        for (let row = 0; row < board.length; row++) {
            for (let col = 0; col < board[row].length; col++) {
                if (!board[row][col].locked) {
                    nonLockedTiles.push({ row, col });
                }
            }
        }
        
        if (nonLockedTiles.length > 0) {
            const randomTile = nonLockedTiles[Math.floor(Math.random() * nonLockedTiles.length)];
            const tileElement = document.querySelector(`.tile[data-row="${randomTile.row}"][data-col="${randomTile.col}"]`);
            
            tileElement.style.boxShadow = '0 0 20px #ffff00';
            
            setTimeout(() => {
                tileElement.style.boxShadow = '';
            }, 3000);
        }
    }
    
    function levelComplete() {
        gameRunning = false;
        
        document.getElementById('levelTime').innerText = formatTime(timeSeconds);
        document.getElementById('levelMoves').innerText = moves;
        
        const stars = calculateStars();
        
        for (let i = 1; i <= 3; i++) {
            const starElement = document.getElementById(`star${i}`);
            if (i <= stars) {
                starElement.className = 'fas fa-star';
            } else {
                starElement.className = 'far fa-star';
            }
        }
        
        document.getElementById('levelCompleteScreen').classList.remove('hidden');
    }
    
    function calculateStars() {
        const level = levelDefinitions[currentLevel - 1];
        const baseMinMoves = level.size * 3;
        const maxTimeForThreeStars = level.size * 20;
        
        if (moves <= baseMinMoves && timeSeconds <= maxTimeForThreeStars) {
            return 3;
        } else if (moves <= baseMinMoves * 1.5 && timeSeconds <= maxTimeForThreeStars * 1.5) {
            return 2;
        } else {
            return 1;
        }
    }
    
    function startNextLevel() {
        currentLevel++;
        gameRunning = true;
        moves = 0;
        
        loadLevel(currentLevel);
        updateStats();
        
        document.getElementById('levelCompleteScreen').classList.add('hidden');
    }
    
    function gameOver() {
        gameRunning = false;
        
        if (timer) {
            clearInterval(timer);
        }
        
        document.getElementById('finalTime').innerText = formatTime(timeSeconds);
        document.getElementById('finalMoves').innerText = moves;
        document.getElementById('finalLevels').innerText = currentLevel;
        
        document.getElementById('gameOverScreen').classList.remove('hidden');
    }
    
    function togglePause() {
        if (!gameRunning) return;
        
        gamePaused = !gamePaused;
        
        if (gamePaused) {
            document.getElementById('pauseScreen').classList.remove('hidden');
        } else {
            document.getElementById('pauseScreen').classList.add('hidden');
        }
    }
    
    function toggleMute() {
        const muteBtn = document.getElementById('muteBtn');
        if (muteBtn.innerHTML.includes('volume-up')) {
            muteBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
        } else {
            muteBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
        }
    }
    
    function toggleHelp() {
        document.getElementById('helpModal').classList.toggle('hidden');
    }
    
    document.getElementById('startBtn').addEventListener('click', startGame);
    document.getElementById('resumeBtn').addEventListener('click', togglePause);
    document.getElementById('restartBtn').addEventListener('click', function() {
        document.getElementById('pauseScreen').classList.add('hidden');
        resetLevel();
        gameRunning = true;
        gamePaused = false;
    });
    document.getElementById('restartGameBtn').addEventListener('click', function() {
        document.getElementById('gameOverScreen').classList.add('hidden');
        startGame();
    });
    document.getElementById('nextLevelBtn').addEventListener('click', startNextLevel);
    document.getElementById('helpBtn').addEventListener('click', toggleHelp);
    document.getElementById('closeHelpBtn').addEventListener('click', toggleHelp);
    document.getElementById('muteBtn').addEventListener('click', toggleMute);
    document.getElementById('pauseBtn').addEventListener('click', togglePause);
    
    document.getElementById('undoBtn').addEventListener('click', undoMove);
    document.getElementById('resetBtn').addEventListener('click', resetLevel);
    document.getElementById('hintBtn').addEventListener('click', showHint);
    
    document.addEventListener('keydown', function(event) {
        if (event.key === 'p') {
            togglePause();
        } else if (event.key === 'm') {
            toggleMute();
        } else if (event.key === 'h') {
            toggleHelp();
        } else if (event.key === 'z' && (event.ctrlKey || event.metaKey)) {
            undoMove();
        } else if (event.key === 'r' && (event.ctrlKey || event.metaKey)) {
            resetLevel();
        }
    });
    
    function createStars(container, count) {
        for (let i = 0; i < count; i++) {
            const star = document.createElement('div');
            star.className = 'star';
            
            const x = Math.random() * 100;
            const y = Math.random() * 100;
            const delay = Math.random() * 15;
            const duration = 5 + Math.random() * 10;
            
            star.style.left = `${x}%`;
            star.style.top = `${y}%`;
            star.style.animationDelay = `${delay}s`;
            star.style.animationDuration = `${duration}s`;
            
            const size = Math.random() * 3 + 1;
            star.style.width = `${size}px`;
            star.style.height = `${size}px`;
            
            const opacity = Math.random() * 0.5 + 0.3;
            star.style.opacity = opacity;
            
            container.appendChild(star);
        }
    }
});
