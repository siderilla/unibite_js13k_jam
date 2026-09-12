// -------------------------
// SETUP
// -------------------------

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

// -------------------------
// GAME STATE
// -------------------------

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

// -------------------------
// CANVAS RESIZE
// -------------------------

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
// UPDATE LOOP
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

	drawPixelText(
		"GITHUB: SIDERILLA",
		canvas.width / 2,
		canvas.height - 55,
		5,
		"#ffffff",
		"center"
	);
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

	drawPixelText(
		"GITHUB: SIDERILLA",
		canvas.width / 2,
		canvas.height - 55,
		5,
		"#ffffff",
		"center"
	);
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
// DRAW UI (HUD)
// -------------------------

function drawUI() {

	ctx.drawImage(candyRainbowSprite, 0, 0, 16, 16, 12, 16, 48, 48);
	drawPixelText(gameStats.score, 60, 24, 4, "#FFFFFF");

	if (gameStats.combo > 1) {
		drawPixelText(`x${gameStats.combo}`, 60, 50, 3, "#FFFF00");
	}

	if (gameStats.missed > 0) {
		ctx.drawImage(boxSprite, 0, 0, 64, 64, 20, 75, 32, 32);
		drawPixelText(gameStats.missed, 60, 80, 4, "#FFC0CB");
	}

	const timeText = gameStats.timeLeft < 10 ? `0${gameStats.timeLeft}` : `${gameStats.timeLeft}`;

	let timeColor = "#FFFFFF";
	if (gameStats.timeLeft <= 20) {
		const isBlinking = Math.floor(performance.now() / 250) % 2 === 0;
		timeColor = isBlinking ? "#FF0000" : "#FFD700";
	}

	drawPixelText(timeText, W - 80, 24, 8, timeColor);

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
}

// -------------------------
// CANDIES
// -------------------------
// The green (rotten/malus) and gold (clock/bonus) tints are pure
// canvas filters applied at draw time — they work on whatever image
// is currently loaded into the sprite, so swapping the sprite sources
// from base64 to external files doesn't affect them.

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
	} else if (chance < 0.25 && gameStats.timeLeft <= 20) {
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
				playSfx(bufMalus); // malus sound

				gameStats.combo = 0;
				gameStats.score = Math.max(0, gameStats.score - 50);
				gameStats.timeLeft = Math.max(0, gameStats.timeLeft - 3);
				gameStats.poisonFlash = 300;
				spawnFloatingText(candy.x, candy.y - 30, "--3", "#11cc00");

			} else if (candy.type === "clock") {
				// BONUS
				playSfx(bufBonus); // bonus sound

				gameStats.combo++;
				if (gameStats.combo > gameStats.maxCombo) gameStats.maxCombo = gameStats.combo;
				gameStats.score += 5 * gameStats.combo;
				gameStats.timeLeft += 5;
				gameStats.bonusFlash = 80;
				spawnFloatingText(candy.x, candy.y - 30, "+5", "#FFD700");

			} else {
				// regular or rainbow
				if (candy.type === "rainbow") {
					playSfx(bufMunch); // rainbow sound
				} else {
					playSfx(bufMunch); // munch sound
				}

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
// OPEN / CLOSE MOUTH ON CLICK & START GAME
// -------------------------

addEventListener("mousedown", (event) => {
	// if the game hasn't started yet
	if (!gameStats.isGameStarted) {
		gameStats.isGameStarted = true;
		lastTime = performance.now();

		if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();

		if (musicReady && musicAudio) {
			musicAudio.play();
		}
		return;
	}

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

		candies = [];
		particles = [];
		floatingTexts = [];

		box.state = "closed";
		box.stateTimer = 0;
		return;
	}

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
		lastTime = performance.now();

		if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();

		// start the actual music
		if (musicReady && musicAudio) {
			musicAudio.play();
		}
	}
});

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