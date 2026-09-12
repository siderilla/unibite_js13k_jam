// -------------------------
// PIXEL FONT (3x5 bitmap glyphs)
// -------------------------

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

// -------------------------
// DRAW TEXT
// -------------------------
// Relies on `ctx`, which is created in game.js — safe because this
// function only runs later, once the game loop calls it.

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