import test from "node:test";
import assert from "node:assert/strict";

import { createAudioController, playEffect, setMuted } from "../src/game/audio.js";

function createFakeAudioContext() {
  const scheduled = [];

  class FakeGain {
    constructor() {
      this.gain = {
        value: 1,
        setValueAtTime: (value, time) => scheduled.push(["gain:set", value, time]),
        exponentialRampToValueAtTime: (value, time) => scheduled.push(["gain:ramp", value, time])
      };
      this.connectedTo = null;
    }

    connect(node) {
      this.connectedTo = node;
      return node;
    }
  }

  class FakeOscillator {
    constructor() {
      this.frequency = {
        value: 0,
        setValueAtTime: (value, time) => scheduled.push(["frequency:set", value, time]),
        exponentialRampToValueAtTime: (value, time) => scheduled.push(["frequency:ramp", value, time])
      };
      this.type = "";
      this.connectedTo = null;
    }

    connect(node) {
      this.connectedTo = node;
      return node;
    }

    start(time) {
      scheduled.push(["oscillator:start", time]);
    }

    stop(time) {
      scheduled.push(["oscillator:stop", time]);
    }
  }

  class FakeAudioContext {
    constructor() {
      this.currentTime = 1;
      this.destination = { id: "destination" };
      this.state = "suspended";
      this.scheduled = scheduled;
    }

    createGain() {
      return new FakeGain();
    }

    createOscillator() {
      return new FakeOscillator();
    }

    resume() {
      this.state = "running";
      scheduled.push(["context:resume"]);
      return Promise.resolve();
    }
  }

  return { FakeAudioContext, scheduled };
}

test("audio starts muted and does not create Web Audio eagerly", () => {
  const { FakeAudioContext } = createFakeAudioContext();

  const audio = createAudioController({ AudioContext: FakeAudioContext });

  assert.equal(audio.muted, true);
  assert.equal(audio.context, null);
  assert.equal(playEffect(audio, "shoot"), false);
});

test("unmuting after interaction unlocks the audio context", () => {
  const { FakeAudioContext, scheduled } = createFakeAudioContext();
  const audio = createAudioController({ AudioContext: FakeAudioContext });

  const next = setMuted(audio, false);

  assert.equal(next, audio);
  assert.equal(audio.muted, false);
  assert.equal(audio.context.state, "running");
  assert.deepEqual(scheduled, [["context:resume"]]);
});

test("playEffect schedules known effects when audio is unmuted", () => {
  const { FakeAudioContext, scheduled } = createFakeAudioContext();
  const audio = setMuted(createAudioController({ AudioContext: FakeAudioContext }), false);

  const played = playEffect(audio, "hit");

  assert.equal(played, true);
  assert.equal(scheduled.some(([event]) => event === "oscillator:start"), true);
  assert.equal(scheduled.some(([event]) => event === "oscillator:stop"), true);
});

test("muting prevents later effects without discarding the unlocked context", () => {
  const { FakeAudioContext } = createFakeAudioContext();
  const audio = setMuted(createAudioController({ AudioContext: FakeAudioContext }), false);
  const context = audio.context;

  setMuted(audio, true);

  assert.equal(audio.muted, true);
  assert.equal(audio.context, context);
  assert.equal(playEffect(audio, "victory"), false);
});
