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
let runningGame = true;
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
    velocityX: 0,   // The velocity of the player for the scrolling 
    velocityY: 0, 
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