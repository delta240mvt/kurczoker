const SHELL_SCENES = ["map", "battle", "reward", "shop", "game-over", "run-complete"];
const STATUS_VARIANTS = ["dead", "victory"];
const ICON_PATH = "/uix/svg/";
const HINT_ICON = {
  ability: "icon-ability-bomb.svg",
  audio: "icon-audio-note.svg",
  coin: "icon-grain-coin.svg",
  heart: "icon-hp-heart.svg",
  jump: "icon-jump.svg",
  node: "icon-node.svg",
  scene: "icon-scene-book.svg",
  shield: "icon-shield.svg"
};

function one(root, selector) {
  return root?.querySelector?.(selector) ?? null;
}

function setText(root, selector, value) {
  const target = one(root, selector);
  const next = String(value ?? "");
  if (target && target.textContent !== next) {
    target.textContent = next;
  }
}

function setAttr(element, name, value) {
  if (!element) return;
  const next = String(value);
  if (element.getAttribute?.(name) !== next) {
    element.setAttribute(name, next);
  }
}

function setDisabled(element, disabled) {
  if (element && element.disabled !== Boolean(disabled)) {
    element.disabled = Boolean(disabled);
  }
}

function setSceneClass(shell, scene) {
  if (!shell?.classList) return;
  for (const shellScene of SHELL_SCENES) {
    shell.classList.remove(`shell--${shellScene}`);
  }
  shell.classList.add(`shell--${scene}`);
}

function setStatusVariant(statusbar, variant) {
  if (!statusbar?.classList) return;
  for (const statusVariant of STATUS_VARIANTS) {
    statusbar.classList.remove(`shell__statusbar--${statusVariant}`);
  }
  if (variant) {
    statusbar.classList.add(`shell__statusbar--${variant}`);
  }
}

function hintHtml(hint) {
  const icon = HINT_ICON[hint.icon] ?? hint.icon;
  return `<article class="hint-card">
    <span class="hint-card__icon hint-card__icon--${hint.tone ?? "gold"}">
      <img src="${ICON_PATH}${icon}" alt="" width="32" height="32" />
    </span>
    <h2 class="hint-card__title">${escapeHtml(hint.title ?? "")}</h2>
    <p class="hint-card__desc">${escapeHtml(hint.desc ?? "")}</p>
  </article>`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => {
    if (char === "&") return "&amp;";
    if (char === "<") return "&lt;";
    if (char === ">") return "&gt;";
    if (char === '"') return "&quot;";
    return "&#39;";
  });
}

function setHints(root, hints = []) {
  const target = one(root, "[data-game-hints]");
  if (!target) return;
  const next = hints.map(hintHtml).join("");
  if (target.innerHTML !== next) {
    target.innerHTML = next;
  }
  target.hidden = hints.length === 0;
  target.classList?.remove("hint-cards--3", "hint-cards--4");
  target.classList?.add(`hint-cards--${Math.max(3, Math.min(4, hints.length || 3))}`);
}

export function syncShellUiModel(root, model) {
  if (!root || !model) return;

  const topHud = Object.fromEntries((model.topHud ?? []).map((item) => [item.key, item]));
  const status = Object.fromEntries((model.status ?? []).map((item) => [item.key, item]));

  setText(root, "[data-game-health]", topHud.health?.value);
  setText(root, "[data-game-node]", topHud.node?.value);
  setText(root, "[data-game-scene]", topHud.scene?.value ?? model.sceneLabel);
  setText(root, "[data-game-ability]", topHud.ability?.value ?? topHud.gold?.value);
  setText(root, "[data-game-ability-label]", topHud.ability?.label ?? topHud.gold?.label ?? "Zdolność");
  setText(root, "[data-game-status-health]", status.health?.value);
  setText(root, "[data-game-status-node]", status.node?.value);
  setText(root, "[data-game-status-action]", status.action?.value ?? status.gold?.value);
  setText(root, "[data-game-status-action-label]", status.action?.label ?? status.gold?.label ?? "Akcja");
  setText(root, "[data-game-status-audio]", status.audio?.value);
  setText(root, "[data-game-message]", model.ribbon?.text);

  const backdrop = one(root, "[data-game-backdrop]");
  setAttr(backdrop, "data-backdrop", model.canvasBackdrop);

  const action = one(root, "[data-game-start]");
  const actionDisabled = model.scene === "battle" || model.actionDisabled;
  setDisabled(action, actionDisabled);
  setAttr(action, "aria-disabled", actionDisabled ? "true" : "false");

  const muted = status.audio?.value === "cisza";
  setAttr(one(root, "[data-game-mute]"), "aria-pressed", muted ? "true" : "false");

  const ribbon = one(root, "[data-game-ribbon]");
  if (ribbon?.classList) {
    ribbon.classList.remove("shell__ribbon--danger", "shell__ribbon--victory");
    if (model.ribbon?.variant) {
      ribbon.classList.add(`shell__ribbon--${model.ribbon.variant}`);
    }
  }

  setSceneClass(one(root, "[data-game-shell]"), model.scene);
  setStatusVariant(one(root, "[data-game-statusbar]"), model.statusVariant);
  setHints(root, model.hints);
}

export function bindShellControls(root, store) {
  const restart = one(root, "[data-game-restart]");
  const mute = one(root, "[data-game-mute]");
  const action = one(root, "[data-game-start]");

  const onRestart = (event) => {
    event.preventDefault();
    store.getState().reset();
  };
  const onMute = (event) => {
    event.preventDefault();
    store.getState().toggleMute();
  };
  const onAction = (event) => {
    event.preventDefault();
    const state = store.getState();
    const firstRoute = state.game?.run?.offeredNodeIds?.[0];
    if (state.game?.scene === "map" && firstRoute) {
      state.selectNode(firstRoute);
    }
  };

  restart?.addEventListener("click", onRestart);
  mute?.addEventListener("click", onMute);
  action?.addEventListener("click", onAction);

  return () => {
    restart?.removeEventListener("click", onRestart);
    mute?.removeEventListener("click", onMute);
    action?.removeEventListener("click", onAction);
  };
}
