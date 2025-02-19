// Authentication handling
class Auth {
    constructor() {
        this.isLoggedIn = false;
        this.currentUser = null;
        this.lastFaucetClaim = null;
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
        const guestButton = document.getElementById('guest-button');
        
        if (authButton) {
            authButton.addEventListener('click', () => {
                if (this.isLoggedIn) {
                    this.logout();
                } else {
                    window.location.href = 'login.html';
                }
            });
        }

        if (guestButton) {
            guestButton.addEventListener('click', () => {
                this.loginAsGuest();
            });
        }
    }

    loginAsGuest() {
        const guestId = 'guest_' + Math.random().toString(36).substr(2, 9);
        const user = {
            username: 'Guest_' + guestId.substr(6),
            id: Date.now(),
            email: '',
            scores: {},
            lastGame: null,
            isGuest: true
        };
        
        localStorage.setItem('user', JSON.stringify(user));
        this.currentUser = user;
        this.isLoggedIn = true;
        this.updateUI();
        window.location.reload();
    }

    login(username, password) {
        const user = {
            username,
            id: Date.now(),
            email: '',
            scores: {},
            lastFaucetClaim: null,
            lastGame: null,
            isGuest: false
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
        const guestButton = document.getElementById('guest-button');

        if (this.isLoggedIn) {
            if (authButton) authButton.textContent = 'Logout';
            if (userDisplay) {
                const displayText = this.currentUser.isGuest ? 
                    this.currentUser.username : 
                    `<a href="profile.html" style="color: white; text-decoration: none;">${this.currentUser.username}</a>`;
                userDisplay.innerHTML = `Welcome, ${displayText}!`;
            }
            if (guestButton) guestButton.style.display = 'none';
        } else {
            if (authButton) authButton.textContent = 'Login';
            if (userDisplay) userDisplay.textContent = '';
            if (guestButton) guestButton.style.display = 'inline-block';
        }
    }

    saveScore(game, score) {
        if (!this.isLoggedIn) return;

        this.currentUser.scores[game] = Math.max(
            score,
            this.currentUser.scores[game] || 0
        );
        this.currentUser.lastGame = game;
        localStorage.setItem('user', JSON.stringify(this.currentUser));
    }

    getHighScore(game) {
        if (!this.isLoggedIn) return 0;
        return this.currentUser.scores[game] || 0;
    }

    canClaimFaucet() {
        if (!this.isLoggedIn || !this.currentUser.lastFaucetClaim) return true;
        const timeSinceClaim = Date.now() - this.currentUser.lastFaucetClaim;
        return timeSinceClaim >= 4.75 * 60 * 1000; // 4.75 minutes in milliseconds
    }

    getExtraDice() {
        if (!this.currentUser.lastFaucetClaim) return 0;
        const hoursSinceClaim = (Date.now() - this.currentUser.lastFaucetClaim) / (60 * 60 * 1000);
        const extraDice = Math.min(5, Math.floor(hoursSinceClaim));
        return extraDice;
    }

    hasWeeklyBonus() {
        if (!this.currentUser.lastFaucetClaim) return false;
        const daysSinceClaim = (Date.now() - this.currentUser.lastFaucetClaim) / (24 * 60 * 60 * 1000);
        return daysSinceClaim >= 7;
    }

    claimFaucet() {
        if (!this.isLoggedIn) return 0;
        this.currentUser.lastFaucetClaim = Date.now();
        localStorage.setItem('user', JSON.stringify(this.currentUser));
    }
}

// Create the auth instance and make it globally available
window.auth = new Auth();