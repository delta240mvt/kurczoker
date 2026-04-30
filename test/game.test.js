import test from "node:test";
import assert from "node:assert/strict";

import { createGameState, collectPoint, finishGame } from "../src/game.js";

test("collecting a point increments score and shows KURCZOK message", () => {
  const state = createGameState();

  const next = collectPoint(state);

  assert.equal(next.score, 1);
  assert.equal(next.lastPointText, "KURCZOK!");
});

test("finishing the game exposes only Game Over and final score text", () => {
  const state = collectPoint(collectPoint(createGameState()));

  const result = finishGame(state);

  assert.deepEqual(result, {
    title: "Game Over",
    scoreText: "Wynik: 2"
  });
});
