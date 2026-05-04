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
    width: 960,
    height: 540,
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

  assert.deepEqual(input.snapshot.aim, { x: 480, y: 270 });
  canvas.listeners.get("pointerup")(pointerEvent({ clientX: 120, clientY: 80 }));
  assert.deepEqual(input.snapshot.aim, { x: 480, y: 270 });
  assert.equal(input.consumeAction(), false);

  canvas.listeners.get("pointerdown")(pointerEvent());
  canvas.listeners.get("pointermove")(pointerEvent({ clientX: 240, clientY: 135 }));
  assert.deepEqual(input.snapshot.aim, { x: 240, y: 135 });

  canvas.listeners.get("pointerup")(pointerEvent());

  assert.equal(input.consumeAction(), true);
  assert.equal(input.consumeAction(), false);
});

test("input ignores stray pointer move and release events", () => {
  const target = createEventTarget();
  const canvas = createCanvas();
  const input = createInputController({ target, canvas });

  assert.deepEqual(input.snapshot.aim, { x: 640, y: 280 });

  canvas.listeners.get("pointermove")(pointerEvent({ clientX: 240, clientY: 135 }));
  assert.deepEqual(input.snapshot.aim, { x: 640, y: 280 });

  canvas.listeners.get("pointerup")(pointerEvent({ clientX: 120, clientY: 80 }));
  assert.deepEqual(input.snapshot.aim, { x: 640, y: 280 });
  assert.equal(input.consumeAction(), false);
});

test("input updates aim and queues action during normal pointer gestures", () => {
  const target = createEventTarget();
  const canvas = createCanvas();
  const input = createInputController({ target, canvas });

  canvas.listeners.get("pointerdown")(pointerEvent({ clientX: 480, clientY: 270 }));
  assert.deepEqual(input.snapshot.aim, { x: 480, y: 270 });

  canvas.listeners.get("pointermove")(pointerEvent({ clientX: 240, clientY: 135 }));
  assert.deepEqual(input.snapshot.aim, { x: 240, y: 135 });

  canvas.listeners.get("pointerup")(pointerEvent({ clientX: 120, clientY: 80 }));
  assert.deepEqual(input.snapshot.aim, { x: 120, y: 80 });
  assert.equal(input.consumeAction(), true);
  assert.equal(input.consumeAction(), false);
});

test("input keeps the first active pointer from being hijacked by another pointer", () => {
  const target = createEventTarget();
  const canvas = createCanvas();
  const input = createInputController({ target, canvas });

  canvas.listeners.get("pointerdown")(pointerEvent({ pointerId: 1, clientX: 480, clientY: 270 }));
  assert.deepEqual(input.snapshot.aim, { x: 480, y: 270 });

  canvas.listeners.get("pointerdown")(pointerEvent({ pointerId: 2, clientX: 700, clientY: 300 }));
  canvas.listeners.get("pointermove")(pointerEvent({ pointerId: 2, clientX: 720, clientY: 320 }));
  canvas.listeners.get("pointerup")(pointerEvent({ pointerId: 2, clientX: 740, clientY: 340 }));

  assert.deepEqual(input.snapshot.aim, { x: 480, y: 270 });
  assert.equal(input.consumeAction(), false);

  canvas.listeners.get("pointerup")(pointerEvent({ pointerId: 1, clientX: 120, clientY: 80 }));

  assert.deepEqual(input.snapshot.aim, { x: 120, y: 80 });
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

test("input keeps movement active when releasing one held alias", () => {
  const target = createEventTarget();
  const canvas = createCanvas();
  const input = createInputController({ target, canvas });

  target.listeners.get("keydown")({ code: "ArrowLeft", preventDefault() {} });
  target.listeners.get("keydown")({ code: "KeyA", preventDefault() {} });
  assert.equal(input.snapshot.moveX, -1);

  target.listeners.get("keyup")({ code: "ArrowLeft", preventDefault() {} });
  assert.equal(input.snapshot.moveX, -1);

  target.listeners.get("keyup")({ code: "KeyA", preventDefault() {} });
  assert.equal(input.snapshot.moveX, 0);
});

test("input keeps right movement active when releasing one held alias", () => {
  const target = createEventTarget();
  const canvas = createCanvas();
  const input = createInputController({ target, canvas });

  target.listeners.get("keydown")({ code: "ArrowRight", preventDefault() {} });
  target.listeners.get("keydown")({ code: "KeyD", preventDefault() {} });
  assert.equal(input.snapshot.moveX, 1);

  target.listeners.get("keyup")({ code: "ArrowRight", preventDefault() {} });
  assert.equal(input.snapshot.moveX, 1);

  target.listeners.get("keyup")({ code: "KeyD", preventDefault() {} });
  assert.equal(input.snapshot.moveX, 0);

  target.listeners.get("keydown")({ code: "ArrowRight", preventDefault() {} });
  target.listeners.get("keydown")({ code: "KeyD", preventDefault() {} });
  assert.equal(input.snapshot.moveX, 1);

  target.listeners.get("keyup")({ code: "KeyD", preventDefault() {} });
  assert.equal(input.snapshot.moveX, 1);

  target.listeners.get("keyup")({ code: "ArrowRight", preventDefault() {} });
  assert.equal(input.snapshot.moveX, 0);
});

test("input keeps jump active when releasing one held alias", () => {
  const target = createEventTarget();
  const canvas = createCanvas();
  const input = createInputController({ target, canvas });

  target.listeners.get("keydown")({ code: "ArrowUp", preventDefault() {} });
  target.listeners.get("keydown")({ code: "KeyW", preventDefault() {} });
  assert.equal(input.snapshot.jump, true);

  target.listeners.get("keyup")({ code: "ArrowUp", preventDefault() {} });
  assert.equal(input.snapshot.jump, true);

  target.listeners.get("keyup")({ code: "KeyW", preventDefault() {} });
  assert.equal(input.snapshot.jump, false);
});

test("input supports keyboard aim and touch movement controls", () => {
  const target = createEventTarget();
  const canvas = createCanvas();
  const input = createInputController({ target, canvas });

  target.listeners.get("keydown")({ code: "KeyQ", preventDefault() {} });
  assert.deepEqual(input.snapshot.aim, { x: 70, y: 260 });

  target.listeners.get("keydown")({ code: "ArrowLeft", preventDefault() {} });
  assert.equal(input.snapshot.moveX, -1);

  target.listeners.get("keydown")({ code: "KeyD", preventDefault() {} });
  assert.equal(input.snapshot.moveX, 0);

  target.listeners.get("keyup")({ code: "ArrowLeft", preventDefault() {} });
  assert.equal(input.snapshot.moveX, 1);

  target.listeners.get("keyup")({ code: "KeyD", preventDefault() {} });
  assert.equal(input.snapshot.moveX, 0);

  target.listeners.get("keydown")({ code: "KeyA", preventDefault() {} });
  assert.equal(input.snapshot.moveX, -1);

  target.listeners.get("keyup")({ code: "KeyA", preventDefault() {} });
  target.listeners.get("keydown")({ code: "ArrowRight", preventDefault() {} });
  assert.equal(input.snapshot.moveX, 1);
  target.listeners.get("keyup")({ code: "ArrowRight", preventDefault() {} });

  canvas.listeners.get("touchstart")({
    touches: [{ clientX: 100, clientY: 500 }],
    preventDefault() {}
  });
  assert.equal(input.snapshot.moveX, -1);

  canvas.listeners.get("touchmove")({
    touches: [{ clientX: 500, clientY: 120 }],
    preventDefault() {}
  });
  assert.equal(input.snapshot.jump, true);

  canvas.listeners.get("touchend")({
    changedTouches: [{ clientX: 500, clientY: 120 }],
    preventDefault() {}
  });
  assert.equal(input.snapshot.moveX, 0);
  assert.equal(input.snapshot.jump, false);
  assert.equal(input.consumeAction(), true);
  assert.equal(input.consumeAction(), false);
});
