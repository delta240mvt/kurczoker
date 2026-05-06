import { useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";

export function ExplosionFx({ position, onDone }) {
  const groupRef = useRef(null);
  const [age, setAge] = useState(0);

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
      <mesh rotation={[0, 0, 0.8]}>
        <torusGeometry args={[0.34, 0.045, 8, 28]} />
        <meshBasicMaterial color="#f97316" transparent opacity={opacity * 0.82} />
      </mesh>
      <mesh position={[0.15, 0.12, 0.04]}>
        <sphereGeometry args={[0.11, 12, 8]} />
        <meshBasicMaterial color="#ef4444" transparent opacity={opacity * 0.7} />
      </mesh>
    </group>
  );
}
