import { useEffect, useMemo } from "react";
import { BufferGeometry, Float32BufferAttribute } from "three";

export function ProjectileArc({ origin, aim, gravity = -5.8, steps = 28 }) {
  const { geometry, points } = useMemo(() => {
    const length = Math.hypot(aim.x, aim.y) || 1;
    const velocity = {
      x: (aim.x / length) * 4.15,
      y: (aim.y / length) * 4.15
    };
    const vertices = [];
    const nextPoints = [];

    for (let index = 0; index < steps; index += 1) {
      const t = index * 0.07;
      const point = [origin[0] + velocity.x * t, origin[1] + velocity.y * t + 0.5 * gravity * t * t, origin[2] + 0.04];
      vertices.push(...point);
      if (index % 2 === 0) {
        nextPoints.push(point);
      }
    }

    const next = new BufferGeometry();
    next.setAttribute("position", new Float32BufferAttribute(vertices, 3));
    return { geometry: next, points: nextPoints };
  }, [aim.x, aim.y, gravity, origin, steps]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <group>
      <line geometry={geometry}>
        <lineBasicMaterial color="#0a0e1c" transparent opacity={0.42} />
      </line>
      {points.map((point, index) => (
        <mesh key={index} position={point} scale={index === points.length - 1 ? 0.07 : 0.05}>
          <sphereGeometry args={[1, 10, 6]} />
          <meshBasicMaterial color={index === points.length - 1 ? "#ffffff" : "#fff4a3"} transparent opacity={0.92} />
        </mesh>
      ))}
    </group>
  );
}
