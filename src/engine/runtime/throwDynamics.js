const MIN_AIM = { x: 0.75, y: 0.28 };
const MAX_AIM = { x: 3.15, y: 2.15 };
const MIN_POWER = 0.55;
const MAX_POWER = 1.42;
const BASE_SPEED = 4.55;
const MIN_LENGTH = Math.hypot(MIN_AIM.x, MIN_AIM.y);
const MAX_LENGTH = Math.hypot(MAX_AIM.x, MAX_AIM.y);

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function clampAim(aim = {}) {
  return {
    x: clamp(aim.x ?? MIN_AIM.x, MIN_AIM.x, MAX_AIM.x),
    y: clamp(aim.y ?? MIN_AIM.y, MIN_AIM.y, MAX_AIM.y)
  };
}

export function aimToThrow(aim = {}) {
  const nextAim = clampAim(aim);
  const length = Math.hypot(nextAim.x, nextAim.y) || 1;
  const charge = clamp((length - MIN_LENGTH) / (MAX_LENGTH - MIN_LENGTH), 0, 1);
  const power = MIN_POWER + (MAX_POWER - MIN_POWER) * charge;
  const impulse = {
    x: (nextAim.x / length) * BASE_SPEED * power,
    y: (nextAim.y / length) * BASE_SPEED * power
  };

  return {
    aim: nextAim,
    charge,
    power,
    impulse,
    pullback: {
      x: -(nextAim.x / length) * (0.22 + charge * 0.44),
      y: -(nextAim.y / length) * (0.16 + charge * 0.28)
    }
  };
}

export function sampleTrajectory(origin, impulse, gravity = -5.8, steps = 28, stepTime = 0.07) {
  return Array.from({ length: steps }, (_, index) => {
    const t = index * stepTime;
    return [
      origin[0] + impulse.x * t,
      origin[1] + impulse.y * t + 0.5 * gravity * t * t,
      origin[2] + 0.04
    ];
  });
}
