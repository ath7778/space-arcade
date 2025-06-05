document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    const starsContainer = document.querySelector('.stars-container');
    if (starsContainer) {
        createStars(starsContainer, 100);
    }
    
    function resizeCanvas() {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
    }
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    const gameState = {
        running: false,
        paused: false,
        isMuted: false,
        level: 1,
        moves: 0,
        time: 0,
        timeStart: 0,
        levelStarted: false,
        levelCompleted: false,
        grid: [],
        particles: [],
        selectedParticle: null,
        targetPatterns: [],
        currentPatterns: []
    };
    
    const levels = [
        {
            grid: [3, 3],
            particles: [
                { type: 'electron', x: 0, y: 0, state: 'up' },
                { type: 'electron', x: 2, y: 0, state: 'down' },
                { type: 'electron', x: 0, y: 2, state: 'down' },
                { type: 'electron', x: 2, y: 2, state: 'up' }
            ],
            targetPattern: [
                { type: 'electron', x: 0, y: 0, state: 'up' },
                { type: 'electron', x: 2, y: 0, state: 'up' },
                { type: 'electron', x: 0, y: 2, state: 'up' },
                { type: 'electron', x: 2, y: 2, state: 'up' }
            ]
        },
        {
            grid: [4, 4],
            particles: [
                { type: 'electron', x: 0, y: 0, state: 'up' },
                { type: 'electron', x: 3, y: 0, state: 'down' },
                { type: 'electron', x: 0, y: 3, state: 'down' },
                { type: 'electron', x: 3, y: 3, state: 'up' },
                { type: 'photon', x: 1, y: 1, state: 'horizontal' },
                { type: 'photon', x: 2, y: 2, state: 'vertical' }
            ],
            targetPattern: [
                { type: 'electron', x: 0, y: 0, state: 'up' },
                { type: 'electron', x: 3, y: 0, state: 'up' },
                { type: 'electron', x: 0, y: 3, state: 'up' },
                { type: 'electron', x: 3, y: 3, state: 'up' },
                { type: 'photon', x: 1, y: 1, state: 'horizontal' },
                { type: 'photon', x: 2, y: 2, state: 'horizontal' }
            ]
        },
        {
            grid: [5, 5],
            particles: [
                { type: 'electron', x: 0, y: 0, state: 'up' },
                { type: 'electron', x: 4, y: 0, state: 'down' },
                { type: 'electron', x: 0, y: 4, state: 'down' },
                { type: 'electron', x: 4, y: 4, state: 'up' },
                { type: 'photon', x: 2, y: 1, state: 'horizontal' },
                { type: 'photon', x: 1, y: 2, state: 'vertical' },
                { type: 'photon', x: 3, y: 2, state: 'diagonal' },
                { type: 'photon', x: 2, y: 3, state: 'antidiagonal' },
                { type: 'neutrino', x: 2, y: 2, state: 'stable' }
            ],
            targetPattern: [
                { type: 'electron', x: 0, y: 0, state: 'up' },
                { type: 'electron', x: 4, y: 0, state: 'up' },
                { type: 'electron', x: 0, y: 4, state: 'up' },
                { type: 'electron', x: 4, y: 4, state: 'up' },
                { type: 'photon', x: 2, y: 1, state: 'vertical' },
                { type: 'photon', x: 1, y: 2, state: 'horizontal' },
                { type: 'photon', x: 3, y: 2, state: 'horizontal' },
                { type: 'photon', x: 2, y: 3, state: 'vertical' },
                { type: 'neutrino', x: 2, y: 2, state: 'stable' }
            ]
        }
    ];
    
    const colors = {
        electron: {
            up: '#00a9ff',
            down: '#0070cc'
        },
        photon: {
            horizontal: '#ffcc00',
            vertical: '#ff9900',
            diagonal: '#ff6600',
            antidiagonal: '#ff3300'
        },
        neutrino: {
            stable: '#00ff99',
            unstable: '#ff00cc'
        },
        grid: {
            background: '#0d0d35',
            lines: '#1a1a4a'
        }
    };
    
    function startGame() {
        gameState.running = true;
        gameState.level = 1;
        gameState.moves = 0;
        gameState.time = 0;
        gameState.levelStarted = false;
        gameState.levelCompleted = false;
        document.getElementById('startScreen').classList.add('hidden');
        startLevel(gameState.level);
    }
    
    function startLevel(levelNum) {
        const level = levels[levelNum - 1];
        
        gameState.grid = level.grid;
        gameState.particles = JSON.parse(JSON.stringify(level.particles));
        gameState.targetPatterns = JSON.parse(JSON.stringify(level.targetPattern));
        gameState.selectedParticle = null;
        gameState.level = levelNum;
        gameState.moves = 0;
        gameState.time = 0;
        gameState.levelStarted = true;
        gameState.levelCompleted = false;
        
        updateStats();
        startTimer();
    }
    
    function startTimer() {
        gameState.timeStart = Date.now();
        
        function tick() {
            if (!gameState.running || gameState.paused || !gameState.levelStarted || gameState.levelCompleted) return;
            
            gameState.time = Math.floor((Date.now() - gameState.timeStart) / 1000);
            updateTimer();
            
            requestAnimationFrame(tick);
        }
        
        tick();
    }
    
    function updateTimer() {
        document.getElementById('timeDisplay').innerText = `Time: ${gameState.time}s`;
    }
    
    function updateStats() {
        document.getElementById('levelDisplay').innerText = `Level: ${gameState.level}`;
        document.getElementById('movesDisplay').innerText = `Moves: ${gameState.moves}`;
    }
    
    function rotateParticle(direction) {
        if (!gameState.running || gameState.paused || !gameState.levelStarted || gameState.levelCompleted) return;
        
        if (gameState.selectedParticle !== null) {
            const particle = gameState.particles[gameState.selectedParticle];
            
            if (particle.type === 'electron') {
                particle.state = particle.state === 'up' ? 'down' : 'up';
            } else if (particle.type === 'photon') {
                const states = ['horizontal', 'vertical', 'diagonal', 'antidiagonal'];
                const currentIndex = states.indexOf(particle.state);
                const newIndex = (currentIndex + (direction === 'right' ? 1 : -1) + states.length) % states.length;
                particle.state = states[newIndex];
            }
            
            gameState.moves++;
            updateStats();
            checkLevelCompletion();
        }
    }
    
    function swapParticles() {
        if (!gameState.running || gameState.paused || !gameState.levelStarted || gameState.levelCompleted) return;
        
        if (gameState.selectedParticle !== null) {
            gameState.moves++;
            updateStats();
            
            const centerX = Math.floor(gameState.grid[0] / 2);
            const centerY = Math.floor(gameState.grid[1] / 2);
            
            const selected = gameState.particles[gameState.selectedParticle];
            
            if (selected.type === 'neutrino') {
                selected.state = selected.state === 'stable' ? 'unstable' : 'stable';
            } else {
                const x = selected.x;
                const y = selected.y;
                
                const relativeX = x - centerX;
                const relativeY = y - centerY;
                
                selected.x = centerX - relativeX;
                selected.y = centerY - relativeY;
            }
            
            checkLevelCompletion();
        }
    }
    
    function checkLevelCompletion() {
        let completed = true;
        
        for (let i = 0; i < gameState.targetPatterns.length; i++) {
            const target = gameState.targetPatterns[i];
            let matched = false;
            
            for (let j = 0; j < gameState.particles.length; j++) {
                const particle = gameState.particles[j];
                
                if (particle.x === target.x && particle.y === target.y && 
                    particle.type === target.type && particle.state === target.state) {
                    matched = true;
                    break;
                }
            }
            
            if (!matched) {
                completed = false;
                break;
            }
        }
        
        if (completed) {
            gameState.levelCompleted = true;
            showLevelComplete();
        }
    }
    
    function showLevelComplete() {
        document.getElementById('levelCompleteLevel').innerText = gameState.level;
        document.getElementById('levelCompleteMoves').innerText = gameState.moves;
        document.getElementById('levelCompleteTime').innerText = gameState.time + 's';
        document.getElementById('levelCompleteScreen').classList.remove('hidden');
    }
    
    function nextLevel() {
        document.getElementById('levelCompleteScreen').classList.add('hidden');
        
        if (gameState.level < levels.length) {
            startLevel(gameState.level + 1);
        } else {
            showGameOver(true);
        }
    }
    
    function showGameOver(success) {
        document.getElementById('finalLevel').innerText = gameState.level;
        document.getElementById('finalMoves').innerText = gameState.moves;
        document.getElementById('finalTime').innerText = gameState.time + 's';
        document.getElementById('gameOverScreen').classList.remove('hidden');
    }
    
    function drawGrid() {
        const gridWidth = gameState.grid[0];
        const gridHeight = gameState.grid[1];
        
        const cellSize = Math.min(canvas.width / (gridWidth + 2), canvas.height / (gridHeight + 2));
        
        const startX = (canvas.width - gridWidth * cellSize) / 2;
        const startY = (canvas.height - gridHeight * cellSize) / 2;
        
        ctx.fillStyle = colors.grid.background;
        ctx.fillRect(startX, startY, gridWidth * cellSize, gridHeight * cellSize);
        
        ctx.strokeStyle = colors.grid.lines;
        ctx.lineWidth = 2;
        
        for (let x = 0; x <= gridWidth; x++) {
            ctx.beginPath();
            ctx.moveTo(startX + x * cellSize, startY);
            ctx.lineTo(startX + x * cellSize, startY + gridHeight * cellSize);
            ctx.stroke();
        }
        
        for (let y = 0; y <= gridHeight; y++) {
            ctx.beginPath();
            ctx.moveTo(startX, startY + y * cellSize);
            ctx.lineTo(startX + gridWidth * cellSize, startY + y * cellSize);
            ctx.stroke();
        }
        
        return { startX, startY, cellSize };
    }
    
    function drawParticles(gridInfo) {
        const { startX, startY, cellSize } = gridInfo;
        
        for (let i = 0; i < gameState.particles.length; i++) {
            const particle = gameState.particles[i];
            
            const x = startX + (particle.x + 0.5) * cellSize;
            const y = startY + (particle.y + 0.5) * cellSize;
            const radius = cellSize * 0.4;
            
            ctx.fillStyle = colors[particle.type][particle.state];
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
            
            if (gameState.selectedParticle === i) {
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(x, y, radius + 5, 0, Math.PI * 2);
                ctx.stroke();
            }
            
            ctx.fillStyle = '#ffffff';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            let symbol = '';
            if (particle.type === 'electron') symbol = 'e';
            else if (particle.type === 'photon') symbol = 'γ';
            else if (particle.type === 'neutrino') symbol = 'ν';
            
            ctx.fillText(symbol, x, y);
        }
    }
    
    function drawTargetPattern(gridInfo) {
        if (!gameState.levelStarted || gameState.levelCompleted) return;
        
        const { startX, startY, cellSize } = gridInfo;
        
        ctx.globalAlpha = 0.3;
        
        for (let i = 0; i < gameState.targetPatterns.length; i++) {
            const target = gameState.targetPatterns[i];
            
            const x = startX + (target.x + 0.5) * cellSize;
            const y = startY + (target.y + 0.5) * cellSize;
            const radius = cellSize * 0.4;
            
            ctx.strokeStyle = colors[target.type][target.state];
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
        }
        
        ctx.globalAlpha = 1.0;
    }
    
    function render() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (!gameState.running) return;
        
        const gridInfo = drawGrid();
        drawTargetPattern(gridInfo);
        drawParticles(gridInfo);
    }
    
    function gameLoop() {
        render();
        requestAnimationFrame(gameLoop);
    }
    
    function togglePause() {
        if (!gameState.running || !gameState.levelStarted || gameState.levelCompleted) return;
        
        gameState.paused = !gameState.paused;
        
        if (gameState.paused) {
            document.getElementById('pauseScreen').classList.remove('hidden');
        } else {
            document.getElementById('pauseScreen').classList.add('hidden');
        }
    }
    
    function toggleMute() {
        gameState.isMuted = !gameState.isMuted;
        
        const muteBtn = document.getElementById('muteBtn');
        muteBtn.innerHTML = gameState.isMuted ? '<i class="fas fa-volume-mute"></i>' : '<i class="fas fa-volume-up"></i>';
    }
    
    function toggleHelp() {
        document.getElementById('helpModal').classList.toggle('hidden');
    }
    
    function handleCanvasClick(event) {
        if (!gameState.running || gameState.paused || !gameState.levelStarted || gameState.levelCompleted) return;
        
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        const gridWidth = gameState.grid[0];
        const gridHeight = gameState.grid[1];
        
        const cellSize = Math.min(canvas.width / (gridWidth + 2), canvas.height / (gridHeight + 2));
        
        const startX = (canvas.width - gridWidth * cellSize) / 2;
        const startY = (canvas.height - gridHeight * cellSize) / 2;
        
        for (let i = 0; i < gameState.particles.length; i++) {
            const particle = gameState.particles[i];
            
            const particleX = startX + (particle.x + 0.5) * cellSize;
            const particleY = startY + (particle.y + 0.5) * cellSize;
            const radius = cellSize * 0.4;
            
            const dx = x - particleX;
            const dy = y - particleY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance <= radius) {
                gameState.selectedParticle = i;
                return;
            }
        }
        
        gameState.selectedParticle = null;
    }
    
    canvas.addEventListener('click', handleCanvasClick);
    
    document.getElementById('startBtn').addEventListener('click', startGame);
    document.getElementById('resumeBtn').addEventListener('click', togglePause);
    document.getElementById('restartBtn').addEventListener('click', function() {
        document.getElementById('pauseScreen').classList.add('hidden');
        gameState.paused = false;
        startLevel(gameState.level);
    });
    document.getElementById('nextLevelBtn').addEventListener('click', nextLevel);
    document.getElementById('restartGameBtn').addEventListener('click', startGame);
    document.getElementById('helpBtn').addEventListener('click', toggleHelp);
    document.getElementById('closeHelpBtn').addEventListener('click', toggleHelp);
    document.getElementById('muteBtn').addEventListener('click', toggleMute);
    document.getElementById('pauseBtn').addEventListener('click', togglePause);
    
    document.getElementById('rotateLeft').addEventListener('click', function() {
        rotateParticle('left');
    });
    document.getElementById('rotateRight').addEventListener('click', function() {
        rotateParticle('right');
    });
    document.getElementById('swapParticles').addEventListener('click', swapParticles);
    
    document.addEventListener('keydown', function(event) {
        if (!gameState.running) return;
        
        if (event.key === 'p') {
            togglePause();
        } else if (event.key === 'm') {
            toggleMute();
        } else if (event.key === 'h') {
            toggleHelp();
        } else if (event.key === 'ArrowLeft') {
            rotateParticle('left');
        } else if (event.key === 'ArrowRight') {
            rotateParticle('right');
        } else if (event.key === ' ' || event.key === 'Enter') {
            swapParticles();
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
    
    gameLoop();
});
