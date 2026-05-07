import { Component, lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { CameraRig } from "./components/CameraRig.jsx";
import { ModelAsset } from "./components/ModelAsset.jsx";
import { SceneLights } from "./components/SceneLights.jsx";
import { MapScene } from "./scenes/MapScene.jsx";
import { selectEngineScene } from "./runtime/sceneSelection.js";
import { useGameStore } from "./store/useGameStore.js";
import { createUiModel } from "../game/ui.js";

function createBattleSceneLazy() {
  return lazy(() => import("./scenes/BattleScene.jsx").then((module) => ({ default: module.BattleScene })));
}

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

function BattleSceneErrorFallback({ onRetry }) {
  const markerRef = useRef(null);

  useFrame((_, delta) => {
    if (markerRef.current) {
      markerRef.current.rotation.z -= delta * 1.2;
    }
  });

  return (
    <group position={[0, -0.04, 0]}>
      <mesh position={[0, 0, -0.7]}>
        <planeGeometry args={[9.6, 5.4]} />
        <meshBasicMaterial color="#211827" />
      </mesh>
      <mesh position={[0, -1.62, -0.08]}>
        <boxGeometry args={[7.8, 0.32, 0.46]} />
        <meshStandardMaterial color="#4b2c2c" roughness={0.7} metalness={0.02} />
      </mesh>
      <mesh position={[0, 0.1, 0.02]}>
        <boxGeometry args={[2.35, 1.06, 0.16]} />
        <meshStandardMaterial color="#7f1d1d" emissive="#991b1b" emissiveIntensity={0.22} roughness={0.44} metalness={0.04} />
      </mesh>
      <mesh ref={markerRef} position={[0, 0.42, 0.14]}>
        <ringGeometry args={[0.27, 0.35, 3]} />
        <meshStandardMaterial color="#fecaca" emissive="#ef4444" emissiveIntensity={0.3} roughness={0.38} />
      </mesh>
      <mesh position={[-0.42, -0.08, 0.16]}>
        <boxGeometry args={[0.18, 0.46, 0.08]} />
        <meshStandardMaterial color="#fee2e2" emissive="#f87171" emissiveIntensity={0.18} />
      </mesh>
      <mesh position={[0, -0.08, 0.16]}>
        <boxGeometry args={[0.18, 0.46, 0.08]} />
        <meshStandardMaterial color="#fee2e2" emissive="#f87171" emissiveIntensity={0.18} />
      </mesh>
      <mesh position={[0.42, -0.08, 0.16]}>
        <boxGeometry args={[0.18, 0.46, 0.08]} />
        <meshStandardMaterial color="#fee2e2" emissive="#f87171" emissiveIntensity={0.18} />
      </mesh>
      <mesh
        position={[0, -0.72, 0.18]}
        onClick={(event) => {
          event.stopPropagation();
          onRetry();
        }}
      >
        <boxGeometry args={[1.08, 0.3, 0.12]} />
        <meshStandardMaterial color="#f8d36c" emissive="#facc15" emissiveIntensity={0.24} roughness={0.36} metalness={0.04} />
      </mesh>
    </group>
  );
}

function MapSceneFallback() {
  return (
    <group>
      <mesh position={[0, 0, -0.72]}>
        <planeGeometry args={[9.6, 5.4]} />
        <meshBasicMaterial color="#7fc8f8" />
      </mesh>
      <mesh position={[0, -1.18, -0.08]}>
        <boxGeometry args={[7.2, 1.16, 0.18]} />
        <meshStandardMaterial color="#6ca45f" roughness={0.72} />
      </mesh>
      <mesh position={[-2.8, -0.72, 0.04]}>
        <boxGeometry args={[0.86, 0.34, 0.14]} />
        <meshStandardMaterial color="#3f7d39" roughness={0.68} />
      </mesh>
      <mesh position={[0, -0.48, 0.04]}>
        <boxGeometry args={[0.86, 0.34, 0.14]} />
        <meshStandardMaterial color="#286cc7" roughness={0.5} metalness={0.08} />
      </mesh>
      <mesh position={[2.8, -0.72, 0.04]}>
        <boxGeometry args={[0.86, 0.34, 0.14]} />
        <meshStandardMaterial color="#9c221f" roughness={0.58} />
      </mesh>
      <mesh position={[-1.4, -0.62, 0.01]} rotation={[0, 0, -0.18]}>
        <boxGeometry args={[1.95, 0.08, 0.08]} />
        <meshStandardMaterial color="#d9be7c" roughness={0.7} />
      </mesh>
      <mesh position={[1.4, -0.62, 0.01]} rotation={[0, 0, 0.18]}>
        <boxGeometry args={[1.95, 0.08, 0.08]} />
        <meshStandardMaterial color="#d9be7c" roughness={0.7} />
      </mesh>
    </group>
  );
}

function TerminalSceneDecor({ engineScene, backdropId }) {
  const victory = backdropId === "10";
  const danger = backdropId === "09";

  return (
    <group position={[0, -0.1, -0.15]}>
      <ModelAsset
        src="/game/assets/models/kurczoker-diorama-props.glb"
        scale={engineScene === "end" ? 0.34 : 0.3}
        position={[0, danger ? -0.8 : -0.62, 0.02]}
        rotation={[0, victory ? -0.22 : 0.1, 0]}
      />
      <mesh position={[0, 1.45, 0.05]}>
        <planeGeometry args={[6.4, 0.58]} />
        <meshBasicMaterial color={victory ? "#facc15" : danger ? "#7f1d1d" : "#f8d36c"} transparent opacity={victory ? 0.18 : 0.12} />
      </mesh>
      {Array.from({ length: victory ? 18 : 10 }).map((_, index) => {
        const x = -4.1 + index * 0.48;
        const y = victory ? 1.75 - (index % 3) * 0.28 : -1.35 + (index % 2) * 0.22;
        return (
          <mesh key={index} position={[x, y, 0.12]} scale={victory ? 0.035 : 0.055}>
            <sphereGeometry args={[1, 8, 6]} />
            <meshBasicMaterial color={victory ? (index % 2 ? "#f97316" : "#facc15") : "#1f2937"} transparent opacity={victory ? 0.78 : 0.42} />
          </mesh>
        );
      })}
    </group>
  );
}

class BattleSceneErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch() {
    this.props.onError?.();
  }

  componentDidUpdate(previousProps) {
    if (previousProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

function BattleSceneRuntime({ BattleSceneComponent, onReady, ...props }) {
  useEffect(() => {
    onReady();
  }, [onReady]);

  return <BattleSceneComponent {...props} />;
}

export function GameRuntime() {
  const game = useGameStore((state) => state.game);
  const aim = useGameStore((state) => state.input.aim);
  const setAim = useGameStore((state) => state.setAim);
  const setMovement = useGameStore((state) => state.setMovement);
  const setJump = useGameStore((state) => state.setJump);
  const selectNode = useGameStore((state) => state.selectNode);
  const projectileHitEnemy = useGameStore((state) => state.projectileHitEnemy);
  const turnEnded = useGameStore((state) => state.turnEnded);
  const tickBattle = useGameStore((state) => state.tickBattle);
  const engineScene = selectEngineScene(game);
  const backdropId = createUiModel(game).canvasBackdrop;
  const battleSceneKey = engineScene === "battle" ? `${game.battle?.nodeId ?? "battle"}:${game.battle?.encounterId ?? "encounter"}` : "idle";
  const [readyBattleKey, setReadyBattleKey] = useState(null);
  const [battleSceneRetry, setBattleSceneRetry] = useState(0);
  const [BattleSceneComponent, setBattleSceneComponent] = useState(createBattleSceneLazy);
  const battleRuntimeReady = readyBattleKey === battleSceneKey;

  const pauseBattleRuntime = useCallback(() => {
    setReadyBattleKey(null);
  }, []);

  useEffect(() => {
    if (engineScene !== "battle") {
      pauseBattleRuntime();
    }
  }, [engineScene, pauseBattleRuntime]);

  const markBattleRuntimeReady = useCallback(() => {
    setReadyBattleKey(battleSceneKey);
  }, [battleSceneKey]);

  const retryBattleScene = useCallback(() => {
    pauseBattleRuntime();
    setBattleSceneRetry((retry) => retry + 1);
    setBattleSceneComponent(() => createBattleSceneLazy());
  }, [pauseBattleRuntime]);

  useFrame((_, delta) => {
    if (engineScene === "battle" && battleRuntimeReady) {
      tickBattle(delta * 1000);
    }
  });

  return (
    <>
      <color attach="background" args={[engineScene === "battle" ? "#111a2e" : "#7fc8f8"]} />
      <fog attach="fog" args={[engineScene === "battle" ? "#111a2e" : "#7fc8f8", 7, 14]} />
      <SceneLights />
      <CameraRig />
      {engineScene === "map" ? (
        <BattleSceneErrorBoundary resetKey="map" fallback={<MapSceneFallback />}>
          <Suspense fallback={<ScenePlaceholder engineScene="reward" />}>
            <MapScene game={game} selectNode={selectNode} />
          </Suspense>
        </BattleSceneErrorBoundary>
      ) : null}
      {engineScene === "battle" ? (
        <BattleSceneErrorBoundary
          resetKey={`${battleSceneKey}:${battleSceneRetry}`}
          fallback={<BattleSceneErrorFallback onRetry={retryBattleScene} />}
          onError={pauseBattleRuntime}
        >
          <Suspense fallback={<BattleSceneLoading />}>
            <BattleSceneRuntime
              key={`${battleSceneKey}:${battleSceneRetry}`}
              BattleSceneComponent={BattleSceneComponent}
              game={game}
              aim={aim}
              setAim={setAim}
              setMovement={setMovement}
              setJump={setJump}
              projectileHitEnemy={projectileHitEnemy}
              turnEnded={turnEnded}
              onReady={markBattleRuntimeReady}
            />
          </Suspense>
        </BattleSceneErrorBoundary>
      ) : null}
      {engineScene !== "map" && engineScene !== "battle" ? (
        <Suspense fallback={<ScenePlaceholder engineScene={engineScene} />}>
          <TerminalSceneDecor engineScene={engineScene} backdropId={backdropId} />
        </Suspense>
      ) : null}
    </>
  );
}
