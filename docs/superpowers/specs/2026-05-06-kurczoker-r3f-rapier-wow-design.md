# KURCZOKER R3F/Rapier WOW Iteration Design

## Summary

KURCZOKER moves from the current Canvas 2D/DOM game shell into a Cloudflare-native Astro site with a premium R3F/Three.js visual runtime and Rapier physics. The target is a beautiful, playable vertical slice that feels like a high-polish fantasy pixel-art browser game: Heroes-like route map, Worms-like active battle arenas, ornate UI, rich effects, and collectible rewards.

The project stays browser-first and static-deploy friendly. MCP is used as a production pipeline for assets, scenes, Blender work, Three.js inspection, and Cloudflare workflows. MCP is not required at runtime for players.

## Decisions

- Renderer direction: React Three Fiber on top of Three.js.
- Physics direction: Rapier via `@react-three/rapier`.
- Site shell: keep Astro and Cloudflare Pages compatibility.
- Game structure: 2.5D journey map plus separate battle arenas.
- Visual target: premium pixel-fantasy / painterly 2.5D, not photorealism.
- Asset workflow: static checked-in/hosted assets with source/license metadata.
- Backend: no multiplayer in this slice; Cloudflare Durable Objects are deferred.

## Goals

- Deliver a "wow" first viewport and playable game slice.
- Replace the current flat Canvas 2D renderer with an R3F runtime.
- Keep existing pure game logic where useful, rather than discarding tested state/run/battle rules.
- First implementation MVP: create one beautiful map scene and one standard battle arena, with reward overlay as DOM. Boss/shop/end scenes can reuse the standard scene shell until later polish stages.
- Use Blender MCP, Hyper3D, Sketchfab, Three DevTools MCP, and Cloudflare tooling as production aids.
- Keep build and deployment compatible with Cloudflare Pages.

## Non-Goals

- No use of copyrighted Heroes of Might and Magic 3 or Worms 2 assets.
- No full multiplayer implementation.
- No full destructible terrain engine in the first R3F slice.
- No dependency on live MCP or external API calls in player runtime.
- No full rewrite to Unity, Godot, Babylon, or Bevy for this iteration.

## Art Direction

The reference is an ornate premium fantasy pixel interface:

- carved dark wood and gold frame;
- jewel corner ornaments;
- parchment HUD panels;
- red primary buttons and blue secondary buttons;
- large gold pixel-fantasy titles;
- painted landscape backgrounds with castles, forests, roads, cliffs, treasure rooms, shops, and boss arenas;
- expressive armored chicken hero;
- oversized readable enemy and boss silhouettes;
- glowing collectible reward cards;
- satisfying VFX: projectile trails, impact rings, explosion debris, sparkles, rim glows, smoke, and camera shake.

Implementation should be hybrid:

- bitmap/painterly layers for backgrounds, UI panels, icons, portraits, and cards;
- R3F/Three for depth, parallax, camera, lights, particles, selected 3D props, and animated scene elements;
- Rapier for battle physics, projectile collisions, knockback, and character/terrain contact.

## Architecture

Astro remains the page and deployment shell. The new engine mounts inside the existing hero/game area.

Add `@astrojs/react` for the R3F island. `HeroGame.astro` should render the existing ornate DOM shell and mount a React island such as `<KurczokerCanvas client:load />` inside the current playable area. During migration, the old Canvas 2D bootstrap can coexist behind a feature flag or be removed in one controlled switch; the final MVP must not mount both active renderers at the same time.

```text
src/
  engine/
    KurczokerCanvas.jsx
    GameRuntime.jsx
    store/
      useGameStore.js
    scenes/
      MapScene.jsx
      BattleScene.jsx
      RewardScene.jsx
      ShopScene.jsx
      EndScene.jsx
    components/
      CameraRig.jsx
      SceneLights.jsx
      PixelBillboard.jsx
      AssetSprite.jsx
      ProjectileArc.jsx
      BattleActor.jsx
      MapNode.jsx
    fx/
      ExplosionFx.jsx
      ProjectileTrail.jsx
      RewardGlow.jsx
      HitFlash.jsx
    assets/
      assetManifest.js
  game/
    existing pure logic modules
public/
  game/
    assets/
      manifest.json
      models/
      textures/
      sprites/
      portraits/
      icons/
      licenses/
```

`src/game/*` remains the tested domain layer. `src/engine/*` becomes the visual/runtime layer. The engine reads domain state and dispatches domain actions; it should not duplicate run/battle rules.

All runtime imports must be browser-safe. Server-only SDKs, MCP packages, Sketchfab clients, Hyper3D clients, and Cloudflare API clients must not be imported into client bundles. Runtime assets must resolve from static URLs under `public/game/assets`.

## Runtime Flow

1. Astro renders the landing shell and mounts the game.
2. `KurczokerCanvas.jsx` creates the R3F canvas and shared providers.
3. `useGameStore` bridges existing game state to engine-friendly selectors.
4. `MapScene` renders the journey map while scene state is `map`.
5. Selecting a node transitions to battle/reward/shop using existing game domain functions.
6. `BattleScene` uses Rapier for arena colliders, actors, projectiles, and impacts.
7. Battle results return to rewards/map or terminal end scenes.
8. DOM overlays and R3F effects share the same state model.

For the MVP, Rapier is the authoritative battle physics adapter for the visual battle slice. The domain layer remains authoritative for run state, rewards, node transitions, HP totals, phases, and final battle outcomes. Rapier collision events are converted into explicit domain actions such as `projectileHit`, `actorDamaged`, `turnEnded`, and `battleWon`. Domain modules should not read Three/Rapier objects directly.

## Map Scene

The first map scene should match the reference quality:

- one painted fantasy map background;
- road graph with 6-7 nodes;
- start, battle, shop, treasure, elite, battle, boss;
- node props as high-quality sprites/3D-billboards;
- animated selection arrow/glow;
- parallax/camera drift for depth;
- boss altar visible as distant threat;
- hover/selection states readable on desktop and mobile.

## Battle Scene

The first battle scene should be a side-view 2.5D diorama:

- painted fantasy valley/fortress background;
- foreground terrain platforms as colliders;
- player on left, enemy on right;
- aim arc preview;
- one projectile action: egg bomb;
- explosion VFX with debris/smoke/light pulse;
- knockback and damage feedback;
- player/enemy turn banner;
- boss variant with darker palette and larger boss sprite/model.

Destructible terrain can be faked in the first slice by swapping damaged terrain visuals and spawning debris, while collisions remain chunk-based Rapier colliders.

Rapier WASM loading must be verified through `astro build` and static preview. If bundling causes static hosting issues, the implementation plan should include an explicit fallback: bundle Rapier through Vite using `@react-three/rapier` defaults before introducing custom WASM paths.

## Asset Pipeline

Installed and configured tools:

- Blender MCP via `uvx blender-mcp`;
- Blender 4.5 portable and installed Blender MCP addon;
- Three.js DevTools MCP;
- Cloudflare MCP;
- Sketchfab token in local `.env`;
- Hyper3D token in local `.env`;
- R3F/Rapier runtime dependencies.

Asset rules:

- no secrets in git;
- every imported asset gets source URL, author, license, and processing notes;
- final runtime assets are static files under `public/game/assets`;
- single asset files must stay comfortably below Cloudflare Pages limits;
- optimize GLB/textures after import;
- use Hyper3D for hero, boss, and signature props only;
- use free/licensed libraries for filler props only after license review.

Allowed license categories for third-party assets:

- CC0/public domain;
- CC-BY with attribution recorded in `public/game/assets/licenses/ATTRIBUTIONS.md`;
- paid/commercial assets only if the purchase/license file is stored outside git and a non-secret license note is recorded;
- generated assets only if the provider terms allow project use.

Reject assets that are non-commercial only, no-derivatives, unclear, ripped from games, or visually too close to copyrighted Heroes/Worms assets.

Manifest schema:

```js
{
  id: "kurczoker.hero.idle",
  type: "sprite" | "model" | "texture" | "icon" | "ui" | "audio",
  path: "/game/assets/sprites/kurczoker-hero-idle.webp",
  source: "generated" | "sketchfab" | "poly-pizza" | "kenney" | "quaternius" | "manual",
  sourceUrl: "",
  author: "",
  license: "generated-owned" | "CC0" | "CC-BY" | "commercial",
  attributionRequired: false,
  notes: ""
}
```

## First Asset Pack

Required for the MVP slice:

- KURCZOKER hero: idle, aim, throw;
- standard enemy: idle, hit;
- map background;
- battle background;
- node icons/props: start, battle, treasure, boss;
- reward card icons: egg bomb, shield, grain ring, soup/heal;
- UI frame pieces reused from current UIX where possible;
- VFX: projectile trail, explosion, smoke, reward glow.

Deferred after MVP:

- boss-specific background and boss animation set;
- shop scene;
- victory/game-over illustrated scenes;
- larger artifact catalog;
- full hero defeat/victory pose set.

## Testing

Existing `node:test` coverage stays for pure game rules.

Add or preserve tests for:

- state/run/battle compatibility after engine bridge;
- asset manifest validity;
- no duplicate asset ids;
- source/license metadata exists for imported assets;
- scene state chooses the expected engine scene;
- build succeeds.
- no server-only MCP/API packages are imported from `src/engine` or client entrypoints.

Manual/visual checks:

- desktop 1440x900;
- mobile 390x844;
- R3F canvas nonblank;
- map node selection works;
- battle aim/fire works;
- effects render and do not obscure controls;
- text is not clipped;
- Cloudflare static build succeeds.

Automated visual QA should use Playwright where feasible:

- screenshot desktop and mobile routes;
- assert R3F canvas is nonblank by sampling canvas pixels;
- assert no obvious text overlap in top HUD/buttons using bounding boxes;
- assert scene switch from map to battle changes visible pixels.

## Risks

- Visual ambition can exceed implementation time.
- Generated 3D assets may look inconsistent with the pixel-painterly reference.
- Too much true 3D may look cheaper than high-quality 2.5D layers.
- MCP and API tools may be unstable or rate-limited.
- Dev-only MCP packages currently carry audit warnings; they must stay out of runtime.
- Astro 5 has a moderate audit advisory; upgrading to Astro 6 should be considered separately.
- React island hydration can accidentally double-run old and new game mounts unless the migration removes or gates the old bootstrap.
- Generated art may not meet the reference quality; the first implementation plan should include an asset review checkpoint before wiring many assets.

## Delivery Stages

1. MVP foundation: add React island, R3F canvas, store bridge, scene switching, and remove/gate the old active Canvas 2D renderer.
2. Asset manifest and first MVP asset pack with license metadata.
3. Map MVP: painted map, four node prop types, animated selected route.
4. Battle MVP: Rapier arena, aim arc, egg bomb projectile, explosion, one enemy response.
5. Reward MVP: premium reward card overlay for three choices.
6. Visual QA and build verification: Playwright screenshots, nonblank canvas checks, asset manifest tests.
7. Post-MVP polish: shop, boss-specific arena, illustrated victory/defeat scenes, expanded artifact catalog.

## Acceptance Criteria

- `npm test` passes.
- `npm run build` passes.
- The first viewport presents KURCZOKER with the premium visual direction.
- R3F scene replaces the current flat Canvas 2D game renderer for the MVP slice; both renderers are not active at the same time.
- Map mode matches the provided UIX map references in structure: ornate frame, painted fantasy route, visible start/battle/treasure/boss nodes, selected route marker.
- Battle mode matches the provided UIX battle references in structure: side-view arena, player left, enemy right, turn banner, aim arc, egg bomb, explosion, damage feedback.
- Reward overlay matches the provided UIX reward references in structure: three ornate cards, rarity/color treatment, icon, title, type, description, value.
- Asset manifest records source/license metadata.
- No runtime dependency on MCP, Sketchfab, Hyper3D, or Cloudflare API calls.
- No server-only MCP/API package is imported into the client bundle.
- `.env` remains ignored and no secrets are committed.
