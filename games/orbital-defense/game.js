document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    const starsContainer = document.querySelector('.stars-container');
    if (starsContainer) {
        createStars(starsContainer, 100);
    }
    
    let gameRunning = false;
    let gamePaused = false;
    let planetHealth = 100;
    let energy = 100;
    let score = 0;
    let currentWave = 0;
    let waveTimer = 0;
    let enemiesDestroyed = 0;
    let totalWaves = 10;
    let gameTime = 0;
    let gameStartTime = 0;
    
    const player = {
        angle: 0,
        rotationSpeed: 0.04,
        x: 0,
        y: 0,
        radius: 20,
        color: '#40b0ff',
        weaponType: 0,
        firing: false,
        firingCooldown: 0,
        firingRate: [10, 30, 60],
        energyCost: [1, 3, 10]
    };
    
    const planet = {
        x: 0,
        y: 0,
        radius: 80,
        color: '#3050a0',
        atmosphere: '#4080ff'
    };
    
    const projectiles = [];
    const enemies = [];
    const particles = [];
    const powerups = [];
    
    const waves = [
        { count: 5, types: [0], interval: 120 },
        { count: 8, types: [0, 0, 1], interval: 100 },
        { count: 10, types: [0, 0, 1, 1], interval: 90 },
        { count: 12, types: [0, 1, 1, 2], interval: 80 },
        { count: 15, types: [0, 1, 1, 1, 2], interval: 70 },
        { count: 18, types: [0, 1, 1, 2, 2], interval: 60 },
        { count: 20, types: [0, 1, 1, 2, 2, 2], interval: 50 },
        { count: 25, types: [1, 1, 2, 2, 2], interval: 40 },
        { count: 30, types: [1, 2, 2, 2], interval: 30 },
        { count: 1, types: [3], interval: 20 }
    ];
    
    const enemyTypes = [
        { radius: 15, color: '#ff5050', speed: 0.7, health: 1, damage: 10, points: 10, vulnerableTo: [0, 1, 2] },
        { radius: 20, color: '#ff9000', speed: 0.5, health: 2, damage: 15, points: 20, vulnerableTo: [0, 2] },
        { radius: 25, color: '#50ff50', speed: 0.3, health: 3, damage: 20, points: 30, vulnerableTo: [1, 2] },
        { radius: 40, color: '#ff00ff', speed: 0.2, health: 20, damage: 50, points: 500, vulnerableTo: [2] }
    ];
    
    const weaponColors = ['#00ffff', '#ffff00', '#ff00ff'];
    const weaponSizes = [4, 6, 8];
    
    function resizeCanvas() {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
        
        planet.x = canvas.width / 2;
        planet.y = canvas.height / 2;
        
        updatePlayerPosition();
        
        render();
    }
    
    function updatePlayerPosition() {
        if (!player) return;
        
        const orbitRadius = planet.radius + 40;
        player.x = planet.x + Math.cos(player.angle) * orbitRadius;
        player.y = planet.y + Math.sin(player.angle) * orbitRadius;
    }
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    function updateStats() {
        document.getElementById('planetHealthDisplay').innerText = `Planet: ${Math.floor(planetHealth)}%`;
        document.getElementById('energyDisplay').innerText = `Energy: ${Math.floor(energy)}%`;
        document.getElementById('scoreDisplay').innerText = `Score: ${score}`;
    }
    
    function spawnEnemy(type) {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.max(canvas.width, canvas.height);
        const x = planet.x + Math.cos(angle) * distance;
        const y = planet.y + Math.sin(angle) * distance;
        
        const enemyType = enemyTypes[type];
        
        enemies.push({
            x: x,
            y: y,
            type: type,
            radius: enemyType.radius,
            color: enemyType.color,
            speed: enemyType.speed,
            health: enemyType.health,
            damage: enemyType.damage,
            points: enemyType.points,
            vulnerableTo: enemyType.vulnerableTo
        });
    }
    
    function startGame() {
        gameRunning = true;
        gamePaused = false;
        planetHealth = 100;
        energy = 100;
        score = 0;
        currentWave = 0;
        waveTimer = 0;
        enemiesDestroyed = 0;
        
        player.angle = -Math.PI / 2;
        player.weaponType = 0;
        player.firing = false;
        player.firingCooldown = 0;
        
        projectiles.length = 0;
        enemies.length = 0;
        particles.length = 0;
        powerups.length = 0;
        
        updatePlayerPosition();
        
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
        
        if (currentWave < waves.length) {
            const wave = waves[currentWave];
            
            waveTimer++;
            
            if (waveTimer >= wave.interval && enemies.length < wave.count) {
                const typeIndex = Math.floor(Math.random() * wave.types.length);
                spawnEnemy(wave.types[typeIndex]);
                waveTimer = 0;
            }
            
            if (enemies.length === 0 && wave.count === enemiesDestroyed) {
                currentWave++;
                waveTimer = 0;
                enemiesDestroyed = 0;
                
                if (currentWave >= waves.length) {
                    victory();
                    return;
                }
            }
        }
        
        energy = Math.min(energy + 0.1, 100);
        
        if (player.firingCooldown > 0) {
            player.firingCooldown--;
        }
        
        if (player.firing && player.firingCooldown <= 0 && energy >= player.energyCost[player.weaponType]) {
            fireProjectile();
        }
        
        if (keys.left) {
            player.angle -= player.rotationSpeed;
        }
        
        if (keys.right) {
            player.angle += player.rotationSpeed;
        }
        
        updatePlayerPosition();
        updateProjectiles();
        updateEnemies();
        updateParticles();
        updatePowerups();
        checkCollisions();
        
        updateStats();
    }
    
    function fireProjectile() {
        const projectileSpeed = 7 + player.weaponType * 2;
        const projectileSize = weaponSizes[player.weaponType];
        const projectileColor = weaponColors[player.weaponType];
        
        const directionX = Math.cos(player.angle);
        const directionY = Math.sin(player.angle);
        
        const startDistance = player.radius + projectileSize;
        
        projectiles.push({
            x: player.x + directionX * startDistance,
            y: player.y + directionY * startDistance,
            vx: directionX * projectileSpeed,
            vy: directionY * projectileSpeed,
            radius: projectileSize,
            color: projectileColor,
            type: player.weaponType
        });
        
        energy -= player.energyCost[player.weaponType];
        player.firingCooldown = player.firingRate[player.weaponType];
    }
    
    function updateProjectiles() {
        for (let i = projectiles.length - 1; i >= 0; i--) {
            const proj = projectiles[i];
            
            proj.x += proj.vx;
            proj.y += proj.vy;
            
            if (proj.x < -proj.radius || proj.x > canvas.width + proj.radius ||
                proj.y < -proj.radius || proj.y > canvas.height + proj.radius) {
                projectiles.splice(i, 1);
            }
        }
    }
    
    function updateEnemies() {
        for (let i = enemies.length - 1; i >= 0; i--) {
            const enemy = enemies[i];
            
            const dx = planet.x - enemy.x;
            const dy = planet.y - enemy.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            const nx = dx / distance;
            const ny = dy / distance;
            
            enemy.x += nx * enemy.speed;
            enemy.y += ny * enemy.speed;
            
            if (distance < planet.radius) {
                createExplosion(enemy.x, enemy.y, enemy.radius * 2, enemy.color);
                planetHealth -= enemy.damage;
                enemies.splice(i, 1);
                
                if (planetHealth <= 0) {
                    planetHealth = 0;
                    gameOver();
                    return;
                }
            }
        }
    }
    
    function createExplosion(x, y, size, color) {
        const particleCount = 20 + Math.floor(size / 5);
        
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 0.5 + Math.random() * 2;
            const lifetime = 30 + Math.random() * 30;
            
            particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                radius: 1 + Math.random() * 3,
                color: color,
                lifetime: lifetime,
                maxLifetime: lifetime
            });
        }
        
        if (Math.random() < 0.2) {
            powerups.push({
                x: x,
                y: y,
                radius: 10,
                type: Math.floor(Math.random() * 3),
                lifetime: 500
            });
        }
    }
    
    function updateParticles() {
        for (let i = particles.length - 1; i >= 0; i--) {
            const particle = particles[i];
            
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.lifetime--;
            
            if (particle.lifetime <= 0) {
                particles.splice(i, 1);
            }
        }
    }
    
    function updatePowerups() {
        for (let i = powerups.length - 1; i >= 0; i--) {
            const powerup = powerups[i];
            
            powerup.lifetime--;
            
            if (powerup.lifetime <= 0) {
                powerups.splice(i, 1);
            }
        }
    }
    
    function checkCollisions() {
        for (let i = projectiles.length - 1; i >= 0; i--) {
            const proj = projectiles[i];
            
            for (let j = enemies.length - 1; j >= 0; j--) {
                const enemy = enemies[j];
                
                const dx = proj.x - enemy.x;
                const dy = proj.y - enemy.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < proj.radius + enemy.radius) {
                    projectiles.splice(i, 1);
                    
                    if (enemy.vulnerableTo.includes(proj.type)) {
                        enemy.health--;
                        
                        if (enemy.health <= 0) {
                            createExplosion(enemy.x, enemy.y, enemy.radius * 2, enemy.color);
                            score += enemy.points;
                            enemiesDestroyed++;
                            enemies.splice(j, 1);
                        }
                    }
                    
                    break;
                }
            }
        }
        
        for (let i = powerups.length - 1; i >= 0; i--) {
            const powerup = powerups[i];
            
            const dx = powerup.x - player.x;
            const dy = powerup.y - player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < powerup.radius + player.radius) {
                if (powerup.type === 0) {
                    energy = Math.min(energy + 30, 100);
                } else if (powerup.type === 1) {
                    planetHealth = Math.min(planetHealth + 10, 100);
                } else if (powerup.type === 2) {
                    for (let j = 0; j < enemies.length; j++) {
                        const enemy = enemies[j];
                        createExplosion(enemy.x, enemy.y, enemy.radius * 2, enemy.color);
                    }
                    enemies.length = 0;
                    enemiesDestroyed = waves[currentWave].count;
                }
                
                powerups.splice(i, 1);
            }
        }
    }
    
    function render() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        renderBackground();
        renderPlanet();
        renderPlayer();
        renderProjectiles();
        renderEnemies();
        renderParticles();
        renderPowerups();
        renderWaveIndicator();
    }
    
    function renderBackground() {
        const gradient = ctx.createRadialGradient(
            planet.x, planet.y, 0,
            planet.x, planet.y, canvas.width
        );
        gradient.addColorStop(0, '#102040');
        gradient.addColorStop(1, '#000010');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    function renderPlanet() {
        ctx.beginPath();
        ctx.arc(planet.x, planet.y, planet.radius, 0, Math.PI * 2);
        
        const gradient = ctx.createRadialGradient(
            planet.x - planet.radius * 0.3, planet.y - planet.radius * 0.3, 0,
            planet.x, planet.y, planet.radius
        );
        gradient.addColorStop(0, planet.atmosphere);
        gradient.addColorStop(1, planet.color);
        
        ctx.fillStyle = gradient;
        ctx.fill();
        
        ctx.strokeStyle = '#6090ff';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        const healthBarWidth = planet.radius * 2;
        const healthBarHeight = 10;
        const healthBarX = planet.x - healthBarWidth / 2;
        const healthBarY = planet.y + planet.radius + 20;
        
        ctx.fillStyle = 'rgba(20, 40, 80, 0.6)';
        ctx.fillRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);
        
        ctx.fillStyle = planetHealth > 50 ? '#40ff40' : (planetHealth > 25 ? '#ffff40' : '#ff4040');
        ctx.fillRect(healthBarX, healthBarY, healthBarWidth * (planetHealth / 100), healthBarHeight);
        
        ctx.strokeStyle = '#6090ff';
        ctx.lineWidth = 2;
        ctx.strokeRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);
    }
    
    function renderPlayer() {
        ctx.save();
        ctx.translate(player.x, player.y);
        ctx.rotate(player.angle + Math.PI / 2);
        
        ctx.fillStyle = player.color;
        ctx.beginPath();
        ctx.moveTo(0, -player.radius);
        ctx.lineTo(-player.radius / 2, player.radius / 2);
        ctx.lineTo(player.radius / 2, player.radius / 2);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = weaponColors[player.weaponType];
        ctx.beginPath();
        ctx.arc(0, 0, player.radius / 3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
    
    function renderProjectiles() {
        for (const proj of projectiles) {
            ctx.fillStyle = proj.color;
            ctx.beginPath();
            ctx.arc(proj.x, proj.y, proj.radius, 0, Math.PI * 2);
            ctx.fill();
            
            if (proj.type === 2) {
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(proj.x, proj.y, proj.radius + 3, 0, Math.PI * 2);
                ctx.stroke();
            }
        }
    }
    
    function renderEnemies() {
        for (const enemy of enemies) {
            ctx.fillStyle = enemy.color;
            ctx.beginPath();
            ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
            ctx.fill();
            
            if (enemy.type === 1) {
                ctx.strokeStyle = '#ffff00';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(enemy.x, enemy.y, enemy.radius - 5, 0, Math.PI * 2);
                ctx.stroke();
            } else if (enemy.type === 2) {
                const spikeCount = 8;
                const spikeLength = 8;
                
                ctx.strokeStyle = '#50ff50';
                ctx.lineWidth = 3;
                ctx.beginPath();
                
                for (let i = 0; i < spikeCount; i++) {
                    const angle = (Math.PI * 2 / spikeCount) * i;
                    const x1 = enemy.x + Math.cos(angle) * enemy.radius;
                    const y1 = enemy.y + Math.sin(angle) * enemy.radius;
                    const x2 = enemy.x + Math.cos(angle) * (enemy.radius + spikeLength);
                    const y2 = enemy.y + Math.sin(angle) * (enemy.radius + spikeLength);
                    
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x2, y2);
                }
                
                ctx.stroke();
            } else if (enemy.type === 3) {
                ctx.strokeStyle = '#ff00ff';
                ctx.lineWidth = 3;
                
                for (let i = 0; i < 3; i++) {
                    ctx.beginPath();
                    ctx.arc(enemy.x, enemy.y, enemy.radius - i * 10, 0, Math.PI * 2);
                    ctx.stroke();
                }
            }
        }
    }
    
    function renderParticles() {
        for (const particle of particles) {
            const alpha = particle.lifetime / particle.maxLifetime;
            ctx.fillStyle = particle.color;
            ctx.globalAlpha = alpha;
            
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.globalAlpha = 1;
    }
    
    function renderPowerups() {
        const glowIntensity = 0.5 + Math.sin(gameTime * 0.1) * 0.5;
        
        for (const powerup of powerups) {
            let color;
            let symbol;
            
            if (powerup.type === 0) {
                color = '#40e0ff';
                symbol = 'E';
            } else if (powerup.type === 1) {
                color = '#40ff40';
                symbol = 'H';
            } else {
                color = '#ff80ff';
                symbol = 'X';
            }
            
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(powerup.x, powerup.y, powerup.radius, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2 + glowIntensity * 2;
            ctx.beginPath();
            ctx.arc(powerup.x, powerup.y, powerup.radius + 3, 0, Math.PI * 2);
            ctx.stroke();
            
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(symbol, powerup.x, powerup.y);
        }
    }
    
    function renderWaveIndicator() {
        if (currentWave < waves.length) {
            const text = `Wave ${currentWave + 1}/${waves.length}`;
            
            ctx.fillStyle = '#ffffff';
            ctx.font = '18px Orbitron';
            ctx.textAlign = 'center';
            ctx.fillText(text, canvas.width / 2, 40);
        }
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
        
        document.getElementById('finalEnemies').innerText = enemiesDestroyed;
        document.getElementById('finalScore').innerText = score;
        document.getElementById('finalWaves').innerText = currentWave;
        
        document.getElementById('gameOverScreen').classList.remove('hidden');
        document.querySelector('.directional-controls').classList.add('hidden');
    }
    
    function victory() {
        gameRunning = false;
        
        document.getElementById('victoryHealth').innerText = `${Math.floor(planetHealth)}%`;
        document.getElementById('victoryEnergy').innerText = `${Math.floor(energy)}%`;
        document.getElementById('victoryScore').innerText = score;
        
        document.getElementById('victoryScreen').classList.remove('hidden');
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
    
    function changeWeapon(index) {
        if (index >= 0 && index <= 2) {
            player.weaponType = index;
            
            document.querySelectorAll('.weapon-btn').forEach((btn, i) => {
                if (i === index) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });
        }
    }
    
    const keys = {
        left: false,
        right: false,
        space: false
    };
    
    document.addEventListener('keydown', function(event) {
        if (event.key === 'ArrowLeft' || event.key === 'a') {
            keys.left = true;
        } else if (event.key === 'ArrowRight' || event.key === 'd') {
            keys.right = true;
        } else if (event.key === ' ') {
            keys.space = true;
            player.firing = true;
        } else if (event.key === 'p') {
            togglePause();
        } else if (event.key === 'm') {
            toggleMute();
        } else if (event.key === 'h') {
            toggleHelp();
        } else if (event.key === '1') {
            changeWeapon(0);
        } else if (event.key === '2') {
            changeWeapon(1);
        } else if (event.key === '3') {
            changeWeapon(2);
        }
    });
    
    document.addEventListener('keyup', function(event) {
        if (event.key === 'ArrowLeft' || event.key === 'a') {
            keys.left = false;
        } else if (event.key === 'ArrowRight' || event.key === 'd') {
            keys.right = false;
        } else if (event.key === ' ') {
            keys.space = false;
            player.firing = false;
        }
    });
    
    const leftBtn = document.getElementById('leftBtn');
    const rightBtn = document.getElementById('rightBtn');
    const fireBtn = document.getElementById('fireBtn');
    const weapon1Btn = document.getElementById('weapon1Btn');
    const weapon2Btn = document.getElementById('weapon2Btn');
    const weapon3Btn = document.getElementById('weapon3Btn');
    
    if (leftBtn && rightBtn && fireBtn) {
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
        
        fireBtn.addEventListener('touchstart', function() {
            player.firing = true;
        });
        fireBtn.addEventListener('touchend', function() {
            player.firing = false;
        });
    }
    
    if (weapon1Btn && weapon2Btn && weapon3Btn) {
        weapon1Btn.addEventListener('click', function() {
            changeWeapon(0);
        });
        
        weapon2Btn.addEventListener('click', function() {
            changeWeapon(1);
        });
        
        weapon3Btn.addEventListener('click', function() {
            changeWeapon(2);
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
        document.getElementById('victoryScreen').classList.add('hidden');
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
