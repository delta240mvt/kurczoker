export function fixtureMap(overrides = {}) {
  return {
    id: 'fixture', name: 'Test arena', summary: '', version: 1,
    width: 20, height: 12, cellSize: .125, chunkCells: 32,
    shapes: [
      {id:'soil',kind:'rect',x:0,y:0,width:20,height:2,material:1},
      {id:'base',kind:'rect',x:0,y:0,width:20,height:.25,material:3},
    ],
    spawns: [
      {id:'player',team:'player',role:'hero',x:2,y:2.7},
      {id:'enemy-1',team:'enemy',role:'shooter',x:16,y:2.7},
    ],
    safeZones: [{x:1,y:2,width:2,height:1}], landmarks: [],
    ...overrides,
  };
}

export function stepFor(sim, seconds) {
  for (let n = 0; n < Math.round(seconds * 60); n++) sim.advance(1 / 60);
}

export async function testBattle(overrides={}) {
  const {createBattleSimulation}=await import('../../src/engine/tactical/simulation.js');
  return createBattleSimulation({map:fixtureMap(),encounterId:'test-1',mode:'quick',seed:1,
    player:{health:100,maxHealth:100,upgrades:[],inventory:{owned:['jajooka','kick'],ammo:{},tools:{pickaxe:2,drill:2}}},
    ...overrides});
}
