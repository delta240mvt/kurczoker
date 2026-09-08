export const STEP = 1 / 60;
export const GRAVITY = -10;
export const MATERIAL = Object.freeze({empty:0,soil:1,wood:2,foundation:3});

export function nextRandom(state) {
  const next = (Math.imul(state >>> 0, 1664525) + 1013904223) >>> 0;
  return {state:next, value:next / 4294967296};
}

export const WEAPONS={
 jajooka:{name:'Jajooka',kind:'impact',damage:30,radius:1.8},
 granajko:{name:'Granajko',kind:'bounce',damage:35,radius:2,fuse:2.5,restitution:.55},
 shotgun:{name:'Śrutownik',kind:'cone',damage:40,range:5,spreadDeg:12,pellets:5},
 kick:{name:'Kopniak',kind:'contact',damage:10,range:1.2,impulse:6},
 mine:{name:'Mina',kind:'mine',damage:35,radius:2,armSeconds:.8,triggerRadius:.8},
 cluster:{name:'Jajko z niespodzianką',kind:'cluster',damage:0,radius:0,fuse:2.5,restitution:.45,fragments:5,fragmentDamage:12},
};
export const FRAGMENT={kind:'impact',damage:12,radius:1.1};
export const projectileDefinition=id=>id==='fragment'?FRAGMENT:WEAPONS[id??'jajooka'];
