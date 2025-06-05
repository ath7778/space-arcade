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
        score: 0,
        time: 0,
        timeStart: 0,
        distance: 0,
        speed: 0,
        maxSpeed: 0,
        player: {
            x: 100,
            y: 0,
            width: 80,
            height: 30,
            speed: 5
        },
        obstacles: [],
        energyParticles: [],
        solarStreams: [],
        backgroundElements: []
    };
    
    const obstacleTypes = [
        {
            type: 'debris',
            width: 30,
            height: 30,
            color: '#777',
            speed: 3,
            damage: 1
        },
        {
            type: 'solarFlare',
            width: 50,
            height: 20,
            color: '#ff5500',
            speed: 5,
            damage: 2
        },
        {
            type: 'asteroid',
            width: 60,
            height: 60,
            color: '#aa7744',
            speed: 2,
            damage: 3
        }
    ];
    
    function startGame() {
        gameState.running = true;
        gameState.score = 0;
        gameState.time = 0;
        gameState.distance = 0;
        gameState.speed = 2;
        gameState.maxSpeed = 2;
        
        gameState.player.y = canvas.height / 2 - gameState.player.height / 2;
        gameState.obstacles = [];
        gameState.energyParticles = [];
        gameState.solarStreams = [];
        gameState.backgroundElements = [];
        
        document.getElementById('startScreen').classList.add('hidden');
        
        if (isMobileDevice()) {
            document.querySelector('.mobile-controls').classList.remove('hidden');
        }
        
        startTimer();
        
        for (let i = 0; i < 20; i++) {
            addBackgroundElement();
        }
        
        addSolarStream();
    }
    
    function startTimer() {
        gameState.timeStart = Date.now();
        
        function tick() {
            if (!gameState.running || gameState.paused) return;
            
            gameState.time = Math.floor((Date.now() - gameState.timeStart) / 1000);
            updateStats();
            
            requestAnimationFrame(tick);
        }
        
        tick();
    }
    
    function updateStats() {
        document.getElementById('scoreDisplay').innerText = `Score: ${Math.floor(gameState.score)}`;
        document.getElementById('speedDisplay').innerText = `Speed: ${gameState.speed.toFixed(1)}`;
        document.getElementById('timeDisplay').innerText = `Time: ${gameState.time}s`;
    }
    
    function addObstacle() {
        const obstacleType = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
        
        const obstacle = {
            x: canvas.width + 100,
            y: Math.random() * (canvas.height - obstacleType.height),
            width: obstacleType.width,
            height: obstacleType.height,
            speed: obstacleType.speed,
            color: obstacleType.color,
            damage: obstacleType.damage,
            type: obstacleType.type
        };
        
        gameState.obstacles.push(obstacle);
    }
    
    function addEnergyParticle() {
        const particle = {
            x: canvas.width + 50,
            y: Math.random() * (canvas.height - 15),
            width: 15,
            height: 15,
            speed: 3,
            color: '#ffcc00',
            value: 10 + Math.random() * 10
        };
        
        gameState.energyParticles.push(particle);
    }
    
    function addSolarStream() {
        const streamHeight = 80 + Math.random() * 100;
        const stream = {
            x: canvas.width + 200,
            y: Math.random() * (canvas.height - streamHeight),
            width: 200 + Math.random() * 300,
            height: streamHeight,
            speed: 2,
            boostFactor: 1.5 + Math.random() * 1
        };
        
        gameState.solarStreams.push(stream);
    }
    
    function addBackgroundElement() {
        const sizes = [2, 3, 4, 5];
        const size = sizes[Math.floor(Math.random() * sizes.length)];
        
        const element = {
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: size,
            speed: 0.5 + Math.random() * 0.5,
            opacity: 0.1 + Math.random() * 0.4
        };
        
        gameState.backgroundElements.push(element);
    }
    
    function update() {
        if (!gameState.running || gameState.paused) return;
        
        const player = gameState.player;
        
        if (keys.up && player.y > 0) {
            player.y -= player.speed;
        }
        
        if (keys.down && player.y < canvas.height - player.height) {
            player.y += player.speed;
        }
        
        updateBackgroundElements();
        updateObstacles();
        updateEnergyParticles();
        updateSolarStreams();
        
        gameState.distance += gameState.speed / 10;
        gameState.score += gameState.speed / 5;
        
        gameState.speed *= 0.999;
        
        if (Math.random() < 0.02) {
            addObstacle();
        }
        
        if (Math.random() < 0.01) {
            addEnergyParticle();
        }
        
        if (Math.random() < 0.005) {
            addSolarStream();
        }
        
        if (gameState.backgroundElements.length < 20 && Math.random() < 0.1) {
            addBackgroundElement();
        }
    }
    
    function updateBackgroundElements() {
        for (let i = gameState.backgroundElements.length - 1; i >= 0; i--) {
            const element = gameState.backgroundElements[i];
            
            element.x -= element.speed * gameState.speed;
            
            if (element.x + element.size < 0) {
                element.x = canvas.width + element.size;
                element.y = Math.random() * canvas.height;
            }
        }
    }
    
    function updateObstacles() {
        for (let i = gameState.obstacles.length - 1; i >= 0; i--) {
            const obstacle = gameState.obstacles[i];
            
            obstacle.x -= obstacle.speed * gameState.speed;
            
            if (checkCollision(gameState.player, obstacle)) {
                gameOver();
                return;
            }
            
            if (obstacle.x + obstacle.width < 0) {
                gameState.obstacles.splice(i, 1);
            }
        }
    }
    
    function updateEnergyParticles() {
        for (let i = gameState.energyParticles.length - 1; i >= 0; i--) {
            const particle = gameState.energyParticles[i];
            
            particle.x -= particle.speed * gameState.speed;
            
            if (checkCollision(gameState.player, particle)) {
                gameState.speed += 0.5;
                gameState.score += particle.value;
                
                if (gameState.speed > gameState.maxSpeed) {
                    gameState.maxSpeed = gameState.speed;
                }
                
                gameState.energyParticles.splice(i, 1);
            } else if (particle.x + particle.width < 0) {
                gameState.energyParticles.splice(i, 1);
            }
        }
    }
    
    function updateSolarStreams() {
        for (let i = gameState.solarStreams.length - 1; i >= 0; i--) {
            const stream = gameState.solarStreams[i];
            
            stream.x -= stream.speed * gameState.speed;
            
            if (checkCollision(gameState.player, stream)) {
                gameState.speed *= 1.001 * stream.boostFactor;
                
                if (gameState.speed > gameState.maxSpeed) {
                    gameState.maxSpeed = gameState.speed;
                }
            }
            
            if (stream.x + stream.width < 0) {
                gameState.solarStreams.splice(i, 1);
            }
        }
    }
    
    function checkCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
    
    function gameOver() {
        gameState.running = false;
        
        document.getElementById('finalScore').innerText = Math.floor(gameState.score);
        document.getElementById('finalSpeed').innerText = gameState.maxSpeed.toFixed(1);
        document.getElementById('finalDistance').innerText = Math.floor(gameState.distance);
        document.getElementById('finalTime').innerText = gameState.time + 's';
        
        document.getElementById('gameOverScreen').classList.remove('hidden');
        document.querySelector('.mobile-controls').classList.add('hidden');
    }
    
    function render() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (!gameState.running && document.getElementById('startScreen').classList.contains('hidden') && 
            document.getElementById('gameOverScreen').classList.contains('hidden')) {
            return;
        }
        
        renderBackground();
        renderSolarStreams();
        renderPlayer();
        renderObstacles();
        renderEnergyParticles();
    }
    
    function renderBackground() {
        for (const element of gameState.backgroundElements) {
            ctx.fillStyle = `rgba(255, 255, 255, ${element.opacity})`;
            ctx.fillRect(element.x, element.y, element.size, element.size);
        }
    }
    
    function renderPlayer() {
        const player = gameState.player;
        
        ctx.fillStyle = '#00a9ff';
        ctx.fillRect(player.x, player.y, player.width, player.height);
        
        ctx.fillStyle = '#e0e0ff';
        ctx.fillRect(player.x + player.width - 10, player.y + 5, 5, player.height - 10);
        
        ctx.fillStyle = '#ffcc00';
        ctx.fillRect(player.x - 5, player.y + player.height / 2 - 2, 10, 4);
    }
    
    function renderObstacles() {
        for (const obstacle of gameState.obstacles) {
            ctx.fillStyle = obstacle.color;
            
            if (obstacle.type === 'debris') {
                ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
            } else if (obstacle.type === 'solarFlare') {
                ctx.beginPath();
                ctx.moveTo(obstacle.x, obstacle.y);
                ctx.lineTo(obstacle.x + obstacle.width, obstacle.y + obstacle.height / 2);
                ctx.lineTo(obstacle.x, obstacle.y + obstacle.height);
                ctx.closePath();
                ctx.fill();
            } else if (obstacle.type === 'asteroid') {
                ctx.beginPath();
                ctx.arc(
                    obstacle.x + obstacle.width / 2,
                    obstacle.y + obstacle.height / 2,
                    obstacle.width / 2,
                    0,
                    Math.PI * 2
                );
                ctx.fill();
            }
        }
    }
    
    function renderEnergyParticles() {
        for (const particle of gameState.energyParticles) {
            ctx.fillStyle = particle.color;
            ctx.beginPath();
            ctx.arc(
                particle.x + particle.width / 2,
                particle.y + particle.height / 2,
                particle.width / 2,
                0,
                Math.PI * 2
            );
            ctx.fill();
            
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(
                particle.x + particle.width / 2 - 2,
                particle.y + particle.height / 2 - 2,
                particle.width / 5,
                0,
                Math.PI * 2
            );
            ctx.fill();
        }
    }
    
    function renderSolarStreams() {
        for (const stream of gameState.solarStreams) {
            const gradient = ctx.createLinearGradient(
                stream.x, 0,
                stream.x + stream.width, 0
            );
            
            gradient.addColorStop(0, 'rgba(255, 204, 0, 0.1)');
            gradient.addColorStop(0.5, 'rgba(255, 102, 0, 0.2)');
            gradient.addColorStop(1, 'rgba(255, 51, 0, 0.1)');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(stream.x, stream.y, stream.width, stream.height);
            
            for (let i = 0; i < 10; i++) {
                const particleX = stream.x + Math.random() * stream.width;
                const particleY = stream.y + Math.random() * stream.height;
                const particleSize = 1 + Math.random() * 3;
                
                ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
                ctx.fillRect(particleX, particleY, particleSize, particleSize);
            }
        }
    }
    
    function gameLoop() {
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
        muteBtn.innerHTML = gameState.isMuted ? '<i class="fas fa-volume-mute"></i>' : '<i class="fas fa-volume-up"></i>';
    }
    
    function toggleHelp() {
        document.getElementById('helpModal').classList.toggle('hidden');
    }
    
    function isMobileDevice() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
    
    const keys = {
        up: false,
        down: false
    };
    
    document.addEventListener('keydown', function(event) {
        if (event.key === 'ArrowUp' || event.key === 'w') {
            keys.up = true;
        } else if (event.key === 'ArrowDown' || event.key === 's') {
            keys.down = true;
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
        }
    });
    
    const upButton = document.getElementById('upButton');
    const downButton = document.getElementById('downButton');
    
    if (upButton && downButton) {
        upButton.addEventListener('touchstart', function() {
            keys.up = true;
        });
        
        upButton.addEventListener('touchend', function() {
            keys.up = false;
        });
        
        downButton.addEventListener('touchstart', function() {
            keys.down = true;
        });
        
        downButton.addEventListener('touchend', function() {
            keys.down = false;
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
    
    gameLoop();
});
