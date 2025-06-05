document.addEventListener('DOMContentLoaded', function() {

    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');

    const starsContainer = document.querySelector('.stars-container');
    if (starsContainer) {
        createStars(starsContainer, 100);
    }

    let gameRunning = false;
    let gamePaused = false;
    let oxygen = 100;
    let repairs = 0;
    let gameTime = 0;
    let gameStartTime = 0;

    const player = {
        x: 200,
        y: 200,
        width: 30,
        height: 30,
        speed: 5
    };

    const stations = [
        { x: 100, y: 100, repaired: false },
        { x: 300, y: 100, repaired: false },
        { x: 500, y: 100, repaired: false },
        { x: 300, y: 300, repaired: false },
        { x: 500, y: 300, repaired: false }
    ];

    function resizeCanvas() {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
        render();
    }

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    function updateStats() {
        document.getElementById('oxygenDisplay').innerText = `Oxygen: ${Math.floor(oxygen)}%`;
        document.getElementById('repairsDisplay').innerText = `Repairs: ${repairs}/5`;
        document.getElementById('timeDisplay').innerText = `Time: ${gameTime}s`;
    }

    function startGame() {
        gameRunning = true;
        oxygen = 100;
        repairs = 0;
        gameTime = 0;
        

        stations.forEach(station => {
            station.repaired = false;
        });
        

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
        

        oxygen -= 0.02;
        

        if (oxygen <= 0) {
            gameOver();
            return;
        }
        

        if (keys.up && player.y > 0) player.y -= player.speed;
        if (keys.down && player.y < canvas.height - player.height) player.y += player.speed;
        if (keys.left && player.x > 0) player.x -= player.speed;
        if (keys.right && player.x < canvas.width - player.width) player.x += player.speed;
        

        checkRepairs();
        

        updateStats();
    }

    function checkRepairs() {
        stations.forEach((station, index) => {
            if (!station.repaired) {
                const dx = player.x + player.width/2 - station.x;
                const dy = player.y + player.height/2 - station.y;
                const distance = Math.sqrt(dx*dx + dy*dy);
                
                station.nearPlayer = distance < 50;
            }
        });
    }

    function repairStation() {
        if (!gameRunning || gamePaused) return;
        
        stations.forEach(station => {
            if (!station.repaired && station.nearPlayer) {
                station.repaired = true;
                repairs++;
                

                if (repairs >= 5) {
                    missionComplete();
                }
            }
        });
    }

    function render() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        

        ctx.fillStyle = '#0a0a2a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        

        ctx.fillStyle = '#00a9ff';
        ctx.fillRect(player.x, player.y, player.width, player.height);
        

        stations.forEach(station => {
            ctx.fillStyle = station.repaired ? '#00ff00' : '#ff0000';
            ctx.beginPath();
            ctx.arc(station.x, station.y, 20, 0, Math.PI * 2);
            ctx.fill();
            
            if (station.nearPlayer && !station.repaired) {
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(station.x, station.y, 30, 0, Math.PI * 2);
                ctx.stroke();
                
                ctx.fillStyle = '#ffffff';
                ctx.font = '14px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('Press SPACE to repair', station.x, station.y - 40);
            }
        });
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
        
        document.getElementById('finalRepairs').innerText = `${repairs}/5`;
        document.getElementById('finalOxygen').innerText = `${Math.floor(oxygen)}%`;
        document.getElementById('finalTime').innerText = `${gameTime}s`;
        
        document.getElementById('gameOverScreen').classList.remove('hidden');
        document.querySelector('.directional-controls').classList.add('hidden');
    }

    function missionComplete() {
        gameRunning = false;
        
        document.getElementById('successOxygen').innerText = `${Math.floor(oxygen)}%`;
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

    const keys = {
        up: false,
        down: false,
        left: false,
        right: false
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
            repairStation();
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
            repairStation();
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
