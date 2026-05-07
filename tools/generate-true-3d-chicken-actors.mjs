import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import * as THREE from "three";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";

globalThis.FileReader = class {
  async readAsArrayBuffer(blob) {
    this.result = await blob.arrayBuffer();
    this.onloadend?.();
  }
};

const OUT = path.resolve("public/game/assets/models/true-3d-characters");
mkdirSync(OUT, { recursive: true });

const materials = {
  feather: new THREE.MeshStandardMaterial({ color: 0xf2e6c7, roughness: 0.72 }),
  featherShade: new THREE.MeshStandardMaterial({ color: 0xd5c398, roughness: 0.82 }),
  red: new THREE.MeshStandardMaterial({ color: 0xa31312, roughness: 0.66 }),
  darkRed: new THREE.MeshStandardMaterial({ color: 0x5f0b0d, roughness: 0.7 }),
  beak: new THREE.MeshStandardMaterial({ color: 0xf2a414, roughness: 0.48 }),
  black: new THREE.MeshStandardMaterial({ color: 0x100c0b, roughness: 0.5 }),
  steel: new THREE.MeshStandardMaterial({ color: 0x8b9299, roughness: 0.34, metalness: 0.42 }),
  darkSteel: new THREE.MeshStandardMaterial({ color: 0x3e4652, roughness: 0.42, metalness: 0.48 }),
  gold: new THREE.MeshStandardMaterial({ color: 0xd79a27, roughness: 0.38, metalness: 0.28 }),
  leather: new THREE.MeshStandardMaterial({ color: 0x5a3216, roughness: 0.78 }),
  blue: new THREE.MeshStandardMaterial({ color: 0x2d6bb3, roughness: 0.46, metalness: 0.06 }),
  bossFeather: new THREE.MeshStandardMaterial({ color: 0x111017, roughness: 0.76 }),
  lava: new THREE.MeshStandardMaterial({ color: 0xff3c12, emissive: 0xff2600, emissiveIntensity: 0.85, roughness: 0.38 }),
  shadow: new THREE.MeshStandardMaterial({ color: 0x0b1020, roughness: 0.8, transparent: true, opacity: 0.28 })
};

function mesh(name, geometry, material, position = [0, 0, 0], scale = [1, 1, 1], rotation = [0, 0, 0]) {
  const object = new THREE.Mesh(geometry, material);
  object.name = name;
  object.position.set(...position);
  object.scale.set(...scale);
  object.rotation.set(...rotation);
  object.castShadow = true;
  object.receiveShadow = true;
  return object;
}

function sphere(name, material, position, scale, segments = 32, rings = 18) {
  return mesh(name, new THREE.SphereGeometry(1, segments, rings), material, position, scale);
}

function cone(name, material, position, radius, height, rotation = [0, 0, 0], segments = 24) {
  return mesh(name, new THREE.ConeGeometry(radius, height, segments), material, position, [1, 1, 1], rotation);
}

function cyl(name, material, position, radius, height, rotation = [0, 0, 0], segments = 24) {
  return mesh(name, new THREE.CylinderGeometry(radius, radius, height, segments), material, position, [1, 1, 1], rotation);
}

function box(name, material, position, scale, rotation = [0, 0, 0]) {
  return mesh(name, new THREE.BoxGeometry(1, 1, 1), material, position, scale, rotation);
}

function addEyes(group, x, y, z, spread = 0.15, size = 0.045) {
  group.add(sphere("left_glossy_eye", materials.black, [x, y + spread, z], [size, size, size], 16, 8));
  group.add(sphere("right_glossy_eye", materials.black, [x, y - spread, z], [size, size, size], 16, 8));
  group.add(sphere("left_eye_highlight", materials.feather, [x + 0.018, y + spread + 0.006, z + 0.015], [size * 0.26, size * 0.26, size * 0.26], 8, 6));
  group.add(sphere("right_eye_highlight", materials.feather, [x + 0.018, y - spread + 0.006, z + 0.015], [size * 0.26, size * 0.26, size * 0.26], 8, 6));
}

function addLegs(group, prefix, material = materials.beak, scale = 1) {
  for (const side of [-1, 1]) {
    group.add(cyl(`${prefix}_leg_${side}`, material, [0.08, side * 0.18 * scale, 0.22], 0.032 * scale, 0.38 * scale, [0, 0, 0], 12));
    group.add(box(`${prefix}_foot_${side}`, material, [0.23, side * 0.18 * scale, 0.03], [0.28 * scale, 0.065 * scale, 0.045 * scale]));
    group.add(cone(`${prefix}_front_claw_${side}`, material, [0.39, side * 0.18 * scale, 0.03], 0.024 * scale, 0.12 * scale, [0, 0, -Math.PI / 2], 10));
    group.add(cone(`${prefix}_side_claw_a_${side}`, material, [0.25, side * 0.27 * scale, 0.03], 0.018 * scale, 0.09 * scale, [Math.PI / 2, 0, 0], 10));
    group.add(cone(`${prefix}_side_claw_b_${side}`, material, [0.25, side * 0.09 * scale, 0.03], 0.018 * scale, 0.09 * scale, [-Math.PI / 2, 0, 0], 10));
  }
}

function addFeatherRows(group, prefix, material, radius = 1) {
  for (let i = 0; i < 7; i += 1) {
    const y = -0.36 + i * 0.12;
    const z = 0.72 - Math.abs(y) * 0.1;
    group.add(sphere(`${prefix}_side_feather_${i}`, material, [0.18, y, z], [0.12 * radius, 0.035 * radius, 0.22 * radius], 14, 8));
  }
  for (let i = 0; i < 5; i += 1) {
    group.add(sphere(`${prefix}_chest_plume_${i}`, material, [0.37, -0.22 + i * 0.11, 0.72 - i * 0.012], [0.07 * radius, 0.032 * radius, 0.13 * radius], 12, 8));
  }
}

function makeHero() {
  const group = new THREE.Group();
  group.name = "true_3d_hero_chicken_knight";
  group.add(sphere("round_feather_body", materials.feather, [0, 0, 0.72], [0.48, 0.37, 0.56], 40, 20));
  group.add(sphere("warm_belly_volume", materials.featherShade, [0.18, 0, 0.62], [0.28, 0.27, 0.32], 28, 14));
  addFeatherRows(group, "hero", materials.featherShade);
  group.add(sphere("helmeted_head", materials.feather, [0.08, 0, 1.28], [0.36, 0.31, 0.34], 36, 18));
  group.add(cone("solid_beak", materials.beak, [0.48, 0, 1.26], 0.12, 0.3, [0, 0, -Math.PI / 2], 24));
  addEyes(group, 0.34, 0, 1.38, 0.13, 0.042);
  group.add(cyl("rounded_steel_helmet_crown", materials.steel, [0.02, 0, 1.5], 0.34, 0.42, [Math.PI / 2, 0, 0], 36));
  group.add(cyl("gold_helmet_rim", materials.gold, [0.12, 0, 1.41], 0.36, 0.06, [Math.PI / 2, 0, 0], 36));
  group.add(cone("red_helmet_plume_center", materials.red, [-0.12, 0, 1.79], 0.07, 0.34, [-0.28, 0, 0], 14));
  group.add(cone("red_helmet_plume_side_a", materials.red, [-0.06, 0.08, 1.72], 0.055, 0.27, [-0.2, 0.12, 0.12], 14));
  group.add(cone("red_helmet_plume_side_b", materials.red, [-0.06, -0.08, 1.72], 0.055, 0.27, [-0.2, -0.12, -0.12], 14));
  group.add(cyl("red_neck_scarf_ring", materials.red, [0.08, 0, 1.02], 0.28, 0.12, [Math.PI / 2, 0, 0], 32));
  group.add(sphere("left_wing_throwing", materials.feather, [0.24, 0.42, 0.88], [0.13, 0.28, 0.11], 20, 10));
  group.add(sphere("right_wing_shield_arm", materials.featherShade, [0.05, -0.42, 0.78], [0.13, 0.28, 0.11], 20, 10));
  group.add(sphere("blue_spotted_egg_bomb", new THREE.MeshStandardMaterial({ color: 0xe8d795, roughness: 0.42 }), [0.48, 0.52, 0.98], [0.13, 0.11, 0.16], 24, 14));
  for (const [i, p] of [[0, [0.53, 0.56, 1.02]], [1, [0.45, 0.48, 1.04]], [2, [0.5, 0.52, 0.88]]]) {
    group.add(sphere(`egg_bomb_blue_spot_${i}`, materials.blue, p, [0.026, 0.018, 0.026], 10, 6));
  }
  group.add(sphere("blue_enamel_shield", materials.blue, [0.16, -0.52, 0.72], [0.22, 0.055, 0.29], 24, 12));
  group.add(cyl("shield_gold_boss", materials.gold, [0.24, -0.58, 0.72], 0.07, 0.035, [Math.PI / 2, 0, 0], 16));
  group.add(box("leather_backpack", materials.leather, [-0.34, 0, 0.82], [0.16, 0.34, 0.34]));
  addLegs(group, "hero");
  return group;
}

function makeEnemy() {
  const group = new THREE.Group();
  group.name = "true_3d_red_enemy_rooster";
  group.add(sphere("red_body_volume", materials.red, [0, 0, 0.72], [0.48, 0.36, 0.55], 40, 20));
  group.add(sphere("dark_belly_volume", materials.darkRed, [0.18, 0, 0.62], [0.24, 0.24, 0.28], 28, 14));
  addFeatherRows(group, "enemy", materials.darkRed);
  group.add(sphere("red_rooster_head", materials.red, [0.08, 0, 1.25], [0.35, 0.29, 0.32], 34, 18));
  group.add(cone("sharp_beak", materials.beak, [0.48, 0, 1.23], 0.11, 0.28, [0, 0, -Math.PI / 2], 22));
  addEyes(group, 0.34, 0, 1.35, 0.12, 0.048);
  for (let i = 0; i < 4; i += 1) {
    group.add(cone(`upright_comb_spike_${i}`, materials.darkRed, [-0.08 + i * 0.06, 0, 1.55 + (i % 2) * 0.06], 0.075, 0.28, [-0.14, 0, 0], 12));
  }
  for (const side of [-1, 1]) {
    group.add(sphere(`steel_pauldron_${side}`, materials.darkSteel, [0.0, side * 0.37, 0.94], [0.2, 0.13, 0.16], 20, 10));
    group.add(cone(`pauldron_spike_${side}`, materials.steel, [0.1, side * 0.52, 0.98], 0.04, 0.15, [side * Math.PI / 2, 0, 0], 10));
  }
  for (let i = 0; i < 6; i += 1) {
    group.add(sphere(`tail_blade_${i}`, materials.darkRed, [-0.35, -0.28 + i * 0.11, 0.9 + Math.abs(2.5 - i) * 0.035], [0.11, 0.04, 0.28], 16, 8));
  }
  group.add(sphere("round_metal_shield", materials.darkSteel, [0.25, -0.5, 0.72], [0.2, 0.055, 0.27], 22, 12));
  group.add(box("shield_gold_cross_h", materials.gold, [0.31, -0.55, 0.72], [0.22, 0.02, 0.05]));
  group.add(box("shield_gold_cross_v", materials.gold, [0.31, -0.55, 0.72], [0.05, 0.02, 0.22]));
  addLegs(group, "enemy");
  return group;
}

function makeBoss() {
  const group = new THREE.Group();
  group.name = "true_3d_boss_rooster";
  group.add(sphere("massive_black_body", materials.bossFeather, [0, 0, 0.86], [0.68, 0.5, 0.72], 48, 24));
  group.add(sphere("molten_chest_core", materials.lava, [0.35, 0, 0.86], [0.2, 0.15, 0.24], 24, 14));
  group.add(sphere("boss_head_volume", materials.bossFeather, [0.16, 0, 1.55], [0.44, 0.36, 0.4], 40, 20));
  group.add(cone("heavy_gold_beak", materials.beak, [0.67, 0, 1.5], 0.16, 0.38, [0, 0, -Math.PI / 2], 24));
  addEyes(group, 0.49, 0, 1.7, 0.16, 0.06);
  for (let i = 0; i < 5; i += 1) {
    group.add(cone(`boss_crown_comb_${i}`, materials.red, [-0.08 + i * 0.06, -0.2 + i * 0.1, 2.0 - Math.abs(2 - i) * 0.08], 0.1, 0.42, [-0.18, 0, 0], 14));
  }
  for (const side of [-1, 1]) {
    group.add(sphere(`boss_gold_pauldron_${side}`, materials.gold, [0.02, side * 0.52, 1.08], [0.31, 0.18, 0.22], 24, 12));
    group.add(cone(`boss_steel_spike_${side}`, materials.steel, [0.1, side * 0.77, 1.1], 0.065, 0.24, [side * Math.PI / 2, 0, 0], 12));
    group.add(sphere(`boss_dark_wing_${side}`, materials.bossFeather, [-0.2, side * 0.5, 0.86], [0.22, 0.16, 0.42], 20, 10));
  }
  for (let i = 0; i < 8; i += 1) {
    const y = -0.46 + i * 0.13;
    group.add(sphere(`boss_tail_volume_${i}`, materials.bossFeather, [-0.52, y, 1.0 + Math.abs(y) * 0.22], [0.16, 0.055, 0.48], 18, 8));
  }
  group.add(cyl("boss_gold_belt", materials.gold, [0.14, 0, 0.52], 0.42, 0.08, [Math.PI / 2, 0, 0], 32));
  group.add(cyl("boss_lava_belt_gem", materials.lava, [0.48, 0, 0.52], 0.12, 0.06, [Math.PI / 2, 0, 0], 20));
  addLegs(group, "boss", materials.beak, 1.28);
  return group;
}

async function exportGlb(group, filename) {
  const scene = new THREE.Scene();
  scene.add(group);
  const exporter = new GLTFExporter();
  const arrayBuffer = await exporter.parseAsync(scene, {
    binary: true,
    onlyVisible: true,
    trs: false
  });
  writeFileSync(path.join(OUT, filename), Buffer.from(arrayBuffer));
}

await exportGlb(makeHero(), "true-hero-chicken.glb");
await exportGlb(makeEnemy(), "true-enemy-rooster.glb");
await exportGlb(makeBoss(), "true-boss-rooster.glb");
console.log(`Generated true 3D chicken actor GLBs in ${OUT}`);
