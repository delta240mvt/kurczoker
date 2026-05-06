function HealthPips({ health = 0, maxHealth = 0, team }) {
  const pips = Array.from({ length: Math.max(maxHealth, health, 1) });
  const filledColor = team === "enemy" ? "#ef4444" : "#46d58c";

  return (
    <group position={[0, 0.95, 0.08]}>
      {pips.map((_, index) => (
        <mesh key={index} position={[(index - (pips.length - 1) / 2) * 0.16, 0, 0]}>
          <boxGeometry args={[0.1, 0.1, 0.04]} />
          <meshStandardMaterial color={index < health ? filledColor : "#2f3544"} emissive={index < health ? filledColor : "#000000"} emissiveIntensity={0.18} />
        </mesh>
      ))}
    </group>
  );
}

export function BattleActor({ actor, side = "left", active = false }) {
  const isEnemy = actor.team === "enemy" || side === "right";
  const bodyColor = isEnemy ? "#8b2f40" : "#f0b640";
  const trimColor = isEnemy ? "#f87171" : "#fff2a6";
  const eyeX = isEnemy ? -0.15 : 0.15;

  return (
    <group>
      <mesh position={[0.04, -0.16, -0.1]} scale={[1, 0.35, 1]}>
        <sphereGeometry args={[0.54, 24, 10]} />
        <meshBasicMaterial color="#0c1824" transparent opacity={0.24} />
      </mesh>
      <group scale={isEnemy ? [-1, 1, 1] : [1, 1, 1]}>
        <mesh position={[0, 0.05, 0]}>
          <capsuleGeometry args={[0.32, 0.55, 8, 24]} />
          <meshStandardMaterial color={bodyColor} roughness={0.48} metalness={0.04} emissive={active ? "#facc15" : "#000000"} emissiveIntensity={active ? 0.12 : 0} />
        </mesh>
        <mesh position={[0.08, 0.44, 0.08]} rotation={[0, 0, -0.26]}>
          <coneGeometry args={[0.22, 0.44, 5]} />
          <meshStandardMaterial color={trimColor} roughness={0.38} metalness={0.08} />
        </mesh>
        <mesh position={[eyeX, 0.22, 0.31]}>
          <sphereGeometry args={[0.055, 12, 8]} />
          <meshBasicMaterial color={isEnemy ? "#ffe4e6" : "#1f2937"} />
        </mesh>
        <mesh position={[0.28, -0.03, 0.05]} rotation={[0, 0, -0.62]}>
          <capsuleGeometry args={[0.07, 0.28, 6, 12]} />
          <meshStandardMaterial color={trimColor} roughness={0.52} />
        </mesh>
      </group>
      <HealthPips health={actor.health} maxHealth={actor.maxHealth} team={actor.team} />
    </group>
  );
}
