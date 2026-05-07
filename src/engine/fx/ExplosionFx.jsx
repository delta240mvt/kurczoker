import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, useState } from "react";

export function ExplosionFx({ position, onDone }) {
  const groupRef = useRef(null);
  const [age, setAge] = useState(0);
  const shards = useMemo(
    () =>
      Array.from({ length: 14 }).map((_, index) => {
        const angle = (index / 14) * Math.PI * 2;
        const distance = 0.26 + (index % 4) * 0.08;
        return {
          x: Math.cos(angle) * distance,
          y: Math.sin(angle) * distance * 0.72,
          scale: 0.035 + (index % 3) * 0.016,
          tone: index % 3
        };
      }),
    []
  );

  useFrame((_, delta) => {
    const nextAge = age + delta;
    setAge(nextAge);
    if (groupRef.current) {
      const scale = 1 + nextAge * 3.8;
      groupRef.current.scale.setScalar(scale);
      groupRef.current.rotation.z += delta * 2.4;
    }
    if (nextAge > 0.48) {
      onDone?.();
    }
  });

  const opacity = Math.max(0, 1 - age * 2.1);

  return (
    <group ref={groupRef} position={position}>
      <mesh>
        <sphereGeometry args={[0.22, 24, 12]} />
        <meshBasicMaterial color="#fff4b0" transparent opacity={opacity} />
      </mesh>
      <mesh rotation={[0, 0, 0.35]} scale={[1.55, 0.72, 1]}>
        <ringGeometry args={[0.3, 0.48, 28]} />
        <meshBasicMaterial color="#3b2414" transparent opacity={opacity * 0.5} />
      </mesh>
      <mesh rotation={[0, 0, 0.8]}>
        <torusGeometry args={[0.34, 0.045, 8, 28]} />
        <meshBasicMaterial color="#f97316" transparent opacity={opacity * 0.82} />
      </mesh>
      <mesh position={[0.15, 0.12, 0.04]}>
        <sphereGeometry args={[0.11, 12, 8]} />
        <meshBasicMaterial color="#ef4444" transparent opacity={opacity * 0.7} />
      </mesh>
      {shards.map((shard, index) => (
        <mesh key={index} position={[shard.x * (1 + age * 1.8), shard.y * (1 + age * 1.4), 0.05]} scale={shard.scale}>
          <boxGeometry args={[1, 0.72, 0.55]} />
          <meshBasicMaterial color={shard.tone === 0 ? "#facc15" : shard.tone === 1 ? "#6b3f1d" : "#ef4444"} transparent opacity={opacity * 0.9} />
        </mesh>
      ))}
    </group>
  );
}
