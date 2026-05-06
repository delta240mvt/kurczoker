import { ModelAsset } from "./ModelAsset.jsx";

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
  const isBoss = actor.type === "boss" || actor.id?.includes("boss");
  const bodyColor = isEnemy ? "#8b2f40" : "#f0b640";
  const trimColor = isEnemy ? "#f87171" : "#fff2a6";
  const eyeX = isEnemy ? -0.15 : 0.15;
  const modelSrc = isBoss
    ? "/game/assets/models/kurczoker-boss-rooster.glb"
    : isEnemy
      ? "/game/assets/models/kurczoker-enemy-grunt.glb"
      : "/game/assets/models/kurczoker-hero-knight.glb";
  const modelScale = isBoss ? 0.42 : 0.48;

  return (
    <group>
      <mesh position={[0.04, -0.16, -0.1]} scale={[isBoss ? 1.55 : 1, isBoss ? 0.42 : 0.35, 1]}>
        <sphereGeometry args={[0.54, 24, 10]} />
        <meshBasicMaterial color="#0c1824" transparent opacity={0.24} />
      </mesh>
      <group scale={isEnemy ? [-1, 1, 1] : [1, 1, 1]}>
        <ModelAsset src={modelSrc} scale={modelScale} position={[isBoss ? -0.02 : 0, -0.48, -0.02]} rotation={[0, Math.PI / 2, 0]} />
        {active ? (
          <mesh position={[0, 0.48, -0.08]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.46, 0.66, 42]} />
            <meshBasicMaterial color="#facc15" transparent opacity={0.34} />
          </mesh>
        ) : null}
        <mesh visible={false} position={[eyeX, 0.22, 0.31]}>
          <sphereGeometry args={[0.055, 12, 8]} />
          <meshBasicMaterial color={isEnemy ? "#ffe4e6" : "#1f2937"} />
        </mesh>
      </group>
      <HealthPips health={actor.health} maxHealth={actor.maxHealth} team={actor.team} />
    </group>
  );
}
