class SlotMachine {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.coins = auth.getHighScore('slot') || 100;
        this.reels = [];
        this.spinning = false;
        this.symbols = ['🍒', '🍋', '💎', '7️⃣', '🎰'];
        this.payouts = {
            '🍒': 2,
            '🍋': 3,
            '💎': 5,
            '7️⃣': 7,
            '🎰': 10
        };
        this.setupGame();
        this.setupControls();
        this.animate();
    }

    setupGame() {
        this.canvas.style.display = 'block';
        this.canvas.width = 800;
        this.canvas.height = 600;

        // Create reels
        for (let i = 0; i < 3; i++) {
            this.reels.push({
                symbols: this.generateReelSymbols(),
                position: 0,
                targetPosition: 0,
                speed: 0,
                spinning: false
            });
        }
    }

    generateReelSymbols() {
        const symbols = [];
        for (let i = 0; i < 20; i++) {
            symbols.push(this.symbols[Math.floor(Math.random() * this.symbols.length)]);
        }
        return symbols;
    }

    setupControls() {
        this.container = document.createElement('div');
        this.container.className = 'slot-controls';
        
        this.scoreDisplay = document.createElement('div');
        this.scoreDisplay.className = 'score-display';
        this.updateScoreDisplay();
        
        const spinButton = document.createElement('button');
        spinButton.className = 'glass-button';
        spinButton.textContent = 'Spin (1 coin)';
        spinButton.onclick = () => this.spin();

        const payoutTable = document.createElement('div');
        payoutTable.className = 'payout-table';
        payoutTable.innerHTML = `
            <h3>Payouts</h3>
            ${Object.entries(this.payouts)
                .map(([symbol, payout]) => `
                    <div>${symbol} x3: ${payout}x</div>
                `).join('')}
        `;

        this.container.appendChild(this.scoreDisplay);
        this.container.appendChild(spinButton);
        this.container.appendChild(payoutTable);
        this.canvas.parentNode.insertBefore(this.container, this.canvas);
    }

    updateScoreDisplay() {
        this.scoreDisplay.textContent = `Coins: ${this.coins}`;
        auth.saveScore('slot', this.coins);
    }

    spin() {
        if (this.spinning || this.coins <= 0) {
            if (this.coins <= 0) alert('Out of coins!');
            return;
        }

        this.coins--;
        this.updateScoreDisplay();
        this.spinning = true;

        // Set up spinning animation for each reel
        this.reels.forEach((reel, i) => {
            reel.spinning = true;
            reel.speed = 20 + i * 5;
            reel.targetPosition = reel.position + 
                (50 + i * 20 + Math.random() * 20);
        });

        // Check results after all reels stop
        setTimeout(() => this.checkWin(), 2000 + this.reels.length * 500);
    }

    checkWin() {
        const results = this.reels.map(reel => {
            const symbolIndex = Math.floor(reel.position) % reel.symbols.length;
            return reel.symbols[symbolIndex];
        });

        // Check for three of a kind
        if (results[0] === results[1] && results[1] === results[2]) {
            const winnings = this.payouts[results[0]] * this.coins;
            this.coins += winnings;
            this.showWinnings(this.canvas.width / 2, this.canvas.height / 2, winnings);
        }

        this.spinning = false;
        this.updateScoreDisplay();
    }

    showWinnings(x, y, amount) {
        const popup = document.createElement('div');
        popup.textContent = `+${amount}`;
        popup.style.position = 'absolute';
        popup.style.left = `${x + this.canvas.offsetLeft}px`;
        popup.style.top = `${y + this.canvas.offsetTop}px`;
        popup.style.color = '#66a3ff';
        popup.style.fontSize = '20px';
        popup.style.pointerEvents = 'none';
        popup.style.animation = 'fadeUp 1s ease-out';
        document.body.appendChild(popup);
        setTimeout(() => popup.remove(), 1000);
    }

    update() {
        this.reels.forEach(reel => {
            if (reel.spinning) {
                if (reel.position >= reel.targetPosition) {
                    reel.spinning = false;
                    reel.position = reel.targetPosition;
                } else {
                    reel.position += reel.speed;
                    reel.speed *= 0.98;
                }
            }
        });
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw slot machine frame
        this.ctx.fillStyle = 'rgba(102, 163, 255, 0.2)';
        this.ctx.fillRect(200, 200, 400, 200);
        
        // Draw reels
        this.reels.forEach((reel, i) => {
            const x = 250 + i * 120;
            const y = 300;
            
            // Draw visible symbols
            for (let j = -1; j <= 1; j++) {
                const symbolIndex = Math.floor(reel.position + j) % reel.symbols.length;
                const symbol = reel.symbols[symbolIndex >= 0 ? symbolIndex : reel.symbols.length + symbolIndex];
                this.ctx.font = '48px Arial';
                this.ctx.fillStyle = '#fff';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(symbol, x, y + j * 60);
            }
        });
    }

    animate = () => {
        this.update();
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