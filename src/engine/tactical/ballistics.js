export const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
export function launchVelocity(angle, speed, direction = 1) {
  const radians = (clamp(angle, 10, 80) * Math.PI) / 180;
  return {
    x: Math.cos(radians) * clamp(speed, 6, 14) * direction,
    y: Math.sin(radians) * clamp(speed, 6, 14),
    z: 0,
  };
}
export function pointToAim(origin, point) {
  const dx = Math.max(0.05, Math.abs(point.x - origin.x));
  return clamp((Math.atan2(point.y - origin.y, dx) * 180) / Math.PI, 10, 80);
}
