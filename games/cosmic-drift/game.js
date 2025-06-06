document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    const starsContainer = document.querySelector('.stars-container');
    if (starsContainer) {
        createStars(starsContainer, 100);
    }
    
    let gameRunning = false;
    let gamePaused = false;
    let thrusters = 100;
    let crystals = 0;
    let currentLevel = 1;
    let distance = 0;
    let gameTime = 0;
    let gameStartTime = 0;
    let boosting = false;
    
    const player = {
        x: 0,
        y: 0,
        width: 30,
        height: 40,
        velocityX: 0,
        velocityY: 0,
        acceleration: 0.05,
        deceleration: 0.98,
        maxVelocity: 4,
        boostMultiplier: 1.5,
        color: '#00a9ff',
        thrusterVisible: false,
        thrusterDirection: { x: 0, y: 0 }
    };
    
    const obstacles = [];
    const crystalItems = [];
    const level = {
        width: 2000,
        height: 1500,
        boundaries: {
            left: 0,
            right: 2000,
            top: 0,
            bottom: 1500
        },
        portal: {
            x: 1900,
            y: 750,
            radius: 50,
            color: '#00ff80'
        }
    };
    
    const camera = {
        x: 0,
        y: 0,
        width: 0,
        height: 0
    };
    
    function resizeCanvas() {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
        
        camera.width = canvas.width;
        camera.height = canvas.height;
        
        if (player && !gameRunning) {
            player.x = 100;
            player.y = level.height / 2;
        }
        
        render();
    }
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    function updateStats() {
        document.getElementById('thrusterDisplay').innerText = `Thrusters: ${Math.floor(thrusters)}%`;
        document.getElementById('crystalsDisplay').innerText = `Crystals: ${crystals}`;
        document.getElementById('levelDisplay').innerText = `Level: ${currentLevel}`;
    }
    
    function generateLevel() {
        obstacles.length = 0;
        crystalItems.length = 0;
        
        const obstacleCount = 20 + currentLevel * 5;
        const crystalCount = 10 + currentLevel * 2;
        
        for (let i = 0; i < obstacleCount; i++) {
            const size = 20 + Math.random() * 60;
            obstacles.push({
                x: 200 + Math.random() * (level.width - 400),
                y: 100 + Math.random() * (level.height - 200),
                width: size,
                height: size,
                type: Math.random() > 0.7 ? 'rotating' : 'static',
                angle: 0,
                rotationSpeed: (Math.random() - 0.5) * 0.04,
                color: '#ff4040'
            });
        }
        
        for (let i = 0; i < crystalCount; i++) {
            crystalItems.push({
                x: 200 + Math.random() * (level.width - 400),
                y: 100 + Math.random() * (level.height - 200),
                radius: 10,
                color: '#40a0ff',
                pulse: Math.random() * Math.PI * 2
            });
        }
        
        level.portal.x = level.width - 100;
        level.portal.y = level.height / 2;
    }
    
    function startGame() {
        gameRunning = true;
        gamePaused = false;
        thrusters = 100;
        crystals = 0;
        currentLevel = 1;
        distance = 0;
        
        player.x = 100;
        player.y = level.height / 2;
        player.velocityX = 0;
        player.velocityY = 0;
        player.thrusterVisible = false;
        
        level.width = 2000;
        level.height = 1500;
        level.boundaries = {
            left: 0,
            right: 2000,
            top: 0,
            bottom: 1500
        };
        
        generateLevel();
        
        document.getElementById('startScreen').classList.add('hidden');
        
        if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
            document.querySelector('.directional-controls').classList.remove('hidden');
        }
        
        gameStartTime = Date.now();
        updateStats();
        gameLoop();
    }
    
    function update() {
        if (!gameRunning || gamePaused) return;
        
        gameTime = Math.floor((Date.now() - gameStartTime) / 1000);
        
        updatePlayerMovement();
        updateCamera();
        checkCollisions();
        updateObjects();
        
        updateStats();
    }
    
    function updatePlayerMovement() {
        player.thrusterVisible = false;
        player.thrusterDirection = { x: 0, y: 0 };
        
        const acceleration = player.acceleration * (boosting ? player.boostMultiplier : 1);
        
        if (keys.up) {
            player.velocityY -= acceleration;
            player.thrusterVisible = true;
            player.thrusterDirection.y = 1;
            consumeThrusters();
        }
        
        if (keys.down) {
            player.velocityY += acceleration;
            player.thrusterVisible = true;
            player.thrusterDirection.y = -1;
            consumeThrusters();
        }
        
        if (keys.left) {
            player.velocityX -= acceleration;
            player.thrusterVisible = true;
            player.thrusterDirection.x = 1;
            consumeThrusters();
        }
        
        if (keys.right) {
            player.velocityX += acceleration;
            player.thrusterVisible = true;
            player.thrusterDirection.x = -1;
            consumeThrusters();
        }
        
        const maxVelocity = player.maxVelocity * (boosting ? player.boostMultiplier : 1);
        
        player.velocityX = Math.max(-maxVelocity, Math.min(maxVelocity, player.velocityX));
        player.velocityY = Math.max(-maxVelocity, Math.min(maxVelocity, player.velocityY));
        
        player.velocityX *= player.deceleration;
        player.velocityY *= player.deceleration;
        
        player.x += player.velocityX;
        player.y += player.velocityY;
        
        if (player.x < level.boundaries.left) {
            player.x = level.boundaries.left;
            player.velocityX *= -0.5;
        }
        
        if (player.x + player.width > level.boundaries.right) {
            player.x = level.boundaries.right - player.width;
            player.velocityX *= -0.5;
        }
        
        if (player.y < level.boundaries.top) {
            player.y = level.boundaries.top;
            player.velocityY *= -0.5;
        }
        
        if (player.y + player.height > level.boundaries.bottom) {
            player.y = level.boundaries.bottom - player.height;
            player.velocityY *= -0.5;
        }
    }
    
    function consumeThrusters() {
        const amount = boosting ? 0.2 : 0.1;
        thrusters -= amount;
        
        if (thrusters <= 0) {
            thrusters = 0;
            gameOver();
        }
    }
    
    function updateCamera() {
        camera.x = player.x + player.width / 2 - camera.width / 2;
        camera.y = player.y + player.height / 2 - camera.height / 2;
        
        camera.x = Math.max(0, Math.min(level.width - camera.width, camera.x));
        camera.y = Math.max(0, Math.min(level.height - camera.height, camera.y));
    }
    
    function updateObjects() {
        for (const obstacle of obstacles) {
            if (obstacle.type === 'rotating') {
                obstacle.angle += obstacle.rotationSpeed;
            }
        }
        
        for (const crystal of crystalItems) {
            crystal.pulse += 0.05;
        }
    }
    
    function checkCollisions() {
        const dx = player.x + player.width / 2 - level.portal.x;
        const dy = player.y + player.height / 2 - level.portal.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < level.portal.radius) {
            levelComplete();
            return;
        }
        
        for (let i = crystalItems.length - 1; i >= 0; i--) {
            const crystal = crystalItems[i];
            const dx = player.x + player.width / 2 - crystal.x;
            const dy = player.y + player.height / 2 - crystal.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < crystal.radius + player.width / 2) {
                crystals++;
                crystalItems.splice(i, 1);
            }
        }
        
        for (const obstacle of obstacles) {
            if (obstacle.type === 'static') {
                if (rectCollision(
                    player.x, player.y, player.width, player.height,
                    obstacle.x, obstacle.y, obstacle.width, obstacle.height
                )) {
                    gameOver();
                    return;
                }
            } else {
                const centerX = obstacle.x + obstacle.width / 2;
                const centerY = obstacle.y + obstacle.height / 2;
                const dx = player.x + player.width / 2 - centerX;
                const dy = player.y + player.height / 2 - centerY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < obstacle.width / 2 + player.width / 2) {
                    gameOver();
                    return;
                }
            }
        }
    }
    
    function render() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        renderBackground();
        renderLevel();
        renderPlayer();
        renderHUD();
    }
    
    function renderBackground() {
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#000824');
        gradient.addColorStop(1, '#000011');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    function renderLevel() {
        renderPortal();
        renderCrystals();
        renderObstacles();
        renderBoundaries();
    }
    
    function renderPortal() {
        const portalX = level.portal.x - camera.x;
        const portalY = level.portal.y - camera.y;
        
        ctx.save();
        ctx.translate(portalX, portalY);
        ctx.rotate(gameTime * 0.001);
        
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, level.portal.radius);
        gradient.addColorStop(0, 'rgba(0, 255, 128, 0.8)');
        gradient.addColorStop(0.7, 'rgba(0, 200, 100, 0.4)');
        gradient.addColorStop(1, 'rgba(0, 150, 80, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, level.portal.radius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
        
        ctx.strokeStyle = '#00ff80';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(portalX, portalY, level.portal.radius * 0.7, 0, Math.PI * 2);
        ctx.stroke();
    }
    
    function renderCrystals() {
        for (const crystal of crystalItems) {
            const crystalX = crystal.x - camera.x;
            const crystalY = crystal.y - camera.y;
            
            if (crystalX + crystal.radius < 0 || crystalX - crystal.radius > canvas.width ||
                crystalY + crystal.radius < 0 || crystalY - crystal.radius > canvas.height) {
                continue;
            }
            
            const pulseScale = 1 + Math.sin(crystal.pulse) * 0.2;
            
            ctx.fillStyle = crystal.color;
            ctx.beginPath();
            ctx.arc(crystalX, crystalY, crystal.radius * pulseScale, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = '#80ffff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(crystalX, crystalY, crystal.radius * 0.7 * pulseScale, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
    
    function renderObstacles() {
        for (const obstacle of obstacles) {
            const obstacleX = obstacle.x - camera.x;
            const obstacleY = obstacle.y - camera.y;
            
            if (obstacleX + obstacle.width < 0 || obstacleX > canvas.width ||
                obstacleY + obstacle.height < 0 || obstacleY > canvas.height) {
                continue;
            }
            
            if (obstacle.type === 'static') {
                ctx.fillStyle = obstacle.color;
                ctx.fillRect(obstacleX, obstacleY, obstacle.width, obstacle.height);
                
                ctx.strokeStyle = '#ff8080';
                ctx.lineWidth = 2;
                ctx.strokeRect(obstacleX + 5, obstacleY + 5, obstacle.width - 10, obstacle.height - 10);
            } else {
                ctx.save();
                ctx.translate(obstacleX + obstacle.width / 2, obstacleY + obstacle.height / 2);
                ctx.rotate(obstacle.angle);
                
                ctx.fillStyle = obstacle.color;
                ctx.fillRect(-obstacle.width / 2, -obstacle.height / 2, obstacle.width, obstacle.height);
                
                ctx.strokeStyle = '#ff8080';
                ctx.lineWidth = 2;
                ctx.strokeRect(-obstacle.width / 2 + 5, -obstacle.height / 2 + 5, obstacle.width - 10, obstacle.height - 10);
                
                ctx.restore();
            }
        }
    }
    
    function renderBoundaries() {
        const left = -camera.x;
        const top = -camera.y;
        const right = level.width - camera.x;
        const bottom = level.height - camera.y;
        
        ctx.strokeStyle = '#4080ff';
        ctx.lineWidth = 3;
        ctx.strokeRect(left, top, right - left, bottom - top);
    }
    
    function renderPlayer() {
        const playerX = player.x - camera.x;
        const playerY = player.y - camera.y;
        
        if (player.thrusterVisible) {
            const thrusterLength = 15 * (boosting ? 1.5 : 1);
            const thrusterWidth = 10 * (boosting ? 1.5 : 1);
            
            ctx.fillStyle = boosting ? '#ffff40' : '#ff8040';
            
            if (player.thrusterDirection.x > 0) {
                ctx.beginPath();
                ctx.moveTo(playerX, playerY + player.height / 2);
                ctx.lineTo(playerX - thrusterLength, playerY + player.height / 2 - thrusterWidth / 2);
                ctx.lineTo(playerX - thrusterLength, playerY + player.height / 2 + thrusterWidth / 2);
                ctx.closePath();
                ctx.fill();
            } else if (player.thrusterDirection.x < 0) {
                ctx.beginPath();
                ctx.moveTo(playerX + player.width, playerY + player.height / 2);
                ctx.lineTo(playerX + player.width + thrusterLength, playerY + player.height / 2 - thrusterWidth / 2);
                ctx.lineTo(playerX + player.width + thrusterLength, playerY + player.height / 2 + thrusterWidth / 2);
                ctx.closePath();
                ctx.fill();
            }
            
            if (player.thrusterDirection.y > 0) {
                ctx.beginPath();
                ctx.moveTo(playerX + player.width / 2, playerY);
                ctx.lineTo(playerX + player.width / 2 - thrusterWidth / 2, playerY - thrusterLength);
                ctx.lineTo(playerX + player.width / 2 + thrusterWidth / 2, playerY - thrusterLength);
                ctx.closePath();
                ctx.fill();
            } else if (player.thrusterDirection.y < 0) {
                ctx.beginPath();
                ctx.moveTo(playerX + player.width / 2, playerY + player.height);
                ctx.lineTo(playerX + player.width / 2 - thrusterWidth / 2, playerY + player.height + thrusterLength);
                ctx.lineTo(playerX + player.width / 2 + thrusterWidth / 2, playerY + player.height + thrusterLength);
                ctx.closePath();
                ctx.fill();
            }
        }
        
        ctx.fillStyle = player.color;
        ctx.fillRect(playerX, playerY, player.width, player.height);
        
        ctx.fillStyle = '#80d0ff';
        ctx.fillRect(playerX + 5, playerY + 5, player.width - 10, player.height - 10);
    }
    
    function renderHUD() {
        const thrusterBarWidth = 200;
        const thrusterBarHeight = 10;
        const thrusterBarX = 20;
        const thrusterBarY = 20;
        
        ctx.fillStyle = 'rgba(20, 40, 80, 0.6)';
        ctx.fillRect(thrusterBarX, thrusterBarY, thrusterBarWidth, thrusterBarHeight);
        
        const thrusterPercentage = thrusters / 100;
        const thrusterColor = thrusterPercentage > 0.6 ? '#40ff40' : (thrusterPercentage > 0.3 ? '#ffff40' : '#ff4040');
        
        ctx.fillStyle = thrusterColor;
        ctx.fillRect(thrusterBarX, thrusterBarY, thrusterBarWidth * thrusterPercentage, thrusterBarHeight);
        
        ctx.strokeStyle = '#4080ff';
        ctx.lineWidth = 2;
        ctx.strokeRect(thrusterBarX, thrusterBarY, thrusterBarWidth, thrusterBarHeight);
        
        const arrowSize = 20;
        const arrowX = canvas.width / 2;
        const arrowY = 30;
        
        const portalDx = level.portal.x - (player.x + player.width / 2);
        const portalDy = level.portal.y - (player.y + player.height / 2);
        const portalAngle = Math.atan2(portalDy, portalDx);
        
        ctx.save();
        ctx.translate(arrowX, arrowY);
        ctx.rotate(portalAngle);
        
        ctx.fillStyle = '#00ff80';
        ctx.beginPath();
        ctx.moveTo(arrowSize, 0);
        ctx.lineTo(0, arrowSize / 2);
        ctx.lineTo(0, -arrowSize / 2);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
    }
    
    function gameLoop() {
        if (gameRunning) {
            update();
            render();
            requestAnimationFrame(gameLoop);
        }
    }
    
    function gameOver() {
        gameRunning = false;
        
        document.getElementById('finalCrystals').innerText = crystals;
        document.getElementById('finalLevel').innerText = currentLevel;
        document.getElementById('finalDistance').innerText = `${Math.floor(distance)} km`;
        
        document.getElementById('gameOverScreen').classList.remove('hidden');
        document.querySelector('.directional-controls').classList.add('hidden');
    }
    
    function levelComplete() {
        gameRunning = false;
        
        document.getElementById('levelCrystals').innerText = crystals;
        document.getElementById('levelThrusters').innerText = `${Math.floor(thrusters)}%`;
        document.getElementById('levelTime').innerText = `${gameTime}s`;
        
        document.getElementById('levelCompleteScreen').classList.remove('hidden');
        document.querySelector('.directional-controls').classList.add('hidden');
    }
    
    function startNextLevel() {
        currentLevel++;
        
        player.x = 100;
        player.y = level.height / 2;
        player.velocityX = 0;
        player.velocityY = 0;
        
        level.width += 500;
        level.height += 300;
        level.boundaries = {
            left: 0,
            right: level.width,
            top: 0,
            bottom: level.height
        };
        
        generateLevel();
        
        document.getElementById('levelCompleteScreen').classList.add('hidden');
        
        if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
            document.querySelector('.directional-controls').classList.remove('hidden');
        }
        
        gameRunning = true;
        updateStats();
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
    
    function rectCollision(x1, y1, w1, h1, x2, y2, w2, h2) {
        return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2;
    }
    
    const keys = {
        up: false,
        down: false,
        left: false,
        right: false,
        space: false
    };
    
    document.addEventListener('keydown', function(event) {
        if (event.key === 'ArrowUp' || event.key === 'w') {
            keys.up = true;
        } else if (event.key === 'ArrowDown' || event.key === 's') {
            keys.down = true;
        } else if (event.key === 'ArrowLeft' || event.key === 'a') {
            keys.left = true;
        } else if (event.key === 'ArrowRight' || event.key === 'd') {
            keys.right = true;
        } else if (event.key === ' ') {
            keys.space = true;
            boosting = true;
        } else if (event.key === 'p') {
            togglePause();
        } else if (event.key === 'm') {
            toggleMute();
        } else if (event.key === 'h') {
            toggleHelp();
        }
    });
    
    document.addEventListener('keyup', function(event) {
        if (event.key === 'ArrowUp' || event.key === 'w') {
            keys.up = false;
        } else if (event.key === 'ArrowDown' || event.key === 's') {
            keys.down = false;
        } else if (event.key === 'ArrowLeft' || event.key === 'a') {
            keys.left = false;
        } else if (event.key === 'ArrowRight' || event.key === 'd') {
            keys.right = false;
        } else if (event.key === ' ') {
            keys.space = false;
            boosting = false;
        }
    });
    
    const upBtn = document.getElementById('upBtn');
    const downBtn = document.getElementById('downBtn');
    const leftBtn = document.getElementById('leftBtn');
    const rightBtn = document.getElementById('rightBtn');
    const boostBtn = document.getElementById('boostBtn');
    
    if (upBtn && downBtn && leftBtn && rightBtn && boostBtn) {
        upBtn.addEventListener('touchstart', function() {
            keys.up = true;
        });
        upBtn.addEventListener('touchend', function() {
            keys.up = false;
        });
        
        downBtn.addEventListener('touchstart', function() {
            keys.down = true;
        });
        downBtn.addEventListener('touchend', function() {
            keys.down = false;
        });
        
        leftBtn.addEventListener('touchstart', function() {
            keys.left = true;
        });
        leftBtn.addEventListener('touchend', function() {
            keys.left = false;
        });
        
        rightBtn.addEventListener('touchstart', function() {
            keys.right = true;
        });
        rightBtn.addEventListener('touchend', function() {
            keys.right = false;
        });
        
        boostBtn.addEventListener('touchstart', function() {
            boosting = true;
        });
        boostBtn.addEventListener('touchend', function() {
            boosting = false;
        });
    }
    
    document.getElementById('startBtn').addEventListener('click', startGame);
    document.getElementById('resumeBtn').addEventListener('click', togglePause);
    document.getElementById('restartBtn').addEventListener('click', function() {
        document.getElementById('pauseScreen').classList.add('hidden');
        startGame();
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
