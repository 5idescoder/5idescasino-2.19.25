class FishGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.coins = auth.getHighScore('fish') || 100;
        this.currentBet = 1;
        this.minBet = 1;
        this.maxBet = 100;
        this.bullets = [];
        this.targets = [];
        this.symbols = ['🦈', '🐋', '🐠', '🐡', '🦑', '🐙'];
        this.symbolValues = {
            '🦈': { value: 10, minHealth: 15, maxHealth: 25 },  // Shark
            '🐋': { value: 8, minHealth: 10, maxHealth: 20 },   // Whale
            '🐠': { value: 5, minHealth: 5, maxHealth: 10 },    // Fish
            '🐡': { value: 3, minHealth: 3, maxHealth: 8 },     // Pufferfish
            '🦑': { value: 2, minHealth: 2, maxHealth: 5 },     // Squid
            '🐙': { value: 1, minHealth: 1, maxHealth: 3 }      // Octopus
        };
        this.setupCanvas();
        this.setupGame();
        this.addEventListeners();
        this.animate();
    }

    setupCanvas() {
        this.canvas.style.display = 'block';
        this.canvas.width = 800;
        this.canvas.height = 800;
        this.canvas.style.background = 'linear-gradient(to bottom, #2b044e, #000)';
        this.canvas.style.border = '2px solid';
        this.canvas.style.borderImage = 'linear-gradient(to bottom, #007bff, #66a3ff) 1';
        this.canvas.style.borderRadius = '10px';
    }

    setupGame() {
        // Player gun
        this.gun = {
            x: this.canvas.width / 2,
            y: this.canvas.height - 50,
            width: 40,
            height: 40,
            color: '#007bff',
            rotation: 0
        };

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
        this.canvas.parentNode.insertBefore(bettingControls, this.canvas);

        // Score display
        this.scoreDisplay = document.createElement('div');
        this.scoreDisplay.className = 'score-display';
        this.canvas.parentNode.insertBefore(this.scoreDisplay, this.canvas);
        this.updateScoreDisplay();

        // Start spawning targets
        setInterval(() => this.spawnRandomTarget(), 2000);
    }

    spawnRandomTarget() {
        const symbol = this.symbols[Math.floor(Math.random() * this.symbols.length)];
        const symbolInfo = this.symbolValues[symbol];
        const size = symbolInfo.value * 5 + 20; // Bigger symbols for higher values
        const health = Math.floor(Math.random() * 
            (symbolInfo.maxHealth - symbolInfo.minHealth + 1)) + 
            symbolInfo.minHealth;
        
        const side = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
        let x, y, dx, dy;
        
        switch(side) {
            case 0: // top
                x = Math.random() * this.canvas.width;
                y = -size;
                dx = (Math.random() - 0.5) * 2;
                dy = Math.random() * 2 + 1;
                break;
            case 1: // right
                x = this.canvas.width + size;
                y = Math.random() * this.canvas.height;
                dx = -(Math.random() * 2 + 1);
                dy = (Math.random() - 0.5) * 2;
                break;
            case 2: // bottom
                x = Math.random() * this.canvas.width;
                y = this.canvas.height + size;
                dx = (Math.random() - 0.5) * 2;
                dy = -(Math.random() * 2 + 1);
                break;
            case 3: // left
                x = -size;
                y = Math.random() * this.canvas.height;
                dx = Math.random() * 2 + 1;
                dy = (Math.random() - 0.5) * 2;
                break;
        }

        const target = {
            x,
            y,
            dx,
            dy,
            size,
            symbol,
            health,
            maxHealth: health,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.1
        };
        
        this.targets.push(target);
    }

    addEventListeners() {
        // Betting controls
        const betInput = document.getElementById('bet-amount');
        const updateBet = (value) => {
            this.currentBet = Math.max(this.minBet, Math.min(this.maxBet, value));
            betInput.value = this.currentBet;
        };

        document.getElementById('min-bet').addEventListener('click', () => updateBet(this.minBet));
        document.getElementById('max-bet').addEventListener('click', () => updateBet(this.maxBet));
        document.getElementById('half-bet').addEventListener('click', () => updateBet(Math.floor(this.currentBet / 2)));
        document.getElementById('double-bet').addEventListener('click', () => updateBet(this.currentBet * 2));
        
        betInput.addEventListener('change', (e) => updateBet(parseInt(e.target.value) || this.minBet));
        betInput.addEventListener('input', (e) => {
            if (e.target.value === '') return;
            updateBet(parseInt(e.target.value) || this.minBet);
        });

        // Mouse controls
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // Update gun rotation
            const dx = x - this.gun.x;
            const dy = y - this.gun.y;
            this.gun.rotation = Math.atan2(dy, dx);
        });

        this.canvas.addEventListener('click', (e) => {
            if (this.coins < this.currentBet) {
                alert('Not enough coins!');
                return;
            }
            
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            this.coins -= this.currentBet;
            this.updateScoreDisplay();
            this.shoot(x, y);
        });
    }

    shoot(targetX, targetY) {
        const angle = Math.atan2(targetY - this.gun.y, targetX - this.gun.x);
        const bullet = {
            x: this.gun.x,
            y: this.gun.y,
            speed: 10,
            angle: angle,
            size: 8
        };
        this.bullets.push(bullet);
    }

    updateBullets() {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            bullet.x += Math.cos(bullet.angle) * bullet.speed;
            bullet.y += Math.sin(bullet.angle) * bullet.speed;

            // Check for collision with targets
            for (let j = this.targets.length - 1; j >= 0; j--) {
                const target = this.targets[j];
                if (this.checkCollision(bullet, target)) {
                    target.health--;
                    this.showDamage(target);
                    
                    if (target.health <= 0) {
                        const winnings = this.symbolValues[target.symbol].value * this.currentBet;
                        this.coins += winnings;
                        this.updateScoreDisplay();
                        this.showWinnings(target.x, target.y, winnings);
                        this.targets.splice(j, 1);
                    }
                    
                    this.bullets.splice(i, 1);
                    break;
                }
            }

            // Remove bullets that are off screen
            if (bullet.x < 0 || bullet.x > this.canvas.width ||
                bullet.y < 0 || bullet.y > this.canvas.height) {
                this.bullets.splice(i, 1);
            }
        }
    }

    updateTargets() {
        for (let i = this.targets.length - 1; i >= 0; i--) {
            const target = this.targets[i];
            target.x += target.dx;
            target.y += target.dy;
            target.rotation += target.rotationSpeed;

            // Remove targets that are far off screen
            if (target.x < -100 || target.x > this.canvas.width + 100 ||
                target.y < -100 || target.y > this.canvas.height + 100) {
                this.targets.splice(i, 1);
            }
        }
    }

    checkCollision(bullet, target) {
        const dx = bullet.x - target.x;
        const dy = bullet.y - target.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < target.size / 2;
    }

    showWinnings(x, y, amount) {
        const popup = document.createElement('div');
        popup.textContent = `+${amount}`;
        popup.style.position = 'absolute';
        popup.style.left = `${x + this.canvas.offsetLeft}px`;
        popup.style.top = `${y + this.canvas.offsetTop}px`;
        popup.style.color = '#66a3ff';
        popup.style.fontSize = '24px';
        popup.style.fontWeight = 'bold';
        popup.style.pointerEvents = 'none';
        popup.style.animation = 'fadeUp 1s ease-out';
        document.body.appendChild(popup);

        setTimeout(() => popup.remove(), 1000);
    }

    showDamage(target) {
        // Create damage number
        const damage = document.createElement('div');
        damage.textContent = target.health;
        damage.style.position = 'absolute';
        damage.style.left = `${target.x + this.canvas.offsetLeft}px`;
        damage.style.top = `${target.y + this.canvas.offsetTop}px`;
        damage.style.color = '#ff6b6b';
        damage.style.fontSize = '16px';
        damage.style.fontWeight = 'bold';
        damage.style.pointerEvents = 'none';
        damage.style.animation = 'fadeUp 0.5s ease-out';
        document.body.appendChild(damage);

        // Flash the target red
        target.hit = true;
        setTimeout(() => {
            target.hit = false;
            damage.remove();
        }, 500);
    }

    updateScoreDisplay() {
        this.scoreDisplay.innerHTML = `Coins: ${this.coins}`;
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw grid background
        this.drawGrid();

        // Draw gun with rotation
        this.ctx.save();
        this.ctx.translate(this.gun.x, this.gun.y);
        this.ctx.rotate(this.gun.rotation);
        this.ctx.fillStyle = '#66a3ff';
        this.ctx.fillText('🔫', -20, 0);
        this.ctx.restore();

        // Draw bullets
        this.ctx.fillStyle = '#66a3ff';
        this.bullets.forEach(bullet => {
            this.ctx.beginPath();
            this.ctx.arc(bullet.x, bullet.y, bullet.size, 0, Math.PI * 2);
            this.ctx.fill();
        });

        // Draw targets
        this.targets.forEach(target => {
            this.ctx.save();
            this.ctx.translate(target.x, target.y);
            this.ctx.rotate(target.rotation);
            
            // Draw health bar
            const healthBarWidth = target.size;
            const healthBarHeight = 4;
            const healthPercent = target.health / target.maxHealth;
            
            this.ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
            this.ctx.fillRect(-healthBarWidth/2, -target.size/2 - 10, healthBarWidth, healthBarHeight);
            
            this.ctx.fillStyle = target.hit ? '#ff6b6b' : '#51cf66';
            this.ctx.fillRect(
                -healthBarWidth/2,
                -target.size/2 - 10,
                healthBarWidth * healthPercent,
                healthBarHeight
            );
            
            // Draw symbol
            this.ctx.font = `${target.size}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.filter = target.hit ? 'brightness(1.5)' : 'none';
            this.ctx.fillText(target.symbol, 0, 0);
            this.ctx.filter = 'none';
            
            this.ctx.restore();
        });
    }

    drawGrid() {
        this.ctx.strokeStyle = 'rgba(0, 123, 255, 0.1)';
        this.ctx.lineWidth = 1;

        // Draw vertical lines
        for (let x = 0; x < this.canvas.width; x += 20) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }

        // Draw horizontal lines
        for (let y = 0; y < this.canvas.height; y += 20) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }

    animate = () => {
        this.updateBullets();
        this.updateTargets();
        this.draw();
        this.animationFrame = requestAnimationFrame(this.animate);
    }

    destroy() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        const bettingControls = document.querySelector('.betting-controls');
        if (bettingControls) bettingControls.remove();
        this.scoreDisplay.remove();
        this.canvas.style.display = 'none';
    }
}