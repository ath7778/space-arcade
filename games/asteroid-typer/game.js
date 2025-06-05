


const gameConfig = {
    asteroidSpeed: 1.0,
    spawnRate: 3000,
    minWordLength: 3,
    maxWordLength: 8,
    startingLives: 3,
    levelUpScore: 500,
    speedIncrease: 0.2,
    spawnRateDecrease: 300,
    maxLevel: 10,
    canvasWidth: 800,
    canvasHeight: 600,
    soundEnabled: true,
    words: [
        'star', 'planet', 'comet', 'moon', 'sun', 'galaxy', 'nebula', 'cosmos',
        'orbit', 'quasar', 'pulsar', 'rocket', 'space', 'void', 'light', 'dark',
        'alien', 'meteor', 'plasma', 'warp', 'beam', 'laser', 'nova', 'ship',
        'dust', 'ring', 'cloud', 'rover', 'titan', 'mars', 'venus', 'pluto',
        'earth', 'fusion', 'flare', 'black', 'white', 'corona', 'sector', 'wormhole',
        'jupiter', 'saturn', 'uranus', 'mercury', 'asteroid', 'satellite', 'gravity',
        'quantum', 'matter', 'energy', 'atomic', 'nuclear', 'cosmic', 'launch'
    ]
};


const gameState = {
    running: false,
    paused: false,
    score: 0,
    level: 1,
    lives: gameConfig.startingLives,
    asteroids: [],
    lastSpawnTime: 0,
    currentWordInput: '',
    spawnInterval: null,
    animationId: null
};

// DOM Elements
let canvas, ctx, typingInput, scoreElement, levelElement, livesElement,
    startScreen, gameOverScreen, levelUpScreen, finalScoreElement, 
    newLevelElement, startButton, restartButton, pauseButton, muteButton,
    helpButton, helpModal, closeModalButton;

// Sounds
const sounds = {
    shoot: null,
    explode: null,
    hit: null,
    levelUp: null,
    gameOver: null
};

// Initialize the game
function initGame() {
    // Get DOM elements
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    typingInput = document.getElementById('typingInput');
    scoreElement = document.getElementById('score');
    levelElement = document.getElementById('level');
    livesElement = document.getElementById('lives');
    startScreen = document.getElementById('gameStartScreen');
    gameOverScreen = document.getElementById('gameOverScreen');
    levelUpScreen = document.getElementById('levelUpScreen');
    finalScoreElement = document.getElementById('finalScore');
    newLevelElement = document.getElementById('newLevel');
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
    
    typingInput.addEventListener('input', handleTyping);
    document.addEventListener('keydown', handleKeyDown);
    
    // Initialize sounds
    initSounds();
    
    // Draw the initial game screen
    drawGameScreen();
}


function initSounds() {
    // In a real game, you would load actual sound files
    // For this demo, we'll just define the sound objects
    sounds.shoot = { play: () => { /* Play sound */ } };
    sounds.explode = { play: () => { /* Play sound */ } };
    sounds.hit = { play: () => { /* Play sound */ } };
    sounds.levelUp = { play: () => { /* Play sound */ } };
    sounds.gameOver = { play: () => { /* Play sound */ } };
}


function resizeCanvas() {
    const gameArea = document.querySelector('.game-area');
    canvas.width = gameArea.clientWidth;
    canvas.height = gameArea.clientHeight;
    
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
    gameState.level = 1;
    gameState.lives = gameConfig.startingLives;
    gameState.asteroids = [];
    gameState.lastSpawnTime = Date.now();
    
    // Update UI
    scoreElement.textContent = gameState.score;
    levelElement.textContent = gameState.level;
    livesElement.textContent = gameState.lives;
    
    // Hide start screen, show game
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    
    // Enable typing input
    typingInput.disabled = false;
    typingInput.focus();
    
    // Start spawning asteroids
    gameState.spawnInterval = setInterval(spawnAsteroid, getSpawnRate());
    
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
        clearInterval(gameState.spawnInterval);
        pauseButton.innerHTML = '<i class="fas fa-play"></i> Resume';
        typingInput.disabled = true;
    } else {
        // Resume the game
        gameState.spawnInterval = setInterval(spawnAsteroid, getSpawnRate());
        pauseButton.innerHTML = '<i class="fas fa-pause"></i> Pause';
        typingInput.disabled = false;
        typingInput.focus();
        gameState.lastSpawnTime = Date.now(); // Reset spawn timer
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


function handleTyping(event) {
    gameState.currentWordInput = event.target.value.toLowerCase().trim();
    checkWordMatch();
}


function handleKeyDown(event) {
    // ESC key to toggle pause
    if (event.key === 'Escape' && gameState.running) {
        togglePause();
    }
}


function checkWordMatch() {
    if (!gameState.currentWordInput) return;
    
    const lowerInput = gameState.currentWordInput.toLowerCase();
    
    // Check each asteroid for a match
    for (let i = 0; i < gameState.asteroids.length; i++) {
        const asteroid = gameState.asteroids[i];
        
        if (asteroid.word.toLowerCase() === lowerInput) {
            // Word match found - destroy asteroid
            destroyAsteroid(i);
            typingInput.value = '';
            gameState.currentWordInput = '';
            
            // Play sound
            if (gameConfig.soundEnabled) {
                sounds.explode.play();
            }
            
            // No need to check other asteroids
            break;
        }
    }
}


function getSpawnRate() {
    const rate = gameConfig.spawnRate - ((gameState.level - 1) * gameConfig.spawnRateDecrease);
    return Math.max(rate, 500); // Minimum 500ms between spawns
}


function getAsteroidSpeed() {
    return gameConfig.asteroidSpeed + ((gameState.level - 1) * gameConfig.speedIncrease);
}


function spawnAsteroid() {
    if (gameState.paused) return;
    
    // Get a random word for the asteroid
    const wordLength = Math.floor(Math.random() * (gameConfig.maxWordLength - gameConfig.minWordLength + 1)) + gameConfig.minWordLength;
    const filteredWords = gameConfig.words.filter(word => word.length <= wordLength && word.length >= gameConfig.minWordLength);
    const word = filteredWords[Math.floor(Math.random() * filteredWords.length)];
    
    // Random position at top of screen
    const x = Math.random() * (canvas.width - 100) + 50;
    const y = -50; // Start above the canvas
    
    // Random size based on word length
    const size = 30 + (word.length * 5);
    
    // Random color
    const colors = ['#FF5A5F', '#00A9FF', '#FFC857', '#8A2BE2', '#50E3C2'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    // Create asteroid object
    const asteroid = {
        x,
        y,
        word,
        size,
        color,
        speed: getAsteroidSpeed(),
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 2
    };
    
    // Add to asteroids array
    gameState.asteroids.push(asteroid);
}


function destroyAsteroid(index) {
    // Add score based on word length
    const points = gameState.asteroids[index].word.length * 10;
    gameState.score += points;
    scoreElement.textContent = gameState.score;
    
    // Remove from array
    gameState.asteroids.splice(index, 1);
    
    // Check for level up
    if (gameState.score >= gameState.level * gameConfig.levelUpScore && gameState.level < gameConfig.maxLevel) {
        levelUp();
    }
}


function levelUp() {
    gameState.level++;
    levelElement.textContent = gameState.level;
    newLevelElement.textContent = gameState.level;
    
    // Show level up screen
    levelUpScreen.classList.remove('hidden');
    
    // Hide after 2 seconds
    setTimeout(() => {
        levelUpScreen.classList.add('hidden');
    }, 2000);
    
    // Update spawn rate
    clearInterval(gameState.spawnInterval);
    gameState.spawnInterval = setInterval(spawnAsteroid, getSpawnRate());
    
    // Play sound
    if (gameConfig.soundEnabled) {
        sounds.levelUp.play();
    }
}


function playerHit() {
    gameState.lives--;
    livesElement.textContent = gameState.lives;
    
    // Play sound
    if (gameConfig.soundEnabled) {
        sounds.hit.play();
    }
    
    // Check game over
    if (gameState.lives <= 0) {
        gameOver();
    }
}


function gameOver() {
    gameState.running = false;
    clearInterval(gameState.spawnInterval);
    cancelAnimationFrame(gameState.animationId);
    
    // Update UI
    finalScoreElement.textContent = gameState.score;
    gameOverScreen.classList.remove('hidden');
    
    // Disable input
    typingInput.disabled = true;
    
    // Play sound
    if (gameConfig.soundEnabled) {
        sounds.gameOver.play();
    }
}

// Draw spaceship
function drawSpaceship() {
    const shipX = canvas.width / 2;
    const shipY = canvas.height - 50;
    const shipSize = 40;
    
    ctx.save();
    ctx.translate(shipX, shipY);
    
    // Draw ship body
    ctx.fillStyle = '#00A9FF';
    ctx.beginPath();
    ctx.moveTo(0, -shipSize/2);
    ctx.lineTo(shipSize/2, shipSize/2);
    ctx.lineTo(-shipSize/2, shipSize/2);
    ctx.closePath();
    ctx.fill();
    
    // Draw ship details
    ctx.fillStyle = '#E0E0FF';
    ctx.beginPath();
    ctx.rect(-shipSize/6, 0, shipSize/3, shipSize/3);
    ctx.fill();
    
    // Draw engine glow
    ctx.fillStyle = 'rgba(255, 90, 95, 0.7)';
    ctx.beginPath();
    ctx.moveTo(-shipSize/4, shipSize/2);
    ctx.lineTo(shipSize/4, shipSize/2);
    ctx.lineTo(0, shipSize/2 + 15);
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();
}

// Draw asteroid
function drawAsteroid(asteroid) {
    ctx.save();
    
    // Move to asteroid position and apply rotation
    ctx.translate(asteroid.x, asteroid.y);
    ctx.rotate(asteroid.rotation * Math.PI / 180);
    
    // Draw asteroid body
    ctx.fillStyle = asteroid.color;
    ctx.beginPath();
    ctx.moveTo(-asteroid.size/2, -asteroid.size/2);
    ctx.lineTo(asteroid.size/2, -asteroid.size/3);
    ctx.lineTo(asteroid.size/2, asteroid.size/3);
    ctx.lineTo(0, asteroid.size/2);
    ctx.lineTo(-asteroid.size/2, asteroid.size/3);
    ctx.closePath();
    ctx.fill();
    
    // Draw word on asteroid
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${Math.max(14, asteroid.size/4)}px 'Exo 2', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(asteroid.word, 0, 0);
    
    ctx.restore();
}


function drawBackground() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#050520');
    gradient.addColorStop(1, '#0a0a1e');
    ctx.fillStyle = gradient;
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
    drawSpaceship();
}


function gameLoop() {
    if (!gameState.running || gameState.paused) return;
    
    // Clear and draw background
    drawBackground();
    
    // Update and draw asteroids
    updateAsteroids();
    
    // Draw spaceship
    drawSpaceship();
    
    // Request next frame
    gameState.animationId = requestAnimationFrame(gameLoop);
}


function updateAsteroids() {
    for (let i = gameState.asteroids.length - 1; i >= 0; i--) {
        const asteroid = gameState.asteroids[i];
        
        // Update position
        asteroid.y += asteroid.speed;
        asteroid.rotation += asteroid.rotationSpeed;
        
        // Check if asteroid has hit the bottom
        if (asteroid.y > canvas.height + asteroid.size) {
            // Player loses a life
            playerHit();
            
            // Remove asteroid
            gameState.asteroids.splice(i, 1);
            continue;
        }
        
        // Draw asteroid
        drawAsteroid(asteroid);
    }
}


document.addEventListener('DOMContentLoaded', initGame);
