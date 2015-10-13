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
// GAME OBJECTS
//

var obj = [];

function CreateGameObject(image, position, gravity) {

	var index = obj.push(new PIXI.Sprite.fromImage(image)) - 1;

	obj[index].position = position;
	obj[index].gravity = gravity;

	obj[index].anchor.x = 0.5;
	obj[index].anchor.y = 0.5;
	obj[index].velocity = {x:0, y:0};
	obj[index].bounce = 0.0;
	obj[index].groundObj = -1;

	stage.addChild(obj[index]);
	return index;
}

// GUY
var guy = CreateGameObject('img/roll_guy.png', {x:200, y:gameHeight-200}, 0.5);
obj[guy].height = 196;
obj[guy].width = 136;


// PLATFORMS

var platform = CreateGameObject('img/platform.png', {x:gameWidth/2, y:gameHeight}, 0.0);
obj[platform].height = 32;
obj[platform].width = gameWidth * 100;

for(var i = 1; i <= 50; i++) {
	var height = gameHeight-200 * i;

	platform = CreateGameObject('img/platform.png', {x:gameWidth/2, y:height}, 0.0);
	obj[platform].height = 32;
	obj[platform].width = 512;
	obj[platform].velocity.x = Math.floor(Math.random() * (10 - -10 + 1)) + -10;
}

//
// CONTROLS
//

// Keyboard controls:
var left = keyboard(37);
var up = keyboard(38);
var right = keyboard(39);
var down = keyboard(40);

// Jump:
up.press = function() {

	if(obj[guy].groundObj != -1) {
		obj[guy].velocity.y = -15;
		detachPlatform(obj[guy], obj[guy].groundObj);
	}
};

// Click/Touch controls:
obj[guy].interactive = true;
obj[guy].on('mousedown', onDown);
obj[guy].on('touchstart', onDown);

function onDown (eventData) {

	if(obj[guy].groundObj != -1) {
		obj[guy].velocity.x = Math.floor(Math.random() * (15 - -15 + 1)) + -15;
		obj[guy].velocity.y = -15;
		detachPlatform(obj[guy], obj[guy].groundObj);
	}
}

//
// ACTION
//

// Animation Frame:
animFrame();
function animFrame() {

    requestAnimationFrame(animFrame);

	// Handle Guy's movement:
	charMovement(obj[guy]);

	// Handle every other object's movement:
	var objCount = obj.length;
	for(var i = 1; i < objCount; i++) {
		objMovement(obj[i])
	}

    // Render:
    renderer.render(stage);
}

// Character movement:
function charMovement(char) {

	// Char bounds:
	var charRadiusY = char.height * (1 - char.anchor.y);
	var charRadiusX = char.width * (1 - char.anchor.x);

	// Object collision:
	var objCount = obj.length;
	for(var i = 0; i < objCount; i++) {

		var plat = obj[i];

		// Check current plaform first:
		if(i == 0 && char.groundObj != -1) {
			plat = char.groundObj;
		} else if(plat == char.groundObj) {
			continue;
		}

		var platformHeight = plat.position.y - plat.height * (1 - plat.anchor.y);
		var platformState = onPlatform(char, plat);

		if(platformState == 2) {

			char.position.y = platformHeight - charRadiusY;

			if(Math.abs(char.velocity.y - 0) < 1 || char.bounce == 0) {
				// Landing
				char.groundObj = plat;
			} else {
				// Bouncing:
				char.velocity.y = (char.velocity.y * -1) * char.bounce;
			}

			break;
		} else if(plat == char.groundObj) {

			// Still on last platform?:
			if(platformState == 1) /* Yes */ {
				break;
			} else /* Nope */ {
				detachPlatform(char, char.groundObj);
			}
		}
	}

	// Move through side edges:
	if(char.position.x > gameWidth + charRadiusX) {
		char.position.x = (charRadiusX*-1) - 1;
	} else if(char.position.x < charRadiusX*-1) {
		char.position.x = gameWidth + charRadiusX + 1;
	}

	// Tilt character with velocity:
	char.rotation = char.velocity.x / -50;

	if(char.groundObj != -1) /* ON PLATFORM */ {

		// Glue to platform:
		char.velocity.y = char.groundObj.velocity.y;

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

		char.position.x += char.velocity.x + char.groundObj.velocity.x;
		char.position.y += char.velocity.y + char.groundObj.velocity.y;
	} else /* IN THE AIR */ {

		// Horizontal movement:
		if(right.isDown && char.velocity.x < 15) {
			char.velocity.x += 0.25;
		}
		if(left.isDown && char.velocity.x > -15) {
			char.velocity.x -= 0.25;
		}

		// Gravity:
		char.velocity.y += char.gravity;

		// Move character with velocity:
		char.position.x += char.velocity.x;
		char.position.y += char.velocity.y;
	}

	// Scroll stage:
	if(char.position.y <= gameHeight/2) {
		stage.position.y = char.position.y*-1 + gameHeight/2;
	}
}

// Object movement:
function objMovement(object) {

	var objRadiusX = object.width * (1 - object.anchor.x);

	// Move through side edges:
	if (object.position.x > gameWidth + objRadiusX) {
		object.position.x = (objRadiusX*-1) - 1;
	} else if(object.position.x < objRadiusX*-1) {
		object.position.x = gameWidth + objRadiusX + 1;
	}

	// Move with velocity:
	object.position.x += object.velocity.x;
	object.position.y += object.velocity.y;
}

function onPlatform(char, platform) {

	var charRadiusY = char.height * (1 - char.anchor.y);
	var charRadiusX = char.width * (1 - char.anchor.x);

	var platformHeight = platform.height * (1 - platform.anchor.y);
	var platformWidth = platform.width * (1 - platform.anchor.x);

	if(char.position.y + charRadiusY <= platform.position.y - platformHeight
	&& char.position.x - 10 <= platform.position.x + platformWidth
	&& char.position.x + 10 >= platform.position.x - platformWidth) {

		if(char.position.y + charRadiusY + char.velocity.y >= platform.position.y - platformHeight) {

			// Hitting the platform:
			return 2;
		}

		// Under/on the platform:
		return 1;
	}

	// Above/away from platform:
	return 0;
}

function detachPlatform(char, platform) {

	if(char.groundObj == platform) {
		char.velocity.x += platform.velocity.x;
		char.velocity.y += platform.velocity.y;

		char.groundObj = -1;
	}
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
