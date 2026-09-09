const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const boxSprite = new Image();
boxSprite.src = "./assets/box.png";

const candyRegularSprite = new Image();
candyRegularSprite.src = "./assets/candyregular.png";

const candyRainbowSprite = new Image();
candyRainbowSprite.src = "./assets/candyrainbow.png";

let W, H;

function resize() {
	W = canvas.width = innerWidth;
	H = canvas.height = innerHeight;
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

	t: 0,

	frame: 0,

	state: "closed",
	stateTimer: 0,

	spawnTimer: 0,
	spawnIndex: 0,

	pattern: null
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
}


// -------------------------
// DISEGNO
// -------------------------

function draw() {

	ctx.clearRect(0, 0, W, H);

	drawBox();
	drawCandies();
}


// -------------------------
// BOX
// -------------------------

function drawBox() {

	const frameW = 64;
	const frameH = 64;

	const x = box.x;
	const y = box.y;

	ctx.drawImage(
		boxSprite,

		// posizione del frame nello sprite sheet
		box.frame * frameW,
		0,

		// dimensione del frame
		frameW,
		frameH,

		// posizione sul Canvas
		x - frameW / 2,
		y - frameH / 2,

		// dimensione visualizzata
		frameW,
		frameH
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
		const sprite =
			candy.type === "rainbow"
				? candyRainbowSprite
				: candyRegularSprite;

		ctx.drawImage(
			sprite,
			candy.frame * 16,
			0,
			16,
			16,
			candy.x - 8,
			candy.y - 8,
			16,
			16
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
		frameTimer: 0
	});
}

function updateCandies(deltaTime) {

	candies = candies.filter(candy => candy.y < H + 50);
	candies.forEach(candy => {
		candy.x += candy.vx;
		candy.y += candy.vy;

		candy.vy += 0.045;
	});
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