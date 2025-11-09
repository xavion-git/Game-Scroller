// Responsive canvas sizing
let canvasWidth = 800;
let canvasHeight = 400;

function resizeCanvas() {
    // Get window dimensions
    const maxWidth = window.innerWidth - 40; // Leave some margin
    const maxHeight = window.innerHeight - 150; // Leave space for UI
    
    // Maintain 2:1 aspect ratio
    const aspectRatio = 2;
    
    if (maxWidth / maxHeight > aspectRatio) {
        // Height is the limiting factor
        canvasHeight = maxHeight;
        canvasWidth = canvasHeight * aspectRatio;
    } else {
        // Width is the limiting factor
        canvasWidth = maxWidth;
        canvasHeight = canvasWidth / aspectRatio;
    }
    
    // Set canvas size
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
}

//Get the canvas contexts
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const previewCanvas = document.getElementById('preview-canvas');
const previewCtx = previewCanvas.getContext('2d');
const titlePreviewCanvas = document.getElementById('title-preview-canvas');
const titlePreviewCtx = titlePreviewCanvas.getContext('2d');

// Initialize canvas size
resizeCanvas();

// Resize on window resize
window.addEventListener('resize', resizeCanvas);

// initializing the game score lives and the gameloop 
// ======= Game State =======
let score = 0;
let lives = 3;
let gameRunning = false;  // Changed to false - game starts paused
let gameStarted = false;   // Track if game has been started
let camera = {x: 0, y: 0}; // camera position 
const levelWidth = 3000; // Total level size

// ======= Character Customization ========
let currentCharacter = 'default';

// Simplified character options - no color customization
const characterOptions = [
    { 
        id: 'default', 
        name: 'Classic', 
        cost: 0, 
        unlocked: true, 
        image: 'img/pixel_art_small.png',
        previewColor: '#FF4444'
    },
    { 
        id: 'warrior', 
        name: 'Warrior', 
        cost: 50, 
        unlocked: false, 
        image: 'img/pixel_art_large.png',
        previewColor: '#8B4513'
    },
    { 
        id: 'mage', 
        name: 'Mage', 
        cost: 75, 
        unlocked: false, 
        image: 'img/mage-prince.png',
        previewColor: '#4B0082'
    },
    { 
        id: 'rogue', 
        name: 'Rogue', 
        cost: 60, 
        unlocked: false, 
        image: 'img/rogue-prince.png',
        previewColor: '#2F4F4F'
    }
];

// Preload character images
const characterImages = {};
function preloadCharacterImages() {
    characterOptions.forEach(char => {
        const img = new Image();
        img.src = char.image;
        characterImages[char.id] = img;
    });
}

preloadCharacterImages();

// ===== DRAW CHARACTER WITH SELECTED IMAGE OR FALLBACK =====
function drawCharacter(context, x, y, width, height) {
    const selectedChar = characterOptions.find(c => c.id === currentCharacter);
    
    // Try to draw the selected character image
    if (characterImages[currentCharacter] && characterImages[currentCharacter].complete) {
        context.drawImage(characterImages[currentCharacter], x, y, width, height);
    } else {
        // Fallback: Simple colored rectangle using the character's preview color
        console.log(`Using fallback for character: ${currentCharacter}`);
        context.fillStyle = selectedChar ? selectedChar.previewColor : '#FF4444';
        context.fillRect(x, y, width, height);
        
        // Optional: Add simple features to make it look like a character
        context.fillStyle = '#000000'; // Black for eyes
        context.fillRect(x + 10, y + 15, 4, 4);
        context.fillRect(x + 26, y + 15, 4, 4);
    }
}
// ===== SHOW CUSTOMIZATION SCREEN =====
function showCustomize() {
    document.getElementById('win').style.display = 'none';
    document.getElementById('customize').style.display = 'block';
    document.getElementById('coinsAvailable').textContent = score;
    setupCharacterSelection();  // Only setup character selection
    updatePreview();            // Draw preview
}

// ===== CREATE CHARACTER SELECTION =====
function setupCharacterSelection() {
    const container = document.getElementById('characterSelection');
    
    container.innerHTML = '<h3>Select Character</h3>';
    
    const charGrid = document.createElement('div');
    charGrid.className = 'character-grid';
    
    characterOptions.forEach((character, index) => {
        const charCard = document.createElement('div');
        charCard.className = 'character-card';
        
        if (currentCharacter === character.id) {
            charCard.classList.add('selected');
        }
        
        if (!character.unlocked) {
            charCard.classList.add('locked');
        }
        
        charCard.innerHTML = `
            <div class="character-preview" style="background-color: ${character.previewColor}">
                ${character.unlocked || character.cost === 0 ? 
                  `<img src="${character.image}" alt="${character.name}" onerror="this.style.display='none'">` : 
                  '🔒'}
            </div>
            <div class="character-name">${character.name}</div>
            ${!character.unlocked ? `<div class="cost">${character.cost} 💰</div>` : ''}
        `;
        
        charCard.onclick = () => selectCharacter(index);
        charGrid.appendChild(charCard);
    });
    
    container.appendChild(charGrid);
}

// ===== SELECT/PURCHASE A CHARACTER =====
function selectCharacter(index) {
    const character = characterOptions[index];
    
    // If not unlocked yet, try to purchase
    if (!character.unlocked) {
        if (score >= character.cost) {
            // Purchase it!
            score -= character.cost;
            character.unlocked = true;
            document.getElementById('coinsAvailable').textContent = score;
            document.getElementById('score').textContent = score;
        } else {
            // Not enough coins
            alert(`Not enough coins! Need ${character.cost} coins to unlock ${character.name}.`);
            return;
        }
    }
    
    // Apply the character
    currentCharacter = character.id;
    setupCharacterSelection();  // Refresh character selection
    updatePreview();            // Update preview
}

// Making a player object
const player = {
    x: 50,          // The position on the screen on the x and y
    y: 300, 
    width: 40,      // The width/ hight of the player
    height: 40, 
    velX: 0,   // The velocity of the player for the scrolling 
    velY: 0, 
    speed: 5,       // How fast the character
    jumpPower: 10,  // How high the character can jump
    onGround: false // is the player on the platform
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
    
    // Floating platforms - Section 1
    {x: 200, y: 290, width: 150, height: 20},
    {x: 450, y: 220, width: 150, height: 20},
    {x: 650, y: 150, width: 150, height: 20},
    
    // Floating platforms - Section 2
    {x: 850, y: 280, width: 120, height: 20},
    {x: 1050, y: 200, width: 100, height: 20},
    {x: 1200, y: 260, width: 140, height: 20},
    
    // Floating platforms - Section 3
    {x: 1400, y: 180, width: 130, height: 20},
    {x: 1600, y: 240, width: 110, height: 20},
    {x: 1750, y: 300, width: 150, height: 20},
    
    // Floating platforms - Section 4
    {x: 1950, y: 220, width: 120, height: 20},
    {x: 2150, y: 160, width: 100, height: 20},
    {x: 2300, y: 280, width: 140, height: 20},
    
    // Final challenging section
    {x: 2500, y: 200, width: 80, height: 20},
    {x: 2620, y: 250, width: 80, height: 20},
    {x: 2740, y: 200, width: 100, height: 20}
];

let coins = [
    // Section 1 - Early game
    {x: 250, y: 250, width: 20, height: 20, collected: false},
    {x: 500, y: 180, width: 20, height: 20, collected: false},
    {x: 700, y: 110, width: 20, height: 20, collected: false},
    
    // Section 2 - Middle area
    {x: 900, y: 240, width: 20, height: 20, collected: false},
    {x: 1100, y: 160, width: 20, height: 20, collected: false},
    {x: 1250, y: 220, width: 20, height: 20, collected: false},
    
    // Section 3
    {x: 1450, y: 140, width: 20, height: 20, collected: false},
    {x: 1650, y: 200, width: 20, height: 20, collected: false},
    {x: 1800, y: 260, width: 20, height: 20, collected: false},
    
    // Section 4
    {x: 2000, y: 180, width: 20, height: 20, collected: false},
    {x: 2200, y: 120, width: 20, height: 20, collected: false},
    {x: 2350, y: 240, width: 20, height: 20, collected: false},
    
    // Final section - harder to get
    {x: 2550, y: 160, width: 20, height: 20, collected: false},
    {x: 2670, y: 210, width: 20, height: 20, collected: false},
    {x: 2790, y: 160, width: 20, height: 20, collected: false}
];

// ===== GOAL FLAG =====
const goal = {x: 2850, y: 270, width: 40, height: 100};

// ===== ENEMIES =====
let enemies = [
    // Early enemies
    {x: 300, y: 340, width: 25, height: 25, velX: 2, minX: 200, maxX: 400},
    {x: 500, y: 190, width: 25, height: 25, velX: 1.5, minX: 450, maxX: 600},
    
    // Middle section enemies
    {x: 900, y: 250, width: 25, height: 25, velX: 2.5, minX: 850, maxX: 970},
    {x: 1100, y: 340, width: 25, height: 25, velX: 1.8, minX: 1000, maxX: 1200},
    {x: 1450, y: 150, width: 25, height: 25, velX: 2, minX: 1400, maxX: 1530},
    
    // Later enemies (faster/harder)
    {x: 1650, y: 210, width: 25, height: 25, velX: 3, minX: 1600, maxX: 1750},
    {x: 2000, y: 340, width: 25, height: 25, velX: 2.2, minX: 1950, maxX: 2100},
    {x: 2200, y: 130, width: 25, height: 25, velX: 2.8, minX: 2150, maxX: 2300},
    
    // Final gauntlet
    {x: 2550, y: 170, width: 25, height: 25, velX: 3.5, minX: 2500, maxX: 2620},
    {x: 2700, y: 220, width: 25, height: 25, velX: 3, minX: 2620, maxX: 2760}
];
const gravity = 0.5;  // Gravity strength

// ===== LOAD PLAYER IMAGE =====
const playerImage = new Image();

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

    // If game hasn't started, draw gradient overlay and return
    if (!gameStarted) {
        // Create gradient from light blue at top to transparent at bottom
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, 'rgba(135, 206, 250, 0.8)');  // Light blue at top
        gradient.addColorStop(0.3, 'rgba(135, 206, 250, 0.5)');
        gradient.addColorStop(0.6, 'rgba(135, 206, 250, 0.2)');
        gradient.addColorStop(1, 'rgba(135, 206, 250, 0)');     // Transparent at bottom
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        return;  // Don't draw game elements before start
    }

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
    setupCharacterSelection();
    updatePreview();       // Draw preview
}


// ===== UPDATE PREVIEW CANVAS =====
function updatePreview() {
    // Clear preview
    previewCtx.fillStyle = '#5c94fc';
    previewCtx.fillRect(0, 0, previewCanvas.width, previewCanvas.height);
    
    // Draw character in center (bigger for preview)
    drawCharacter(previewCtx, 45, 45, 30, 30);
}

// ===== UPDATE TITLE PREVIEW =====
function updateTitlePreview() {
    // Clear preview
    titlePreviewCtx.fillStyle = '#5c94fc';
    titlePreviewCtx.fillRect(0, 0, titlePreviewCanvas.width, titlePreviewCanvas.height);
    
    // Draw character in center
    drawCharacter(titlePreviewCtx, 45, 45, 30, 30);
}

// ===== START THE GAME =====
function startGame() {
    document.getElementById('startScreen').style.display = 'none';
    gameRunning = true;
    gameStarted = true;
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
    // Reset all game variables
    score = 0;
    lives = 3;
    gameRunning = true;
    gameStarted = true;
    player.x = 100;
    player.y = 300;
    player.velX = 0;
    player.velY = 0;
    camera.x = 0;
    coins.forEach(coin => coin.collected = false);
    document.getElementById('gameOver').style.display = 'none';
    document.getElementById('win').style.display = 'none';
    document.getElementById('customize').style.display = 'none';
    document.getElementById('startScreen').style.display = 'none';
    updateUI();
}

// ===== MAIN GAME LOOP =====
function gameLoop() {
    update();  // Update physics and logic
    draw();    // Draw everything
    requestAnimationFrame(gameLoop);  // Run again next frame (~60fps)
}

// Start the game loop and show title screen
updateUI();
updateTitlePreview();  // Draw character on title screen
gameLoop();