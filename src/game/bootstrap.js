import { CANVAS, SCENES } from "./constants.js";
import { resetRun, setUiMessage, toggleMute } from "./state.js";
import { startRun } from "./run.js";
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
  setText(elements.health, `HP ${run.health ?? 0}/${run.maxHealth ?? 0}`);
  setText(elements.node, `Wezel ${run.currentNodeId ?? "start"}`);
  setText(elements.ability, `Akcja ${input?.selectedAbilityId ?? ui.selectedAbilityId ?? "egg-bomb"}`);
  setText(elements.scene, formatScene(state.scene));
  setText(elements.message, ui.message ?? "");
  if (elements.mute) {
    elements.mute.textContent = ui.muted ? "Audio off" : "Audio on";
    elements.mute.setAttribute("aria-pressed", String(!ui.muted));
  }
}

function ensureCanvasSize(canvas) {
  if (!canvas.width) canvas.width = CANVAS.WIDTH;
  if (!canvas.height) canvas.height = CANVAS.HEIGHT;
}

function createFrameState(state, input, elapsed) {
  if (state.scene !== SCENES.BATTLE) return state;

  const battle = state.battle ?? {};
  const actors = battle.actors?.map((actor) => {
    if (actor.kind !== "player" && actor.id !== "player") return actor;
    const nextX = Math.max(32, Math.min(CANVAS.WIDTH - 80, (actor.x ?? 160) + input.moveX * 2.2));
    const jumpOffset = input.jump ? Math.sin(elapsed / 110) * 10 - 10 : 0;
    return { ...actor, x: nextX, y: Math.min(CANVAS.GROUND_Y - (actor.height ?? 56), (actor.y ?? 360) + jumpOffset) };
  });

  return {
    ...state,
    battle: {
      ...battle,
      actors,
      turnRemainingMs: Math.max(0, (battle.turnRemainingMs ?? 8000) - 16)
    },
    ui: {
      ...state.ui,
      selectedAbilityId: input.selectedAbilityId
    }
  };
}

function createSampleBattle() {
  return {
    encounterId: "sample",
    phase: "player-turn",
    turnRemainingMs: 8000,
    actors: [
      {
        id: "player",
        kind: "player",
        team: "player",
        x: 170,
        y: CANVAS.GROUND_Y - 58,
        vx: 0,
        vy: 0,
        width: 42,
        height: 58,
        health: 3,
        maxHealth: 3,
        ttl: 0
      },
      {
        id: "enemy-grunt",
        kind: "enemy",
        team: "enemy",
        x: 700,
        y: CANVAS.GROUND_Y - 48,
        vx: 0,
        vy: 0,
        width: 46,
        height: 48,
        health: 2,
        maxHealth: 2,
        ttl: 0
      }
    ],
    platforms: [
      { id: "ledge-left", x: 92, y: 330, width: 190, height: 20 },
      { id: "ledge-right", x: 620, y: 300, width: 180, height: 20 }
    ],
    hazards: [{ id: "spikes", type: "spikes", x: 435, y: CANVAS.GROUND_Y - 18, width: 112, height: 18, damage: 1 }],
    projectiles: []
  };
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
  let animationId = 0;
  let running = true;
  let lastTime = typeof performance !== "undefined" ? performance.now() : 0;

  function startBattleShell() {
    state = {
      ...state,
      scene: SCENES.BATTLE,
      battle: createSampleBattle(),
      ui: { ...state.ui, message: "Celuj mysza lub dotykiem. Spacja strzela." }
    };
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
    onStart: startBattleShell,
    onRestart: restart,
    onMute: () => {
      state = toggleMute(state);
      updateHud(elements, state, input.snapshot);
    }
  });

  function frame(now = 0) {
    const delta = Math.min(34, Math.max(0, now - lastTime || 16));
    lastTime = now;

    if (running) {
      state = createFrameState(state, input.snapshot, now);
      if (input.snapshot.firePressed && state.scene === SCENES.MAP) startBattleShell();
      if (state.battle?.turnRemainingMs === 0) {
        state = { ...state, scene: SCENES.REWARD, ui: { ...state.ui, message: "Walka testowa zakonczona." } };
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
    start: startBattleShell,
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
