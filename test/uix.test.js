import test from "node:test";
import assert from "node:assert/strict";

import { BATTLE_PHASES, NODE_TYPES, SCENES } from "../src/game/constants.js";
import { createUiModel } from "../src/game/ui.js";

test("createUiModel exposes the UIX map shell model with Polish HUD and hints", () => {
  const model = createUiModel({
    scene: SCENES.MAP,
    run: {
      health: 3,
      maxHealth: 3,
      currentNodeId: "start",
      gold: 0,
      abilities: ["egg-bomb"]
    },
    ui: { muted: true, selectedAbilityId: "egg-bomb", message: "Wybierz pierwszy szlak." }
  });

  assert.equal(model.sceneLabel, "Mapa");
  assert.equal(model.canvasBackdrop, "02");
  assert.equal(model.ribbon.text, "Wybierz pierwszy szlak.");
  assert.equal(model.topHud[1].label, "Węzeł");
  assert.equal(model.status[2].label, "Akcja");
  assert.equal(model.hints.length, 3);
  assert.equal(model.hints[0].title, "Trasa");
});

test("createUiModel switches battle UI for player, enemy, and boss phases", () => {
  const playerTurn = createUiModel({
    scene: SCENES.BATTLE,
    run: { health: 2, maxHealth: 3, currentNodeId: "battle-1", gold: 4, abilities: ["egg-bomb"] },
    battle: { type: NODE_TYPES.BATTLE, phase: BATTLE_PHASES.PLAYER_TURN, actors: [] },
    ui: { muted: false, selectedAbilityId: "egg-bomb" }
  });

  assert.equal(playerTurn.canvasBackdrop, "03");
  assert.equal(playerTurn.actionDisabled, false);
  assert.equal(playerTurn.hints.length, 3);
  assert.equal(playerTurn.hints[1].title, "Skok");

  const enemyTurn = createUiModel({
    scene: SCENES.BATTLE,
    run: { health: 2, maxHealth: 3, currentNodeId: "battle-1", gold: 4, abilities: ["egg-bomb"] },
    battle: { type: NODE_TYPES.BATTLE, phase: BATTLE_PHASES.ENEMY_TURN, actors: [] },
    ui: { muted: false, selectedAbilityId: "egg-bomb" }
  });

  assert.equal(enemyTurn.canvasBackdrop, "04");
  assert.equal(enemyTurn.actionDisabled, true);
  assert.equal(enemyTurn.hints.length, 4);

  const boss = createUiModel({
    scene: SCENES.BATTLE,
    run: { health: 2, maxHealth: 3, currentNodeId: "boss", gold: 9, abilities: ["egg-bomb"] },
    battle: {
      type: NODE_TYPES.BOSS,
      phase: BATTLE_PHASES.PLAYER_TURN,
      actors: [{ id: "boss-jajokrol", health: 5, maxHealth: 7 }]
    },
    ui: { muted: false, selectedAbilityId: "egg-bomb" }
  });

  assert.equal(boss.sceneLabel, "Boss");
  assert.equal(boss.canvasBackdrop, "08");
  assert.equal(boss.ribbon.variant, "danger");
  assert.deepEqual(boss.boss, { name: "KURCZOKER BOSS", health: 5, maxHealth: 7, percent: 71 });
});

test("createUiModel returns reward, shop, game-over, and victory overlays", () => {
  const rewards = [{ id: "heal-small", type: "heal", label: "Kurze Uzdrowienie", value: 1 }];
  const reward = createUiModel({
    scene: SCENES.REWARD,
    rewardMode: "treasure",
    rewardChoices: rewards,
    run: { health: 2, maxHealth: 3, currentNodeId: "treasure-1", gold: 5, abilities: ["egg-bomb"] },
    ui: { muted: true, selectedAbilityId: "egg-bomb" }
  });

  assert.equal(reward.canvasBackdrop, "07");
  assert.equal(reward.overlay.type, "reward");
  assert.equal(reward.overlay.cta, "Weź nagrodę");
  assert.equal(reward.overlay.cards[0].valueLabel, "+1 HP");

  const shop = createUiModel({
    scene: SCENES.SHOP,
    shopOffers: [{ id: "egg-bomb", type: "ability", label: "Egg Bomb", value: 1, price: 6 }],
    run: { health: 3, maxHealth: 3, currentNodeId: "shop-1", gold: 4, abilities: ["egg-bomb"] },
    ui: { muted: true, selectedAbilityId: "egg-bomb" }
  });

  assert.equal(shop.canvasBackdrop, "06");
  assert.equal(shop.overlay.type, "shop");
  assert.equal(shop.overlay.cards[0].affordable, false);
  assert.equal(shop.topHud[3].label, "Ziarna");

  const gameOver = createUiModel({
    scene: SCENES.GAME_OVER,
    run: { health: 0, maxHealth: 3, currentNodeId: "battle-3", gold: 11, completedNodeIds: ["battle-1"], abilities: ["egg-bomb"] },
    ui: { muted: true }
  });

  assert.equal(gameOver.canvasBackdrop, "09");
  assert.equal(gameOver.overlay.type, "end");
  assert.equal(gameOver.overlay.title, "KONIEC WYPRAWY");
  assert.equal(gameOver.ribbon.variant, "danger");

  const victory = createUiModel({
    scene: SCENES.RUN_COMPLETE,
    run: {
      health: 2,
      maxHealth: 3,
      currentNodeId: "boss",
      gold: 19,
      completedNodeIds: ["battle-1", "boss"],
      artifacts: ["shell-shield"],
      abilities: ["egg-bomb"]
    },
    ui: { muted: false }
  });

  assert.equal(victory.canvasBackdrop, "10");
  assert.equal(victory.overlay.title, "WYPRAWA UKOŃCZONA");
  assert.equal(victory.ribbon.variant, "victory");
  assert.equal(victory.hints.length, 0);
});
