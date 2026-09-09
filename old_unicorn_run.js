const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const LANES = [
	{ color: '#FF0000', symbol: 'Ⅱ' }, // Rosso
	{ color: '#FFA500', symbol: '⌒' }, // Arancio
	{ color: '#FFFF00', symbol: '▲' }, // Giallo
	{ color: '#00FF00', symbol: '»' }, // Verde
	{ color: '#0000FF', symbol: '✦' }, // Blu
	{ color: '#4B0082', symbol: '✚' }, // Indaco
	{ color: '#EE82EE', symbol: '≋' }  // Violetto
];

let playerLane = 3;
let scrollOffset = 0; 

// Calcoli per l'arcobaleno orizzontale
const laneHeight = 45; // Altezza di ogni corsia
const totalRainbowHeight = laneHeight * 7;
// Centriamo l'arcobaleno verticalmente
const rainbowStartY = (canvas.height - totalRainbowHeight) / 2; 

// Posizione dell'unicorno (Fisso a sinistra, si muove solo su e giù)
const playerFixedX = 100;
let playerCurrentY = rainbowStartY + (3 * laneHeight) + (laneHeight / 2); // LERP Y

// MATRICE OSTACOLO (Muro a 8-bit)
const obstacleMatrix = [
	[1, 1, 1, 1, 1, 1],
	[1, 0, 0, 1, 0, 1],
	[1, 0, 0, 1, 0, 1],
	[1, 1, 1, 1, 1, 1],
	[0, 1, 1, 0, 1, 1]
];

// MATRICE NUVOLA
const cloudMatrix = [
	[0, 0, 0, 1, 1, 1, 0, 0],
	[0, 1, 1, 1, 1, 1, 1, 0],
	[1, 1, 1, 1, 1, 1, 1, 1],
	[0, 1, 1, 1, 1, 1, 1, 0]
];

// Nuvole distribuite ovunque (cielo sopra e cielo sotto)
const clouds = Array.from({ length: 8 }, () => ({
	x: Math.random() * canvas.width,
	y: Math.random() * canvas.height,
	speed: 0.5 + Math.random() * 1.5, // Scorrono verso sinistra
	pixelSize: 6 + Math.random() * 6
}));

let testObstacle = {
	lane: 1, 
	x: canvas.width + 100, // Nasce fuori dallo schermo a DESTRA
	speed: 6 // Ti viene incontro verso SINISTRA
};

function drawPixelArt(matrix, startX, startY, pixelSize, color) {
	ctx.fillStyle = color;
	for (let row = 0; row < matrix.length; row++) {
		for (let col = 0; col < matrix[row].length; col++) {
			if (matrix[row][col] === 1) {
				ctx.fillRect(startX + (col * pixelSize), startY + (row * pixelSize), pixelSize, pixelSize);
			}
		}
	}
}

// Nuovi Controlli (Su e Giù)
window.addEventListener('keydown', (e) => {
	if ((e.key === 'ArrowUp' || e.key === 'w') && playerLane > 0) playerLane--;
	if ((e.key === 'ArrowDown' || e.key === 's') && playerLane < 6) playerLane++;
});

function draw() {
	// 1. CIELO BLU (Sfondo solido)
	ctx.fillStyle = '#4CA1AF'; 
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	// 2. NUVOLE (Scorrono verso sinistra)
	clouds.forEach(cloud => {
		cloud.x -= cloud.speed;
		
		// Se escono a sinistra, rinascono a destra
		if (cloud.x + (cloudMatrix[0].length * cloud.pixelSize) < 0) {
			cloud.x = canvas.width + 50;
			cloud.y = Math.random() * canvas.height;
		}
		drawPixelArt(cloudMatrix, cloud.x, cloud.y, cloud.pixelSize, 'rgba(255, 255, 255, 0.9)');
	});

	// Aggiorniamo l'offset per l'effetto velocità dell'arcobaleno
	scrollOffset += testObstacle.speed;
	if (scrollOffset > 100) scrollOffset = 0;

	// 3. ARCOBALENO VIVIDO E INFINITO
	for (let i = 0; i < 7; i++) {
		const laneY = rainbowStartY + (i * laneHeight);
		
		// Colori solidi e accesi (Opacity 1.0)
		ctx.fillStyle = LANES[i].color;
		ctx.globalAlpha = 1.0; 
		ctx.fillRect(0, laneY, canvas.width, laneHeight);
		
		// Linee di scorrimento orizzontali (danno il senso della velocità)
		ctx.strokeStyle = 'rgba(255,255,255,0.5)';
		ctx.lineWidth = 3;
		ctx.setLineDash([30, 40]); 
		ctx.lineDashOffset = -scrollOffset; // Scorre verso sinistra
		
		ctx.beginPath();
		ctx.moveTo(0, laneY);
		ctx.lineTo(canvas.width, laneY);
		ctx.stroke();

		// Evidenziazione della corsia attuale (bordo bianco attorno)
		if (i === playerLane) {
			ctx.setLineDash([]);
			ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
			ctx.lineWidth = 4;
			ctx.strokeRect(0, laneY, canvas.width, laneHeight);
		}

		// Simboli fissi sulla sinistra per far ricordare i comandi
		ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
		ctx.font = 'bold 24px Arial';
		ctx.textAlign = 'left';
		ctx.textBaseline = 'middle';
		ctx.fillText(LANES[i].symbol, 10, laneY + (laneHeight / 2));
	}
	ctx.setLineDash([]); 

	// 4. OSTACOLO (Ti viene addosso da Destra)
	testObstacle.x -= testObstacle.speed;

	if (testObstacle.x < -100) {
		testObstacle.x = canvas.width + 100;
		testObstacle.lane = Math.floor(Math.random() * 7);
	}

	const obPixelSize = 10; 
	const obY = rainbowStartY + (testObstacle.lane * laneHeight) + (laneHeight / 2) - ((obstacleMatrix.length * obPixelSize) / 2);

	// Disegniamo l'ostacolo con il colore della corsia
	drawPixelArt(obstacleMatrix, testObstacle.x, obY, obPixelSize, '#FFF'); 
	// ^ Nota: L'ho fatto BIANCO brillante per farlo staccare dai colori accesi della pista, ma puoi rimettere LANES[testObstacle.lane].color

	// 5. L'UNICORNO (Si muove Su e Giù fluidamente)
	const targetY = rainbowStartY + (playerLane * laneHeight) + (laneHeight / 2);
	playerCurrentY += (targetY - playerCurrentY) * 0.2; // LERP sull'asse Y!

	// Disegniamo l'unicorno temporaneo (Ora guarda verso destra)
	ctx.fillStyle = '#FFF';
	// Corpo
	ctx.fillRect(playerFixedX - 20, playerCurrentY - 15, 40, 30); 
	// Corno (Sulla destra)
	ctx.fillStyle = '#FFD700'; 
	ctx.fillRect(playerFixedX + 20, playerCurrentY - 5, 20, 8); 

	requestAnimationFrame(draw);
}

draw();

// const canvas = document.getElementById('game');
// const ctx = canvas.getContext('2d');

// const LANES = [
// 	{ color: '#FF0000', symbol: 'Ⅱ' }, // Rosso
// 	{ color: '#FFA500', symbol: '⌒' }, // Arancio
// 	{ color: '#FFFF00', symbol: '▲' }, // Giallo
// 	{ color: '#00FF00', symbol: '»' }, // Verde
// 	{ color: '#0000FF', symbol: '✦' }, // Blu
// 	{ color: '#4B0082', symbol: '✚' }, // Indaco
// 	{ color: '#EE82EE', symbol: '≋' }  // Violetto
// ];

// let playerLane = 3;
// const horizonY = 150;

// // 1. LA MATRICE DELLA NUVOLA (1 = pixel bianco, 0 = vuoto)
// const cloudMatrix = [
// 	[0, 0, 0, 1, 1, 1, 0, 0, 0, 0],
// 	[0, 1, 1, 1, 1, 1, 1, 1, 0, 0],
// 	[1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
// 	[1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
// 	[0, 1, 1, 1, 1, 1, 1, 1, 1, 0]
// ];

// // MATRICE DELL'OSTACOLO (Un blocco stile "Space Invader" o "Muro")
// const obstacleMatrix = [
// 	[1, 1, 1, 1, 1],
// 	[1, 0, 1, 0, 1],
// 	[1, 1, 1, 1, 1],
// 	[0, 1, 0, 1, 0]
// ];

// // Generiamo il nostro primo ostacolo di test
// let testObstacle = {
// 	lane: 1,           // Parte sulla corsia Arancione
// 	y: horizonY,       // Nasce all'orizzonte
// 	speed: 1.5         // Velocità con cui ti viene incontro
// };

// // Creiamo le nuvole usando la nuova logica (pixelSize decide quanto è "sgranata" la nuvola)
// const clouds = Array.from({ length: 8 }, () => ({
// 	x: Math.random() * canvas.width,
// 	y: Math.random() * (canvas.height - 200), // Evitiamo che coprano troppo l'area in basso
// 	pixelSize: 3 + Math.random() * 5, // I "pixel" andranno da 3x3 a 8x8 (effetto profondità)
// 	speed: 0.2 + Math.random() * 0.4
// }));

// // 2. LA FUNZIONE MAGICA PER DISEGNARE LE MATRICI
// // Potrai usare questa funzione anche per ostacoli o particelle!
// function drawPixelArt(matrix, startX, startY, pixelSize, color) {
// 	ctx.fillStyle = color;
// 	// Cicliamo le righe (dall'alto in basso)
// 	for (let row = 0; row < matrix.length; row++) {
// 		// Cicliamo le colonne (da sinistra a destra)
// 		for (let col = 0; col < matrix[row].length; col++) {
// 			if (matrix[row][col] === 1) {
// 				// Se c'è un 1, disegna un rettangolo in quella posizione
// 				ctx.fillRect(
// 					startX + (col * pixelSize),
// 					startY + (row * pixelSize),
// 					pixelSize,
// 					pixelSize
// 				);
// 			}
// 		}
// 	}
// }

// window.addEventListener('keydown', (e) => {
// 	if ((e.key === 'ArrowLeft' || e.key === 'a') && playerLane > 0) playerLane--;
// 	if ((e.key === 'ArrowRight' || e.key === 'd') && playerLane < 6) playerLane++;
// });

// function draw() {
// 	// IL CIELO
// 	const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
// 	skyGradient.addColorStop(0, '#5DADE2');
// 	skyGradient.addColorStop(0.5, '#AED6F6');
// 	skyGradient.addColorStop(1, '#EBF5FB');
// 	ctx.fillStyle = skyGradient;
// 	ctx.fillRect(0, 0, canvas.width, canvas.height);

// 	// DISEGNAMO LE NUVOLE A 8-BIT
// 	clouds.forEach(cloud => {
// 		cloud.x -= cloud.speed;
// 		if (cloud.x + (cloudMatrix[0].length * cloud.pixelSize) < 0) {
// 			cloud.x = canvas.width;
// 			cloud.y = Math.random() * (canvas.height - 200);
// 		}

// 		// Chiamiamo la nostra funzione passando la matrice della nuvola
// 		drawPixelArt(cloudMatrix, cloud.x, cloud.y, cloud.pixelSize, 'rgba(255, 255, 255, 0.8)');
// 	});

// 	// Orizzonte (Punto di fuga)
// 	const vpX = canvas.width / 2;
// 	const vpY = horizonY;

// 	// LE CORSIE ARCOBALENO (Prospettiva a orizzonte largo)
//     const laneWidthBottom = 110; // Larghezza alla base dello schermo
//     const laneWidthTop = 15;     // Larghezza all'orizzonte (Non è più un puntino!)

//     const totalWidthBottom = laneWidthBottom * 7;
//     const totalWidthTop = laneWidthTop * 7;
	
//     const startXBottom = (canvas.width - totalWidthBottom) / 2;
//     const startXTop = (canvas.width - totalWidthTop) / 2;

//     for (let i = 0; i < 7; i++) {
//         // Calcoliamo i 4 angoli del trapezio della singola corsia
//         const bottomX1 = startXBottom + (i * laneWidthBottom);
//         const bottomX2 = bottomX1 + laneWidthBottom;
		
//         const topX1 = startXTop + (i * laneWidthTop);
//         const topX2 = topX1 + laneWidthTop;

//         // Disegniamo il trapezio
//         ctx.beginPath();
//         ctx.moveTo(bottomX1, canvas.height); // Angolo in basso a sx
//         ctx.lineTo(bottomX2, canvas.height); // Angolo in basso a dx
//         ctx.lineTo(topX2, horizonY);         // Angolo in alto a dx
//         ctx.lineTo(topX1, horizonY);         // Angolo in alto a sx
//         ctx.closePath();

//         ctx.fillStyle = LANES[i].color;
//         ctx.globalAlpha = i === playerLane ? 0.8 : 0.2; 
//         ctx.fill();
		
//         // Bordi della corsia
//         ctx.globalAlpha = 1.0;
//         ctx.strokeStyle = 'rgba(255,255,255,0.6)';
//         ctx.lineWidth = 1.5;
//         ctx.stroke();
//     }
	
//     // Disegniamo i simboli alla base
//     for (let i = 0; i < 7; i++) {
//         const bottomX1 = startXBottom + (i * laneWidthBottom);
//         ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
//         ctx.font = 'bold 24px Arial';
//         ctx.textAlign = 'center';
//         ctx.fillText(LANES[i].symbol, bottomX1 + (laneWidthBottom / 2), canvas.height - 20);
//     }

// 	// --- INIZIO DISEGNO OSTACOLO FULL-WIDTH A 8-BIT ---
//     const chunkySize = 6; // ECCO IL COLPEVOLE! Ora è definito.

//     testObstacle.y += testObstacle.speed; // Muovi l'ostacolo verso il basso

//     // Se esce dallo schermo, lo facciamo ripartire
//     if (testObstacle.y > canvas.height + 50) {
//         testObstacle.y = horizonY;
//         testObstacle.lane = Math.floor(Math.random() * 7); 
//     }

//     // Calcoliamo profondità
//     const obDepth = (testObstacle.y - horizonY) / (canvas.height - horizonY);
	
//     // NUOVO CALCOLO: Adatta la larghezza del muro alla nuova prospettiva!
//     const obCurrentLaneWidth = laneWidthTop + (obDepth * (laneWidthBottom - laneWidthTop));
//     const obTotalWidth = obCurrentLaneWidth * 7;
//     const obStartX = (canvas.width - obTotalWidth) / 2;

//     const obHeight = Math.floor(10 + (obDepth * 40));
//     const obDrawY = testObstacle.y - obHeight;

//     ctx.fillStyle = LANES[testObstacle.lane].color;

//     for (let yy = 0; yy < obHeight; yy += chunkySize) {
//         for (let xx = 0; xx < obTotalWidth; xx += chunkySize) {
//             const pixelX = Math.floor((obStartX + xx) / chunkySize) * chunkySize;
//             const pixelY = Math.floor((obDrawY + yy) / chunkySize) * chunkySize;

//             if ((Math.floor(xx / chunkySize) + Math.floor(yy / chunkySize)) % 2 === 0) {
//                 ctx.globalAlpha = 1.0;
//             } else {
//                 ctx.globalAlpha = 0.6;
//             }
//             ctx.fillRect(pixelX, pixelY, chunkySize, chunkySize);
//         }
//     }
//     ctx.globalAlpha = 1.0;

//     ctx.fillStyle = '#FFF';
//     const fontSize = Math.max(8, Math.floor(obDepth * 40));
//     ctx.font = `bold ${fontSize}px Arial`;
//     ctx.textAlign = 'center';
//     ctx.textBaseline = 'middle';
//     ctx.fillText(LANES[testObstacle.lane].symbol, canvas.width / 2, obDrawY + (obHeight / 2));

//     // --- FINE DISEGNO OSTACOLO FULL-WIDTH A 8-BIT ---


// 	// L'UNICORNO (Temporaneo)
// 	const playerBottomX = startXBottom + (playerLane * laneWidthBottom) + (laneWidthBottom / 2);

// 	ctx.fillStyle = '#FFF';
// 	ctx.fillRect(playerBottomX - 15, canvas.height - 120, 30, 40);
// 	ctx.beginPath();
// 	ctx.moveTo(playerBottomX - 10, canvas.height - 120);
// 	ctx.lineTo(playerBottomX - 5, canvas.height - 140);
// 	ctx.lineTo(playerBottomX, canvas.height - 120);
// 	ctx.fillStyle = '#FFD700';
// 	ctx.fill();

// 	ctx.fillStyle = '#000';
// 	ctx.font = '16px monospace';
// 	ctx.textAlign = 'left';
// 	ctx.fillText("🦄 Frecce Destra/Sinistra", 20, 30);

// 	requestAnimationFrame(draw);
// }

// draw();