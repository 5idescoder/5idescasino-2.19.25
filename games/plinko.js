class PlinkoGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.coins = auth.getHighScore('plinko') || 100;
        this.currentBet = 10;
        this.minBet = 1;
        this.maxBet = 100;
        this.pegs = [];
        this.balls = [];
        this.slots = [];
        this.currentBall = null;
        this.multipliers = [110, 30, 14, 8, 5, 3, 2, 3, 5, 8, 14, 30, 110]; // Stake-like multipliers
        this.setupGame();
        this.setupControls();
        this.animate();
    }

    setupGame() {
        this.canvas.style.display = 'block';
        this.canvas.width = 800;
        this.canvas.height = 600;

        // Create triangular peg layout
        const pegSpacing = 50;
        const startX = this.canvas.width / 2;
        const startY = 100;
        const rows = 8;  // Fewer rows like Stake

        for (let row = 0; row < rows; row++) {
            const pegsInRow = row + 5;  // More pegs per row
            const rowWidth = pegsInRow * pegSpacing;
            const rowStartX = startX - (rowWidth / 2) + (pegSpacing / 2);

            for (let col = 0; col < pegsInRow; col++) {
                this.pegs.push({
                    x: rowStartX + (col * pegSpacing),
                    y: startY + (row * pegSpacing),
                    radius: 3, // Smaller pegs
                    color: '#66a3ff',
                    lastHit: 0
                });
            }
        }

        // Create slots
        const slotWidth = this.canvas.width / this.multipliers.length;
        const slotY = this.canvas.height - 100;
        
        this.multipliers.forEach((mult, i) => {
            this.slots.push({
                x: i * slotWidth,
                y: slotY,
                width: slotWidth,
                height: 100,
                multiplier: mult,
                color: `hsl(${(i * 360) / this.multipliers.length}, 70%, 50%)`
            });
        });
    }

    setupControls() {
        this.container = document.createElement('div');
        this.container.className = 'plinko-controls';
        
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
        
        this.scoreDisplay = document.createElement('div');
        this.scoreDisplay.className = 'score-display';
        this.updateScoreDisplay();
        
        const dropButton = document.createElement('button');
        dropButton.className = 'glass-button';
        dropButton.textContent = 'Drop Ball';
        dropButton.onclick = () => this.dropBall();

        this.container.appendChild(this.scoreDisplay);
        this.container.appendChild(dropButton);
        this.canvas.parentNode.insertBefore(this.container, this.canvas);

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

        this.canvas.addEventListener('mousemove', (e) => {
            if (!this.currentBall) {
                const rect = this.canvas.getBoundingClientRect();
                this.dropX = Math.max(50, Math.min(e.clientX - rect.left, this.canvas.width - 50));
            }
        });
    }

    updateScoreDisplay() {
        this.scoreDisplay.textContent = `Coins: ${this.coins}`;
        auth.saveScore('plinko', this.coins);
    }

    dropBall() {
        if (this.coins < this.currentBet) {
            alert('Not enough coins!');
            return;
        }
        
        if (!this.currentBall) {
            this.coins -= this.currentBet;
            this.updateScoreDisplay();
            
            this.currentBall = {
                x: this.dropX || this.canvas.width / 2,
                y: 50,
                radius: 6, // Smaller ball
                velocity: { 
                    x: 0,
                    y: 3  // Faster initial velocity
                },
                active: true,
                lastPegHit: null,
                bounceCount: 0,
                restitution: 0.6,  // Less bouncy
                friction: 0.99  // Less friction
            };
        }
    }

    update() {
        if (this.currentBall && this.currentBall.active) {
            // Apply gravity
            this.currentBall.velocity.y += 0.5;
            
            // Apply reduced air resistance
            this.currentBall.velocity.x *= this.currentBall.friction;
            this.currentBall.velocity.y *= this.currentBall.friction;
            
            // Update position
            this.currentBall.x += this.currentBall.velocity.x;
            this.currentBall.y += this.currentBall.velocity.y;
            
            // Wall collisions with bounce
            if (this.currentBall.x < this.currentBall.radius) {
                this.currentBall.x = this.currentBall.radius;
                this.currentBall.velocity.x *= -this.currentBall.restitution;
            } else if (this.currentBall.x > this.canvas.width - this.currentBall.radius) {
                this.currentBall.x = this.canvas.width - this.currentBall.radius;
                this.currentBall.velocity.x *= -this.currentBall.restitution;
            }
            
            // Peg collisions with improved physics
            this.pegs.forEach(peg => {
                const dx = this.currentBall.x - peg.x;
                const dy = this.currentBall.y - peg.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const minDist = this.currentBall.radius + peg.radius;
                
                if (distance < minDist && peg !== this.currentBall.lastPegHit) {
                    // Calculate collision response
                    const angle = Math.atan2(dy, dx);
                    const speed = Math.sqrt(
                        this.currentBall.velocity.x * this.currentBall.velocity.x +
                        this.currentBall.velocity.y * this.currentBall.velocity.y
                    );
                    
                    // Add more controlled randomness
                    const bounceAngle = angle + (Math.random() * 0.3 - 0.15);
                    
                    // Update velocity with restitution
                    this.currentBall.velocity.x = Math.cos(bounceAngle) * speed * this.currentBall.restitution;
                    this.currentBall.velocity.y = Math.abs(Math.sin(bounceAngle) * speed * this.currentBall.restitution);
                    
                    // Prevent sticking
                    const overlap = minDist - distance;
                    this.currentBall.x += overlap * Math.cos(angle);
                    this.currentBall.y += overlap * Math.sin(angle);
                    
                    // Track last hit peg
                    this.currentBall.lastPegHit = peg;
                    
                    // Visual feedback
                    peg.color = '#fff';
                    setTimeout(() => peg.color = '#66a3ff', 100);
                }
            });
            
            // Slot collision detection
            if (this.currentBall.y > this.canvas.height - 150) {
                const slot = this.slots.find(slot =>
                    this.currentBall.x >= slot.x &&
                    this.currentBall.x <= slot.x + slot.width
                );
                
                if (slot) {
                    const winnings = Math.floor(slot.multiplier * this.currentBet);
                    this.coins += winnings;
                    this.updateScoreDisplay();
                    this.showWinnings(this.currentBall.x, this.currentBall.y, winnings);
                    this.currentBall.active = false;
                    
                    // Visual feedback for slot
                    const originalColor = slot.color;
                    slot.color = '#fff';
                    setTimeout(() => slot.color = originalColor, 200);
                }
            }
            
            // Remove ball when it falls off screen
            if (this.currentBall.y > this.canvas.height) {
                this.currentBall = null;
            }
        }
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

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw background gradient
        this.drawGrid();
        
        // Draw drop zone indicator
        if (!this.currentBall && this.dropX) {
            this.ctx.beginPath();
            this.ctx.moveTo(this.dropX, 0);
            this.ctx.lineTo(this.dropX, 100);
            this.ctx.strokeStyle = '#fff';
            this.ctx.stroke();
        }
        
        // Draw pegs with glow effect
        this.pegs.forEach(peg => {
            this.ctx.beginPath();
            this.ctx.arc(peg.x, peg.y, peg.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = peg.color;
            this.ctx.strokeStyle = '#ffffff33';
            this.ctx.lineWidth = 1;
            
            if (peg.color === '#fff') {
                this.ctx.shadowColor = '#fff';
                this.ctx.shadowBlur = 15;
            }
            
            this.ctx.fill();
            this.ctx.stroke();
            this.ctx.shadowBlur = 0;
        });
        
        // Draw slots with gradient background
        this.slots.forEach(slot => {
            const gradient = this.ctx.createLinearGradient(
                slot.x, slot.y,
                slot.x, slot.y + slot.height
            );
            gradient.addColorStop(0, slot.color);
            gradient.addColorStop(1, 'rgba(0,0,0,0.5)');
            
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(slot.x, slot.y, slot.width, slot.height);
            
            // Draw multiplier text
            this.ctx.fillStyle = '#fff';
            this.ctx.textAlign = 'center';
            this.ctx.font = '24px Arial';
            this.ctx.fillText(`${slot.multiplier}×`, slot.x + slot.width / 2, slot.y + 50);
        });
        
        // Draw current ball with glow effect
        if (this.currentBall) {
            this.ctx.beginPath();
            this.ctx.arc(this.currentBall.x, this.currentBall.y, this.currentBall.radius, 0, Math.PI * 2);
            
            this.ctx.shadowColor = '#ffd700';
            this.ctx.shadowBlur = 15;
            
            this.ctx.fillStyle = '#ffd700';
            this.ctx.fill();
            
            this.ctx.shadowBlur = 0;
        }
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