"use strict";

/* CONFIGURAZIONE DEL GIOCO */
const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30; // dimensione in pixel di ogni blocco

// Definizione dei colori; l'indice 0 rappresenta una cella vuota
const COLORS = [
  "#000", // 0: vuoto
  "#00f", // 1: I
  "#f90", // 2: J
  "#09f", // 3: L
  "#ff0", // 4: O
  "#0f0", // 5: S
  "#f0f", // 6: T
  "#f00"  // 7: Z
];

// Definizione dei tetromini tramite matrici; ogni numero indica il tipo del blocco
const TETROMINOES = {
  I: [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0]
  ],
  J: [
    [2, 0, 0],
    [2, 2, 2],
    [0, 0, 0]
  ],
  L: [
    [0, 0, 3],
    [3, 3, 3],
    [0, 0, 0]
  ],
  O: [
    [4, 4],
    [4, 4]
  ],
  S: [
    [0, 5, 5],
    [5, 5, 0],
    [0, 0, 0]
  ],
  T: [
    [0, 6, 0],
    [6, 6, 6],
    [0, 0, 0]
  ],
  Z: [
    [7, 7, 0],
    [0, 7, 7],
    [0, 0, 0]
  ]
};

// CREAZIONE DELLA GRIGLIA DI GIOCO
let board = [];
function createBoard() {
  board = [];
  for (let r = 0; r < ROWS; r++) {
    let row = [];
    for (let c = 0; c < COLS; c++) {
      row.push(0);
    }
    board.push(row);
  }
}

// FUNZIONI DI DISEGNO SUL CANVAS
function drawSquare(ctx, x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
  ctx.strokeStyle = "#222";
  ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
}

function drawBoard(ctx) {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      drawSquare(ctx, c, r, COLORS[board[r][c]]);
    }
  }
}

/* GESTIONE DEL PEZZO ATTUALE */
// Costruttore per un pezzo
function Piece(shape, ctx) {
  this.shape = shape;
  this.ctx = ctx;
  // La matrice del tetromino si ottiene tramite la chiave dell'oggetto TETROMINOES
  this.tetromino = TETROMINOES[shape];
  // Posizione iniziale: centra orizzontalmente e posiziona verticalmente in alto (anche fuori dalla griglia)
  this.x = Math.floor(COLS / 2) - Math.floor(this.tetromino[0].length / 2);
  this.y = -this.tetromino.length;
}

Piece.prototype.draw = function() {
  for (let r = 0; r < this.tetromino.length; r++) {
    for (let c = 0; c < this.tetromino[r].length; c++) {
      if (this.tetromino[r][c]) {
        drawSquare(this.ctx, this.x + c, this.y + r, COLORS[this.tetromino[r][c]]);
      }
    }
  }
};

// Metodo per verificare se il pezzo collide spostandosi dell'offset specificato
Piece.prototype.collide = function(offsetX, offsetY, newMatrix) {
  let m = newMatrix || this.tetromino;
  for (let r = 0; r < m.length; r++) {
    for (let c = 0; c < m[r].length; c++) {
      if (m[r][c]) {
        let newX = this.x + c + offsetX;
        let newY = this.y + r + offsetY;
        // Controlla i bordi
        if (newX < 0 || newX >= COLS || newY >= ROWS) {
          if(newY < 0) continue;
          return true;
        }
        if (newY >= 0 && board[newY][newX] !== 0) {
          return true;
        }
      }
    }
  }
  return false;
};

// Una volta che il pezzo non può più scendere, viene "bloccato" nella griglia
Piece.prototype.lock = function() {
  for (let r = 0; r < this.tetromino.length; r++) {
    for (let c = 0; c < this.tetromino[r].length; c++) {
      if (this.tetromino[r][c]) {
        let boardX = this.x + c;
        let boardY = this.y + r;
        if (boardY < 0) {
          // Se il blocco si colloca sopra la griglia, è Game Over
          return false;
        }
        board[boardY][boardX] = this.tetromino[r][c];
      }
    }
  }
  return true;
};

// Funzione per ruotare la matrice (rotazione oraria)
function rotateMatrix(matrix) {
  let result = [];
  for (let c = 0; c < matrix[0].length; c++) {
    result[c] = [];
    for (let r = matrix.length - 1; r >= 0; r--) {
      result[c][matrix.length - 1 - r] = matrix[r][c];
    }
  }
  return result;
}

Piece.prototype.rotate = function() {
  let newMatrix = rotateMatrix(this.tetromino);
  if (!this.collide(0, 0, newMatrix)) {
    this.tetromino = newMatrix;
  }
};

// Rimozione delle righe complete: restituisce il numero di righe eliminate
function clearLines() {
  let linesCleared = 0;
  for (let r = ROWS - 1; r >= 0; r--) {
    let isFull = true;
    for (let c = 0; c < COLS; c++) {
      if (board[r][c] === 0) {
        isFull = false;
        break;
      }
    }
    if (isFull) {
      board.splice(r, 1);
      board.unshift(new Array(COLS).fill(0));
      linesCleared++;
      r++; // ricontrolla la stessa riga
    }
  }
  return linesCleared;
}

// Generazione casuale di un tetromino; restituisce un nuovo oggetto Piece
function randomPiece(ctx) {
  let shapes = Object.keys(TETROMINOES);
  let randIndex = Math.floor(Math.random() * shapes.length);
  return new Piece(shapes[randIndex], ctx);
}
