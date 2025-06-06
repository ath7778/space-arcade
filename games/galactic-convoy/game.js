document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    const starsContainer = document.querySelector('.stars-container');
    if (starsContainer) {
        createStars(starsContainer, 100);
    }
    
    let gameRunning = false;
    let gamePaused = false;
    let score = 0;
    let shields = 100;
    let convoyShips = 5;
    let distance = 0;
    let distanceToDestination = 1000;
    let gameTime = 0;
    let gameStartTime = 0;
    
    const player = {
        x: canvas.width / 2,
        y: canvas.height - 100,
        width: 40,
        height: 60,
        speed: 5,
        color: '#00a9ff',
        firing: false,
        firingCooldown: 0
    };
    
    const convoy = [];
    const asteroids = [];
    const enemies = [];
    const projectiles = [];
    const enemyProjectiles = [];
    const explosions = [];
    
    function resizeCanvas() {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
        
        if (player) {
            player.x = Math.min(player.x, canvas.width - player.width);
            player.y = Math.min(player.y, canvas.height - player.height);
        }
        
        render();
    }
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    function updateStats() {
        document.getElementById('shieldsDisplay').innerText = `Shields: ${Math.floor(shields)}%`;
        document.getElementById('convoyDisplay').innerText = `Convoy: ${convoyShips}/5`;
        document.getElementById('scoreDisplay').innerText = `Score: ${score}`;
    }
    
    function createConvoy() {
        convoy.length = 0;
        const spacing = 80;
        
        for (let i = 0; i < 5; i++) {
            convoy.push({
                x: canvas.width / 2 - spacing * 2 + spacing * i,
                y: canvas.height - 180,
                width: 30,
                height: 45,
                speed: 2,
                color: '#50ff50',
                active: true
            });
        }
    }
    
    function createAsteroid() {
        const size = 15 + Math.random() * 30;
        
        asteroids.push({
            x: Math.random() * canvas.width,
            y: -size,
            radius: size,
            speedX: Math.random() * 2 - 1,
            speedY: 1 + Math.random() * 2,
            rotation: 0,
            rotationSpeed: Math.random() * 0.05,
            color: '#aaa'
        });
    }
    
    function createEnemy() {
        const x = Math.random() * (canvas.width - 40);
        
        enemies.push({
            x: x,
            y: -50,
            width: 40,
            height: 40,
            speedX: Math.random() * 2 - 1,
            speedY: 1 + Math.random() * 1.5,
            health: 3,
            color: '#ff5050',
            fireTimer: Math.random() * 60 + 60
        });
    }
    
    function createExplosion(x, y, size) {
        explosions.push({
            x: x,
            y: y,
            radius: size,
            maxRadius: size * 1.5,
            alpha: 1,
            decreaseRate: 0.03
        });
    }
    
    function fireLaser() {
        if (player.firingCooldown <= 0) {
            projectiles.push({
                x: player.x + player.width / 2 - 2,
                y: player.y,
                width: 4,
                height: 15,
                speed: 10,
                color: '#00ffff'
            });
            
            player.firingCooldown = 10;
        }
    }
    
    function startGame() {
        gameRunning = true;
        gamePaused = false;
        score = 0;
        shields = 100;
        convoyShips = 5;
        distance = 0;
        
        player.x = canvas.width / 2 - player.width / 2;
        player.y = canvas.height - 100;
        
        createConvoy();
        
        asteroids.length = 0;
        enemies.length = 0;
        projectiles.length = 0;
        enemyProjectiles.length = 0;
        explosions.length = 0;
        
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
        
        distance += 0.5;
        score += 1;
        
        if (distance >= distanceToDestination) {
            missionComplete();
            return;
        }
        
        if (Math.random() < 0.03) {
            createAsteroid();
        }
        
        if (Math.random() < 0.01) {
            createEnemy();
        }
        
        if (player.firingCooldown > 0) {
            player.firingCooldown--;
        }
        
        if (player.firing) {
            fireLaser();
        }
        
        if (keys.up && player.y > 0) {
            player.y -= player.speed;
        }
        
        if (keys.down && player.y < canvas.height - player.height) {
            player.y += player.speed;
        }
        
        if (keys.left && player.x > 0) {
            player.x -= player.speed;
        }
        
        if (keys.right && player.x < canvas.width - player.width) {
            player.x += player.speed;
        }
        
        updateProjectiles();
        updateAsteroids();
        updateEnemies();
        updateExplosions();
        updateConvoy();
        checkCollisions();
        
        updateStats();
    }
    
    function updateProjectiles() {
        for (let i = projectiles.length - 1; i >= 0; i--) {
            projectiles[i].y -= projectiles[i].speed;
            
            if (projectiles[i].y + projectiles[i].height < 0) {
                projectiles.splice(i, 1);
            }
        }
        
        for (let i = enemyProjectiles.length - 1; i >= 0; i--) {
            enemyProjectiles[i].y += enemyProjectiles[i].speed;
            
            if (enemyProjectiles[i].y > canvas.height) {
                enemyProjectiles.splice(i, 1);
            }
        }
    }
    
    function updateAsteroids() {
        for (let i = asteroids.length - 1; i >= 0; i--) {
            const asteroid = asteroids[i];
            
            asteroid.x += asteroid.speedX;
            asteroid.y += asteroid.speedY;
            asteroid.rotation += asteroid.rotationSpeed;
            
            if (asteroid.x < -asteroid.radius || 
                asteroid.x > canvas.width + asteroid.radius || 
                asteroid.y > canvas.height + asteroid.radius) {
                asteroids.splice(i, 1);
            }
        }
    }
    
    function updateEnemies() {
        for (let i = enemies.length - 1; i >= 0; i--) {
            const enemy = enemies[i];
            
            enemy.x += enemy.speedX;
            enemy.y += enemy.speedY;
            
            if (enemy.x < 0 || enemy.x > canvas.width - enemy.width) {
                enemy.speedX *= -1;
            }
            
            enemy.fireTimer--;
            
            if (enemy.fireTimer <= 0) {
                enemyProjectiles.push({
                    x: enemy.x + enemy.width / 2 - 2,
                    y: enemy.y + enemy.height,
                    width: 4,
                    height: 10,
                    speed: 6,
                    color: '#ff0000'
                });
                
                enemy.fireTimer = Math.random() * 100 + 100;
            }
            
            if (enemy.y > canvas.height) {
                enemies.splice(i, 1);
            }
        }
    }
    
    function updateExplosions() {
        for (let i = explosions.length - 1; i >= 0; i--) {
            const explosion = explosions[i];
            
            explosion.radius += 2;
            explosion.alpha -= explosion.decreaseRate;
            
            if (explosion.alpha <= 0 || explosion.radius >= explosion.maxRadius) {
                explosions.splice(i, 1);
            }
        }
    }
    
    function updateConvoy() {
        let activeCount = 0;
        
        for (const ship of convoy) {
            if (ship.active) {
                activeCount++;
                
                const dx = player.x + player.width / 2 - (ship.x + ship.width / 2);
                const targetX = ship.x + Math.sign(dx) * Math.min(Math.abs(dx) * 0.05, ship.speed);
                
                ship.x = targetX;
            }
        }
        
        convoyShips = activeCount;
        
        if (convoyShips === 0) {
            gameOver();
        }
    }
    
    function checkCollisions() {
        for (let i = projectiles.length - 1; i >= 0; i--) {
            const projectile = projectiles[i];
            
            for (let j = asteroids.length - 1; j >= 0; j--) {
                const asteroid = asteroids[j];
                
                if (circleRectCollision(
                    asteroid.x, asteroid.y, asteroid.radius,
                    projectile.x, projectile.y, projectile.width, projectile.height
                )) {
                    createExplosion(asteroid.x, asteroid.y, asteroid.radius);
                    asteroids.splice(j, 1);
                    projectiles.splice(i, 1);
                    score += 10;
                    break;
                }
            }
            
            if (i >= projectiles.length) continue;
            
            for (let j = enemies.length - 1; j >= 0; j--) {
                const enemy = enemies[j];
                
                if (rectCollision(
                    projectile.x, projectile.y, projectile.width, projectile.height,
                    enemy.x, enemy.y, enemy.width, enemy.height
                )) {
                    enemy.health--;
                    
                    if (enemy.health <= 0) {
                        createExplosion(enemy.x + enemy.width/2, enemy.y + enemy.height/2, 30);
                        enemies.splice(j, 1);
                        score += 50;
                    }
                    
                    projectiles.splice(i, 1);
                    break;
                }
            }
        }
        
        for (let i = enemyProjectiles.length - 1; i >= 0; i--) {
            const projectile = enemyProjectiles[i];
            
            if (rectCollision(
                projectile.x, projectile.y, projectile.width, projectile.height,
                player.x, player.y, player.width, player.height
            )) {
                shields -= 10;
                enemyProjectiles.splice(i, 1);
                
                if (shields <= 0) {
                    shields = 0;
                    createExplosion(player.x + player.width/2, player.y + player.height/2, 40);
                    gameOver();
                    return;
                }
            }
            
            for (let j = convoy.length - 1; j >= 0; j--) {
                const ship = convoy[j];
                
                if (ship.active && rectCollision(
                    projectile.x, projectile.y, projectile.width, projectile.height,
                    ship.x, ship.y, ship.width, ship.height
                )) {
                    createExplosion(ship.x + ship.width/2, ship.y + ship.height/2, 20);
                    ship.active = false;
                    enemyProjectiles.splice(i, 1);
                    break;
                }
            }
        }
        
        for (let i = asteroids.length - 1; i >= 0; i--) {
            const asteroid = asteroids[i];
            
            if (circleRectCollision(
                asteroid.x, asteroid.y, asteroid.radius,
                player.x, player.y, player.width, player.height
            )) {
                createExplosion(asteroid.x, asteroid.y, asteroid.radius);
                asteroids.splice(i, 1);
                
                shields -= 15;
                if (shields <= 0) {
                    shields = 0;
                    createExplosion(player.x + player.width/2, player.y + player.height/2, 40);
                    gameOver();
                    return;
                }
            }
            
            for (let j = convoy.length - 1; j >= 0; j--) {
                const ship = convoy[j];
                
                if (ship.active && circleRectCollision(
                    asteroid.x, asteroid.y, asteroid.radius,
                    ship.x, ship.y, ship.width, ship.height
                )) {
                    createExplosion(ship.x + ship.width/2, ship.y + ship.height/2, 20);
                    ship.active = false;
                    asteroids.splice(i, 1);
                    break;
                }
            }
        }
        
        for (let i = enemies.length - 1; i >= 0; i--) {
            const enemy = enemies[i];
            
            if (rectCollision(
                enemy.x, enemy.y, enemy.width, enemy.height,
                player.x, player.y, player.width, player.height
            )) {
                createExplosion(enemy.x + enemy.width/2, enemy.y + enemy.height/2, 30);
                enemies.splice(i, 1);
                
                shields -= 25;
                if (shields <= 0) {
                    shields = 0;
                    createExplosion(player.x + player.width/2, player.y + player.height/2, 40);
                    gameOver();
                    return;
                }
            }
            
            for (let j = convoy.length - 1; j >= 0; j--) {
                const ship = convoy[j];
                
                if (ship.active && rectCollision(
                    enemy.x, enemy.y, enemy.width, enemy.height,
                    ship.x, ship.y, ship.width, ship.height
                )) {
                    createExplosion(enemy.x + enemy.width/2, enemy.y + enemy.height/2, 30);
                    createExplosion(ship.x + ship.width/2, ship.y + ship.height/2, 20);
                    ship.active = false;
                    enemies.splice(i, 1);
                    break;
                }
            }
        }
    }
    
    function render() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#0a0a2a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        renderProgressBar();
        
        for (const projectile of projectiles) {
            ctx.fillStyle = projectile.color;
            ctx.fillRect(projectile.x, projectile.y, projectile.width, projectile.height);
        }
        
        for (const projectile of enemyProjectiles) {
            ctx.fillStyle = projectile.color;
            ctx.fillRect(projectile.x, projectile.y, projectile.width, projectile.height);
        }
        
        for (const asteroid of asteroids) {
            ctx.save();
            ctx.translate(asteroid.x, asteroid.y);
            ctx.rotate(asteroid.rotation);
            ctx.fillStyle = asteroid.color;
            ctx.beginPath();
            
            const vertices = 7;
            for (let i = 0; i < vertices; i++) {
                const angle = (Math.PI * 2 / vertices) * i;
                const radius = asteroid.radius * (0.8 + Math.sin(i * 5) * 0.2);
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;
                
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }
        
        for (const enemy of enemies) {
            ctx.fillStyle = enemy.color;
            ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
            
            const wingWidth = enemy.width * 0.7;
            const wingHeight = enemy.height * 0.4;
            
            ctx.beginPath();
            ctx.moveTo(enemy.x, enemy.y + enemy.height * 0.3);
            ctx.lineTo(enemy.x - wingWidth, enemy.y + enemy.height * 0.5);
            ctx.lineTo(enemy.x, enemy.y + enemy.height * 0.7);
            ctx.closePath();
            ctx.fill();
            
            ctx.beginPath();
            ctx.moveTo(enemy.x + enemy.width, enemy.y + enemy.height * 0.3);
            ctx.lineTo(enemy.x + enemy.width + wingWidth, enemy.y + enemy.height * 0.5);
            ctx.lineTo(enemy.x + enemy.width, enemy.y + enemy.height * 0.7);
            ctx.closePath();
            ctx.fill();
        }
        
        for (const ship of convoy) {
            if (ship.active) {
                ctx.fillStyle = ship.color;
                ctx.fillRect(ship.x, ship.y, ship.width, ship.height);
                
                ctx.beginPath();
                ctx.moveTo(ship.x + ship.width / 2, ship.y);
                ctx.lineTo(ship.x, ship.y + ship.height);
                ctx.lineTo(ship.x + ship.width, ship.y + ship.height);
                ctx.closePath();
                ctx.fill();
            }
        }
        
        ctx.fillStyle = player.color;
        ctx.fillRect(player.x, player.y, player.width, player.height);
        
        ctx.beginPath();
        ctx.moveTo(player.x, player.y);
        ctx.lineTo(player.x - player.width * 0.3, player.y + player.height * 0.7);
        ctx.lineTo(player.x, player.y + player.height * 0.5);
        ctx.closePath();
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(player.x + player.width, player.y);
        ctx.lineTo(player.x + player.width * 1.3, player.y + player.height * 0.7);
        ctx.lineTo(player.x + player.width, player.y + player.height * 0.5);
        ctx.closePath();
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(player.x + player.width * 0.2, player.y + player.height);
        ctx.lineTo(player.x + player.width * 0.5, player.y + player.height * 1.2);
        ctx.lineTo(player.x + player.width * 0.8, player.y + player.height);
        ctx.closePath();
        ctx.fill();
        
        for (const explosion of explosions) {
            const gradient = ctx.createRadialGradient(
                explosion.x, explosion.y, 0,
                explosion.x, explosion.y, explosion.radius
            );
            
            gradient.addColorStop(0, `rgba(255, 200, 50, ${explosion.alpha})`);
            gradient.addColorStop(0.5, `rgba(255, 50, 0, ${explosion.alpha * 0.8})`);
            gradient.addColorStop(1, `rgba(100, 0, 0, 0)`);
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(explosion.x, explosion.y, explosion.radius, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    function renderProgressBar() {
        const barWidth = canvas.width * 0.8;
        const barHeight = 10;
        const barX = (canvas.width - barWidth) / 2;
        const barY = 20;
        const progress = Math.min(1, distance / distanceToDestination);
        
        ctx.fillStyle = 'rgba(20, 40, 80, 0.6)';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        ctx.fillStyle = '#40a0ff';
        ctx.fillRect(barX, barY, barWidth * progress, barHeight);
        
        ctx.strokeStyle = '#80c0ff';
        ctx.lineWidth = 2;
        ctx.strokeRect(barX, barY, barWidth, barHeight);
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
        
        document.getElementById('finalScore').innerText = score;
        document.getElementById('finalConvoy').innerText = `${convoyShips}/5`;
        document.getElementById('finalDistance').innerText = `${Math.floor(distance)} ly`;
        
        document.getElementById('gameOverScreen').classList.remove('hidden');
        document.querySelector('.directional-controls').classList.add('hidden');
    }
    
    function missionComplete() {
        gameRunning = false;
        
        score += convoyShips * 100 + shields;
        
        document.getElementById('successScore').innerText = score;
        document.getElementById('successConvoy').innerText = `${convoyShips}/5`;
        document.getElementById('successShields').innerText = `${Math.floor(shields)}%`;
        
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
    
    function circleRectCollision(circleX, circleY, radius, rectX, rectY, rectWidth, rectHeight) {
        const closestX = Math.max(rectX, Math.min(circleX, rectX + rectWidth));
        const closestY = Math.max(rectY, Math.min(circleY, rectY + rectHeight));
        
        const distanceX = circleX - closestX;
        const distanceY = circleY - closestY;
        
        return (distanceX * distanceX + distanceY * distanceY) < (radius * radius);
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
            player.firing = true;
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
            player.firing = false;
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
            player.firing = true;
        });
        actionBtn.addEventListener('touchend', function() {
            player.firing = false;
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
