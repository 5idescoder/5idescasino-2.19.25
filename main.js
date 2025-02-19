// Game management
class GameManager {
    constructor() {
        this.currentGame = null;
        this.games = {};
        this.setupFaucet();
        this.init();
    }

    setupFaucet() {
        const faucetButton = document.getElementById('faucet-button');
        const faucetTimer = document.getElementById('faucet-timer');
        const diceContainer = document.getElementById('dice-container');

        const updateFaucetStatus = () => {
            if (!auth.isLoggedIn) {
                faucetButton.disabled = true;
                faucetTimer.textContent = 'Please login to use the faucet';
                return;
            }

            const currentCoins = auth.currentUser.scores.total || 0;
            const canClaim = auth.canClaimFaucet() && currentCoins < 100;

            if (!canClaim && auth.currentUser.lastFaucetClaim) {
                const timeLeft = 4.75 * 60 * 1000 - (Date.now() - auth.currentUser.lastFaucetClaim);
                if (timeLeft > 0) {
                    const minutes = Math.floor(timeLeft / 60000);
                    const seconds = Math.floor((timeLeft % 60000) / 1000);
                    faucetTimer.textContent = `Next claim available in: ${minutes}m ${seconds}s`;
                }
            }

            faucetButton.disabled = !canClaim;
        };

        const rollDice = async () => {
            diceContainer.innerHTML = '';
            const results = [];
            
            // Base d6
            const d6 = document.createElement('div');
            d6.className = 'dice rolling';
            diceContainer.appendChild(d6);
            
            // Extra d4s based on hours waited
            const extraDice = auth.getExtraDice();
            for (let i = 0; i < extraDice; i++) {
                const d4 = document.createElement('div');
                d4.className = 'dice d4 rolling';
                diceContainer.appendChild(d4);
            }
            
            // Weekly bonus d100
            if (auth.hasWeeklyBonus()) {
                const d100 = document.createElement('div');
                d100.className = 'dice d100 rolling';
                diceContainer.appendChild(d100);
            }
            
            // Wait for roll animation
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Calculate and display results
            const d6Result = Math.floor(Math.random() * 6) + 1;
            results.push(d6Result * 50);
            d6.textContent = d6Result;
            
            for (let i = 0; i < extraDice; i++) {
                const d4Result = Math.floor(Math.random() * 4) + 1;
                results.push(d4Result * 50);
                diceContainer.children[i + 1].textContent = d4Result;
            }
            
            if (auth.hasWeeklyBonus()) {
                const d100Result = Math.floor(Math.random() * 100) + 1;
                results.push(d100Result);
                diceContainer.children[diceContainer.children.length - 1].textContent = d100Result;
            }
            
            const totalWin = results.reduce((a, b) => a + b, 0);
            
            // Update user's coins
            auth.currentUser.scores.total = (auth.currentUser.scores.total || 0) + totalWin;
            auth.claimFaucet();
            
            // Show winning animation
            const winningPopup = document.createElement('div');
            winningPopup.className = 'winning-popup';
            winningPopup.textContent = `+${totalWin} coins!`;
            diceContainer.appendChild(winningPopup);
            
            updateFaucetStatus();
        };

        if (faucetButton) {
            faucetButton.addEventListener('click', rollDice);
            setInterval(updateFaucetStatus, 1000);
            updateFaucetStatus();
        }
    }

    init() {
        // Setup game selection handlers
        document.querySelectorAll('.dropdown-content a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const gameType = e.target.dataset.game;
                this.loadGame(gameType);
            });
        });

        // Hide welcome message when a game is selected
        const welcomeMessage = document.getElementById('welcome-message');
        const gameCanvas = document.getElementById('gameCanvas');

        this.showGame = (show) => {
            welcomeMessage.style.display = show ? 'none' : 'block';
            gameCanvas.style.display = show ? 'block' : 'none';
        };
    }

    loadGame(gameType) {
        // Clear current game if exists
        if (this.currentGame) {
            this.currentGame.destroy?.();
        }

        // Show game canvas
        this.showGame(true);

        // Initialize selected game
        switch (gameType) {
            case 'fish':
                this.currentGame = new FishGame();
                break;
            case 'plinko':
                this.currentGame = new PlinkoGame();
                break;
            case 'keno':
                this.currentGame = new KenoGame();
                break;
            case 'slot':
                this.currentGame = new SlotMachine();
                break;
            case 'spin':
                this.currentGame = new SpinGame();
                break;
            case 'mancala':
                this.currentGame = new MancalaGame();
                break;
        }
    }
}

// Initialize game manager when document is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.gameManager = new GameManager();
});