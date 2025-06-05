

document.addEventListener('DOMContentLoaded', function() {

    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    

    function resizeCanvas() {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
    }
    

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    

    let gameState = {
        isRunning: false,
        isPaused: false,
        isMuted: false,
        score: 0,
        wave: 1,
        health: 100,
        ammo: 50,
        enemiesDestroyed: 0,
        currentWeapon: 'laser',
        energy: 100,
        asteroids: [],
        enemies: [],
        projectiles: [],
        particles: [],
        powerUps: [],
        stars: [],
        lastFireTime: 0,
        shieldActive: false,
        shieldEnergy: 0
    };
    
    // Player ship properties
    const player = {
        x: 0,
        y: 0,
        radius: 15,
        angle: 0, // Facing direction in radians
        rotationSpeed: 0.05,
        thrust: 0,
        velocity: { x: 0, y: 0 },
        maxSpeed: 5,
        friction: 0.98,
        isThrusting: false,
        isBraking: false,
        invulnerable: false,
        invulnerabilityTimer: 0,
        lives: 3
    };
    
    // Weapon definitions
    const weapons = {
        laser: {
            damage: 10,
            speed: 10,
            cooldown: 200, // ms
            ammoUsage: 1,
            color: '#ff5a5a',
            size: 3,
            sound: new Audio()
        },
        missile: {
            damage: 50,
            speed: 5,
            cooldown: 1000, // ms
            ammoUsage: 5,
            color: '#ffc75a',
            size: 5,
            explosionRadius: 100,
            sound: new Audio()
        },
        shield: {
            duration: 5000, // ms
            energyUsage: 50, // percent
            color: 'rgba(90, 179, 255, 0.5)',
            sound: new Audio()
        }
    };
    
    // Sound placeholders - would be replaced with actual sound files
    weapons.laser.sound.src = '';
    weapons.missile.sound.src = '';
    weapons.shield.sound.src = '';
    
    // Other audio elements
    const sounds = {
        explosion: new Audio(),
        hit: new Audio(),
        powerUp: new Audio(),
        engineThrust: new Audio(),
        warning: new Audio(),
        music: new Audio()
    };
    
    // Input state
    const keys = {
        w: false,
        a: false,
        s: false,
        d: false,
        ArrowUp: false,
        ArrowDown: false,
        ArrowLeft: false,
        ArrowRight: false,
        ' ': false, // Space
        '1': false,
        '2': false,
        '3': false,
        Escape: false
    };
    
    // Mouse state
    const mouse = {
        x: 0,
        y: 0,
        isDown: false
    };
    
    // Event listeners for game controls
    document.addEventListener('keydown', function(e) {
        if (e.key in keys) {
            keys[e.key] = true;
            
            // Weapon switching
            if (e.key === '1') {
                switchWeapon('laser');
            } else if (e.key === '2') {
                switchWeapon('missile');
            } else if (e.key === '3') {
                switchWeapon('shield');
            }
            
            // Pause
            if (e.key === 'Escape' && gameState.isRunning) {
                togglePause();
            }
        }
    });
    
    document.addEventListener('keyup', function(e) {
        if (e.key in keys) {
            keys[e.key] = false;
        }
    });
    
    // Mouse controls
    canvas.addEventListener('mousedown', function(e) {
        mouse.isDown = true;
    });
    
    canvas.addEventListener('mouseup', function(e) {
        mouse.isDown = false;
    });
    
    canvas.addEventListener('mousemove', function(e) {
        const rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
    });
    
    // Button event listeners
    document.getElementById('startGameBtn').addEventListener('click', startGame);
    document.getElementById('restartGameBtn').addEventListener('click', startGame);
    document.getElementById('pauseBtn').addEventListener('click', togglePause);
    document.getElementById('muteBtn').addEventListener('click', toggleMute);
    document.getElementById('helpBtn').addEventListener('click', showHelp);
    
    // Weapon selection
    const weaponElements = document.querySelectorAll('.weapon');
    weaponElements.forEach(weaponEl => {
        weaponEl.addEventListener('click', function() {
            const weapon = this.getAttribute('data-weapon');
            switchWeapon(weapon);
        });
    });
    
    // Modal event listeners
    document.querySelector('.close-modal').addEventListener('click', closeModal);
    
    
    function startGame() {
        // Reset game state
        gameState = {
            isRunning: true,
            isPaused: false,
            isMuted: gameState.isMuted,
            score: 0,
            wave: 1,
            health: 100,
            ammo: 50,
            enemiesDestroyed: 0,
            currentWeapon: 'laser',
            energy: 100,
            asteroids: [],
            enemies: [],
            projectiles: [],
            particles: [],
            powerUps: [],
            stars: [],
            lastFireTime: 0,
            shieldActive: false,
            shieldEnergy: 0
        };
        
        // Reset player
        player.x = canvas.width / 2;
        player.y = canvas.height / 2;
        player.velocity = { x: 0, y: 0 };
        player.angle = 0;
        player.thrust = 0;
        player.invulnerable = true;
        player.invulnerabilityTimer = 3000; // 3 seconds invulnerability at start
        player.lives = 3;
        
        // Hide start/end screens
        document.getElementById('gameStartScreen').classList.add('hidden');
        document.getElementById('gameOverScreen').classList.add('hidden');
        document.getElementById('levelCompleteScreen').classList.add('hidden');
        
        // Update UI
        updateStats();
        updateWeaponUI();
        updateEnergyBar();
        
        // Generate stars for background
        generateStars();
        
        // Generate initial wave of asteroids and enemies
        generateWave();
        
        // Start game loop
        if (!gameState.isMuted) {
            sounds.music.loop = true;
            sounds.music.play();
        }
        
        requestAnimationFrame(gameLoop);
    }
    
    function generateStars() {
        const starCount = 200;
        gameState.stars = [];
        
        for (let i = 0; i < starCount; i++) {
            gameState.stars.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: Math.random() * 2 + 1,
                brightness: Math.random() * 0.8 + 0.2,
                speed: Math.random() * 0.5 + 0.1
            });
        }
    }
    
    function generateWave() {
        // Generate asteroids
        const asteroidCount = 5 + gameState.wave * 2;
        
        for (let i = 0; i < asteroidCount; i++) {
            // Ensure asteroids are not generated too close to the player
            let x, y;
            do {
                x = Math.random() * canvas.width;
                y = Math.random() * canvas.height;
            } while (Math.sqrt(Math.pow(x - player.x, 2) + Math.pow(y - player.y, 2)) < 150);
            
            gameState.asteroids.push({
                x: x,
                y: y,
                radius: Math.random() * 20 + 20,
                velocity: {
                    x: (Math.random() - 0.5) * 2,
                    y: (Math.random() - 0.5) * 2
                },
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.02,
                health: 30 + gameState.wave * 10,
                vertices: Math.floor(Math.random() * 3) + 5
            });
        }
        
        // Generate enemies
        const enemyCount = Math.min(3 + Math.floor(gameState.wave / 2), 10);
        
        for (let i = 0; i < enemyCount; i++) {
            // Ensure enemies are not generated too close to the player
            let x, y;
            do {
                x = Math.random() * canvas.width;
                y = Math.random() * canvas.height;
            } while (Math.sqrt(Math.pow(x - player.x, 2) + Math.pow(y - player.y, 2)) < 200);
            
            gameState.enemies.push({
                x: x,
                y: y,
                radius: 15,
                velocity: {
                    x: (Math.random() - 0.5) * 1.5,
                    y: (Math.random() - 0.5) * 1.5
                },
                angle: Math.random() * Math.PI * 2,
                rotationSpeed: 0.03,
                health: 30 + gameState.wave * 5,
                fireRate: 2000 - gameState.wave * 100, // ms between shots
                lastFire: 0,
                type: Math.random() < 0.7 ? 'fighter' : 'bomber'
            });
        }
    }
    
    
    function switchWeapon(weapon) {
        gameState.currentWeapon = weapon;
        
        // Update UI
        weaponElements.forEach(el => {
            if (el.getAttribute('data-weapon') === weapon) {
                el.classList.add('active');
            } else {
                el.classList.remove('active');
            }
        });
    }
    
    function fireWeapon() {
        const now = Date.now();
        const weapon = weapons[gameState.currentWeapon];
        
        // Check cooldown and ammo
        if (now - gameState.lastFireTime < weapon.cooldown) return;
        
        if (gameState.currentWeapon === 'shield') {
            // Activate shield
            if (gameState.energy >= weapon.energyUsage && !gameState.shieldActive) {
                gameState.shieldActive = true;
                gameState.shieldEnergy = weapon.duration;
                gameState.energy -= weapon.energyUsage;
                updateEnergyBar();
                
                if (!gameState.isMuted) {
                    weapon.sound.play();
                }
            }
        } else {
            // Fire projectile
            if (gameState.ammo >= weapon.ammoUsage) {
                gameState.ammo -= weapon.ammoUsage;
                gameState.lastFireTime = now;
                
                const projectile = {
                    x: player.x + Math.cos(player.angle) * (player.radius + 5),
                    y: player.y + Math.sin(player.angle) * (player.radius + 5),
                    radius: weapon.size,
                    velocity: {
                        x: Math.cos(player.angle) * weapon.speed,
                        y: Math.sin(player.angle) * weapon.speed
                    },
                    color: weapon.color,
                    type: gameState.currentWeapon,
                    damage: weapon.damage,
                    lifetime: gameState.currentWeapon === 'missile' ? 3000 : 2000,
                    birth: now
                };
                
                gameState.projectiles.push(projectile);
                
                if (!gameState.isMuted) {
                    weapon.sound.play();
                }
                
                updateStats();
            }
        }
    }
    
    
    function updateStats() {
        document.getElementById('score').textContent = gameState.score;
        document.getElementById('wave').textContent = gameState.wave;
        document.getElementById('health').textContent = Math.max(0, Math.floor(gameState.health));
        document.getElementById('ammo').textContent = gameState.ammo;
        document.getElementById('finalScore').textContent = gameState.score;
        document.getElementById('enemiesDestroyed').textContent = gameState.enemiesDestroyed;
        document.getElementById('newWave').textContent = gameState.wave + 1;
    }
    
    function updateWeaponUI() {
        weaponElements.forEach(el => {
            if (el.getAttribute('data-weapon') === gameState.currentWeapon) {
                el.classList.add('active');
            } else {
                el.classList.remove('active');
            }
        });
    }
    
    function updateEnergyBar() {
        const energyFill = document.querySelector('.energy-fill');
        energyFill.style.width = gameState.energy + '%';
    }
    
    function togglePause() {
        gameState.isPaused = !gameState.isPaused;
        
        if (gameState.isPaused) {
            // Pause background music
            if (sounds.music.play) {
                sounds.music.pause();
            }
        } else {
            // Resume background music if not muted
            if (!gameState.isMuted && sounds.music.pause) {
                sounds.music.play();
            }
            requestAnimationFrame(gameLoop);
        }
    }
    
    function toggleMute() {
        gameState.isMuted = !gameState.isMuted;
        
        const muteBtn = document.getElementById('muteBtn');
        muteBtn.innerHTML = gameState.isMuted ? 
            '<i class="fas fa-volume-mute"></i> Muted' : 
            '<i class="fas fa-volume-up"></i> Sound';
        
        // Mute/unmute all sounds
        for (let sound in sounds) {
            if (gameState.isMuted) {
                sounds[sound].pause();
                sounds[sound].currentTime = 0;
            } else if (sound === 'music' && gameState.isRunning && !gameState.isPaused) {
                sounds[sound].play();
            }
        }
    }
    
    function showHelp() {
        document.getElementById('helpModal').classList.remove('hidden');
    }
    
    function closeModal() {
        document.getElementById('helpModal').classList.add('hidden');
    }
    

    
    
    function gameLoop() {
        if (!gameState.isRunning || gameState.isPaused) return;
        
        update();
        render();
        
        requestAnimationFrame(gameLoop);
    }
    
    
    function update() {
        const now = Date.now();
        
        
        updatePlayer();
        
        // Update shield
        if (gameState.shieldActive) {
            gameState.shieldEnergy -= 16; // Drain shield energy
            if (gameState.shieldEnergy <= 0) {
                gameState.shieldActive = false;
            }
        }
        
        // Regenerate energy
        if (gameState.energy < 100 && !gameState.shieldActive) {
            gameState.energy += 0.1;
            if (gameState.energy > 100) gameState.energy = 100;
            updateEnergyBar();
        }
        
        // Update invulnerability timer
        if (player.invulnerable) {
            player.invulnerabilityTimer -= 16; // Assuming 60fps
            if (player.invulnerabilityTimer <= 0) {
                player.invulnerable = false;
            }
        }
        
        // Update projectiles
        for (let i = gameState.projectiles.length - 1; i >= 0; i--) {
            const projectile = gameState.projectiles[i];
            
            // Move projectile
            projectile.x += projectile.velocity.x;
            projectile.y += projectile.velocity.y;
            
            // Check if projectile is off-screen or expired
            if (projectile.x < 0 || projectile.x > canvas.width || 
                projectile.y < 0 || projectile.y > canvas.height || 
                now - projectile.birth > projectile.lifetime) {
                
                // Create explosion for missiles
                if (projectile.type === 'missile') {
                    createExplosion(projectile.x, projectile.y, 10, 20, '#ffc75a');
                }
                
                // Remove projectile
                gameState.projectiles.splice(i, 1);
                continue;
            }
            
            // Check for collisions with asteroids
            for (let j = gameState.asteroids.length - 1; j >= 0; j--) {
                const asteroid = gameState.asteroids[j];
                const dx = projectile.x - asteroid.x;
                const dy = projectile.y - asteroid.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < projectile.radius + asteroid.radius) {
                    // Damage asteroid
                    asteroid.health -= projectile.damage;
                    
                    // Create impact particles
                    createParticles(projectile.x, projectile.y, 5, projectile.color);
                    
                    // Check if asteroid is destroyed
                    if (asteroid.health <= 0) {
                        // Add score
                        gameState.score += Math.floor(asteroid.radius);
                        
                        // Create explosion
                        createExplosion(asteroid.x, asteroid.y, 10, asteroid.radius * 1.5, '#aaaaaa');
                        
                        // Create smaller asteroids if large enough
                        if (asteroid.radius > 30) {
                            for (let k = 0; k < 2; k++) {
                                gameState.asteroids.push({
                                    x: asteroid.x,
                                    y: asteroid.y,
                                    radius: asteroid.radius * 0.6,
                                    velocity: {
                                        x: (Math.random() - 0.5) * 3,
                                        y: (Math.random() - 0.5) * 3
                                    },
                                    rotation: Math.random() * Math.PI * 2,
                                    rotationSpeed: (Math.random() - 0.5) * 0.04,
                                    health: asteroid.health * 0.6,
                                    vertices: asteroid.vertices
                                });
                            }
                        } else {
                            // Chance to spawn power-up
                            if (Math.random() < 0.2) {
                                spawnPowerUp(asteroid.x, asteroid.y);
                            }
                        }
                        
                        // Remove asteroid
                        gameState.asteroids.splice(j, 1);
                    }
                    
                    // Remove projectile (unless it's a missile with area effect)
                    if (projectile.type === 'missile') {
                        // Create explosion
                        createExplosion(projectile.x, projectile.y, 15, 50, '#ffc75a');
                        
                        // Damage nearby asteroids and enemies
                        const explosionRadius = weapons.missile.explosionRadius;
                        
                        // Check asteroids in explosion radius
                        for (let k = gameState.asteroids.length - 1; k >= 0; k--) {
                            if (k === j) continue; // Skip the already hit asteroid
                            
                            const otherAsteroid = gameState.asteroids[k];
                            const dx2 = projectile.x - otherAsteroid.x;
                            const dy2 = projectile.y - otherAsteroid.y;
                            const distance2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
                            
                            if (distance2 < explosionRadius + otherAsteroid.radius) {
                                // Calculate damage based on distance (more damage closer to center)
                                const damage = weapons.missile.damage * (1 - distance2 / explosionRadius);
                                otherAsteroid.health -= damage;
                                
                                // Check if asteroid is destroyed
                                if (otherAsteroid.health <= 0) {
                                    // Add score
                                    gameState.score += Math.floor(otherAsteroid.radius);
                                    
                                    // Create explosion
                                    createExplosion(otherAsteroid.x, otherAsteroid.y, 5, otherAsteroid.radius, '#aaaaaa');
                                    
                                    // Remove asteroid
                                    gameState.asteroids.splice(k, 1);
                                }
                            }
                        }
                    }
                    
                    // Always remove the projectile that hit
                    gameState.projectiles.splice(i, 1);
                    break;
                }
            }
            
            // If projectile was removed, skip enemy collision check
            if (i >= gameState.projectiles.length) continue;
            
            // Check for collisions with enemies
            for (let j = gameState.enemies.length - 1; j >= 0; j--) {
                const enemy = gameState.enemies[j];
                const dx = projectile.x - enemy.x;
                const dy = projectile.y - enemy.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < projectile.radius + enemy.radius) {
                    // Damage enemy
                    enemy.health -= projectile.damage;
                    
                    // Create impact particles
                    createParticles(projectile.x, projectile.y, 5, projectile.color);
                    
                    // Check if enemy is destroyed
                    if (enemy.health <= 0) {
                        // Add score
                        gameState.score += enemy.type === 'fighter' ? 100 : 200;
                        gameState.enemiesDestroyed++;
                        
                        // Create explosion
                        createExplosion(enemy.x, enemy.y, 20, 40, '#ff5a5a');
                        
                        // Chance to spawn power-up
                        if (Math.random() < 0.4) {
                            spawnPowerUp(enemy.x, enemy.y);
                        }
                        
                        // Remove enemy
                        gameState.enemies.splice(j, 1);
                    }
                    
                    // Area effect for missiles
                    if (projectile.type === 'missile') {
                        // Create explosion
                        createExplosion(projectile.x, projectile.y, 15, 50, '#ffc75a');
                        
                        // Damage nearby enemies
                        const explosionRadius = weapons.missile.explosionRadius;
                        
                        for (let k = gameState.enemies.length - 1; k >= 0; k--) {
                            if (k === j) continue; // Skip the already hit enemy
                            
                            const otherEnemy = gameState.enemies[k];
                            const dx2 = projectile.x - otherEnemy.x;
                            const dy2 = projectile.y - otherEnemy.y;
                            const distance2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
                            
                            if (distance2 < explosionRadius + otherEnemy.radius) {
                                // Calculate damage based on distance
                                const damage = weapons.missile.damage * (1 - distance2 / explosionRadius);
                                otherEnemy.health -= damage;
                                
                                // Check if enemy is destroyed
                                if (otherEnemy.health <= 0) {
                                    // Add score
                                    gameState.score += otherEnemy.type === 'fighter' ? 100 : 200;
                                    gameState.enemiesDestroyed++;
                                    
                                    // Create explosion
                                    createExplosion(otherEnemy.x, otherEnemy.y, 10, 30, '#ff5a5a');
                                    
                                    // Remove enemy
                                    gameState.enemies.splice(k, 1);
                                }
                            }
                        }
                    }
                    
                    // Remove projectile
                    gameState.projectiles.splice(i, 1);
                    break;
                }
            }
        }
        
        // Update asteroids
        for (let i = gameState.asteroids.length - 1; i >= 0; i--) {
            const asteroid = gameState.asteroids[i];
            
            // Move asteroid
            asteroid.x += asteroid.velocity.x;
            asteroid.y += asteroid.velocity.y;
            
            // Rotate asteroid
            asteroid.rotation += asteroid.rotationSpeed;
            
            // Wrap around screen
            if (asteroid.x < -asteroid.radius) asteroid.x = canvas.width + asteroid.radius;
            if (asteroid.x > canvas.width + asteroid.radius) asteroid.x = -asteroid.radius;
            if (asteroid.y < -asteroid.radius) asteroid.y = canvas.height + asteroid.radius;
            if (asteroid.y > canvas.height + asteroid.radius) asteroid.y = -asteroid.radius;
            
            // Check for collision with player
            if (!player.invulnerable && !gameState.shieldActive) {
                const dx = player.x - asteroid.x;
                const dy = player.y - asteroid.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < player.radius + asteroid.radius) {
                    // Damage player
                    gameState.health -= 10 + asteroid.radius * 0.5;
                    
                    // Create impact particles
                    createParticles(player.x, player.y, 10, '#ffffff');
                    
                    // Make player temporarily invulnerable
                    player.invulnerable = true;
                    player.invulnerabilityTimer = 1500; // 1.5 seconds
                    
                    // Update stats
                    updateStats();
                    
                    
                    checkGameOver();
                }
            }
        }
        
        // Update enemies
        for (let i = gameState.enemies.length - 1; i >= 0; i--) {
            const enemy = gameState.enemies[i];
            const now = Date.now();
            
            // Calculate direction to player
            const dx = player.x - enemy.x;
            const dy = player.y - enemy.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Gradually adjust angle to face player
            const targetAngle = Math.atan2(dy, dx);
            let angleDiff = targetAngle - enemy.angle;
            
            // Normalize angle difference
            if (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            if (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
            
            // Adjust angle gradually
            enemy.angle += angleDiff * 0.05;
            
            // Move enemy based on type
            if (enemy.type === 'fighter') {
                // Fighters try to maintain some distance from player
                if (distance > 200) {
                    // Move toward player
                    enemy.velocity.x = Math.cos(enemy.angle) * 2;
                    enemy.velocity.y = Math.sin(enemy.angle) * 2;
                } else if (distance < 150) {
                    // Move away from player
                    enemy.velocity.x = -Math.cos(enemy.angle) * 1.5;
                    enemy.velocity.y = -Math.sin(enemy.angle) * 1.5;
                } else {
                    // Orbit around player
                    const perpAngle = enemy.angle + Math.PI / 2;
                    enemy.velocity.x = Math.cos(perpAngle) * 2;
                    enemy.velocity.y = Math.sin(perpAngle) * 2;
                }
            } else { // Bomber
                // Bombers move slower but more directly toward the player
                enemy.velocity.x = Math.cos(enemy.angle) * 1.2;
                enemy.velocity.y = Math.sin(enemy.angle) * 1.2;
            }
            
            // Apply velocity
            enemy.x += enemy.velocity.x;
            enemy.y += enemy.velocity.y;
            
            // Wrap around screen
            if (enemy.x < -enemy.radius) enemy.x = canvas.width + enemy.radius;
            if (enemy.x > canvas.width + enemy.radius) enemy.x = -enemy.radius;
            if (enemy.y < -enemy.radius) enemy.y = canvas.height + enemy.radius;
            if (enemy.y > canvas.height + enemy.radius) enemy.y = -enemy.radius;
            
            // Fire at player
            if (now - enemy.lastFire > enemy.fireRate && distance < 400) {
                enemy.lastFire = now;
                
                // Different projectile based on enemy type
                const projectileSpeed = enemy.type === 'fighter' ? 8 : 5;
                const projectileColor = enemy.type === 'fighter' ? '#ff5a5a' : '#ffc75a';
                const projectileSize = enemy.type === 'fighter' ? 3 : 5;
                const projectileDamage = enemy.type === 'fighter' ? 5 : 15;
                
                // Create projectile
                gameState.projectiles.push({
                    x: enemy.x + Math.cos(enemy.angle) * (enemy.radius + 5),
                    y: enemy.y + Math.sin(enemy.angle) * (enemy.radius + 5),
                    radius: projectileSize,
                    velocity: {
                        x: Math.cos(enemy.angle) * projectileSpeed,
                        y: Math.sin(enemy.angle) * projectileSpeed
                    },
                    color: projectileColor,
                    type: 'enemy',
                    damage: projectileDamage,
                    lifetime: 2000,
                    birth: now
                });
            }
            
            // Check for collision with player
            if (!player.invulnerable && !gameState.shieldActive) {
                const dx = player.x - enemy.x;
                const dy = player.y - enemy.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < player.radius + enemy.radius) {
                    // Damage player
                    gameState.health -= 20;
                    
                    // Create impact particles
                    createParticles(player.x, player.y, 15, '#ff5a5a');
                    
                    // Make player temporarily invulnerable
                    player.invulnerable = true;
                    player.invulnerabilityTimer = 1500; // 1.5 seconds
                    
                    // Damage enemy
                    enemy.health -= 30;
                    
                    // Check if enemy is destroyed
                    if (enemy.health <= 0) {
                        // Add score
                        gameState.score += enemy.type === 'fighter' ? 100 : 200;
                        gameState.enemiesDestroyed++;
                        
                        // Create explosion
                        createExplosion(enemy.x, enemy.y, 20, 40, '#ff5a5a');
                        
                        // Remove enemy
                        gameState.enemies.splice(i, 1);
                    }
                    
                    // Update stats
                    updateStats();
                    
                    
                    checkGameOver();
                }
            }
        }
        
        // Update power-ups
        for (let i = gameState.powerUps.length - 1; i >= 0; i--) {
            const powerUp = gameState.powerUps[i];
            
            // Move power-up
            powerUp.x += powerUp.velocity.x;
            powerUp.y += powerUp.velocity.y;
            
            // Apply friction
            powerUp.velocity.x *= 0.98;
            powerUp.velocity.y *= 0.98;
            
            // Rotate power-up
            powerUp.rotation += powerUp.rotationSpeed;
            
            // Wrap around screen
            if (powerUp.x < -powerUp.radius) powerUp.x = canvas.width + powerUp.radius;
            if (powerUp.x > canvas.width + powerUp.radius) powerUp.x = -powerUp.radius;
            if (powerUp.y < -powerUp.radius) powerUp.y = canvas.height + powerUp.radius;
            if (powerUp.y > canvas.height + powerUp.radius) powerUp.y = -powerUp.radius;
            
            // Check for collision with player
            const dx = player.x - powerUp.x;
            const dy = player.y - powerUp.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < player.radius + powerUp.radius) {
                // Apply power-up effect
                switch (powerUp.type) {
                    case 'ammo':
                        gameState.ammo += 25;
                        break;
                    case 'health':
                        gameState.health += 25;
                        if (gameState.health > 100) gameState.health = 100;
                        break;
                    case 'energy':
                        gameState.energy = 100;
                        updateEnergyBar();
                        break;
                }
                
                // Create collection effect
                createParticles(powerUp.x, powerUp.y, 10, powerUp.color);
                
                // Play sound
                if (!gameState.isMuted) {
                    sounds.powerUp.play();
                }
                
                // Update stats
                updateStats();
                
                // Remove power-up
                gameState.powerUps.splice(i, 1);
            }
        }
        
        // Update particles
        for (let i = gameState.particles.length - 1; i >= 0; i--) {
            const particle = gameState.particles[i];
            
            // Move particle
            particle.x += particle.velocity.x;
            particle.y += particle.velocity.y;
            
            // Fade out particle
            particle.alpha -= particle.fadeSpeed;
            
            // Remove particle if faded out
            if (particle.alpha <= 0) {
                gameState.particles.splice(i, 1);
            }
        }
        
        // Check if wave is complete
        if (gameState.asteroids.length === 0 && gameState.enemies.length === 0) {
            // Wave complete
            gameState.wave++;
            document.getElementById('newWave').textContent = gameState.wave;
            document.getElementById('levelCompleteScreen').classList.remove('hidden');
            
            // Start new wave after delay
            setTimeout(function() {
                document.getElementById('levelCompleteScreen').classList.add('hidden');
                generateWave();
            }, 3000);
        }
        
        // Update stats
        updateStats();
    }
    
    
    function updatePlayer() {
        // Handle rotation
        if (keys.a || keys.ArrowLeft) {
            player.angle -= player.rotationSpeed;
        }
        if (keys.d || keys.ArrowRight) {
            player.angle += player.rotationSpeed;
        }
        
        // Handle thrusting
        player.isThrusting = keys.w || keys.ArrowUp;
        player.isBraking = keys.s || keys.ArrowDown;
        
        if (player.isThrusting) {
            // Apply thrust in direction of rotation
            player.thrust = 0.1;
            player.velocity.x += Math.cos(player.angle) * player.thrust;
            player.velocity.y += Math.sin(player.angle) * player.thrust;
            
            // Limit speed
            const speed = Math.sqrt(player.velocity.x * player.velocity.x + player.velocity.y * player.velocity.y);
            if (speed > player.maxSpeed) {
                player.velocity.x = (player.velocity.x / speed) * player.maxSpeed;
                player.velocity.y = (player.velocity.y / speed) * player.maxSpeed;
            }
        } else {
            player.thrust = 0;
        }
        
        // Apply braking
        if (player.isBraking) {
            player.velocity.x *= 0.95;
            player.velocity.y *= 0.95;
        }
        
        // Apply friction
        player.velocity.x *= player.friction;
        player.velocity.y *= player.friction;
        
        // Update position
        player.x += player.velocity.x;
        player.y += player.velocity.y;
        
        // Wrap around screen
        if (player.x < 0) player.x = canvas.width;
        if (player.x > canvas.width) player.x = 0;
        if (player.y < 0) player.y = canvas.height;
        if (player.y > canvas.height) player.y = 0;
        
        // Handle weapon firing
        if ((keys[' '] || mouse.isDown) && gameState.isRunning && !gameState.isPaused) {
            fireWeapon();
        }
    
    }
    
    
    function render() {
        // Clear canvas
        ctx.fillStyle = '#05051a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw stars
        gameState.stars.forEach(star => {
            ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness})`;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // Draw asteroids
        gameState.asteroids.forEach(asteroid => {
            ctx.save();
            ctx.translate(asteroid.x, asteroid.y);
            ctx.rotate(asteroid.rotation);
            
            // Draw asteroid as irregular polygon
            ctx.beginPath();
            for (let i = 0; i < asteroid.vertices; i++) {
                const angle = (i / asteroid.vertices) * Math.PI * 2;
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
            
            // Fill and stroke
            ctx.fillStyle = '#555555';
            ctx.fill();
            ctx.strokeStyle = '#888888';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Add surface details
            ctx.beginPath();
            for (let i = 0; i < Math.floor(asteroid.radius / 5); i++) {
                const angle = Math.random() * Math.PI * 2;
                const distance = Math.random() * asteroid.radius * 0.8;
                const size = Math.random() * 5 + 2;
                
                const x = Math.cos(angle) * distance;
                const y = Math.sin(angle) * distance;
                
                ctx.moveTo(x, y);
                ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
            }
            ctx.fillStyle = '#444444';
            ctx.fill();
            
            ctx.restore();
        });
        
        // Draw enemies
        gameState.enemies.forEach(enemy => {
            ctx.save();
            ctx.translate(enemy.x, enemy.y);
            ctx.rotate(enemy.angle);
            
            // Draw different ships based on type
            if (enemy.type === 'fighter') {
                // Fighter - triangular ship
                ctx.beginPath();
                ctx.moveTo(15, 0);
                ctx.lineTo(-10, -8);
                ctx.lineTo(-5, 0);
                ctx.lineTo(-10, 8);
                ctx.closePath();
                
                ctx.fillStyle = '#cc3333';
                ctx.fill();
                ctx.strokeStyle = '#ff5555';
                ctx.lineWidth = 1;
                ctx.stroke();
                
                // Engine glow
                ctx.beginPath();
                ctx.moveTo(-5, 0);
                ctx.lineTo(-15, 0);
                ctx.strokeStyle = 'rgba(255, 100, 50, 0.8)';
                ctx.lineWidth = 3;
                ctx.stroke();
            } else { // Bomber
                // Bomber - bulkier ship
                ctx.beginPath();
                ctx.moveTo(15, 0);
                ctx.lineTo(5, -10);
                ctx.lineTo(-10, -10);
                ctx.lineTo(-15, 0);
                ctx.lineTo(-10, 10);
                ctx.lineTo(5, 10);
                ctx.closePath();
                
                ctx.fillStyle = '#995500';
                ctx.fill();
                ctx.strokeStyle = '#ffaa00';
                ctx.lineWidth = 1;
                ctx.stroke();
                
                // Engine glow
                ctx.beginPath();
                ctx.moveTo(-15, -5);
                ctx.lineTo(-25, -5);
                ctx.moveTo(-15, 5);
                ctx.lineTo(-25, 5);
                ctx.strokeStyle = 'rgba(255, 160, 0, 0.8)';
                ctx.lineWidth = 3;
                ctx.stroke();
            }
            
            ctx.restore();
        });
        
        // Draw power-ups
        gameState.powerUps.forEach(powerUp => {
            ctx.save();
            ctx.translate(powerUp.x, powerUp.y);
            ctx.rotate(powerUp.rotation);
            
            // Draw different power-ups based on type
            if (powerUp.type === 'ammo') {
                // Ammo - bullet shape
                ctx.beginPath();
                ctx.arc(0, 0, powerUp.radius, 0, Math.PI * 2);
                ctx.fillStyle = '#ffaa00';
                ctx.fill();
                
                // Bullet icon
                ctx.fillStyle = '#553300';
                ctx.fillRect(-3, -7, 6, 14);
                
                // Outer glow
                ctx.beginPath();
                ctx.arc(0, 0, powerUp.radius + 5, 0, Math.PI * 2);
                ctx.strokeStyle = 'rgba(255, 170, 0, 0.5)';
                ctx.lineWidth = 2;
                ctx.stroke();
            } else if (powerUp.type === 'health') {
                // Health - cross shape
                ctx.beginPath();
                ctx.arc(0, 0, powerUp.radius, 0, Math.PI * 2);
                ctx.fillStyle = '#33cc33';
                ctx.fill();
                
                // Cross icon
                ctx.fillStyle = '#004400';
                ctx.fillRect(-8, -2, 16, 4);
                ctx.fillRect(-2, -8, 4, 16);
                
                // Outer glow
                ctx.beginPath();
                ctx.arc(0, 0, powerUp.radius + 5, 0, Math.PI * 2);
                ctx.strokeStyle = 'rgba(50, 200, 50, 0.5)';
                ctx.lineWidth = 2;
                ctx.stroke();
            } else { // Energy
                // Energy - lightning bolt
                ctx.beginPath();
                ctx.arc(0, 0, powerUp.radius, 0, Math.PI * 2);
                ctx.fillStyle = '#3388ff';
                ctx.fill();
                
                // Lightning icon
                ctx.beginPath();
                ctx.moveTo(-3, -8);
                ctx.lineTo(3, 0);
                ctx.lineTo(-1, 0);
                ctx.lineTo(3, 8);
                ctx.lineTo(-3, 0);
                ctx.lineTo(1, 0);
                ctx.closePath();
                ctx.fillStyle = '#001144';
                ctx.fill();
                
                // Outer glow
                ctx.beginPath();
                ctx.arc(0, 0, powerUp.radius + 5, 0, Math.PI * 2);
                ctx.strokeStyle = 'rgba(50, 130, 255, 0.5)';
                ctx.lineWidth = 2;
                ctx.stroke();
            }
            
            ctx.restore();
        });
        
        // Draw projectiles
        gameState.projectiles.forEach(projectile => {
            ctx.beginPath();
            ctx.arc(projectile.x, projectile.y, projectile.radius, 0, Math.PI * 2);
            ctx.fillStyle = projectile.color;
            ctx.fill();
            
            // Add glow effect
            ctx.beginPath();
            ctx.arc(projectile.x, projectile.y, projectile.radius * 2, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${projectile.color.slice(1).match(/../g).map(c => parseInt(c, 16)).join(',')}, 0.3)`;
            ctx.fill();
            
            // Add trail for missiles
            if (projectile.type === 'missile') {
                const trailLength = 20;
                const angle = Math.atan2(projectile.velocity.y, projectile.velocity.x) + Math.PI;
                
                ctx.beginPath();
                ctx.moveTo(projectile.x, projectile.y);
                ctx.lineTo(
                    projectile.x + Math.cos(angle) * trailLength,
                    projectile.y + Math.sin(angle) * trailLength
                );
                
                const gradient = ctx.createLinearGradient(
                    projectile.x, projectile.y,
                    projectile.x + Math.cos(angle) * trailLength,
                    projectile.y + Math.sin(angle) * trailLength
                );
                gradient.addColorStop(0, projectile.color);
                gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
                
                ctx.strokeStyle = gradient;
                ctx.lineWidth = projectile.radius * 1.5;
                ctx.stroke();
            }
        });
        
        // Draw particles
        gameState.particles.forEach(particle => {
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${particle.color.slice(1).match(/../g).map(c => parseInt(c, 16)).join(',')}, ${particle.alpha})`;
            ctx.fill();
        });
        
        // Draw player ship
        ctx.save();
        ctx.translate(player.x, player.y);
        ctx.rotate(player.angle);
        
        // Ship body
        ctx.beginPath();
        ctx.moveTo(15, 0);
        ctx.lineTo(-10, -10);
        ctx.lineTo(-5, 0);
        ctx.lineTo(-10, 10);
        ctx.closePath();
        
        // Ship color based on shield and invulnerability
        if (gameState.shieldActive) {
            // Shield active - blue tint
            ctx.fillStyle = '#5ab3ff';
        } else if (player.invulnerable) {
            // Invulnerable - flashing effect
            const flashRate = Math.sin(Date.now() * 0.01) * 0.5 + 0.5;
            ctx.fillStyle = `rgba(255, 255, 255, ${flashRate})`;
        } else {
            // Normal - white
            ctx.fillStyle = '#ffffff';
        }
        
        ctx.fill();
        ctx.strokeStyle = '#aaaaff';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Engine flame effect when thrusting
        if (player.isThrusting) {
            // Flame size oscillates
            const flameSize = 10 + Math.sin(Date.now() * 0.1) * 5;
            
            ctx.beginPath();
            ctx.moveTo(-5, -3);
            ctx.lineTo(-5 - flameSize, 0);
            ctx.lineTo(-5, 3);
            ctx.closePath();
            
            // Flame gradient
            const gradient = ctx.createLinearGradient(-5, 0, -5 - flameSize, 0);
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
            gradient.addColorStop(0.5, 'rgba(255, 180, 0, 0.5)');
            gradient.addColorStop(1, 'rgba(255, 50, 0, 0)');
            
            ctx.fillStyle = gradient;
            ctx.fill();
        }
        
        // Shield effect
        if (gameState.shieldActive) {
            ctx.beginPath();
            ctx.arc(0, 0, player.radius + 10, 0, Math.PI * 2);
            
            // Shield gradient
            const gradient = ctx.createRadialGradient(0, 0, player.radius, 0, 0, player.radius + 10);
            gradient.addColorStop(0, 'rgba(90, 179, 255, 0.1)');
            gradient.addColorStop(0.8, 'rgba(90, 179, 255, 0.3)');
            gradient.addColorStop(1, 'rgba(90, 179, 255, 0.1)');
            
            ctx.fillStyle = gradient;
            ctx.fill();
            
            // Shield border
            ctx.strokeStyle = 'rgba(90, 179, 255, 0.8)';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
        
        ctx.restore();
    }
    
    
    function createParticles(x, y, count, color) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 3 + 1;
            
            gameState.particles.push({
                x: x,
                y: y,
                velocity: {
                    x: Math.cos(angle) * speed,
                    y: Math.sin(angle) * speed
                },
                size: Math.random() * 3 + 1,
                color: color,
                alpha: 1,
                fadeSpeed: Math.random() * 0.02 + 0.01
            });
        }
    }
    
    
    function createExplosion(x, y, particleCount, radius, color) {
        // Create particles
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * radius;
            const speed = distance * 0.05;
            
            gameState.particles.push({
                x: x + Math.cos(angle) * (Math.random() * 5),
                y: y + Math.sin(angle) * (Math.random() * 5),
                velocity: {
                    x: Math.cos(angle) * speed,
                    y: Math.sin(angle) * speed
                },
                size: Math.random() * 4 + 2,
                color: color,
                alpha: 1,
                fadeSpeed: Math.random() * 0.02 + 0.01
            });
        }
        
        // Play explosion sound
        if (!gameState.isMuted) {
            sounds.explosion.play();
        }
    }
    
    
    function spawnPowerUp(x, y) {
        // Determine power-up type
        const types = ['ammo', 'health', 'energy'];
        const type = types[Math.floor(Math.random() * types.length)];
        
        // Determine color based on type
        let color;
        switch (type) {
            case 'ammo': color = '#ffaa00'; break;
            case 'health': color = '#33cc33'; break;
            case 'energy': color = '#3388ff'; break;
        }
        
        // Create power-up
        gameState.powerUps.push({
            x: x,
            y: y,
            radius: 12,
            velocity: {
                x: (Math.random() - 0.5) * 2,
                y: (Math.random() - 0.5) * 2
            },
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.05,
            type: type,
            color: color
        });
    }
    
    
    function checkGameOver() {
        if (gameState.health <= 0) {
            gameState.isRunning = false;
            document.getElementById('gameOverScreen').classList.remove('hidden');
            
            // Update final score display
            document.getElementById('finalScore').textContent = gameState.score;
            document.getElementById('enemiesDestroyed').textContent = gameState.enemiesDestroyed;
            
            // Stop all sounds
            for (let sound in sounds) {
                sounds[sound].pause();
                sounds[sound].currentTime = 0;
            }
        }
    }
});
