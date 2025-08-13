// Professional Pong Game - Advanced JavaScript Engine
class PongGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Game state
        this.gameState = 'menu'; // menu, playing, paused, gameOver
        this.gameMode = 'single'; // single, two-player
        this.difficulty = 'medium'; // easy, medium, hard
        this.isRunning = false;
        this.animationId = null;
        
        // Game settings
        this.settings = {
            soundEnabled: true,
            ballSpeed: 'normal', // normal, fast, very-fast
            paddleSize: 'normal' // small, normal, large
        };
        
        // Scoring
        this.scores = { player1: 0, player2: 0 };
        this.winningScore = 11;
        
        // Game objects
        this.ball = null;
        this.paddle1 = null; // Left paddle (player)
        this.paddle2 = null; // Right paddle (AI or player 2)
        
        // Input handling
        this.mouseY = 0;
        this.keys = {};
        
        // AI system
        this.aiController = new AIController();
        
        // Initialize
        this.initializeGame();
        this.setupEventListeners();
    }
    
    initializeGame() {
        // Get canvas dimensions
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = 800;
        this.canvas.height = 400;
        
        // Initialize game objects
        this.createGameObjects();
    }
    
    createGameObjects() {
        // Create ball
        this.ball = new Ball(
            this.canvas.width / 2,
            this.canvas.height / 2,
            this.getBallSpeed(),
            this.canvas
        );
        
        // Create paddles
        const paddleHeight = this.getPaddleHeight();
        this.paddle1 = new Paddle(
            30,
            this.canvas.height / 2 - paddleHeight / 2,
            10,
            paddleHeight,
            'player',
            this.canvas
        );
        
        this.paddle2 = new Paddle(
            this.canvas.width - 40,
            this.canvas.height / 2 - paddleHeight / 2,
            10,
            paddleHeight,
            this.gameMode === 'single' ? 'ai' : 'player',
            this.canvas
        );
    }
    
    getBallSpeed() {
        const speeds = {
            'normal': 5,
            'fast': 7,
            'very-fast': 9
        };
        return speeds[this.settings.ballSpeed] || 5;
    }
    
    getPaddleHeight() {
        const sizes = {
            'small': 60,
            'normal': 80,
            'large': 100
        };
        return sizes[this.settings.paddleSize] || 80;
    }
    
    setupEventListeners() {
        // Mouse movement
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouseY = e.clientY - rect.top;
        });
        
        // Keyboard events
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            
            // Game controls
            if (e.key === 'Escape') {
                if (this.gameState === 'playing') {
                    this.pauseGame();
                } else if (this.gameState === 'paused') {
                    this.resumeGame();
                }
            }
            
            if (e.key === 'Enter' && this.gameState === 'gameOver') {
                this.restartGame();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
        
        // Prevent context menu on canvas
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }
    
    startGame(mode, difficulty = 'medium') {
        this.gameMode = mode;
        this.difficulty = difficulty;
        this.gameState = 'playing';
        this.isRunning = true;
        
        // Reset scores
        this.scores = { player1: 0, player2: 0 };
        this.updateScoreDisplay();
        
        // Update UI
        document.getElementById('gameMode').textContent = 
            mode === 'single' ? 'VS COMPUTER' : 'TWO PLAYERS';
        document.getElementById('difficultyDisplay').textContent = 
            mode === 'single' ? difficulty.toUpperCase() : '';
        document.getElementById('player2Name').textContent = 
            mode === 'single' ? 'COMPUTER' : 'PLAYER 2';
        
        // Recreate game objects with current settings
        this.createGameObjects();
        
        // Set AI difficulty
        if (mode === 'single') {
            this.aiController.setDifficulty(difficulty);
        }
        
        // Show game screen
        this.showGameScreen();
        
        // Start game loop
        this.gameLoop();
    }
    
    gameLoop() {
        if (!this.isRunning) return;
        
        this.update();
        this.render();
        
        this.animationId = requestAnimationFrame(() => this.gameLoop());
    }
    
    update() {
        if (this.gameState !== 'playing') return;
        
        // Update ball
        this.ball.update();
        
        // Update paddles
        this.updatePaddle1(); // Player 1 (mouse control)
        this.updatePaddle2(); // Player 2 or AI
        
        // Check collisions
        this.checkCollisions();
        
        // Check scoring
        this.checkScoring();
    }
    
    updatePaddle1() {
        // Mouse control for player 1
        const targetY = this.mouseY - this.paddle1.height / 2;
        this.paddle1.moveTo(targetY);
    }
    
    updatePaddle2() {
        if (this.gameMode === 'single') {
            // AI control
            const aiMove = this.aiController.calculateMove(
                this.ball, 
                this.paddle2, 
                this.difficulty
            );
            this.paddle2.moveBy(aiMove);
        } else {
            // Player 2 control (W/S keys)
            const moveSpeed = 8;
            if (this.keys['w']) {
                this.paddle2.moveBy(-moveSpeed);
            }
            if (this.keys['s']) {
                this.paddle2.moveBy(moveSpeed);
            }
        }
    }
    
    checkCollisions() {
        // Ball-paddle collisions
        this.checkPaddleCollision(this.paddle1);
        this.checkPaddleCollision(this.paddle2);
        
        // Ball-wall collisions
        this.ball.checkWallCollisions();
    }
    
    checkPaddleCollision(paddle) {
        if (this.ball.x - this.ball.radius <= paddle.x + paddle.width &&
            this.ball.x + this.ball.radius >= paddle.x &&
            this.ball.y - this.ball.radius <= paddle.y + paddle.height &&
            this.ball.y + this.ball.radius >= paddle.y) {
            
            // Calculate collision point for spin effect
            const collisionPoint = (this.ball.y - (paddle.y + paddle.height / 2)) / (paddle.width / 2);
            
            // Reverse horizontal velocity
            this.ball.velocityX = -this.ball.velocityX;
            
            // Add spin based on collision point
            this.ball.velocityY += collisionPoint * 2;
            
            // Increase speed slightly
            this.ball.velocityX *= 1.05;
            this.ball.velocityY *= 1.05;
            
            // Limit maximum velocity
            const maxVelocity = 12;
            this.ball.velocityX = Math.max(-maxVelocity, Math.min(maxVelocity, this.ball.velocityX));
            this.ball.velocityY = Math.max(-maxVelocity, Math.min(maxVelocity, this.ball.velocityY));
            
            // Move ball away from paddle to prevent sticking
            if (paddle === this.paddle1) {
                this.ball.x = paddle.x + paddle.width + this.ball.radius;
            } else {
                this.ball.x = paddle.x - this.ball.radius;
            }
            
            this.playSound('paddle');
        }
    }
    
    checkScoring() {
        // Player 2 scores (ball goes off left side)
        if (this.ball.x < 0) {
            this.scores.player2++;
            this.resetBall();
            this.playSound('score');
        }
        
        // Player 1 scores (ball goes off right side)
        if (this.ball.x > this.canvas.width) {
            this.scores.player1++;
            this.resetBall();
            this.playSound('score');
        }
        
        // Update score display
        this.updateScoreDisplay();
        
        // Check win condition
        if (this.scores.player1 >= this.winningScore || this.scores.player2 >= this.winningScore) {
            this.endGame();
        }
    }
    
    resetBall() {
        this.ball.reset();
        
        // Brief pause before ball starts moving
        setTimeout(() => {
            this.ball.velocityX = (Math.random() > 0.5 ? 1 : -1) * this.getBallSpeed();
            this.ball.velocityY = (Math.random() - 0.5) * 4;
        }, 1000);
    }
    
    render() {
        // Clear canvas
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw center line
        this.drawCenterLine();
        
        // Draw game objects
        this.ball.draw(this.ctx);
        this.paddle1.draw(this.ctx);
        this.paddle2.draw(this.ctx);
        
        // Draw particle effects
        this.drawParticleEffects();
    }
    
    drawCenterLine() {
        this.ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([10, 10]);
        this.ctx.beginPath();
        this.ctx.moveTo(this.canvas.width / 2, 0);
        this.ctx.lineTo(this.canvas.width / 2, this.canvas.height);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }
    
    drawParticleEffects() {
        // Add trail effect to ball
        this.ctx.shadowColor = '#00ffff';
        this.ctx.shadowBlur = 10;
        
        // Reset shadow for other elements
        this.ctx.shadowBlur = 0;
    }
    
    updateScoreDisplay() {
        document.getElementById('player1Score').textContent = this.scores.player1;
        document.getElementById('player2Score').textContent = this.scores.player2;
    }
    
    pauseGame() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
            this.isRunning = false;
            this.showPauseScreen();
        }
    }
    
    resumeGame() {
        if (this.gameState === 'paused') {
            this.gameState = 'playing';
            this.isRunning = true;
            this.hidePauseScreen();
            this.gameLoop();
        }
    }
    
    endGame() {
        this.gameState = 'gameOver';
        this.isRunning = false;
        
        const winner = this.scores.player1 >= this.winningScore ? 1 : 2;
        const winnerName = winner === 1 ? 'Player 1' : 
                          (this.gameMode === 'single' ? 'Computer' : 'Player 2');
        
        this.showGameOverScreen(winnerName, winner);
    }
    
    restartGame() {
        this.startGame(this.gameMode, this.difficulty);
        this.hideGameOverScreen();
    }
    
    // UI Management
    showGameScreen() {
        this.hideAllScreens();
        document.getElementById('gameScreen').classList.remove('hidden');
    }
    
    showPauseScreen() {
        document.getElementById('pauseScreen').classList.remove('hidden');
    }
    
    hidePauseScreen() {
        document.getElementById('pauseScreen').classList.add('hidden');
    }
    
    showGameOverScreen(winner, winnerNumber) {
        document.getElementById('gameOverTitle').textContent = 
            winnerNumber === 1 ? 'YOU WIN!' : (this.gameMode === 'single' ? 'GAME OVER' : 'PLAYER 2 WINS!');
        document.getElementById('gameOverText').textContent = 
            `${winner} wins ${this.scores.player1}-${this.scores.player2}!`;
        document.getElementById('gameOverScreen').classList.remove('hidden');
    }
    
    hideGameOverScreen() {
        document.getElementById('gameOverScreen').classList.add('hidden');
    }
    
    hideAllScreens() {
        const screens = ['mainMenu', 'gameModeMenu', 'difficultyMenu', 'instructionsMenu', 'settingsMenu'];
        screens.forEach(screen => {
            document.getElementById(screen).classList.add('hidden');
        });
    }
    
    playSound(type) {
        if (!this.settings.soundEnabled) return;
        
        // Create audio context for sound effects
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        switch (type) {
            case 'paddle':
                oscillator.frequency.setValueAtTime(200, audioCtx.currentTime);
                gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
                break;
            case 'wall':
                oscillator.frequency.setValueAtTime(150, audioCtx.currentTime);
                gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
                break;
            case 'score':
                oscillator.frequency.setValueAtTime(400, audioCtx.currentTime);
                gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
                break;
        }
        
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.3);
    }
}

// Ball class with advanced physics
class Ball {
    constructor(x, y, speed, canvas) {
        this.canvas = canvas;
        this.startX = x;
        this.startY = y;
        this.x = x;
        this.y = y;
        this.radius = 8;
        this.speed = speed;
        this.velocityX = (Math.random() > 0.5 ? 1 : -1) * speed;
        this.velocityY = (Math.random() - 0.5) * 4;
        this.trail = [];
    }
    
    update() {
        // Update position
        this.x += this.velocityX;
        this.y += this.velocityY;
        
        // Add to trail
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > 10) {
            this.trail.shift();
        }
    }
    
    checkWallCollisions() {
        // Top and bottom walls
        if (this.y - this.radius <= 0 || this.y + this.radius >= this.canvas.height) {
            this.velocityY = -this.velocityY;
            this.y = this.y - this.radius <= 0 ? this.radius : this.canvas.height - this.radius;
            
            // Play wall sound
            if (window.game) {
                window.game.playSound('wall');
            }
        }
    }
    
    draw(ctx) {
        // Draw trail
        ctx.globalAlpha = 0.3;
        for (let i = 0; i < this.trail.length; i++) {
            const alpha = i / this.trail.length;
            ctx.globalAlpha = alpha * 0.3;
            ctx.fillStyle = '#00ffff';
            ctx.beginPath();
            ctx.arc(this.trail[i].x, this.trail[i].y, this.radius * alpha, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Draw ball
        ctx.globalAlpha = 1;
        const gradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, this.radius
        );
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(0.7, '#00ffff');
        gradient.addColorStop(1, '#0080ff');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Add glow effect
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }
    
    reset() {
        this.x = this.startX;
        this.y = this.startY;
        this.velocityX = 0;
        this.velocityY = 0;
        this.trail = [];
    }
}

// Paddle class
class Paddle {
    constructor(x, y, width, height, type, canvas) {
        this.canvas = canvas;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.type = type; // 'player', 'ai'
        this.speed = 8;
    }
    
    moveTo(targetY) {
        const newY = Math.max(0, Math.min(this.canvas.height - this.height, targetY));
        this.y = newY;
    }
    
    moveBy(deltaY) {
        this.moveTo(this.y + deltaY);
    }
    
    draw(ctx) {
        // Create gradient
        const gradient = ctx.createLinearGradient(this.x, this.y, this.x + this.width, this.y + this.height);
        gradient.addColorStop(0, '#00ffff');
        gradient.addColorStop(0.5, '#ffffff');
        gradient.addColorStop(1, '#00ffff');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Add glow effect
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 10;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.shadowBlur = 0;
    }
}

// AI Controller with different difficulty levels
class AIController {
    constructor() {
        this.difficulty = 'medium';
        this.reactionTime = 0;
        this.accuracy = 0.8;
        this.speed = 1;
        this.lastUpdate = 0;
    }
    
    setDifficulty(difficulty) {
        this.difficulty = difficulty;
        
        switch (difficulty) {
            case 'easy':
                this.reactionTime = 200; // ms delay
                this.accuracy = 0.6;
                this.speed = 0.7;
                break;
            case 'medium':
                this.reactionTime = 100;
                this.accuracy = 0.8;
                this.speed = 1.0;
                break;
            case 'hard':
                this.reactionTime = 50;
                this.accuracy = 0.95;
                this.speed = 1.3;
                break;
        }
    }
    
    calculateMove(ball, paddle, difficulty) {
        const now = Date.now();
        
        // Apply reaction time delay
        if (now - this.lastUpdate < this.reactionTime) {
            return 0;
        }
        this.lastUpdate = now;
        
        // Predict ball position
        const predictedY = this.predictBallPosition(ball, paddle);
        
        // Add inaccuracy based on difficulty
        const targetY = predictedY + (Math.random() - 0.5) * (1 - this.accuracy) * 100;
        
        // Calculate desired paddle center
        const paddleCenter = paddle.y + paddle.height / 2;
        const difference = targetY - paddleCenter;
        
        // Apply speed multiplier
        const moveAmount = Math.sign(difference) * Math.min(Math.abs(difference), paddle.speed * this.speed);
        
        return moveAmount;
    }
    
    predictBallPosition(ball, paddle) {
        // Simple prediction based on current ball trajectory
        const timeToReachPaddle = (paddle.x - ball.x) / ball.velocityX;
        
        if (timeToReachPaddle <= 0) {
            return ball.y;
        }
        
        let predictedY = ball.y + ball.velocityY * timeToReachPaddle;
        
        // Account for wall bounces
        while (predictedY < 0 || predictedY > ball.canvas.height) {
            if (predictedY < 0) {
                predictedY = -predictedY;
            }
            if (predictedY > ball.canvas.height) {
                predictedY = 2 * ball.canvas.height - predictedY;
            }
        }
        
        return predictedY;
    }
}

// Menu system functions
function showMainMenu() {
    hideAllScreens();
    document.getElementById('mainMenu').classList.remove('hidden');
    
    // Stop game if running
    if (window.game) {
        window.game.isRunning = false;
        if (window.game.animationId) {
            cancelAnimationFrame(window.game.animationId);
        }
    }
}

function showGameModeMenu() {
    hideAllScreens();
    document.getElementById('gameModeMenu').classList.remove('hidden');
}

function showInstructions() {
    hideAllScreens();
    document.getElementById('instructionsMenu').classList.remove('hidden');
}

function showSettings() {
    hideAllScreens();
    document.getElementById('settingsMenu').classList.remove('hidden');
}

function selectGameMode(mode) {
    if (mode === 'single') {
        hideAllScreens();
        document.getElementById('difficultyMenu').classList.remove('hidden');
        
        // Add difficulty selection listeners
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.onclick = () => startGame(mode, btn.dataset.difficulty);
        });
    } else {
        startGame(mode);
    }
}

function startGame(mode, difficulty = 'medium') {
    if (!window.game) {
        window.game = new PongGame();
    }
    window.game.startGame(mode, difficulty);
}

function pauseGame() {
    if (window.game) {
        window.game.pauseGame();
    }
}

function resumeGame() {
    if (window.game) {
        window.game.resumeGame();
    }
}

function endGame() {
    if (window.game) {
        window.game.isRunning = false;
        if (window.game.animationId) {
            cancelAnimationFrame(window.game.animationId);
        }
    }
    showMainMenu();
}

function restartGame() {
    if (window.game) {
        window.game.restartGame();
    }
}

function hideAllScreens() {
    const screens = document.querySelectorAll('.menu-screen, .overlay-screen');
    screens.forEach(screen => screen.classList.add('hidden'));
}

// Settings functions
function toggleSound() {
    const btn = document.getElementById('soundToggle');
    const isOn = btn.textContent === 'ON';
    btn.textContent = isOn ? 'OFF' : 'ON';
    
    if (window.game) {
        window.game.settings.soundEnabled = !isOn;
    }
}

function changeBallSpeed() {
    const select = document.getElementById('ballSpeedSelect');
    if (window.game) {
        window.game.settings.ballSpeed = select.value;
    }
}

function changePaddleSize() {
    const select = document.getElementById('paddleSizeSelect');
    if (window.game) {
        window.game.settings.paddleSize = select.value;
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.game = new PongGame();
});