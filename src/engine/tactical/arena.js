import yard from './maps/yard.js';
export function listMaps(){return [yard];}
export function getMap(id){const map=listMaps().find(m=>m.id===id);if(!map)throw new Error('Unknown map: '+id);return map;}
export const STEP = 1 / 60;
export const GRAVITY = -10;
export const ARENA_BOUNDS = { left: -6.5, right: 6.5, top: 7, bottom: -1 };

export function arenaFor(type = "battle", encounterId = "") {
  const variant =
    type === "boss"
      ? 2
      : type === "elite" || encounterId.includes("battle-3")
        ? 1
        : 0;
  return {
    variant,
    name: ["Słoneczne Grzędy", "Ruiny Starego Młyna", "Twierdza Jajokróla"][
      variant
    ],
    platforms: [
      { id: "ground", x: 0, y: -0.35, width: 14, height: 0.7, depth: 3.4 },
      ...(variant
        ? [
            {
              id: "rampart",
              x: 0,
              y: 0.25,
              width: 1.7,
              height: 0.5,
              depth: 2.4,
            },
          ]
        : []),
      {
        id: "left-bank",
        x: -6.9,
        y: -0.1,
        width: 0.6,
        height: 0.5,
        depth: 3.4,
      },
      {
        id: "right-bank",
        x: 6.9,
        y: -0.1,
        width: 0.6,
        height: 0.5,
        depth: 3.4,
      },
    ],
  };
}

export function addTerrain(R, world, arena) {
  for (const p of arena.platforms) {
    world.createCollider(
      R.ColliderDesc.cuboid(p.width / 2, p.height / 2, p.depth / 2)
        .setTranslation(p.x, p.y, 0)
        .setFriction(0.9)
        .setCollisionGroups((1 << 16) | 0xffff),
    );
  }
}
