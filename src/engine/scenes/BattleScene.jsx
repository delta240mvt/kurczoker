import { Physics, RigidBody, CuboidCollider, BallCollider } from "@react-three/rapier";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import { BATTLE_PHASES, ACTOR_TEAMS } from "../../game/constants.js";
import { BattleActor } from "../components/BattleActor.jsx";
import { ModelAsset, preloadModelAsset } from "../components/ModelAsset.jsx";
import { ProjectileArc } from "../components/ProjectileArc.jsx";
import { ExplosionFx } from "../fx/ExplosionFx.jsx";
import { ProjectileTrail } from "../fx/ProjectileTrail.jsx";

const PLAYER_POSITION = [-3.35, -1.1, 0.05];
const ENEMY_POSITION = [3.15, -1.05, 0.05];
const PROJECTILE_ORIGIN = [-2.9, -0.62, 0.12];
const DEFAULT_AIM = { x: 1.4, y: 0.92 };
const GRAVITY_Y = -5.8;
const TERRAIN = [
  { id: "ground", position: [0, -1.9, 0], size: [7.8, 0.42, 0.72], color: "#6f4d2f" },
  { id: "left-rise", position: [-2.75, -1.25, 0], size: [1.45, 0.32, 0.62], color: "#7a5735" },
  { id: "mid-arch", position: [0.18, -0.72, 0], size: [1.7, 0.24, 0.58], color: "#8b6540" },
  { id: "right-rise", position: [2.75, -1.2, 0], size: [1.55, 0.32, 0.62], color: "#755131" }
];

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function getLivingActor(actors, team) {
  return actors.find((actor) => actor.team === team && (actor.health ?? 0) > 0);
}

function PaintedBattleBackdrop() {
  const sparks = [
    [-4.15, 1.45, 0.08, 0.06],
    [-3.38, 1.05, 0.06, 0.04],
    [3.95, 1.32, 0.07, 0.05],
    [4.38, 0.82, 0.06, 0.04],
    [0.2, 1.78, 0.04, 0.035]
  ];

  return (
    <group position={[0, 0, -0.82]}>
      <mesh position={[-3.42, -0.05, -0.08]}>
        <boxGeometry args={[0.36, 1.8, 0.08]} />
        <meshStandardMaterial color="#4a2a13" roughness={0.82} />
      </mesh>
      <mesh position={[-3.42, 0.72, -0.02]}>
        <planeGeometry args={[0.95, 0.88]} />
        <meshBasicMaterial color="#8f1e14" />
      </mesh>
      <mesh position={[3.62, -0.05, -0.08]}>
        <boxGeometry args={[0.36, 1.8, 0.08]} />
        <meshStandardMaterial color="#4a2a13" roughness={0.82} />
      </mesh>
      <mesh position={[3.62, 0.72, -0.02]}>
        <planeGeometry args={[0.95, 0.88]} />
        <meshBasicMaterial color="#8f1e14" />
      </mesh>
      <mesh position={[0, -1.72, -0.04]}>
        <planeGeometry args={[8.6, 1.2]} />
        <meshBasicMaterial color="#342311" transparent opacity={0.38} />
      </mesh>
      <mesh position={[0, 1.55, 0]}>
        <planeGeometry args={[8.9, 0.42]} />
        <meshBasicMaterial color="#f9d783" transparent opacity={0.14} />
      </mesh>
      <ModelAsset src="/game/assets/models/kurczoker-map-props.glb" scale={0.24} position={[2.55, -0.02, 0.02]} rotation={[0, -0.28, 0]} />
      <ModelAsset src="/game/assets/models/kurczoker-diorama-props.glb" scale={0.18} position={[0.18, -0.38, 0.05]} rotation={[0, -0.16, 0]} />
      {sparks.map(([x, y, z, scale], index) => (
        <mesh key={`spark-${index}`} position={[x, y, z]} scale={scale}>
          <sphereGeometry args={[1, 12, 8]} />
          <meshBasicMaterial color={index % 2 ? "#f97316" : "#facc15"} transparent opacity={0.78} />
        </mesh>
      ))}
    </group>
  );
}

function TerrainPlatform({ platform }) {
  return (
    <RigidBody type="fixed" colliders={false} position={platform.position}>
      <CuboidCollider args={[platform.size[0] / 2, platform.size[1] / 2, platform.size[2] / 2]} friction={1.2} restitution={0.08} />
      <mesh>
        <boxGeometry args={platform.size} />
        <meshStandardMaterial color={platform.color} roughness={0.64} metalness={0.04} />
      </mesh>
      <mesh position={[0, platform.size[1] / 2 + 0.025, 0.01]}>
        <boxGeometry args={[platform.size[0] * 0.96, 0.05, platform.size[2] * 0.9]} />
        <meshStandardMaterial color="#9dc46b" roughness={0.7} />
      </mesh>
      <mesh position={[0, -platform.size[1] / 2 - 0.045, 0.025]}>
        <boxGeometry args={[platform.size[0] * 0.86, 0.09, platform.size[2] * 0.78]} />
        <meshStandardMaterial color="#2b2117" roughness={0.86} />
      </mesh>
    </RigidBody>
  );
}

function ProjectileBody({ projectile, enemy, onImpact, onTrail }) {
  const bodyRef = useRef(null);
  const resolvedRef = useRef(false);

  function resolveProjectileImpact(position) {
    if (enemy && projectile.targetEnemy) {
      onImpact({ type: "enemy", actorId: enemy.id, position });
      return;
    }

    if (enemy) {
      const dx = position[0] - ENEMY_POSITION[0];
      const dy = position[1] - ENEMY_POSITION[1];
      if (Math.hypot(dx, dy) <= 1.45) {
        onImpact({ type: "enemy", actorId: enemy.id, position });
        return;
      }
    }

    onImpact({ type: "terrain", position });
  }

  useEffect(() => {
    if (!bodyRef.current) return;
    bodyRef.current.applyImpulse({ x: projectile.impulse.x, y: projectile.impulse.y, z: 0 }, true);
    bodyRef.current.applyTorqueImpulse({ x: 0, y: 0, z: -0.32 }, true);
  }, [projectile.impulse.x, projectile.impulse.y]);

  useFrame(() => {
    if (!bodyRef.current || resolvedRef.current) return;
    const translation = bodyRef.current.translation();
    const position = [translation.x, translation.y, translation.z];
    onTrail(position);

    if (translation.y < -2.35 || translation.x > 4.6 || translation.x < -4.2) {
      resolvedRef.current = true;
      resolveProjectileImpact(position);
    }
  });

  return (
    <RigidBody
      ref={bodyRef}
      position={projectile.origin}
      colliders={false}
      gravityScale={1}
      linearDamping={0.02}
      angularDamping={0.05}
      ccd
      lockRotations={false}
      onCollisionEnter={() => {
        if (resolvedRef.current) return;
        const translation = bodyRef.current?.translation();
        resolvedRef.current = true;
        resolveProjectileImpact(translation ? [translation.x, translation.y, translation.z] : projectile.origin);
      }}
    >
      <BallCollider
        args={[0.14]}
        restitution={0.18}
        friction={0.82}
        onIntersectionEnter={(payload) => {
          if (resolvedRef.current || !enemy || payload.other.colliderObject?.name !== "enemy-hit-sensor") return;
          const translation = bodyRef.current?.translation();
          resolvedRef.current = true;
          onImpact({ type: "enemy", actorId: enemy.id, position: translation ? [translation.x, translation.y, translation.z] : projectile.origin });
        }}
      />
      <mesh>
        <sphereGeometry args={[0.16, 24, 16]} />
        <meshStandardMaterial color="#fff1b5" roughness={0.34} metalness={0.04} emissive="#fb923c" emissiveIntensity={0.22} />
      </mesh>
      <mesh position={[0.05, 0.04, 0.09]}>
        <sphereGeometry args={[0.045, 10, 8]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.76} />
      </mesh>
    </RigidBody>
  );
}

export function BattleScene({ game, aim, setAim, projectileHitEnemy, turnEnded }) {
  const battle = game.battle;
  const player = useMemo(() => getLivingActor(battle?.actors ?? [], ACTOR_TEAMS.PLAYER), [battle?.actors]);
  const enemy = useMemo(() => getLivingActor(battle?.actors ?? [], ACTOR_TEAMS.ENEMY), [battle?.actors]);
  const [projectile, setProjectile] = useState(null);
  const [trail, setTrail] = useState([]);
  const [explosion, setExplosion] = useState(null);
  const playerTurn = battle?.phase === BATTLE_PHASES.PLAYER_TURN;
  const activeAim = aim?.x ? aim : DEFAULT_AIM;

  function updateAimFromPoint(point) {
    if (!playerTurn || projectile) return;
    setAim({
      x: clamp(point.x - PROJECTILE_ORIGIN[0], 0.75, 2.3),
      y: clamp(point.y - PROJECTILE_ORIGIN[1], 0.32, 1.72)
    });
  }

  function fireProjectile(point) {
    if (!playerTurn || projectile) return;
    updateAimFromPoint(point);
    const nextAim = {
      x: clamp(point.x - PROJECTILE_ORIGIN[0], 0.75, 2.3),
      y: clamp(point.y - PROJECTILE_ORIGIN[1], 0.32, 1.72)
    };
    const length = Math.hypot(nextAim.x, nextAim.y) || 1;
    setTrail([]);
    setProjectile({
      id: `egg-${Date.now()}`,
      origin: PROJECTILE_ORIGIN,
      impulse: { x: (nextAim.x / length) * 4.35, y: (nextAim.y / length) * 4.35 },
      targetEnemy: point.x > 0.65
    });
  }

  function resolveImpact(impact) {
    setProjectile(null);
    setExplosion({ id: `boom-${Date.now()}`, position: impact.position });
    setTrail([]);
    if (impact.type === "enemy") {
      projectileHitEnemy({ actorId: impact.actorId });
    } else {
      turnEnded();
    }
  }

  return (
    <group
      onPointerMove={(event) => updateAimFromPoint(event.point)}
      onClick={(event) => {
        event.stopPropagation();
        fireProjectile(event.point);
      }}
    >
      <mesh position={[0, 0, -0.76]} raycast={undefined}>
        <planeGeometry args={[9.6, 5.4]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <PaintedBattleBackdrop />
      <ModelAsset src="/game/assets/models/kurczoker-terrain-kit.glb" scale={0.22} position={[0, -2.12, -0.02]} rotation={[0, 0, 0]} />
      <Physics gravity={[0, GRAVITY_Y, 0]} timeStep={1 / 60} interpolation={false}>
        {TERRAIN.map((platform) => (
          <TerrainPlatform key={platform.id} platform={platform} />
        ))}
        {player ? (
          <RigidBody type="fixed" colliders={false} position={PLAYER_POSITION}>
            <CuboidCollider name="player-body-sensor" args={[0.32, 0.48, 0.28]} sensor />
            <BattleActor actor={player} active={playerTurn} side="left" />
          </RigidBody>
        ) : null}
        {enemy ? (
          <RigidBody type="fixed" colliders={false} position={ENEMY_POSITION}>
            <CuboidCollider name="enemy-hit-sensor" args={[0.34, 0.48, 0.28]} sensor />
            <BattleActor actor={enemy} side="right" />
          </RigidBody>
        ) : null}
        {projectile ? (
          <ProjectileBody
            key={projectile.id}
            projectile={projectile}
            enemy={enemy}
            onImpact={resolveImpact}
            onTrail={(point) => setTrail((points) => [...points.slice(-9), point])}
          />
        ) : null}
      </Physics>
      {playerTurn && !projectile ? <ProjectileArc origin={PROJECTILE_ORIGIN} aim={activeAim} gravity={GRAVITY_Y} /> : null}
      {trail.length > 0 ? <ProjectileTrail points={trail} /> : null}
      {explosion ? <ExplosionFx key={explosion.id} position={explosion.position} onDone={() => setExplosion(null)} /> : null}
    </group>
  );
}

preloadModelAsset("/game/assets/models/kurczoker-hero-knight.glb");
preloadModelAsset("/game/assets/models/kurczoker-enemy-grunt.glb");
preloadModelAsset("/game/assets/models/kurczoker-boss-rooster.glb");
preloadModelAsset("/game/assets/models/kurczoker-terrain-kit.glb");
preloadModelAsset("/game/assets/models/kurczoker-diorama-props.glb");
