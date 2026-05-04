import { ABILITY_IDS, BATTLE_PHASES, CANVAS, NODE_TYPES, SCENES } from "./constants.js";
import { createEnemy, createPlayer } from "./actors.js";
import { getAbilityById } from "./abilities.js";
import { createAudioController, playEffect, setMuted } from "./audio.js";
import { createBattleState, resolveEnemyTurn, updateBattle } from "./battle.js";
import { getNodeById } from "./map.js";
import { resetRun, setUiMessage, toggleMute } from "./state.js";
import { applyRunReward, completeCurrentNode, markRunDefeated, selectMapNode, startRun } from "./run.js";
import { createInputController } from "./input.js";
import { drawGame } from "./renderer.js";

function query(root, selectors) {
  if (!root?.querySelector) return null;
  return selectors.map((selector) => root.querySelector(selector)).find(Boolean) ?? null;
}

function formatScene(scene) {
  if (scene === SCENES.BATTLE) return "Walka";
  if (scene === SCENES.REWARD) return "Nagroda";
  if (scene === SCENES.GAME_OVER) return "Game Over";
  if (scene === SCENES.RUN_COMPLETE) return "Zwyciestwo";
  return "Mapa";
}

function setText(element, text) {
  if (element) element.textContent = text;
}

function updateHud(elements, state, input) {
  const run = state.run ?? {};
  const ui = state.ui ?? {};
  setText(elements.health, `${run.health ?? 0} / ${run.maxHealth ?? 0}`);
  setText(elements.node, run.currentNodeId ?? "start");
  setText(elements.ability, input?.selectedAbilityId ?? ui.selectedAbilityId ?? "egg-bomb");
  setText(elements.scene, formatScene(state.scene));
  setText(elements.message, ui.message ?? "");
  if (elements.mute) {
    elements.mute.textContent = ui.muted ? "♪" : "♫";
    elements.mute.setAttribute("aria-pressed", String(!ui.muted));
  }
}

function ensureCanvasSize(canvas) {
  if (!canvas.width) canvas.width = CANVAS.WIDTH;
  if (!canvas.height) canvas.height = CANVAS.HEIGHT;
}

function createEncounter(node, run) {
  const boss = node.type === NODE_TYPES.BOSS;
  const elite = node.type === NODE_TYPES.ELITE;
  const enemyType = boss ? "boss" : elite ? "elite" : "grunt";
  const enemies = boss
    ? [createEnemy("boss", { id: "boss-jajokrol", x: 690, health: 7, maxHealth: 7, damage: 1 })]
    : [
        createEnemy(enemyType, {
          id: `${enemyType}-1`,
          x: elite ? 690 : 710,
          health: elite ? 4 : 2,
          maxHealth: elite ? 4 : 2,
          damage: elite ? 2 : 1
        }),
        ...(elite ? [createEnemy("grunt", { id: "grunt-helper", x: 790, health: 2, maxHealth: 2 })] : [])
      ];

  return createBattleState({
    encounterId: node.payload.encounterId,
    type: node.type,
    actors: [
      createPlayer({ health: run.health, maxHealth: run.maxHealth, y: CANVAS.GROUND_Y - 54 }),
      ...enemies
    ],
    platforms: [
      { id: "ledge-left", x: 92, y: 330, width: 190, height: 20 },
      { id: "ledge-right", x: 620, y: 300, width: 180, height: 20 }
    ],
    hazards: [{ id: "spikes", type: "spikes", x: 435, y: CANVAS.GROUND_Y - 18, width: 112, height: 18, damage: 1 }],
    artifacts: run.artifacts
  });
}

function canvasPointToAim(canvas, point) {
  const rect = canvas.getBoundingClientRect?.();
  const playerOrigin = { x: 190, y: CANVAS.GROUND_Y - 40 };
  if (!point.x && !point.y) return { x: 1, y: -0.28 };
  if (!rect) return { x: 1, y: -0.35 };
  return {
    x: point.x - playerOrigin.x,
    y: point.y - playerOrigin.y
  };
}

function chooseNextMapNode(state) {
  return state.run.offeredNodeIds[0] ?? null;
}

function chooseReward(state) {
  return state.rewardChoices?.[0] ?? null;
}

function stateAfterBattle(state, audio) {
  if (state.battle?.phase === BATTLE_PHASES.WON) {
    playEffect(audio, state.battle.type === NODE_TYPES.BOSS ? "victory" : "treasure");
    return completeCurrentNode(state);
  }
  if (state.battle?.phase === BATTLE_PHASES.LOST) {
    playEffect(audio, "defeat");
    return markRunDefeated(state);
  }
  return state;
}

export function mountKurczokerGame(root = globalThis.document) {
  if (!root) return null;

  const canvas = query(root, ["[data-game-canvas]", "[data-kurczoker-canvas]", "canvas"]);
  if (!canvas?.getContext) return null;

  ensureCanvasSize(canvas);
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const elements = {
    health: query(root, ["[data-game-health]", "[data-kurczoker-health]"]),
    node: query(root, ["[data-game-node]", "[data-kurczoker-node]"]),
    ability: query(root, ["[data-game-ability]", "[data-kurczoker-ability]"]),
    scene: query(root, ["[data-game-scene]", "[data-kurczoker-scene]"]),
    message: query(root, ["[data-game-message]", "[data-kurczoker-message]"]),
    mute: query(root, ["[data-game-mute]", "[data-kurczoker-mute]"])
  };

  let state = setUiMessage(startRun(1), "Gotowy do wyprawy.");
  let audio = createAudioController();
  let animationId = 0;
  let running = true;
  let lastTime = typeof performance !== "undefined" ? performance.now() : 0;

  function startOrAdvance() {
    if (state.scene === SCENES.MAP) {
      const nodeId = chooseNextMapNode(state);
      if (!nodeId) return;
      const node = getNodeById(state.map, nodeId);
      state = selectMapNode(state, nodeId);
      if (state.scene === SCENES.BATTLE) {
        state = {
          ...state,
          battle: createEncounter(node, state.run),
          ui: { ...state.ui, message: "Celuj, ruszaj sie i odpal jedna akcje." }
        };
      }
      return;
    }

    if (state.scene === SCENES.REWARD) {
      const reward = chooseReward(state);
      state = applyRunReward(state, reward);
      playEffect(audio, "treasure");
      return;
    }

    if ([SCENES.GAME_OVER, SCENES.RUN_COMPLETE].includes(state.scene)) {
      restart();
    }
  }

  function restart() {
    state = setUiMessage(resetRun(state), "Nowa wyprawa gotowa.");
    running = true;
    lastTime = typeof performance !== "undefined" ? performance.now() : 0;
  }

  const input = createInputController({
    root,
    canvas,
    selectedAbilityId: state.ui.selectedAbilityId,
    onStart: startOrAdvance,
    onRestart: restart,
    onMute: () => {
      state = toggleMute(state);
      audio = setMuted(audio, state.ui.muted);
      updateHud(elements, state, input.snapshot);
    }
  });

  function frame(now = 0) {
    const delta = Math.min(34, Math.max(0, now - lastTime || 16));
    lastTime = now;

    if (running) {
      if (state.scene === SCENES.BATTLE) {
        const ability = getAbilityById(input.snapshot.selectedAbilityId) ?? getAbilityById(ABILITY_IDS.EGG_BOMB);
        const battleInput = {
          ...input.snapshot,
          ability,
          aim: canvasPointToAim(canvas, input.snapshot.aim)
        };
        const previousPhase = state.battle?.phase;
        let battle = updateBattle(state.battle, battleInput, delta);
        if (battle.phase === BATTLE_PHASES.ENEMY_TURN) battle = resolveEnemyTurn(battle);
        state = {
          ...state,
          battle,
          ui: { ...state.ui, selectedAbilityId: input.snapshot.selectedAbilityId }
        };
        if (input.snapshot.firePressed && previousPhase === BATTLE_PHASES.PLAYER_TURN) playEffect(audio, "shoot");
        state = stateAfterBattle(state, audio);
      }
    }

    drawGame(ctx, canvas, state);
    updateHud(elements, state, input.snapshot);

    const requestFrame = typeof requestAnimationFrame === "function" ? requestAnimationFrame : null;
    if (requestFrame) animationId = requestFrame(frame);
    return delta;
  }

  frame(lastTime);

  return {
    get state() {
      return state;
    },
    get input() {
      return input.snapshot;
    },
    start: startOrAdvance,
    restart,
    destroy() {
      running = false;
      input.destroy();
      if (animationId && typeof cancelAnimationFrame === "function") cancelAnimationFrame(animationId);
    }
  };
}

if (typeof window !== "undefined") {
  window.addEventListener("DOMContentLoaded", () => {
    const roots = document.querySelectorAll("[data-kurczoker-game]");
    if (roots.length) roots.forEach((root) => mountKurczokerGame(root));
    else if (document.querySelector("[data-game-canvas], [data-kurczoker-canvas]")) mountKurczokerGame(document);
  });
}
