# KURCZOKER Makeover Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Execute inline in the existing branch/worktree, as explicitly requested.

**Goal:** Deliver a playable, polished tactical browser roguelite and verify a Cloudflare preview.

**Architecture:** One headless Rapier simulation drives battle actors and both teams' projectiles. R3F reads transforms directly; React renders campaign and controls. Shared arena data drives collisions and scenery. Preserve tested campaign rules.

**Tech Stack:** Astro, React 19, R3F/Three WebGL2, Rapier WASM, Zustand, Node tests, Playwright, Cloudflare Pages.

**Spec:** `docs/superpowers/specs/2026-09-08-kurczoker-makeover-design.md`

## Global Constraints

- Execute inline on `baza080926-makeover` in current worktree.
- Single-player, no login or required runtime backend.
- Fixed step 1/60 s; physics is authoritative for both teams.
- Static `dist`, asset ≤25 MiB; preview before production.
- No claims of physical-device performance from desktop emulation.

## Task 1: Authoritative battle simulation

**Files:** Create `src/engine/tactical/simulation.js`, `arena.js`, `ballistics.js`, `test/tactical-simulation.test.js`.
**Interfaces:** `createBattleSimulation(options): Promise<runtime>`; runtime `advance(seconds)`, `move(direction)`, `jump()`, `aim(angle,power)`, `fire(abilityId)`, `setPaused(boolean)`, `snapshot()`, `drainEvents()`, `dispose()`. Snapshot includes phase, time, turn, actors, projectile, aim and outcome. Options contain campaign health, abilities, artifacts, stats and encounter type.

- [ ] Write tests: one action per turn, real hit/miss, enemy projectile visible in snapshot, pause, bounded catch-up, terrain collision and disposal.
- [ ] Run `node --test test/tactical-simulation.test.js` and record missing-behavior failures.
- [ ] Implement one Rapier world, collider event queue, shared launch velocity and fixed-step trajectory. Use `body.setLinvel(velocity,true)`, never impulse as speed. Resolve explosions once, then telegraph/enemy response/player turn.
- [ ] Run physics tests including literal geometric bounds and a full actual fight.

## Task 2: Campaign bridge and persistence

**Files:** Modify `src/engine/store/useGameStore.js`; create `src/engine/tactical/checkpoint.js`, `test/checkpoint.test.js`, `test/campaign-bridge.test.js`.
**Interfaces:** store `finishEncounter({encounterId,won,health})`, `selectAbility(id)`, `restore(game)`; checkpoint `encodeCheckpoint(game)`, `decodeCheckpoint(text)` returns valid game or null.

- [ ] Test outcome guard, health propagation, corrupt/versioned saves and owned ability selection.
- [ ] Run new tests red.
- [ ] Bridge outcome to existing `completeCurrentNode/markRunDefeated`; normalize owned abilities and all artifact effects; checkpoint only safe scenes, persist before entering battle.
- [ ] Run new tests and existing run/store tests.

## Task 3: Playable React interface and 3D scenes

**Files:** Replace active `KurczokerCanvas.jsx`, `GameRuntime.jsx`, `scenes/BattleScene.jsx`, `scenes/MapScene.jsx`; create `tactical/GameHud.jsx`, `tactical/World.jsx`, `tactical/Chicken.jsx`, `tactical/Controls.jsx`, `src/styles/game.css`; simplify `HeroGame.astro` and `gra.astro`.
**Interfaces:** battle owns runtime lifecycle and reports through `finishEncounter`; UI commands call runtime; `World({arena,quality})` consumes exact arena colliders; actor frame refs read runtime snapshot. No React state change per physics step.

- [ ] Add browser scenario: start, route, move, aim, shoot, visible response, pause/resume and reward selection.
- [ ] Observe baseline failure with missing new controls.
- [ ] Implement responsive full-screen game, settings/tutorial, one pointer controller, keyboard cleanup, plane raycasting and camera fit. Keep angle/power sliders plus dedicated mobile controls. Add loading/error/retry and local restore.
- [ ] Verify desktop/mobile bounds, controls and physics-driven visual positions.

## Task 4: Art, animation, sound and asset budget

**Files:** Create `tools/build-game-assets.mjs`, `public/game/release/manifest.json`, compressed actor GLBs; modify tactical visuals and production build asset filtering.
**Interfaces:** manifest lists hashed GLBs, bytes and provenance; actor loader supports meshopt and animation clips. Arena remains procedural/shared with colliders.

- [ ] Asset validation checks production file budget and missing URLs; verify on baseline.
- [ ] Export authored character geometry with idle/run/throw/hit clips; simplify/merge static pieces and meshopt-compress. Build stylized islands, foliage, landmarks and VFX with bounded shared geometry.
- [ ] Connect Web Audio to shot, hit, treasure, victory and defeat after user interaction. Profile low/high shadows and DPR.
- [ ] Build and measure actual production payload; do not publish source generations or reference images.

## Task 5: Full-run QA and quality fixes

**Files:** Add `test/visual/tactical.test.js` and run helpers, update obsolete source-shape tests into production behavior tests; update README.

- [ ] Exercise real simulation across ordinary/elite/boss encounters and all available abilities/artifacts.
- [ ] Test complete browser run, shop with/without funds, defeat, restart, checkpoint, blur, resize, mobile inputs and asset failure.
- [ ] Record frame timings and resource bytes in named browser environment; inspect screenshots. Fix each observed failure and rerun affected checks.
- [ ] Run `npm test`, `npm run build`, production browser tests and `git diff --check`.

## Task 6: Cloudflare preview and delivery

**Files:** Improve `tools/deploy-pages.mjs`, add asset budget command, `public/_headers` and CI workflow.

- [ ] Read Cloudflare project/auth configuration without printing secrets; verify branch destinations.
- [ ] Deploy built output explicitly to preview branch. Exercise actual preview HTTPS, MIME, caching, no missing assets and full run.
- [ ] Save verified results and limitations, update checklist and commit scoped work. Production publication only after preview passes; if authentication is unavailable, complete all local/reviewable work and state the exact external blocker.

## Execution ledger

- Plan self-review: Tasks1/3 share runtime contract; Tasks2/3 share finishEncounter; Tasks3/4 share manifest/actor API; Tasks4/6 share release asset set. No conflicting owners because execution is sequential inline.
- User approval already covers direction, five phases, branch, worktree and inline execution.
- Runtime tests first; documented static-image/legacy source-string tests are migrated when their renderer is retired.
