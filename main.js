const DIFFICULTIES = {
  easy:   { rows: 9,  cols: 9,  mines: 10 },
  medium: { rows: 16, cols: 16, mines: 40 },
  hard:   { rows: 16, cols: 30, mines: 99 },
};

let difficulty = 'easy';
let rows, cols, totalMines;
let board;       // 2D array of cell data
let revealed;    // count of revealed safe cells
let flagCount;
let gameOver;
let firstClick;
let timerInterval;
let seconds;

const boardEl    = document.getElementById('board');
const mineCountEl = document.getElementById('mine-count');
const timerEl    = document.getElementById('timer');
const resetBtn   = document.getElementById('reset-btn');
const messageEl  = document.getElementById('message');
const diffBtns   = document.querySelectorAll('.diff-btn');

function init() {
  const cfg = DIFFICULTIES[difficulty];
  rows = cfg.rows;
  cols = cfg.cols;
  totalMines = cfg.mines;

  board = [];
  revealed = 0;
  flagCount = 0;
  gameOver = false;
  firstClick = true;

  clearInterval(timerInterval);
  seconds = 0;
  timerEl.textContent = '000';
  mineCountEl.textContent = String(totalMines);
  resetBtn.textContent = '😊';
  messageEl.classList.add('hidden');
  messageEl.classList.remove('win', 'lose');

  for (let r = 0; r < rows; r++) {
    board[r] = [];
    for (let c = 0; c < cols; c++) {
      board[r][c] = { mine: false, num: 0, revealed: false, flagged: false };
    }
  }

  renderBoard();
}

function placeMines(safeR, safeC) {
  let placed = 0;
  while (placed < totalMines) {
    const r = Math.floor(Math.random() * rows);
    const c = Math.floor(Math.random() * cols);
    if (board[r][c].mine) continue;
    if (Math.abs(r - safeR) <= 1 && Math.abs(c - safeC) <= 1) continue;
    board[r][c].mine = true;
    placed++;
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (board[r][c].mine) continue;
      let count = 0;
      forNeighbors(r, c, (nr, nc) => {
        if (board[nr][nc].mine) count++;
      });
      board[r][c].num = count;
    }
  }
}

function forNeighbors(r, c, fn) {
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
        fn(nr, nc);
      }
    }
  }
}

function renderBoard() {
  boardEl.innerHTML = '';
  boardEl.style.gridTemplateColumns = `repeat(${cols}, 36px)`;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.r = r;
      cell.dataset.c = c;

      cell.addEventListener('click', () => handleClick(r, c));
      cell.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        handleRightClick(r, c);
      });

      boardEl.appendChild(cell);
    }
  }

  updateResponsiveCellSize();
}

function updateResponsiveCellSize() {
  const isMobile = window.innerWidth <= 600;
  const size = isMobile ? 28 : 36;
  boardEl.style.gridTemplateColumns = `repeat(${cols}, ${size}px)`;
}

function getCellEl(r, c) {
  return boardEl.children[r * cols + c];
}

function startTimer() {
  timerInterval = setInterval(() => {
    seconds++;
    timerEl.textContent = String(seconds).padStart(3, '0');
    if (seconds >= 999) clearInterval(timerInterval);
  }, 1000);
}

function handleClick(r, c) {
  if (gameOver) return;
  const data = board[r][c];
  if (data.flagged || data.revealed) return;

  if (firstClick) {
    firstClick = false;
    placeMines(r, c);
    startTimer();
  }

  if (data.mine) {
    loseGame(r, c);
    return;
  }

  revealCell(r, c);
  checkWin();
}

function handleRightClick(r, c) {
  if (gameOver) return;
  const data = board[r][c];
  if (data.revealed) return;

  data.flagged = !data.flagged;
  flagCount += data.flagged ? 1 : -1;
  mineCountEl.textContent = String(totalMines - flagCount);

  const el = getCellEl(r, c);
  el.classList.toggle('flagged', data.flagged);
}

function revealCell(r, c) {
  const data = board[r][c];
  if (data.revealed || data.flagged || data.mine) return;

  data.revealed = true;
  revealed++;

  const el = getCellEl(r, c);
  el.classList.add('revealed');

  if (data.num > 0) {
    el.textContent = data.num;
    el.dataset.num = data.num;
  } else {
    forNeighbors(r, c, (nr, nc) => revealCell(nr, nc));
  }
}

function checkWin() {
  const safeCells = rows * cols - totalMines;
  if (revealed === safeCells) {
    winGame();
  }
}

function winGame() {
  gameOver = true;
  clearInterval(timerInterval);
  resetBtn.textContent = '😎';

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (board[r][c].mine && !board[r][c].flagged) {
        board[r][c].flagged = true;
        getCellEl(r, c).classList.add('flagged');
      }
    }
  }
  mineCountEl.textContent = '0';

  messageEl.textContent = '🎉 Победа!';
  messageEl.classList.remove('hidden', 'lose');
  messageEl.classList.add('win');
  setTimeout(() => messageEl.classList.add('hidden'), 2500);
}

function loseGame(mineR, mineC) {
  gameOver = true;
  clearInterval(timerInterval);
  resetBtn.textContent = '😵';

  getCellEl(mineR, mineC).classList.add('mine-exploded');

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const data = board[r][c];
      const el = getCellEl(r, c);
      el.classList.add('game-over');

      if (data.mine && !(r === mineR && c === mineC)) {
        el.classList.add('mine-shown');
      }
      if (data.flagged && !data.mine) {
        el.classList.remove('flagged');
        el.classList.add('wrong-flag');
      }
    }
  }

  messageEl.textContent = '💥 Игра окончена';
  messageEl.classList.remove('hidden', 'win');
  messageEl.classList.add('lose');
  setTimeout(() => messageEl.classList.add('hidden'), 2500);
}

diffBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    diffBtns.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    difficulty = btn.dataset.difficulty;
    init();
  });
});

resetBtn.addEventListener('click', init);

window.addEventListener('resize', updateResponsiveCellSize);

init();
