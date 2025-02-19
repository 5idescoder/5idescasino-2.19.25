class KenoGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.selectedNumbers = new Set();
        this.currentBet = 1;
        this.minBet = 1;
        this.maxBet = 100;
        this.isAnimating = false;
        this.coins = auth.getHighScore('keno') || 100;
        this.matchCount = 0;
        this.difficulty = 'easy'; // Default difficulty
        this.isDevMode = auth.currentUser?.username?.toLowerCase() === 'admin';
        this.setupGame();
    }

    getDifficultyPayouts() {
        const payouts = {
            easy: {
                minMatches: 2,
                table: {
                    0: 0, 1: 0, 2: 2, 3: 3, 4: 5,
                    5: 10, 6: 20, 7: 50, 8: 150, 9: 300, 10: 1500
                }
            },
            medium: {
                minMatches: 3,
                table: {
                    0: 0, 1: 0, 2: 0, 3: 3, 4: 5,
                    5: 15, 6: 30, 7: 75, 8: 200, 9: 500, 10: 2000
                }
            },
            hard: {
                minMatches: 5,
                table: {
                    0: 0, 1: 0, 2: 0, 3: 0, 4: 0,
                    5: 20, 6: 50, 7: 100, 8: 300, 9: 1000, 10: 3000
                }
            }
        };
        return payouts[this.difficulty];
    }

    setupGame() {
        this.container = document.createElement('div');
        this.container.className = 'keno-container';
        this.canvas.style.display = 'none';
        this.canvas.parentNode.insertBefore(this.container, this.canvas);
        
        // Add betting controls
        const bettingControls = document.createElement('div');
        bettingControls.className = 'betting-controls';
        bettingControls.innerHTML = `
            <span class="bet-label">Bet Amount:</span>
            <div class="bet-input-group">
                <button class="bet-button" id="min-bet">Min</button>
                <button class="bet-button" id="half-bet">1/2</button>
                <input type="number" class="bet-input" id="bet-amount" value="${this.currentBet}" min="${this.minBet}" max="${this.maxBet}">
                <button class="bet-button" id="double-bet">x2</button>
                <button class="bet-button" id="max-bet">Max</button>
            </div>
        `;
        this.container.appendChild(bettingControls);
        
        // Add persistent points display
        const pointsDisplay = document.createElement('div');
        pointsDisplay.className = 'points-display';
        pointsDisplay.innerHTML = `
            <div class="points-content">
                <span class="points-label">Total Points:</span>
                <span class="points-value">${this.coins}</span>
            </div>
        `;
        document.body.appendChild(pointsDisplay);
        
        // Add dev panel if admin
        const devPanel = this.isDevMode ? `
            <div class="dev-panel">
                <h3>Dev Controls</h3>
                <div class="dev-controls">
                    <div class="form-group">
                        <label>Force Matches:</label>
                        <input type="number" id="force-matches" min="0" max="10" value="0">
                    </div>
                    <div class="form-group">
                        <label>Add Coins:</label>
                        <input type="number" id="add-coins" value="100">
                        <button class="glass-button" id="add-coins-btn">Add</button>
                    </div>
                    <div class="form-group">
                        <label>Win Rate:</label>
                        <input type="range" id="win-rate" min="0" max="100" value="30">
                        <span id="win-rate-value">30%</span>
                    </div>
                </div>
            </div>
        ` : '';

        this.container.innerHTML = `
            ${devPanel}
            <div class="difficulty-selector">
                <button class="glass-button difficulty-btn" data-difficulty="easy">Easy</button>
                <button class="glass-button difficulty-btn" data-difficulty="medium">Medium</button>
                <button class="glass-button difficulty-btn" data-difficulty="hard">Hard</button>
            </div>
            <div class="difficulty-info">
                <p>Current Mode: <span class="mode-name">Easy</span></p>
                <p>Required Matches: <span class="min-matches">2</span></p>
            </div>
            <div id="keno-message" class="message"></div>
            <div class="game-grid">
                <div class="game-board-container">
                    <table class="keno-board">
                        <tbody>${this.createBoardHTML()}</tbody>
                    </table>
                    <table class="winning-numbers">
                        <tbody id="winning-numbers"></tbody>
                    </table>
                </div>
                <table class="payout-table">
                    <thead>
                        <tr>
                            <th>Matches</th>
                            <th>Payout</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.createPayoutTableHTML()}
                    </tbody>
                </table>
            </div>
            <div class="controls">
                <button class="glass-button" id="keno-play">Play</button>
                <button class="glass-button" id="keno-clear">Clear Selected</button>
                <button class="glass-button" id="keno-quick">Quick Pick</button>
                <div class="coin-balance">Coins: <span id="keno-coins">${this.coins}</span></div>
            </div>
        `;

        this.setupEventListeners();
        this.addStyles();
        this.updateDifficultyInfo();
    }

    createBoardHTML() {
        let html = '';
        for (let i = 1; i <= 80; i++) {
            if (i % 10 === 1) html += '<tr>';
            html += `<td class="number-cell" data-number="${i}">${i}</td>`;
            if (i % 10 === 0) html += '</tr>';
        }
        return html;
    }

    createPayoutTableHTML() {
        const payouts = this.getDifficultyPayouts().table;
        return Object.entries(payouts).map(([matches, payout]) => 
            `<tr data-matches="${matches}"><td>${matches}</td><td>${payout}</td></tr>`
        ).join('');
    }

    updatePayoutTable() {
        const payouts = this.getDifficultyPayouts().table;
        const tbody = this.container.querySelector('.payout-table tbody');
        tbody.innerHTML = Object.entries(payouts).map(([matches, payout]) => 
            `<tr data-matches="${matches}"><td>${matches}</td><td>${payout}</td></tr>`
        ).join('');
    }

    updateDifficultyInfo() {
        const difficultyInfo = this.getDifficultyPayouts();
        this.container.querySelector('.mode-name').textContent = 
            this.difficulty.charAt(0).toUpperCase() + this.difficulty.slice(1);
        this.container.querySelector('.min-matches').textContent = 
            difficultyInfo.minMatches;
    }

    setupEventListeners() {
        // Betting controls
        const betInput = document.getElementById('bet-amount');
        if (!betInput) return; // Guard against missing elements

        const updateBet = (value) => {
            this.currentBet = Math.max(this.minBet, Math.min(this.maxBet, value));
            betInput.value = this.currentBet;
        };

        const minBetBtn = document.getElementById('min-bet');
        const maxBetBtn = document.getElementById('max-bet');
        const halfBetBtn = document.getElementById('half-bet');
        const doubleBetBtn = document.getElementById('double-bet');

        if (minBetBtn) minBetBtn.addEventListener('click', () => updateBet(this.minBet));
        if (maxBetBtn) maxBetBtn.addEventListener('click', () => updateBet(this.maxBet));
        if (halfBetBtn) halfBetBtn.addEventListener('click', () => updateBet(Math.floor(this.currentBet / 2)));
        if (doubleBetBtn) doubleBetBtn.addEventListener('click', () => updateBet(this.currentBet * 2));
        
        betInput.addEventListener('change', (e) => updateBet(parseInt(e.target.value) || this.minBet));
        betInput.addEventListener('input', (e) => {
            if (e.target.value === '') return;
            updateBet(parseInt(e.target.value) || this.minBet);
        });

        // Disable login button if already logged in
        if (auth.isLoggedIn) {
            const loginBtn = document.querySelector('#auth-button');
            if (loginBtn) {
                loginBtn.style.display = 'none';
            }
        }

        this.container.querySelectorAll('.number-cell').forEach(cell => {
            cell.addEventListener('click', () => this.toggleNumber(cell));
        });

        this.container.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const newDifficulty = btn.dataset.difficulty;
                if (newDifficulty !== this.difficulty) {
                    this.difficulty = newDifficulty;
                    this.updatePayoutTable();
                    this.updateDifficultyInfo();
                    this.clearSelectedNumbers();
                }
            });
        });

        document.getElementById('keno-play').addEventListener('click', () => this.playGame());
        document.getElementById('keno-clear').addEventListener('click', () => this.clearSelectedNumbers());
        document.getElementById('keno-quick').addEventListener('click', () => this.pickRandomNumbers());

        if (this.isDevMode) {
            document.getElementById('add-coins-btn')?.addEventListener('click', () => {
                const amount = parseInt(document.getElementById('add-coins').value);
                this.coins += amount;
                document.getElementById('keno-coins').textContent = this.coins;
                auth.saveScore('keno', this.coins);
            });

            document.getElementById('win-rate')?.addEventListener('input', (e) => {
                document.getElementById('win-rate-value').textContent = `${e.target.value}%`;
            });
        }
    }

    toggleNumber(cell) {
        const number = parseInt(cell.dataset.number);
        if (this.selectedNumbers.has(number)) {
            this.selectedNumbers.delete(number);
            cell.classList.remove('selected');
        } else if (this.selectedNumbers.size < 10) {
            this.selectedNumbers.add(number);
            cell.classList.add('selected');
        } else {
            this.displayMessage('You can only select up to 10 numbers.');
        }
    }

    pickRandomNumbers() {
        this.clearSelectedNumbers();
        const allCells = Array.from(this.container.querySelectorAll('.number-cell'));
        const shuffled = allCells.sort(() => Math.random() - 0.5);
        
        shuffled.slice(0, 10).forEach(cell => {
            this.toggleNumber(cell);
        });
    }

    generateWinningNumbers() {
        if (this.isDevMode) {
            const forceMatches = parseInt(document.getElementById('force-matches')?.value || '0');
            const winRate = parseInt(document.getElementById('win-rate')?.value || '30');
            
            if (forceMatches > 0 || (Math.random() * 100 < winRate)) {
                const selectedArray = Array.from(this.selectedNumbers);
                const matches = forceMatches || Math.floor(Math.random() * Math.min(selectedArray.length + 1, 11));
                const winningNumbers = new Set();
                
                // Add forced matches
                for (let i = 0; i < matches && i < selectedArray.length; i++) {
                    winningNumbers.add(selectedArray[i]);
                }
                
                // Fill remaining numbers
                while (winningNumbers.size < 10) {
                    const num = Math.floor(Math.random() * 80) + 1;
                    if (!winningNumbers.has(num) && !this.selectedNumbers.has(num)) {
                        winningNumbers.add(num);
                    }
                }
                
                return Array.from(winningNumbers);
            }
        }
        
        // Normal random generation
        const numbers = new Set();
        while (numbers.size < 10) {
            numbers.add(Math.floor(Math.random() * 80) + 1);
        }
        return Array.from(numbers);
    }

    displayWinningNumbers(numbers) {
        if (this.isAnimating) return;
        this.isAnimating = true;

        const tbody = document.getElementById('winning-numbers');
        tbody.innerHTML = '<tr>' + Array(10).fill('<td class="empty-cell"></td>').join('') + '</tr>';
        
        // Add animation styles for the ball
        const style = document.createElement('style');
        style.textContent = `
            @keyframes rollIn {
                0% { 
                    transform: translate(100%, -100%) rotate(0deg);
                    opacity: 0;
                }
                50% {
                    transform: translate(50%, 0%) rotate(180deg);
                    opacity: 0.7;
                }
                80% {
                    transform: translate(10%, 10%) rotate(300deg);
                }
                100% { 
                    transform: translate(0, 0) rotate(360deg);
                    opacity: 1;
                }
            }

            @keyframes dropBall {
                0% { transform: translateY(-50px); opacity: 0; }
                60% { transform: translateY(10px); }
                80% { transform: translateY(-5px); }
                100% { transform: translateY(0); opacity: 1; }
            }
            
            .winning-ball {
                display: inline-block;
                width: 40px;
                height: 40px;
                background: radial-gradient(circle at 30% 30%, #ffd700, #b8860b);
                border-radius: 50%;
                box-shadow: 
                    inset -3px -3px 8px rgba(0, 0, 0, 0.4),
                    2px 2px 5px rgba(0, 0, 0, 0.3);
                opacity: 0;
                animation: rollIn 1s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
                position: relative;
                overflow: hidden;
            }

            .winning-ball::after {
                content: '';
                position: absolute;
                top: 5%;
                left: 15%;
                width: 30%;
                height: 30%;
                background: rgba(255, 255, 255, 0.6);
                border-radius: 50%;
                filter: blur(2px);
            }
            
            .winning-ball span {
                display: flex;
                justify-content: center;
                align-items: center;
                width: 100%;
                height: 100%;
                font-weight: bold;
                text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
                position: relative;
                z-index: 2;
            }
            
            .empty-cell {
                width: 40px;
                height: 40px;
                background: linear-gradient(145deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
                border-radius: 50%;
                box-shadow: inset 1px 1px 3px rgba(0, 0, 0, 0.2);
            }
        `;
        document.head.appendChild(style);
        
        // First clear all previous winning and matched classes
        this.container.querySelectorAll('.number-cell').forEach(cell => {
            cell.classList.remove('winning', 'matched');
        });

        let completedAnimations = 0;
        
        // Animate each winning number with a delay
        const cells = tbody.querySelectorAll('td');
        numbers.forEach((number, index) => {
            setTimeout(() => {
                const ball = document.createElement('div');
                ball.className = 'winning-ball';
                ball.innerHTML = `
                    <div class="winning-ball">
                        <span>${number}</span>
                    </div>
                `;

                cells[index].innerHTML = '';
                cells[index].appendChild(ball);
                
                // Add winning and matched classes to the board
                const boardCell = this.container.querySelector(`[data-number="${number}"]`);
                if (boardCell) {
                    boardCell.classList.add('winning');
                    if (this.selectedNumbers.has(number)) {
                        boardCell.classList.add('matched');
                    }
                }

                completedAnimations++;
                if (completedAnimations === numbers.length) {
                    this.isAnimating = false;
                }
            }, index * 500); // 500ms delay between each number
        });
    }

    compareNumbers(winningNumbers) {
        const matchedNumbers = Array.from(this.selectedNumbers)
            .filter(number => winningNumbers.includes(number));
        const coinsWon = this.calculateCoinsWon(matchedNumbers.length) * this.currentBet;
        
        this.coins -= this.currentBet;
        this.coins += coinsWon;
        this.matchCount = matchedNumbers.length;
        
        document.getElementById('keno-coins').textContent = this.coins;
        auth.saveScore('keno', this.coins);
        
        this.highlightPayoutRow(matchedNumbers.length);
        
        this.displayMessage(
            `Matched numbers: ${matchedNumbers.join(', ')}<br>` +
            `Winnings: ${coinsWon} coins`
        );
    }

    highlightPayoutRow(matches) {
        this.container.querySelectorAll('.payout-table tr').forEach(row => {
            row.classList.remove('highlight');
        });

        const matchRow = this.container.querySelector(`.payout-table tr[data-matches="${matches}"]`);
        if (matchRow) {
            matchRow.classList.add('highlight');
        }
    }

    calculateCoinsWon(matchedCount) {
        return this.getDifficultyPayouts().table[matchedCount] || 0;
    }

    displayMessage(message) {
        document.getElementById('keno-message').innerHTML = message;
    }

    clearSelectedNumbers() {
        if (this.isAnimating) return;

        this.selectedNumbers.clear();
        this.container.querySelectorAll('.number-cell').forEach(cell => {
            cell.classList.remove('selected', 'winning', 'matched');
        });
        
        // Clear winning numbers display
        const tbody = document.getElementById('winning-numbers');
        if (tbody) {
            tbody.innerHTML = '<tr>' + Array(10).fill('<td class="empty-cell"></td>').join('') + '</tr>';
        }
    }

    playGame() {
        if (this.isAnimating) return;

        if (this.currentBet > this.coins) {
            this.displayMessage('Not enough coins for current bet');
            return;
        }

        if (this.selectedNumbers.size === 0) {
            this.displayMessage('Please select numbers to play');
            return;
        }
        if (this.coins <= 0) {
            this.displayMessage('You are out of coins');
            return;
        }

        const winningNumbers = this.generateWinningNumbers();
        this.displayWinningNumbers(winningNumbers);
        this.compareNumbers(winningNumbers);
    }

    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .points-display {
                position: fixed;
                top: 20px;
                left: 20px;
                background: var(--glass-bg);
                backdrop-filter: blur(10px);
                padding: 15px 25px;
                border-radius: 15px;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
                border: 1px solid rgba(255, 255, 255, 0.1);
                z-index: 1000;
                animation: slideIn 0.5s ease-out;
            }

            .points-content {
                display: flex;
                align-items: center;
                gap: 10px;
            }

            .points-label {
                font-size: 1.1em;
                color: rgba(255, 255, 255, 0.8);
            }

            .points-value {
                font-size: 1.3em;
                font-weight: bold;
                color: #ffd700;
                text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
            }

            @keyframes slideIn {
                from {
                    transform: translateX(-100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }

            .winning-numbers {
                margin: 20px auto;
                border-collapse: separate;
                border-spacing: 10px;
            }
            
            .winning-numbers td {
                padding: 0;
                text-align: center;
                vertical-align: middle;
                transition: all 0.3s ease;
            }

            .keno-container {
                padding: 20px;
                color: white;
            }

            .difficulty-selector {
                display: flex;
                justify-content: center;
                gap: 10px;
                margin-bottom: 20px;
            }

            .difficulty-btn {
                min-width: 100px;
            }

            .difficulty-btn[data-difficulty="${this.difficulty}"] {
                background: rgba(255, 255, 255, 0.3);
            }

            .difficulty-info {
                text-align: center;
                margin-bottom: 20px;
                padding: 10px;
                background: var(--glass-bg);
                border-radius: 10px;
                backdrop-filter: blur(10px);
            }

            .difficulty-info p {
                margin: 5px 0;
            }

            .message {
                text-align: center;
                margin-bottom: 20px;
                min-height: 40px;
            }

            .game-grid {
                display: flex;
                gap: 20px;
                justify-content: center;
                align-items: flex-start;
            }

            .game-board-container {
                flex: 0 0 auto;
            }

            .keno-board {
                border-collapse: collapse;
                background: var(--glass-bg);
                backdrop-filter: blur(10px);
                border-radius: 10px;
                overflow: hidden;
            }

            .number-cell {
                width: 40px;
                height: 40px;
                text-align: center;
                background: rgba(255, 51, 51, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
                color: white;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.3s ease;
            }

            .number-cell:hover {
                background: rgba(255, 51, 51, 0.3);
            }

            .number-cell.selected {
                background: rgba(255, 51, 51, 0.5);
                border-color: var(--primary-purple);
            }

            .number-cell.winning {
                background: rgba(255, 215, 0, 0.3);
            }

            .number-cell.matched {
                background: rgba(0, 255, 0, 0.5);
                animation: pulse 1s infinite;
            }

            .winning-numbers {
                margin: 20px 0;
                border-collapse: collapse;
            }

            .winning-numbers td {
                width: 30px;
                height: 30px;
                text-align: center;
                background: var(--primary-purple);
                border-radius: 50%;
                margin: 0 5px;
                font-size: 14px;
            }

            .payout-table {
                border-collapse: collapse;
                background: var(--glass-bg);
                backdrop-filter: blur(10px);
                border-radius: 10px;
                overflow: hidden;
            }

            .payout-table th,
            .payout-table td {
                padding: 8px 16px;
                text-align: center;
                border: 1px solid rgba(255, 255, 255, 0.1);
            }

            .payout-table th {
                background: rgba(255, 51, 51, 0.2);
                font-weight: bold;
            }

            .payout-table tr.highlight {
                animation: blink 1s infinite;
            }

            .controls {
                display: flex;
                flex-wrap: wrap;
                gap: 10px;
                justify-content: center;
                margin-top: 20px;
            }

            .coin-balance {
                width: 100%;
                text-align: center;
                font-size: 1.2em;
                margin-top: 10px;
                padding: 10px;
                background: var(--glass-bg);
                border-radius: 5px;
                backdrop-filter: blur(10px);
            }

            .dev-panel {
                background: rgba(255, 0, 0, 0.1);
                padding: 20px;
                border-radius: 10px;
                margin-bottom: 20px;
                border: 1px solid rgba(255, 0, 0, 0.3);
            }

            .dev-panel h3 {
                margin: 0 0 15px 0;
                color: #ff6b6b;
            }

            .dev-controls {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 15px;
            }

            .dev-controls .form-group {
                display: flex;
                flex-direction: column;
                gap: 5px;
            }

            .dev-controls input {
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
                padding: 8px;
                border-radius: 5px;
                color: white;
            }

            .dev-controls input[type="range"] {
                width: 100%;
            }

            @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.1); }
                100% { transform: scale(1); }
            }

            @keyframes blink {
                0% { background: rgba(255, 215, 0, 0.1); }
                50% { background: rgba(255, 215, 0, 0.3); }
                100% { background: rgba(255, 215, 0, 0.1); }
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