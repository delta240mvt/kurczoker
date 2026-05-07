import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";

const ICON_COLORS = {
  start: ["#f8e7a1", "#2f8f5b"],
  battle: ["#7fd7ff", "#2557b8"],
  elite: ["#aaf0ff", "#6d3ecf"],
  treasure: ["#ffd86b", "#b86f16"],
  shop: ["#99f2bd", "#25744f"],
  boss: ["#ff8a58", "#8a1f1f"]
};

export function PixelBillboard({ type = "battle", active = false, offered = false, scale = 1 }) {
  const ref = useRef(null);
  const colors = ICON_COLORS[type] ?? ICON_COLORS.battle;
  const marks = useMemo(() => {
    if (type === "treasure") return [[0, 0.11, 0.2, 0.12], [0, -0.05, 0.32, 0.2], [0, -0.2, 0.22, 0.08]];
    if (type === "shop") return [[0, 0.08, 0.34, 0.1], [-0.11, -0.08, 0.1, 0.24], [0.11, -0.08, 0.1, 0.24]];
    if (type === "boss") return [[0, 0.13, 0.28, 0.12], [-0.12, 0.02, 0.12, 0.28], [0.12, 0.02, 0.12, 0.28]];
    if (type === "start") return [[0, 0.08, 0.12, 0.32], [0.11, 0.15, 0.2, 0.14], [0.03, -0.12, 0.24, 0.08]];
    return [[0, 0.02, 0.3, 0.16], [-0.09, 0.13, 0.08, 0.16], [0.09, 0.13, 0.08, 0.16]];
  }, [type]);

  useFrame(({ camera }) => {
    ref.current?.quaternion.copy(camera.quaternion);
  });

  return (
    <group ref={ref} scale={scale}>
      <mesh position={[0, -0.18, -0.02]} rotation={[-Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.36, 0.46, 0.16, 36]} />
        <meshStandardMaterial color={offered ? colors[0] : "#475569"} roughness={0.62} metalness={0.08} emissive={active ? "#facc15" : "#000000"} emissiveIntensity={active ? 0.18 : 0} />
      </mesh>
      <mesh position={[0, -0.02, 0.04]} rotation={[-Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.26, 0.31, 0.13, 36]} />
        <meshStandardMaterial color={active ? "#fff3a3" : colors[1]} roughness={0.42} metalness={0.18} emissive={offered ? colors[1] : "#000000"} emissiveIntensity={offered ? 0.16 : 0} />
      </mesh>
      {type === "battle" ? (
        <mesh position={[0, 0.18, 0.07]}>
          <sphereGeometry args={[0.2, 24, 12]} />
          <meshStandardMaterial color="#1d6fe8" roughness={0.28} metalness={0.12} emissive="#2563eb" emissiveIntensity={active ? 0.35 : 0.18} />
        </mesh>
      ) : null}
      {type === "elite" ? (
        <mesh position={[0, 0.19, 0.07]} rotation={[0, 0, Math.PI / 5]}>
          <icosahedronGeometry args={[0.22, 0]} />
          <meshStandardMaterial color="#8b5cf6" roughness={0.36} metalness={0.18} emissive="#c084fc" emissiveIntensity={0.26} />
        </mesh>
      ) : null}
      {type === "treasure" ? (
        <group position={[0, 0.12, 0.08]}>
          <mesh>
            <boxGeometry args={[0.42, 0.24, 0.2]} />
            <meshStandardMaterial color="#8a4b16" roughness={0.72} />
          </mesh>
          <mesh position={[0, 0.08, 0]}>
            <boxGeometry args={[0.46, 0.08, 0.24]} />
            <meshStandardMaterial color="#f6b73c" roughness={0.42} metalness={0.18} emissive="#f59e0b" emissiveIntensity={0.12} />
          </mesh>
        </group>
      ) : null}
      {type === "shop" ? (
        <group position={[0, 0.12, 0.08]}>
          <mesh>
            <boxGeometry args={[0.44, 0.24, 0.2]} />
            <meshStandardMaterial color="#6b3f1d" roughness={0.75} />
          </mesh>
          <mesh position={[0, 0.17, 0]}>
            <boxGeometry args={[0.5, 0.08, 0.26]} />
            <meshStandardMaterial color="#3b82f6" roughness={0.45} emissive="#60a5fa" emissiveIntensity={0.12} />
          </mesh>
        </group>
      ) : null}
      {type === "boss" ? (
        <group position={[0, 0.16, 0.08]}>
          <mesh>
            <coneGeometry args={[0.25, 0.34, 5]} />
            <meshStandardMaterial color="#1f1215" roughness={0.55} emissive="#7f1d1d" emissiveIntensity={0.32} />
          </mesh>
          <pointLight color="#ef4444" intensity={0.8} distance={1.1} />
        </group>
      ) : null}
      {type === "start" ? (
        <group position={[0, 0.1, 0.08]}>
          <mesh position={[-0.1, 0.04, 0]}>
            <boxGeometry args={[0.06, 0.42, 0.06]} />
            <meshStandardMaterial color="#6b3f1d" roughness={0.72} />
          </mesh>
          <mesh position={[0.09, 0.18, 0]}>
            <boxGeometry args={[0.34, 0.18, 0.04]} />
            <meshStandardMaterial color="#22c55e" roughness={0.55} emissive="#86efac" emissiveIntensity={0.08} />
          </mesh>
        </group>
      ) : null}
      {marks.map(([x, y, width, height], index) => (
        <mesh key={`${type}-${index}`} position={[x, y + 0.04, 0.22]}>
          <planeGeometry args={[width, height]} />
          <meshBasicMaterial color={active ? "#fff3a3" : colors[1]} transparent opacity={offered ? 0.78 : 0.42} />
        </mesh>
      ))}
    </group>
  );
}
