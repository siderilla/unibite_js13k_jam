const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

const gameStats = {
	score: 0,
	combo: 0,
	maxCombo: 0,
	missed: 0,
	rainbows: 0,
	timeLeft: 60,
	isGameStarted: false,
	isGameOver: false,
	level: 0,
	poisonFlash: 0,
	bonusFlash: 0
};

const pixelFont = {
	'0': "111101101101111", '1': "010110010010111", '2': "111001111100111",
	'3': "111001011001111", '4': "101101111001001", '5': "111100111001111",
	'6': "111100111101111", '7': "111001010100100", '8': "111101111101111",
	'9': "111101111001111", 'a': "010101111101101", 'b': "110101110101110",
	'c': "011100100100011", 'd': "110101101101110", 'e': "111100111100111",
	'f': "111100110100100", 'g': "011100101101011", 'h': "101101111101101",
	'i': "111010010010111", 'j': "001001001101010", 'k': "101110100110101",
	'l': "100100100100111", 'm': "101111101101101", 'n': "110101101101101",
	'o': "111101101101111", 'p': "111101111100100", 'q': "111101101111001",
	'r': "110101110101101", 's': "111100111001111", 't': "111010010010010",
	'u': "101101101101111", 'v': "101101101101010", 'w': "101101101111101",
	'x': "101101010101101", 'y': "101101010010010", 'z': "111001010100111",
	':': "000010000010000", '!': "010010010000010", "'": "010010000000000",
	'+': "010010111010010", '-': "000000111000000"
};

let particles = [];
let floatingTexts = [];

const boxSprite = new Image();
boxSprite.src = "data:image/png;base64,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";

const candyRegularSprite = new Image();
candyRegularSprite.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAQCAYAAAB3AH1ZAAAAXUlEQVRIiWNgGAWjAAv4////f3rpZyRGMyMjI4Y6UizHp5+JGMUk+QiL/k133uPUj+EAegOsDth89wMKG5lPKiCkF2fcYAs2PxVBktMCsgNI0U/QMfTUPwpGAU0BAJsrM3kglAmXAAAAAElFTkSuQmCC";

const candyRainbowSprite = new Image();
candyRainbowSprite.src = "data:image/png;base64,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";

const unicornSprite = new Image();
unicornSprite.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAAAgCAYAAACinX6EAAACGElEQVRoge2YMU/CQBTH/6cNoyROJg4w6GDCoAniLHGHmBgGJxdNHBw7ucnEhom7DvoZTEz8AhCdFZYOJLowgIuh5Dlgz2t7LbRcKZL+kybN9fp+7717944CJEqUKFGixdSgV6BBr0B+c5bmwYkopXUNDHoF7+eqgUREjDEmBq11DdUYTzYAZvb3yOKaqxnmx2cROACzv8fHtK4Blv1UygnCBsBY9tPzvVCO6cUaAUAnV0G6XOLjN/uv9onGGqIIXi/W8MsnXz4AxpgvP/AWcAZfz6dGhg5XgH3H5MwHFBcZ54uq51NyPv62pJe9QE1QL9aok6vYgteq/RFc0M7Jlc2BIIxJ+V+XD7itHuHm8duX32wP0WiZnj4EXp7jC4PE4PGyPnrw9CSd32wPAQC7m5qSUnDxgZEPcj4T+FJ7oZwa9Ao0Dm6BLalKQEg+U5oAS7LyVr3iUfN5D5A1l6BwAMhvLAcxwxUX35YlscMDwP11RprFcY2t2R6GqoA4+K5TwIKnyyX+M5b0LSJ9iyaBT6tZ811ZOn/eJgDuLgv4dnqx9MJWwDzwbaKDA+KXQ42WSY2Wye/F8anBM+QHypJVfs4jTqYoToG4+RCzLGZbvBdXY9H4kMGdDoiOLhqfl6Bzn8mAUSVANX/ijyEvg9a484vr/e5sUtP/gm/LsrgCb7enM/m7K26+bQVmBp0jfjzQOeInSpRoMfUDhvB2N2a+M28AAAAASUVORK5CYII=";

let W, H;

function resize() {
	W = canvas.width = innerWidth;
	H = canvas.height = innerHeight;

	ctx.imageSmoothingEnabled = false;
}

addEventListener("resize", resize);
resize();


// -------------------------
// CANDY BOX
// -------------------------

const box = {
	x: 0,
	y: 0,
	w: 64,
	h: 64,

	scale: 5,

	t: 0,

	frame: 0,

	state: "closed",
	stateTimer: 0,

	spawnTimer: 0,
	spawnIndex: 0,

	pattern: null
};

const unicorn = {
	x: 0,
	y: 0,
	w: 32,
	h: 32,

	scale: 4,

	frame: 0
};

const BOX_TIMINGS = {

	// opening → 0.3 s
	// open    → 1.2 s
	// closing → 0.3 s
	// closed  → 0.7 s

	opening: 400,
	open: 2500,
	closing: 400,
	closed: 1000

};

const CANDY_PATTERNS = [
	// 1
	{
		types: ["regular", "rainbow", "regular", "rainbow", "regular"],
		velocities: [-1.2, -0.6, 0, 0.6, 1.2],
		interval: 450
	},

	// 2
	{
		types: ["rainbow", "regular", "regular", "rainbow"],
		velocities: [-1, -0.3, 0.5, 1.1],
		interval: 500
	},

	// 3
	{
		types: ["regular", "regular", "rainbow", "regular", "rainbow", "regular"],
		velocities: [-1.3, -0.7, -0.2, 0.4, 0.9, 1.3],
		interval: 400
	},

	// 4
	{
		types: ["rainbow", "regular", "rainbow", "regular", "regular"],
		velocities: [1.2, 0.5, 0, -0.5, -1.1],
		interval: 480
	},

	// 5
	{
		types: ["regular", "rainbow", "regular", "regular"],
		velocities: [-1.3, -0.4, 0.6, 1.2],
		interval: 550
	},

	// 6
	{
		types: ["regular", "regular", "rainbow", "rainbow", "regular"],
		velocities: [1.1, 0.5, -0.1, -0.7, -1.3],
		interval: 430
	},

	// 7
	{
		types: ["rainbow", "regular", "rainbow", "regular", "rainbow"],
		velocities: [-0.8, -0.2, 0.4, 0.9, 1.3],
		interval: 520
	},

	// 8
	{
		types: ["regular", "rainbow", "regular", "rainbow", "regular", "regular"],
		velocities: [1.3, 0.8, 0.3, -0.3, -0.8, -1.3],
		interval: 400
	},

	// 9
	{
		types: ["regular", "rainbow", "regular", "regular", "rainbow"],
		velocities: [-0.5, 0.2, 0.8, 1.2, -1.1],
		interval: 470
	},

	// 10
	{
		types: ["rainbow", "regular", "regular", "rainbow", "regular", "rainbow"],
		velocities: [0.6, 1.2, 0.3, -0.4, -1.0, -1.3],
		interval: 450
	},

	// 11
	{
		types: ["regular", "regular", "rainbow", "regular"],
		velocities: [1.3, 0.5, -0.4, -1.2],
		interval: 580
	},

	// 12
	{
		types: ["rainbow", "regular", "rainbow", "regular", "regular"],
		velocities: [-1.1, -0.5, 0.2, 0.8, 1.3],
		interval: 500
	},

	// 13
	{
		types: ["regular", "rainbow", "regular", "rainbow", "regular", "rainbow"],
		velocities: [-1.3, -0.7, 0, 0.7, 1.1, 1.3],
		interval: 420
	}
];

let candies = [];

// -------------------------
// ANIMAZIONE
// -------------------------

function update(deltaTime) {
	if (!gameStats.isGameStarted) return;
	if (gameStats.isGameOver) return;

	if (gameStats.poisonFlash > 0) {
		gameStats.poisonFlash -= deltaTime;
	}

	if (gameStats.bonusFlash > 0) {
		gameStats.bonusFlash -= deltaTime;
	}

	// countdown managing
	if (!gameStats.timeTimer) gameStats.timeTimer = 0;
	gameStats.timeTimer += deltaTime;

	const boxSpeed = 0.012 + (gameStats.level * 0.0015);
	box.t += boxSpeed;

	// every 1000ms
	if (gameStats.timeTimer >= 1000) {
		gameStats.timeTimer -= 1000;
		gameStats.timeLeft--;

		// check if time is over
		if (gameStats.timeLeft <= 0) {
			gameStats.timeLeft = 0;
			gameStats.isGameOver = true;
		}
	}

	const range = Math.min(W * 0.35, 300);

	box.x = W / 2 + Math.sin(box.t) * range;

	box.y =
		H / 2 +
		Math.sin(box.t * 2) * 25;

	updateBoxState(deltaTime);
	updateCandies(deltaTime);
	updateEffects();
}

// -------------------------
// GAME OVER SCREEN
// -------------------------

function drawGameOver() {
	ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
	ctx.fillRect(0, 0, W, H);

	drawPixelText("time's up!", W / 2, H / 2 - 100, 8, "#FFFFFF", "center");

	drawPixelText(gameStats.score, W / 2, H / 2 - 20, 10, "#FFFF00", "center");

	drawPixelText("click to restart", W / 2, H / 2 + 80, 4, "#FFC0CB", "center");
}

// -------------------------
// START SCREEN
// -------------------------

function drawStartScreen() {
	ctx.fillStyle = "rgb(100, 31, 89)";
	ctx.fillRect(0, 0, W, H);

	drawPixelText("uni-bite", W / 2, H / 2 - 140, 8, "#ffffff", "center");

	drawPixelText("controls:", W / 2, H / 2 - 50, 4, "#FFFFFF", "center");
	drawPixelText("move mouse ! hold click to eat", W / 2, H / 2 - 10, 3, "#FFFFFF", "center");

	drawPixelText("green candy: poison", W / 2, H / 2 + 50, 3, "#55FF55", "center");
	drawPixelText("gold candy: +5 sec", W / 2, H / 2 + 80, 3, "#FFD700", "center");

	drawPixelText("eat rainbows for combos! 3x pts", W / 2, H / 2 + 110, 3, "#FF69B4", "center");

	drawPixelText("click or press key", W / 2, H / 2 + 160, 4, "#ff9dff", "center");
	drawPixelText("to start", W / 2, H / 2 + 195, 4, "#ff9dff", "center");
}

// -------------------------
// DRAW
// -------------------------

function draw() {
	ctx.clearRect(0, 0, W, H);
	
	if (!gameStats.isGameStarted) {
		drawStartScreen();
		return;
	}

	drawBox();
	drawCandies();
	drawUnicorn();
	drawEffects();

	const isFlashing = gameStats.poisonFlash > 0 && Math.floor(gameStats.poisonFlash / 75) % 2 !== 0;
	const isBonusFlashing = gameStats.bonusFlash > 0;

	if (isFlashing) {
		ctx.fillStyle = "rgba(50, 255, 50, 0.6)";
		ctx.fillRect(0, 0, W, H);
	} else if (isBonusFlashing) {
		ctx.fillStyle = "rgba(255, 255, 255, 0.71)";
		ctx.fillRect(0, 0, W, H);
	}

	drawUI();

	if (gameStats.isGameOver) {
		drawGameOver();
	}
}

// -------------------------
// DRAW TEXT
// -------------------------

function drawPixelText(text, x, y, size, color, align = "left") {
	ctx.fillStyle = color;
	const str = String(text).toLowerCase();

	let totalWidth = 0;
	for (let i = 0; i < str.length; i++) {
		totalWidth += (str[i] === " ") ? 3 * size : 4 * size;
	}

	let cursorX = align === "center" ? x - (totalWidth / 2) : x;

	for (let i = 0; i < str.length; i++) {
		const char = str[i];

		if (pixelFont[char]) {
			const pattern = pixelFont[char];

			for (let p = 0; p < pattern.length; p++) {
				if (pattern[p] === "1") {
					const px = (p % 3) * size;
					const py = Math.floor(p / 3) * size;
					ctx.fillRect(cursorX + px, y + py, size, size);
				}
			}
			cursorX += 4 * size;
		} else if (char === " ") {
			cursorX += 3 * size;
		}
	}
}

// -------------------------
// DRAW UI (HUD)
// -------------------------

function drawUI() {

	ctx.drawImage(candyRainbowSprite, 0, 0, 16, 16, 20, 20, 32, 32);
	drawPixelText(gameStats.score, 60, 24, 4, "#FFFFFF");

	if (gameStats.combo > 1) {
		drawPixelText(`x${gameStats.combo}`, 60, 50, 3, "#FFFF00");
	}

	if (gameStats.missed > 0) {
		ctx.drawImage(boxSprite, 0, 0, 64, 64, 20, 75, 32, 32);
		drawPixelText(gameStats.missed, 60, 80, 4, "#FFC0CB");
	}

	const timeText = gameStats.timeLeft < 10 ? `0${gameStats.timeLeft}` : `${gameStats.timeLeft}`;
	drawPixelText(timeText, W - 80, 24, 4, gameStats.timeLeft <= 10 ? "#FF0000" : "#FFFFFF");

}


// -------------------------
// BOX
// -------------------------

function drawBox() {
	const frameW = 64;
	const frameH = 64;
	const currentScale = box.scale;

	ctx.drawImage(
		boxSprite,
		box.frame * frameW,
		0,
		frameW,
		frameH,
		Math.round(box.x - (frameW * currentScale) / 2),
		Math.round(box.y - (frameH * currentScale) / 2),
		frameW * currentScale,
		frameH * currentScale
	);
}

function updateBoxState(deltaTime) {

	box.stateTimer += deltaTime;

	switch (box.state) {

		case "closed":

			box.frame = 0;

			if (box.stateTimer >= BOX_TIMINGS.closed) {
				box.state = "opening";
				box.stateTimer = 0;
			}

			break;


		case "opening":
			box.frame = Math.min(
				3,
				Math.floor(
					box.stateTimer /
					(BOX_TIMINGS.opening / 4)
				)
			);

			if (box.stateTimer >= BOX_TIMINGS.opening) {
				box.state = "open";
				box.stateTimer = 0;
				box.frame = 3;

				box.pattern = CANDY_PATTERNS[
					Math.floor(Math.random() * CANDY_PATTERNS.length)
				];

				box.spawnTimer = 0;
				box.spawnIndex = 0;
			}
			break;


		case "open":
			box.frame = 3;
			box.spawnTimer += deltaTime;

			const currentInterval = box.pattern.interval * (1 - (gameStats.level * 0.05));
			if (
				box.spawnIndex < box.pattern.types.length &&
				box.spawnTimer >= currentInterval
			) {
				spawnCandy(box.spawnIndex);
				box.spawnIndex++;
				box.spawnTimer = 0;
			}

			if (box.stateTimer >= BOX_TIMINGS.open) {
				box.state = "closing";
				box.stateTimer = 0;
			}
			console.log(box.pattern);

			break;


		case "closing":

			// frame 3 → 2 → 1 → 0

			box.frame = Math.max(
				0,
				3 - Math.floor(
					box.stateTimer /
					(BOX_TIMINGS.closing / 4)
				)
			);

			if (box.stateTimer >= BOX_TIMINGS.closing) {
				box.state = "closed";
				box.stateTimer = 0;
				box.frame = 0;
			}

			break;
	}

	console.log(
		box.state,
		box.frame,
		box.stateTimer,
		BOX_TIMINGS.closed
	);
}

// -------------------------
// CANDIES
// -------------------------

function drawCandies() {
	candies.forEach(candy => {
		const sprite = (candy.type === "rainbow" || candy.type === "clock")
			? candyRainbowSprite : candyRegularSprite;

		const currentScale = candy.scale;
		const size = 16 * currentScale;

		if (candy.type === "rotten") {
			ctx.filter = "sepia(1) hue-rotate(70deg) saturate(3)";
		} else if (candy.type === "clock") {
			ctx.filter = "brightness(1.5) sepia(1) hue-rotate(-20deg) saturate(5)";
		}

		ctx.drawImage(
			sprite,
			candy.frame * 16,
			0,
			16,
			16,
			candy.x - size / 2,
			candy.y - size / 2,
			size,
			size
		);

		ctx.filter = "none";
	});
}

// -------------------------
// SPAWN CANDIES
// -------------------------

function spawnCandy(index) {
	let actualType = box.pattern.types[index];

	const chance = Math.random();
	if (chance < 0.15) {
		actualType = "rotten";
	} else if (chance < 0.25) {
		actualType = "clock";
	}

	candies.push({
		x: box.x,
		y: box.y - 25,
		vx: box.pattern.velocities[index],
		vy: -2.2,
		type: actualType,
		frame: 0,
		frameTimer: 0,
		scale: 6
	});
}

function updateCandies(deltaTime) {
	candies = candies.filter(candy => {

		// 1. EATING CANDY
		if (checkCandyCollision(candy)) {
			if (candy.type === "rotten") {
				// MALUS
				gameStats.combo = 0;
				gameStats.score = Math.max(0, gameStats.score - 50);
				gameStats.timeLeft = Math.max(0, gameStats.timeLeft - 3);

				gameStats.poisonFlash = 300;

				spawnFloatingText(candy.x, candy.y - 30, "--3", "#11cc00");
			} else if (candy.type === "clock") {
				// BONUS
				gameStats.combo++;
				if (gameStats.combo > gameStats.maxCombo) gameStats.maxCombo = gameStats.combo;
				gameStats.score += 5 * gameStats.combo;
				gameStats.timeLeft += 5;

				gameStats.bonusFlash = 80;

				spawnFloatingText(candy.x, candy.y - 30, "+5", "#FFD700");
			} else {
				// regular or rainbow
				gameStats.combo++;
				if (gameStats.combo > gameStats.maxCombo) gameStats.maxCombo = gameStats.combo;
				const basePoints = candy.type === "rainbow" ? 3 : 1;
				if (candy.type === "rainbow") gameStats.rainbows++;
				const totalPoints = basePoints * gameStats.combo;
				gameStats.score += totalPoints;
			}

			gameStats.level = Math.min(10, Math.floor(gameStats.score / 40));
			spawnParticles(candy.x, candy.y, candy.type);
			return false;
		}

		// 2. MISSING CANDY
		if (candy.y >= H + 50) {
			if (candy.type !== "rotten") {
				gameStats.missed++;
				gameStats.combo = 0; // restart combo
			}
			return false;
		}

		return true;
	});

	candies.forEach(candy => {
		candy.x += candy.vx;
		candy.y += candy.vy;
		const currentGravity = 0.045 + (gameStats.level * 0.002);
		candy.vy += currentGravity;
	});
}

function checkCandyCollision(candy) {
	if (unicorn.frame !== 1) {
		return false;
	}

	const distanceX = candy.x - unicorn.x;
	const distanceY = candy.y - unicorn.y;

	const distance = Math.sqrt(
		distanceX * distanceX +
		distanceY * distanceY
	);

	const hitRadius = 12 * unicorn.scale;

	return distance < hitRadius;
}

// -------------------------
// UNICORN
// -------------------------

function drawUnicorn() {
	const currentScale = unicorn.scale;
	const width = unicorn.w * currentScale;
	const height = unicorn.h * currentScale;

	const isFlashing = gameStats.poisonFlash > 0 && Math.floor(gameStats.poisonFlash / 75) % 2 !== 0;
	const isBonusFlashing = gameStats.bonusFlash > 0;

	if (isFlashing) {
		ctx.filter = "brightness(2) sepia(1) hue-rotate(70deg) saturate(5)";
	} else if (isBonusFlashing) {
		ctx.filter = "brightness(3)";
	}

	ctx.drawImage(
		unicornSprite,
		unicorn.frame * unicorn.w,
		0,
		unicorn.w,
		unicorn.h,
		unicorn.x - width / 2,
		unicorn.y - height / 2,
		width,
		height
	);

	ctx.filter = "none";
}

// -------------------------
// OPEN / CLOSE MOUTH ON CLICK
// -------------------------

addEventListener("mousedown", (event) => {

	// if gamestart
	if (!gameStats.isGameStarted) {
		gameStats.isGameStarted = true;
		lastTime = 0;
		return;
	}

	// if gameover, click will restart the game
	if (gameStats.isGameOver) {
		gameStats.score = 0;
		gameStats.combo = 0;
		gameStats.missed = 0;
		gameStats.rainbows = 0;
		gameStats.timeLeft = 60;
		gameStats.isGameOver = false;
		gameStats.level = 0;
		gameStats.poisonFlash = 0;
		gameStats.bonusFlash = 0;

		// clean the view
		candies = [];
		particles = [];
		floatingTexts = [];

		// box restore
		box.state = "closed";
		box.stateTimer = 0;
		return; // exit so unicorn's open mouth won't trigger
	}

	// normal behavior
	if (event.button === 0) {
		unicorn.frame = 1;
	}
});

addEventListener("mouseup", (event) => {
	if (event.button === 0) {
		unicorn.frame = 0;
	}
});

addEventListener("mousemove", (event) => {
	unicorn.x = event.clientX;
	unicorn.y = event.clientY;
});

addEventListener("keydown", (event) => {
	if (!gameStats.isGameStarted) {
		gameStats.isGameStarted = true;
		lastTime = 0;
	}
});

// -------------------------
// EATEN CANDY PARTICLES EFFECTS
// -------------------------

function spawnParticles(x, y, type) {
	let colors = ["#FFFFFF", "#FFC0CB"]; // Normal
	if (type === "rainbow") colors = ["#FF0000", "#00FF00", "#0000FF", "#FFFF00"];
	if (type === "rotten") colors = ["#00FF00", "#005500", "#224422"];
	if (type === "clock") colors = ["#FFFF00", "#FFD700", "#FFFFFF"];

	for (let i = 0; i < 7; i++) {
		particles.push({
			x: x,
			y: y,
			vx: (Math.random() - 0.5) * 4,
			vy: (Math.random() - 0.5) * 4,
			life: 1.0,
			color: colors[Math.floor(Math.random() * colors.length)]
		});
	}
}

// -------------------------
// FLOATING TEXTS
// -------------------------

function spawnFloatingText(x, y, text, color, size = 6) {
	floatingTexts.push({
		x: x,
		y: y,
		text: text,
		color: color,
		size: size,
		life: 1.0,
		vy: -1.5
	});
}

// -------------------------
// UPDATE EFFECTS
// -------------------------

function updateEffects() {
	// update particles life
	particles = particles.filter(p => {
		p.x += p.vx;
		p.y += p.vy;
		p.life -= 0.01;
		return p.life > 0;
	});

	// update floating texts
	floatingTexts = floatingTexts.filter(t => {
		t.y += t.vy;
		t.life -= 0.015;
		return t.life > 0;
	});
}

// -------------------------
// DRAW EFFECTS
// -------------------------

function drawEffects() {
	ctx.globalAlpha = 1.0;

	// draw particles
	particles.forEach(p => {
		ctx.fillStyle = p.color;
		ctx.fillRect(Math.round(p.x), Math.round(p.y), 6, 6);
	});

	// draw floating texts
	floatingTexts.forEach(t => {
		drawPixelText(t.text, Math.round(t.x), Math.round(t.y), t.size, t.color, "center");
	});
}

// -------------------------
// LOOP
// -------------------------

let lastTime = 0;

function loop(time) {
	if (lastTime === 0) lastTime = time;

	const deltaTime = time - lastTime;
	lastTime = time;

	update(deltaTime);
	draw();

	requestAnimationFrame(loop);
}

requestAnimationFrame(loop);