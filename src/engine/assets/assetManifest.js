const PLANNED_ASSETS = [
  {
    id: "kurczoker.hero.idle",
    type: "sprite",
    path: "/game/assets/sprites/kurczoker-hero-idle.webp",
    source: "generated",
    sourceUrl: "",
    author: "KURCZOKER",
    license: "generated-owned",
    attributionRequired: false,
    notes: "MVP placeholder. Replace with final generated/imported hero idle art."
  },
  {
    id: "kurczoker.hero.aim",
    type: "sprite",
    path: "/game/assets/sprites/kurczoker-hero-aim.webp",
    source: "generated",
    sourceUrl: "",
    author: "KURCZOKER",
    license: "generated-owned",
    attributionRequired: false,
    notes: "MVP placeholder."
  },
  {
    id: "kurczoker.hero.throw",
    type: "sprite",
    path: "/game/assets/sprites/kurczoker-hero-throw.webp",
    source: "generated",
    sourceUrl: "",
    author: "KURCZOKER",
    license: "generated-owned",
    attributionRequired: false,
    notes: "MVP placeholder."
  },
  {
    id: "enemy.grunt.idle",
    type: "sprite",
    path: "/game/assets/sprites/enemy-grunt-idle.webp",
    source: "generated",
    sourceUrl: "",
    author: "KURCZOKER",
    license: "generated-owned",
    attributionRequired: false,
    notes: "MVP placeholder."
  },
  {
    id: "enemy.grunt.hit",
    type: "sprite",
    path: "/game/assets/sprites/enemy-grunt-hit.webp",
    source: "generated",
    sourceUrl: "",
    author: "KURCZOKER",
    license: "generated-owned",
    attributionRequired: false,
    notes: "MVP placeholder."
  },
  {
    id: "scene.map.background",
    type: "texture",
    path: "/game/assets/textures/map-background.webp",
    source: "generated",
    sourceUrl: "",
    author: "KURCZOKER",
    license: "generated-owned",
    attributionRequired: false,
    notes: "MVP painted map background placeholder."
  },
  {
    id: "scene.battle.background",
    type: "texture",
    path: "/game/assets/textures/battle-background.webp",
    source: "generated",
    sourceUrl: "",
    author: "KURCZOKER",
    license: "generated-owned",
    attributionRequired: false,
    notes: "MVP painted battle background placeholder."
  },
  {
    id: "node.start",
    type: "icon",
    path: "/game/assets/icons/node-start.webp",
    source: "generated",
    sourceUrl: "",
    author: "KURCZOKER",
    license: "generated-owned",
    attributionRequired: false,
    notes: "MVP node prop placeholder."
  },
  {
    id: "node.battle",
    type: "icon",
    path: "/game/assets/icons/node-battle.webp",
    source: "generated",
    sourceUrl: "",
    author: "KURCZOKER",
    license: "generated-owned",
    attributionRequired: false,
    notes: "MVP node prop placeholder."
  },
  {
    id: "node.treasure",
    type: "icon",
    path: "/game/assets/icons/node-treasure.webp",
    source: "generated",
    sourceUrl: "",
    author: "KURCZOKER",
    license: "generated-owned",
    attributionRequired: false,
    notes: "MVP node prop placeholder."
  },
  {
    id: "node.boss",
    type: "icon",
    path: "/game/assets/icons/node-boss.webp",
    source: "generated",
    sourceUrl: "",
    author: "KURCZOKER",
    license: "generated-owned",
    attributionRequired: false,
    notes: "MVP node prop placeholder."
  },
  {
    id: "reward.egg-bomb",
    type: "icon",
    path: "/game/assets/icons/reward-egg-bomb.webp",
    source: "generated",
    sourceUrl: "",
    author: "KURCZOKER",
    license: "generated-owned",
    attributionRequired: false,
    notes: "MVP reward icon placeholder."
  },
  {
    id: "reward.shield",
    type: "icon",
    path: "/game/assets/icons/reward-shield.webp",
    source: "generated",
    sourceUrl: "",
    author: "KURCZOKER",
    license: "generated-owned",
    attributionRequired: false,
    notes: "MVP reward icon placeholder."
  },
  {
    id: "reward.grain-ring",
    type: "icon",
    path: "/game/assets/icons/reward-grain-ring.webp",
    source: "generated",
    sourceUrl: "",
    author: "KURCZOKER",
    license: "generated-owned",
    attributionRequired: false,
    notes: "MVP reward icon placeholder."
  },
  {
    id: "reward.heal-soup",
    type: "icon",
    path: "/game/assets/icons/reward-heal-soup.webp",
    source: "generated",
    sourceUrl: "",
    author: "KURCZOKER",
    license: "generated-owned",
    attributionRequired: false,
    notes: "MVP reward icon placeholder."
  },
  {
    id: "ui.frame.reference",
    type: "ui",
    path: "/game/assets/ui/frame-reference.webp",
    source: "manual",
    sourceUrl: "",
    author: "KURCZOKER",
    license: "generated-owned",
    attributionRequired: false,
    notes: "Placeholder until final UI frame export."
  },
  {
    id: "fx.projectile-trail",
    type: "texture",
    path: "/game/assets/textures/fx-projectile-trail.webp",
    source: "generated",
    sourceUrl: "",
    author: "KURCZOKER",
    license: "generated-owned",
    attributionRequired: false,
    notes: "MVP VFX placeholder."
  },
  {
    id: "fx.explosion",
    type: "texture",
    path: "/game/assets/textures/fx-explosion.webp",
    source: "generated",
    sourceUrl: "",
    author: "KURCZOKER",
    license: "generated-owned",
    attributionRequired: false,
    notes: "MVP VFX placeholder."
  },
  {
    id: "fx.smoke",
    type: "texture",
    path: "/game/assets/textures/fx-smoke.webp",
    source: "generated",
    sourceUrl: "",
    author: "KURCZOKER",
    license: "generated-owned",
    attributionRequired: false,
    notes: "MVP VFX placeholder."
  },
  {
    id: "fx.reward-glow",
    type: "texture",
    path: "/game/assets/textures/fx-reward-glow.webp",
    source: "generated",
    sourceUrl: "",
    author: "KURCZOKER",
    license: "generated-owned",
    attributionRequired: false,
    notes: "MVP VFX placeholder."
  }
];

const UIX_ASSETS = [
  "canvas/01-canvas.webp",
  "canvas/02-canvas.webp",
  "canvas/03-canvas.webp",
  "canvas/04-canvas.webp",
  "canvas/05-canvas.webp",
  "canvas/06-canvas.webp",
  "canvas/07-canvas.webp",
  "canvas/08-canvas.webp",
  "canvas/09-canvas.webp",
  "canvas/10-canvas.webp",
  "svg/corner-crystal.svg",
  "svg/icon-ability-bomb.svg",
  "svg/icon-audio-note.svg",
  "svg/icon-feather-quill.svg",
  "svg/icon-gear.svg",
  "svg/icon-grain-coin.svg",
  "svg/icon-hp-heart.svg",
  "svg/icon-jump.svg",
  "svg/icon-node.svg",
  "svg/icon-scene-book.svg",
  "svg/icon-shield.svg",
  "svg/ornament-top.svg",
  "svg/ribbon-seal.svg"
].map((relativePath) => {
  const path = `/uix/${relativePath}`;
  const id = `uix.${relativePath.replace(/\//g, ".").replace(/\.[^.]+$/, "")}`;

  return {
    id,
    type: relativePath.startsWith("canvas/") ? "ui" : "icon",
    path,
    source: "generated",
    sourceUrl: "",
    author: "KURCZOKER",
    license: "generated-owned",
    attributionRequired: false,
    ready: true,
    notes: "Runtime UIX asset used by the playable shell."
  };
});

const GENERATED_MODEL_ASSETS = [
  {
    id: "model.kurczoker.hero.knight",
    type: "model",
    path: "/game/assets/models/kurczoker-hero-knight.glb",
    source: "hyper3d-rodin-uix",
    sourceUrl: "",
    author: "KURCZOKER",
    license: "generated-owned",
    attributionRequired: false,
    ready: true,
    notes: "Hyper3D/Rodin image-to-3D model generated from UIX battle reference and copied into the canonical hero GLB path."
  },
  {
    id: "model.kurczoker.enemy.grunt",
    type: "model",
    path: "/game/assets/models/kurczoker-enemy-grunt.glb",
    source: "hyper3d-rodin-uix",
    sourceUrl: "",
    author: "KURCZOKER",
    license: "generated-owned",
    attributionRequired: false,
    ready: true,
    notes: "Hyper3D/Rodin image-to-3D red enemy rooster generated from UIX battle reference."
  },
  {
    id: "model.kurczoker.boss.rooster",
    type: "model",
    path: "/game/assets/models/kurczoker-boss-rooster.glb",
    source: "hyper3d-rodin-uix",
    sourceUrl: "",
    author: "KURCZOKER",
    license: "generated-owned",
    attributionRequired: false,
    ready: true,
    notes: "Hyper3D/Rodin image-to-3D boss rooster generated from UIX final battle reference."
  },
  {
    id: "model.kurczoker.map.props",
    type: "model",
    path: "/game/assets/models/kurczoker-map-props.glb",
    source: "hyper3d-rodin-uix",
    sourceUrl: "",
    author: "KURCZOKER",
    license: "generated-owned",
    attributionRequired: false,
    ready: true,
    notes: "Hyper3D/Rodin image-to-3D adventure map world generated from UIX map reference."
  },
  {
    id: "model.kurczoker.terrain.kit",
    type: "model",
    path: "/game/assets/models/kurczoker-terrain-kit.glb",
    source: "hyper3d-rodin-uix",
    sourceUrl: "",
    author: "KURCZOKER",
    license: "generated-owned",
    attributionRequired: false,
    ready: true,
    notes: "Hyper3D/Rodin image-to-3D battle world generated from UIX battle arena reference."
  },
  {
    id: "model.kurczoker.diorama.props",
    type: "model",
    path: "/game/assets/models/kurczoker-diorama-props.glb",
    source: "hyper3d-rodin-uix",
    sourceUrl: "",
    author: "KURCZOKER",
    license: "generated-owned",
    attributionRequired: false,
    ready: true,
    notes: "Hyper3D/Rodin image-to-3D battle diorama generated from UIX battle arena reference."
  }
];

const HYPER3D_WORLD_ASSETS = [
  "world-terrain",
  "battle-arena",
  "castle-landmark",
  "windmill-landmark",
  "shop-wagon",
  "treasure-chest",
  "boss-altar",
  "forest-props",
  "floating-platform",
  "path-node"
].map((name) => ({
  id: `model.hyper3d.world.${name}`,
  type: "model",
  path: `/game/assets/models/hyper3d-world/${name}.glb`,
  source: "hyper3d-rodin-uix",
  sourceUrl: "",
  author: "KURCZOKER",
  license: "generated-owned",
  attributionRequired: false,
  ready: true,
  notes: "Hyper3D/Rodin Regular Quad image-to-3D world asset generated from UIX reference crops for the in-game 3D map and battle scenes."
}));

const HYPER3D_CLEAN_WORLD_ASSETS = [
  "clean-world-terrain",
  "clean-battle-arena",
  "clean-castle",
  "clean-windmill",
  "clean-shop",
  "clean-treasure",
  "clean-boss-altar",
  "clean-forest",
  "clean-platform",
  "clean-map-node"
].map((name) => ({
  id: `model.hyper3d.clean.${name}`,
  type: "model",
  path: `/game/assets/models/hyper3d-clean/${name}.glb`,
  source: "hyper3d-rodin-text",
  sourceUrl: "",
  author: "KURCZOKER",
  license: "generated-owned",
  attributionRequired: false,
  ready: true,
  notes: "Hyper3D/Rodin Regular Quad text-to-3D clean world asset generated to avoid carrying UI screenshot labels into the in-game 3D canvas."
}));

const HYPER3D_CLEAN_CHARACTER_ASSETS = [
  "clean-hero-chicken",
  "clean-enemy-rooster",
  "clean-boss-rooster"
].map((name) => ({
  id: `model.hyper3d.clean.character.${name}`,
  type: "model",
  path: `/game/assets/models/hyper3d-clean-characters/${name}.glb`,
  source: "hyper3d-rodin-text",
  sourceUrl: "",
  author: "KURCZOKER",
  license: "generated-owned",
  attributionRequired: false,
  ready: true,
  notes: "Hyper3D/Rodin text-to-3D volumetric character model generated to replace flat screenshot relief chickens in battle scenes."
}));

const TRUE_3D_CHARACTER_ASSETS = [
  "true-hero-chicken",
  "true-enemy-rooster",
  "true-boss-rooster"
].map((name) => ({
  id: `model.true3d.character.${name}`,
  type: "model",
  path: `/game/assets/models/true-3d-characters/${name}.glb`,
  source: "threejs-procedural-geometry",
  sourceUrl: "",
  author: "KURCZOKER",
  license: "generated-owned",
  attributionRequired: false,
  ready: true,
  notes: "Runtime battle actor built from real mesh primitives only. No screenshot texture cards, no billboard planes."
}));

export const ASSETS = PLANNED_ASSETS.map((asset) => ({
  ...asset,
  ready: false
}))
  .concat(UIX_ASSETS.map((asset) => ({ ...asset, ready: asset.ready ?? false })))
  .concat(GENERATED_MODEL_ASSETS)
  .concat(HYPER3D_WORLD_ASSETS)
  .concat(HYPER3D_CLEAN_WORLD_ASSETS)
  .concat(HYPER3D_CLEAN_CHARACTER_ASSETS)
  .concat(TRUE_3D_CHARACTER_ASSETS);
