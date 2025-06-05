

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
        distance: 0,
        discoveries: 0,
        fuel: 100,
        shipX: 0,
        shipY: 0,
        shipSpeed: 0,
        direction: { x: 0, y: 0 },
        celestialBodies: [],
        stars: [],
        boostActive: false,
        scanning: false,
        currentLevel: 1
    };
    
    // Audio elements
    const sounds = {
        engine: new Audio(),
        scan: new Audio(),
        discovery: new Audio(),
        warning: new Audio(),
        boost: new Audio(),
        music: new Audio()
    };
    
    // Placeholder for sound URLs - in a real implementation, you would provide actual sound files
    sounds.engine.src = ''; // engine hum sound
    sounds.scan.src = ''; // scanning sound
    sounds.discovery.src = ''; // discovery alert
    sounds.warning.src = ''; // low fuel warning
    sounds.boost.src = ''; // boost sound
    sounds.music.src = ''; // background music
    
    // Celestial body types
    const celestialTypes = [
        { 
            name: 'Planet', 
            description: 'A rocky or gaseous planetary body',
            variants: ['Terrestrial', 'Gas Giant', 'Ice Giant', 'Desert', 'Ocean'],
            colors: ['#4287f5', '#42f5a7', '#f57e42', '#f5d442', '#a642f5'],
            minSize: 30,
            maxSize: 80,
            points: 10,
            fuelValue: 5
        },
        { 
            name: 'Star', 
            description: 'A luminous ball of plasma',
            variants: ['Red Dwarf', 'Yellow Dwarf', 'Blue Giant', 'White Dwarf', 'Neutron'],
            colors: ['#ff6b6b', '#fff06b', '#6bbaff', '#ffffff', '#6bffed'],
            minSize: 50,
            maxSize: 120,
            points: 15,
            fuelValue: 10
        },
        { 
            name: 'Nebula', 
            description: 'A cloud of gas and dust in space',
            variants: ['Emission', 'Reflection', 'Dark', 'Planetary', 'Supernova'],
            colors: ['#ff6bd9', '#6bffd4', '#3d3d3d', '#7d6bff', '#ff9d6b'],
            minSize: 100,
            maxSize: 200,
            points: 25,
            fuelValue: 15
        },
        { 
            name: 'Black Hole', 
            description: 'A region of spacetime with extreme gravitational effects',
            variants: ['Stellar', 'Intermediate', 'Supermassive', 'Binary', 'Dormant'],
            colors: ['#000000', '#1a1a1a', '#0d0d0d', '#0a0a0a', '#050505'],
            minSize: 40,
            maxSize: 100,
            points: 50,
            fuelValue: 20
        },
        { 
            name: 'Asteroid Field', 
            description: 'A collection of rocky debris',
            variants: ['Dense', 'Sparse', 'Metallic', 'Icy', 'Primordial'],
            colors: ['#8c8c8c', '#b3b3b3', '#d9d9d9', '#a3c2c2', '#c2a3a3'],
            minSize: 80,
            maxSize: 150,
            points: 5,
            fuelValue: 2
        }
    ];
    
    // Initialize keyboard controls
    const keys = {
        ArrowUp: false,
        ArrowDown: false,
        ArrowLeft: false,
        ArrowRight: false,
        Space: false,
        Shift: false,
        Escape: false
    };
    
    // Event listeners for game controls
    document.addEventListener('keydown', function(e) {
        if (e.key === ' ') {
            keys.Space = true;
            if (gameState.isRunning && !gameState.isPaused) {
                startScan();
            }
        } else if (e.key === 'Shift') {
            keys.Shift = true;
            if (gameState.isRunning && !gameState.isPaused) {
                activateBoost(true);
            }
        } else if (e.key === 'Escape') {
            if (gameState.isRunning) {
                togglePause();
            }
        } else if (e.key in keys) {
            keys[e.key] = true;
        }
    });
    
    document.addEventListener('keyup', function(e) {
        if (e.key === ' ') {
            keys.Space = false;
        } else if (e.key === 'Shift') {
            keys.Shift = false;
            if (gameState.isRunning) {
                activateBoost(false);
            }
        } else if (e.key in keys) {
            keys[e.key] = false;
        }
    });
    
    // Button event listeners
    document.getElementById('startGameBtn').addEventListener('click', startGame);
    document.getElementById('restartGameBtn').addEventListener('click', startGame);
    document.getElementById('pauseBtn').addEventListener('click', togglePause);
    document.getElementById('muteBtn').addEventListener('click', toggleMute);
    document.getElementById('helpBtn').addEventListener('click', showHelp);
    document.getElementById('scanBtn').addEventListener('click', function() {
        if (gameState.isRunning && !gameState.isPaused) {
            startScan();
        }
    });
    document.getElementById('boostBtn').addEventListener('click', function() {
        if (gameState.isRunning && !gameState.isPaused) {
            activateBoost(!gameState.boostActive);
        }
    });
    
    // Modal event listeners
    document.querySelector('.close-modal').addEventListener('click', closeModal);
    
    
    function startGame() {
        // Reset game state
        gameState = {
            isRunning: true,
            isPaused: false,
            isMuted: gameState.isMuted,
            distance: 0,
            discoveries: 0,
            fuel: 100,
            shipX: canvas.width / 2,
            shipY: canvas.height / 2,
            shipSpeed: 2,
            direction: { x: 0, y: 0 },
            celestialBodies: [],
            stars: [],
            boostActive: false,
            scanning: false,
            currentLevel: 1
        };
        
        // Hide start/end screens
        document.getElementById('gameStartScreen').classList.add('hidden');
        document.getElementById('gameOverScreen').classList.add('hidden');
        
        // Enable controls
        document.getElementById('scanBtn').disabled = false;
        document.getElementById('boostBtn').disabled = false;
        
        // Generate stars
        generateStars();
        
        // Generate initial celestial bodies
        generateCelestialBodies();
        
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
    
    function generateCelestialBodies() {
        const bodyCount = 5 + Math.floor(gameState.currentLevel / 2);
        
        for (let i = 0; i < bodyCount; i++) {
            const typeIndex = Math.floor(Math.random() * celestialTypes.length);
            const type = celestialTypes[typeIndex];
            const variantIndex = Math.floor(Math.random() * type.variants.length);
            
            const distanceMultiplier = 1 + (gameState.distance / 10000);
            const minDistance = 500 * distanceMultiplier;
            const maxDistance = 2000 * distanceMultiplier;
            
            const angle = Math.random() * Math.PI * 2;
            const distance = minDistance + Math.random() * (maxDistance - minDistance);
            
            const x = canvas.width / 2 + Math.cos(angle) * distance;
            const y = canvas.height / 2 + Math.sin(angle) * distance;
            
            gameState.celestialBodies.push({
                type: type.name,
                variant: type.variants[variantIndex],
                color: type.colors[variantIndex],
                size: type.minSize + Math.random() * (type.maxSize - type.minSize),
                x: x,
                y: y,
                discovered: false,
                points: type.points,
                fuelValue: type.fuelValue,
                description: type.description,
                rotationSpeed: Math.random() * 0.02 - 0.01,
                rotation: 0
            });
        }
    }
    
    
    function startScan() {
        if (gameState.fuel < 5) return;
        
        gameState.scanning = true;
        gameState.fuel -= 5;
        updateStats();
        
        if (!gameState.isMuted) {
            sounds.scan.play();
        }
        
        // Scanning animation handled in render function
        
        setTimeout(() => {
            gameState.scanning = false;
            checkForDiscoveries();
        }, 2000);
    }
    
    function activateBoost(active) {
        gameState.boostActive = active;
        
        if (active && !gameState.isMuted) {
            sounds.boost.play();
        }
    }
    
    function checkForDiscoveries() {
        const scanRadius = 300;
        let discovered = false;
        
        gameState.celestialBodies.forEach(body => {
            if (!body.discovered) {
                const dx = body.x - gameState.shipX;
                const dy = body.y - gameState.shipY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < scanRadius) {
                    body.discovered = true;
                    gameState.discoveries++;
                    gameState.fuel += body.fuelValue;
                    if (gameState.fuel > 100) gameState.fuel = 100;
                    
                    discovered = true;
                    
                    // Show discovery screen
                    document.getElementById('discoveryName').textContent = body.variant + " " + body.type;
                    document.getElementById('discoveryDescription').textContent = body.description;
                    document.getElementById('discoveryScreen').classList.remove('hidden');
                    
                    if (!gameState.isMuted) {
                        sounds.discovery.play();
                    }
                    
                    setTimeout(() => {
                        document.getElementById('discoveryScreen').classList.add('hidden');
                    }, 3000);
                    
                    updateStats();
                }
            }
        });
        
        return discovered;
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
    
    function updateStats() {
        document.getElementById('distance').textContent = Math.floor(gameState.distance);
        document.getElementById('discoveries').textContent = gameState.discoveries;
        document.getElementById('fuel').textContent = Math.floor(gameState.fuel);
        
        document.getElementById('finalDistance').textContent = Math.floor(gameState.distance);
        document.getElementById('finalDiscoveries').textContent = gameState.discoveries;
    }
    
    function checkGameOver() {
        if (gameState.fuel <= 0) {
            gameState.isRunning = false;
            document.getElementById('gameOverScreen').classList.remove('hidden');
            
            // Disable controls
            document.getElementById('scanBtn').disabled = true;
            document.getElementById('boostBtn').disabled = true;
            
            // Stop sounds
            for (let sound in sounds) {
                sounds[sound].pause();
                sounds[sound].currentTime = 0;
            }
        }
    }
    
    
    function gameLoop() {
        if (!gameState.isRunning || gameState.isPaused) return;
        
        update();
        render();
        checkGameOver();
        
        requestAnimationFrame(gameLoop);
    }
    
    function update() {
        // Handle ship movement
        gameState.direction = { x: 0, y: 0 };
        
        if (keys.ArrowUp) gameState.direction.y = -1;
        if (keys.ArrowDown) gameState.direction.y = 1;
        if (keys.ArrowLeft) gameState.direction.x = -1;
        if (keys.ArrowRight) gameState.direction.x = 1;
        
        // Normalize diagonal movement
        if (gameState.direction.x !== 0 && gameState.direction.y !== 0) {
            const magnitude = Math.sqrt(gameState.direction.x * gameState.direction.x + gameState.direction.y * gameState.direction.y);
            gameState.direction.x /= magnitude;
            gameState.direction.y /= magnitude;
        }
        
        // Apply speed
        let currentSpeed = gameState.shipSpeed;
        if (gameState.boostActive && gameState.fuel > 0) {
            currentSpeed *= 2;
            gameState.fuel -= 0.2;
        }
        
        // Move ship
        if (gameState.direction.x !== 0 || gameState.direction.y !== 0) {
            gameState.shipX += gameState.direction.x * currentSpeed;
            gameState.shipY += gameState.direction.y * currentSpeed;
            
            // Increase distance traveled
            gameState.distance += currentSpeed * 0.1;
            
            // Consume fuel
            gameState.fuel -= 0.05;
        }
        
        // Update stats display
        updateStats();
        
        // Move stars for parallax effect
        gameState.stars.forEach(star => {
            star.x -= gameState.direction.x * star.speed;
            star.y -= gameState.direction.y * star.speed;
            
            // Wrap stars around screen
            if (star.x < 0) star.x = canvas.width;
            if (star.x > canvas.width) star.x = 0;
            if (star.y < 0) star.y = canvas.height;
            if (star.y > canvas.height) star.y = 0;
        });
        
        // Move celestial bodies relative to ship
        gameState.celestialBodies.forEach(body => {
            body.x -= gameState.direction.x * currentSpeed;
            body.y -= gameState.direction.y * currentSpeed;
            body.rotation += body.rotationSpeed;
            
            // Generate new celestial bodies when old ones are too far away
            const dx = body.x - gameState.shipX;
            const dy = body.y - gameState.shipY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 3000) {
                // Remove this body and generate a new one
                const index = gameState.celestialBodies.indexOf(body);
                if (index > -1) {
                    gameState.celestialBodies.splice(index, 1);
                    
                    // Generate new celestial body
                    const typeIndex = Math.floor(Math.random() * celestialTypes.length);
                    const type = celestialTypes[typeIndex];
                    const variantIndex = Math.floor(Math.random() * type.variants.length);
                    
                    const distanceMultiplier = 1 + (gameState.distance / 10000);
                    const minDistance = 1000 * distanceMultiplier;
                    const maxDistance = 2000 * distanceMultiplier;
                    
                    const angle = Math.random() * Math.PI * 2;
                    const newDistance = minDistance + Math.random() * (maxDistance - minDistance);
                    
                    const x = gameState.shipX + Math.cos(angle) * newDistance;
                    const y = gameState.shipY + Math.sin(angle) * newDistance;
                    
                    gameState.celestialBodies.push({
                        type: type.name,
                        variant: type.variants[variantIndex],
                        color: type.colors[variantIndex],
                        size: type.minSize + Math.random() * (type.maxSize - type.minSize),
                        x: x,
                        y: y,
                        discovered: false,
                        points: type.points,
                        fuelValue: type.fuelValue,
                        description: type.description,
                        rotationSpeed: Math.random() * 0.02 - 0.01,
                        rotation: 0
                    });
                }
            }
        });
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
        
        // Draw celestial bodies
        gameState.celestialBodies.forEach(body => {
            ctx.save();
            ctx.translate(body.x, body.y);
            ctx.rotate(body.rotation);
            
            if (body.type === 'Black Hole') {
                // Draw black hole with accretion disk
                const gradient = ctx.createRadialGradient(0, 0, body.size * 0.3, 0, 0, body.size);
                gradient.addColorStop(0, 'black');
                gradient.addColorStop(0.7, 'rgba(0, 0, 0, 0.8)');
                gradient.addColorStop(1, 'rgba(50, 0, 80, 0.5)');
                
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(0, 0, body.size, 0, Math.PI * 2);
                ctx.fill();
                
                // Accretion disk
                ctx.strokeStyle = '#9932CC';
                ctx.lineWidth = body.size * 0.1;
                ctx.beginPath();
                ctx.arc(0, 0, body.size * 1.2, 0, Math.PI * 2);
                ctx.stroke();
            } else if (body.type === 'Nebula') {
                // Draw nebula as a cloud-like shape
                const gradient = ctx.createRadialGradient(0, 0, body.size * 0.2, 0, 0, body.size);
                gradient.addColorStop(0, body.color);
                gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
                
                ctx.fillStyle = gradient;
                
                // Create a cloud-like shape
                ctx.beginPath();
                const segments = 12;
                const angleStep = (Math.PI * 2) / segments;
                
                for (let i = 0; i < segments; i++) {
                    const angle = i * angleStep;
                    const variance = Math.random() * 0.4 + 0.8;
                    const x = Math.cos(angle) * body.size * variance;
                    const y = Math.sin(angle) * body.size * variance;
                    
                    if (i === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                }
                
                ctx.closePath();
                ctx.fill();
            } else if (body.type === 'Asteroid Field') {
                // Draw multiple small asteroids
                ctx.fillStyle = body.color;
                const asteroidCount = 15 + Math.floor(Math.random() * 10);
                
                for (let i = 0; i < asteroidCount; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const distance = Math.random() * body.size * 0.8;
                    const size = Math.random() * 10 + 5;
                    
                    const x = Math.cos(angle) * distance;
                    const y = Math.sin(angle) * distance;
                    
                    ctx.beginPath();
                    ctx.arc(x, y, size, 0, Math.PI * 2);
                    ctx.fill();
                }
            } else {
                // Draw planet or star
                let gradient;
                if (body.type === 'Star') {
                    gradient = ctx.createRadialGradient(0, 0, body.size * 0.2, 0, 0, body.size);
                    gradient.addColorStop(0, '#ffffff');
                    gradient.addColorStop(0.5, body.color);
                    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.5)');
                    
                    // Draw glow around star
                    const glowGradient = ctx.createRadialGradient(0, 0, body.size, 0, 0, body.size * 1.5);
                    glowGradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
                    glowGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
                    
                    ctx.fillStyle = glowGradient;
                    ctx.beginPath();
                    ctx.arc(0, 0, body.size * 1.5, 0, Math.PI * 2);
                    ctx.fill();
                } else {
                    gradient = ctx.createRadialGradient(0, 0, body.size * 0.8, 0, 0, body.size);
                    gradient.addColorStop(0, body.color);
                    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.8)');
                }
                
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(0, 0, body.size, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // If discovered, draw a marker
            if (body.discovered) {
                ctx.strokeStyle = '#00ff00';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(0, 0, body.size + 10, 0, Math.PI * 2);
                ctx.stroke();
            }
            
            ctx.restore();
        });
        
        // Draw scan effect if scanning
        if (gameState.scanning) {
            const scanRadius = 300;
            const gradient = ctx.createRadialGradient(
                gameState.shipX, gameState.shipY, 0,
                gameState.shipX, gameState.shipY, scanRadius
            );
            gradient.addColorStop(0, 'rgba(0, 255, 255, 0.5)');
            gradient.addColorStop(0.7, 'rgba(0, 255, 255, 0.2)');
            gradient.addColorStop(1, 'rgba(0, 255, 255, 0)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(gameState.shipX, gameState.shipY, scanRadius, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Draw player ship
        ctx.save();
        ctx.translate(gameState.shipX, gameState.shipY);
        
        // Rotate ship based on movement direction
        if (gameState.direction.x !== 0 || gameState.direction.y !== 0) {
            const angle = Math.atan2(gameState.direction.y, gameState.direction.x);
            ctx.rotate(angle + Math.PI / 2);
        }
        
        // Ship body
        ctx.fillStyle = '#e0e0ff';
        ctx.beginPath();
        ctx.moveTo(0, -15);
        ctx.lineTo(-10, 10);
        ctx.lineTo(0, 5);
        ctx.lineTo(10, 10);
        ctx.closePath();
        ctx.fill();
        
        // Engine glow
        if (gameState.direction.x !== 0 || gameState.direction.y !== 0) {
            ctx.fillStyle = gameState.boostActive ? 
                'rgba(255, 100, 0, 0.8)' : 'rgba(0, 200, 255, 0.5)';
            
            ctx.beginPath();
            ctx.moveTo(-5, 5);
            ctx.lineTo(0, gameState.boostActive ? 25 : 15);
            ctx.lineTo(5, 5);
            ctx.closePath();
            ctx.fill();
        }
        
        ctx.restore();
        
        // Draw fuel warning if low
        if (gameState.fuel < 20) {
            ctx.fillStyle = 'rgba(255, 0, 0, ' + (Math.sin(Date.now() * 0.005) * 0.5 + 0.5) + ')';
            ctx.font = '24px "Exo 2", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('LOW FUEL WARNING', canvas.width / 2, 50);
        }
    }
});
