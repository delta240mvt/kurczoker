import { ABILITY_IDS, ARTIFACT_IDS, BATTLE_PHASES, CANVAS, NODE_TYPES, SCENES, TUNING } from "./constants.js";
import { createEnemy, createPlayer } from "./actors.js";
import { getAbilityById } from "./abilities.js";
import { createAudioController, playEffect, setMuted } from "./audio.js";
import { createBattleState, updateBattle } from "./battle.js";
import { getNodeById } from "./map.js";
import { resetRun, setUiMessage, toggleMute } from "./state.js";
import {
  applyRunReward,
  completeCurrentNode,
  markRunDefeated,
  purchaseShopOffer,
  selectMapNode,
  skipShop,
  startRun
} from "./run.js";
import { createInputController } from "./input.js";
import { drawGame } from "./renderer.js";
import { createUiModel } from "./ui.js";

function query(root, selectors) {
  if (!root?.querySelector) return null;
  return selectors.map((selector) => root.querySelector(selector)).find(Boolean) ?? null;
}

function setText(element, text) {
  if (element) element.textContent = text;
}

function updateHud(elements, state, input) {
  const uiModel = createUiModel(state, input);
  const topHudByKey = Object.fromEntries(uiModel.topHud.map((item) => [item.key, item]));
  const statusByKey = Object.fromEntries(uiModel.status.map((item) => [item.key, item]));

  setText(elements.health, topHudByKey.health?.value ?? "0 / 0");
  setText(elements.node, topHudByKey.node?.value ?? "start");
  setText(elements.ability, topHudByKey.ability?.value ?? topHudByKey.gold?.value ?? ABILITY_IDS.EGG_BOMB);
  setText(elements.abilityLabel, topHudByKey.ability?.label ?? topHudByKey.gold?.label ?? "Zdolność");
  setText(elements.scene, uiModel.sceneLabel);
  setText(elements.message, uiModel.ribbon.text);
  setText(elements.statusHealth, statusByKey.health?.value ?? "");
  setText(elements.statusNode, statusByKey.node?.value ?? "");
  setText(elements.statusAction, statusByKey.action?.value ?? statusByKey.gold?.value ?? "");
  setText(elements.statusActionLabel, statusByKey.action?.label ?? statusByKey.gold?.label ?? "Akcja");
  setText(elements.statusAudio, statusByKey.audio?.value ?? "");
  if (elements.mute) {
    elements.mute.setAttribute("aria-pressed", String(!state.ui?.muted));
  }
  renderDynamicUi(elements, state, uiModel);
}

export function ownedAbilityId(state, selectedAbilityId) {
  const owned = state.run?.abilities?.length ? state.run.abilities : [ABILITY_IDS.EGG_BOMB];
  return owned.includes(selectedAbilityId) ? selectedAbilityId : owned[0] ?? ABILITY_IDS.EGG_BOMB;
}

function ensureCanvasSize(canvas) {
  if (!canvas.width) canvas.width = CANVAS.WIDTH;
  if (!canvas.height) canvas.height = CANVAS.HEIGHT;
}

function pointInRect(point, rect) {
  return point.x >= rect.x && point.x <= rect.x + rect.width && point.y >= rect.y && point.y <= rect.y + rect.height;
}

function mapNodeHitboxes(state) {
  const nodes = state.map?.nodes ?? [];
  if (!nodes.length) return [];
  const columns = Math.max(1, Math.max(...nodes.map((node) => node.depth ?? 0)) + 1);
  const rowsByDepth = new Map();
  nodes.forEach((node) => {
    const depth = node.depth ?? 0;
    rowsByDepth.set(depth, [...(rowsByDepth.get(depth) ?? []), node]);
  });
  return nodes.map((node) => {
    const depth = node.depth ?? 0;
    const row = rowsByDepth.get(depth) ?? [node];
    const index = row.findIndex((entry) => entry.id === node.id);
    const x = 104 + depth * ((CANVAS.WIDTH - 208) / Math.max(1, columns - 1));
    const y = 142 + index * 92 + (3 - row.length) * 24;
    return { id: node.id, x: x - 34, y: y - 34, width: 68, height: 68 };
  });
}

export function rewardHitboxes(state) {
  const rewards = state.rewardChoices ?? [];
  const count = Math.max(1, rewards.length);
  const width = count > 3 ? 190 : 230;
  const gap = count > 3 ? 36 : 55;
  const totalWidth = count * width + (count - 1) * gap;
  const startX = (CANVAS.WIDTH - totalWidth) / 2;

  return rewards.map((reward, index) => ({
    id: reward.id,
    reward,
    x: startX + index * (width + gap),
    y: 145,
    width,
    height: 210
  }));
}

function shopHitboxes(state) {
  const offers = state.shopOffers ?? [];
  const count = Math.max(1, offers.length);
  const width = count > 3 ? 190 : 230;
  const gap = count > 3 ? 36 : 55;
  const totalWidth = count * width + (count - 1) * gap;
  const startX = (CANVAS.WIDTH - totalWidth) / 2;

  return offers.map((offer, index) => ({
    id: offer.id,
    offer,
    x: startX + index * (width + gap),
    y: 145,
    width,
    height: 210
  }));
}

export function createEncounter(node, run) {
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
    artifacts: run.artifacts,
    playerSpeed: TUNING.PLAYER_SPEED + (run.stats?.moveSpeedBonus ?? 0),
    eggBombDamageBonus: run.stats?.eggBombDamageBonus ?? 0,
    damageReduction: (run.artifacts ?? []).includes(ARTIFACT_IDS.SHELL_SHIELD) ? 0 : run.stats?.damageReduction ?? 0
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

function chooseNextMapNode(state, point) {
  if (point) {
    const offered = new Set(state.run.offeredNodeIds);
    const hit = mapNodeHitboxes(state).find((box) => offered.has(box.id) && pointInRect(point, box));
    if (hit) return hit.id;
  }
  return state.run.offeredNodeIds.length === 1 ? state.run.offeredNodeIds[0] : null;
}

function chooseReward(state, point) {
  if (point) {
    const hit = rewardHitboxes(state).find((box) => pointInRect(point, box));
    if (hit) return hit.reward;
  }
  return state.rewardChoices?.length === 1 ? state.rewardChoices[0] : null;
}

function chooseShopOffer(state, point) {
  if (point) {
    const hit = shopHitboxes(state).find((box) => pointInRect(point, box));
    if (hit) return hit.offer;
  }
  return null;
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
    abilityLabel: query(root, ["[data-game-ability-label]"]),
    scene: query(root, ["[data-game-scene]", "[data-kurczoker-scene]"]),
    message: query(root, ["[data-game-message]", "[data-kurczoker-message]"]),
    mute: query(root, ["[data-game-mute]", "[data-kurczoker-mute]"]),
    action: query(root, ["[data-game-start]"]),
    shell: query(root, ["[data-game-shell]"]),
    backdrop: query(root, ["[data-game-backdrop]"]),
    overlay: query(root, ["[data-game-overlay]"]),
    hints: query(root, ["[data-game-hints]"]),
    boss: query(root, ["[data-game-boss]"]),
    statusbar: query(root, ["[data-game-statusbar]"]),
    ribbon: query(root, ["[data-game-ribbon]"]),
    statusHealth: query(root, ["[data-game-status-health]"]),
    statusNode: query(root, ["[data-game-status-node]"]),
    statusAction: query(root, ["[data-game-status-action]"]),
    statusActionLabel: query(root, ["[data-game-status-action-label]"]),
    statusAudio: query(root, ["[data-game-status-audio]"])
  };

  let state = setUiMessage(startRun(1), "Gotowy do wyprawy.");
  let audio = createAudioController();
  let animationId = 0;
  let running = true;
  let lastTime = typeof performance !== "undefined" ? performance.now() : 0;

  function startFreshRun() {
    state = setUiMessage(resetRun(state), "Nowa wyprawa gotowa.");
    running = true;
    lastTime = typeof performance !== "undefined" ? performance.now() : 0;
  }

  function startOrAdvance(point = input?.snapshot?.aim) {
    if (state.scene === SCENES.MAP) {
      const nodeId = chooseNextMapNode(state, point);
      if (!nodeId) {
        state = setUiMessage(state, "Wybierz dostepny wezel na mapie.");
        return;
      }
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
      const reward = chooseReward(state, point);
      if (!reward) {
        state = setUiMessage(state, "Wybierz jedna nagrode.");
        return;
      }
      state = applyRunReward(state, reward);
      playEffect(audio, "treasure");
      return;
    }

    if (state.scene === SCENES.SHOP) {
      const offer = chooseShopOffer(state, point);
      if (!offer) {
        state = skipShop(state);
        return;
      }
      state = purchaseShopOffer(state, offer.id);
      if (state.scene === SCENES.MAP) playEffect(audio, "treasure");
      return;
    }

    if ([SCENES.GAME_OVER, SCENES.RUN_COMPLETE].includes(state.scene)) {
      restart();
    }
  }

  function restart() {
    input?.consumeAction?.();
    startFreshRun();
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

  const handleOverlayClick = (event) => {
      const target = event.target?.closest?.("[data-reward-id], [data-shop-id], [data-end-action]");
      if (!target) return;
      if (target.dataset?.rewardId) {
        if (state.scene !== SCENES.REWARD) return;
        const reward = state.rewardChoices?.find((entry) => entry.id === target.dataset.rewardId);
        if (!reward) {
          state = setUiMessage(state, "Ta nagroda nie jest dostepna.");
          updateHud(elements, state, input.snapshot);
          return;
        }
        state = applyRunReward(state, reward);
        playEffect(audio, "treasure");
      } else if (target.dataset?.shopId) {
        if (state.scene !== SCENES.SHOP) return;
        state = purchaseShopOffer(state, target.dataset.shopId);
        if (state.scene === SCENES.MAP) playEffect(audio, "treasure");
      } else if (target.dataset?.endAction) {
        if (![SCENES.GAME_OVER, SCENES.RUN_COMPLETE].includes(state.scene)) return;
        restart();
      }
      updateHud(elements, state, input.snapshot);
  };

  if (root.addEventListener) root.addEventListener("click", handleOverlayClick);

  function frame(now = 0) {
    const delta = Math.min(34, Math.max(0, now - lastTime || 16));
    lastTime = now;

    if (running) {
      input.snapshot.selectedAbilityId = ownedAbilityId(state, input.snapshot.selectedAbilityId);
      state = {
        ...state,
        ui: { ...state.ui, selectedAbilityId: input.snapshot.selectedAbilityId }
      };

      if (state.scene === SCENES.BATTLE) {
        const ability = getAbilityById(input.snapshot.selectedAbilityId) ?? getAbilityById(ABILITY_IDS.EGG_BOMB);
        const canAct = state.battle?.phase === BATTLE_PHASES.PLAYER_TURN;
        const actionPressed = canAct ? input.consumeAction() : false;
        const battleInput = {
          ...input.snapshot,
          ability,
          firePressed: actionPressed,
          aim: canvasPointToAim(canvas, input.snapshot.aim)
        };
        const previousPhase = state.battle?.phase;
        const battle = updateBattle(state.battle, battleInput, delta);
        state = {
          ...state,
          battle
        };
        if (actionPressed && previousPhase === BATTLE_PHASES.PLAYER_TURN) playEffect(audio, "shoot");
        state = stateAfterBattle(state, audio);
      } else if ([SCENES.MAP, SCENES.REWARD, SCENES.SHOP, SCENES.GAME_OVER, SCENES.RUN_COMPLETE].includes(state.scene)) {
        if (input.consumeAction()) startOrAdvance(input.snapshot.aim);
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
      root.removeEventListener?.("click", handleOverlayClick);
      if (animationId && typeof cancelAnimationFrame === "function") cancelAnimationFrame(animationId);
    }
  };
}

function renderDynamicUi(elements, state, uiModel) {
  updateClassState(elements.shell, "shell", `shell--${uiModel.scene}`);
  updateBackdrop(elements.backdrop, uiModel.canvasBackdrop);
  updateClassState(elements.ribbon, "shell__ribbon", uiModel.ribbon.variant ? `shell__ribbon--${uiModel.ribbon.variant}` : "");
  updateClassState(
    elements.statusbar,
    "shell__statusbar",
    uiModel.statusVariant ? `shell__statusbar--${uiModel.statusVariant}` : ""
  );
  if (elements.action) {
    elements.action.disabled = uiModel.actionDisabled;
    elements.action.setAttribute?.("aria-disabled", String(uiModel.actionDisabled));
  }
  renderBoss(elements.boss, uiModel.boss);
  renderOverlay(elements.overlay, uiModel.overlay);
  renderHints(elements.hints, uiModel.hints);
}

function updateBackdrop(element, canvasBackdrop) {
  if (!element) return;
  element.setAttribute?.("data-backdrop", canvasBackdrop);
  if (element.style) element.style.backgroundImage = `url('/uix/canvas/${canvasBackdrop}-canvas.webp')`;
}

function updateClassState(element, baseClass, modifierClass) {
  if (!element || element.className === undefined) return;
  element.className = modifierClass ? `${baseClass} ${modifierClass}` : baseClass;
}

function renderBoss(element, boss) {
  if (!element) return;
  if (!boss) {
    element.innerHTML = "";
    element.hidden = true;
    return;
  }
  element.hidden = false;
  element.innerHTML = `
    <div class="boss-bar" role="progressbar" aria-label="HP bossa" aria-valuenow="${boss.percent}" aria-valuemin="0" aria-valuemax="100">
      <div class="boss-bar__header">
        <span class="boss-bar__name">${escapeHtml(boss.name)}</span>
        <span class="boss-bar__value">${boss.health} / ${boss.maxHealth}</span>
      </div>
      <div class="boss-bar__track"><div class="boss-bar__fill" style="--boss-hp-pct: ${boss.percent}%"></div></div>
    </div>
  `;
}

function renderOverlay(element, overlay) {
  if (!element) return;
  if (!overlay) {
    element.innerHTML = "";
    element.hidden = true;
    return;
  }
  element.hidden = false;
  if (overlay.type === "reward") {
    element.innerHTML = `
      <div class="reward-row" role="group" aria-label="Dostępne nagrody">
        ${overlay.cards.map((card, index) => rewardCardHtml(card, index)).join("")}
      </div>
      ${overlay.cta ? `<div class="reward-cta"><button class="btn btn--action" type="button" data-reward-id="${escapeHtml(overlay.cards[0]?.id ?? "")}">${escapeHtml(overlay.cta)}</button></div>` : ""}
    `;
    return;
  }
  if (overlay.type === "shop") {
    element.innerHTML = `
      <div class="shop-row" role="group" aria-label="Oferta sklepu">
        ${overlay.cards.map(shopCardHtml).join("")}
      </div>
    `;
    return;
  }
  if (overlay.type === "end") {
    element.innerHTML = `
      <section class="end-modal end-modal--${escapeHtml(overlay.variant)}" role="dialog" aria-label="${escapeHtml(overlay.title)}">
        <p class="end-modal__eyebrow">${escapeHtml(overlay.eyebrow)}</p>
        <h2 class="end-modal__title">${escapeHtml(overlay.title)}</h2>
        <div class="end-modal__stats">
          ${overlay.stats.map((stat) => `<div class="end-modal__stat"><strong class="end-modal__stat-val">${escapeHtml(stat.value)}</strong><span class="end-modal__stat-key">${escapeHtml(stat.label)}</span></div>`).join("")}
        </div>
        <div class="end-modal__cta">
          <button class="btn btn--action" type="button" data-end-action="restart">Nowa Wyprawa</button>
          <button class="btn btn--restart" type="button" data-end-action="menu">Menu Główne</button>
        </div>
      </section>
    `;
  }
}

function renderHints(element, hints) {
  if (!element) return;
  element.hidden = hints.length === 0;
  element.className = `hint-cards hint-cards--${Math.max(3, hints.length)}`;
  element.innerHTML = hints.map((hint) => `
    <article class="hint-card">
      <span class="hint-card__icon hint-card__icon--${escapeHtml(hint.tone)}">
        <img src="/uix/svg/${escapeHtml(hint.icon)}" alt="" width="26" height="26" />
      </span>
      <div class="hint-card__body">
        <h3 class="hint-card__title">${escapeHtml(hint.title)}</h3>
        <p class="hint-card__desc">${escapeHtml(hint.desc)}</p>
      </div>
    </article>
  `).join("");
}

function rewardCardHtml(card, index) {
  const selected = index === 0 ? " reward-card--selected" : "";
  return `
    <button class="reward-card${selected}" type="button" data-reward-id="${escapeHtml(card.id)}">
      <span class="reward-card__icon">${rewardIcon(card.icon)}</span>
      <span class="reward-card__name">${escapeHtml(card.name)}</span>
      <span class="reward-card__type">${escapeHtml(card.typeLabel)}</span>
      <span class="reward-card__desc">${escapeHtml(card.desc)}</span>
      <span class="reward-card__value">${escapeHtml(card.valueLabel)}</span>
    </button>
  `;
}

function shopCardHtml(card) {
  const disabled = card.affordable ? "" : " disabled aria-disabled=\"true\"";
  return `
    <article class="shop-card ${card.affordable ? "" : "shop-card--disabled"}">
      <div class="shop-card__icon">${rewardIcon(card.icon)}</div>
      <h3 class="shop-card__name">${escapeHtml(card.name)}</h3>
      <p class="shop-card__desc">${escapeHtml(card.desc)}</p>
      <span class="shop-card__price">${card.price} ziaren</span>
      <button class="shop-card__buy" type="button" data-shop-id="${escapeHtml(card.id)}"${disabled}>Kup</button>
    </article>
  `;
}

function rewardIcon(icon) {
  if (icon === "heart") return `<img src="/uix/svg/icon-hp-heart.svg" alt="" width="32" height="32" />`;
  if (icon === "coin") return `<img src="/uix/svg/icon-grain-coin.svg" alt="" width="32" height="32" />`;
  if (icon === "shield") return `<img src="/uix/svg/icon-shield.svg" alt="" width="32" height="32" />`;
  if (icon === "jump") return `<img src="/uix/svg/icon-jump.svg" alt="" width="32" height="32" />`;
  return `<img src="/uix/svg/icon-ability-bomb.svg" alt="" width="32" height="32" />`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

if (typeof window !== "undefined") {
  window.addEventListener("DOMContentLoaded", () => {
    const roots = document.querySelectorAll("[data-kurczoker-game]");
    if (roots.length) roots.forEach((root) => mountKurczokerGame(root));
    else if (document.querySelector("[data-game-canvas], [data-kurczoker-canvas]")) mountKurczokerGame(document);
  });
}
