import { useEffect, useMemo } from "react";
import { BufferGeometry, Float32BufferAttribute } from "three";

export function ProjectileArc({ origin, aim, gravity = -5.8, steps = 28 }) {
  const { geometry, points } = useMemo(() => {
    const length = Math.hypot(aim.x, aim.y) || 1;
    const power = Math.min(1.35, Math.max(0.55, length / 2.2));
    const velocity = {
      x: (aim.x / length) * 4.15 * power,
      y: (aim.y / length) * 4.15 * power
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

  const aimLength = Math.hypot(aim.x, aim.y) || 1;
  const power = Math.round(Math.min(100, Math.max(24, (aimLength / 2.7) * 100)));

  return (
    <group>
      <group position={[origin[0] + 0.55, origin[1] + 0.42, origin[2] + 0.2]}>
        <mesh>
          <boxGeometry args={[1.06, 0.11, 0.045]} />
          <meshBasicMaterial color="#0a0e1c" transparent opacity={0.76} />
        </mesh>
        <mesh position={[-0.53 + (power / 100) * 0.53, 0.014, 0.02]}>
          <boxGeometry args={[1.06 * (power / 100), 0.055, 0.055]} />
          <meshBasicMaterial color={power > 78 ? "#ef4444" : "#facc15"} transparent opacity={0.95} />
        </mesh>
        <mesh position={[0.72, 0.015, 0.03]} scale={0.055}>
          <sphereGeometry args={[1, 10, 6]} />
          <meshBasicMaterial color="#fff4c2" transparent opacity={0.95} />
        </mesh>
      </group>
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
