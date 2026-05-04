# KURCZOKER

KURCZOKER is a static browser game and landing page built with Astro, vanilla JavaScript modules, Canvas 2D, CSS, and Node's built-in test runner.

The game direction is a small roguelite loop: choose a route on the map, enter active-turn battles, collect rewards, improve the run, and push toward the boss. The project has no login, no backend, no database, and no required external runtime API.

## Commands

| Action | Command |
| --- | --- |
| Install dependencies | `npm install` |
| Start local dev server | `npm run dev` |
| Run tests | `npm test` |
| Build static site | `npm run build` |
| Preview built site | `npm run preview` |
| Deploy `dist/` to Cloudflare Pages | `npm run deploy` |

Astro owns the production build. `npm run build` writes the static output to `dist/`, and `npm run deploy` publishes that folder with Wrangler Pages.

## Gameplay Loop

1. Start a run with the default `egg-bomb` ability.
2. Pick an available node on the route map.
3. Resolve the node: battle, elite, treasure, shop-style reward, or boss.
4. In battle, take the player turn, aim, fire an ability, then survive the enemy response.
5. Choose rewards such as artifacts, abilities, healing, or gold.
6. Continue through the map until the boss is defeated or the run is lost.
7. Restart creates a fresh run state.

The implementation is split into modules under `src/game/` so state, map, run, battle, abilities, physics, input, rendering, audio, and bootstrap code can be tested independently.

## Controls

| Action | Input |
| --- | --- |
| Move | `A` / `D` or `ArrowLeft` / `ArrowRight` |
| Jump | `W`, `Space`, or `ArrowUp` |
| Aim | Mouse, pointer drag, or touch drag |
| Fire selected ability | `Space`, `Enter`, pointer press, or touch press |
| Start or restart | Start / restart control |
| Mute toggle | Mute control |

Audio is muted by default. Web Audio is created only after an interaction, such as unmuting from the UI.

## Tests

Run all available tests:

```bash
npm test
```

The tests use `node --test` and focus on pure game behavior where possible: state, map generation, run transitions, physics, battle state, abilities, audio, and a full run progression check.

## Build And Deploy

Build the static Astro site:

```bash
npm run build
```

Preview the built output:

```bash
npm run preview
```

Deploy to Cloudflare Pages:

```bash
npm run deploy
```

Wrangler may require local Cloudflare authentication before deployment:

```bash
npx wrangler login
```

## Runtime Shape

- Astro is the app shell and static build system.
- Game code lives in vanilla JavaScript modules under `src/game/`.
- Canvas 2D handles rendering.
- Web Audio handles short optional effects and remains muted until the player enables it.
- There is no server-side gameplay state.
- There are no accounts, login flows, analytics, cookies, or database calls in this codebase.

## Current Audio Effects

`src/game/audio.js` exposes:

- `createAudioController(options)`
- `setMuted(audio, muted)`
- `playEffect(audio, effectId)`

Supported effect ids:

- `shoot`
- `hit`
- `treasure`
- `defeat`
- `victory`

## Contributing

Keep changes scoped to the relevant module, avoid reverting other agents' work, and run the narrowest useful tests before handing off. Do not commit generated output such as `dist/`.

## License

MIT - see [`LICENSE`](LICENSE).
