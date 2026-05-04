export function createInputController() {
  return {
    snapshot: {
      moveX: 0,
      jump: false,
      aim: { x: 0, y: 0 },
      firePressed: false,
      selectedAbilityId: "egg-bomb"
    },
    destroy() {}
  };
}
