import test from "node:test";
import assert from "node:assert/strict";

import { drawReward } from "../src/game/renderer.js";

function createFakeContext() {
  const calls = [];

  return {
    canvas: { width: 960, height: 540 },
    calls,
    fillRect(...args) {
      calls.push(["fillRect", ...args]);
    },
    strokeRect(...args) {
      calls.push(["strokeRect", ...args]);
    },
    fillText(...args) {
      calls.push(["fillText", ...args]);
    },
    beginPath() {},
    moveTo() {},
    lineTo() {},
    stroke() {},
    arc() {},
    fill() {},
    set fillStyle(value) {
      this._fillStyle = value;
    },
    get fillStyle() {
      return this._fillStyle;
    },
    set strokeStyle(value) {
      this._strokeStyle = value;
    },
    get strokeStyle() {
      return this._strokeStyle;
    },
    set lineWidth(value) {
      this._lineWidth = value;
    },
    get lineWidth() {
      return this._lineWidth;
    },
    set font(value) {
      this._font = value;
    },
    get font() {
      return this._font;
    },
    set textAlign(value) {
      this._textAlign = value;
    },
    get textAlign() {
      return this._textAlign;
    },
    set textBaseline(value) {
      this._textBaseline = value;
    },
    get textBaseline() {
      return this._textBaseline;
    }
  };
}

test("drawReward renders all reward choices including bonus fourth card", () => {
  const ctx = createFakeContext();
  const rewardChoices = [
    { id: "one", type: "ability", label: "One", value: 1 },
    { id: "two", type: "artifact", label: "Two", value: 1 },
    { id: "three", type: "gold", label: "Three", value: 5 },
    { id: "four", type: "heal", label: "Four", value: 1 }
  ];

  drawReward(ctx, { rewardChoices });

  const rewardPanels = ctx.calls.filter(([name, x, y, width, height]) => (
    name === "strokeRect" && y === 145 && width === 190 && height === 210
  ));

  assert.equal(rewardPanels.length, 4);
});
