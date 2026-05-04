import test from "node:test";
import assert from "node:assert/strict";

import { createInputController } from "../src/game/input.js";

function createEventTarget() {
  const listeners = new Map();

  return {
    listeners,
    addEventListener(type, handler) {
      listeners.set(type, handler);
    },
    removeEventListener(type) {
      listeners.delete(type);
    }
  };
}

function createCanvas() {
  return {
    ...createEventTarget(),
    getBoundingClientRect() {
      return { left: 0, top: 0, width: 960, height: 540 };
    },
    setPointerCapture() {},
    releasePointerCapture() {}
  };
}

function pointerEvent(overrides = {}) {
  return {
    clientX: 480,
    clientY: 270,
    pointerId: 1,
    preventDefault() {},
    ...overrides
  };
}

test("input queues pointer actions only on completed release events", () => {
  const target = createEventTarget();
  const canvas = createCanvas();
  const input = createInputController({ target, canvas });

  canvas.listeners.get("pointerdown")(pointerEvent());
  canvas.listeners.get("pointercancel")(pointerEvent());

  assert.equal(input.consumeAction(), false);

  canvas.listeners.get("pointerdown")(pointerEvent());
  canvas.listeners.get("pointerup")(pointerEvent());

  assert.equal(input.consumeAction(), true);
  assert.equal(input.consumeAction(), false);
});

test("input queues keyboard action once per key press", () => {
  const target = createEventTarget();
  const canvas = createCanvas();
  const input = createInputController({ target, canvas });

  target.listeners.get("keydown")({ code: "Space", repeat: false, preventDefault() {} });
  target.listeners.get("keydown")({ code: "Space", repeat: true, preventDefault() {} });

  assert.equal(input.consumeAction(), true);
  assert.equal(input.consumeAction(), false);
});
