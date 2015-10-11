//
// GAME INIT
//

PIXI.SCALE_MODES.DEFAULT = PIXI.SCALE_MODES.NEAREST;

var gameHeight = window.innerHeight;
var gameWidth = window.innerWidth;

var renderer = PIXI.autoDetectRenderer(gameWidth, gameHeight, {backgroundColor : 0x222222});
document.body.appendChild(renderer.view);

var stage = new PIXI.Container();

//
// GUY
//

// Init:
var guy = new PIXI.Sprite.fromImage('img/roll_guy.png');

// Position:
guy.anchor.x = 0.5;
guy.anchor.y = 0.5;
guy.position.x = 200;
guy.position.y = 150;
guy.velocity = {x:0, y:0};

guy.bounce = 0.0;
guy.moving = {x:true, y:true};

guy.height = 256;
guy.width = 256;

// Keyboard controls:
var left = keyboard(37);
var	up = keyboard(38);
var	right = keyboard(39);
var	down = keyboard(40);

// Jump:
up.press = function() {

	if(!guy.moving.y) {
		guy.velocity.y = -15;
		guy.moving.y = true;
	}
};

// Click/Touch controls:
guy.interactive = true;
guy.on('mousedown', onDown);
guy.on('touchstart', onDown);

function onDown (eventData) {

	if(!guy.moving.y) {
		guy.velocity.x = Math.floor(Math.random() * (15 - -15 + 1)) + -15;;
		guy.velocity.y = -15;
		guy.moving.y = true;
	}
}

// Spawn guy:
stage.addChild(guy);

//
// ACTION
//

// Animation Frame:
animFrame();
function animFrame() {

    requestAnimationFrame(animFrame);

	// Handle Guy's movement:
	charMovement(guy);

    // Render:
    renderer.render(stage);
}

// Character movement:
function charMovement(char) {

	var charRadiusY = char.height * (1 - char.anchor.y);
	var charRadiusX = char.width * (1 - char.anchor.x);

	// game bottom is always the platform atm:
	var platformHeight = gameHeight;
	platformState = onPlatform(char, platformHeight);

	// Vertical movement:
	if(platformState == 2) {
		// Hitting a platform:
		char.position.y = platformHeight - charRadiusY;

		if(Math.abs(char.velocity.y - 0) < 1 || char.bounce == 0) {
			// Landing
			char.moving.y = false;
			char.velocity.y = 0;
		} else {
			// Bouncing:
			char.velocity.y = (char.velocity.y * -1) * char.bounce;
		}
	}

	if(!char.moving.y) {
		// Standing:
		char.velocity.y = 0;
		char.position.y = platformHeight - charRadiusY;
	} else {
		// Gravitate downwards:
		char.velocity.y += 0.5;
	}

	// Horizontal movement:
	if(right.isDown && char.velocity.x < 15) {
		char.velocity.x += 0.75;
	}
	if(left.isDown && char.velocity.x > -15) {
		char.velocity.x += -0.75;
	}

	// Horizontal velocity decay:
	if(char.velocity.x > 0) {
		char.velocity.x -= 0.5;
	} else if(char.velocity.x < 0) {
		char.velocity.x += 0.5;
	}

	// Move through side edges:
	if (char.position.x > gameWidth + charRadiusX) {
		char.position.x = (charRadiusX*-1) - 1;
	} else if(char.position.x < charRadiusX*-1) {
		char.position.x = gameWidth + charRadiusX + 1;
	}

	// Tilt character with velocity:
	char.rotation = char.velocity.x / -100;

	// Move character with velocity:
	char.position.x += char.velocity.x;
	char.position.y += char.velocity.y;
}

function onPlatform(char, platform) {

	var charRadiusY = char.height * (1 - char.anchor.y);

	if(char.position.y + charRadiusY <= platform) {
		if(char.position.y + charRadiusY + char.velocity.y >= platform && char.moving.y) {

			// Hitting the platform:
			return 2;
		}

		// Under/on the platform:
		return 1;
	}

	// Above platform:
	return 0;
}

//The `keyboard` helper function
function keyboard(keyCode) {

	var key = {};
	key.code = keyCode;
	key.isDown = false;
	key.isUp = true;
	key.press = undefined;
	key.release = undefined;
	//The `downHandler`
	key.downHandler = function(event) {
		if (event.keyCode === key.code) {
			if (key.isUp && key.press) key.press();
			key.isDown = true;
			key.isUp = false;
		}
		//event.preventDefault();
	};
	//The `upHandler`
	key.upHandler = function(event) {
		if (event.keyCode === key.code) {
			if (key.isDown && key.release) key.release();
			key.isDown = false;
			key.isUp = true;
		}
		//event.preventDefault();
	};
	//Attach event listeners
	window.addEventListener(
		"keydown", key.downHandler.bind(key), false
	);
	window.addEventListener(
		"keyup", key.upHandler.bind(key), false
	);
	return key;
}

// Resizable game window:
window.onresize = function (event) {

	gameWidth = window.innerWidth;
	gameHeight = window.innerHeight;

	//this part resizes the canvas but keeps ratio the same
	renderer.view.style.width = gameWidth + "px";
	renderer.view.style.height = gameHeight + "px";

	//this part adjusts the ratio:
	renderer.resize(gameWidth, gameHeight);
}
