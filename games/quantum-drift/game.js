


const gameConfig = {
    tunnelSpeed: 2.0,
    tunnelRadius: 200,
    shipSize: 30,
    turnSpeed: 5,
    boostSpeed: 4.0,
    boostDecay: 0.05,
    boostRecharge: 0.01,
    particleCount: 100,
    obstacleRate: 3000,
    energyRate: 5000,
    difficultyRate: 0.001,
    canvasWidth: 800,
    canvasHeight: 600,
    soundEnabled: true,
};


const gameState = {
    running: false,
    paused: false,
    distance: 0,
    currentSpeed: 0,
    topSpeed: 0,
    boostMeter: 1.0,
    boosting: false,
    shipAngle: 0,
    shipPosition: 0,
    tunnelDepth: 0,
    particles: [],
    obstacles: [],
    energyOrbs: [],
    wormholeActive: false,
    lastFrameTime: 0,
    lastObstacleTime: 0,
    lastEnergyTime: 0,
    animationId: null
};

// DOM Elements
let canvas, ctx, distanceElement, speedElement, boostFillElement,
    startScreen, gameOverScreen, wormholeScreen, finalDistanceElement, 
    topSpeedElement, startButton, restartButton, pauseButton, muteButton,
    helpButton, helpModal, closeModalButton, wormholeAlert;

// Keys state
const keys = {
    left: false,
    right: false,
    boost: false
};

// Initialize the game when DOM is loaded
document.addEventListener('DOMContentLoaded', initGame);

// Initialize the game
function initGame() {
    // Get DOM elements
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    distanceElement = document.getElementById('distance');
    speedElement = document.getElementById('speed');
    boostFillElement = document.getElementById('boostFill');
    startScreen = document.getElementById('gameStartScreen');
    gameOverScreen = document.getElementById('gameOverScreen');
    wormholeScreen = document.getElementById('wormholeScreen');
    finalDistanceElement = document.getElementById('finalDistance');
    topSpeedElement = document.getElementById('topSpeed');
    startButton = document.getElementById('startGameBtn');
    restartButton = document.getElementById('restartGameBtn');
    pauseButton = document.getElementById('pauseBtn');
    muteButton = document.getElementById('muteBtn');
    helpButton = document.getElementById('helpBtn');
    helpModal = document.getElementById('helpModal');
    closeModalButton = document.querySelector('.close-modal');
    wormholeAlert = document.getElementById('wormholeAlert');
    
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
    if (gameArea) {
        canvas.width = gameArea.clientWidth;
        canvas.height = gameArea.clientHeight;
    }
    
    // Redraw if game is not running
    if (!gameState.running) {
        drawGameScreen();
    }
}


function startGame() {
    // Reset game state
    gameState.running = true;
    gameState.paused = false;
    gameState.distance = 0;
    gameState.currentSpeed = gameConfig.tunnelSpeed;
    gameState.topSpeed = gameState.currentSpeed;
    gameState.boostMeter = 1.0;
    gameState.boosting = false;
    gameState.shipAngle = 0;
    gameState.shipPosition = 0;
    gameState.tunnelDepth = 0;
    gameState.particles = [];
    gameState.obstacles = [];
    gameState.energyOrbs = [];
    gameState.wormholeActive = false;
    gameState.lastObstacleTime = Date.now();
    gameState.lastEnergyTime = Date.now();
    gameState.lastFrameTime = Date.now();
    
    // Initialize tunnel particles
    initTunnel();
    
    // Update UI
    distanceElement.textContent = '0';
    speedElement.textContent = Math.floor(gameState.currentSpeed * 10);
    updateBoostMeter();
    
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
        gameState.lastFrameTime = Date.now();
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
    if (gameState.paused) return;
    
    switch(event.key) {
        case 'ArrowLeft':
            keys.left = true;
            break;
        case 'ArrowRight':
            keys.right = true;
            break;
        case ' ': // Space
            keys.boost = true;
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
        case ' ': // Space
            keys.boost = false;
            break;
    }
}

// Initialize tunnel particles
function initTunnel() {
    gameState.particles = [];
    
    for (let i = 0; i < gameConfig.particleCount; i++) {
        addTunnelParticle(true);
    }
}


function addTunnelParticle(isInit = false) {
    const angle = Math.random() * Math.PI * 2;
    const z = isInit ? Math.random() * -5000 : -5000;
    
    gameState.particles.push({
        angle,
        z,
        color: getRandomColor(),
        size: Math.random() * 3 + 1
    });
}


function getRandomColor() {
    const colors = [
        '#00A9FF', // Blue
        '#5FC9FF', // Light Blue
        '#FFC857', // Yellow
        '#FF5A5F', // Red
        '#8A2BE2', // Purple
    ];
    
    return colors[Math.floor(Math.random() * colors.length)];
}


function updateBoostMeter() {
    if (boostFillElement) {
        boostFillElement.style.transform = `scaleX(${gameState.boostMeter})`;
    }
}


function activateWormhole() {
    if (gameState.wormholeActive) return;
    
    gameState.wormholeActive = true;
    
    // Show wormhole alert
    if (wormholeAlert) {
        wormholeAlert.classList.remove('hidden');
        
        // Hide after 2 seconds
        setTimeout(() => {
            wormholeAlert.classList.add('hidden');
        }, 2000);
    }
    
    // Show wormhole screen
    wormholeScreen.classList.remove('hidden');
    
    // Animate wormhole effect
    const wormholeEffect = document.querySelector('.wormhole-effect');
    if (wormholeEffect) {
        wormholeEffect.style.animation = 'none';
        // Trigger reflow
        void wormholeEffect.offsetWidth;
        wormholeEffect.style.animation = 'wormhole 2s ease-in-out';
    }
    
    // Hide after animation completes
    setTimeout(() => {
        wormholeScreen.classList.add('hidden');
        
        // Speed boost after wormhole
        gameState.currentSpeed += 1.0;
        if (gameState.currentSpeed > gameState.topSpeed) {
            gameState.topSpeed = gameState.currentSpeed;
        }
        
        // Update speed display
        speedElement.textContent = Math.floor(gameState.currentSpeed * 10);
        
        // End wormhole effect after a delay
        setTimeout(() => {
            gameState.wormholeActive = false;
        }, 1000);
    }, 2000);
}


function spawnObstacle() {
    const angle = Math.random() * Math.PI * 2;
    const sizeMultiplier = Math.random() * 0.3 + 0.2; // 20% to 50% of tunnel
    
    gameState.obstacles.push({
        angle,
        z: -5000,
        width: Math.PI * sizeMultiplier,
        color: '#FF5A5F'
    });
}


function spawnEnergyOrb() {
    const angle = Math.random() * Math.PI * 2;
    
    gameState.energyOrbs.push({
        angle,
        z: -5000,
        size: 15,
        color: '#FFC857',
        pulse: 0,
        pulseDir: 1
    });
}

// Check for collisions
function checkCollisions() {
    // Check obstacle collisions
    for (let i = gameState.obstacles.length - 1; i >= 0; i--) {
        const obstacle = gameState.obstacles[i];
        
        // Only check obstacles that are close to the player
        if (obstacle.z > -200 && obstacle.z < 0) {
            // Calculate angular distance
            let angleDiff = Math.abs(obstacle.angle - gameState.shipPosition);
            angleDiff = Math.min(angleDiff, Math.PI * 2 - angleDiff);
            
            // Check if ship is within obstacle's angular width
            if (angleDiff < (obstacle.width / 2)) {
                gameOver();
                return;
            }
        }
    }
    
    // Check energy orb collisions
    for (let i = gameState.energyOrbs.length - 1; i >= 0; i--) {
        const orb = gameState.energyOrbs[i];
        
        // Only check orbs that are close to the player
        if (orb.z > -200 && orb.z < 0) {
            // Calculate angular distance
            let angleDiff = Math.abs(orb.angle - gameState.shipPosition);
            angleDiff = Math.min(angleDiff, Math.PI * 2 - angleDiff);
            
            // Check if ship is close to orb
            if (angleDiff < 0.3) {
                // Collect energy
                gameState.boostMeter = Math.min(1.0, gameState.boostMeter + 0.3);
                updateBoostMeter();
                
                // Remove orb
                gameState.energyOrbs.splice(i, 1);
                
                // Play sound
                // if (gameConfig.soundEnabled) {
                //     playSound('collect');
                // }
            }
        }
    }
}


function gameOver() {
    gameState.running = false;
    cancelAnimationFrame(gameState.animationId);
    
    // Update UI
    finalDistanceElement.textContent = Math.floor(gameState.distance).toLocaleString();
    topSpeedElement.textContent = Math.floor(gameState.topSpeed * 10);
    gameOverScreen.classList.remove('hidden');
}


function drawShip() {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    // Ship position on the tunnel circle
    const shipX = centerX + Math.cos(gameState.shipPosition) * gameConfig.tunnelRadius * 0.85;
    const shipY = centerY + Math.sin(gameState.shipPosition) * gameConfig.tunnelRadius * 0.85;
    
    // Ship angle (tangent to the circle + player's turning angle)
    const tangentAngle = gameState.shipPosition + Math.PI / 2;
    const shipAngle = tangentAngle + gameState.shipAngle;
    
    ctx.save();
    ctx.translate(shipX, shipY);
    ctx.rotate(shipAngle);
    
    // Draw ship
    ctx.fillStyle = '#00A9FF';
    ctx.beginPath();
    ctx.moveTo(gameConfig.shipSize/2, 0);
    ctx.lineTo(-gameConfig.shipSize/2, -gameConfig.shipSize/3);
    ctx.lineTo(-gameConfig.shipSize/4, 0);
    ctx.lineTo(-gameConfig.shipSize/2, gameConfig.shipSize/3);
    ctx.closePath();
    ctx.fill();
    
    // Draw ship details
    ctx.fillStyle = '#5FC9FF';
    ctx.beginPath();
    ctx.arc(gameConfig.shipSize/6, 0, gameConfig.shipSize/6, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw boost effect when boosting
    if (gameState.boosting && gameState.boostMeter > 0) {
        ctx.fillStyle = 'rgba(255, 90, 95, 0.7)';
        ctx.beginPath();
        ctx.moveTo(-gameConfig.shipSize/2, 0);
        ctx.lineTo(-gameConfig.shipSize * 1.5, -gameConfig.shipSize/4);
        ctx.lineTo(-gameConfig.shipSize * 2, 0);
        ctx.lineTo(-gameConfig.shipSize * 1.5, gameConfig.shipSize/4);
        ctx.closePath();
        ctx.fill();
    }
    
    ctx.restore();
}

// Draw tunnel
function drawTunnel() {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    // Create tunnel gradient
    const gradient = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, gameConfig.tunnelRadius * 1.5
    );
    gradient.addColorStop(0, 'rgba(10, 10, 60, 0)');
    gradient.addColorStop(0.5, 'rgba(0, 169, 255, 0.1)');
    gradient.addColorStop(1, 'rgba(10, 10, 40, 0.7)');
    
    // Draw tunnel background
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, gameConfig.tunnelRadius * 1.5, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw tunnel particles
    for (const particle of gameState.particles) {
        // Calculate particle perspective position
        const perspective = 5000 / (5000 + particle.z);
        const x = centerX + Math.cos(particle.angle) * gameConfig.tunnelRadius * perspective;
        const y = centerY + Math.sin(particle.angle) * gameConfig.tunnelRadius * perspective;
        const size = particle.size * perspective;
        
        // Draw particle
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = perspective * 0.8;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Reset global alpha
    ctx.globalAlpha = 1.0;
}


function drawObstacles() {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    for (const obstacle of gameState.obstacles) {
        // Calculate obstacle perspective position
        const perspective = 5000 / (5000 + obstacle.z);
        const radius = gameConfig.tunnelRadius * perspective;
        
        // Draw obstacle
        ctx.fillStyle = obstacle.color;
        ctx.globalAlpha = perspective * 0.8;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, obstacle.angle - obstacle.width/2, obstacle.angle + obstacle.width/2);
        ctx.lineTo(centerX, centerY);
        ctx.closePath();
        ctx.fill();
        
        // Draw obstacle edge glow
        ctx.strokeStyle = '#FF8A8E';
        ctx.lineWidth = 3 * perspective;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, obstacle.angle - obstacle.width/2, obstacle.angle + obstacle.width/2);
        ctx.stroke();
    }
    
    // Reset global alpha
    ctx.globalAlpha = 1.0;
}


function drawEnergyOrbs() {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    for (const orb of gameState.energyOrbs) {
        // Calculate orb perspective position
        const perspective = 5000 / (5000 + orb.z);
        const x = centerX + Math.cos(orb.angle) * gameConfig.tunnelRadius * perspective;
        const y = centerY + Math.sin(orb.angle) * gameConfig.tunnelRadius * perspective;
        const baseSize = orb.size * perspective;
        
        // Pulse animation
        orb.pulse += 0.1 * orb.pulseDir;
        if (orb.pulse > 1) orb.pulseDir = -1;
        if (orb.pulse < 0) orb.pulseDir = 1;
        
        const pulseSize = baseSize * (1 + orb.pulse * 0.2);
        
        // Draw orb glow
        const gradient = ctx.createRadialGradient(
            x, y, 0,
            x, y, pulseSize * 2
        );
        gradient.addColorStop(0, 'rgba(255, 200, 87, 0.8)');
        gradient.addColorStop(1, 'rgba(255, 200, 87, 0)');
        
        ctx.globalAlpha = perspective * 0.7;
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, pulseSize * 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw orb core
        ctx.globalAlpha = perspective;
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.arc(x, y, pulseSize * 0.5, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Reset global alpha
    ctx.globalAlpha = 1.0;
}


function drawBackground() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Space background
    ctx.fillStyle = '#050520';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Stars (simplified for performance)
    for (let i = 0; i < 50; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const size = Math.random() * 2 + 1;
        const opacity = Math.random() * 0.8 + 0.2;
        
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }
}


function drawGameScreen() {
    drawBackground();
    drawTunnel();
}

// Update game state
function updateGame(deltaTime) {
    const now = Date.now();
    const deltaSeconds = deltaTime / 1000;
    
    // Handle input
    if (keys.left) {
        gameState.shipPosition -= gameConfig.turnSpeed * 0.01;
    }
    if (keys.right) {
        gameState.shipPosition += gameConfig.turnSpeed * 0.01;
    }
    
    // Keep ship position within 0 to 2π
    if (gameState.shipPosition < 0) gameState.shipPosition += Math.PI * 2;
    if (gameState.shipPosition >= Math.PI * 2) gameState.shipPosition -= Math.PI * 2;
    
    // Handle boost
    gameState.boosting = keys.boost && gameState.boostMeter > 0;
    
    if (gameState.boosting) {
        // Apply boost
        gameState.currentSpeed = gameConfig.tunnelSpeed * gameConfig.boostSpeed;
        
        // Deplete boost meter
        gameState.boostMeter = Math.max(0, gameState.boostMeter - gameConfig.boostDecay * deltaSeconds);
        updateBoostMeter();
    } else {
        // Normal speed
        gameState.currentSpeed = gameConfig.tunnelSpeed;
        
        // Recharge boost meter
        if (gameState.boostMeter < 1.0) {
            gameState.boostMeter = Math.min(1.0, gameState.boostMeter + gameConfig.boostRecharge * deltaSeconds);
            updateBoostMeter();
        }
    }
    
    // Update speed display
    speedElement.textContent = Math.floor(gameState.currentSpeed * 10);
    
    // Track top speed
    if (gameState.currentSpeed > gameState.topSpeed) {
        gameState.topSpeed = gameState.currentSpeed;
    }
    
    // Update distance
    gameState.distance += gameState.currentSpeed * (deltaTime / 100);
    distanceElement.textContent = Math.floor(gameState.distance).toLocaleString();
    
    // Update tunnel particles
    for (let i = gameState.particles.length - 1; i >= 0; i--) {
        const particle = gameState.particles[i];
        
        // Move particle forward
        particle.z += gameState.currentSpeed * deltaTime;
        
        // Remove particles that are too close to the viewer
        if (particle.z > 0) {
            gameState.particles.splice(i, 1);
            addTunnelParticle();
        }
    }
    
    // Update obstacles
    for (let i = gameState.obstacles.length - 1; i >= 0; i--) {
        const obstacle = gameState.obstacles[i];
        
        // Move obstacle forward
        obstacle.z += gameState.currentSpeed * deltaTime;
        
        // Remove obstacles that are too close to the viewer
        if (obstacle.z > 200) {
            gameState.obstacles.splice(i, 1);
        }
    }
    
    // Update energy orbs
    for (let i = gameState.energyOrbs.length - 1; i >= 0; i--) {
        const orb = gameState.energyOrbs[i];
        
        // Move orb forward
        orb.z += gameState.currentSpeed * deltaTime;
        
        // Remove orbs that are too close to the viewer
        if (orb.z > 200) {
            gameState.energyOrbs.splice(i, 1);
        }
    }
    
    // Check for spawn events
    if (now - gameState.lastObstacleTime > gameConfig.obstacleRate) {
        spawnObstacle();
        gameState.lastObstacleTime = now;
    }
    
    if (now - gameState.lastEnergyTime > gameConfig.energyRate) {
        spawnEnergyOrb();
        gameState.lastEnergyTime = now;
    }
    
    // Check for wormhole event (every 1000 distance)
    if (Math.floor(gameState.distance / 1000) > Math.floor((gameState.distance - gameState.currentSpeed * (deltaTime / 100)) / 1000)) {
        activateWormhole();
    }
    
    // Check for collisions
    checkCollisions();
    
    // Increase difficulty
    gameConfig.obstacleRate = Math.max(1500, 3000 - gameState.distance * gameConfig.difficultyRate);
}


function gameLoop() {
    if (!gameState.running || gameState.paused) return;
    
    const now = Date.now();
    const deltaTime = now - gameState.lastFrameTime;
    gameState.lastFrameTime = now;
    
    // Update game state
    updateGame(deltaTime);
    
    // Draw game frame
    drawBackground();
    drawTunnel();
    drawObstacles();
    drawEnergyOrbs();
    drawShip();
    
    // Continue game loop
    gameState.animationId = requestAnimationFrame(gameLoop);
}
