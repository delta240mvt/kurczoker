import test from "node:test";
import assert from "node:assert/strict";

import { ABILITY_IDS, ARTIFACT_IDS, NODE_TYPES, SCENES, TUNING } from "../src/game/constants.js";
import { createEncounter, mountKurczokerGame, ownedAbilityId, rewardHitboxes } from "../src/game/bootstrap.js";

function createElement() {
  const listeners = new Map();
  return {
    attributes: new Map(),
    className: "",
    disabled: false,
    hidden: false,
    innerHTML: "",
    style: {},
    textContent: "",
    addEventListener(type, handler) {
      listeners.set(type, handler);
    },
    removeEventListener(type, handler) {
      if (listeners.get(type) === handler) listeners.delete(type);
    },
    setAttribute(name, value) {
      this.attributes.set(name, String(value));
    },
    getAttribute(name) {
      return this.attributes.get(name) ?? null;
    },
    trigger(type, event = {}) {
      listeners.get(type)?.(event);
    }
  };
}

function createMountRoot() {
  const noopContext = new Proxy(
    {},
    {
      get(target, prop) {
        if (!target[prop]) target[prop] = () => {};
        return target[prop];
      },
      set(target, prop, value) {
        target[prop] = value;
        return true;
      }
    }
  );
  const canvas = {
    ...createElement(),
    width: 960,
    height: 540,
    getContext: () => noopContext,
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 960, height: 540 })
  };
  const restartButton = createElement();
  const rootListeners = new Map();
  const shell = createElement();
  const backdrop = createElement();
  const overlay = createElement();
  const hints = createElement();
  const boss = createElement();
  const statusbar = createElement();
  const ribbon = createElement();
  const elements = new Map([
    ["[data-game-canvas]", canvas],
    ["canvas", canvas],
    ["[data-game-restart]", restartButton],
    ["[data-game-start]", createElement()],
    ["[data-game-health]", createElement()],
    ["[data-game-node]", createElement()],
    ["[data-game-ability]", createElement()],
    ["[data-game-ability-label]", createElement()],
    ["[data-game-scene]", createElement()],
    ["[data-game-message]", createElement()],
    ["[data-game-mute]", createElement()],
    ["[data-game-shell]", shell],
    ["[data-game-backdrop]", backdrop],
    ["[data-game-overlay]", overlay],
    ["[data-game-hints]", hints],
    ["[data-game-boss]", boss],
    ["[data-game-statusbar]", statusbar],
    ["[data-game-ribbon]", ribbon],
    ["[data-game-status-health]", createElement()],
    ["[data-game-status-node]", createElement()],
    ["[data-game-status-action]", createElement()],
    ["[data-game-status-action-label]", createElement()],
    ["[data-game-status-audio]", createElement()]
  ]);

  return {
    canvas,
    elements,
    restartButton,
    addEventListener(type, handler) {
      rootListeners.set(type, handler);
    },
    removeEventListener(type, handler) {
      if (rootListeners.get(type) === handler) rootListeners.delete(type);
    },
    trigger(type, event = {}) {
      rootListeners.get(type)?.(event);
    },
    querySelector(selector) {
      return elements.get(selector) ?? null;
    }
  };
}

function withAnimationFrames(fn) {
  const originalRequest = globalThis.requestAnimationFrame;
  const originalCancel = globalThis.cancelAnimationFrame;
  const callbacks = [];
  globalThis.requestAnimationFrame = (callback) => {
    callbacks.push(callback);
    return callbacks.length;
  };
  globalThis.cancelAnimationFrame = () => {};

  try {
    return fn(callbacks);
  } finally {
    if (originalRequest === undefined) delete globalThis.requestAnimationFrame;
    else globalThis.requestAnimationFrame = originalRequest;
    if (originalCancel === undefined) delete globalThis.cancelAnimationFrame;
    else globalThis.cancelAnimationFrame = originalCancel;
  }
}

test("ownedAbilityId falls back to unlocked abilities", () => {
  const state = {
    run: {
      abilities: [ABILITY_IDS.EGG_BOMB]
    }
  };

  assert.equal(ownedAbilityId(state, ABILITY_IDS.GUARD_CHICK), ABILITY_IDS.EGG_BOMB);
  assert.equal(ownedAbilityId(state, ABILITY_IDS.EGG_BOMB), ABILITY_IDS.EGG_BOMB);
  assert.equal(
    ownedAbilityId({ run: { abilities: [ABILITY_IDS.EGG_BOMB, ABILITY_IDS.GUARD_CHICK] } }, ABILITY_IDS.GUARD_CHICK),
    ABILITY_IDS.GUARD_CHICK
  );
});

test("createEncounter applies artifact stats to battle config", () => {
  const node = {
    id: "battle-1",
    type: NODE_TYPES.BATTLE,
    payload: { encounterId: "grunt" }
  };
  const run = {
    health: 3,
    maxHealth: 3,
    artifacts: [ARTIFACT_IDS.WIND_BOOTS, ARTIFACT_IDS.CHAOS_EGG, ARTIFACT_IDS.SHELL_SHIELD],
    stats: {
      moveSpeedBonus: 0.06,
      eggBombDamageBonus: 1,
      damageReduction: 1
    }
  };

  const battle = createEncounter(node, run);

  assert.equal(battle.playerSpeed, TUNING.PLAYER_SPEED + 0.06);
  assert.equal(battle.eggBombDamageBonus, 1);
  assert.equal(battle.damageReduction, 0);
  assert.deepEqual(battle.artifacts, run.artifacts);
});

test("createEncounter applies standalone damage reduction without making shell shield permanent", () => {
  const node = {
    id: "battle-1",
    type: NODE_TYPES.BATTLE,
    payload: { encounterId: "grunt" }
  };

  const reduced = createEncounter(node, {
    health: 3,
    maxHealth: 3,
    artifacts: [],
    stats: { damageReduction: 1 }
  });

  assert.equal(reduced.damageReduction, 1);
});

test("rewardHitboxes exposes every bonus reward choice", () => {
  const rewardChoices = [
    { id: "one" },
    { id: "two" },
    { id: "three" },
    { id: "four" }
  ];

  const boxes = rewardHitboxes({ rewardChoices });

  assert.equal(boxes.length, 4);
  assert.equal(boxes[3].id, "four");
  assert.equal(boxes[3].width, 190);
});

test("queued action restarts and clears from game over scene", () => {
  withAnimationFrames((callbacks) => {
    const game = mountKurczokerGame(createMountRoot());
    game.state.scene = SCENES.GAME_OVER;
    game.input.actionQueued = true;

    callbacks.shift()(16);

    assert.equal(game.state.scene, SCENES.MAP);
    assert.equal(game.input.actionQueued, false);
    game.destroy();
  });
});

test("restart button clears stale queued action before the next map frame", () => {
  withAnimationFrames((callbacks) => {
    const root = createMountRoot();
    const game = mountKurczokerGame(root);
    game.state.scene = SCENES.RUN_COMPLETE;
    game.input.actionQueued = true;

    root.restartButton.trigger("click");
    callbacks.shift()(16);

    assert.equal(game.state.scene, SCENES.MAP);
    assert.equal(game.input.actionQueued, false);
    assert.equal(game.state.run.currentNodeId, "start");
    game.destroy();
  });
});

test("mount renders UIX shell state into optional DOM targets", () => {
  withAnimationFrames(() => {
    const root = createMountRoot();
    const game = mountKurczokerGame(root);

    assert.equal(root.elements.get("[data-game-shell]").className, "shell shell--map");
    assert.equal(root.elements.get("[data-game-backdrop]").getAttribute("data-backdrop"), "02");
    assert.match(root.elements.get("[data-game-hints]").innerHTML, /Trasa/);
    assert.equal(root.elements.get("[data-game-status-action-label]").textContent, "Akcja");

    game.destroy();
  });
});
