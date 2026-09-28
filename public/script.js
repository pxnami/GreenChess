const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];
const START_BOARD = [
  ["r", "n", "b", "q", "k", "b", "n", "r"],
  ["p", "p", "p", "p", "p", "p", "p", "p"],
  ["", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", ""],
  ["P", "P", "P", "P", "P", "P", "P", "P"],
  ["R", "N", "B", "Q", "K", "B", "N", "R"],
];
const LANDING_BOARD = [
  ["r", "n", "", "q", "k", "b", "n", "r"],
  ["p", "p", "p", "", "", "p", "p", "p"],
  ["", "", "", "p", "", "", "", ""],
  ["", "", "", "", "p", "", "", ""],
  ["", "", "B", "", "P", "", "b", ""],
  ["", "", "N", "", "", "N", "", ""],
  ["P", "P", "P", "P", "", "P", "P", "P"],
  ["R", "", "B", "Q", "K", "", "", "R"],
];
const MINI_BOARD = [
  ["", "", "", "", "", "", "k", ""],
  ["", "", "", "", "", "", "p", "p"],
  ["", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "R", "K"],
  ["", "", "", "", "", "", "", ""],
];

const $ = (id) => document.getElementById(id);
const landingScreen = $("landingScreen");
const homeScreen = $("homeScreen");
const gameScreen = $("gameScreen");
const gameBoard = $("gameBoard");
const statusLine = $("statusLine");
const moveLog = $("moveLog");
const promoOverlay = $("promoOverlay");
const promoOptions = $("promoOptions");

let board = cloneBoard(START_BOARD);
let turn = "w";
let selected = null;
let legalForSelected = [];
let lastMove = null;
let flipped = false;
let history = [];
let castling = { wK: true, wQ: true, bK: true, bQ: true };
let enPassant = null;
let gameOver = false;
let pendingPromotion = null;
let dragState = null;
let suppressClick = false;

function isWhite(piece) { return !!piece && piece === piece.toUpperCase(); }
function isBlack(piece) { return !!piece && piece === piece.toLowerCase(); }
function inBounds(r, c) { return r >= 0 && r < 8 && c >= 0 && c < 8; }
function cloneBoard(value) { return value.map((row) => row.slice()); }

function show(screen) {
  [landingScreen, homeScreen, gameScreen].forEach((el) => el.classList.add("hidden"));
  screen.classList.remove("hidden");
}

function completeSignup() {
  localStorage.setItem("greenchessProfile", "greenplayer");
  $("profileName").textContent = "greenplayer";
  show(homeScreen);
}

$("getStartedBtn").addEventListener("click", completeSignup);
$("sidebarSignup").addEventListener("click", completeSignup);
$("sidebarLogin").addEventListener("click", completeSignup);
$("startPracticeBtn").addEventListener("click", () => startGame("Practice"));
$("startBotBtn").addEventListener("click", () => startGame("Play vs. Bot"));
$("botCardBtn").addEventListener("click", () => startGame("Play vs. Bot"));
$("historyPlayBtn").addEventListener("click", () => startGame("Practice"));
$("startPuzzleBtn").addEventListener("click", () => startGame("Puzzle Practice"));
$("puzzleCardBtn").addEventListener("click", () => startGame("Puzzle Practice"));
$("backHomeBtn").addEventListener("click", () => show(homeScreen));
$("newGameBtn").addEventListener("click", () => startGame($("gameTitle").textContent));
$("flipBoardBtn").addEventListener("click", () => { flipped = !flipped; renderGame(); });
$("copyFenBtn").addEventListener("click", copyFen);
$("exportPgnBtn").addEventListener("click", exportPgn);

function startGame(title) {
  board = cloneBoard(START_BOARD);
  turn = "w";
  selected = null;
  legalForSelected = [];
  lastMove = null;
  history = [];
  castling = { wK: true, wQ: true, bK: true, bQ: true };
  enPassant = null;
  gameOver = false;
  pendingPromotion = null;
  $("gameTitle").textContent = title;
  moveLog.textContent = "No moves yet.";
  show(gameScreen);
  renderGame();
}

function renderBoard(target, position, options = {}) {
  target.innerHTML = "";
  const amber = options.amber || false;
  target.classList.toggle("amber-board", amber);

  for (let dr = 0; dr < 8; dr++) {
    for (let dc = 0; dc < 8; dc++) {
      const [r, c] = options.flipped ? [7 - dr, 7 - dc] : [dr, dc];
      const square = document.createElement("div");
      square.className = `square ${(r + c) % 2 === 0 ? "light" : "dark"}`;
      square.dataset.dr = dr;
      square.dataset.dc = dc;

      if (options.interactive) {
        square.addEventListener("click", () => onSquareClick(dr, dc));
        if (selected && selected.r === r && selected.c === c) square.classList.add("selected");
        if (lastMove && ((lastMove.fromR === r && lastMove.fromC === c) || (lastMove.toR === r && lastMove.toC === c))) {
          square.classList.add("last-move");
        }
        if (isKingInCheckSquare(position, r, c)) square.classList.add("in-check");
      }

      const piece = position[r][c];
      if (piece) {
        const pieceEl = document.createElement("div");
        pieceEl.className = "piece";
        pieceEl.dataset.r = r;
        pieceEl.dataset.c = c;
        pieceEl.innerHTML = getPieceSVG(piece);
        if (options.interactive && canMovePiece(piece)) pieceEl.addEventListener("pointerdown", onPiecePointerDown);
        square.appendChild(pieceEl);
      }

      if (options.interactive && legalForSelected.some((m) => m.r === r && m.c === c)) {
        const marker = document.createElement("div");
        marker.className = piece ? "capture-ring" : "move-dot";
        square.appendChild(marker);
      }

      target.appendChild(square);
    }
  }
}

function renderGame() {
  renderBoard(gameBoard, board, { interactive: true, flipped });
  renderMoveLog();
  const check = inCheck(board, turn === "w");
  if (gameOver) return;
  statusLine.textContent = `${turn === "w" ? "White" : "Black"} to move${check ? " - check" : ""}`;
}

function canMovePiece(piece) {
  if (gameOver) return false;
  return isWhite(piece) === (turn === "w");
}

function displayToBoard(dr, dc) {
  return flipped ? [7 - dr, 7 - dc] : [dr, dc];
}

function onSquareClick(dr, dc) {
  if (suppressClick) {
    suppressClick = false;
    return;
  }
  const [r, c] = displayToBoard(dr, dc);
  const piece = board[r][c];

  if (selected) {
    const move = legalForSelected.find((m) => m.r === r && m.c === c);
    if (move) return playMove(selected.r, selected.c, r, c);
    if (piece && canMovePiece(piece)) return selectSquare(r, c);
    selected = null;
    legalForSelected = [];
    return renderGame();
  }

  if (piece && canMovePiece(piece)) selectSquare(r, c);
}

function selectSquare(r, c) {
  selected = { r, c };
  legalForSelected = legalMoves(board, r, c, { castling, enPassant });
  renderGame();
}

function onPiecePointerDown(event) {
  const pieceEl = event.currentTarget;
  const r = Number(pieceEl.dataset.r);
  const c = Number(pieceEl.dataset.c);
  const piece = board[r][c];
  if (!piece || !canMovePiece(piece)) return;

  event.preventDefault();
  pieceEl.setPointerCapture(event.pointerId);
  selectSquare(r, c);

  const rect = pieceEl.getBoundingClientRect();
  const ghost = pieceEl.cloneNode(true);
  ghost.classList.add("drag-ghost");
  document.body.appendChild(ghost);
  dragState = {
    pointerId: event.pointerId,
    fromR: r,
    fromC: c,
    ghost,
    startX: event.clientX,
    startY: event.clientY,
    offsetX: event.clientX - rect.left,
    offsetY: event.clientY - rect.top,
    moved: false,
  };
  positionGhost(event.clientX, event.clientY);
  pieceEl.classList.add("drag-source");
  window.addEventListener("pointermove", onPointerMove, { passive: false });
  window.addEventListener("pointerup", onPointerUp, { passive: false });
  window.addEventListener("pointercancel", cancelDrag, { passive: false });
}

function onPointerMove(event) {
  if (!dragState || dragState.pointerId !== event.pointerId) return;
  event.preventDefault();
  dragState.moved = dragState.moved || Math.hypot(event.clientX - dragState.startX, event.clientY - dragState.startY) > 4;
  positionGhost(event.clientX, event.clientY);
}

function onPointerUp(event) {
  if (!dragState || dragState.pointerId !== event.pointerId) return;
  event.preventDefault();
  const state = dragState;
  const target = document.elementFromPoint(event.clientX, event.clientY);
  const square = target && target.closest ? target.closest(".square") : null;
  cleanupDrag();
  if (!state.moved || !square || !gameBoard.contains(square)) return renderGame();
  suppressClick = true;
  const [toR, toC] = displayToBoard(Number(square.dataset.dr), Number(square.dataset.dc));
  if (legalForSelected.some((m) => m.r === toR && m.c === toC)) playMove(state.fromR, state.fromC, toR, toC);
  else renderGame();
}

function cancelDrag(event) {
  if (dragState && dragState.pointerId === event.pointerId) {
    cleanupDrag();
    renderGame();
  }
}

function positionGhost(x, y) {
  dragState.ghost.style.left = `${x - dragState.offsetX}px`;
  dragState.ghost.style.top = `${y - dragState.offsetY}px`;
}

function cleanupDrag() {
  window.removeEventListener("pointermove", onPointerMove);
  window.removeEventListener("pointerup", onPointerUp);
  window.removeEventListener("pointercancel", cancelDrag);
  if (dragState && dragState.ghost) dragState.ghost.remove();
  document.querySelectorAll(".drag-source").forEach((el) => el.classList.remove("drag-source"));
  dragState = null;
}

function playMove(fromR, fromC, toR, toC, promotion = null) {
  const piece = board[fromR][fromC];
  if (piece.toLowerCase() === "p" && (toR === 0 || toR === 7) && !promotion) {
    pendingPromotion = { fromR, fromC, toR, toC };
    return openPromotion(piece);
  }
  applyMove(fromR, fromC, toR, toC, promotion);
  renderGame();
  if (!gameOver && turn === "b") setTimeout(playBotMove, 450);
}

function applyMove(fromR, fromC, toR, toC, promotion) {
  const piece = board[fromR][fromC];
  const white = isWhite(piece);
  const type = piece.toLowerCase();
  let captured = board[toR][toC] || null;
  let flag = null;

  if (type === "p" && enPassant && enPassant.r === toR && enPassant.c === toC && !captured) {
    const capturedRow = white ? toR + 1 : toR - 1;
    captured = board[capturedRow][toC];
    board[capturedRow][toC] = "";
    flag = "ep";
  }

  board[toR][toC] = promotion ? (white ? promotion.toUpperCase() : promotion.toLowerCase()) : piece;
  board[fromR][fromC] = "";

  if (type === "k" && Math.abs(toC - fromC) === 2) {
    flag = toC > fromC ? "castleK" : "castleQ";
    if (toC > fromC) {
      board[fromR][5] = board[fromR][7];
      board[fromR][7] = "";
    } else {
      board[fromR][3] = board[fromR][0];
      board[fromR][0] = "";
    }
  }

  updateCastling(type, white, fromR, fromC, toR, toC);
  enPassant = type === "p" && Math.abs(toR - fromR) === 2 ? { r: (fromR + toR) / 2, c: fromC } : null;
  history.push({ fromR, fromC, toR, toC, piece, captured, promotion, flag });
  lastMove = { fromR, fromC, toR, toC };
  turn = turn === "w" ? "b" : "w";
  selected = null;
  legalForSelected = [];
  checkGameEnd();
}

function updateCastling(type, white, fromR, fromC, toR, toC) {
  if (type === "k") {
    if (white) { castling.wK = false; castling.wQ = false; }
    else { castling.bK = false; castling.bQ = false; }
  }
  if (type === "r") {
    if (fromR === 7 && fromC === 0) castling.wQ = false;
    if (fromR === 7 && fromC === 7) castling.wK = false;
    if (fromR === 0 && fromC === 0) castling.bQ = false;
    if (fromR === 0 && fromC === 7) castling.bK = false;
  }
  if (toR === 7 && toC === 0) castling.wQ = false;
  if (toR === 7 && toC === 7) castling.wK = false;
  if (toR === 0 && toC === 0) castling.bQ = false;
  if (toR === 0 && toC === 7) castling.bK = false;
}

function playBotMove() {
  const moves = allMovesFor(board, false, { castling, enPassant });
  if (!moves.length) return checkGameEnd();
  const captures = moves.filter((m) => board[m.r][m.c]);
  const pool = captures.length ? captures : moves;
  const move = pool[Math.floor(Math.random() * pool.length)];
  applyMove(move.fromR, move.fromC, move.r, move.c, move.promotion || null);
  renderGame();
}

function openPromotion(piece) {
  promoOptions.innerHTML = "";
  ["q", "r", "b", "n"].forEach((letter) => {
    const button = document.createElement("button");
    button.className = "promo-cell";
    button.innerHTML = getPieceSVG(isWhite(piece) ? letter.toUpperCase() : letter);
    button.addEventListener("click", () => {
      promoOverlay.classList.add("hidden");
      const move = pendingPromotion;
      pendingPromotion = null;
      playMove(move.fromR, move.fromC, move.toR, move.toC, letter);
    });
    promoOptions.appendChild(button);
  });
  promoOverlay.classList.remove("hidden");
}

function rawMoves(position, r, c, ctx) {
  const piece = position[r][c];
  if (!piece) return [];
  const white = isWhite(piece);
  const enemy = white ? isBlack : isWhite;
  const type = piece.toLowerCase();
  const moves = [];
  const rights = ctx.castling || {};

  function slide(dirs) {
    dirs.forEach(([dr, dc]) => {
      let nr = r + dr;
      let nc = c + dc;
      while (inBounds(nr, nc)) {
        if (!position[nr][nc]) moves.push({ r: nr, c: nc });
        else {
          if (enemy(position[nr][nc])) moves.push({ r: nr, c: nc });
          break;
        }
        nr += dr;
        nc += dc;
      }
    });
  }

  if (type === "p") {
    const dir = white ? -1 : 1;
    const start = white ? 6 : 1;
    if (inBounds(r + dir, c) && !position[r + dir][c]) {
      moves.push({ r: r + dir, c });
      if (r === start && !position[r + 2 * dir][c]) moves.push({ r: r + 2 * dir, c, flag: "double" });
    }
    [-1, 1].forEach((dc) => {
      const nr = r + dir;
      const nc = c + dc;
      if (!inBounds(nr, nc)) return;
      if (position[nr][nc] && enemy(position[nr][nc])) moves.push({ r: nr, c: nc });
      else if (ctx.enPassant && ctx.enPassant.r === nr && ctx.enPassant.c === nc) moves.push({ r: nr, c: nc, flag: "ep" });
    });
  } else if (type === "n") {
    [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]].forEach(([dr, dc]) => {
      const nr = r + dr;
      const nc = c + dc;
      if (inBounds(nr, nc) && (!position[nr][nc] || enemy(position[nr][nc]))) moves.push({ r: nr, c: nc });
    });
  } else if (type === "b") slide([[1, 1], [1, -1], [-1, 1], [-1, -1]]);
  else if (type === "r") slide([[1, 0], [-1, 0], [0, 1], [0, -1]]);
  else if (type === "q") slide([[1, 1], [1, -1], [-1, 1], [-1, -1], [1, 0], [-1, 0], [0, 1], [0, -1]]);
  else if (type === "k") {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (!dr && !dc) continue;
        const nr = r + dr;
        const nc = c + dc;
        if (inBounds(nr, nc) && (!position[nr][nc] || enemy(position[nr][nc]))) moves.push({ r: nr, c: nc });
      }
    }
    const home = white ? 7 : 0;
    if (r === home && c === 4) {
      if ((white ? rights.wK : rights.bK) && !position[home][5] && !position[home][6] && position[home][7] === (white ? "R" : "r")) moves.push({ r: home, c: 6, flag: "castleK" });
      if ((white ? rights.wQ : rights.bQ) && !position[home][3] && !position[home][2] && !position[home][1] && position[home][0] === (white ? "R" : "r")) moves.push({ r: home, c: 2, flag: "castleQ" });
    }
  }
  return moves;
}

function legalMoves(position, r, c, ctx) {
  const piece = position[r][c];
  if (!piece) return [];
  const white = isWhite(piece);
  return rawMoves(position, r, c, ctx).filter((move) => {
    if (move.flag === "castleK" || move.flag === "castleQ") {
      if (inCheck(position, white)) return false;
      const passC = move.flag === "castleK" ? 5 : 3;
      if (isSquareAttacked(applySimple(position, r, c, r, passC), r, passC, !white)) return false;
      if (isSquareAttacked(applySimple(position, r, c, move.r, move.c), move.r, move.c, !white)) return false;
      return true;
    }
    const next = cloneBoard(position);
    if (move.flag === "ep") next[white ? move.r + 1 : move.r - 1][move.c] = "";
    next[move.r][move.c] = next[r][c];
    next[r][c] = "";
    return !inCheck(next, white);
  });
}

function allMovesFor(position, white, ctx) {
  const moves = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = position[r][c];
      if (piece && isWhite(piece) === white) {
        legalMoves(position, r, c, ctx).forEach((move) => moves.push({ fromR: r, fromC: c, ...move }));
      }
    }
  }
  return moves;
}

function applySimple(position, fromR, fromC, toR, toC) {
  const next = cloneBoard(position);
  next[toR][toC] = next[fromR][fromC];
  next[fromR][fromC] = "";
  return next;
}

function findKing(position, white) {
  const target = white ? "K" : "k";
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) if (position[r][c] === target) return { r, c };
  return null;
}

function isSquareAttacked(position, r, c, byWhite) {
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const piece = position[i][j];
      if (!piece || isWhite(piece) !== byWhite) continue;
      if (piece.toLowerCase() === "p") {
        const dir = byWhite ? -1 : 1;
        if (i + dir === r && (j - 1 === c || j + 1 === c)) return true;
      } else if (piece.toLowerCase() === "k") {
        if (Math.abs(i - r) <= 1 && Math.abs(j - c) <= 1 && !(i === r && j === c)) return true;
      } else if (rawMoves(position, i, j, { castling: {}, enPassant: null }).some((m) => m.r === r && m.c === c)) return true;
    }
  }
  return false;
}

function inCheck(position, white) {
  const king = findKing(position, white);
  return king ? isSquareAttacked(position, king.r, king.c, !white) : false;
}

function isKingInCheckSquare(position, r, c) {
  const piece = position[r][c];
  return piece && piece.toLowerCase() === "k" && isWhite(piece) === (turn === "w") && inCheck(position, turn === "w");
}

function checkGameEnd() {
  const moves = allMovesFor(board, turn === "w", { castling, enPassant });
  if (moves.length) return;
  gameOver = true;
  if (inCheck(board, turn === "w")) {
    statusLine.textContent = `Checkmate - ${turn === "w" ? "Black" : "White"} wins`;
  } else {
    statusLine.textContent = "Stalemate - draw";
  }
}

function renderMoveLog() {
  if (!history.length) {
    moveLog.textContent = "No moves yet.";
    return;
  }
  const rows = [];
  for (let i = 0; i < history.length; i += 2) {
    rows.push(`${Math.floor(i / 2) + 1}. ${notation(history[i])}${history[i + 1] ? `  ${notation(history[i + 1])}` : ""}`);
  }
  moveLog.textContent = rows.join("\n");
}

function notation(move) {
  return `${move.piece.toUpperCase()}${FILES[move.fromC]}${8 - move.fromR}-${FILES[move.toC]}${8 - move.toR}${move.promotion ? `=${move.promotion.toUpperCase()}` : ""}`;
}

function stateToFen() {
  const rows = board.map((row) => {
    let empty = 0;
    let text = "";
    row.forEach((piece) => {
      if (!piece) empty += 1;
      else {
        if (empty) text += empty;
        empty = 0;
        text += piece;
      }
    });
    return text + (empty || "");
  });
  const rights = `${castling.wK ? "K" : ""}${castling.wQ ? "Q" : ""}${castling.bK ? "k" : ""}${castling.bQ ? "q" : ""}` || "-";
  const ep = enPassant ? `${FILES[enPassant.c]}${8 - enPassant.r}` : "-";
  return `${rows.join("/")} ${turn} ${rights} ${ep} 0 ${Math.floor(history.length / 2) + 1}`;
}

async function copyFen() {
  const fen = stateToFen();
  try {
    await navigator.clipboard.writeText(fen);
    $("copyFenBtn").textContent = "FEN Copied";
    setTimeout(() => { $("copyFenBtn").textContent = "Copy FEN"; }, 1200);
  } catch {
    window.prompt("Copy FEN", fen);
  }
}

function exportPgn() {
  const lines = ["[Event \"GreenChess Practice\"]", "[Site \"GreenChess\"]", "[Result \"*\"]", ""];
  for (let i = 0; i < history.length; i += 2) {
    lines.push(`${Math.floor(i / 2) + 1}. ${notation(history[i])}${history[i + 1] ? ` ${notation(history[i + 1])}` : ""}`);
  }
  const blob = new Blob([lines.join("\n")], { type: "application/x-chess-pgn" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "greenchess-practice.pgn";
  anchor.click();
  URL.revokeObjectURL(url);
}

function renderStaticBoards() {
  renderBoard($("landingBoard"), LANDING_BOARD);
  renderBoard($("miniPuzzleBoard"), MINI_BOARD);
  renderBoard($("lessonBoard"), START_BOARD);
  renderBoard($("botBoard"), START_BOARD, { amber: true });
  renderBoard($("dailyBoard"), [
    ["r", "", "", "", "", "", "k", ""],
    ["p", "", "", "", "", "", "", "p"],
    ["", "p", "", "", "", "p", "", ""],
    ["", "", "", "p", "", "", "", ""],
    ["", "N", "", "P", "", "P", "", "P"],
    ["R", "", "", "", "", "", "", ""],
    ["", "P", "", "K", "", "", "b", "P"],
    ["", "", "", "", "", "", "", ""],
  ]);
}

renderStaticBoards();
if (localStorage.getItem("greenchessProfile")) {
  $("profileName").textContent = localStorage.getItem("greenchessProfile");
  show(homeScreen);
} else {
  show(landingScreen);
}
