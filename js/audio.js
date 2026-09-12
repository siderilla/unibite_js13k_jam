// -------------------------
// SOUNDBOX AUDIO ENGINE
// -------------------------

var CPlayer = function () {

	//--------------------------------------------------------------------------
	// Private methods
	//--------------------------------------------------------------------------

	// Oscillators
	var osc_sin = function (value) {
		return Math.sin(value * 6.283184);
	};

	var osc_saw = function (value) {
		return 2 * (value % 1) - 1;
	};

	var osc_square = function (value) {
		return (value % 1) < 0.5 ? 1 : -1;
	};

	var osc_tri = function (value) {
		var v2 = (value % 1) * 4;
		if (v2 < 2) return v2 - 1;
		return 3 - v2;
	};

	var getnotefreq = function (n) {
		// 174.61.. / 44100 = 0.003959503758 (F3)
		return 0.003959503758 * (2 ** ((n - 128) / 12));
	};

	var createNote = function (instr, n, rowLen) {
		var osc1 = mOscillators[instr.i[0]],
			o1vol = instr.i[1],
			o1xenv = instr.i[3] / 32,
			osc2 = mOscillators[instr.i[4]],
			o2vol = instr.i[5],
			o2xenv = instr.i[8] / 32,
			noiseVol = instr.i[9],
			attack = instr.i[10] * instr.i[10] * 4,
			sustain = instr.i[11] * instr.i[11] * 4,
			release = instr.i[12] * instr.i[12] * 4,
			releaseInv = 1 / release,
			expDecay = -instr.i[13] / 16,
			arp = instr.i[14],
			arpInterval = rowLen * (2 ** (2 - instr.i[15]));

		var noteBuf = new Int32Array(attack + sustain + release);

		// Re-trig oscillators
		var c1 = 0, c2 = 0;

		// Local variables.
		var j, j2, e, t, rsample, o1t, o2t;

		// Generate one note (attack + sustain + release)
		for (j = 0, j2 = 0; j < attack + sustain + release; j++, j2++) {
			if (j2 >= 0) {
				// Switch arpeggio note.
				arp = (arp >> 8) | ((arp & 255) << 4);
				j2 -= arpInterval;

				// Calculate note frequencies for the oscillators
				o1t = getnotefreq(n + (arp & 15) + instr.i[2] - 128);
				o2t = getnotefreq(n + (arp & 15) + instr.i[6] - 128) * (1 + 0.0008 * instr.i[7]);
			}

			// Envelope
			e = 1;
			if (j < attack) {
				e = j / attack;
			} else if (j >= attack + sustain) {
				e = (j - attack - sustain) * releaseInv;
				e = (1 - e) * (3 ** (expDecay * e));
			}

			// Oscillator 1
			c1 += o1t * e ** o1xenv;
			rsample = osc1(c1) * o1vol;

			// Oscillator 2
			c2 += o2t * e ** o2xenv;
			rsample += osc2(c2) * o2vol;

			// Noise oscillator
			if (noiseVol) {
				rsample += (2 * Math.random() - 1) * noiseVol;
			}

			// Add to (mono) channel buffer
			noteBuf[j] = (80 * rsample * e) | 0;
		}

		return noteBuf;
	};


	//--------------------------------------------------------------------------
	// Private members
	//--------------------------------------------------------------------------

	// Array of oscillator functions
	var mOscillators = [
		osc_sin,
		osc_square,
		osc_saw,
		osc_tri
	];

	// Private variables set up by init()
	var mSong, mLastRow, mCurrentCol, mNumWords, mMixBuf;


	//--------------------------------------------------------------------------
	// Initialization
	//--------------------------------------------------------------------------

	this.init = function (song) {
		// Define the song
		mSong = song;

		// Init iteration state variables
		mLastRow = song.endPattern;
		mCurrentCol = 0;

		// Prepare song info
		mNumWords = song.rowLen * song.patternLen * (mLastRow + 1) * 2;

		// Create work buffer (initially cleared)
		mMixBuf = new Int32Array(mNumWords);
	};


	//--------------------------------------------------------------------------
	// Public methods
	//--------------------------------------------------------------------------

	// Generate audio data for a single track
	this.generate = function () {
		// Local variables
		var i, j, b, p, row, col, n, cp,
			k, t, lfor, e, x, rsample, rowStartSample, f, da;

		// Put performance critical items in local variables
		var chnBuf = new Int32Array(mNumWords),
			instr = mSong.songData[mCurrentCol],
			rowLen = mSong.rowLen,
			patternLen = mSong.patternLen;

		// Clear effect state
		var low = 0, band = 0, high;
		var lsample, filterActive = false;

		// Clear note cache.
		var noteCache = [];

		// Patterns
		for (p = 0; p <= mLastRow; ++p) {
			cp = instr.p[p];

			// Pattern rows
			for (row = 0; row < patternLen; ++row) {
				// Execute effect command.
				var cmdNo = cp ? instr.c[cp - 1].f[row] : 0;
				if (cmdNo) {
					instr.i[cmdNo - 1] = instr.c[cp - 1].f[row + patternLen] || 0;

					// Clear the note cache since the instrument has changed.
					if (cmdNo < 17) {
						noteCache = [];
					}
				}

				// Put performance critical instrument properties in local variables
				var oscLFO = mOscillators[instr.i[16]],
					lfoAmt = instr.i[17] / 512,
					lfoFreq = (2 ** (instr.i[18] - 9)) / rowLen,
					fxLFO = instr.i[19],
					fxFilter = instr.i[20],
					fxFreq = instr.i[21] * 43.23529 * 3.141592 / 44100,
					q = 1 - instr.i[22] / 255,
					dist = instr.i[23] * 1e-5,
					drive = instr.i[24] / 32,
					panAmt = instr.i[25] / 512,
					panFreq = 6.283184 * (2 ** (instr.i[26] - 9)) / rowLen,
					dlyAmt = instr.i[27] / 255,
					dly = instr.i[28] * rowLen & ~1;  // Must be an even number

				// Calculate start sample number for this row in the pattern
				rowStartSample = (p * patternLen + row) * rowLen;

				// Generate notes for this pattern row
				for (col = 0; col < 4; ++col) {
					n = cp ? instr.c[cp - 1].n[row + col * patternLen] : 0;
					if (n) {
						if (!noteCache[n]) {
							noteCache[n] = createNote(instr, n, rowLen);
						}

						// Copy note from the note cache
						var noteBuf = noteCache[n];
						for (j = 0, i = rowStartSample * 2; j < noteBuf.length; j++, i += 2) {
							chnBuf[i] += noteBuf[j];
						}
					}
				}

				// Perform effects for this pattern row
				for (j = 0; j < rowLen; j++) {
					// Dry mono-sample
					k = (rowStartSample + j) * 2;
					rsample = chnBuf[k];

					// We only do effects if we have some sound input
					if (rsample || filterActive) {
						// State variable filter
						f = fxFreq;
						if (fxLFO) {
							f *= oscLFO(lfoFreq * k) * lfoAmt + 0.5;
						}
						f = 1.5 * Math.sin(f);
						low += f * band;
						high = q * (rsample - band) - low;
						band += f * high;
						rsample = fxFilter == 3 ? band : fxFilter == 1 ? high : low;

						// Distortion
						if (dist) {
							rsample *= dist;
							rsample = rsample < 1 ? rsample > -1 ? osc_sin(rsample * .25) : -1 : 1;
							rsample /= dist;
						}

						// Drive
						rsample *= drive;

						// Is the filter active (i.e. still audiable)?
						filterActive = rsample * rsample > 1e-5;

						// Panning
						t = Math.sin(panFreq * k) * panAmt + 0.5;
						lsample = rsample * (1 - t);
						rsample *= t;
					} else {
						lsample = 0;
					}

					// Delay is always done, since it does not need sound input
					if (k >= dly) {
						// Left channel = left + right[-p] * t
						lsample += chnBuf[k - dly + 1] * dlyAmt;

						// Right channel = right + left[-p] * t
						rsample += chnBuf[k - dly] * dlyAmt;
					}

					// Store in stereo channel buffer (needed for the delay effect)
					chnBuf[k] = lsample | 0;
					chnBuf[k + 1] = rsample | 0;

					// ...and add to stereo mix buffer
					mMixBuf[k] += lsample | 0;
					mMixBuf[k + 1] += rsample | 0;
				}
			}
		}

		// Next iteration. Return progress (1.0 == done!).
		mCurrentCol++;
		return mCurrentCol / mSong.numChannels;
	};

	// Create a AudioBuffer from the generated audio data
	this.createAudioBuffer = function (context) {
		var buffer = context.createBuffer(2, mNumWords / 2, 44100);
		for (var i = 0; i < 2; i++) {
			var data = buffer.getChannelData(i);
			for (var j = i; j < mNumWords; j += 2) {
				data[j >> 1] = mMixBuf[j] / 65536;
			}
		}
		return buffer;
	};

	// Create a WAVE formatted Uint8Array from the generated audio data
	this.createWave = function () {
		// Create WAVE header
		var headerLen = 44;
		var l1 = headerLen + mNumWords * 2 - 8;
		var l2 = l1 - 36;
		var wave = new Uint8Array(headerLen + mNumWords * 2);
		wave.set(
			[82, 73, 70, 70,
				l1 & 255, (l1 >> 8) & 255, (l1 >> 16) & 255, (l1 >> 24) & 255,
				87, 65, 86, 69, 102, 109, 116, 32, 16, 0, 0, 0, 1, 0, 2, 0,
				68, 172, 0, 0, 16, 177, 2, 0, 4, 0, 16, 0, 100, 97, 116, 97,
				l2 & 255, (l2 >> 8) & 255, (l2 >> 16) & 255, (l2 >> 24) & 255]
		);

		// Append actual wave data
		for (var i = 0, idx = headerLen; i < mNumWords; ++i) {
			// Note: We clamp here
			var y = mMixBuf[i];
			y = y < -32767 ? -32767 : (y > 32767 ? 32767 : y);
			wave[idx++] = y & 255;
			wave[idx++] = (y >> 8) & 255;
		}

		// Return the WAVE formatted typed array
		return wave;
	};

	// Get n samples of wave data at time t [s]. Wave data in range [-2,2].
	this.getData = function (t, n) {
		var i = 2 * Math.floor(t * 44100);
		var d = new Array(n);
		for (var j = 0; j < 2 * n; j += 1) {
			var k = i + j;
			d[j] = t > 0 && k < mMixBuf.length ? mMixBuf[k] / 32768 : 0;
		}
		return d;
	};
};

// -------------------------
// SONG DATA
// -------------------------

var song = {
	songData: [
		{ // Instrument 0
			i: [3, 100, 128, 0, 0, 201, 128, 0, 0, 0, 5, 6, 58, 0, 0, 0, 0, 195, 6, 1, 2, 135, 0, 0, 32, 147, 6, 121, 6],
			p: [1],
			c: [{ n: [152, , , , 156, , , , 161, , , , 159, , , , 152, , , , 156, , , , 161, , , , 159], f: [] }]
		},
		{ // Instrument 1
			i: [1, 51, 128, 64, 0, 53, 128, 0, 64, 60, 4, 7, 52, 85, 64, 0, 2, 60, 4, 1, 2, 255, 0, 0, 32, 61, 5, 32, 6],
			p: [2],
			c: [{ n: [], f: [] }, { n: [135, , , , 135, , , , 135, , , , 135, , , , 135, , , , 135, , , , 135, , , , 135], f: [] }]
		},
	],
	rowLen: 5513, patternLen: 32, endPattern: 0, numChannels: 2
};

// -------------------------
// SOUNDBOX SFX DATA
// -------------------------

const sfxBonus = {
	songData: [{ i: [0, 100, 122, 0, 0, 201, 100, 14, 0, 0, 0, 39, 29, 0, 67, 2, 0, 195, 2, 1, 2, 122, 63, 119, 71, 147, 6, 84, 2], p: [1], c: [{ n: [182], f: [] }] }],
	rowLen: 5513, patternLen: 32, endPattern: 0, numChannels: 1
};
const sfxMalus = {
	songData: [{ i: [0, 100, 146, 0, 0, 201, 128, 0, 0, 63, 0, 6, 29, 0, 117, 0, 0, 195, 4, 1, 2, 122, 63, 119, 71, 147, 6, 84, 2], p: [1], c: [{ n: [134], f: [] }] }],
	rowLen: 5513, patternLen: 32, endPattern: 0, numChannels: 1
};
const sfxMunch = {
	songData: [{ i: [0, 183, 164, 0, 0, 85, 92, 0, 64, 0, 40, 0, 57, 51, 102, 2, 3, 76, 6, 1, 2, 52, 65, 26, 44, 28, 3, 0, 0], p: [1], c: [{ n: [180], f: [] }] }],
	rowLen: 5513, patternLen: 32, endPattern: 0, numChannels: 1
};

// -------------------------
// AUDIO LOADING
// -------------------------

let audioCtx;
let musicAudio;
let bufBonus, bufMalus, bufMunch;
let musicReady = false;

let pMusic = new CPlayer(); pMusic.init(song);
let pBonus = new CPlayer(); pBonus.init(sfxBonus);
let pMalus = new CPlayer(); pMalus.init(sfxMalus);
let pMunch = new CPlayer(); pMunch.init(sfxMunch);

// One completion flag per track, so each only keeps generating until it's done
let musicDone = false;
let bonusDone = false;
let malusDone = false;
let munchDone = false;

let generateInterval = setInterval(function () {
	// Each track only generates while its own flag is still false
	if (!musicDone) { if (pMusic.generate() >= 1) musicDone = true; }
	if (!bonusDone) { if (pBonus.generate() >= 1) bonusDone = true; }
	if (!malusDone) { if (pMalus.generate() >= 1) malusDone = true; }
	if (!munchDone) { if (pMunch.generate() >= 1) munchDone = true; }

	// Once all 4 tracks are done, unlock the game
	if (musicDone && bonusDone && malusDone && munchDone) {
		clearInterval(generateInterval);

		audioCtx = new (window.AudioContext || window.webkitAudioContext)();

		bufBonus = pBonus.createAudioBuffer(audioCtx);
		bufMalus = pMalus.createAudioBuffer(audioCtx);
		bufMunch = pMunch.createAudioBuffer(audioCtx);

		let wave = pMusic.createWave();
		musicAudio = document.createElement("audio");
		musicAudio.src = URL.createObjectURL(new Blob([wave], { type: "audio/wav" }));
		musicAudio.loop = true;

		musicReady = true;
	}
}, 0);

// -------------------------
// SFX PLAYER
// -------------------------

function playSfx(buffer) {
	if (!buffer || !audioCtx) return;
	if (audioCtx.state === "suspended") audioCtx.resume();

	let source = audioCtx.createBufferSource();
	source.buffer = buffer;

	let gainNode = audioCtx.createGain();

	gainNode.gain.value = 5.5;

	source.connect(gainNode);
	gainNode.connect(audioCtx.destination);

	source.start();
}