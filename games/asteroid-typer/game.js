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

let canvas, ctx, typingInput, scoreElement, levelElement, livesElement,
    startScreen, gameOverScreen, levelUpScreen, finalScoreElement, 
    newLevelElement, startButton, restartButton, pauseButton, muteButton,
    helpButton, helpModal, closeModalButton;

const sounds = {
    shoot: null,
    explode: null,
    hit: null,
    levelUp: null,
    gameOver: null
};

function initGame() {
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
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    startButton.addEventListener('click', startGame);
    restartButton.addEventListener('click', restartGame);
    pauseButton.addEventListener('click', togglePause);
    muteButton.addEventListener('click', toggleSound);
    helpButton.addEventListener('click', toggleHelp);
    closeModalButton.addEventListener('click', toggleHelp);
    
    typingInput.addEventListener('input', handleTyping);
    document.addEventListener('keydown', handleKeyDown);
    
    initSounds();
    
    drawGameScreen();
}

function initSounds() {
    sounds.shoot = { play: () => { } };
    sounds.explode = { play: () => { } };
    sounds.hit = { play: () => { } };
    sounds.levelUp = { play: () => { } };
    sounds.gameOver = { play: () => { } };
}

function resizeCanvas() {
    const gameArea = document.querySelector('.game-area');
    canvas.width = gameArea.clientWidth;
    canvas.height = gameArea.clientHeight;
    
    if (!gameState.running) {
        drawGameScreen();
    }
}

function startGame() {
    gameState.running = true;
    gameState.paused = false;
    gameState.score = 0;
    gameState.level = 1;
    gameState.lives = gameConfig.startingLives;
    gameState.asteroids = [];
    gameState.lastSpawnTime = Date.now();
    
    scoreElement.textContent = gameState.score;
    levelElement.textContent = gameState.level;
    livesElement.textContent = gameState.lives;
    
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    
    typingInput.disabled = false;
    typingInput.focus();
    
    gameState.spawnInterval = setInterval(spawnAsteroid, getSpawnRate());
    
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
        clearInterval(gameState.spawnInterval);
        pauseButton.innerHTML = '<i class="fas fa-play"></i> Resume';
        typingInput.disabled = true;
    } else {
        gameState.spawnInterval = setInterval(spawnAsteroid, getSpawnRate());
        pauseButton.innerHTML = '<i class="fas fa-pause"></i> Pause';
        typingInput.disabled = false;
        typingInput.focus();
        gameState.lastSpawnTime = Date.now();
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
    
    if (!helpModal.classList.contains('hidden') && gameState.running && !gameState.paused) {
        togglePause();
    }
}

function handleTyping(event) {
    gameState.currentWordInput = event.target.value.toLowerCase().trim();
    checkWordMatch();
}

function handleKeyDown(event) {
    if (event.key === 'Escape' && gameState.running) {
        togglePause();
    }
}

function checkWordMatch() {
    if (!gameState.currentWordInput) return;
    
    const lowerInput = gameState.currentWordInput.toLowerCase();
    
    for (let i = 0; i < gameState.asteroids.length; i++) {
        const asteroid = gameState.asteroids[i];
        
        if (asteroid.word.toLowerCase() === lowerInput) {
            destroyAsteroid(i);
            typingInput.value = '';
            gameState.currentWordInput = '';
            
            if (gameConfig.soundEnabled) {
                sounds.explode.play();
            }
            
            break;
        }
    }
}

function getSpawnRate() {
    const rate = gameConfig.spawnRate - ((gameState.level - 1) * gameConfig.spawnRateDecrease);
    return Math.max(rate, 500);
}

function getAsteroidSpeed() {
    return gameConfig.asteroidSpeed + ((gameState.level - 1) * gameConfig.speedIncrease);
}

function spawnAsteroid() {
    if (gameState.paused) return;
    
    const wordLength = Math.floor(Math.random() * (gameConfig.maxWordLength - gameConfig.minWordLength + 1)) + gameConfig.minWordLength;
    const filteredWords = gameConfig.words.filter(word => word.length <= wordLength && word.length >= gameConfig.minWordLength);
    const word = filteredWords[Math.floor(Math.random() * filteredWords.length)];
    
    const x = Math.random() * (canvas.width - 100) + 50;
    const y = -50;
    
    const size = 30 + (word.length * 5);
    
    const colors = ['#FF5A5F', '#00A9FF', '#FFC857', '#8A2BE2', '#50E3C2'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    
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
    
    gameState.asteroids.push(asteroid);
}

function destroyAsteroid(index) {
    const points = gameState.asteroids[index].word.length * 10;
    gameState.score += points;
    scoreElement.textContent = gameState.score;
    
    gameState.asteroids.splice(index, 1);
    
    if (gameState.score >= gameState.level * gameConfig.levelUpScore && gameState.level < gameConfig.maxLevel) {
        levelUp();
    }
}

function levelUp() {
    gameState.level++;
    levelElement.textContent = gameState.level;
    newLevelElement.textContent = gameState.level;
    
    levelUpScreen.classList.remove('hidden');
    
    setTimeout(() => {
        levelUpScreen.classList.add('hidden');
    }, 2000);
    
    clearInterval(gameState.spawnInterval);
    gameState.spawnInterval = setInterval(spawnAsteroid, getSpawnRate());
    
    if (gameConfig.soundEnabled) {
        sounds.levelUp.play();
    }
}

function playerHit() {
    gameState.lives--;
    livesElement.textContent = gameState.lives;
    
    if (gameConfig.soundEnabled) {
        sounds.hit.play();
    }
    
    if (gameState.lives <= 0) {
        gameOver();
    }
}

function gameOver() {
    gameState.running = false;
    clearInterval(gameState.spawnInterval);
    cancelAnimationFrame(gameState.animationId);
    
    finalScoreElement.textContent = gameState.score;
    gameOverScreen.classList.remove('hidden');
    
    typingInput.disabled = true;
    
    if (gameConfig.soundEnabled) {
        sounds.gameOver.play();
    }
}

function drawSpaceship() {
    const shipX = canvas.width / 2;
    const shipY = canvas.height - 50;
    const shipSize = 40;
    
    ctx.save();
    ctx.translate(shipX, shipY);
    
    ctx.fillStyle = '#00A9FF';
    ctx.beginPath();
    ctx.moveTo(0, -shipSize/2);
    ctx.lineTo(shipSize/2, shipSize/2);
    ctx.lineTo(-shipSize/2, shipSize/2);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = '#E0E0FF';
    ctx.beginPath();
    ctx.rect(-shipSize/6, 0, shipSize/3, shipSize/3);
    ctx.fill();
    
    ctx.fillStyle = 'rgba(255, 90, 95, 0.7)';
    ctx.beginPath();
    ctx.moveTo(-shipSize/4, shipSize/2);
    ctx.lineTo(shipSize/4, shipSize/2);
    ctx.lineTo(0, shipSize/2 + 15);
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();
}

function drawAsteroid(asteroid) {
    ctx.save();
    
    ctx.translate(asteroid.x, asteroid.y);
    ctx.rotate(asteroid.rotation * Math.PI / 180);
    
    ctx.fillStyle = asteroid.color;
    ctx.beginPath();
    ctx.moveTo(-asteroid.size/2, -asteroid.size/2);
    ctx.lineTo(asteroid.size/2, -asteroid.size/3);
    ctx.lineTo(asteroid.size/2, asteroid.size/3);
    ctx.lineTo(0, asteroid.size/2);
    ctx.lineTo(-asteroid.size/2, asteroid.size/3);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${Math.max(14, asteroid.size/4)}px 'Exo 2', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(asteroid.word, 0, 0);
    
    ctx.restore();
}

function drawBackground() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#050520');
    gradient.addColorStop(1, '#0a0a1e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
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
    
    drawBackground();
    
    updateAsteroids();
    
    drawSpaceship();
    
    gameState.animationId = requestAnimationFrame(gameLoop);
}

function updateAsteroids() {
    for (let i = gameState.asteroids.length - 1; i >= 0; i--) {
        const asteroid = gameState.asteroids[i];
        
        asteroid.y += asteroid.speed;
        asteroid.rotation += asteroid.rotationSpeed;
        
        if (asteroid.y > canvas.height + asteroid.size) {
            playerHit();
            
            gameState.asteroids.splice(i, 1);
            continue;
        }
        
        drawAsteroid(asteroid);
    }
}

document.addEventListener('DOMContentLoaded', initGame);
