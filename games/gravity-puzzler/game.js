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
        gravity: { x: 0, y: 1 },
        player: {
            x: 0,
            y: 0,
            width: 30,
            height: 30,
            vx: 0,
            vy: 0,
            speed: 0.5,
            maxSpeed: 8,
            friction: 0.95,
            isMoving: false
        },
        exit: { x: 0, y: 0, width: 50, height: 50 },
        walls: [],
        obstacles: [],
        energyOrbs: [],
        blackHoles: [],
        timerInterval: null,
        levelStarted: false,
        levelCompleted: false,
        gameOver: false
    };
    
    const sounds = {
        background: { volume: 0.3 },
        move: { volume: 0.5 },
        collect: { volume: 0.5 },
        levelComplete: { volume: 0.6 },
        gameOver: { volume: 0.6 }
    };
    
    const levels = [
        {
            player: { x: 100, y: 100 },
            exit: { x: 700, y: 500 },
            walls: [
                { x: 200, y: 150, width: 400, height: 30 },
                { x: 200, y: 350, width: 400, height: 30 },
                { x: 200, y: 150, width: 30, height: 230 }
            ],
            obstacles: [
                { x: 400, y: 250, radius: 20, vx: 1, vy: 0, range: 100 }
            ],
            energyOrbs: [
                { x: 300, y: 250, radius: 15 },
                { x: 500, y: 250, radius: 15 }
            ],
            blackHoles: []
        },
        {
            player: { x: 100, y: 100 },
            exit: { x: 700, y: 500 },
            walls: [
                { x: 150, y: 150, width: 30, height: 300 },
                { x: 150, y: 450, width: 500, height: 30 },
                { x: 650, y: 150, width: 30, height: 330 },
                { x: 250, y: 150, width: 400, height: 30 },
                { x: 350, y: 250, width: 30, height: 130 },
                { x: 450, y: 350, width: 30, height: 100 }
            ],
            obstacles: [
                { x: 250, y: 350, radius: 20, vx: 1.5, vy: 0, range: 150 }
            ],
            energyOrbs: [
                { x: 250, y: 200, radius: 15 },
                { x: 550, y: 400, radius: 15 },
                { x: 600, y: 200, radius: 15 }
            ],
            blackHoles: [
                { x: 500, y: 250, radius: 25, force: 0.5 }
            ]
        },
        {
            player: { x: 100, y: 100 },
            exit: { x: 700, y: 500 },
            walls: [
                { x: 100, y: 200, width: 600, height: 30 },
                { x: 100, y: 400, width: 600, height: 30 },
                { x: 400, y: 200, width: 30, height: 230 },
                { x: 200, y: 300, width: 30, height: 100 },
                { x: 600, y: 300, width: 30, height: 100 }
            ],
            obstacles: [
                { x: 300, y: 300, radius: 20, vx: 0, vy: 1, range: 80 },
                { x: 500, y: 300, radius: 20, vx: 1, vy: 1, range: 80 }
            ],
            energyOrbs: [
                { x: 200, y: 150, radius: 15 },
                { x: 600, y: 150, radius: 15 },
                { x: 300, y: 450, radius: 15 },
                { x: 500, y: 450, radius: 15 }
            ],
            blackHoles: [
                { x: 400, y: 300, radius: 30, force: 0.7 }
            ]
        }
    ];
    
    function startGame() {
        gameState.running = true;
        gameState.level = 1;
        gameState.moves = 0;
        gameState.time = 0;
        gameState.levelStarted = false;
        gameState.levelCompleted = false;
        gameState.gameOver = false;
        
        startLevel(gameState.level);
        
        document.getElementById('startScreen').classList.add('hidden');
        
        startTimer();
        gameLoop();
    }
    
    function startLevel(levelNum) {
        const level = levels[levelNum - 1];
        if (!level) {
            gameState.levelCompleted = true;
            gameState.gameOver = true;
            showGameOver();
            return;
        }
        
        gameState.levelStarted = true;
        gameState.gravity = { x: 0, y: 1 };
        
        gameState.player.x = level.player.x;
        gameState.player.y = level.player.y;
        gameState.player.vx = 0;
        gameState.player.vy = 0;
        gameState.player.isMoving = false;
        
        gameState.exit = { ...level.exit, width: 50, height: 50 };
        gameState.walls = [...level.walls];
        gameState.obstacles = level.obstacles.map(o => ({ ...o, initialX: o.x, initialY: o.y }));
        gameState.energyOrbs = [...level.energyOrbs];
        gameState.blackHoles = [...level.blackHoles];
        
        document.getElementById('level').textContent = levelNum;
        
        updateStats();
    }
    
    function startTimer() {
        gameState.timeStart = Date.now();
        
        if (gameState.timerInterval) {
            clearInterval(gameState.timerInterval);
        }
        
        gameState.timerInterval = setInterval(function() {
            if (!gameState.running || gameState.paused) return;
            
            gameState.time = Math.floor((Date.now() - gameState.timeStart) / 1000);
            updateTimer();
        }, 1000);
    }
    
    function updateTimer() {
        const minutes = Math.floor(gameState.time / 60);
        const seconds = gameState.time % 60;
        document.getElementById('time').textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    function updateStats() {
        document.getElementById('moves').textContent = gameState.moves;
    }
    
    function changeGravity(x, y) {
        if (gameState.player.isMoving || !gameState.levelStarted || gameState.levelCompleted) return;
        
        if (gameState.gravity.x !== x || gameState.gravity.y !== y) {
            gameState.gravity.x = x;
            gameState.gravity.y = y;
            gameState.player.isMoving = true;
            gameState.moves++;
            updateStats();
            
            if (!gameState.isMuted) {

            }
        }
    }
    
    function checkCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
    
    function checkCircleCollision(circle, rect) {
        const distX = Math.abs(circle.x - (rect.x + rect.width/2));
        const distY = Math.abs(circle.y - (rect.y + rect.height/2));
        
        if (distX > (rect.width/2 + circle.radius)) return false;
        if (distY > (rect.height/2 + circle.radius)) return false;
        
        if (distX <= (rect.width/2)) return true;
        if (distY <= (rect.height/2)) return true;
        
        const dx = distX - rect.width/2;
        const dy = distY - rect.height/2;
        return (dx*dx + dy*dy <= (circle.radius*circle.radius));
    }
    
    function update() {
        if (!gameState.running || gameState.paused || !gameState.levelStarted || gameState.levelCompleted) return;
        
        const player = gameState.player;
        
        if (player.isMoving) {
            player.vx += gameState.gravity.x * player.speed;
            player.vy += gameState.gravity.y * player.speed;
            
            player.vx = Math.max(-player.maxSpeed, Math.min(player.maxSpeed, player.vx));
            player.vy = Math.max(-player.maxSpeed, Math.min(player.maxSpeed, player.vy));
            
            const newX = player.x + player.vx;
            const newY = player.y + player.vy;
            
            let collided = false;
            
            for (const wall of gameState.walls) {
                if (checkCollision({
                    x: newX,
                    y: newY,
                    width: player.width,
                    height: player.height
                }, wall)) {
                    collided = true;
                    
                    if (Math.abs(gameState.gravity.x) > 0) {
                        player.vx = 0;
                        player.vy *= player.friction;
                    }
                    
                    if (Math.abs(gameState.gravity.y) > 0) {
                        player.vy = 0;
                        player.vx *= player.friction;
                    }
                    
                    break;
                }
            }
            
            if (!collided) {
                player.x = newX;
                player.y = newY;
            } else {
                player.isMoving = false;
            }
            
            if (Math.abs(player.vx) < 0.1 && Math.abs(player.vy) < 0.1) {
                player.vx = 0;
                player.vy = 0;
                player.isMoving = false;
            }
            
            for (let i = gameState.energyOrbs.length - 1; i >= 0; i--) {
                const orb = gameState.energyOrbs[i];
                if (checkCircleCollision(orb, {
                    x: player.x,
                    y: player.y,
                    width: player.width,
                    height: player.height
                })) {
                    gameState.energyOrbs.splice(i, 1);
                    
                    if (!gameState.isMuted) {

                    }
                }
            }
            
            for (const blackHole of gameState.blackHoles) {
                const dx = blackHole.x - (player.x + player.width/2);
                const dy = blackHole.y - (player.y + player.height/2);
                const distance = Math.sqrt(dx*dx + dy*dy);
                
                if (distance < blackHole.radius + player.width/2) {
                    gameState.levelStarted = false;
                    setTimeout(() => {
                        startLevel(gameState.level);
                    }, 1000);
                    return;
                }
                
                if (distance < 150) {
                    const force = blackHole.force / (distance/30);
                    player.vx += dx/distance * force;
                    player.vy += dy/distance * force;
                }
            }
            
            for (const obstacle of gameState.obstacles) {
                if (checkCircleCollision({
                    x: obstacle.x,
                    y: obstacle.y,
                    radius: obstacle.radius
                }, {
                    x: player.x,
                    y: player.y,
                    width: player.width,
                    height: player.height
                })) {
                    gameState.levelStarted = false;
                    setTimeout(() => {
                        startLevel(gameState.level);
                    }, 1000);
                    return;
                }
            }
            
            if (checkCollision({
                x: player.x,
                y: player.y,
                width: player.width,
                height: player.height
            }, gameState.exit)) {
                gameState.levelCompleted = true;
                
                if (!gameState.isMuted) {
                    // Play level complete sound
                }
                
                document.getElementById('levelMoves').textContent = gameState.moves;
                document.getElementById('levelTime').textContent = document.getElementById('time').textContent;
                
                const timeBonus = Math.max(0, 300 - gameState.time);
                const moveBonus = Math.max(0, 200 - gameState.moves * 10);
                const orbBonus = (levels[gameState.level - 1].energyOrbs.length - gameState.energyOrbs.length) * 50;
                const totalBonus = timeBonus + moveBonus + orbBonus;
                
                document.getElementById('levelBonus').textContent = totalBonus;
                
                document.getElementById('levelCompleteScreen').classList.remove('hidden');
            }
        }
        
        for (const obstacle of gameState.obstacles) {
            if (obstacle.vx) {
                obstacle.x = obstacle.initialX + Math.sin(Date.now() * 0.002) * obstacle.range;
            }
            if (obstacle.vy) {
                obstacle.y = obstacle.initialY + Math.sin(Date.now() * 0.002) * obstacle.range;
            }
        }
    }
    
    function render() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        drawStars();
        drawGrid();
        
        ctx.save();
        
        for (const wall of gameState.walls) {
            ctx.fillStyle = 'rgba(0, 169, 255, 0.3)';
            ctx.strokeStyle = 'rgba(0, 169, 255, 0.8)';
            ctx.lineWidth = 2;
            
            ctx.beginPath();
            ctx.rect(wall.x, wall.y, wall.width, wall.height);
            ctx.fill();
            ctx.stroke();
        }
        
        for (const orb of gameState.energyOrbs) {
            const gradient = ctx.createRadialGradient(
                orb.x, orb.y, 0,
                orb.x, orb.y, orb.radius
            );
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
            gradient.addColorStop(0.5, 'rgba(140, 54, 224, 0.6)');
            gradient.addColorStop(1, 'rgba(140, 54, 224, 0.2)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = 'rgba(176, 136, 255, 0.8)';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            const pulse = 1 + Math.sin(Date.now() * 0.005) * 0.2;
            ctx.beginPath();
            ctx.arc(orb.x, orb.y, orb.radius * pulse, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(176, 136, 255, 0.3)';
            ctx.stroke();
        }
        
        for (const blackHole of gameState.blackHoles) {
            const gradient = ctx.createRadialGradient(
                blackHole.x, blackHole.y, 0,
                blackHole.x, blackHole.y, blackHole.radius * 2
            );
            gradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
            gradient.addColorStop(0.7, 'rgba(10, 0, 30, 0.8)');
            gradient.addColorStop(1, 'rgba(10, 0, 30, 0)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(blackHole.x, blackHole.y, blackHole.radius * 2, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(blackHole.x, blackHole.y, blackHole.radius, 0, Math.PI * 2);
            ctx.fill();
            
            const ring1Size = 1 + Math.sin(Date.now() * 0.003) * 0.2;
            ctx.beginPath();
            ctx.arc(blackHole.x, blackHole.y, blackHole.radius * ring1Size, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(100, 0, 255, 0.5)';
            ctx.lineWidth = 1;
            ctx.stroke();
            
            const ring2Size = 1 + Math.cos(Date.now() * 0.003) * 0.2;
            ctx.beginPath();
            ctx.arc(blackHole.x, blackHole.y, blackHole.radius * ring2Size * 0.7, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(50, 0, 150, 0.5)';
            ctx.lineWidth = 1;
            ctx.stroke();
        }
        
        for (const obstacle of gameState.obstacles) {
            const gradient = ctx.createRadialGradient(
                obstacle.x, obstacle.y, 0,
                obstacle.x, obstacle.y, obstacle.radius
            );
            gradient.addColorStop(0, 'rgba(229, 57, 53, 0.7)');
            gradient.addColorStop(0.7, 'rgba(229, 57, 53, 0.9)');
            gradient.addColorStop(1, 'rgba(229, 57, 53, 0.5)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(obstacle.x, obstacle.y, obstacle.radius, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = 'rgba(255, 100, 100, 0.8)';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
        
        const exit = gameState.exit;
        const gradient = ctx.createRadialGradient(
            exit.x + exit.width/2, exit.y + exit.height/2, 0,
            exit.x + exit.width/2, exit.y + exit.height/2, exit.width/2
        );
        gradient.addColorStop(0, 'rgba(0, 255, 255, 0.7)');
        gradient.addColorStop(0.7, 'rgba(0, 255, 255, 0.3)');
        gradient.addColorStop(1, 'rgba(0, 255, 255, 0.1)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(exit.x + exit.width/2, exit.y + exit.height/2, exit.width/2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(exit.x + exit.width/2, exit.y + exit.height/2, exit.width/2, 0, Math.PI * 2);
        ctx.stroke();
        
        const wormholePulse = 1 + Math.sin(Date.now() * 0.004) * 0.1;
        ctx.beginPath();
        ctx.arc(exit.x + exit.width/2, exit.y + exit.height/2, exit.width/2 * wormholePulse, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
        ctx.stroke();
        
        const player = gameState.player;
        ctx.fillStyle = 'rgba(255, 160, 0, 0.8)';
        ctx.strokeStyle = 'rgba(255, 200, 0, 1)';
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.rect(player.x, player.y, player.width, player.height);
        ctx.fill();
        ctx.stroke();
        
        const triangleSize = player.width * 0.6;
        ctx.fillStyle = 'rgba(255, 255, 0, 0.9)';
        ctx.beginPath();
        
        if (gameState.gravity.x > 0) {
            ctx.moveTo(player.x + player.width - 5, player.y + player.height/2);
            ctx.lineTo(player.x + player.width/2, player.y + player.height/2 - triangleSize/2);
            ctx.lineTo(player.x + player.width/2, player.y + player.height/2 + triangleSize/2);
        } else if (gameState.gravity.x < 0) {
            ctx.moveTo(player.x + 5, player.y + player.height/2);
            ctx.lineTo(player.x + player.width/2, player.y + player.height/2 - triangleSize/2);
            ctx.lineTo(player.x + player.width/2, player.y + player.height/2 + triangleSize/2);
        } else if (gameState.gravity.y > 0) {
            ctx.moveTo(player.x + player.width/2, player.y + player.height - 5);
            ctx.lineTo(player.x + player.width/2 - triangleSize/2, player.y + player.height/2);
            ctx.lineTo(player.x + player.width/2 + triangleSize/2, player.y + player.height/2);
        } else if (gameState.gravity.y < 0) {
            ctx.moveTo(player.x + player.width/2, player.y + 5);
            ctx.lineTo(player.x + player.width/2 - triangleSize/2, player.y + player.height/2);
            ctx.lineTo(player.x + player.width/2 + triangleSize/2, player.y + player.height/2);
        }
        
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
    }
    
    function drawStars() {
        const time = Date.now() * 0.0001;
        
        for (let i = 0; i < 100; i++) {
            const x = (Math.sin(i * 5782) * 0.5 + 0.5) * canvas.width;
            const y = (Math.cos(i * 1618) * 0.5 + 0.5) * canvas.height;
            const size = (Math.sin(i + time) * 0.5 + 0.5) * 3 + 1;
            
            const brightness = Math.sin(i * 0.3 + time * 2) * 0.5 + 0.5;
            ctx.fillStyle = `rgba(255, 255, 255, ${brightness * 0.8})`;
            
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    function drawGrid() {
        ctx.strokeStyle = 'rgba(0, 169, 255, 0.1)';
        ctx.lineWidth = 1;
        
        const gridSize = 50;
        const time = Date.now() * 0.0002;
        
        for (let x = 0; x < canvas.width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }
        
        for (let y = 0; y < canvas.height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }
        
        const offsetX = (time % 1) * gridSize;
        const offsetY = (time % 1) * gridSize;
        
        ctx.strokeStyle = 'rgba(0, 169, 255, 0.15)';
        
        for (let x = -gridSize + offsetX; x < canvas.width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }
        
        for (let y = -gridSize + offsetY; y < canvas.height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }
    }
    
    function gameLoop() {
        if (!gameState.running) return;
        
        update();
        render();
        
        requestAnimationFrame(gameLoop);
    }
    
    function togglePause() {
        if (!gameState.running) return;
        
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
        if (gameState.isMuted) {
            muteBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
        } else {
            muteBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
        }
    }
    
    function toggleHelp() {
        document.getElementById('helpModal').classList.toggle('hidden');
        
        if (!document.getElementById('helpModal').classList.contains('hidden')) {
            gameState.paused = true;
        } else if (gameState.running) {
            gameState.paused = false;
        }
    }
    
    function nextLevel() {
        gameState.level++;
        gameState.levelCompleted = false;
        
        document.getElementById('levelCompleteScreen').classList.add('hidden');
        
        startLevel(gameState.level);
    }
    
    function showGameOver() {
        document.getElementById('finalLevels').textContent = gameState.level - 1;
        document.getElementById('finalMoves').textContent = gameState.moves;
        document.getElementById('finalTime').textContent = document.getElementById('time').textContent;
        
        document.getElementById('gameOverScreen').classList.remove('hidden');
        
        if (!gameState.isMuted) {
            // Play game over sound
        }
    }
    
    document.getElementById('startBtn').addEventListener('click', startGame);
    document.getElementById('restartBtn').addEventListener('click', function() {
        startLevel(gameState.level);
    });
    document.getElementById('pauseBtn').addEventListener('click', togglePause);
    document.getElementById('resumeBtn').addEventListener('click', togglePause);
    document.getElementById('muteBtn').addEventListener('click', toggleMute);
    document.getElementById('helpBtn').addEventListener('click', toggleHelp);
    document.getElementById('closeHelpBtn').addEventListener('click', toggleHelp);
    document.getElementById('nextLevelBtn').addEventListener('click', nextLevel);
    document.getElementById('playAgainBtn').addEventListener('click', startGame);
    
    document.getElementById('gravityUp').addEventListener('click', function() {
        changeGravity(0, -1);
    });
    
    document.getElementById('gravityRight').addEventListener('click', function() {
        changeGravity(1, 0);
    });
    
    document.getElementById('gravityDown').addEventListener('click', function() {
        changeGravity(0, 1);
    });
    
    document.getElementById('gravityLeft').addEventListener('click', function() {
        changeGravity(-1, 0);
    });
    
    document.addEventListener('keydown', function(event) {
        if (!gameState.running) return;
        
        switch (event.key) {
            case 'ArrowUp':
                changeGravity(0, -1);
                break;
            case 'ArrowRight':
                changeGravity(1, 0);
                break;
            case 'ArrowDown':
                changeGravity(0, 1);
                break;
            case 'ArrowLeft':
                changeGravity(-1, 0);
                break;
            case 'Escape':
                togglePause();
                break;
            case 'h':
            case 'H':
                toggleHelp();
                break;
            case 'm':
            case 'M':
                toggleMute();
                break;
        }
    });
    
    window.addEventListener('blur', function() {
        if (gameState.running && !gameState.paused) {
            togglePause();
        }
    });
    
    drawStars();
    drawGrid();
    

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
