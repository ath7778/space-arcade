document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    const starsContainer = document.querySelector('.stars-container');
    if (starsContainer) {
        createStars(starsContainer, 100);
    }
    
    let gameRunning = false;
    let gamePaused = false;
    let fuel = 100;
    let resources = 0;
    let depth = 0;
    let targetResources = 20;
    let gameTime = 0;
    let gameStartTime = 0;
    let mining = false;
    let miningTarget = null;
    let cameraOffset = 0;
    
    const player = {
        x: 0,
        y: 0,
        width: 40,
        height: 30,
        speed: 3,
        color: '#40b0ff',
        drill: {
            active: false,
            width: 8,
            height: 20,
            color: '#ffcc00'
        }
    };
    
    const terrain = [];
    const resourceNodes = [];
    const hazards = [];
    
    function resizeCanvas() {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
        
        if (player && !gameRunning) {
            player.x = canvas.width / 2 - player.width / 2;
            player.y = 100;
        }
        
        render();
    }
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    function updateStats() {
        document.getElementById('fuelDisplay').innerText = `Fuel: ${Math.floor(fuel)}%`;
        document.getElementById('resourcesDisplay').innerText = `Resources: ${resources}/${targetResources}`;
        document.getElementById('timeDisplay').innerText = `Time: ${gameTime}s`;
    }
    
    function generateTerrain() {
        terrain.length = 0;
        resourceNodes.length = 0;
        hazards.length = 0;
        
        const segmentWidth = 100;
        const totalWidth = canvas.width;
        const totalSegments = Math.ceil(totalWidth / segmentWidth) + 1;
        
        let currentY = 200;
        
        for (let i = 0; i < 200; i++) {
            const segments = [];
            
            for (let j = 0; j < totalSegments; j++) {
                const x = j * segmentWidth;
                const height = 10 + Math.random() * 30;
                
                if (i > 0) {
                    currentY += Math.random() * 10 - 3;
                    currentY = Math.min(Math.max(currentY, 200 + i * 10), 300 + i * 15);
                }
                
                segments.push({
                    x: x,
                    y: currentY,
                    width: segmentWidth,
                    height: height,
                    color: getTerrainColor(i)
                });
                
                if (i > 2 && Math.random() < 0.2) {
                    const resourceType = Math.random();
                    const resourceValue = resourceType < 0.7 ? 1 : (resourceType < 0.9 ? 2 : 3);
                    const resourceColor = resourceType < 0.7 ? '#5090ff' : (resourceType < 0.9 ? '#50ff90' : '#ffcc40');
                    
                    resourceNodes.push({
                        x: x + Math.random() * (segmentWidth - 20),
                        y: currentY - 5 - Math.random() * 10,
                        width: 15 + resourceValue * 5,
                        height: 15 + resourceValue * 5,
                        value: resourceValue,
                        durability: resourceValue * 3,
                        color: resourceColor
                    });
                }
                
                if (i > 5 && Math.random() < 0.1) {
                    hazards.push({
                        x: x + Math.random() * (segmentWidth - 30),
                        y: currentY - 15 - Math.random() * 20,
                        width: 30,
                        height: 30,
                        type: Math.random() < 0.5 ? 'gas' : 'spike',
                        color: Math.random() < 0.5 ? '#ff5050' : '#ff9000',
                        damage: Math.random() < 0.5 ? 10 : 20
                    });
                }
            }
            
            terrain.push(segments);
        }
    }
    
    function getTerrainColor(depth) {
        if (depth < 5) {
            return '#444';
        } else if (depth < 10) {
            return '#555';
        } else if (depth < 20) {
            return '#553';
        } else if (depth < 30) {
            return '#564';
        } else if (depth < 50) {
            return '#656';
        } else if (depth < 70) {
            return '#547';
        } else if (depth < 100) {
            return '#649';
        } else {
            return '#73a';
        }
    }
    
    function startGame() {
        gameRunning = true;
        gamePaused = false;
        fuel = 100;
        resources = 0;
        depth = 0;
        cameraOffset = 0;
        
        player.x = canvas.width / 2 - player.width / 2;
        player.y = 100;
        player.drill.active = false;
        
        generateTerrain();
        
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
        
        fuel -= 0.05;
        if (mining) {
            fuel -= 0.1;
        }
        
        if (fuel <= 0) {
            fuel = 0;
            gameOver();
            return;
        }
        
        if (resources >= targetResources) {
            missionComplete();
            return;
        }
        
        const speed = mining ? player.speed / 2 : player.speed;
        
        if (keys.up) {
            player.y -= speed;
            player.y = Math.max(0, player.y);
        }
        
        if (keys.down) {
            player.y += speed;
        }
        
        if (keys.left) {
            player.x -= speed;
            player.x = Math.max(0, player.x);
        }
        
        if (keys.right) {
            player.x += speed;
            player.x = Math.min(canvas.width - player.width, player.x);
        }
        
        if (player.y > canvas.height * 0.6 && !mining) {
            cameraOffset += (player.y - canvas.height * 0.6) / 10;
            player.y = canvas.height * 0.6;
        }
        
        depth = Math.max(depth, Math.floor(cameraOffset / 50));
        
        player.drill.active = mining;
        
        if (mining) {
            handleMining();
        }
        
        checkCollisions();
        updateStats();
    }
    
    function handleMining() {
        const drillX = player.x + player.width / 2 - player.drill.width / 2;
        const drillY = player.y + player.height;
        const drillEndY = drillY + player.drill.height;
        
        for (let i = resourceNodes.length - 1; i >= 0; i--) {
            const node = resourceNodes[i];
            const nodeScreenY = node.y - cameraOffset;
            
            if (rectCollision(
                drillX, drillY, player.drill.width, player.drill.height,
                node.x, nodeScreenY, node.width, node.height
            )) {
                node.durability -= 0.1;
                miningTarget = node;
                
                if (node.durability <= 0) {
                    resources += node.value;
                    resourceNodes.splice(i, 1);
                    miningTarget = null;
                }
                
                break;
            }
        }
    }
    
    function checkCollisions() {
        for (const hazard of hazards) {
            const hazardScreenY = hazard.y - cameraOffset;
            
            if (rectCollision(
                player.x, player.y, player.width, player.height,
                hazard.x, hazardScreenY, hazard.width, hazard.height
            )) {
                fuel -= hazard.damage;
                
                if (fuel <= 0) {
                    fuel = 0;
                    gameOver();
                    return;
                }
            }
        }
    }
    
    function render() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        drawBackground();
        drawTerrain();
        drawResourceNodes();
        drawHazards();
        drawPlayer();
        drawDepthIndicator();
    }
    
    function drawBackground() {
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#000824');
        gradient.addColorStop(1, '#000011');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    function drawTerrain() {
        for (let i = 0; i < terrain.length; i++) {
            const segments = terrain[i];
            
            for (const segment of segments) {
                const segmentScreenY = segment.y - cameraOffset;
                
                if (segmentScreenY + segment.height < 0 || segmentScreenY > canvas.height) {
                    continue;
                }
                
                ctx.fillStyle = segment.color;
                ctx.fillRect(segment.x, segmentScreenY, segment.width, segment.height);
                
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(segment.x, segmentScreenY);
                ctx.lineTo(segment.x + segment.width, segmentScreenY);
                ctx.stroke();
            }
        }
    }
    
    function drawResourceNodes() {
        for (const node of resourceNodes) {
            const nodeScreenY = node.y - cameraOffset;
            
            if (nodeScreenY + node.height < 0 || nodeScreenY > canvas.height) {
                continue;
            }
            
            ctx.fillStyle = node.color;
            ctx.beginPath();
            ctx.ellipse(
                node.x + node.width / 2,
                nodeScreenY + node.height / 2,
                node.width / 2,
                node.height / 2,
                0, 0, Math.PI * 2
            );
            ctx.fill();
            
            if (miningTarget === node) {
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.ellipse(
                    node.x + node.width / 2,
                    nodeScreenY + node.height / 2,
                    node.width / 2 + 4,
                    node.height / 2 + 4,
                    0, 0, Math.PI * 2
                );
                ctx.stroke();
            }
        }
    }
    
    function drawHazards() {
        for (const hazard of hazards) {
            const hazardScreenY = hazard.y - cameraOffset;
            
            if (hazardScreenY + hazard.height < 0 || hazardScreenY > canvas.height) {
                continue;
            }
            
            ctx.fillStyle = hazard.color;
            
            if (hazard.type === 'gas') {
                for (let i = 0; i < 3; i++) {
                    const radius = hazard.width / 2 - i * 5;
                    const alpha = 0.8 - i * 0.2;
                    ctx.beginPath();
                    ctx.arc(
                        hazard.x + hazard.width / 2,
                        hazardScreenY + hazard.height / 2,
                        radius,
                        0, Math.PI * 2
                    );
                    ctx.fillStyle = `rgba(${parseInt(hazard.color.substr(1, 2), 16)}, ${parseInt(hazard.color.substr(3, 2), 16)}, ${parseInt(hazard.color.substr(5, 2), 16)}, ${alpha})`;
                    ctx.fill();
                }
            } else {
                ctx.beginPath();
                ctx.moveTo(hazard.x + hazard.width / 2, hazardScreenY);
                ctx.lineTo(hazard.x, hazardScreenY + hazard.height);
                ctx.lineTo(hazard.x + hazard.width, hazardScreenY + hazard.height);
                ctx.closePath();
                ctx.fill();
            }
        }
    }
    
    function drawPlayer() {
        ctx.fillStyle = player.color;
        
        ctx.beginPath();
        ctx.moveTo(player.x + player.width / 2, player.y);
        ctx.lineTo(player.x, player.y + player.height);
        ctx.lineTo(player.x + player.width, player.y + player.height);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = '#ddd';
        ctx.fillRect(
            player.x + player.width / 4,
            player.y + player.height / 3,
            player.width / 2,
            player.height / 3
        );
        
        if (player.drill.active) {
            ctx.fillStyle = player.drill.color;
            ctx.fillRect(
                player.x + player.width / 2 - player.drill.width / 2,
                player.y + player.height,
                player.drill.width,
                player.drill.height
            );
        }
    }
    
    function drawDepthIndicator() {
        const barWidth = 20;
        const barHeight = canvas.height * 0.8;
        const barX = canvas.width - barWidth - 10;
        const barY = (canvas.height - barHeight) / 2;
        
        ctx.fillStyle = 'rgba(20, 40, 80, 0.6)';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        const maxDepth = 200;
        const depthRatio = Math.min(depth / maxDepth, 1);
        const indicatorHeight = 10;
        const indicatorY = barY + barHeight * (1 - depthRatio) - indicatorHeight / 2;
        
        ctx.fillStyle = '#40a0ff';
        ctx.fillRect(barX - 5, indicatorY, barWidth + 10, indicatorHeight);
        
        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'right';
        ctx.fillText(`${depth}m`, barX - 10, indicatorY + indicatorHeight / 2 + 4);
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
        
        document.getElementById('finalResources').innerText = resources;
        document.getElementById('finalDepth').innerText = `${depth}m`;
        document.getElementById('finalTime').innerText = `${gameTime}s`;
        
        document.getElementById('gameOverScreen').classList.remove('hidden');
        document.querySelector('.directional-controls').classList.add('hidden');
    }
    
    function missionComplete() {
        gameRunning = false;
        
        document.getElementById('successResources').innerText = resources;
        document.getElementById('successFuel').innerText = `${Math.floor(fuel)}%`;
        document.getElementById('successTime').innerText = `${gameTime}s`;
        
        document.getElementById('missionCompleteScreen').classList.remove('hidden');
        document.querySelector('.directional-controls').classList.add('hidden');
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
            mining = true;
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
            mining = false;
            miningTarget = null;
        }
    });
    
    const upBtn = document.getElementById('upBtn');
    const downBtn = document.getElementById('downBtn');
    const leftBtn = document.getElementById('leftBtn');
    const rightBtn = document.getElementById('rightBtn');
    const actionBtn = document.getElementById('actionBtn');
    
    if (upBtn && downBtn && leftBtn && rightBtn && actionBtn) {
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
        
        actionBtn.addEventListener('touchstart', function() {
            mining = true;
        });
        actionBtn.addEventListener('touchend', function() {
            mining = false;
            miningTarget = null;
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
    document.getElementById('nextMissionBtn').addEventListener('click', function() {
        document.getElementById('missionCompleteScreen').classList.add('hidden');
        startGame();
    });
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
