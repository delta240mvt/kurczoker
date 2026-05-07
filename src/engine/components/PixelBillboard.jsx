const ICON_COLORS = {
  start: { top: "#3fbf73", accent: "#dcfce7", trim: "#166534" },
  battle: { top: "#1d6fe8", accent: "#bfdbfe", trim: "#173f8f" },
  elite: { top: "#7c3aed", accent: "#facc15", trim: "#3b1d75" },
  treasure: { top: "#b86f16", accent: "#facc15", trim: "#6b3a0f" },
  shop: { top: "#2f8f5b", accent: "#93c5fd", trim: "#14532d" },
  boss: { top: "#58151c", accent: "#fb923c", trim: "#1f1215" }
};

export function PixelBillboard({ type = "battle", active = false, offered = false, scale = 1 }) {
  const colors = ICON_COLORS[type] ?? ICON_COLORS.battle;
  const muted = !offered && !active;
  const topColor = muted ? "#465568" : colors.top;
  const accentColor = muted ? "#9ca3af" : colors.accent;
  const trimColor = muted ? "#263241" : colors.trim;

  return (
    <group scale={scale}>
      <mesh position={[0, -0.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.26, 0.31, 0.12, 32]} />
        <meshStandardMaterial color="#253042" roughness={0.78} metalness={0.12} />
      </mesh>
      <mesh position={[0, 0.02, 0.02]} rotation={[-Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.2, 0.24, 0.1, 32]} />
        <meshStandardMaterial
          color={topColor}
          roughness={0.42}
          metalness={0.16}
          emissive={active ? "#facc15" : offered ? topColor : "#000000"}
          emissiveIntensity={active ? 0.24 : offered ? 0.08 : 0}
        />
      </mesh>
      {type === "battle" ? (
        <group position={[0, 0.22, 0.04]}>
          <mesh>
            <sphereGeometry args={[0.16, 24, 14]} />
            <meshStandardMaterial color={topColor} roughness={0.32} metalness={0.12} emissive={offered ? "#2563eb" : "#000000"} emissiveIntensity={offered ? 0.18 : 0} />
          </mesh>
          <mesh position={[0.07, 0.05, 0.12]}>
            <sphereGeometry args={[0.04, 10, 8]} />
            <meshBasicMaterial color={accentColor} />
          </mesh>
        </group>
      ) : null}
      {type === "elite" ? (
        <mesh position={[0, 0.23, 0.04]} rotation={[0.35, 0.18, Math.PI / 5]}>
          <icosahedronGeometry args={[0.18, 0]} />
          <meshStandardMaterial color={topColor} roughness={0.3} metalness={0.24} emissive={offered ? "#c084fc" : "#000000"} emissiveIntensity={offered ? 0.22 : 0} />
        </mesh>
      ) : null}
      {type === "treasure" ? (
        <group position={[0, 0.17, 0.04]}>
          <mesh>
            <boxGeometry args={[0.34, 0.2, 0.2]} />
            <meshStandardMaterial color={trimColor} roughness={0.7} />
          </mesh>
          <mesh position={[0, 0.09, 0.01]}>
            <boxGeometry args={[0.38, 0.08, 0.23]} />
            <meshStandardMaterial color={accentColor} roughness={0.34} metalness={0.22} emissive={offered ? "#f59e0b" : "#000000"} emissiveIntensity={offered ? 0.12 : 0} />
          </mesh>
        </group>
      ) : null}
      {type === "shop" ? (
        <group position={[0, 0.16, 0.04]}>
          <mesh>
            <boxGeometry args={[0.34, 0.22, 0.2]} />
            <meshStandardMaterial color={trimColor} roughness={0.72} />
          </mesh>
          <mesh position={[0, 0.16, 0.01]}>
            <boxGeometry args={[0.4, 0.08, 0.23]} />
            <meshStandardMaterial color={accentColor} roughness={0.4} emissive={offered ? "#60a5fa" : "#000000"} emissiveIntensity={offered ? 0.12 : 0} />
          </mesh>
        </group>
      ) : null}
      {type === "boss" ? (
        <group position={[0, 0.18, 0.04]}>
          <mesh>
            <coneGeometry args={[0.18, 0.34, 6]} />
            <meshStandardMaterial color={trimColor} roughness={0.52} emissive={offered ? "#7f1d1d" : "#000000"} emissiveIntensity={offered ? 0.26 : 0} />
          </mesh>
          {offered || active ? <pointLight color="#ef4444" intensity={0.45} distance={0.9} /> : null}
        </group>
      ) : null}
      {type === "start" ? (
        <group position={[0, 0.18, 0.04]}>
          <mesh position={[-0.06, 0.02, 0]}>
            <boxGeometry args={[0.04, 0.34, 0.04]} />
            <meshStandardMaterial color={trimColor} roughness={0.72} />
          </mesh>
          <mesh position={[0.08, 0.13, 0]}>
            <boxGeometry args={[0.24, 0.14, 0.035]} />
            <meshStandardMaterial color={topColor} roughness={0.5} emissive={offered ? "#86efac" : "#000000"} emissiveIntensity={offered ? 0.08 : 0} />
          </mesh>
        </group>
      ) : null}
      {active ? <pointLight color="#facc15" intensity={0.45} distance={0.9} /> : null}
    </group>
  );
}
