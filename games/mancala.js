class MancalaGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.coins = auth.getHighScore('mancala') || 100;
        this.pits = Array(14).fill(4); // 12 regular pits (6 each) + 2 stores (initially empty)
        this.pits[6] = 0; // Player's store
        this.pits[13] = 0; // AI's store
        this.currentPlayer = 0; // 0 for player, 1 for AI
        this.selectedPit = -1;
        this.gameOver = false;
        this.setupGame();
        this.setupControls();
        this.animate();
    }

    setupGame() {
        this.canvas.style.display = 'block';
        this.canvas.width = 800;
        this.canvas.height = 400;
    }

    setupControls() {
        this.canvas.addEventListener('click', (e) => {
            if (this.gameOver || this.currentPlayer === 1) return;
            
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            this.handleClick(x, y);
        });

        this.container = document.createElement('div');
        this.container.className = 'mancala-controls';
        
        this.scoreDisplay = document.createElement('div');
        this.scoreDisplay.className = 'score-display';
        this.updateScoreDisplay();
        
        const newGameButton = document.createElement('button');
        newGameButton.className = 'glass-button';
        newGameButton.textContent = 'New Game';
        newGameButton.onclick = () => this.resetGame();

        this.container.appendChild(this.scoreDisplay);
        this.container.appendChild(newGameButton);
        this.canvas.parentNode.insertBefore(this.container, this.canvas);
    }

    resetGame() {
        this.pits = Array(14).fill(4);
        this.pits[6] = 0;
        this.pits[13] = 0;
        this.currentPlayer = 0;
        this.selectedPit = -1;
        this.gameOver = false;
    }

    handleClick(x, y) {
        const pitWidth = 80;
        const pitHeight = 100;
        const startX = 160;
        const playerY = 250;
        
        // Check player's pits (0-5)
        for (let i = 0; i < 6; i++) {
            const pitX = startX + i * pitWidth;
            if (x >= pitX && x < pitX + pitWidth &&
                y >= playerY && y < playerY + pitHeight) {
                if (this.pits[i] > 0) {
                    this.makeMove(i);
                }
                break;
            }
        }
    }

    makeMove(pit) {
        let stones = this.pits[pit];
        this.pits[pit] = 0;
        let currentPit = pit;
        
        while (stones > 0) {
            currentPit = (currentPit + 1) % 14;
            // Skip opponent's store
            if ((this.currentPlayer === 0 && currentPit === 13) ||
                (this.currentPlayer === 1 && currentPit === 6)) {
                continue;
            }
            this.pits[currentPit]++;
            stones--;
        }

        // Check for capture
        if (this.currentPlayer === 0 && currentPit < 6 && 
            this.pits[currentPit] === 1 && this.pits[12 - currentPit] > 0) {
            this.pits[6] += this.pits[12 - currentPit] + 1;
            this.pits[currentPit] = 0;
            this.pits[12 - currentPit] = 0;
        }

        // Check if game is over
        if (this.checkGameOver()) {
            this.endGame();
            return;
        }

        // Switch turns unless ended in store
        if (currentPit !== 6) {
            this.currentPlayer = 1;
            setTimeout(() => this.aiMove(), 1000);
        }
    }

    aiMove() {
        if (this.gameOver) return;

        // Simple AI: choose the pit with most stones
        let bestPit = 7;
        let maxStones = 0;
        for (let i = 7; i < 13; i++) {
            if (this.pits[i] > maxStones) {
                maxStones = this.pits[i];
                bestPit = i;
            }
        }

        if (maxStones > 0) {
            let stones = this.pits[bestPit];
            this.pits[bestPit] = 0;
            let currentPit = bestPit;

            while (stones > 0) {
                currentPit = (currentPit + 1) % 14;
                if (currentPit === 6) continue; // Skip player's store
                this.pits[currentPit]++;
                stones--;
            }

            // Check for capture
            if (currentPit >= 7 && currentPit < 13 && 
                this.pits[currentPit] === 1 && this.pits[12 - currentPit] > 0) {
                this.pits[13] += this.pits[12 - currentPit] + 1;
                this.pits[currentPit] = 0;
                this.pits[12 - currentPit] = 0;
            }

            if (this.checkGameOver()) {
                this.endGame();
                return;
            }

            // Switch turns unless ended in store
            if (currentPit !== 13) {
                this.currentPlayer = 0;
            } else {
                setTimeout(() => this.aiMove(), 1000);
            }
        } else {
            this.currentPlayer = 0;
        }
    }

    checkGameOver() {
        let playerEmpty = true;
        let aiEmpty = true;

        for (let i = 0; i < 6; i++) {
            if (this.pits[i] > 0) playerEmpty = false;
        }
        for (let i = 7; i < 13; i++) {
            if (this.pits[i] > 0) aiEmpty = false;
        }

        return playerEmpty || aiEmpty;
    }

    endGame() {
        // Collect remaining stones
        let playerSum = 0;
        let aiSum = 0;

        for (let i = 0; i < 6; i++) {
            playerSum += this.pits[i];
            this.pits[i] = 0;
        }
        for (let i = 7; i < 13; i++) {
            aiSum += this.pits[i];
            this.pits[i] = 0;
        }

        this.pits[6] += playerSum;
        this.pits[13] += aiSum;

        this.gameOver = true;

        // Update score
        const finalScore = this.pits[6];
        if (finalScore > this.coins) {
            this.coins = finalScore;
            auth.saveScore('mancala', this.coins);
            this.updateScoreDisplay();
        }
    }

    updateScoreDisplay() {
        this.scoreDisplay.textContent = `High Score: ${this.coins}`;
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw board background
        this.ctx.fillStyle = 'rgba(139, 69, 19, 0.5)';
        this.ctx.fillRect(100, 50, 600, 300);
        
        // Draw pits
        const pitRadius = 35;
        const startX = 160;
        const aiY = 100;
        const playerY = 250;
        
        // Draw stores
        this.ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
        this.ctx.beginPath();
        this.ctx.ellipse(120, 175, 40, 80, 0, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.ellipse(680, 175, 40, 80, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw store counts
        this.ctx.fillStyle = 'white';
        this.ctx.font = '24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(this.pits[6].toString(), 120, 175);
        this.ctx.fillText(this.pits[13].toString(), 680, 175);
        
        // Draw regular pits
        for (let i = 0; i < 6; i++) {
            // Player's pits
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            if (this.currentPlayer === 0 && !this.gameOver) {
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            }
            this.ctx.beginPath();
            this.ctx.arc(startX + i * 80, playerY, pitRadius, 0, Math.PI * 2);
            this.ctx.fill();
            
            // AI's pits
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            if (this.currentPlayer === 1 && !this.gameOver) {
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            }
            this.ctx.beginPath();
            this.ctx.arc(startX + (5-i) * 80, aiY, pitRadius, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Draw stone counts
            this.ctx.fillStyle = 'white';
            this.ctx.fillText(this.pits[i].toString(), startX + i * 80, playerY + 10);
            this.ctx.fillText(this.pits[12-i].toString(), startX + (5-i) * 80, aiY + 10);
        }
        
        // Draw game status
        this.ctx.fillStyle = 'white';
        this.ctx.font = '20px Arial';
        if (this.gameOver) {
            const winner = this.pits[6] > this.pits[13] ? 'Player Wins!' : 
                          this.pits[6] < this.pits[13] ? 'AI Wins!' : 'Tie Game!';
            this.ctx.fillText(winner, 400, 30);
        } else {
            this.ctx.fillText(this.currentPlayer === 0 ? 'Your Turn' : 'AI Turn', 400, 30);
        }
    }

    animate = () => {
        this.draw();
        this.animationFrame = requestAnimationFrame(this.animate);
    }

    destroy() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        if (this.container) {
            this.container.remove();
        }
        this.canvas.style.display = 'none';
    }
}