/**
 * Simple Nature-themed Memory Card Game
 * Demo game for Nature Arcade
 */
class MemoryGame {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.cards = [];
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.totalPairs = 6;
        this.isLocked = false;
        this.moveCount = 0;
        this.gameStarted = false;
        this.timer = 0;
        this.timerInterval = null;
        
        // Nature themed card images
        this.cardImages = [
            'leaf', 'tree', 'flower', 'mountain', 
            'river', 'bird', 'butterfly', 'sun'
        ];
        
        this.init();
    }
    
    init() {
        this.createGameUI();
        this.setupCards();
        this.addEventListeners();
    }
    
    createGameUI() {
        // Game container styles
        this.container.style.width = '100%';
        this.container.style.maxWidth = '600px';
        this.container.style.margin = '0 auto';
        this.container.style.padding = '20px';
        this.container.innerHTML = '';
        
        // Create header with controls
        const header = document.createElement('div');
        header.className = 'memory-game-header';
        header.innerHTML = `
            <h2>Nature Memory Game</h2>
            <div class="game-stats">
                <div class="stat-item">Moves: <span id="move-count">0</span></div>
                <div class="stat-item">Time: <span id="timer">0</span>s</div>
                <button id="restart-game" class="btn btn-primary">Restart</button>
            </div>
        `;
        header.style.marginBottom = '20px';
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'center';
        header.style.flexWrap = 'wrap';
        
        // Create game board
        const gameBoard = document.createElement('div');
        gameBoard.id = 'memory-board';
        gameBoard.style.display = 'grid';
        gameBoard.style.gridTemplateColumns = 'repeat(4, 1fr)';
        gameBoard.style.gap = '10px';
        
        this.container.appendChild(header);
        this.container.appendChild(gameBoard);
    }
    
    setupCards() {
        const gameBoard = document.getElementById('memory-board');
        gameBoard.innerHTML = '';
        
        // Select random card types for this game
        const selectedTypes = [];
        while (selectedTypes.length < this.totalPairs) {
            const randomIndex = Math.floor(Math.random() * this.cardImages.length);
            const type = this.cardImages[randomIndex];
            
            if (!selectedTypes.includes(type)) {
                selectedTypes.push(type);
            }
        }
        
        // Create card pairs and shuffle
        this.cards = [];
        for (let i = 0; i < this.totalPairs; i++) {
            for (let j = 0; j < 2; j++) {
                this.cards.push({
                    type: selectedTypes[i],
                    flipped: false,
                    matched: false
                });
            }
        }
        
        // Shuffle the cards
        this.shuffle(this.cards);
        
        // Create card elements
        this.cards.forEach((card, index) => {
            const cardElement = document.createElement('div');
            cardElement.className = 'memory-card';
            cardElement.dataset.index = index;
            cardElement.innerHTML = `
                <div class="card-inner">
                    <div class="card-front"></div>
                    <div class="card-back">
                        <i class="fas fa-${card.type}"></i>
                    </div>
                </div>
            `;
            
            // Card styling
            cardElement.style.height = '100px';
            cardElement.style.perspective = '1000px';
            cardElement.style.cursor = 'pointer';
            cardElement.style.position = 'relative';
            
            const cardInner = cardElement.querySelector('.card-inner');
            cardInner.style.position = 'relative';
            cardInner.style.width = '100%';
            cardInner.style.height = '100%';
            cardInner.style.transition = 'transform 0.6s';
            cardInner.style.transformStyle = 'preserve-3d';
            
            const cardFront = cardElement.querySelector('.card-front');
            cardFront.style.position = 'absolute';
            cardFront.style.width = '100%';
            cardFront.style.height = '100%';
            cardFront.style.backfaceVisibility = 'hidden';
            cardFront.style.backgroundColor = '#4CAF50';
            cardFront.style.borderRadius = '5px';
            cardFront.style.display = 'flex';
            cardFront.style.alignItems = 'center';
            cardFront.style.justifyContent = 'center';
            cardFront.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
            
            // Add leaf pattern to card front
            cardFront.style.backgroundImage = 'radial-gradient(circle, transparent 0%, transparent 70%, rgba(255,255,255,0.1) 70%)';
            cardFront.style.backgroundSize = '20px 20px';
            
            const cardBack = cardElement.querySelector('.card-back');
            cardBack.style.position = 'absolute';
            cardBack.style.width = '100%';
            cardBack.style.height = '100%';
            cardBack.style.backfaceVisibility = 'hidden';
            cardBack.style.backgroundColor = '#FFFFFF';
            cardBack.style.transform = 'rotateY(180deg)';
            cardBack.style.borderRadius = '5px';
            cardBack.style.display = 'flex';
            cardBack.style.alignItems = 'center';
            cardBack.style.justifyContent = 'center';
            cardBack.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
            
            const icon = cardBack.querySelector('i');
            icon.style.fontSize = '2rem';
            icon.style.color = '#4CAF50';
            
            gameBoard.appendChild(cardElement);
        });
    }
    
    addEventListeners() {
        // Add click event for cards
        const cardElements = document.querySelectorAll('.memory-card');
        cardElements.forEach(card => {
            card.addEventListener('click', () => this.flipCard(card));
        });
        
        // Add restart button event
        const restartBtn = document.getElementById('restart-game');
        restartBtn.addEventListener('click', () => this.restartGame());
    }
    
    startGame() {
        if (!this.gameStarted) {
            this.gameStarted = true;
            this.startTimer();
        }
    }
    
    startTimer() {
        this.timerInterval = setInterval(() => {
            this.timer++;
            document.getElementById('timer').textContent = this.timer;
        }, 1000);
    }
    
    stopTimer() {
        clearInterval(this.timerInterval);
    }
    
    flipCard(cardElement) {
        const index = parseInt(cardElement.dataset.index);
        
        // Ignore if game is locked, card is already flipped or matched
        if (this.isLocked || this.cards[index].flipped || this.cards[index].matched) {
            return;
        }
        
        // Start the game on first card flip
        if (!this.gameStarted) {
            this.startGame();
        }
        
        // Flip card visual
        const cardInner = cardElement.querySelector('.card-inner');
        cardInner.style.transform = 'rotateY(180deg)';
        
        // Update card state
        this.cards[index].flipped = true;
        this.flippedCards.push({index, element: cardElement});
        
        // Check for match if we have 2 flipped cards
        if (this.flippedCards.length === 2) {
            this.moveCount++;
            document.getElementById('move-count').textContent = this.moveCount;
            this.checkForMatch();
        }
    }
    
    checkForMatch() {
        this.isLocked = true;
        const [firstCard, secondCard] = this.flippedCards;
        
        if (this.cards[firstCard.index].type === this.cards[secondCard.index].type) {
            // Match found
            this.cards[firstCard.index].matched = true;
            this.cards[secondCard.index].matched = true;
            
            // Add matched styling
            firstCard.element.style.opacity = '0.8';
            secondCard.element.style.opacity = '0.8';
            
            this.matchedPairs++;
            this.resetFlippedCards();
            
            // Check for game completion
            if (this.matchedPairs === this.totalPairs) {
                setTimeout(() => this.endGame(), 500);
            }
        } else {
            // No match
            setTimeout(() => {
                // Flip cards back
                firstCard.element.querySelector('.card-inner').style.transform = '';
                secondCard.element.querySelector('.card-inner').style.transform = '';
                
                this.cards[firstCard.index].flipped = false;
                this.cards[secondCard.index].flipped = false;
                
                this.resetFlippedCards();
            }, 1000);
        }
    }
    
    resetFlippedCards() {
        this.flippedCards = [];
        this.isLocked = false;
    }
    
    endGame() {
        this.stopTimer();
        
        // Create and display win message
        const winMessage = document.createElement('div');
        winMessage.className = 'win-message';
        winMessage.innerHTML = `
            <div class="win-content">
                <h3>Congratulations!</h3>
                <p>You completed the game in ${this.moveCount} moves and ${this.timer} seconds.</p>
                <button id="play-again" class="btn btn-primary">Play Again</button>
            </div>
        `;
        
        // Style win message
        winMessage.style.position = 'fixed';
        winMessage.style.top = '0';
        winMessage.style.left = '0';
        winMessage.style.width = '100%';
        winMessage.style.height = '100%';
        winMessage.style.backgroundColor = 'rgba(0,0,0,0.7)';
        winMessage.style.display = 'flex';
        winMessage.style.alignItems = 'center';
        winMessage.style.justifyContent = 'center';
        winMessage.style.zIndex = '1000';
        
        const winContent = winMessage.querySelector('.win-content');
        winContent.style.backgroundColor = '#FFFFFF';
        winContent.style.padding = '30px';
        winContent.style.borderRadius = '10px';
        winContent.style.textAlign = 'center';
        
        document.body.appendChild(winMessage);
        
        // Add play again button click event
        document.getElementById('play-again').addEventListener('click', () => {
            document.body.removeChild(winMessage);
            this.restartGame();
        });
    }
    
    restartGame() {
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.moveCount = 0;
        this.isLocked = false;
        this.gameStarted = false;
        this.timer = 0;
        
        if (this.timerInterval) {
            this.stopTimer();
        }
        
        document.getElementById('move-count').textContent = '0';
        document.getElementById('timer').textContent = '0';
        
        this.setupCards();
        this.addEventListeners();
    }
    
    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Create container for demo game if it doesn't exist
    if (!document.getElementById('demo-game-container')) {
        const gameContainer = document.createElement('div');
        gameContainer.id = 'demo-game-container';
        gameContainer.style.padding = '40px 20px';
        gameContainer.style.backgroundColor = '#f5f9f5';
        gameContainer.style.borderRadius = '10px';
        gameContainer.style.marginBottom = '30px';
        document.getElementById('games').after(gameContainer);
    }
    
    // Initialize the memory game
    const game = new MemoryGame('demo-game-container');
});
