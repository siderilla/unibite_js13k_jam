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
	isGameOver: false
};

let particles = [];
let floatingTexts = [];

const boxSprite = new Image();
boxSprite.src = "./assets/box.png";

const candyRegularSprite = new Image();
candyRegularSprite.src = "./assets/candyregular.png";

const candyRainbowSprite = new Image();
candyRainbowSprite.src = "./assets/candyrainbow.png";

const unicornSprite = new Image();
unicornSprite.src = "./assets/unicorn.png";

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

	box.t += 0.012;

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
// DISEGNO
// -------------------------

function draw() {

	ctx.clearRect(0, 0, W, H);

	drawBox();
	drawCandies();
	drawUnicorn();
	drawEffects();
	drawUI();
}

// -------------------------
// DRAW UI (HUD)
// -------------------------

function drawUI() {
	ctx.font = "bold 24px monospace";
	ctx.textAlign = "left";
	ctx.textBaseline = "top"; // Allinea il testo dall'alto

	// 1. Punteggio totale (Bianco)
	ctx.fillStyle = "#FFFFFF";
	ctx.fillText(`SCORE: ${gameStats.score}`, 20, 20);

	// 2. Combo attuale (Giallo, lo mostriamo solo se è maggiore di 1)
	if (gameStats.combo > 1) {
		ctx.fillStyle = "#FFFF00";
		ctx.fillText(`COMBO x${gameStats.combo}`, 20, 50);
	}

	// 3. Caramelle perse (Rosso/Rosa)
	if (gameStats.missed > 0) {
		ctx.fillStyle = "#FFC0CB";
		ctx.fillText(`MISSED: ${gameStats.missed}`, 20, 80);
	}
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

			if (
				box.spawnIndex < box.pattern.types.length &&
				box.spawnTimer >= box.pattern.interval
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
		const sprite = candy.type === "rainbow" ? candyRainbowSprite : candyRegularSprite;
		const currentScale = candy.scale;
		const size = 16 * currentScale;

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
	});
}

// -------------------------
// SPAWN CANDIES
// -------------------------

function spawnCandy(index) {
	candies.push({
		x: box.x,
		y: box.y - 25,
		vx: box.pattern.velocities[index],
		vy: -2.2,
		type: box.pattern.types[index],
		frame: 0,
		frameTimer: 0,

		scale: 6
	});
}

function updateCandies(deltaTime) {
	candies = candies.filter(candy => {
		// 1. EATING CANDY
		if (checkCandyCollision(candy)) {
			gameStats.combo++;
			if (gameStats.combo > gameStats.maxCombo) gameStats.maxCombo = gameStats.combo;

			const basePoints = candy.type === "rainbow" ? 3 : 1;
			if (candy.type === "rainbow") gameStats.rainbows++;

			const totalPoints = basePoints * gameStats.combo;
			gameStats.score += totalPoints;

			spawnParticles(candy.x, candy.y, candy.type);

			return false;
		}

		// 2. MISSING CANDY
		if (candy.y >= H + 50) {
			gameStats.missed++;
			gameStats.combo = 0; // restart combo
			return false; // remove the candy
		}

		return true;
	});

	candies.forEach(candy => {
		candy.x += candy.vx;
		candy.y += candy.vy;
		candy.vy += 0.045; // gravity
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
}

// -------------------------
// OPEN / CLOSE MOUTH ON CLICK
// -------------------------

addEventListener("mousedown", (event) => {
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

// -------------------------
// EATEN CANDY PARTICLES EFFECTS
// -------------------------

function spawnParticles(x, y, type) {
	const colors = type === "rainbow"
		? ["#FF0000", "#00FF00", "#0000FF", "#FFFF00"]
		: ["#FFFFFF", "#FFC0CB"];

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

	// draw points+
	ctx.font = "bold 24px monospace";
	ctx.textAlign = "center";
}

// -------------------------
// LOOP
// -------------------------

let lastTime = 0;

function loop(time) {
	const deltaTime = time - lastTime;
	lastTime = time;

	update(deltaTime);
	draw();

	requestAnimationFrame(loop);
}

requestAnimationFrame(loop);