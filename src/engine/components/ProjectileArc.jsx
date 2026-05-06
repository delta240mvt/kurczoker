import { useMemo } from "react";
import { BufferGeometry, Float32BufferAttribute } from "three";

export function ProjectileArc({ origin, aim, gravity = -5.8, steps = 28 }) {
  const geometry = useMemo(() => {
    const length = Math.hypot(aim.x, aim.y) || 1;
    const velocity = {
      x: (aim.x / length) * 4.15,
      y: (aim.y / length) * 4.15
    };
    const vertices = [];

    for (let index = 0; index < steps; index += 1) {
      const t = index * 0.07;
      vertices.push(origin[0] + velocity.x * t, origin[1] + velocity.y * t + 0.5 * gravity * t * t, origin[2] + 0.04);
    }

    const next = new BufferGeometry();
    next.setAttribute("position", new Float32BufferAttribute(vertices, 3));
    return next;
  }, [aim.x, aim.y, gravity, origin, steps]);

  return (
    <line geometry={geometry}>
      <lineBasicMaterial color="#fff4a3" transparent opacity={0.78} />
    </line>
  );
}
