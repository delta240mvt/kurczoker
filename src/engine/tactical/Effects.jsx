import { useFrame } from "@react-three/fiber";
import { useRef, useMemo } from "react";
import { Vector3, BufferGeometry } from "three";
import { Html } from "@react-three/drei";

export function ShotVisual({ sim, showAim=true }) {
  const egg = useRef(),
    trail = useRef(),
    line = useRef(),
    history = useRef([]),
    shotId = useRef(0);
  const trailGeometry = useMemo(
    () =>
      new BufferGeometry().setFromPoints(
        Array.from({ length: 24 }, () => new Vector3()),
      ),
    [],
  );
  const arcGeometry = useMemo(
    () =>
      new BufferGeometry().setFromPoints(
        Array.from({ length: 181 }, () => new Vector3()),
      ),
    [],
  );
  useFrame(() => {
    if (!sim || sim.disposed) return;
    const s = sim.snapshot({includeTerrain:false});
    egg.current.visible = !!s.projectile;
    trail.current.visible = !!s.projectile;
    line.current.visible = showAim && s.phase === "player" && !s.paused;
    if (s.projectile) {
      const p = s.projectile;
      if (shotId.current !== p.id) {
        history.current = [];
        shotId.current = p.id;
      }
      egg.current.position.set(p.x, p.y, p.z);
      egg.current.rotation.z = s.time * 8;
      history.current.push(new Vector3(p.x, p.y, p.z));
      if (history.current.length > 24) history.current.shift();
      const attr = trailGeometry.attributes.position;
      for (let i = 0; i < 24; i++) {
        const v = history.current[Math.min(i, history.current.length - 1)];
        attr.setXYZ(i, v.x, v.y, v.z);
      }
      attr.needsUpdate = true;
      trailGeometry.computeBoundingSphere();
    }
    if (line.current.visible) {
      const points = sim.trajectory();
      const attr = arcGeometry.attributes.position;
      points.forEach((p, i) => attr.setXYZ(i, p.x, p.y, p.z));
      attr.needsUpdate = true;
      arcGeometry.setDrawRange(0, points.length);
      arcGeometry.computeBoundingSphere();
    }
  });
  return (
    <>
      <group ref={egg} visible={false}>
        <mesh scale={[0.16, 0.2, 0.16]} castShadow>
          <sphereGeometry args={[1, 14, 10]} />
          <meshStandardMaterial color="#fff0cb" roughness={0.4} />
        </mesh>
        <pointLight intensity={0.7} color="#ffd179" distance={2} />
      </group>
      <line ref={trail} geometry={trailGeometry} frustumCulled={false}>
        <lineBasicMaterial color="#f8cf78" transparent opacity={0.75} />
      </line>
      <line ref={line} geometry={arcGeometry} frustumCulled={false}>
        <lineBasicMaterial color="#fcf5cb" transparent opacity={0.7} />
      </line>
    </>
  );
}

export function ImpactVisual({ event, sim }) {
  const root = useRef(),
    materials = useRef([]);
  const elapsed = useRef(0);
  useFrame((_, delta) => {
    if (!sim.paused) elapsed.current += Math.min(delta, 0.1);
    const age = elapsed.current;
    if (!root.current) return;
    root.current.visible = age < 0.8;
    root.current.scale.setScalar(0.5 + age * 2.2);
    root.current.rotation.z = age * 1.1;
    materials.current.forEach((m) => {
      if (m) m.opacity = Math.max(0, 1 - age / 0.8);
    });
  });
  return (
    <group ref={root} position={[event.x, event.y, 0]}>
      <Html center position={[0, 0.8, 0]} style={{ pointerEvents: "none" }}>
        <span className="damage-number">
          {event.damage ? `−${event.damage}` : "PUDŁO / BLOK"}
        </span>
      </Html>
      <mesh>
        <icosahedronGeometry args={[0.4, 1]} />
        <meshBasicMaterial
          color="#fff0b5"
          transparent
          ref={(m) => (materials.current[0] = m)}
        />
      </mesh>
      <mesh>
        <ringGeometry args={[0.45, 0.6, 32]} />
        <meshBasicMaterial
          color="#efb663"
          transparent
          side={2}
          ref={(m) => (materials.current[1] = m)}
        />
      </mesh>
      {Array.from({ length: 10 }, (_, i) => (
        <mesh
          key={i}
          position={[Math.cos(i * 2.4) * 0.75, Math.sin(i * 2.4) * 0.6, 0.1]}
        >
          <icosahedronGeometry args={[0.1, 0]} />
          <meshBasicMaterial
            color={i % 2 ? "#e8cc92" : "#977b54"}
            transparent
            ref={(m) => (materials.current[i + 2] = m)}
          />
        </mesh>
      ))}
    </group>
  );
}
