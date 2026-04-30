<div align="center">

<pre>
  ██╗  ██╗██╗   ██╗██████╗  ██████╗███████╗ ██████╗ ██╗  ██╗███████╗██████╗
  ██║ ██╔╝██║   ██║██╔══██╗██╔════╝╚══███╔╝██╔═══██╗██║ ██╔╝██╔════╝██╔══██╗
  █████╔╝ ██║   ██║██████╔╝██║       ███╔╝ ██║   ██║█████╔╝ █████╗  ██████╔╝
  ██╔═██╗ ██║   ██║██╔══██╗██║      ███╔╝  ██║   ██║██╔═██╗ ██╔══╝  ██╔══██╗
  ██║  ██╗╚██████╔╝██║  ██║╚██████╗███████╗╚██████╔╝██║  ██╗███████╗██║  ██║
  ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝ ╚═════╝╚══════╝ ╚═════╝ ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝
                         of might and magic 3
</pre>

**KURCZOKER** is a tiny browser runner game about escaping a pixel chicken, collecting points, and trying not to end at `Game Over`.

[![License: MIT](https://img.shields.io/badge/License-MIT-4a8d83.svg?style=flat-square)](LICENSE)
[![Runtime: Browser](https://img.shields.io/badge/Runtime-Browser-1a73e8.svg?style=flat-square)](#runtime-shape)
[![Stack: Vanilla JS](https://img.shields.io/badge/Stack-Vanilla%20JS-f59e0b.svg?style=flat-square)](#tech-stack)
[![Tests: node --test](https://img.shields.io/badge/Tests-node%20--test-202124.svg?style=flat-square)](#usage)
[![Deploy: Cloudflare Pages](https://img.shields.io/badge/Deploy-Cloudflare%20Pages-f97316.svg?style=flat-square)](#configuration)
</div>

---

KURCZOKER is a small static web game built with plain HTML, CSS, and JavaScript. The player jumps with keyboard or pointer input, collects blue points, and is chased by a pixel-style kurczok. The score is shown in Polish as `Wynik`, and collected points flash the `KURCZOK!` message.

```text
  KURCZOKER RUNNER
  ┌─────────────────────────────────────────────────────────────────┐
  │                                                                 │
  │   browser canvas · pixel runner · Polish UI · zero framework    │
  │                                                                 │
  │  ┌─────────────────────────────────────────────────────────┐   │
  │  │  Wynik: 7                                               │   │
  │  │                                                         │   │
  │  │      ████                                               │   │
  │  │      █  █        ◆                         kurczok →    │   │
  │  │  ────────────────────────────────────────────────────   │   │
  │  │                                                         │   │
  │  │  Space / ArrowUp / W / pointerdown = jump               │   │
  │  └─────────────────────────────────────────────────────────┘   │
  │                                                                 │
  └─────────────────────────────────────────────────────────────────┘
```

---

## Runtime Shape

Current runtime truth:

- `index.html` is the entry point and loads the game directly in the browser.
- `src/game.js` contains the game state helpers, drawing code, input handling, and animation loop.
- `src/styles.css` contains the page, canvas, and game-over overlay styles.
- `scripts/build.mjs` creates a static `dist/` directory for deployment.
- `test/game.test.js` covers the score and game-over state helpers with Node's built-in test runner.

Current source-of-truth files:

- [`index.html`](index.html)
- [`src/game.js`](src/game.js)
- [`src/styles.css`](src/styles.css)
- [`scripts/build.mjs`](scripts/build.mjs)
- [`test/game.test.js`](test/game.test.js)

## Installation

### Fastest: Static Browser Run

Open `index.html` in a browser. The game has no runtime dependencies and does not need a dev server for local play.

### Local Node Setup

Node.js is only required for tests, build, and deployment scripts.

```bash
npm install
npm test
npm run build
```

---

## Get Started

| Step | What Happens |
|------|-------------|
| 1. Install | `npm install` installs development tooling from `package.json` |
| 2. Play | Open `index.html` in a browser |
| 3. Test | `npm test` runs `node --test` |
| 4. Build | `npm run build` copies the static app into `dist/` |
| 5. Deploy | `npm run deploy` deploys `dist/` with Wrangler Pages |

---

## How It Works

KURCZOKER runs a simple animation loop on an HTML canvas:

1. The runner starts near the left side of the canvas.
2. The kurczok chaser moves in from behind.
3. A point appears ahead of the player and moves left.
4. Collecting a point increments the score, flashes `KURCZOK!`, resets the point, and pushes the chaser back.
5. Colliding with the chaser stops the loop and shows the `Game Over` overlay.

### Controls

| Action | Input |
|--------|-------|
| Jump | `Space` |
| Jump | `ArrowUp` |
| Jump | `W` |
| Jump | pointer / mouse / touch press |

### Game State Helpers

| Function | Purpose |
|----------|---------|
| `createGameState()` | Creates the initial score state |
| `collectPoint(state)` | Returns the next state after collecting a point |
| `finishGame(state)` | Returns the final game-over title and score text |

---

## Usage

### Commands

| Action | Command |
|--------|---------|
| Run tests | `npm test` |
| Build static output | `npm run build` |
| Deploy built output | `npm run deploy` |

The production build writes these files:

```text
dist/
├── index.html
└── src/
    ├── game.js
    └── styles.css
```

---

## Configuration

There is no application-level configuration file. Current deploy settings live in `package.json`:

```json
{
  "deploy": "wrangler pages deploy dist --project-name delta240-com"
}
```

Wrangler may require Cloudflare authentication in the local environment before deploy:

```bash
npx wrangler login
```

---

## Features

| Feature | Status |
|---------|:------:|
| Static browser game | YES |
| Canvas rendering | YES |
| Keyboard controls | YES |
| Pointer / touch jump input | YES |
| Score counter | YES |
| Collectible point loop | YES |
| Chasing kurczok obstacle | YES |
| Game-over overlay | YES |
| Node test coverage for state helpers | YES |
| Static build output | YES |

---

## Privacy

KURCZOKER is a static front-end game. It does not include analytics, cookies, account login, database storage, or external API calls in the current codebase.

---

## Tech Stack

| Component | Technology | Why |
|-----------|------------|-----|
| Markup | HTML | Minimal static entry point |
| Game runtime | Vanilla JavaScript | No framework needed for a small canvas game |
| Rendering | Canvas 2D API | Simple frame-by-frame drawing |
| Styling | CSS | Lightweight responsive layout and overlay styles |
| Tests | `node:test` | Built-in Node.js test runner |
| Build | Node.js script | Copies the static app into `dist/` |
| Deploy | Wrangler Pages | Publishes the static `dist/` folder |

---

## Roadmap

- [x] Static HTML entry point
- [x] Canvas runner loop
- [x] Keyboard and pointer jump controls
- [x] Score collection logic
- [x] Game-over state
- [x] Node tests for state helpers
- [x] Static build script
- [ ] Restart control after game over
- [ ] Better mobile canvas scaling
- [ ] Sound effects
- [ ] High-score storage
- [ ] Deployment project-name cleanup if the Cloudflare Pages project changes from `delta240-com`

---

## FAQ

**Q: Do I need a framework to run KURCZOKER?**

No. The game runs directly in the browser from `index.html`.

**Q: Why is Node.js in the project?**

Node.js is used for tests, the static build script, and Wrangler deployment tooling.

**Q: How do I start the game locally?**

Open `index.html` in a browser. No server is required for the current code.

**Q: How do I jump?**

Use `Space`, `ArrowUp`, `W`, or press / tap the game area.

**Q: What gets deployed?**

`npm run build` creates `dist/`, and `npm run deploy` publishes that folder through Wrangler Pages.

---

## Contributing

This is a small public game repo. Keep changes focused, test state helper behavior with `npm test`, and avoid committing generated output such as `dist/`.

---

## License

MIT - see [`LICENSE`](LICENSE) for details.

---

<div align="center">

**KURCZOKER** - of might and magic 3

*Built with plain browser APIs. Jump, score, escape the kurczok.*

</div>
