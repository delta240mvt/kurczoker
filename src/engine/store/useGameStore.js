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
import { resetRun, setUiMessage } from "../../game/state.js";
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
    encounterId: battle.encounterId,
    type: battle.type,
    actors: [
      createPlayer({ health: game.run.health, maxHealth: game.run.maxHealth }),
      createEnemy(enemyType, {
        id: boss ? "boss-jajokrol" : `${enemyType}-1`,
        health: boss ? 7 : elite ? 4 : 2,
        maxHealth: boss ? 7 : elite ? 4 : 2,
        damage: elite ? 2 : 1
      })
    ],
    artifacts: game.run.artifacts,
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
    input: { aim: { x: 0, y: 0 }, firing: false },
    selectNode(nodeId) {
      set({ game: hydrateEngineBattle(selectMapNode(get().game, nodeId)) });
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

      const next = {
        ...game,
        battle: updateBattle(game.battle, {}, delta)
      };

      set({ game: stateAfterBattle(next) });
    },
    reset() {
      set({ game: setUiMessage(resetRun(get().game), "Nowa wyprawa gotowa.") });
    }
  });
}

export function createEngineStore(seed = 1) {
  return createStore(createEngineStateInitializer(seed));
}

export const useGameStore = create(createEngineStateInitializer(1));
