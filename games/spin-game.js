class SpinGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.coins = auth.getHighScore('spin') || 100;
        this.currentBet = 10;
        this.selectedNumbers = new Set();
        this.maxSelections = 3;
        this.winningHistory = [];
        this.picksHistory = [];
        this.maxHistory = 10; // Keep last 10 entries
        this.setupGame();
    }

    setupGame() {
        this.canvas.style.display = 'none';
        
        this.container = document.createElement('div');
        this.container.className = 'spin-game-container';
        
        this.container.innerHTML = `
            <h1 class="header">SPIN-GAME</h1>
            
            <div class="score-display">Coins: ${this.coins}</div>
            <div class="selections-display">Selected Numbers: <span class="selected-numbers"></span></div>

            <div class="game-layout">
                <div class="history-table winning-history">
                    <h2>Winning Numbers</h2>
                    <div class="history-content"></div>
                </div>

                <div class="main-game">
                    <table class="spin-table">
                        <tr>
                            <td><button class="glass-button game-button" data-number="1">1</button></td>
                            <td><button class="glass-button game-button" data-number="2">2</button></td>
                            <td><button class="glass-button game-button" data-number="3">3</button></td>
                            <td><button class="glass-button game-button" data-number="4">4</button></td>
                        </tr>
                        <tr>
                            <td><button id="half-button" class="glass-button control-button">1/2</button></td>
                            <td colspan="2" class="game-machine">
                                <button id="spin-button" class="glass-button spin-button">SPIN</button>
                            </td>
                            <td><button id="double-button" class="glass-button control-button">*2</button></td>
                        </tr>
                        <tr>
                            <td><button class="glass-button game-button" data-number="7">7</button></td>
                            <td><button class="glass-button game-button" data-number="8">8</button></td>
                            <td><button class="glass-button game-button" data-number="9">9</button></td>
                            <td><button class="glass-button game-button" data-number="10">10</button></td>
                        </tr>
                    </table>

                    <div class="bet-display">Current Bet: ${this.currentBet}</div>
                </div>

                <div class="history-table picks-history">
                    <h2>Previous Picks</h2>
                    <div class="history-content"></div>
                </div>
            </div>
        `;

        this.canvas.parentNode.insertBefore(this.container, this.canvas);
        this.setupEventListeners();
        this.addStyles();
        this.updateHistoryTables();
    }

    setupEventListeners() {
        this.container.querySelectorAll('.game-button').forEach(button => {
            button.addEventListener('click', () => {
                const number = parseInt(button.dataset.number);
                this.toggleNumber(number, button);
            });
        });

        this.container.querySelector('#spin-button').addEventListener('click', () => {
            if (this.selectedNumbers.size > 0) {
                this.startGame();
            } else {
                alert('Please select at least one number');
            }
        });

        this.container.querySelectorAll('.control-button').forEach(button => {
            button.addEventListener('click', () => {
                if (button.id === 'half-button') {
                    this.currentBet = Math.max(1, Math.floor(this.currentBet / 2));
                    this.updateBetDisplay();
                } else if (button.id === 'double-button') {
                    this.currentBet = Math.min(this.coins, this.currentBet * 2);
                    this.updateBetDisplay();
                }
            });
        });
    }

    toggleNumber(number, button) {
        if (this.selectedNumbers.has(number)) {
            this.selectedNumbers.delete(number);
            button.classList.remove('selected');
        } else if (this.selectedNumbers.size < this.maxSelections) {
            this.selectedNumbers.add(number);
            button.classList.add('selected');
        } else {
            alert(`Maximum ${this.maxSelections} numbers can be selected`);
        }
        this.updateSelectedNumbersDisplay();
    }

    updateSelectedNumbersDisplay() {
        const display = this.container.querySelector('.selected-numbers');
        display.textContent = Array.from(this.selectedNumbers).join(', ') || 'None';
    }

    updateBetDisplay() {
        const betDisplay = this.container.querySelector('.bet-display');
        betDisplay.textContent = `Current Bet: ${this.currentBet}`;
    }

    updateCoins(amount) {
        this.coins = amount;
        this.container.querySelector('.score-display').textContent = `Coins: ${this.coins}`;
        auth.saveScore('spin', this.coins);
    }

    startGame() {
        const totalBet = this.currentBet * this.selectedNumbers.size;
        if (this.coins < totalBet) {
            alert('Not enough coins!');
            return;
        }

        this.disableButtons();
        this.updateCoins(this.coins - totalBet);
        this.startGameAnimation();
    }

    startGameAnimation() {
        const buttons = Array.from(this.container.querySelectorAll('.game-button'));
        const gameButtons = buttons.filter(btn => btn.dataset.number);
        const duration = 3125; // 2.5 seconds + 25% slower
        const stepDuration = duration / (gameButtons.length * 3); // Complete 3 cycles
        let currentIndex = gameButtons.length - 1;
        let cycles = 0;
        let rotationAngle = 0;

        gameButtons.forEach(btn => {
            btn.classList.remove('highlight', 'rolling', 'spinning');
            const existingBg = btn.querySelector('.spinning-background');
            if (existingBg) existingBg.remove();
        });
        
        const createSpinningBackground = (button) => {
            const bg = document.createElement('div');
            bg.className = 'spinning-background';
            button.appendChild(bg);
            return bg;
        };
        
        const animate = () => {
            gameButtons.forEach(btn => {
                btn.classList.remove('highlight', 'rolling', 'spinning');
                const bg = btn.querySelector('.spinning-background');
                if (bg) bg.remove();
            });
            
            const currentButton = gameButtons[currentIndex];
            currentButton.classList.add('highlight', 'spinning');
            const spinningBg = createSpinningBackground(currentButton);
            rotationAngle += 30;
            spinningBg.style.transform = `rotate(${rotationAngle}deg)`;
            
            const prevIndex = (currentIndex - 1 + gameButtons.length) % gameButtons.length;
            const nextIndex = (currentIndex + 1) % gameButtons.length;
            
            [prevIndex, nextIndex].forEach(index => {
                const button = gameButtons[index];
                button.classList.add('rolling');
                const rollingBg = createSpinningBackground(button);
                rollingBg.style.transform = `rotate(${rotationAngle * 0.5}deg)`;
                rollingBg.style.opacity = '0.5';
            });
            
            currentIndex--;
            if (currentIndex < 0) {
                currentIndex = gameButtons.length - 1;
                cycles++;
            }

            if (cycles < 3) {
                setTimeout(animate, stepDuration);
            } else {
                this.finishGame();
            }
        };

        animate();
    }

    finishGame() {
        const randomNumber = Math.floor(Math.random() * 8) + 1;
        const winningNumber = randomNumber > 4 ? randomNumber + 2 : randomNumber;
        
        this.winningHistory.unshift(winningNumber);
        if (this.winningHistory.length > this.maxHistory) {
            this.winningHistory.pop();
        }

        this.picksHistory.unshift(Array.from(this.selectedNumbers));
        if (this.picksHistory.length > this.maxHistory) {
            this.picksHistory.pop();
        }

        this.updateHistoryTables();
        
        const winningButton = this.container.querySelector(`[data-number="${winningNumber}"]`);
        winningButton.classList.add('winner');
        
        setTimeout(() => {
            if (this.selectedNumbers.has(winningNumber)) {
                const winnings = this.currentBet * 10;
                this.updateCoins(this.coins + winnings);
                this.showWinnings(winnings);
            }
            
            setTimeout(() => {
                winningButton.classList.remove('winner');
                this.enableButtons();
                this.selectedNumbers.clear();
                this.container.querySelectorAll('.game-button').forEach(btn => {
                    btn.classList.remove('selected');
                });
                this.updateSelectedNumbersDisplay();
            }, 2000);
        }, 500);
    }

    updateHistoryTables() {
        const winningContent = this.container.querySelector('.winning-history .history-content');
        winningContent.innerHTML = this.winningHistory
            .map(num => `<div class="history-item winning">${num}</div>`)
            .join('');

        const picksContent = this.container.querySelector('.picks-history .history-content');
        picksContent.innerHTML = this.picksHistory
            .map(picks => `<div class="history-item picks">${picks.join(', ')}</div>`)
            .join('');
    }

    showWinnings(amount) {
        const popup = document.createElement('div');
        popup.textContent = `+${amount}`;
        popup.style.position = 'absolute';
        popup.style.left = '50%';
        popup.style.top = '50%';
        popup.style.transform = 'translate(-50%, -50%)';
        popup.style.color = '#66a3ff';
        popup.style.fontSize = '48px';
        popup.style.fontWeight = 'bold';
        popup.style.pointerEvents = 'none';
        popup.style.animation = 'fadeUp 2s ease-out';
        this.container.appendChild(popup);
        
        this.showConfettiAndFireworks();
        
        setTimeout(() => popup.remove(), 2000);
    }

    disableButtons() {
        this.container.querySelectorAll('button').forEach(button => {
            button.disabled = true;
        });
    }

    enableButtons() {
        this.container.querySelectorAll('button').forEach(button => {
            button.disabled = false;
        });
    }

    showConfettiAndFireworks() {
        const gameMachine = this.container.querySelector('.game-machine');
        const confetti = document.createElement('div');
        confetti.innerHTML = '🎉 🎉 🎉';
        confetti.className = 'confetti';
        
        const fireworks = document.createElement('div');
        fireworks.innerHTML = '🎆 🎆 🎆';
        fireworks.className = 'fireworks';
        
        gameMachine.appendChild(confetti);
        gameMachine.appendChild(fireworks);
        
        setTimeout(() => {
            confetti.remove();
            fireworks.remove();
        }, 5000);
    }

    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .spin-game-container {
                padding: 20px;
                color: white;
                text-align: center;
            }

            .header {
                font-size: 3em;
                color: goldenrod;
                margin-bottom: 20px;
            }

            .selections-display {
                font-size: 1.2em;
                margin: 10px 0;
                color: white;
            }

            .game-layout {
                display: grid;
                grid-template-columns: 200px 1fr 200px;
                gap: 20px;
                margin: 20px 0;
                align-items: start;
            }

            .history-table {
                background: var(--glass-bg);
                backdrop-filter: blur(10px);
                border-radius: 10px;
                padding: 15px;
                min-height: 300px;
            }

            .winning-history h2 {
                color: #ff00ff;
                text-shadow: 0 0 10px #ff00ff, 0 0 20px #ff00ff, 0 0 30px #ff00ff;
                text-align: center;
                margin: 0 0 15px 0;
                font-size: 1.2em;
            }

            .picks-history h2 {
                color: #00ffff;
                text-shadow: 0 0 10px #00ffff, 0 0 20px #00ffff, 0 0 30px #00ffff;
                text-align: center;
                margin: 0 0 15px 0;
                font-size: 1.2em;
            }

            .history-content {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }

            .history-item {
                padding: 8px;
                border-radius: 5px;
                text-align: center;
                font-weight: bold;
                animation: glow 1.5s ease-in-out infinite alternate;
            }

            .history-item.winning {
                background: rgba(255, 0, 255, 0.1);
                color: #ff00ff;
                text-shadow: 0 0 5px #ff00ff;
            }

            .history-item.picks {
                background: rgba(0, 255, 255, 0.1);
                color: #00ffff;
                text-shadow: 0 0 5px #00ffff;
            }

            @keyframes glow {
                from {
                    box-shadow: 0 0 5px rgba(255, 255, 255, 0.2);
                }
                to {
                    box-shadow: 0 0 10px rgba(255, 255, 255, 0.4);
                }
            }

            .spin-table {
                border-collapse: collapse;
                width: 80%;
                max-width: 800px;
                margin: 20px auto;
                background: var(--glass-bg);
                backdrop-filter: blur(10px);
                border-radius: 10px;
                overflow: hidden;
            }

            .spin-table td {
                border: 2px solid rgba(255, 215, 0, 0.3);
                padding: 10px;
                text-align: center;
            }

            .game-machine {
                background: rgba(255, 255, 255, 0.1);
                font-size: 1.2em;
                color: goldenrod;
            }

            .bet-display {
                font-size: 1.2em;
                margin: 20px 0;
                color: goldenrod;
            }

            .game-button {
                transition: all 0.3s ease;
                position: relative;
                overflow: hidden;
            }

            .game-button.selected {
                background: rgba(0, 255, 0, 0.3);
                border-color: rgba(0, 255, 0, 0.5);
            }

            .game-button.highlight {
                background: rgba(255, 215, 0, 0.5);
                transform: scale(1.1);
                box-shadow: 0 0 20px gold;
                z-index: 2;
            }

            .game-button.rolling {
                background: rgba(255, 215, 0, 0.2);
                transform: scale(1.05);
            }

            .game-button.spinning {
                animation: button-pulse 0.5s ease-in-out infinite;
            }

            .spinning-background {
                position: absolute;
                top: -50%;
                left: -50%;
                width: 200%;
                height: 200%;
                background: conic-gradient(
                    from 0deg,
                    transparent,
                    rgba(255, 215, 0, 0.2) 45deg,
                    rgba(255, 215, 0, 0.4) 90deg,
                    rgba(255, 215, 0, 0.2) 135deg,
                    transparent 180deg,
                    transparent
                );
                transition: transform 0.3s ease;
                pointer-events: none;
                z-index: -1;
            }

            @keyframes button-pulse {
                0% { transform: scale(1.1); }
                50% { transform: scale(1.15); }
                100% { transform: scale(1.1); }
            }

            .game-button.winner {
                animation: winner-pulse 0.5s ease-in-out infinite;
            }

            .spin-button {
                font-size: 1.2em;
                font-weight: bold;
                padding: 15px 30px;
                background: rgba(255, 215, 0, 0.2);
            }

            .spin-button:hover {
                background: rgba(255, 215, 0, 0.3);
                transform: scale(1.05);
            }

            @keyframes winner-pulse {
                0% { transform: scale(1); background: rgba(255, 215, 0, 0.5); }
                50% { transform: scale(1.2); background: rgba(255, 215, 0, 0.8); }
                100% { transform: scale(1); background: rgba(255, 215, 0, 0.5); }
            }

            .confetti {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                font-size: 2em;
                z-index: 10;
            }

            .fireworks {
                position: absolute;
                top: 20%;
                left: 50%;
                transform: translateX(-50%);
                font-size: 3em;
                z-index: 10;
            }
        `;
        document.head.appendChild(style);
    }

    destroy() {
        if (this.container) {
            this.container.remove();
        }
    }
}