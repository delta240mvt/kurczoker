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

function HeroFigure({ active }) {
  return (
    <group>
      <mesh position={[0, -0.02, 0]} scale={[0.82, 1, 0.72]}>
        <sphereGeometry args={[0.42, 32, 18]} />
        <meshStandardMaterial color="#f3ead3" roughness={0.58} />
      </mesh>
      <mesh position={[0.06, 0.42, 0.02]} scale={[0.74, 0.68, 0.66]}>
        <sphereGeometry args={[0.36, 32, 18]} />
        <meshStandardMaterial color="#fff6df" roughness={0.54} />
      </mesh>
      <mesh position={[0.43, 0.43, 0.02]} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[0.13, 0.34, 24]} />
        <meshStandardMaterial color="#f59e0b" roughness={0.44} />
      </mesh>
      <mesh position={[0.22, 0.72, 0.02]} scale={[0.72, 0.22, 0.56]}>
        <sphereGeometry args={[0.34, 24, 10]} />
        <meshStandardMaterial color="#8b929b" roughness={0.34} metalness={0.32} />
      </mesh>
      <mesh position={[0.08, 0.88, 0.02]} rotation={[0, 0, -0.38]}>
        <coneGeometry args={[0.07, 0.34, 14]} />
        <meshStandardMaterial color="#cf2f1b" roughness={0.62} />
      </mesh>
      <mesh position={[0.16, 0.2, 0.28]} scale={[0.28, 0.18, 0.12]}>
        <sphereGeometry args={[0.42, 24, 12]} />
        <meshStandardMaterial color="#efe5c9" roughness={0.58} />
      </mesh>
      <mesh position={[0.48, 0.18, 0.32]} scale={[0.85, 1.08, 0.82]}>
        <sphereGeometry args={[0.16, 22, 12]} />
        <meshStandardMaterial color="#f6e5a9" roughness={0.42} emissive="#f59e0b" emissiveIntensity={active ? 0.12 : 0.04} />
      </mesh>
      {[[0.44, 0.2, 0.45], [0.54, 0.12, 0.37], [0.5, 0.28, 0.36]].map((spot, index) => (
        <mesh key={index} position={spot}>
          <sphereGeometry args={[0.033, 10, 6]} />
          <meshStandardMaterial color="#3b82f6" roughness={0.48} />
        </mesh>
      ))}
      <mesh position={[-0.24, 0.04, 0.12]} scale={[0.24, 0.42, 0.13]}>
        <sphereGeometry args={[0.46, 24, 12]} />
        <meshStandardMaterial color="#ddd2b6" roughness={0.62} />
      </mesh>
      <mesh position={[-0.2, -0.34, 0.1]} rotation={[0.4, 0, 0]}>
        <cylinderGeometry args={[0.035, 0.035, 0.44, 10]} />
        <meshStandardMaterial color="#f59e0b" roughness={0.46} />
      </mesh>
      <mesh position={[0.14, -0.34, 0.1]} rotation={[0.4, 0, 0]}>
        <cylinderGeometry args={[0.035, 0.035, 0.44, 10]} />
        <meshStandardMaterial color="#f59e0b" roughness={0.46} />
      </mesh>
      <mesh position={[0.23, 0.53, 0.32]}>
        <sphereGeometry args={[0.045, 12, 8]} />
        <meshBasicMaterial color="#111827" />
      </mesh>
      <pointLight position={[0.48, 0.32, 0.42]} color="#facc15" intensity={0.6} distance={1.2} />
    </group>
  );
}

function EnemyFigure({ boss = false }) {
  const scale = boss ? 1.36 : 1;
  return (
    <group scale={scale}>
      <mesh position={[0, 0, 0]} scale={[0.86, 1, 0.74]}>
        <sphereGeometry args={[0.42, 32, 18]} />
        <meshStandardMaterial color={boss ? "#151018" : "#a72b25"} roughness={0.56} emissive={boss ? "#5b1111" : "#000000"} emissiveIntensity={boss ? 0.18 : 0} />
      </mesh>
      <mesh position={[0.08, 0.45, 0.02]} scale={[0.72, 0.66, 0.62]}>
        <sphereGeometry args={[0.34, 32, 18]} />
        <meshStandardMaterial color={boss ? "#20151d" : "#b93528"} roughness={0.55} />
      </mesh>
      <mesh position={[0.42, 0.44, 0.02]} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[0.12, 0.3, 22]} />
        <meshStandardMaterial color="#f59e0b" roughness={0.42} />
      </mesh>
      {[[-0.18, 0.78, 0.02], [0.02, 0.84, 0.02], [0.18, 0.76, 0.02]].map((pos, index) => (
        <mesh key={index} position={pos} rotation={[0, 0, index === 1 ? 0 : index ? -0.34 : 0.34]}>
          <coneGeometry args={[0.08, boss ? 0.42 : 0.28, 12]} />
          <meshStandardMaterial color="#dc2626" roughness={0.56} emissive={boss ? "#ef4444" : "#000000"} emissiveIntensity={boss ? 0.16 : 0} />
        </mesh>
      ))}
      {[-0.2, 0.2].map((z, index) => (
        <mesh key={index} position={[-0.18 - index * 0.06, 0.1 + index * 0.04, z]} scale={[0.22, 0.5, 0.1]} rotation={[0, 0, 0.35]}>
          <sphereGeometry args={[0.42, 20, 10]} />
          <meshStandardMaterial color={boss ? "#0f172a" : "#7f1d1d"} roughness={0.66} />
        </mesh>
      ))}
      <mesh position={[0.08, 0.06, 0.34]} scale={[0.46, 0.2, 0.15]}>
        <sphereGeometry args={[0.42, 24, 12]} />
        <meshStandardMaterial color={boss ? "#a16207" : "#52525b"} roughness={0.34} metalness={0.38} />
      </mesh>
      <mesh position={[0.25, 0.56, 0.31]}>
        <sphereGeometry args={[0.052, 14, 8]} />
        <meshStandardMaterial color="#fff7ed" emissive="#f97316" emissiveIntensity={0.65} />
      </mesh>
      <mesh position={[-0.18, -0.34, 0.1]} rotation={[0.4, 0, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.42, 10]} />
        <meshStandardMaterial color="#f59e0b" roughness={0.46} />
      </mesh>
      <mesh position={[0.14, -0.34, 0.1]} rotation={[0.4, 0, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.42, 10]} />
        <meshStandardMaterial color="#f59e0b" roughness={0.46} />
      </mesh>
      {boss ? <pointLight position={[0.2, 0.4, 0.35]} color="#ef4444" intensity={1.2} distance={1.6} /> : null}
    </group>
  );
}

export function BattleActor({ actor, side = "left", active = false }) {
  const isEnemy = actor.team === "enemy" || side === "right";
  const isBoss = actor.type === "boss" || actor.id?.includes("boss");

  return (
    <group>
      <mesh position={[0.04, -0.16, -0.1]} scale={[isBoss ? 1.55 : 1, isBoss ? 0.42 : 0.35, 1]}>
        <sphereGeometry args={[0.54, 24, 10]} />
        <meshBasicMaterial color="#0c1824" transparent opacity={0.24} />
      </mesh>
      <group scale={isEnemy ? [-1, 1, 1] : [1, 1, 1]}>
        <group position={[0, -0.48, 0.02]}>
          {isEnemy ? <EnemyFigure boss={isBoss} /> : <HeroFigure active={active} />}
        </group>
        {active ? (
          <mesh position={[0, 0.48, -0.08]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.46, 0.66, 42]} />
            <meshBasicMaterial color="#facc15" transparent opacity={0.34} />
          </mesh>
        ) : null}
      </group>
      <HealthPips health={actor.health} maxHealth={actor.maxHealth} team={actor.team} />
    </group>
  );
}
