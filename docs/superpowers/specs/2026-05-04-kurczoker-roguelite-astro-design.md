# KURCZOKER Roguelite Astro Design

## Summary

KURCZOKER evolves from a tiny canvas runner into a browser-first mini roguelite inspired by the nostalgic feel of Heroes of Might and Magic 3 and Worms 2, without copying either game. The player starts a 5-8 minute run, chooses a path through a light node map, fights short active-turn battles, collects absurd fantasy artifacts, and tries to defeat the final boss.

The website moves to Astro. The first viewport is a landing hero with the playable game as the central object. The page supports the game instead of hiding it behind marketing.

## Goals

- Build a beautiful Astro landing page with KURCZOKER as the first-viewport signal.
- Keep the game simple enough to run in a browser with no login, backend, or account state.
- Add a roguelite loop: node map, battles, rewards, final boss, restart.
- Combine active-turn aiming and projectile fun with light fantasy progression.
- Keep the code modular and testable, especially state, map, battle, physics, and abilities.
- Add simple audio effects with mute control.

## Non-Goals

- No login, accounts, multiplayer, database, leaderboard service, or server persistence.
- No full HoMM-style strategic simulation.
- No fully destructible Worms terrain in the first major version.
- No large asset pipeline requirement.
- No pixel-perfect renderer tests.

## Target Experience

The player lands on the page and immediately sees KURCZOKER in a polished hero section. The canvas is playable from the hero. A run starts with a compact map of choices. The player moves through 5-7 nodes: battles, reward nodes, upgrades, and a boss.

Battles use active turns. During the player turn, the player has a short timer, can move, aim, and fire one action. Projectile motion, explosions, knockback, and simple enemy response create the Worms-like energy. Between battles, the player chooses one reward from a small set, creating the "one more run" loop.

## Game Structure

### Run

- Start node.
- 3 standard battle nodes.
- 1-2 reward/shop/upgrade nodes.
- 1 boss node.
- Run duration target: 5-8 minutes.
- No account persistence required. Optional local high score can use `localStorage` after the base loop works.

### Map

The first version uses a light node map, not a tile world. Each node has a type, label, difficulty, and reward profile.

Node types:

- `battle`: standard fight.
- `elite`: harder fight with stronger reward.
- `treasure`: free artifact or healing choice.
- `shop`: small upgrade selection, using simple run currency if implemented.
- `boss`: final encounter.

### Battle

Battle arenas are compact canvas scenes. Each fight contains:

- One player hero.
- 1-3 enemies.
- Static terrain platforms and hazards.
- A turn controller.
- Projectile and explosion resolution.
- Win/loss detection.

Player active turn:

- Suggested duration: 8 seconds.
- Player can move, jump, aim, and fire one ability.
- Firing ends or nearly ends the turn.
- Each player turn allows at most one fired action.
- Projectile motion, collision, explosion damage, and knockback resolve before turn handoff.

Enemy turn:

- Fast scripted AI.
- Enemy picks a simple action: move, aim, fire, or skip if blocked.
- The enemy turn should resolve quickly to keep browser-game pacing.
- Enemy response must be visible and mechanically resolved, not only simulated in score text.

### Hero And Allies

The first version has one main hero-kurczok. Progression comes from artifacts, spells, and temporary summons. Summoned allies should be simple: short-lived helpers with one behavior, such as blocking, pecking, or firing a weak shot.

At least one temporary summon ability must be implemented in the first version. The summon must appear in battle, have a short-lived behavior, and expire or resolve without requiring extra UI complexity.

### Initial Ability Set

- `Jajobomba`: default arcing projectile with small explosion.
- `Grzebieniowy Skok`: movement/escape action or passive jump boost.
- `Pisklak Straznik`: temporary summon.
- `Ziarno Many`: reward effect that empowers the next ability.

### Initial Artifact Ideas

- `Korona Grzebienia`: increases turn timer or aim stability.
- `Buty Kurnikowego Wiatru`: improves movement or jump.
- `Zgnile Jajo Chaosu`: increases explosion radius with a downside.
- `Pierscien Zlotego Ziarna`: improves reward quality.
- `Kura Prorocza`: reveals next map rewards.
- `Tarcza Skorupki`: absorbs one hit per battle.

## Landing Page

The site uses Astro for layout and static build output. The first viewport contains:

- Brand: `KURCZOKER`.
- Short fantasy-parody subtitle.
- Playable canvas as the central hero object.
- Small HUD: health, current node, selected ability, mute.
- CTA controls: start/restart, how to play if needed.

Below hero:

- How to play.
- Artifact and ability showcase.
- Compact roadmap/manifest.
- Footer with license/repo links.

Visual tone:

- Pixel fantasy with modern polish.
- Green/olive world tones, gold artifacts, red action accents, dark outlines.
- Avoid a one-note palette and avoid making the page feel like a generic SaaS landing page.

Responsive behavior:

- Desktop: large central game scene.
- Mobile: simplified controls, large touch targets, canvas constrained to readable aspect ratio.

## Architecture

Proposed structure:

```text
src/
  pages/
    index.astro
  components/
    HeroGame.astro
    LandingSection.astro
    ArtifactShowcase.astro
  game/
    constants.js
    state.js
    run.js
    map.js
    battle.js
    physics.js
    actors.js
    abilities.js
    audio.js
    renderer.js
    input.js
    bootstrap.js
  styles/
    global.css
test/
  state.test.js
  map.test.js
  run.test.js
  battle.test.js
  physics.test.js
  abilities.test.js
```

Astro owns page composition. Game modules own game behavior. Canvas rendering should be isolated from pure state transitions so tests can cover most rules without DOM.

Migration from the current vanilla repo must be explicit:

- `package.json` gains Astro scripts: `dev`, `build`, and `preview`, while keeping `test`.
- `npm run build` becomes `astro build`.
- `index.html` is replaced by `src/pages/index.astro` as the runtime entry.
- `src/game.js` is replaced by modular files under `src/game/`.
- `src/styles.css` is replaced by `src/styles/global.css`.
- `test/game.test.js` is replaced by focused tests for state, map, run, physics, abilities, and battle.
- The deploy script continues to publish static `dist/` unless Cloudflare project settings are changed separately.

## Module Responsibilities

- `constants.js`: shared tuning values and ids.
- `state.js`: initial state and pure state helpers.
- `map.js`: deterministic node-map generation.
- `run.js`: run lifecycle and node transitions.
- `battle.js`: active-turn state machine and win/loss transitions.
- `physics.js`: gravity, projectile motion, collision, explosion radius checks.
- `actors.js`: player, enemy, and summon definitions.
- `abilities.js`: ability and artifact definitions/effects.
- `audio.js`: small Web Audio effects and mute state.
- `renderer.js`: canvas drawing.
- `input.js`: keyboard, pointer, touch, aiming.
- `bootstrap.js`: mounts the game to DOM elements created by Astro.

## Testing Strategy

Use Node's built-in test runner unless a later implementation decision requires a different tool.

Required coverage:

- Map generation creates a playable path and final boss.
- Run state moves through start, battle, reward, and boss states.
- Battle state handles player turn, enemy turn, victory, defeat, and restart.
- Physics handles projectile movement, collision, explosion radius, and clamping.
- Abilities apply expected effects and do not mutate unrelated state.
- Astro build completes.

Manual verification:

- Desktop and mobile layout.
- Canvas is nonblank and playable.
- Audio only starts from user interaction and mute works.
- Keyboard movement/aim/fire works.
- Pointer movement/aim/fire works.
- Touch start/restart, aiming, firing, and mute are usable on mobile-size layout.
- Ability selection and restart work without page reload.

## Delivery Stages

1. Project foundation and Astro migration.
2. Pure game domain modules and tests.
3. Battle prototype with active turns.
4. Run map and reward loop.
5. Landing page visual system.
6. Audio, tuning, polish, and final integration.

## Risks

- Scope creep from trying to recreate full HoMM3 or Worms systems.
- Physics and active-turn timing becoming hard to tune if mixed with rendering.
- Mobile controls becoming too complex.
- Large renderer file becoming a maintenance bottleneck.
- Audio autoplay restrictions if effects are not gated behind user interaction.

## Acceptance Criteria

- `npm test` passes.
- `npm run build` passes and produces a static Astro site.
- The first viewport presents KURCZOKER and a playable hero game.
- A generated run has 5-7 playable nodes, includes at least three gameplay node types, and ends with a boss node.
- A typical complete run targets 5-8 minutes.
- A complete run can be played from start through boss victory or defeat.
- Active-turn battles include player movement, aiming, one fired action per player turn, turn handoff, projectile motion, explosion or hit resolution, knockback where applicable, and visible enemy response.
- The player can restart without reloading.
- The game has at least three node types, three abilities or ability-like actions, four artifacts/rewards, simple enemy AI, and muteable audio effects.
- At least one ability creates a temporary summon that appears in battle and performs a simple short-lived behavior.
- No login or backend is introduced.
