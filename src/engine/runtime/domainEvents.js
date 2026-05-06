import { applyDamageToActor } from "../../game/battle.js";
import { getAbilityById } from "../../game/abilities.js";
import { ABILITY_IDS, BATTLE_PHASES } from "../../game/constants.js";

export const DOMAIN_EVENTS = {
  PROJECTILE_HIT_ENEMY: "projectile-hit-enemy",
  TURN_ENDED: "turn-ended"
};

function resolveEggBombDamage(game, payload = {}) {
  if (Number.isFinite(payload.damage)) {
    return payload.damage;
  }

  const selectedAbilityId = payload.abilityId ?? game.ui?.selectedAbilityId ?? game.run?.abilities?.[0] ?? ABILITY_IDS.EGG_BOMB;
  const selectedAbility = getAbilityById(selectedAbilityId);
  const eggBomb = getAbilityById(ABILITY_IDS.EGG_BOMB);
  const ability = selectedAbility?.id === ABILITY_IDS.EGG_BOMB ? selectedAbility : eggBomb;

  return (ability?.damage ?? 1) + (game.battle?.eggBombDamageBonus ?? game.run?.stats?.eggBombDamageBonus ?? 0);
}

export function projectileHitEnemy(game, payload) {
  const damage = resolveEggBombDamage(game, payload);
  const battle = applyDamageToActor(game.battle, payload.actorId, damage);

  return {
    ...game,
    battle: { ...battle, phase: battle.phase === BATTLE_PHASES.WON ? BATTLE_PHASES.WON : BATTLE_PHASES.ENEMY_TURN },
    ui: { ...game.ui, message: `Trafienie za ${damage}.` }
  };
}

export function turnEnded(game) {
  return {
    ...game,
    battle: { ...game.battle, phase: BATTLE_PHASES.ENEMY_TURN },
    ui: { ...game.ui, message: "Tura wroga." }
  };
}
