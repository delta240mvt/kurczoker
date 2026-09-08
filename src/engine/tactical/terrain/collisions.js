import {buildTerrainBoxes} from './geometry.js';

export function syncTerrainColliders({R,world,terrain,registry,chunkIds}) {
  const dirty=chunkIds ? new Set(chunkIds) : null;
  for(const [id,collider] of registry) {
    if(!dirty || dirty.has(Number(id.split(':')[0]))) {
      world.removeCollider(collider,true);
      registry.delete(id);
    }
  }
  for(const box of buildTerrainBoxes(terrain.snapshot(),chunkIds)) {
    const collider=world.createCollider(
      R.ColliderDesc.cuboid(box.width/2,box.height/2,1.2)
        .setTranslation(box.x,box.y,0).setFriction(.85)
        .setCollisionGroups((1<<16)|0xffff)
    );
    registry.set(box.id,collider);
  }
}
