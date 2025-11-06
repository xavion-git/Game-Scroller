const { version } = require("react");

//Get the canvas contexts
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const previewCanvas = document.getElementById('preview-canvas');
const previewCtx = previewCanvas.getContext('2d');


// initializing the game score lives and the gameloop 
// ======= Game State =======
let score = 0;
let lives = 3;
let gameRunning = true;
let camera = {x: 0, y: 0}; // camera position 
const levelWidth = 3000; // Total level size

// ======= Character Customization ========
let characterColors = {
    body: '#FF4444',
    hat: '#CC0000', 
    eyes: '#000000'
};

const colorOptions = {
    body: [
        {color: '#FF4444', cost: 0, unlocked: true, name: 'Red'},
        {color: '#4444FF', cost: 20, unlocked: false, name: 'Blue'},
        {color: '#44FF44', cost: 30, unlocked: false, name: 'Green'},
        {color: '#FF44FF', cost: 40, unlocked: false, name: 'Pink'},
        {color: '#FFD700', cost: 50, unlocked: false, name: 'Gold'},
        {color: '#FF8C00', cost: 30, unlocked: false, name: 'Orange'}
    ],
    hat: [
        {color: '#CC0000', cost: 0, unlocked: true, name: 'Dark Red'},
        {color: '#0000CC', cost: 20, unlocked: false, name: 'Dark Blue'},
        {color: '#00CC00', cost: 30, unlocked: false, name: 'Dark Green'},
        {color: '#8B008B', cost: 40, unlocked: false, name: 'Purple'},
        {color: '#FFD700', cost: 50, unlocked: false, name: 'Gold'},
        {color: '#000000', cost: 30, unlocked: false, name: 'Black'}
    ],
    eyes: [
        {color: '#000000', cost: 0, unlocked: true, name: 'Black'},
        {color: '#0000FF', cost: 10, unlocked: false, name: 'Blue'},
        {color: '#00FF00', cost: 15, unlocked: false, name: 'Green'},
        {color: '#FF0000', cost: 20, unlocked: false, name: 'Red'},
        {color: '#FFFFFF', cost: 25, unlocked: false, name: 'White'},
        {color: '#FFD700', cost: 30, unlocked: false, name: 'Gold'}
    ]
};

// Making a player object
const player = {
    x: 50,          // The position on the screen on the x and y
    y: 300, 
    width: 30,      // The width/ hight of the player
    height: 30, 
    velX: 0,   // The velocity of the player for the scrolling 
    velY: 0, 
    speed: 5,       // How fast the character
    jumpPower: 10,  // How high the character can jump
    onTheGround: false // is the player on the platform
};

/**adding the contorls*/

const keys = {};
window.addEventListener('keydown', (e) => keys[e.key] = true); // when pressing the down key true else false
window.addEventListener('keyup', (e) => keys[e.key] = false);

// Adding the plateform 
const platforms = [
    // Ground sections
    {x: 0, y: 370, width: 400, height: 30},
    {x: 500, y: 370, width: 400, height: 30},
    {x: 1000, y: 370, width: 400, height: 30},
    {x: 1500, y: 370, width: 400, height: 30},
    {x: 2000, y: 370, width: 400, height: 30},
    {x: 2500, y: 370, width: 500, height: 30},
    
    // Floating platforms
    {x: 200, y: 290, width: 150, height: 20},
    {x: 450, y: 220, width: 150, height: 20},
    {x: 650, y: 150, width: 150, height: 20},
    // ... more platforms
];

let coins = [
    {x: 250, y: 250, width: 20, height: 20, collected: false},
    {x: 500, y: 180, width: 20, height: 20, collected: false},// ... 15 coins total
];

// ===== GOAL FLAG =====
const goal = {x: 2850, y: 270, width: 40, height: 100};

// ===== ENEMIES =====
let enemies = [
    {x: 300, y: 340, width: 25, height: 25, velX: 2, minX: 200, maxX: 400},
    {x: 500, y: 190, width: 25, height: 25, velX: 1.5, minX: 450, maxX: 600},
    // ... more enemies
];
const gravity = 0.5;  // Gravity strength

// ===== DRAW CHARACTER WITH CUSTOM COLORS =====
function drawCharacter(context, x, y, width, height) {
    // Draw body with custom color
    context.fillStyle = characterColors.body;
    context.fillRect(x, y, width, height);
    
    // Draw hat with custom color
    context.fillStyle = characterColors.hat;
    context.fillRect(x, y, width, 8);
    
    // Draw eyes with custom color
    context.fillStyle = characterColors.eyes;
    context.fillRect(x + 8, y + 12, 4, 4);  // Left eye
    context.fillRect(x + 18, y + 12, 4, 4); // Right eye
}
// ===== UPDATE CAMERA TO FOLLOW PLAYER =====
function updateCamera() {
    // Calculate where camera should be (player centered)
    const targetX = player.x - canvas.width / 2;
    
    // Smoothly move camera 10% toward target each frame
    camera.x += (targetX - camera.x) * 0.1;
    
    // Don't go past level edges
    if (camera.x < 0) camera.x = 0;
    if (camera.x > levelWidth - canvas.width) {
        camera.x = levelWidth - canvas.width;
    }
}
// ===== UPDATE GAME LOGIC (60 times per second) =====
function update() {
    if (!gameRunning) return;  // Stop if game over

    // --- MOVEMENT ---
    if (keys['ArrowLeft'] || keys['a']) {
        player.velX = -player.speed;
    } else if (keys['ArrowRight'] || keys['d']) {
        player.velX = player.speed;
    } else {
        player.velX = 0;  // Stop if no keys pressed
    }

    // --- JUMPING ---
    if ((keys['ArrowUp'] || keys['w'] || keys[' ']) && player.onGround) {
        player.velY = -player.jumpPower;  // Negative = up
        player.onGround = false;
    }

    // --- GRAVITY ---
    player.velY += gravity;  // Accelerate downward
    
    // --- APPLY VELOCITY ---
    player.x += player.velX;
    player.y += player.velY;

    // --- PLATFORM COLLISION ---
    player.onGround = false;
    platforms.forEach(platform => {
        // Check if rectangles overlap
        if (player.x < platform.x + platform.width &&
            player.x + player.width > platform.x &&
            player.y < platform.y + platform.height &&
            player.y + player.height > platform.y) {
            
            // If falling down and hitting from above
            if (player.velY > 0 && player.y < platform.y) {
                player.y = platform.y - player.height;  // Snap to top
                player.velY = 0;                         // Stop falling
                player.onGround = true;                  // Can jump again
            }
        }
    });

    // --- BOUNDARIES ---
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > levelWidth) {
        player.x = levelWidth - player.width;
    }
    if (player.y > canvas.height) {
        loseLife();  // Fell off bottom
    }

    // --- UPDATE CAMERA ---
    updateCamera();

    // --- COIN COLLECTION ---
    coins.forEach(coin => {
        if (!coin.collected &&
            player.x < coin.x + coin.width &&
            player.x + player.width > coin.x &&
            player.y < coin.y + coin.height &&
            player.y + player.height > coin.y) {
            
            coin.collected = true;
            score += 10;
            updateUI();
        }
    });

    // --- CHECK GOAL ---
    if (player.x < goal.x + goal.width &&
        player.x + player.width > goal.x &&
        player.y < goal.y + goal.height &&
        player.y + player.height > goal.y) {
        winGame();
    }

    // --- ENEMY MOVEMENT ---
    enemies.forEach(enemy => {
        enemy.x += enemy.velX;  // Move enemy
        
        // Bounce off boundaries
        if (enemy.x <= enemy.minX || enemy.x >= enemy.maxX) {
            enemy.velX *= -1;  // Reverse direction
        }

        // Check collision with player
        if (player.x < enemy.x + enemy.width &&
            player.x + player.width > enemy.x &&
            player.y < enemy.y + enemy.height &&
            player.y + player.height > enemy.y) {
            loseLife();
        }
    });

    // --- UPDATE DISTANCE ---
    document.getElementById('distance').textContent = Math.floor(player.x / 10);
}

// ===== DRAW EVERYTHING =====
function draw() {
    // Clear screen
    ctx.fillStyle = '#5c94fc';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Save context state
    ctx.save();
    
    // Apply camera offset (this shifts everything)
    ctx.translate(-camera.x, -camera.y);

    // --- DRAW GOAL FLAG ---
    ctx.fillStyle = '#000';
    ctx.fillRect(goal.x, goal.y, 5, goal.height);  // Pole
    ctx.fillStyle = '#FF0000';
    ctx.beginPath();
    ctx.moveTo(goal.x + 5, goal.y);
    ctx.lineTo(goal.x + goal.width, goal.y + 20);
    ctx.lineTo(goal.x + 5, goal.y + 40);
    ctx.closePath();
    ctx.fill();  // Flag

    // --- DRAW PLATFORMS ---
    ctx.fillStyle = '#8B4513';
    platforms.forEach(platform => {
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
        // Add grass on top
        ctx.fillStyle = '#228B22';
        ctx.fillRect(platform.x, platform.y, platform.width, 5);
        ctx.fillStyle = '#8B4513';
    });

    // --- DRAW COINS ---
    coins.forEach(coin => {
        if (!coin.collected) {
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(coin.x + coin.width/2, coin.y + coin.height/2, 
                    coin.width/2, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#FFA500';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    });

    // --- DRAW ENEMIES ---
    ctx.fillStyle = '#FF0000';
    enemies.forEach(enemy => {
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
        // Eyes
        ctx.fillStyle = '#FFF';
        ctx.fillRect(enemy.x + 5, enemy.y + 8, 6, 6);
        ctx.fillRect(enemy.x + 14, enemy.y + 8, 6, 6);
        ctx.fillStyle = '#000';
        ctx.fillRect(enemy.x + 7, enemy.y + 10, 3, 3);
        ctx.fillRect(enemy.x + 16, enemy.y + 10, 3, 3);
        ctx.fillStyle = '#FF0000';
    });

    // --- DRAW PLAYER (using custom colors!) ---
    drawCharacter(ctx, player.x, player.y, player.width, player.height);

    // Restore context (remove camera transform)
    ctx.restore();
}

// ===== SHOW CUSTOMIZATION SCREEN =====
function showCustomize() {
    document.getElementById('win').style.display = 'none';
    document.getElementById('customize').style.display = 'block';
    document.getElementById('coinsAvailable').textContent = score;
    setupCustomization();  // Create color buttons
    updatePreview();       // Draw preview
}

// ===== CREATE COLOR SELECTION BUTTONS =====  
function setupCustomization() {
    // For each part (body, hat, eyes)
    ['body', 'hat', 'eyes'].forEach(part => {
        const container = document.getElementById(part + 'Colors');
        container.innerHTML = '';  // Clear previous buttons
        
        // Create a button for each color option
        colorOptions[part].forEach((option, index) => {
            const btn = document.createElement('div');
            btn.className = 'color-btn';
            btn.style.backgroundColor = option.color;
            
            // Mark currently selected color
            if (characterColors[part] === option.color) {
                btn.classList.add('selected');
            }
            
            // If not unlocked, show cost and lock it
            if (!option.unlocked) {
                btn.classList.add('locked');
                const cost = document.createElement('div');
                cost.className = 'cost';
                cost.textContent = option.cost + ' 💰';
                btn.appendChild(cost);
            }
            
            // Click handler
            btn.onclick = () => selectColor(part, index);
            container.appendChild(btn);
        });
    });
}

// ===== SELECT/PURCHASE A COLOR =====
function selectColor(part, index) {
    const option = colorOptions[part][index];
    
    // If not unlocked yet, try to purchase
    if (!option.unlocked) {
        if (score >= option.cost) {
            // Purchase it!
            score -= option.cost;
            option.unlocked = true;
            document.getElementById('coinsAvailable').textContent = score;
            document.getElementById('score').textContent = score;
        } else {
            // Not enough coins
            alert('Not enough coins! Need ' + option.cost + ' coins.');
            return;
        }
    }
    
    // Apply the color
    characterColors[part] = option.color;
    setupCustomization();  // Refresh buttons (to show selection)
    updatePreview();       // Update preview
}

// ===== UPDATE PREVIEW CANVAS =====
function updatePreview() {
    // Clear preview
    previewCtx.fillStyle = '#5c94fc';
    previewCtx.fillRect(0, 0, previewCanvas.width, previewCanvas.height);
    
    // Draw character in center (bigger for preview)
    drawCharacter(previewCtx, 45, 45, 30, 30);
}

function closeCustomize() {
    document.getElementById('customize').style.display = 'none';
}

function updateUI() {
    document.getElementById('score').textContent = score;
    document.getElementById('lives').textContent = lives;
}

function loseLife() {
    lives--;
    updateUI();
    if (lives <= 0) {
        gameOver();
    } else {
        // Reset position
        player.x = 100;
        player.y = 300;
        player.velX = 0;
        player.velY = 0;
        camera.x = 0;
    }
}

function gameOver() {
    gameRunning = false;
    document.getElementById('gameOver').style.display = 'block';
    document.getElementById('finalScore').textContent = 
        `Final Score: ${score} | Distance: ${Math.floor(player.x/10)}m`;
}

function winGame() {
    gameRunning = false;
    document.getElementById('win').style.display = 'block';
    document.getElementById('winScore').textContent = 
        `You collected ${score} points and reached the goal!`;
}

function restartGame() {
    score = 0;
    lives = 3;
    gameRunning = true;
    player.x = 100;
    player.y = 300;
    player.velX = 0;
    player.velY = 0;
    camera.x = 0;
    coins.forEach(coin => coin.collected = false);
    document.getElementById('gameOver').style.display = 'none';
    document.getElementById('win').style.display = 'none';
    document.getElementById('customize').style.display = 'none';
    updateUI();
}

// ===== MAIN GAME LOOP =====
function gameLoop() {
    update();  // Update physics and logic
    draw();    // Draw everything
    requestAnimationFrame(gameLoop);  // Run again next frame (~60fps)
}

// Start the game!
updateUI();
gameLoop();
