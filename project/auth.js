// Authentication handling
class Auth {
    constructor() {
        this.isLoggedIn = false;
        this.currentUser = null;
        this.init();
    }

    init() {
        // Check for existing session
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
            this.isLoggedIn = true;
            this.updateUI();
        }

        // Setup event listeners
        const authButton = document.getElementById('auth-button');
        authButton.addEventListener('click', () => {
            if (this.isLoggedIn) {
                this.logout();
            } else {
                window.location.href = 'login.html';
            }
        });
    }

    login(username, password) {
        // Simple login logic (replace with proper authentication)
        const user = {
            username,
            id: Date.now(),
            scores: {}
        };
        
        localStorage.setItem('user', JSON.stringify(user));
        this.currentUser = user;
        this.isLoggedIn = true;
        this.updateUI();
        return true;
    }

    logout() {
        localStorage.removeItem('user');
        this.currentUser = null;
        this.isLoggedIn = false;
        this.updateUI();
        window.location.reload();
    }

    updateUI() {
        const authButton = document.getElementById('auth-button');
        const userDisplay = document.getElementById('user-display');

        if (this.isLoggedIn) {
            authButton.textContent = 'Logout';
            userDisplay.textContent = `Welcome, ${this.currentUser.username}!`;
        } else {
            authButton.textContent = 'Login';
            userDisplay.textContent = '';
        }
    }

    saveScore(game, score) {
        if (!this.isLoggedIn) return;

        this.currentUser.scores[game] = Math.max(
            score,
            this.currentUser.scores[game] || 0
        );
        localStorage.setItem('user', JSON.stringify(this.currentUser));
    }

    getHighScore(game) {
        if (!this.isLoggedIn) return 0;
        return this.currentUser.scores[game] || 0;
    }
}

const auth = new Auth();