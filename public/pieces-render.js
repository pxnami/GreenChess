const PIECE_FILES = {
  K: "Chess_klt60.png",
  Q: "Chess_qlt60.png",
  R: "Chess_rlt60.png",
  B: "Chess_blt60.png",
  N: "Chess_nlt60.png",
  P: "Chess_plt60.png",
  k: "Chess_kdt60.png",
  q: "Chess_qdt60.png",
  r: "Chess_rdt60.png",
  b: "Chess_bdt60.png",
  n: "Chess_ndt60.png",
  p: "Chess_pdt60.png",
};

const PIECE_LABELS = {
  K: "White king",
  Q: "White queen",
  R: "White rook",
  B: "White bishop",
  N: "White knight",
  P: "White pawn",
  k: "Black king",
  q: "Black queen",
  r: "Black rook",
  b: "Black bishop",
  n: "Black knight",
  p: "Black pawn",
};

function getPieceSVG(pieceLetter) {
  const file = PIECE_FILES[pieceLetter];
  if (!file) return "";
  const src = `https://commons.wikimedia.org/wiki/Special:FilePath/${file}?width=160`;
  return `<img class="piece-img" src="${src}" alt="${PIECE_LABELS[pieceLetter]}" draggable="false" />`;
}

if (typeof module === "object" && module.exports) {
  module.exports = { getPieceSVG };
}
