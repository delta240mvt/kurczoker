export const STEP = 1 / 60;
export const GRAVITY = -10;
export const MATERIAL = Object.freeze({empty:0,soil:1,wood:2,foundation:3});

export function nextRandom(state) {
  const next = (Math.imul(state >>> 0, 1664525) + 1013904223) >>> 0;
  return {state:next, value:next / 4294967296};
}
