const { version } = require("react");

// initializing the game score lives and the gameloop 
let score = 0;
let lives = 3;
let runningGame = true;

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
const platform = [
    {x: 0, y: 370, width: 800, height: 30},     // Ground
    {x: 200, y: 290, width: 150, height: 20},   // Platform 1
    {x: 450, y: 220, width: 150, height: 20},   // Platform 2
    // ... more platforms
]

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
