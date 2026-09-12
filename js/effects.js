// -------------------------
// EFFECTS STATE (particles & floating combat text)
// -------------------------

let particles = [];
let floatingTexts = [];

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
// Relies on `ctx` (game.js) and `drawPixelText` (pixelFont.js), both
// loaded before this runs.

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