import { ABILITY_IDS } from "./constants.js";

const MOVEMENT_KEYS = new Map([
  ["ArrowLeft", "left"],
  ["KeyA", "left"],
  ["ArrowRight", "right"],
  ["KeyD", "right"]
]);

const ABILITY_KEYS = new Map([
  ["Digit1", ABILITY_IDS.EGG_BOMB],
  ["Digit2", ABILITY_IDS.CREST_JUMP],
  ["Digit3", ABILITY_IDS.GUARD_CHICK],
  ["Digit4", ABILITY_IDS.MANA_GRAIN]
]);

function noop() {}

function getDocumentTarget() {
  if (typeof window !== "undefined") return window;
  return null;
}

function getButton(root, selectors) {
  if (!root?.querySelector) return null;
  return selectors.map((selector) => root.querySelector(selector)).find(Boolean) ?? null;
}

function eventPoint(event) {
  const source = event.touches?.[0] ?? event.changedTouches?.[0] ?? event;
  return {
    clientX: source.clientX ?? 0,
    clientY: source.clientY ?? 0
  };
}

function updateMove(snapshot, pressed) {
  const left = pressed.has("left");
  const right = pressed.has("right");
  snapshot.moveX = left === right ? 0 : left ? -1 : 1;
}

export function createInputController(options = {}) {
  const target = options.target ?? getDocumentTarget();
  const canvas = options.canvas ?? null;
  const root = options.root ?? canvas?.parentElement ?? null;
  const onStart = options.onStart ?? noop;
  const onRestart = options.onRestart ?? onStart;
  const onMute = options.onMute ?? noop;
  const pressed = new Set();
  const cleanups = [];

  const snapshot = {
    moveX: 0,
    jump: false,
    aim: { x: 0, y: 0 },
    firePressed: false,
    actionQueued: false,
    selectedAbilityId: options.selectedAbilityId ?? ABILITY_IDS.EGG_BOMB
  };

  function queueAction() {
    snapshot.actionQueued = true;
  }

  function listen(element, type, handler, listenerOptions) {
    if (!element?.addEventListener) return;
    element.addEventListener(type, handler, listenerOptions);
    cleanups.push(() => element.removeEventListener(type, handler, listenerOptions));
  }

  function setAimFromEvent(event) {
    if (!canvas?.getBoundingClientRect) {
      const point = eventPoint(event);
      snapshot.aim = { x: point.clientX, y: point.clientY };
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const point = eventPoint(event);
    const scaleX = canvas.width / Math.max(1, rect.width);
    const scaleY = canvas.height / Math.max(1, rect.height);
    snapshot.aim = {
      x: (point.clientX - rect.left) * scaleX,
      y: (point.clientY - rect.top) * scaleY
    };
  }

  function handleKeyDown(event) {
    const movement = MOVEMENT_KEYS.get(event.code);
    if (movement) {
      event.preventDefault?.();
      pressed.add(movement);
      updateMove(snapshot, pressed);
    }

    if (event.code === "ArrowUp" || event.code === "KeyW") {
      event.preventDefault?.();
      snapshot.jump = true;
    }

    if (event.code === "Space" || event.code === "Enter") {
      event.preventDefault?.();
      snapshot.firePressed = true;
      if (!event.repeat) queueAction();
    }

    const abilityId = ABILITY_KEYS.get(event.code);
    if (abilityId) snapshot.selectedAbilityId = abilityId;
  }

  function handleKeyUp(event) {
    const movement = MOVEMENT_KEYS.get(event.code);
    if (movement) {
      event.preventDefault?.();
      pressed.delete(movement);
      updateMove(snapshot, pressed);
    }

    if (event.code === "ArrowUp" || event.code === "KeyW") {
      event.preventDefault?.();
      snapshot.jump = false;
    }

    if (event.code === "Space" || event.code === "Enter") {
      event.preventDefault?.();
      snapshot.firePressed = false;
    }
  }

  function handlePointerDown(event) {
    event.preventDefault?.();
    setAimFromEvent(event);
    canvas?.setPointerCapture?.(event.pointerId);
  }

  function handlePointerMove(event) {
    setAimFromEvent(event);
  }

  function handlePointerUp(event) {
    setAimFromEvent(event);
    queueAction();
    canvas?.releasePointerCapture?.(event.pointerId);
  }

  function handlePointerCancel(event) {
    setAimFromEvent(event);
    canvas?.releasePointerCapture?.(event.pointerId);
  }

  function handleTouchStart(event) {
    event.preventDefault?.();
    setAimFromEvent(event);
  }

  function handleTouchMove(event) {
    event.preventDefault?.();
    setAimFromEvent(event);
  }

  function handleTouchEnd(event) {
    event.preventDefault?.();
    setAimFromEvent(event);
    queueAction();
  }

  function handleTouchCancel(event) {
    event.preventDefault?.();
    setAimFromEvent(event);
  }

  listen(target, "keydown", handleKeyDown);
  listen(target, "keyup", handleKeyUp);
  listen(canvas, "pointerdown", handlePointerDown);
  listen(canvas, "pointermove", handlePointerMove);
  listen(canvas, "pointerup", handlePointerUp);
  listen(canvas, "pointercancel", handlePointerCancel);
  listen(canvas, "touchstart", handleTouchStart, { passive: false });
  listen(canvas, "touchmove", handleTouchMove, { passive: false });
  listen(canvas, "touchend", handleTouchEnd, { passive: false });
  listen(canvas, "touchcancel", handleTouchCancel, { passive: false });

  const startButton = options.startButton ?? getButton(root, ["[data-game-start]", "[data-kurczoker-start]"]);
  const restartButton = options.restartButton ?? getButton(root, ["[data-game-restart]", "[data-kurczoker-restart]"]);
  const muteButton = options.muteButton ?? getButton(root, ["[data-game-mute]", "[data-kurczoker-mute]"]);

  listen(startButton, "click", () => onStart());
  listen(restartButton, "click", () => onRestart());
  listen(muteButton, "click", () => onMute());

  return {
    snapshot,
    consumeAction() {
      const queued = snapshot.actionQueued;
      snapshot.actionQueued = false;
      return queued;
    },
    destroy() {
      while (cleanups.length) cleanups.pop()();
      pressed.clear();
    }
  };
}
