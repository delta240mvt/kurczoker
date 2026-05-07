import { useEffect, useMemo } from "react";
import { BufferGeometry, Float32BufferAttribute } from "three";
import { aimToThrow, sampleTrajectory } from "../runtime/throwDynamics.js";

export function ProjectileArc({ origin, aim, gravity = -5.8, steps = 32, charging = false }) {
  const { geometry, points, throwState } = useMemo(() => {
    const nextThrowState = aimToThrow(aim);
    const trajectory = sampleTrajectory(origin, nextThrowState.impulse, gravity, steps);
    const vertices = [];
    const nextPoints = [];

    for (let index = 0; index < trajectory.length; index += 1) {
      const point = trajectory[index];
      vertices.push(...point);
      if (index % 2 === 0) {
        nextPoints.push(point);
      }
    }

    const next = new BufferGeometry();
    next.setAttribute("position", new Float32BufferAttribute(vertices, 3));
    return { geometry: next, points: nextPoints, throwState: nextThrowState };
  }, [aim.x, aim.y, gravity, origin, steps]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  const power = Math.round(24 + throwState.charge * 76);
  const loadedEgg = [
    origin[0] + throwState.pullback.x,
    origin[1] + 0.04 + throwState.pullback.y,
    origin[2] + 0.34
  ];
  const anchorTop = [origin[0] + 0.1, origin[1] + 0.28, origin[2] + 0.28];
  const anchorBottom = [origin[0] + 0.1, origin[1] - 0.07, origin[2] + 0.28];
  const bandGeometry = useMemo(() => {
    const next = new BufferGeometry();
    next.setAttribute(
      "position",
      new Float32BufferAttribute([...anchorTop, ...loadedEgg, ...anchorBottom, ...loadedEgg], 3)
    );
    return next;
  }, [anchorTop[0], anchorTop[1], anchorTop[2], anchorBottom[0], anchorBottom[1], anchorBottom[2], loadedEgg[0], loadedEgg[1], loadedEgg[2]]);

  useEffect(() => () => bandGeometry.dispose(), [bandGeometry]);

  return (
    <group>
      <group position={[origin[0] + 0.55, origin[1] + 0.56, origin[2] + 0.2]}>
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
      <lineSegments geometry={bandGeometry}>
        <lineBasicMaterial color={charging ? "#facc15" : "#c58a3a"} transparent opacity={charging ? 0.92 : 0.58} />
      </lineSegments>
      <mesh position={[origin[0] + 0.1, origin[1] + 0.1, origin[2] + 0.26]} rotation={[0, 0, -0.18]}>
        <cylinderGeometry args={[0.03, 0.045, 0.48, 10]} />
        <meshStandardMaterial color="#5a3216" roughness={0.74} />
      </mesh>
      <group position={loadedEgg} rotation={[0, 0, -0.38 + throwState.charge * 0.22]} scale={0.74 + throwState.charge * 0.2}>
        <mesh scale={[0.82, 1.08, 0.82]}>
          <sphereGeometry args={[0.16, 24, 14]} />
          <meshStandardMaterial color="#fff1b5" roughness={0.34} emissive={charging ? "#fb923c" : "#000000"} emissiveIntensity={charging ? 0.12 + throwState.charge * 0.28 : 0.03} />
        </mesh>
        {[[0.04, 0.03, 0.08], [-0.06, -0.04, 0.08], [0.02, 0.09, -0.03]].map((spot, index) => (
          <mesh key={`loaded-spot-${index}`} position={spot}>
            <sphereGeometry args={[0.026, 10, 6]} />
            <meshStandardMaterial color="#4b8fd6" roughness={0.45} />
          </mesh>
        ))}
      </group>
      <line geometry={geometry}>
        <lineBasicMaterial color={charging ? "#facc15" : "#0a0e1c"} transparent opacity={charging ? 0.56 : 0.38} />
      </line>
      {points.map((point, index) => (
        <mesh key={index} position={point} scale={(index === points.length - 1 ? 0.075 : 0.048) + throwState.charge * 0.018}>
          <sphereGeometry args={[1, 10, 6]} />
          <meshBasicMaterial color={index === points.length - 1 ? "#ffffff" : charging ? "#fde68a" : "#fff4a3"} transparent opacity={0.52 + index / Math.max(points.length, 1) * 0.4} />
        </mesh>
      ))}
    </group>
  );
}
