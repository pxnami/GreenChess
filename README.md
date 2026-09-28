# GreenChess

GreenChess is a static chess practice site inspired by the dark, green-accented chess platform layout in Chess.com. It is designed for GitHub Pages and does not include online multiplayer, matchmaking, sockets, accounts, or a backend.

## Features

- Logged-out landing screen with a large chessboard and primary call to action
- Logged-in-style practice dashboard stored locally in the browser
- Play vs. a simple local bot
- Puzzle and lesson-style dashboard cards
- Drag-and-drop and click-to-move board controls
- Legal move indicators, last-move highlights, check highlighting, promotion, castling, and en passant
- Board flipping, FEN copy, and PGN export
- Responsive layout for desktop and mobile

## Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Build

```bash
npm run check
npm run build
```

The GitHub Pages build is copied to `dist/`.

## Deployment

This project is intended to live in its own repository and deploy from the `dist/` folder or from the static files in `public/`.

## Piece Attribution

Chess piece images are from the Cburnett chess set on Wikimedia Commons by en:User:Cburnett, licensed under CC BY-SA 3.0:

- `Chess_bdt60.png`
- `Chess_blt60.png`
- `Chess_kdt60.png`
- `Chess_klt60.png`
- `Chess_ndt60.png`
- `Chess_nlt60.png`
- `Chess_pdt60.png`
- `Chess_plt60.png`
- `Chess_qdt60.png`
- `Chess_qlt60.png`
- `Chess_rdt60.png`
- `Chess_rlt60.png`

License: https://creativecommons.org/licenses/by-sa/3.0/

Source files are available through Wikimedia Commons.

## License

MIT for the GreenChess code. Chess piece images remain under CC BY-SA 3.0.
