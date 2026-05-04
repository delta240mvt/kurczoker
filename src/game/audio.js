export function createAudioController() {
  return { muted: true, context: null };
}

export function playEffect() {}

export function setMuted(audio, muted) {
  return { ...audio, muted };
}
