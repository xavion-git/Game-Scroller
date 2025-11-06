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

const enemyies = {
    x: 70,
    y: 600, 
    width: 60,
    height: 60,
    velocityX: 10,
    velocityY: 10,
    speed: 5,
    onTheGround: true
};
