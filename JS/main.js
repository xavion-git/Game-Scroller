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


