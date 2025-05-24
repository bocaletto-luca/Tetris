"use strict";

// Recupera gli elementi dal DOM
let canvas = document.getElementById("gameCanvas");
let ctx = canvas.getContext("2d");

let homeScreen = document.getElementById("homeScreen");
let gameInfo = document.getElementById("gameInfo");
let scoreDisplay = document.getElementById("scoreDisplay");
let levelDisplay = document.getElementById("levelDisplay");
let linesDisplay = document.getElementById("linesDisplay");

let startBtn = document.getElementById("startBtn");
let recordBtn = document.getElementById("recordBtn");

let playerNameInput = document.getElementById("playerName");

// Stato del gioco
let gameRunning = false;
let dropStart = Date.now();
let dropInterval = 1000; // tempo iniziale di caduta in ms
let score = 0;
let level = 1;
let linesClearedTotal = 0;
let playerName = "";

// Inizializza la griglia e genera il primo pezzo
createBoard();
let current = randomPiece(ctx);

// Ciclo di gioco: gestisce la gravità e il rendering
function updateGame() {
  if (!gameRunning) return;

  let now = Date.now();
  let delta = now - dropStart;
  if (delta > dropInterval) {
    moveDown();
    dropStart = Date.now();
  }
  
  draw();
  requestAnimationFrame(updateGame);
}

// Funzione di disegno: ripristina il board e disegna il pezzo attuale
function draw() {
  drawBoard(ctx);
  current.draw();
}

// Movimento verso il basso del pezzo
function moveDown() {
  if (!current.collide(0, 1)) {
    current.y++;
  } else {
    // Il pezzo non può scendere ulteriormente: lo blocchiamo nella griglia
    if (!current.lock()) {
      // Se il lock avviene sopra la griglia, il gioco termina
      gameOver();
      return;
    }
    let cleared = clearLines();
    if (cleared > 0) {
      score += cleared * 100;
      linesClearedTotal += cleared;
      level = Math.floor(linesClearedTotal / 10) + 1;
      dropInterval = Math.max(100, 1000 - (level - 1) * 100);
      scoreDisplay.innerText = score;
      levelDisplay.innerText = level;
      linesDisplay.innerText = linesClearedTotal;
    }
    // Genera un nuovo pezzo
    current = randomPiece(ctx);
    if (current.collide(0, 0)) {
      gameOver();
      return;
    }
  }
}

// Movimenti laterali
function moveLeft() {
  if (!current.collide(-1, 0)) {
    current.x--;
  }
}
function moveRight() {
  if (!current.collide(1, 0)) {
    current.x++;
  }
}

// Hard drop: abbassa istantaneamente il pezzo fino a farlo bloccare
function hardDrop() {
  while (!current.collide(0, 1)) {
    current.y++;
  }
  moveDown();
}

// Gestione Game Over: salva i record e resetta lo stato
function gameOver() {
  gameRunning = false;
  let recordData = JSON.parse(localStorage.getItem("recordData")) || [];
  let recordEntry = {
    name: playerName,
    score: score,
    level: level,
    lines: linesClearedTotal,
    date: new Date().toLocaleString()
  };
  recordData.push(recordEntry);
  localStorage.setItem("recordData", JSON.stringify(recordData));
  alert("Game Over! " + playerName + ", hai totalizzato " + score + " punti al Livello " + level);
  resetGame();
}

function resetGame() {
  score = 0;
  level = 1;
  linesClearedTotal = 0;
  dropInterval = 1000;
  scoreDisplay.innerText = score;
  levelDisplay.innerText = level;
  linesDisplay.innerText = linesClearedTotal;
  createBoard();
  current = randomPiece(ctx);
  homeScreen.style.display = "block";
  canvas.classList.add("hidden");
  gameInfo.classList.add("hidden");
}

// Avvio della partita: eseguito cliccando il pulsante “Inizia Partita”
function startGame() {
  playerName = playerNameInput.value.trim();
  if (playerName === "") {
    alert("Inserisci il tuo nome per iniziare la partita.");
    return;
  }
  homeScreen.style.display = "none";
  canvas.classList.remove("hidden");
  gameInfo.classList.remove("hidden");
  gameRunning = true;
  dropStart = Date.now();
  updateGame();
}

// Gestione degli input da tastiera
document.addEventListener("keydown", function(e) {
  if (!gameRunning) return;
  switch (e.key) {
    case "ArrowLeft":
      moveLeft();
      break;
    case "ArrowRight":
      moveRight();
      break;
    case "ArrowDown":
      moveDown();
      break;
    case "ArrowUp":
      current.rotate();
      break;
    case " ":
      hardDrop();
      break;
  }
});

// Supporto per il joypad (Gamepad API)
function updateGamepad() {
  let gamepads = navigator.getGamepads();
  if (gamepads[0]) {
    let gp = gamepads[0];
    if (gp.axes[0] < -0.5) {
      moveLeft();
    } else if (gp.axes[0] > 0.5) {
      moveRight();
    }
    if (gp.buttons[0].pressed) {
      current.rotate();
    }
    if (gp.buttons[1].pressed) {
      hardDrop();
    }
  }
}
setInterval(function(){
  if (gameRunning) {
    updateGamepad();
  }
}, 100);

// Visualizza i record memorizzati (modal Record)
function showRecords() {
  let recordList = document.getElementById("recordList");
  recordList.innerHTML = "";
  let recordData = JSON.parse(localStorage.getItem("recordData")) || [];
  recordData.sort((a, b) => b.score - a.score);
  recordData.forEach(record => {
    let li = document.createElement("li");
    li.className = "list-group-item bg-dark text-white";
    li.textContent = record.name + " - Punti: " + record.score + " - Livello: " + record.level + " - Linee: " + record.lines + " - " + record.date;
    recordList.appendChild(li);
  });
  $("#recordModal").modal("show");
}

// Binding dei pulsanti
startBtn.addEventListener("click", startGame);
recordBtn.addEventListener("click", showRecords);
