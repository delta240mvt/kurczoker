import { lazy, Suspense, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { CameraRig } from "./components/CameraRig.jsx";
import { SceneLights } from "./components/SceneLights.jsx";
import { MapScene } from "./scenes/MapScene.jsx";
import { selectEngineScene } from "./runtime/sceneSelection.js";
import { useGameStore } from "./store/useGameStore.js";

const BattleScene = lazy(() => import("./scenes/BattleScene.jsx").then((module) => ({ default: module.BattleScene })));

const SCENE_PLACEHOLDERS = {
  battle: { color: "#d95f43", position: [0, -0.15, 0], scale: [2.4, 1.1, 0.45] },
  reward: { color: "#58b368", position: [0, 0.1, 0], scale: [1.45, 1.9, 0.35] },
  end: { color: "#7c6f9e", position: [0, 0, 0], scale: [2, 1.35, 0.3] }
};

function ScenePlaceholder({ engineScene }) {
  const placeholder = SCENE_PLACEHOLDERS[engineScene] ?? SCENE_PLACEHOLDERS.battle;

  return (
    <mesh rotation={[0.45, 0.65, 0]} position={placeholder.position} scale={placeholder.scale}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={placeholder.color} roughness={0.42} metalness={0.08} />
    </mesh>
  );
}

function BattleSceneLoading() {
  const ringRef = useRef(null);
  const coreRef = useRef(null);

  useFrame(({ clock }, delta) => {
    if (ringRef.current) {
      ringRef.current.rotation.z += delta * 1.6;
    }

    if (coreRef.current) {
      const pulse = 1 + Math.sin(clock.elapsedTime * 6) * 0.055;
      coreRef.current.scale.set(pulse, pulse, pulse);
    }
  });

  return (
    <group position={[0, -0.04, 0]}>
      <mesh position={[0, 0, -0.7]}>
        <planeGeometry args={[9.6, 5.4]} />
        <meshBasicMaterial color="#15233b" />
      </mesh>
      <mesh position={[0, -1.62, -0.08]}>
        <boxGeometry args={[7.8, 0.32, 0.46]} />
        <meshStandardMaterial color="#6f4d2f" roughness={0.64} metalness={0.04} />
      </mesh>
      <group ref={ringRef} position={[0, 0.12, 0]}>
        <mesh>
          <torusGeometry args={[0.82, 0.045, 12, 48]} />
          <meshStandardMaterial color="#f8d36c" emissive="#facc15" emissiveIntensity={0.34} roughness={0.36} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.82, 0.045, 12, 48]} />
          <meshStandardMaterial color="#f97316" emissive="#fb923c" emissiveIntensity={0.2} roughness={0.42} />
        </mesh>
      </group>
      <mesh ref={coreRef} position={[0, 0.12, 0.08]}>
        <sphereGeometry args={[0.34, 32, 20]} />
        <meshStandardMaterial color="#fff1b5" emissive="#fb923c" emissiveIntensity={0.28} roughness={0.32} metalness={0.04} />
      </mesh>
      <mesh position={[-2.9, -0.86, 0.06]}>
        <boxGeometry args={[0.52, 0.88, 0.36]} />
        <meshStandardMaterial color="#f2c08f" roughness={0.58} />
      </mesh>
      <mesh position={[2.9, -0.86, 0.06]}>
        <boxGeometry args={[0.56, 0.92, 0.36]} />
        <meshStandardMaterial color="#d95f43" roughness={0.58} />
      </mesh>
    </group>
  );
}

export function GameRuntime() {
  const game = useGameStore((state) => state.game);
  const aim = useGameStore((state) => state.input.aim);
  const setAim = useGameStore((state) => state.setAim);
  const selectNode = useGameStore((state) => state.selectNode);
  const projectileHitEnemy = useGameStore((state) => state.projectileHitEnemy);
  const turnEnded = useGameStore((state) => state.turnEnded);
  const tickBattle = useGameStore((state) => state.tickBattle);
  const engineScene = selectEngineScene(game);

  useFrame((_, delta) => {
    if (engineScene === "battle") {
      tickBattle(delta * 1000);
    }
  });

  return (
    <>
      <color attach="background" args={["#7fc8f8"]} />
      <SceneLights />
      <CameraRig />
      {engineScene === "map" ? <MapScene game={game} selectNode={selectNode} /> : null}
      {engineScene === "battle" ? (
        <Suspense fallback={<BattleSceneLoading />}>
          <BattleScene game={game} aim={aim} setAim={setAim} projectileHitEnemy={projectileHitEnemy} turnEnded={turnEnded} />
        </Suspense>
      ) : null}
      {engineScene !== "map" && engineScene !== "battle" ? <ScenePlaceholder engineScene={engineScene} /> : null}
    </>
  );
}
