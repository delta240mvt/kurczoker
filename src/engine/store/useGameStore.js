import { create } from "zustand";
import { createStore } from "zustand/vanilla";
import { createEnemy, createPlayer } from "../../game/actors.js";
import { createBattleState, updateBattle } from "../../game/battle.js";
import { BATTLE_PHASES, SCENES } from "../../game/constants.js";
import {
  applyRunReward,
  completeCurrentNode,
  markRunDefeated,
  purchaseShopOffer,
  selectMapNode,
  skipShop,
  startRun
} from "../../game/run.js";
import { resetRun, setUiMessage, toggleMute as toggleMuteState } from "../../game/state.js";
import { projectileHitEnemy, turnEnded } from "../runtime/domainEvents.js";

function createEngineBattleState(game) {
  const battle = game.battle;
  if (!battle || battle.actors) {
    return battle;
  }

  const elite = battle.type === "elite";
  const boss = battle.type === "boss";
  const enemyType = boss ? "boss" : elite ? "elite" : "grunt";

  return createBattleState({
    nodeId: battle.nodeId,
    encounterId: battle.encounterId,
    type: battle.type,
    actors: [
      createPlayer({ health: game.run.health, maxHealth: game.run.maxHealth }),
      createEnemy(enemyType, {
        id: boss ? "boss-jajokrol" : `${enemyType}-1`,
        health: boss ? 6 : elite ? 4 : 2,
        maxHealth: boss ? 6 : elite ? 4 : 2,
        damage: elite ? 2 : 1
      })
    ],
    artifacts: game.run.artifacts,
    playerSpeed: 0.22 + (game.run.stats?.moveSpeedBonus ?? 0),
    eggBombDamageBonus: game.run.stats?.eggBombDamageBonus ?? 0,
    damageReduction: game.run.stats?.damageReduction ?? 0
  });
}

function hydrateEngineBattle(game) {
  if (game.scene !== SCENES.BATTLE) {
    return game;
  }

  return {
    ...game,
    battle: createEngineBattleState(game)
  };
}

function stateAfterBattle(game) {
  if (game.battle?.phase === BATTLE_PHASES.WON) {
    return completeCurrentNode(game);
  }

  if (game.battle?.phase === BATTLE_PHASES.LOST) {
    return markRunDefeated(game);
  }

  return game;
}

export function createEngineStateInitializer(seed = 1) {
  return (set, get) => ({
    game: setUiMessage(startRun(seed), "Gotowy do wyprawy."),
    input: { aim: { x: 0, y: 0 }, moveX: 0, jump: false, firing: false },
    selectNode(nodeId) {
      set({ game: hydrateEngineBattle(selectMapNode(get().game, nodeId)) });
    },
    finishEncounter({ encounterId, won, health }) {
      const game = get().game;
      if (game.scene !== SCENES.BATTLE || game.battle?.encounterId !== encounterId || !Number.isFinite(health)) return;
      const run = { ...game.run, health: Math.max(0, Math.min(game.run.maxHealth, health)),
        gold: game.run.gold + (won ? game.battle.type === 'elite' ? 6 : 4 : 0),
        temporarySummons: (game.run.temporarySummons ?? []).map(s => ({ ...s, ttl: s.ttl - 1 })).filter(s => s.ttl > 0) };
      const next = { ...game, run, battle: null };
      set({ game: won && run.health > 0 ? completeCurrentNode(next) : markRunDefeated(next) });
    },
    selectAbility(id) {
      const game = get().game;
      if (!game.run.abilities.includes(id)) return;
      set({ game: { ...game, ui: { ...game.ui, selectedAbilityId: id } } });
    },
    restore(game) {
      set({ game, input: { aim: { x: 0, y: 0 }, moveX: 0, jump: false, firing: false } });
    },
    chooseReward(rewardId) {
      const game = get().game;
      const reward = game.rewardChoices?.find((entry) => entry.id === rewardId);
      if (game.scene !== SCENES.REWARD || !reward) {
        return;
      }

      set({ game: applyRunReward(game, reward) });
    },
    buyShopOffer(offerId) {
      set({ game: purchaseShopOffer(get().game, offerId) });
    },
    skipShop() {
      set({ game: skipShop(get().game) });
    },
    setAim(aim) {
      set({ input: { ...get().input, aim } });
    },
    setMovement(moveX = 0) {
      set({ input: { ...get().input, moveX } });
    },
    setJump(jump = false) {
      set({ input: { ...get().input, jump } });
    },
    projectileHitEnemy(payload) {
      const next = projectileHitEnemy(get().game, payload);
      set({ game: stateAfterBattle(next) });
    },
    turnEnded() {
      set({ game: turnEnded(get().game) });
    },
    tickBattle(delta = 16) {
      const game = get().game;
      if (game.scene !== SCENES.BATTLE || !game.battle) {
        return;
      }

      let next = {
        ...game,
        battle: updateBattle(game.battle, { moveX: get().input.moveX, jump: get().input.jump }, delta)
      };

      if (game.battle.phase !== BATTLE_PHASES.PLAYER_TURN && next.battle.phase === BATTLE_PHASES.PLAYER_TURN) {
        next = setUiMessage(next, "Celuj, ruszaj się i odpal jedną akcję.");
      }

      set({ game: stateAfterBattle(next) });
    },
    toggleMute() {
      set({ game: toggleMuteState(get().game) });
    },
    reset() {
      set({ game: setUiMessage(resetRun(get().game), "Nowa wyprawa gotowa."), input: { aim: { x: 0, y: 0 }, moveX: 0, jump: false, firing: false } });
    }
  });
}

export function createEngineStore(seed = 1) {
  return createStore(createEngineStateInitializer(seed));
}

export const useGameStore = create(createEngineStateInitializer(1));

export {createBrandStore} from './brandStore.js';
