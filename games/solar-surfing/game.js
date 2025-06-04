


const gameConfig = {
    surfSpeed: 3.0,
    gravity: 0.25,
    jumpForce: 10,
    trickRotateSpeed: 5,
    heatRate: 0.002,
    coolRate: 0.005,
    flareSpawnRate: 2000,
    stormSpawnRate: 5000,
    difficultyRate: 0.0005,
    canvasWidth: 800,
    canvasHeight: 600,
    soundEnabled: true
};


const gameState = {
    running: false,
    paused: false,
    score: 0,
    tricksPerformed: 0,
    comboMultiplier: 1,
    bestCombo: 1,
    heat: 0,
    airborne: false,
    performing: false,
    jumpVelocity: 0,        // Current vertical velocity
    playerX: 0,             // Player x position
    playerY: 0,             // Player y position
    playerRotation: 0,      // Player rotation (for tricks)
    solarFlares: [],        // Array of active solar flares
    solarStorms: [],        // Array of active solar storms
    currentFlare: null,     // Flare the player is currently on
    sunPhase: 0,            // Sun animation phase
    lastFlareTime: 0,       // Time since last flare spawn
    lastStormTime: 0,       // Time since last storm spawn
    animationId: null       // Animation frame ID
};

// DOM Elements
let canvas, ctx, scoreElement, tricksElement, heatFillElement,
    startScreen, gameOverScreen, levelUpScreen, 
    finalScoreElement, finalTricksElement, bestComboElement,
    trickNameElement, trickPointsElement, trickAlertElement, solarFlareAlertElement,
    startButton, restartButton, pauseButton, muteButton,
    helpButton, helpModal, closeModalButton;

// Keys state
const keys = {
    left: false,
    right: false,
    up: false,
    down: false,
    space: false
};

// List of possible tricks
const tricks = [
    { name: "360° Flip", points: 100, difficulty: 1 },
    { name: "720° Spin", points: 200, difficulty: 2 },
    { name: "Solar Grab", points: 150, difficulty: 1 },
    { name: "Quantum Twist", points: 250, difficulty: 2 },
    { name: "Plasma Kick", points: 150, difficulty: 1 },
    { name: "Cosmic Roll", points: 300, difficulty: 3 },
    { name: "Stellar Orbit", points: 400, difficulty: 3 },
    { name: "Neutron Slide", points: 200, difficulty: 2 }
];

// Initialize the game
function initGame() {
    // Get DOM elements
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    scoreElement = document.getElementById('score');
    tricksElement = document.getElementById('tricks');
    heatFillElement = document.getElementById('heatFill');
    startScreen = document.getElementById('gameStartScreen');
    gameOverScreen = document.getElementById('gameOverScreen');
    levelUpScreen = document.getElementById('levelUpScreen');
    finalScoreElement = document.getElementById('finalScore');
    finalTricksElement = document.getElementById('finalTricks');
    bestComboElement = document.getElementById('bestCombo');
    trickNameElement = document.getElementById('trickName');
    trickPointsElement = document.getElementById('trickPoints');
    trickAlertElement = document.getElementById('trickAlert');
    solarFlareAlertElement = document.getElementById('solarFlareAlert');
    startButton = document.getElementById('startGameBtn');
    restartButton = document.getElementById('restartGameBtn');
    pauseButton = document.getElementById('pauseBtn');
    muteButton = document.getElementById('muteBtn');
    helpButton = document.getElementById('helpBtn');
    helpModal = document.getElementById('helpModal');
    closeModalButton = document.querySelector('.close-modal');
    
    // Initialize canvas size
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Event listeners
    startButton.addEventListener('click', startGame);
    restartButton.addEventListener('click', restartGame);
    pauseButton.addEventListener('click', togglePause);
    muteButton.addEventListener('click', toggleSound);
    helpButton.addEventListener('click', toggleHelp);
    closeModalButton.addEventListener('click', toggleHelp);
    
    // Keyboard controls
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    // Draw the initial game screen
    drawGameScreen();
}


function resizeCanvas() {
    const gameArea = document.querySelector('.game-area');
    canvas.width = gameArea.clientWidth;
    canvas.height = gameArea.clientHeight;
    
    // Update config
    gameConfig.canvasWidth = canvas.width;
    gameConfig.canvasHeight = canvas.height;
    
    // Redraw if game is not running
    if (!gameState.running) {
        drawGameScreen();
    }
}


function startGame() {
    // Reset game state
    gameState.running = true;
    gameState.paused = false;
    gameState.score = 0;
    gameState.tricksPerformed = 0;
    gameState.comboMultiplier = 1;
    gameState.bestCombo = 1;
    gameState.heat = 0;
    gameState.airborne = false;
    gameState.performing = false;
    gameState.jumpVelocity = 0;
    gameState.playerX = canvas.width / 2;
    gameState.playerY = canvas.height - 100;
    gameState.playerRotation = 0;
    gameState.solarFlares = [];
    gameState.solarStorms = [];
    gameState.currentFlare = null;
    gameState.sunPhase = 0;
    gameState.lastFlareTime = Date.now();
    gameState.lastStormTime = Date.now();
    
    // Spawn initial flares
    spawnSolarFlare();
    
    // Update UI
    scoreElement.textContent = '0';
    tricksElement.textContent = '0';
    updateHeatMeter();
    
    // Hide start screen, show game
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    
    // Start game loop
    if (gameState.animationId) {
        cancelAnimationFrame(gameState.animationId);
    }
    gameLoop();
}


function restartGame() {
    gameOverScreen.classList.add('hidden');
    startGame();
}


function togglePause() {
    if (!gameState.running) return;
    
    gameState.paused = !gameState.paused;
    
    if (gameState.paused) {
        // Pause the game
        cancelAnimationFrame(gameState.animationId);
        pauseButton.innerHTML = '<i class="fas fa-play"></i> Resume';
    } else {
        // Resume the game
        pauseButton.innerHTML = '<i class="fas fa-pause"></i> Pause';
        gameLoop();
    }
}


function toggleSound() {
    gameConfig.soundEnabled = !gameConfig.soundEnabled;
    
    if (gameConfig.soundEnabled) {
        muteButton.innerHTML = '<i class="fas fa-volume-up"></i> Sound';
    } else {
        muteButton.innerHTML = '<i class="fas fa-volume-mute"></i> Sound';
    }
}


function toggleHelp() {
    helpModal.classList.toggle('hidden');
    
    // Pause game when help is shown
    if (!helpModal.classList.contains('hidden') && gameState.running && !gameState.paused) {
        togglePause();
    }
}


function handleKeyDown(event) {
    switch(event.key) {
        case 'ArrowLeft':
            keys.left = true;
            break;
        case 'ArrowRight':
            keys.right = true;
            break;
        case 'ArrowUp':
            keys.up = true;
            if (gameState.running && !gameState.airborne && gameState.currentFlare) {
                jump();
            }
            break;
        case 'ArrowDown':
            keys.down = true;
            break;
        case ' ': // Space
            keys.space = true;
            if (gameState.running && gameState.airborne && !gameState.performing) {
                performTrick();
            }
            event.preventDefault(); // Prevent page scrolling
            break;
        case 'Escape':
            if (gameState.running) togglePause();
            break;
    }
}


function handleKeyUp(event) {
    switch(event.key) {
        case 'ArrowLeft':
            keys.left = false;
            break;
        case 'ArrowRight':
            keys.right = false;
            break;
        case 'ArrowUp':
            keys.up = false;
            break;
        case 'ArrowDown':
            keys.down = false;
            break;
        case ' ': // Space
            keys.space = false;
            break;
    }
}


function updateHeatMeter() {
    heatFillElement.style.transform = `scaleX(${gameState.heat})`;
}


function jump() {
    gameState.airborne = true;
    gameState.jumpVelocity = -gameConfig.jumpForce;
    gameState.currentFlare = null;
}


function performTrick() {
    if (gameState.performing) return;
    
    // Select a random trick
    const trick = tricks[Math.floor(Math.random() * tricks.length)];
    
    // Start performing trick
    gameState.performing = true;
    
    // Calculate points with combo
    const points = trick.points * gameState.comboMultiplier;
    
    // Increase combo
    gameState.comboMultiplier++;
    
    if (gameState.comboMultiplier > gameState.bestCombo) {
        gameState.bestCombo = gameState.comboMultiplier;
    }
    
    // Update UI
    gameState.score += points;
    gameState.tricksPerformed++;
    scoreElement.textContent = gameState.score;
    tricksElement.textContent = gameState.tricksPerformed;
    
    // Show trick name and points
    trickNameElement.textContent = trick.name;
    trickPointsElement.textContent = `+${points}`;
    trickNameElement.classList.remove('hidden');
    trickPointsElement.classList.remove('hidden');
    
    // Show combo alert for high combos
    if (gameState.comboMultiplier >= 3) {
        trickAlertElement.textContent = `Trick Combo x${gameState.comboMultiplier}!`;
        trickAlertElement.classList.remove('hidden');
        
        // Hide after 2 seconds
        setTimeout(() => {
            trickAlertElement.classList.add('hidden');
        }, 2000);
    }
    
    // Hide trick display after animation
    setTimeout(() => {
        trickNameElement.classList.add('hidden');
        trickPointsElement.classList.add('hidden');
    }, 1000);
}


function spawnSolarFlare() {
    // Generate random properties for the flare
    const width = Math.random() * 100 + 150; // Width between 150 and 250
    const height = Math.random() * 20 + 10;  // Height between 10 and 30
    const x = Math.random() * (canvas.width - width); // Random x position
    const speed = Math.random() * 1 + 1;     // Speed between 1 and 2
    
    gameState.solarFlares.push({
        x,
        y: canvas.height - 50, // Start near bottom of screen
        width,
        height,
        speed,
        oscillationPhase: Math.random() * Math.PI * 2,
        oscillationSpeed: Math.random() * 0.05 + 0.02
    });
}


function spawnSolarStorm() {
    // Generate random properties for the storm
    const radius = Math.random() * 30 + 20;  // Radius between 20 and 50
    const x = Math.random() * canvas.width;  // Random x position
    const speed = Math.random() * 2 + 3;     // Speed between 3 and 5
    
    gameState.solarStorms.push({
        x,
        y: -radius * 2,                     // Start above screen
        radius,
        speed,
        rotationSpeed: Math.random() * 0.1 + 0.05,
        rotation: 0
    });
}

// Check for collisions
function checkCollisions() {
    // Set default state
    let onFlare = false;
    gameState.currentFlare = null;
    
    // Only check collisions if not performing a trick
    if (gameState.performing) return;
    
    // Check flare collisions
    if (!gameState.airborne) {
        for (const flare of gameState.solarFlares) {
            // Check if player is on this flare
            if (
                gameState.playerX + 15 >= flare.x && 
                gameState.playerX - 15 <= flare.x + flare.width &&
                Math.abs(gameState.playerY + 20 - flare.y) < 10
            ) {
                // Snap to flare
                gameState.playerY = flare.y - 20;
                gameState.currentFlare = flare;
                onFlare = true;
                
                // Increase heat while on flare
                gameState.heat = Math.min(1.0, gameState.heat + gameConfig.heatRate);
                updateHeatMeter();
                
                // Game over if heat is max
                if (gameState.heat >= 1.0) {
                    gameOver();
                    return;
                }
                
                break;
            }
        }
    }
    
    // Reset combo if landed and not on a flare
    if (!gameState.airborne && !onFlare && gameState.comboMultiplier > 1) {
        gameState.comboMultiplier = 1;
    }
    
    // Cool down when not on flare
    if (!onFlare && gameState.heat > 0) {
        gameState.heat = Math.max(0, gameState.heat - gameConfig.coolRate);
        updateHeatMeter();
    }
    
    // Check storm collisions
    for (const storm of gameState.solarStorms) {
        // Calculate distance between player and storm center
        const dx = gameState.playerX - storm.x;
        const dy = gameState.playerY - storm.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Check if player is inside storm
        if (distance < storm.radius + 15) {
            gameOver();
            return;
        }
    }
}

// Game over
function gameOver() {
    gameState.running = false;
    cancelAnimationFrame(gameState.animationId);
    
    // Update UI
    finalScoreElement.textContent = gameState.score;
    finalTricksElement.textContent = gameState.tricksPerformed;
    bestComboElement.textContent = gameState.bestCombo + 'x';
    
    gameOverScreen.classList.remove('hidden');
}


function drawSun() {
    // Animate sun phase
    gameState.sunPhase += 0.01;
    
    // Draw sun gradient
    const centerX = canvas.width / 2;
    const centerY = canvas.height + 300; // Sun is mostly below the screen
    const radius = 500;
    
    // Create radial gradient for sun
    const gradient = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, radius
    );
    gradient.addColorStop(0, '#FF5A5F');
    gradient.addColorStop(0.7, '#FFAC81');
    gradient.addColorStop(1, 'rgba(255, 172, 129, 0)');
    
    // Draw sun
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw sun texture/pattern
    drawSunTexture(centerX, centerY, radius);
}


function drawSunTexture(centerX, centerY, radius) {
    // Draw random solar prominences/flares
    for (let i = 0; i < 20; i++) {
        const angle = (i / 20) * Math.PI + gameState.sunPhase;
        const length = Math.sin(angle * 3 + gameState.sunPhase * 2) * 50 + 30;
        const width = Math.sin(angle * 5 + gameState.sunPhase) * 20 + 20;
        
        const x1 = centerX + Math.cos(angle) * (radius * 0.7);
        const y1 = centerY + Math.sin(angle) * (radius * 0.7);
        const x2 = centerX + Math.cos(angle) * (radius * 0.7 + length);
        const y2 = centerY + Math.sin(angle) * (radius * 0.7 + length);
        
        // Create gradient for the flare
        const flareGradient = ctx.createLinearGradient(x1, y1, x2, y2);
        flareGradient.addColorStop(0, 'rgba(255, 90, 95, 0.7)');
        flareGradient.addColorStop(1, 'rgba(255, 172, 129, 0)');
        
        ctx.strokeStyle = flareGradient;
        ctx.lineWidth = width;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    }
}


function drawSolarFlares() {
    for (const flare of gameState.solarFlares) {
        // Calculate wave effect
        const waveHeight = Math.sin(flare.oscillationPhase) * 5;
        
        // Create gradient for the flare
        const gradient = ctx.createLinearGradient(
            flare.x, flare.y,
            flare.x + flare.width, flare.y
        );
        gradient.addColorStop(0, 'rgba(255, 172, 129, 0.7)');
        gradient.addColorStop(0.5, 'rgba(255, 90, 95, 0.8)');
        gradient.addColorStop(1, 'rgba(255, 172, 129, 0.7)');
        
        // Draw flare base
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(flare.x, flare.y);
        
        // Draw top of flare with wave effect
        for (let i = 0; i <= flare.width; i += 10) {
            const waveY = flare.y - Math.sin((i / flare.width) * Math.PI * 2 + flare.oscillationPhase) * flare.height;
            ctx.lineTo(flare.x + i, waveY);
        }
        
        ctx.lineTo(flare.x + flare.width, flare.y);
        ctx.closePath();
        ctx.fill();
        
        // Draw glow
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i <= flare.width; i += 10) {
            const waveY = flare.y - Math.sin((i / flare.width) * Math.PI * 2 + flare.oscillationPhase) * flare.height;
            if (i === 0) {
                ctx.moveTo(flare.x + i, waveY);
            } else {
                ctx.lineTo(flare.x + i, waveY);
            }
        }
        ctx.stroke();
    }
}


function drawSolarStorms() {
    for (const storm of gameState.solarStorms) {
        // Update rotation
        storm.rotation += storm.rotationSpeed;
        
        // Draw storm
        ctx.save();
        ctx.translate(storm.x, storm.y);
        ctx.rotate(storm.rotation);
        
        // Create storm gradient
        const gradient = ctx.createRadialGradient(
            0, 0, 0,
            0, 0, storm.radius
        );
        gradient.addColorStop(0, 'rgba(255, 50, 50, 0.8)');
        gradient.addColorStop(0.7, 'rgba(150, 30, 30, 0.6)');
        gradient.addColorStop(1, 'rgba(100, 20, 20, 0)');
        
        // Draw storm body
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, storm.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw storm swirls
        ctx.strokeStyle = 'rgba(255, 100, 100, 0.5)';
        ctx.lineWidth = 3;
        
        for (let i = 0; i < 3; i++) {
            const startAngle = (i / 3) * Math.PI * 2;
            ctx.beginPath();
            for (let j = 0; j <= 1; j += 0.1) {
                const angle = startAngle + j * Math.PI * 2;
                const radius = storm.radius * j * 0.8;
                if (j === 0) {
                    ctx.moveTo(radius, 0);
                } else {
                    const x = Math.cos(angle) * radius;
                    const y = Math.sin(angle) * radius;
                    ctx.lineTo(x, y);
                }
            }
            ctx.stroke();
        }
        
        ctx.restore();
    }
}

// Draw player
function drawPlayer() {
    ctx.save();
    ctx.translate(gameState.playerX, gameState.playerY);
    ctx.rotate(gameState.playerRotation);
    
    // Draw surfboard
    ctx.fillStyle = '#00A9FF';
    ctx.beginPath();
    ctx.ellipse(0, 15, 25, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw board highlights
    ctx.strokeStyle = '#5FC9FF';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 15, 20, 5, 0, 0, Math.PI);
    ctx.stroke();
    
    // Draw player body
    ctx.fillStyle = '#FFC857';
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2); // Head
    ctx.fill();
    
    ctx.fillStyle = '#FF5A5F';
    ctx.beginPath();
    ctx.rect(-7, 10, 14, 15); // Body
    ctx.fill();
    
    // Draw player limbs
    ctx.strokeStyle = '#FFC857';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    
    // Arms
    ctx.beginPath();
    ctx.moveTo(-7, 15);
    ctx.lineTo(-15, 10);
    ctx.moveTo(7, 15);
    ctx.lineTo(15, 10);
    ctx.stroke();
    
    // Legs
    ctx.beginPath();
    ctx.moveTo(-5, 25);
    ctx.lineTo(-10, 35);
    ctx.moveTo(5, 25);
    ctx.lineTo(10, 35);
    ctx.stroke();
    
    ctx.restore();
}


function drawBackground() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Space background
    ctx.fillStyle = '#1A0E0A';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw distant stars
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    for (let i = 0; i < 30; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height * 0.5; // Only in top half
        const size = Math.random() * 2 + 1;
        
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Draw the initial game screen
function drawGameScreen() {
    drawBackground();
    drawSun();
}


function updateGame(deltaTime) {
    const now = Date.now();
    
    // Move player
    if (keys.left) {
        gameState.playerX -= 5;
        if (gameState.playerX < 20) gameState.playerX = 20;
    }
    if (keys.right) {
        gameState.playerX += 5;
        if (gameState.playerX > canvas.width - 20) gameState.playerX = canvas.width - 20;
    }
    
    // If performing a trick, rotate player
    if (gameState.performing) {
        gameState.playerRotation += gameConfig.trickRotateSpeed * (Math.PI / 180);
        
        // Complete trick after full rotation
        if (gameState.playerRotation >= Math.PI * 2) {
            gameState.playerRotation = 0;
            gameState.performing = false;
        }
    }
    
    // Apply gravity if airborne
    if (gameState.airborne) {
        gameState.jumpVelocity += gameConfig.gravity;
        gameState.playerY += gameState.jumpVelocity;
        
        // Check if landed on ground
        if (gameState.playerY >= canvas.height - 50) {
            gameState.playerY = canvas.height - 50;
            gameState.airborne = false;
            gameState.jumpVelocity = 0;
            gameState.performing = false;
            gameState.playerRotation = 0;
        }
    } else if (gameState.currentFlare) {
        // Move with flare if on one
        gameState.playerX += gameState.currentFlare.speed;
        
        // Keep player within bounds
        if (gameState.playerX < 20) gameState.playerX = 20;
        if (gameState.playerX > canvas.width - 20) gameState.playerX = canvas.width - 20;
    }
    
    // Update solar flares
    for (let i = gameState.solarFlares.length - 1; i >= 0; i--) {
        const flare = gameState.solarFlares[i];
        
        // Move flare
        flare.x += flare.speed;
        flare.oscillationPhase += flare.oscillationSpeed;
        
        // Remove flares that move off screen
        if (flare.x > canvas.width) {
            gameState.solarFlares.splice(i, 1);
        }
    }
    
    // Update solar storms
    for (let i = gameState.solarStorms.length - 1; i >= 0; i--) {
        const storm = gameState.solarStorms[i];
        
        // Move storm
        storm.y += storm.speed;
        
        // Remove storms that move off screen
        if (storm.y > canvas.height + storm.radius) {
            gameState.solarStorms.splice(i, 1);
        }
    }
    
    // Spawn new solar flares
    if (now - gameState.lastFlareTime > gameConfig.flareSpawnRate) {
        spawnSolarFlare();
        gameState.lastFlareTime = now;
    }
    
    // Spawn new solar storms
    if (now - gameState.lastStormTime > gameConfig.stormSpawnRate) {
        spawnSolarStorm();
        gameState.lastStormTime = now;
        
        // Show warning
        solarFlareAlertElement.classList.remove('hidden');
        
        // Hide after 2 seconds
        setTimeout(() => {
            solarFlareAlertElement.classList.add('hidden');
        }, 2000);
    }
    
    // Check for collisions
    checkCollisions();
    
    // Increase difficulty
    gameConfig.flareSpawnRate = Math.max(1000, 2000 - gameState.score * gameConfig.difficultyRate);
    gameConfig.stormSpawnRate = Math.max(3000, 5000 - gameState.score * gameConfig.difficultyRate);
}


function gameLoop() {
    const deltaTime = 16; // Fixed time step for consistent physics
    
    // Update game state
    updateGame(deltaTime);
    
    // Draw game frame
    drawBackground();
    drawSun();
    drawSolarFlares();
    drawSolarStorms();
    drawPlayer();
    
    // Continue game loop
    gameState.animationId = requestAnimationFrame(gameLoop);
}


document.addEventListener('DOMContentLoaded', initGame);
