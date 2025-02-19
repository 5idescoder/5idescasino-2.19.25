// Game management
class GameManager {
    constructor() {
        this.currentGame = null;
        this.games = {};
        this.init();
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
        if (!auth.isLoggedIn) {
            alert('Please login to play games');
            return;
        }

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
        }
    }
}

// Initialize game manager when document is loaded
document.addEventListener('DOMContentLoaded', () => {
    const gameManager = new GameManager();
});