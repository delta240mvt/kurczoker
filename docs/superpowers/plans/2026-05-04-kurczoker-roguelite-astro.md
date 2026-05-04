# KURCZOKER Roguelite Astro Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build KURCZOKER into an Astro landing page with a playable mini roguelite hero game: node map, active-turn battles, rewards, boss, audio, and restart.

**Architecture:** Astro handles static page layout and landing sections. The game is split into pure JavaScript modules for state, map, run, battle, physics, abilities, actors, audio, input, rendering, and browser bootstrap. Tests focus on pure game logic and build verification.

**Tech Stack:** Astro, vanilla JavaScript modules, Canvas 2D, Web Audio API, CSS, Node `node:test`, static Cloudflare Pages-compatible build.

---

## Source Map

Create or modify these files:

- Create: `astro.config.mjs` - Astro static configuration.
- Modify: `package.json` - add Astro scripts and dependency, keep `node --test`.
- Create/modify: `package-lock.json` - generated dependency lockfile after installing Astro.
- Modify: `.gitignore` - include Astro-generated directories if needed.
- Replace: `index.html` - remove as runtime entry after Astro migration or keep only if needed for legacy note.
- Create: `src/pages/index.astro` - landing page entry.
- Create: `src/components/HeroGame.astro` - hero game shell and canvas mount.
- Create: `src/components/LandingSection.astro` - reusable full-width section wrapper.
- Create: `src/components/ArtifactShowcase.astro` - artifact/ability presentation.
- Create: `src/styles/global.css` - full site and game styling.
- Create: `src/game/constants.js` - ids, dimensions, tuning constants.
- Create: `src/game/state.js` - initial state and pure helpers.
- Create: `src/game/map.js` - node map generation.
- Create: `src/game/run.js` - run lifecycle.
- Create: `src/game/physics.js` - projectile, collision, explosion logic.
- Create: `src/game/actors.js` - player, enemy, summon factories.
- Create: `src/game/abilities.js` - abilities, artifacts, reward application.
- Create: `src/game/battle.js` - active-turn state machine.
- Create: `src/game/audio.js` - Web Audio effects and mute.
- Create: `src/game/input.js` - keyboard, pointer, touch input.
- Create: `src/game/renderer.js` - Canvas 2D rendering.
- Create: `src/game/bootstrap.js` - browser mount and animation loop.
- Replace or delete: `src/game.js` - old monolith after new modules are wired.
- Replace: `src/styles.css` - old single-page CSS after `global.css`.
- Replace: `test/game.test.js` - old MVP tests.
- Create: `test/state.test.js`.
- Create: `test/map.test.js`.
- Create: `test/run.test.js`.
- Create: `test/physics.test.js`.
- Create: `test/abilities.test.js`.
- Create: `test/battle.test.js`.
- Modify: `scripts/build.mjs` - remove if Astro build replaces it, or leave unused with package script cleanup.
- Modify: `README.md` - update stack, commands, gameplay, and roadmap.

---

## Parallel Agent Strategy

Use six agents in the first implementation wave only after Stage 0 is complete and merged. Each agent owns a disjoint write scope. Agents are not alone in the codebase: they must not revert others' edits and must adapt to shared contracts in `src/game/contracts.js`, `src/game/constants.js`, and `src/game/state.js`.

Preferred execution safety:

- Stage 0 is completed inline or by one coordinating worker before parallel work starts.
- Each of the six agents works in an isolated branch/worktree or returns a patch for coordinator integration.
- Parallel agents should not commit directly to the same branch at the same time.
- Stage 2 owns integration commits after conflicts and contracts are reconciled.

### Agent 1: Astro Foundation And Landing Shell

**Ownership:**
- `package.json`
- `package-lock.json`
- `astro.config.mjs`
- `src/pages/index.astro`
- `src/components/HeroGame.astro`
- `src/components/LandingSection.astro`
- `src/components/ArtifactShowcase.astro`
- `src/styles/global.css`

**Goal:** Create the Astro static site and polished landing shell with a central playable canvas mount.

**Do not edit:** game logic modules except import paths needed by `HeroGame.astro`.

### Agent 2: Core State, Run, And Map

**Ownership:**
- `src/game/contracts.js`
- `src/game/constants.js`
- `src/game/state.js`
- `src/game/map.js`
- `src/game/run.js`
- `test/state.test.js`
- `test/map.test.js`
- `test/run.test.js`

**Goal:** Implement deterministic run state, node map generation, and transitions.

**Do not edit:** renderer, input, audio, Astro components.

### Agent 3: Physics And Battle State Machine

**Ownership:**
- `src/game/physics.js`
- `src/game/battle.js`
- `test/physics.test.js`
- `test/battle.test.js`

**Goal:** Implement active-turn timing, projectile movement, collision, explosions, enemy turn, victory, and defeat.

**Do not edit:** landing components or CSS.

### Agent 4: Actors, Abilities, Rewards

**Ownership:**
- `src/game/actors.js`
- `src/game/abilities.js`
- `test/abilities.test.js`

**Goal:** Define player, enemy, summon, ability, artifact, and reward behavior.

**Do not edit:** run/map tests except to align ids after coordination.

### Agent 5: Rendering, Input, Bootstrap

**Ownership:**
- `src/game/renderer.js`
- `src/game/input.js`
- `src/game/bootstrap.js`

**Goal:** Create API-compatible rendering, input, and bootstrap modules against Stage 0 contracts and harmless sample/stub state. Full gameplay wiring is reserved for Stage 2 after state, run, battle, abilities, and audio modules are integrated.

**Do not edit:** pure game tests unless fixing integration import contracts.

### Agent 6: Audio, Docs, Build, Integration QA

**Ownership:**
- `src/game/audio.js`
- `README.md`
- `scripts/build.mjs`
- `test/game.test.js` removal/replacement coordination
- final `npm test` and `npm run build` verification notes

**Goal:** Add muteable effects, update docs, clean old build assumptions, and prepare integration QA notes. Full-suite integration verification happens in Stage 2 and Stage 4, not during the parallel wave.

**Do not edit:** renderer or battle logic unless filing integration feedback.

---

## Stage 0: Coordination Contracts

### Task 0.1: Freeze Shared Ids, Data Shapes, And Stub Exports

**Files:**
- Create: `src/game/contracts.js`
- Create: `src/game/constants.js`
- Create: `src/game/state.js`
- Create stubs if needed: `src/game/bootstrap.js`, `src/game/audio.js`, `src/game/battle.js`, `src/game/abilities.js`, `src/game/actors.js`, `src/game/physics.js`, `src/game/input.js`, `src/game/renderer.js`, `src/game/map.js`, `src/game/run.js`

- [ ] **Step 1: Define shared ids before parallel work**

Create constants for scene ids, node types, ability ids, artifact ids, actor teams, battle phases, and canvas dimensions.

Expected minimal shape:

```js
export const SCENES = {
  MAP: "map",
  BATTLE: "battle",
  REWARD: "reward",
  GAME_OVER: "game-over",
  RUN_COMPLETE: "run-complete"
};

export const NODE_TYPES = {
  START: "start",
  BATTLE: "battle",
  ELITE: "elite",
  TREASURE: "treasure",
  SHOP: "shop",
  BOSS: "boss"
};

export const BATTLE_PHASES = {
  PLAYER_TURN: "player-turn",
  PROJECTILE: "projectile",
  ENEMY_TURN: "enemy-turn",
  WON: "won",
  LOST: "lost"
};
```

- [ ] **Step 2: Define shared data shape examples**

Create `src/game/contracts.js` with JSDoc typedefs or exported factory examples for every cross-agent shape. These examples are the source of truth for parallel work.

Required shapes:

```js
/**
 * @typedef {Object} MapNode
 * @property {string} id
 * @property {string} type
 * @property {string} label
 * @property {number} depth
 * @property {string[]} nextNodeIds
 * @property {{ encounterId?: string, rewardTier?: number }} payload
 */

/**
 * @typedef {Object} TerrainPlatform
 * @property {string} id
 * @property {number} x
 * @property {number} y
 * @property {number} width
 * @property {number} height
 */

/**
 * @typedef {Object} TerrainHazard
 * @property {string} id
 * @property {"spikes"|"fire"|"pit"} type
 * @property {number} x
 * @property {number} y
 * @property {number} width
 * @property {number} height
 * @property {number} damage
 */

/**
 * @typedef {Object} Actor
 * @property {string} id
 * @property {"player"|"enemy"|"summon"} kind
 * @property {"player"|"enemy"} team
 * @property {number} x
 * @property {number} y
 * @property {number} vx
 * @property {number} vy
 * @property {number} width
 * @property {number} height
 * @property {number} health
 * @property {number} maxHealth
 * @property {number} ttl
 */

/**
 * @typedef {Object} Ability
 * @property {string} id
 * @property {string} label
 * @property {"projectile"|"movement"|"summon"|"buff"} kind
 * @property {number} damage
 * @property {number} radius
 * @property {number} cooldown
 */

/**
 * @typedef {Object} Reward
 * @property {string} id
 * @property {"artifact"|"ability"|"heal"|"gold"} type
 * @property {string} label
 * @property {number} value
 */

/**
 * @typedef {Object} BattleConfig
 * @property {string} encounterId
 * @property {Actor[]} actors
 * @property {TerrainPlatform[]} platforms
 * @property {TerrainHazard[]} hazards
 * @property {number} turnDurationMs
 */

/**
 * @typedef {Object} InputSnapshot
 * @property {-1|0|1} moveX
 * @property {boolean} jump
 * @property {{x:number,y:number}} aim
 * @property {boolean} firePressed
 * @property {string} selectedAbilityId
 */
```

- [ ] **Step 3: Define initial state contract**

`createInitialGameState(seed)` should return:

```js
{
  scene: SCENES.MAP,
  seed,
  run: {
    currentNodeId: "start",
    completedNodeIds: [],
    offeredNodeIds: [],
    health: 3,
    maxHealth: 3,
    gold: 0,
    artifacts: [],
    abilities: ["egg-bomb"],
    defeated: false,
    completed: false
  },
  map: { nodes: [], edges: [] },
  battle: null,
  ui: { muted: true, selectedAbilityId: "egg-bomb", message: "" }
}
```

- [ ] **Step 4: Create no-op stub exports for cross-agent imports**

Create temporary modules with final function names and harmless placeholder behavior so parallel agents can import without build failures. Each owner replaces the implementation later.

Required stubs:

```js
// src/game/bootstrap.js
export function mountKurczokerGame() {}

// src/game/audio.js
export function createAudioController() {
  return { muted: true };
}
export function playEffect() {}
export function setMuted(audio, muted) {
  return { ...audio, muted };
}
```

Also stub public functions named later in this plan for `battle.js`, `abilities.js`, `actors.js`, `physics.js`, `input.js`, `renderer.js`, `map.js`, and `run.js`.

- [ ] **Step 5: Commit shared contracts**

Run:

```bash
npm test
git add src/game
git commit -m "feat: define kurczoker game contracts"
```

Expected: tests may still be minimal, but imports must work.

---

## Stage 1: Six-Agent Parallel Wave

### Task 1A: Astro Foundation And Landing Shell

**Agent:** Agent 1

**Files:**
- Create: `astro.config.mjs`
- Modify: `package.json`
- Create: `src/pages/index.astro`
- Create: `src/components/HeroGame.astro`
- Create: `src/components/LandingSection.astro`
- Create: `src/components/ArtifactShowcase.astro`
- Create: `src/styles/global.css`

- [ ] **Step 1: Add Astro dependency and scripts**

Update `package.json`:

```json
{
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "test": "node --test",
    "deploy": "wrangler pages deploy dist --project-name delta240-com"
  },
  "dependencies": {
    "astro": "^5.0.0"
  }
}
```

Preserve existing `wrangler` dev dependency.

- [ ] **Step 2: Create Astro config**

```js
import { defineConfig } from "astro/config";

export default defineConfig({
  output: "static"
});
```

- [ ] **Step 3: Create `HeroGame.astro`**

The component must render:

- `section.hero`
- `h1` with `KURCZOKER`
- short subtitle
- `canvas data-game-canvas`
- HUD elements with data attributes
- buttons: start/restart and mute
- module script importing `../game/bootstrap.js`

- [ ] **Step 4: Create `index.astro`**

Import global CSS and components. Render hero first, then artifact/how-to/roadmap sections.

- [ ] **Step 5: Create responsive CSS**

Use full-width sections and avoid nested cards. Canvas must have stable aspect ratio and not shift on HUD updates.

- [ ] **Step 6: Verify Astro build**

Run:

```bash
npm install
npm run build
```

Expected: Astro creates `dist/` without errors because Stage 0 created `bootstrap.js` stub before this task starts.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json astro.config.mjs src/pages src/components src/styles
git commit -m "feat: add astro landing shell"
```

### Task 1B: Core State, Run, And Map

**Agent:** Agent 2

**Files:**
- Create/modify: `src/game/contracts.js`
- Create/modify: `src/game/constants.js`
- Create/modify: `src/game/state.js`
- Create: `src/game/map.js`
- Create: `src/game/run.js`
- Create: `test/state.test.js`
- Create: `test/map.test.js`
- Create: `test/run.test.js`

- [ ] **Step 1: Write state tests**

Cover initial scene, health, default ability, mute default, restart state.

- [ ] **Step 2: Implement state helpers**

Functions:

```js
createInitialGameState(seed = 1)
resetRun(state, seed = state.seed + 1)
setUiMessage(state, message)
toggleMute(state)
```

- [ ] **Step 3: Write map tests**

Assert generated map contains start, boss, at least three battles, at least three gameplay node types, at least one reward/shop-style node, valid edges, and one complete 5-7 node path ending at boss.

- [ ] **Step 4: Implement map generation**

Functions:

```js
createRunMap(seed)
getAvailableNodes(map, completedNodeIds, currentNodeId)
getNodeById(map, nodeId)
```

- [ ] **Step 5: Write run transition tests**

Cover selecting node, completing battle node, choosing reward, boss completion, defeat.

- [ ] **Step 6: Implement run lifecycle**

Functions:

```js
startRun(seed)
selectMapNode(state, nodeId)
completeCurrentNode(state, reward)
applyRunReward(state, reward)
markRunDefeated(state)
markRunComplete(state)
```

- [ ] **Step 7: Run focused tests**

```bash
npm test -- test/state.test.js test/map.test.js test/run.test.js
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/game/constants.js src/game/state.js src/game/map.js src/game/run.js test/state.test.js test/map.test.js test/run.test.js
git commit -m "feat: add roguelite run state"
```

### Task 1C: Physics And Battle State Machine

**Agent:** Agent 3

**Files:**
- Create: `src/game/physics.js`
- Create: `src/game/battle.js`
- Create: `test/physics.test.js`
- Create: `test/battle.test.js`

- [ ] **Step 1: Write physics tests**

Cover projectile step, ground collision, platform collision, hazard overlap, rectangle overlap, circle explosion hit, knockback direction, and value clamping.

- [ ] **Step 2: Implement physics**

Functions:

```js
stepProjectile(projectile, delta)
rectsOverlap(a, b)
circleHitsRect(circle, rect)
clamp(value, min, max)
resolveExplosion(actors, explosion)
```

- [ ] **Step 3: Write battle tests**

Cover start battle, player turn timer, one fired action per player turn, projectile resolution, deterministic enemy decision, terrain platform interaction, hazard damage, summon ttl behavior, artifact effect in battle, victory, and defeat.

- [ ] **Step 4: Implement battle state machine**

Functions:

```js
createBattleState(config)
updateBattle(battle, input, delta)
firePlayerAbility(battle, ability)
resolveEnemyTurn(battle)
applyDamageToActor(battle, actorId, damage)
isBattleWon(battle)
isBattleLost(battle)
```

- [ ] **Step 5: Keep battle pure**

Do not touch DOM or canvas. Return updated objects.

- [ ] **Step 6: Run focused tests**

```bash
npm test -- test/physics.test.js test/battle.test.js
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/game/physics.js src/game/battle.js test/physics.test.js test/battle.test.js
git commit -m "feat: add active turn battle logic"
```

### Task 1D: Actors, Abilities, Rewards

**Agent:** Agent 4

**Files:**
- Create: `src/game/actors.js`
- Create: `src/game/abilities.js`
- Create: `test/abilities.test.js`

- [ ] **Step 1: Write actor and ability tests**

Cover player factory, enemy factory, summon factory, default ability, reward application, artifact effects.

- [ ] **Step 2: Implement actors**

Functions:

```js
createPlayer(overrides)
createEnemy(type, overrides)
createSummon(type, ownerId, overrides)
getActorBounds(actor)
```

- [ ] **Step 3: Implement abilities**

Abilities:

- `egg-bomb`
- `crest-jump`
- `guard-chick`
- `mana-grain`

Artifacts:

- `crest-crown`
- `wind-boots`
- `chaos-egg`
- `golden-grain-ring`
- `prophet-hen`
- `shell-shield`

- [ ] **Step 4: Implement reward helpers**

Functions:

```js
getRewardChoices(seed, runState)
applyReward(runState, reward)
getAbilityById(id)
getArtifactById(id)
```

- [ ] **Step 5: Run focused tests**

```bash
npm test -- test/abilities.test.js
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/game/actors.js src/game/abilities.js test/abilities.test.js
git commit -m "feat: add kurczoker abilities and artifacts"
```

### Task 1E: Rendering, Input, Bootstrap

**Agent:** Agent 5

**Files:**
- Create: `src/game/renderer.js`
- Create: `src/game/input.js`
- Create: `src/game/bootstrap.js`

- [ ] **Step 1: Create renderer API**

Functions:

```js
drawGame(ctx, canvas, state)
drawMap(ctx, state)
drawBattle(ctx, state)
drawReward(ctx, state)
drawHud(ctx, state)
```

- [ ] **Step 2: Draw nonblank scenes**

Map, battle, reward, game over, and run complete scenes must each draw a visible background and labels.

- [ ] **Step 3: Create input controller**

Support:

- keyboard movement
- pointer aiming
- touch-friendly press/drag/release
- start/restart
- mute button

- [ ] **Step 4: Add lightweight DOM/HUD smoke checks where feasible**

If Node DOM tooling is not added, document this as manual verification in Stage 4. If a small DOM-free test is possible, test that HUD formatting helpers return expected text for health, node, ability, and mute state.

- [ ] **Step 5: Create bootstrap**

Function:

```js
mountKurczokerGame(root)
```

It finds canvas and controls under the hero component, initializes state, starts requestAnimationFrame, and updates DOM HUD text.

- [ ] **Step 6: Keep integration API-compatible, not fully wired**

Use public names and data shapes from Stage 0 contracts. Render and input modules may use sample state or stubs. Do not duplicate game rules in renderer. Do not claim the complete run is playable until Task 2.2.

- [ ] **Step 7: Commit**

```bash
git add src/game/renderer.js src/game/input.js src/game/bootstrap.js
git commit -m "feat: add kurczoker render and input shell"
```

### Task 1F: Audio, Docs, Build, Integration QA

**Agent:** Agent 6

**Files:**
- Create: `src/game/audio.js`
- Modify: `README.md`
- Modify: `scripts/build.mjs`
- Modify/remove: `test/game.test.js`
- Delete/replace after Astro migration: `index.html`
- Delete/replace after modular game migration: `src/game.js`
- Delete/replace after global CSS migration: `src/styles.css`

- [ ] **Step 1: Create audio module**

Functions:

```js
createAudioController()
playEffect(audio, effectId)
setMuted(audio, muted)
```

Effects:

- `shoot`
- `hit`
- `treasure`
- `defeat`
- `victory`

- [ ] **Step 2: Gate audio behind interaction**

Use Web Audio only after start/play interaction. Default muted is acceptable.

- [ ] **Step 3: Update README**

Document:

- Astro commands.
- Gameplay loop.
- Controls.
- Tests.
- Build and deploy.
- No login/backend.

- [ ] **Step 4: Remove old MVP test assumptions**

Replace `test/game.test.js` with new tests or remove it after split tests exist.

- [ ] **Step 5: Remove stale vanilla entry points**

After Astro entry and modular game are wired:

- Remove old direct runtime dependency on `index.html`.
- Remove or archive `src/game.js` after confirming no import references it.
- Remove or archive `src/styles.css` after confirming `src/styles/global.css` is imported by Astro.
- Ensure `rg \"src/game.js|src/styles.css|data-game-canvas\"` does not show the old HTML mounting path as the active runtime.

- [ ] **Step 6: Run local audio/docs checks only**

Run:

```bash
npm test -- test/state.test.js test/map.test.js test/run.test.js test/physics.test.js test/abilities.test.js test/battle.test.js
```

Expected: pass only if the owned modules and available contract tests are already present. Do not require full Astro build here; Stage 2 and Stage 4 own full integration verification.

- [ ] **Step 7: Commit**

```bash
git add src/game/audio.js README.md scripts/build.mjs test/game.test.js index.html src/game.js src/styles.css
git commit -m "chore: document roguelite build and audio"
```

---

## Stage 2: Integration Pass

### Task 2.1: Merge Contracts Across Agents

**Files:**
- Modify: `src/game/*.js`
- Modify: `test/*.test.js`

- [ ] **Step 1: Run full test suite**

```bash
npm test
```

Expected: identify import, id, and contract mismatches.

- [ ] **Step 1b: Run first full Astro build after six-agent merge**

```bash
npm run build
```

Expected: identify missing imports, Astro component errors, or stale legacy entry references.

- [ ] **Step 2: Fix shared ids only through constants**

No string ids should be duplicated where constants exist.

- [ ] **Step 3: Verify scene transitions manually through state tests**

Start run -> map -> battle -> reward -> map -> boss -> complete.

- [ ] **Step 4: Commit**

```bash
git add src/game test
git commit -m "fix: align roguelite module contracts"
```

### Task 2.2: Wire Complete Playable Run

**Files:**
- Modify: `src/game/bootstrap.js`
- Modify: `src/game/run.js`
- Modify: `src/game/battle.js`
- Modify: `src/game/abilities.js`
- Modify: `src/game/renderer.js`

- [ ] **Step 1: Start button creates fresh run**
- [ ] **Step 2: Map node selection starts correct encounter**
- [ ] **Step 3: Battle victory opens reward selection**
- [ ] **Step 4: Reward returns to map with new available nodes**
- [ ] **Step 5: Boss victory shows run complete**
- [ ] **Step 6: Defeat shows game over**
- [ ] **Step 7: Restart works without page reload**
- [ ] **Step 8: Commit**

```bash
git add src/game
git commit -m "feat: wire complete kurczoker run"
```

### Task 2.3: Responsive And Control Polish

**Files:**
- Modify: `src/styles/global.css`
- Modify: `src/components/HeroGame.astro`
- Modify: `src/game/input.js`
- Modify: `src/game/renderer.js`

- [ ] **Step 1: Verify desktop preview at `1440x900`**

Run preview and check/document:

- canvas is nonblank;
- hero title, HUD, buttons, and canvas do not overlap;
- button text is not clipped;
- game controls remain visible;
- first viewport clearly signals KURCZOKER.

- [ ] **Step 2: Verify mobile preview at `390x844`**

Run preview and check/document:

- canvas is nonblank;
- touch controls are reachable;
- HUD does not cover the action area;
- text is not clipped;
- restart and mute controls remain accessible.

- [ ] **Step 3: Ensure canvas has stable aspect ratio**
- [ ] **Step 4: Ensure HUD text cannot overlap canvas controls**
- [ ] **Step 5: Ensure mobile touch targets are large**
- [ ] **Step 6: Ensure no text is clipped in buttons**
- [ ] **Step 7: Commit**

```bash
git add src/styles/global.css src/components/HeroGame.astro src/game/input.js src/game/renderer.js
git commit -m "style: polish responsive game hero"
```

---

## Stage 3: Tuning And Content

### Task 3.1: Tune Battles

**Files:**
- Modify: `src/game/constants.js`
- Modify: `src/game/battle.js`
- Modify: `src/game/abilities.js`
- Modify: `test/battle.test.js`

- [ ] **Step 1: Tune player turn duration**
- [ ] **Step 2: Tune projectile speed and gravity**
- [ ] **Step 3: Tune enemy health and damage**
- [ ] **Step 4: Tune boss health and reward curve**
- [ ] **Step 5: Add regression tests for tuned constants that define game rules**
- [ ] **Step 6: Commit**

```bash
git add src/game/constants.js src/game/battle.js src/game/abilities.js test/battle.test.js
git commit -m "tune: balance first kurczoker run"
```

### Task 3.2: Add Landing Content Without Scope Creep

**Files:**
- Modify: `src/pages/index.astro`
- Modify: `src/components/ArtifactShowcase.astro`
- Modify: `src/styles/global.css`

- [ ] **Step 1: Add short how-to section**
- [ ] **Step 2: Add artifact/ability showcase**
- [ ] **Step 3: Add compact roadmap**
- [ ] **Step 4: Add footer**
- [ ] **Step 5: Keep hero as first-viewport focus**
- [ ] **Step 6: Commit**

```bash
git add src/pages/index.astro src/components/ArtifactShowcase.astro src/styles/global.css
git commit -m "feat: add kurczoker landing content"
```

---

## Stage 4: Final Verification

### Task 4.1: Required Commands

- [ ] **Step 1: Run tests**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 2: Run production build**

```bash
npm run build
```

Expected: Astro builds static `dist/`.

- [ ] **Step 3: Run preview if available**

```bash
npm run preview
```

Expected: local preview serves the built site.

- [ ] **Step 4: Manual smoke checklist**

Check:

- hero loads;
- canvas is nonblank;
- desktop viewport `1440x900` has no text/control overlap;
- mobile viewport `390x844` has no text/control overlap;
- start/restart works;
- player can aim/fire;
- keyboard movement/aim/fire works;
- pointer drag aim/fire works;
- touch controls work on mobile-size viewport;
- battle can be won and lost;
- reward selection works;
- map progresses;
- boss appears;
- mute works;
- mobile layout remains usable.

- [ ] **Step 5: Commit final fixes**

```bash
git add .
git commit -m "fix: complete kurczoker verification pass"
```

---

## Stage 5: Review Workflow

### Task 5.1: Code Review

- [ ] **Step 1: Request review after implementation**

Use `superpowers:requesting-code-review`.

- [ ] **Step 2: Fix review findings**

Use `superpowers:receiving-code-review`.

- [ ] **Step 3: Re-run verification**

```bash
npm test
npm run build
```

- [ ] **Step 4: Prepare final branch handoff**

Use `superpowers:finishing-a-development-branch` if ready to merge, PR, or push.

---

## Rollback And Safety Notes

- Do not revert user changes.
- Do not keep the old `src/game.js` and the new modular game both mounted.
- Keep commits frequent so any problematic wave can be isolated.
- If the six-agent wave causes conflicts, merge by preserving module ownership and shared constants.
- If Astro migration blocks gameplay work, keep pure game modules independent so they can still be tested with Node.
