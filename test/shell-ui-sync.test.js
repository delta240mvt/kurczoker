import assert from "node:assert/strict";
import test from "node:test";

import { bindShellControls, syncShellUiModel } from "../src/engine/runtime/shellUiSync.js";

function createClassList(initial = []) {
  const values = new Set(initial);
  return {
    add(...classes) {
      for (const className of classes) values.add(className);
    },
    remove(...classes) {
      for (const className of classes) values.delete(className);
    },
    contains(className) {
      return values.has(className);
    },
    toArray() {
      return [...values];
    }
  };
}

function createElement() {
  return {
    textContent: "",
    hidden: false,
    disabled: false,
    innerHTML: "",
    attributes: new Map(),
    classList: createClassList(),
    listeners: new Map(),
    setAttribute(name, value) {
      this.attributes.set(name, String(value));
    },
    getAttribute(name) {
      return this.attributes.get(name) ?? null;
    },
    removeAttribute(name) {
      this.attributes.delete(name);
    },
    addEventListener(name, callback) {
      this.listeners.set(name, callback);
    },
    removeEventListener(name) {
      this.listeners.delete(name);
    },
    click() {
      this.listeners.get("click")?.({ preventDefault() {} });
    }
  };
}

function createRoot(selectors) {
  return {
    querySelector(selector) {
      return selectors[selector] ?? null;
    }
  };
}

test("syncShellUiModel writes full shell model without replacing unchanged content", () => {
  const shell = createElement();
  shell.classList = createClassList(["shell", "shell--map"]);
  const statusbar = createElement();
  const restart = createElement();
  const mute = createElement();
  const action = createElement();
  const message = createElement();
  const hints = createElement();
  const root = createRoot({
    "[data-game-shell]": shell,
    "[data-game-statusbar]": statusbar,
    "[data-game-restart]": restart,
    "[data-game-mute]": mute,
    "[data-game-start]": action,
    "[data-game-message]": message,
    "[data-game-hints]": hints,
    "[data-game-health]": createElement(),
    "[data-game-node]": createElement(),
    "[data-game-scene]": createElement(),
    "[data-game-ability]": createElement(),
    "[data-game-ability-label]": createElement(),
    "[data-game-status-health]": createElement(),
    "[data-game-status-node]": createElement(),
    "[data-game-status-action]": createElement(),
    "[data-game-status-action-label]": createElement(),
    "[data-game-status-audio]": createElement(),
    "[data-game-backdrop]": createElement()
  });

  syncShellUiModel(root, {
    scene: "game-over",
    sceneLabel: "Koniec",
    canvasBackdrop: "09",
    actionDisabled: true,
    topHud: [
      { key: "health", label: "HP", value: "0 / 3" },
      { key: "node", label: "Węzeł", value: "battle-1" },
      { key: "scene", label: "Scena", value: "Koniec" },
      { key: "ability", label: "Zdolność", value: "egg-bomb" }
    ],
    status: [
      { key: "health", label: "HP", value: "0 / 3" },
      { key: "node", label: "Węzeł", value: "battle-1" },
      { key: "action", label: "Akcja", value: "Egg Bomb" },
      { key: "audio", label: "Audio", value: "cisza" }
    ],
    ribbon: { text: "Koniec wyprawy.", variant: "danger" },
    statusVariant: "dead",
    hints: []
  });

  assert.equal(root.querySelector("[data-game-health]").textContent, "0 / 3");
  assert.equal(root.querySelector("[data-game-scene]").textContent, "Koniec");
  assert.equal(root.querySelector("[data-game-status-action]").textContent, "Egg Bomb");
  assert.equal(message.textContent, "Koniec wyprawy.");
  assert.equal(action.disabled, true);
  assert.equal(mute.getAttribute("aria-pressed"), "true");
  assert.equal(root.querySelector("[data-game-backdrop]").getAttribute("data-backdrop"), "09");
  assert.equal(hints.hidden, true);
  assert.ok(shell.classList.contains("shell--game-over"));
  assert.ok(statusbar.classList.contains("shell__statusbar--dead"));
});

test("bindShellControls wires restart, mute, and first map route action", () => {
  const restart = createElement();
  const mute = createElement();
  const action = createElement();
  const root = createRoot({
    "[data-game-restart]": restart,
    "[data-game-mute]": mute,
    "[data-game-start]": action
  });
  const calls = [];
  const store = {
    getState() {
      return {
        game: { scene: "map", run: { offeredNodeIds: ["battle-1"] } },
        reset: () => calls.push("reset"),
        toggleMute: () => calls.push("mute"),
        selectNode: (nodeId) => calls.push(`select:${nodeId}`)
      };
    }
  };

  const unbind = bindShellControls(root, store);
  restart.click();
  mute.click();
  action.click();
  unbind();

  assert.deepEqual(calls, ["reset", "mute", "select:battle-1"]);
});
