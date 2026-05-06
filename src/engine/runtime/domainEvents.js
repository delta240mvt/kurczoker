import { applyDamageToActor } from "../../game/battle.js";
import { BATTLE_PHASES } from "../../game/constants.js";

export const DOMAIN_EVENTS = {
  PROJECTILE_HIT_ENEMY: "projectile-hit-enemy",
  TURN_ENDED: "turn-ended"
};

export function projectileHitEnemy(game, payload) {
  return {
    ...game,
    battle: applyDamageToActor(game.battle, payload.actorId, payload.damage),
    ui: { ...game.ui, message: `Trafienie za ${payload.damage}.` }
  };
}

export function turnEnded(game) {
  return {
    ...game,
    battle: { ...game.battle, phase: BATTLE_PHASES.ENEMY_TURN },
    ui: { ...game.ui, message: "Tura wroga." }
  };
}
