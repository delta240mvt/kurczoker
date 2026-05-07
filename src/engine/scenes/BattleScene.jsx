import { Physics, RigidBody, CuboidCollider, BallCollider } from "@react-three/rapier";
import { useFrame, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { BATTLE_PHASES, ACTOR_TEAMS } from "../../game/constants.js";
import { BattleActor } from "../components/BattleActor.jsx";
import { ModelAsset } from "../components/ModelAsset.jsx";
import { ProjectileArc } from "../components/ProjectileArc.jsx";
import { ExplosionFx } from "../fx/ExplosionFx.jsx";
import { ProjectileTrail } from "../fx/ProjectileTrail.jsx";
import { aimToThrow, clampAim } from "../runtime/throwDynamics.js";

const DEFAULT_AIM = { x: 1.4, y: 0.92 };
const GRAVITY_Y = -5.8;
const WORLD_WIDTH = 960;
const WORLD_HEIGHT = 540;
const ARENA_Y_OFFSET = 1.62;
const WORLD_ASSET_BASE = "/game/assets/models/hyper3d-clean";
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

function actorToScene(actor, z = 0.05) {
  if (!actor) return [0, 0, z];
  const centerX = (actor.x ?? 0) + (actor.width ?? 0) / 2;
  const bottomY = (actor.y ?? 0) + (actor.height ?? 0);
  return [(centerX / WORLD_WIDTH) * 9.6 - 4.8, 2.7 - (bottomY / WORLD_HEIGHT) * 5.4 + 0.34 + ARENA_Y_OFFSET, z];
}

function playerProjectileOrigin(playerPosition) {
  return [playerPosition[0] + 0.48, playerPosition[1] + 0.54, playerPosition[2] + 0.1];
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
      <Suspense fallback={null}>
        <group position={[0, -0.28, -0.16]} rotation={[-0.16, 0, 0]} scale={5.65}>
          <ModelAsset src={`${WORLD_ASSET_BASE}/clean-battle-arena.glb`} scale={1} />
        </group>
        <ModelAsset src={`${WORLD_ASSET_BASE}/clean-windmill.glb`} scale={0.64} position={[-4.05, 0.45, -0.05]} rotation={[0, 0.18, 0]} />
        <ModelAsset src={`${WORLD_ASSET_BASE}/clean-castle.glb`} scale={0.68} position={[4.05, 0.76, -0.08]} rotation={[0, -0.35, 0]} />
        <ModelAsset src={`${WORLD_ASSET_BASE}/clean-platform.glb`} scale={1.12} position={[0.2, -0.55, 0.1]} rotation={[0, -0.1, 0]} />
      </Suspense>
      <mesh position={[0, -1.72, -0.04]}>
        <planeGeometry args={[8.6, 1.2]} />
        <meshBasicMaterial color="#342311" transparent opacity={0.38} />
      </mesh>
      <mesh position={[0, 1.55, 0]}>
        <planeGeometry args={[8.9, 0.42]} />
        <meshBasicMaterial color="#f9d783" transparent opacity={0.14} />
      </mesh>
      <mesh position={[-3.62, -1.38, 0.05]} rotation={[-Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.22, 0.34, 0.12, 20]} />
        <meshStandardMaterial color="#47523a" roughness={0.78} transparent opacity={0.58} />
      </mesh>
      <mesh position={[3.58, -1.35, 0.05]} rotation={[-Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.24, 0.38, 0.12, 20]} />
        <meshStandardMaterial color="#4b3a2b" roughness={0.78} transparent opacity={0.5} />
      </mesh>
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
      <mesh visible={false}>
        <boxGeometry args={platform.size} />
        <meshStandardMaterial color={platform.color} roughness={0.64} metalness={0.04} transparent opacity={0.64} />
      </mesh>
      <mesh position={[0, platform.size[1] / 2 + 0.025, 0.01]} visible={false}>
        <boxGeometry args={[platform.size[0] * 0.96, 0.05, platform.size[2] * 0.9]} />
        <meshStandardMaterial color="#9dc46b" roughness={0.7} transparent opacity={0.82} />
      </mesh>
      <mesh position={[0, -platform.size[1] / 2 - 0.045, 0.025]} visible={false}>
        <boxGeometry args={[platform.size[0] * 0.86, 0.09, platform.size[2] * 0.78]} />
        <meshStandardMaterial color="#2b2117" roughness={0.86} transparent opacity={0.5} />
      </mesh>
    </RigidBody>
  );
}

function ProjectileBody({ projectile, enemy, enemyPosition, onImpact, onTrail }) {
  const bodyRef = useRef(null);
  const eggRef = useRef(null);
  const resolvedRef = useRef(false);

  function resolveProjectileImpact(position) {
    if (enemy && projectile.targetEnemy) {
      onImpact({ type: "enemy", actorId: enemy.id, position });
      return;
    }

    if (enemy) {
      const dx = position[0] - enemyPosition[0];
      const dy = position[1] - enemyPosition[1];
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
    bodyRef.current.applyTorqueImpulse({ x: 0, y: 0, z: -0.5 - projectile.charge * 0.72 }, true);
  }, [projectile.impulse.x, projectile.impulse.y]);

  useFrame(() => {
    if (!bodyRef.current || resolvedRef.current) return;
    const translation = bodyRef.current.translation();
    const position = [translation.x, translation.y, translation.z];
    onTrail(position);
    if (eggRef.current) {
      eggRef.current.rotation.z -= 0.18 + projectile.charge * 0.18;
      eggRef.current.rotation.x += 0.05;
    }

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
      <group ref={eggRef} scale={1 + projectile.charge * 0.12}>
        <mesh scale={[0.86, 1.18, 0.86]}>
          <sphereGeometry args={[0.18, 32, 20]} />
          <meshStandardMaterial color="#fff1b5" roughness={0.3} metalness={0.04} emissive="#fb923c" emissiveIntensity={0.18 + projectile.charge * 0.24} />
        </mesh>
        <mesh position={[0.05, 0.04, 0.09]}>
          <sphereGeometry args={[0.045, 10, 8]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.76} />
        </mesh>
        {[[-0.07, 0.06, 0.11], [0.08, -0.05, 0.12], [0.01, 0.11, 0.09], [-0.03, -0.12, -0.02]].map((spot, index) => (
          <mesh key={`egg-spot-${index}`} position={spot}>
            <sphereGeometry args={[0.033, 10, 8]} />
            <meshStandardMaterial color="#4b8fd6" roughness={0.45} />
          </mesh>
        ))}
        <mesh position={[-0.16, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <coneGeometry args={[0.07, 0.22, 16]} />
          <meshBasicMaterial color="#f97316" transparent opacity={0.42 + projectile.charge * 0.22} />
        </mesh>
      </group>
      <pointLight color="#facc15" intensity={1.05 + projectile.charge * 0.7} distance={1.4 + projectile.charge * 0.6} />
    </RigidBody>
  );
}

export function BattleScene({ game, aim, setAim, setMovement, setJump, projectileHitEnemy, turnEnded }) {
  const { gl } = useThree();
  const battle = game.battle;
  const player = useMemo(() => getLivingActor(battle?.actors ?? [], ACTOR_TEAMS.PLAYER), [battle?.actors]);
  const enemy = useMemo(() => getLivingActor(battle?.actors ?? [], ACTOR_TEAMS.ENEMY), [battle?.actors]);
  const [projectile, setProjectile] = useState(null);
  const [trail, setTrail] = useState([]);
  const [explosion, setExplosion] = useState(null);
  const [gesture, setGesture] = useState(null);
  const playerTurn = battle?.phase === BATTLE_PHASES.PLAYER_TURN;
  const playerPosition = useMemo(() => actorToScene(player), [player]);
  const enemyPosition = useMemo(() => actorToScene(enemy), [enemy]);
  const projectileOrigin = useMemo(() => playerProjectileOrigin(playerPosition), [playerPosition]);
  const activeAim = aim?.x ? aim : DEFAULT_AIM;

  function updateAimFromPoint(point) {
    if (!playerTurn || projectile) return;
    setAim(clampAim({ x: point.x - projectileOrigin[0], y: point.y - projectileOrigin[1] }));
  }

  function fireProjectile(point) {
    if (!playerTurn || projectile) return;
    updateAimFromPoint(point);
    const throwState = aimToThrow({ x: point.x - projectileOrigin[0], y: point.y - projectileOrigin[1] });
    setTrail([]);
    setProjectile({
      id: `egg-${Date.now()}`,
      origin: projectileOrigin,
      impulse: throwState.impulse,
      charge: throwState.charge,
      targetEnemy: point.x > enemyPosition[0] - 0.65
    });
  }

  function isNearPlayer(point) {
    return Math.hypot(point.x - playerPosition[0], point.y - (playerPosition[1] + 0.34)) < 0.92;
  }

  function updateMovementFromPoint(point) {
    if (!playerTurn || projectile) return;
    const deltaX = point.x - playerPosition[0];
    setMovement(Math.abs(deltaX) < 0.18 ? 0 : deltaX > 0 ? 1 : -1);
    setJump(point.y > playerPosition[1] + 0.82);
  }

  function pointFromClient(clientX, clientY) {
    const rect = gl.domElement.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * 9.6 - 4.8,
      y: 2.7 - ((clientY - rect.top) / rect.height) * 5.4,
      z: 0
    };
  }

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.code === "ArrowLeft" || event.code === "KeyA") setMovement(-1);
      if (event.code === "ArrowRight" || event.code === "KeyD") setMovement(1);
      if (event.code === "ArrowUp" || event.code === "KeyW") setJump(true);
    }

    function handleKeyUp(event) {
      if (event.code === "ArrowLeft" || event.code === "KeyA" || event.code === "ArrowRight" || event.code === "KeyD") setMovement(0);
      if (event.code === "ArrowUp" || event.code === "KeyW") setJump(false);
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      setMovement(0);
      setJump(false);
    };
  }, [setJump, setMovement]);

  useEffect(() => {
    if (typeof navigator === "undefined" || navigator.maxTouchPoints <= 0) return undefined;

    const canvas = gl.domElement;
    let touchGesture = null;

    function getTouchPoint(event) {
      const touch = event.changedTouches?.[0] ?? event.touches?.[0];
      return touch ? pointFromClient(touch.clientX, touch.clientY) : null;
    }

    function handleTouchStart(event) {
      const point = getTouchPoint(event);
      if (!point) return;
      event.preventDefault();
      touchGesture = isNearPlayer(point) ? "move" : "aim";
      setGesture(touchGesture);
      if (touchGesture === "move") updateMovementFromPoint(point);
      else updateAimFromPoint(point);
    }

    function handleTouchMove(event) {
      const point = getTouchPoint(event);
      if (!point || !touchGesture) return;
      event.preventDefault();
      if (touchGesture === "move") updateMovementFromPoint(point);
      else updateAimFromPoint(point);
    }

    function handleTouchEnd(event) {
      const point = getTouchPoint(event);
      if (!point || !touchGesture) return;
      event.preventDefault();
      if (touchGesture === "move") {
        setMovement(0);
        setJump(false);
      } else {
        fireProjectile(point);
      }
      touchGesture = null;
      setGesture(null);
    }

    function handleTouchCancel(event) {
      event.preventDefault();
      touchGesture = null;
      setGesture(null);
      setMovement(0);
      setJump(false);
    }

    canvas.addEventListener("touchstart", handleTouchStart, { passive: false });
    canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
    canvas.addEventListener("touchend", handleTouchEnd, { passive: false });
    canvas.addEventListener("touchcancel", handleTouchCancel, { passive: false });

    return () => {
      canvas.removeEventListener("touchstart", handleTouchStart);
      canvas.removeEventListener("touchmove", handleTouchMove);
      canvas.removeEventListener("touchend", handleTouchEnd);
      canvas.removeEventListener("touchcancel", handleTouchCancel);
    };
  }, [gl, playerTurn, projectile, playerPosition, projectileOrigin, enemyPosition, setAim, setMovement, setJump]);

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
      onPointerDown={(event) => {
        event.stopPropagation();
        const mode = isNearPlayer(event.point) ? "move" : "aim";
        setGesture(mode);
        if (mode === "move") updateMovementFromPoint(event.point);
        else updateAimFromPoint(event.point);
      }}
      onPointerMove={(event) => {
        if (gesture === "move") updateMovementFromPoint(event.point);
        else updateAimFromPoint(event.point);
      }}
      onPointerUp={(event) => {
        event.stopPropagation();
        if (gesture === "move") {
          setMovement(0);
          setJump(false);
        } else {
          fireProjectile(event.point);
        }
        setGesture(null);
      }}
    >
      <mesh position={[0, 0, -0.76]} raycast={undefined}>
        <planeGeometry args={[9.6, 5.4]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <PaintedBattleBackdrop />
      <Physics gravity={[0, GRAVITY_Y, 0]} timeStep={1 / 60} interpolation={false}>
        {TERRAIN.map((platform) => (
          <TerrainPlatform key={platform.id} platform={platform} />
        ))}
        {player ? (
          <RigidBody type="fixed" colliders={false} position={playerPosition}>
            <CuboidCollider name="player-body-sensor" args={[0.32, 0.48, 0.28]} sensor />
            <BattleActor actor={player} active={playerTurn} side="left" />
          </RigidBody>
        ) : null}
        {enemy ? (
          <RigidBody type="fixed" colliders={false} position={enemyPosition}>
            <CuboidCollider name="enemy-hit-sensor" args={[0.34, 0.48, 0.28]} sensor />
            <BattleActor actor={enemy} side="right" />
          </RigidBody>
        ) : null}
        {projectile ? (
          <ProjectileBody
            key={projectile.id}
            projectile={projectile}
            enemy={enemy}
            enemyPosition={enemyPosition}
            onImpact={resolveImpact}
            onTrail={(point) => setTrail((points) => [...points.slice(-18), point])}
          />
        ) : null}
      </Physics>
      {playerTurn && !projectile ? <ProjectileArc origin={projectileOrigin} aim={activeAim} gravity={GRAVITY_Y} charging={gesture === "aim"} /> : null}
      {trail.length > 0 ? <ProjectileTrail points={trail} /> : null}
      {explosion ? <ExplosionFx key={explosion.id} position={explosion.position} onDone={() => setExplosion(null)} /> : null}
    </group>
  );
}
