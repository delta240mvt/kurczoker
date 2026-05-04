const EFFECTS = {
  shoot: { type: "square", frequency: 440, endFrequency: 660, duration: 0.08, gain: 0.05 },
  hit: { type: "sawtooth", frequency: 180, endFrequency: 90, duration: 0.12, gain: 0.07 },
  treasure: { type: "triangle", frequency: 660, endFrequency: 990, duration: 0.16, gain: 0.06 },
  defeat: { type: "sawtooth", frequency: 220, endFrequency: 55, duration: 0.35, gain: 0.08 },
  victory: { type: "triangle", frequency: 520, endFrequency: 1040, duration: 0.28, gain: 0.07 }
};

function resolveAudioContext(options) {
  if (options.AudioContext) {
    return options.AudioContext;
  }

  if (typeof window === "undefined") {
    return null;
  }

  return window.AudioContext || window.webkitAudioContext || null;
}

function ensureContext(audio) {
  if (!audio.AudioContext) {
    return null;
  }

  if (!audio.context) {
    audio.context = new audio.AudioContext();
    audio.masterGain = audio.context.createGain();
    audio.masterGain.gain.value = audio.masterVolume;
    audio.masterGain.connect(audio.context.destination);
  }

  if (audio.context.state === "suspended" && typeof audio.context.resume === "function") {
    audio.context.resume();
  }

  audio.unlocked = true;
  return audio.context;
}

export function createAudioController(options = {}) {
  return {
    muted: true,
    unlocked: false,
    context: null,
    masterGain: null,
    masterVolume: options.masterVolume ?? 0.35,
    AudioContext: resolveAudioContext(options)
  };
}

export function playEffect(audio, effectId) {
  const effect = EFFECTS[effectId];

  if (!audio || audio.muted || !effect) {
    return false;
  }

  const context = ensureContext(audio);
  if (!context || !audio.masterGain) {
    return false;
  }

  const startedAt = context.currentTime;
  const endedAt = startedAt + effect.duration;
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = effect.type;
  oscillator.frequency.setValueAtTime(effect.frequency, startedAt);
  oscillator.frequency.exponentialRampToValueAtTime(effect.endFrequency, endedAt);

  gain.gain.setValueAtTime(effect.gain, startedAt);
  gain.gain.exponentialRampToValueAtTime(0.001, endedAt);

  oscillator.connect(gain);
  gain.connect(audio.masterGain);
  oscillator.start(startedAt);
  oscillator.stop(endedAt);

  return true;
}

export function setMuted(audio, muted) {
  if (!audio) {
    return audio;
  }

  audio.muted = Boolean(muted);

  if (!audio.muted) {
    ensureContext(audio);
  }

  return audio;
}
