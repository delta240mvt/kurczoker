import { useMemo } from "react";
import { MapNode } from "../components/MapNode.jsx";
import { ModelAsset, preloadModelAsset } from "../components/ModelAsset.jsx";
import { buildNodePositions } from "../runtime/mapLayout.js";

function RoutePath({ from, to, active = false }) {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const length = Math.hypot(dx, dy);
  const angle = Math.atan2(dy, dx);
  const midpoint = [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2, -0.18];

  return (
    <group position={midpoint} rotation={[0, 0, angle]}>
      <mesh>
        <boxGeometry args={[length, active ? 0.12 : 0.08, 0.05]} />
        <meshStandardMaterial
          color={active ? "#f8d36c" : "#d8b975"}
          emissive={active ? "#facc15" : "#3b2d10"}
          emissiveIntensity={active ? 0.42 : 0.08}
          roughness={0.5}
          metalness={0.05}
        />
      </mesh>
      <mesh position={[0, -0.06, -0.03]}>
        <boxGeometry args={[length, 0.04, 0.02]} />
        <meshBasicMaterial color="#204652" transparent opacity={0.32} />
      </mesh>
    </group>
  );
}

function PaintedMapBackdrop() {
  const trees = [
    [-4.6, -1.95, 0.05, 0.55],
    [-4.2, -1.62, 0.04, 0.46],
    [-3.7, -2.02, 0.05, 0.5],
    [3.9, -1.78, 0.05, 0.48],
    [4.42, -1.98, 0.04, 0.58],
    [3.35, -2.06, 0.04, 0.38]
  ];

  return (
    <group position={[0, 0, -0.85]}>
      <mesh position={[0, 0, -0.35]}>
        <planeGeometry args={[10.8, 5.8]} />
        <meshBasicMaterial color="#11495d" />
      </mesh>
      <mesh position={[0, 1.55, -0.32]}>
        <planeGeometry args={[10.8, 2.5]} />
        <meshBasicMaterial color="#6ab9e8" />
      </mesh>
      <mesh position={[-2.4, 1.25, -0.27]} rotation={[0, 0, -0.06]}>
        <planeGeometry args={[5.2, 0.85]} />
        <meshBasicMaterial color="#d9edf3" transparent opacity={0.74} />
      </mesh>
      <mesh position={[2.7, 1.05, -0.265]} rotation={[0, 0, 0.08]}>
        <planeGeometry args={[4.5, 0.72]} />
        <meshBasicMaterial color="#b9d9e7" transparent opacity={0.62} />
      </mesh>
      <mesh position={[-2.2, 0.85, -0.18]} rotation={[0, 0, -0.12]}>
        <planeGeometry args={[7.4, 2.9]} />
        <meshBasicMaterial color="#286b55" transparent opacity={0.86} />
      </mesh>
      <mesh position={[2.1, -1.0, -0.16]} rotation={[0, 0, 0.14]}>
        <planeGeometry args={[7.8, 2.7]} />
        <meshBasicMaterial color="#3d91c3" transparent opacity={0.68} />
      </mesh>
      <mesh position={[0.3, 0.05, -0.1]} rotation={[0, 0, -0.04]}>
        <planeGeometry args={[8.9, 3.9]} />
        <meshBasicMaterial color="#6bbf62" transparent opacity={0.52} />
      </mesh>
      <mesh position={[0, 0, 0.02]}>
        <planeGeometry args={[10.2, 5.2]} />
        <meshBasicMaterial color="#0f2d44" transparent opacity={0.18} />
      </mesh>
      {trees.map(([x, y, z, scale], index) => (
        <group key={`tree-${index}`} position={[x, y, z]} scale={scale}>
          <mesh position={[0, 0.24, 0.03]}>
            <coneGeometry args={[0.26, 0.74, 8]} />
            <meshStandardMaterial color="#174b35" roughness={0.82} />
          </mesh>
          <mesh position={[0, -0.16, 0.02]}>
            <boxGeometry args={[0.09, 0.42, 0.06]} />
            <meshStandardMaterial color="#5a3515" roughness={0.9} />
          </mesh>
        </group>
      ))}
      <ModelAsset src="/game/assets/models/kurczoker-map-props.glb" scale={0.33} position={[0.05, -0.26, 0.16]} rotation={[0, 0.08, 0]} />
    </group>
  );
}

export function MapScene({ game, selectNode }) {
  const nodes = game.map?.nodes ?? [];
  const edges = game.map?.edges ?? [];
  const positions = useMemo(() => buildNodePositions(nodes), [nodes]);
  const offeredNodeIds = new Set(game.run?.offeredNodeIds ?? []);
  const completedNodeIds = new Set(game.run?.completedNodeIds ?? []);
  const currentNodeId = game.run?.currentNodeId;

  return (
    <group rotation={[0.24, 0, 0]} position={[0, -0.08, 0]}>
      <PaintedMapBackdrop />
      {edges.map((edge) => {
        const from = positions.get(edge.from);
        const to = positions.get(edge.to);
        if (!from || !to) return null;

        return (
          <RoutePath
            key={`${edge.from}-${edge.to}`}
            from={from}
            to={to}
            active={currentNodeId === edge.from || completedNodeIds.has(edge.from)}
          />
        );
      })}
      {nodes.map((node) => (
        <MapNode
          key={node.id}
          node={node}
          position={positions.get(node.id) ?? [0, 0, 0]}
          offered={offeredNodeIds.has(node.id)}
          active={currentNodeId === node.id}
          completed={completedNodeIds.has(node.id)}
          onSelect={selectNode}
        />
      ))}
    </group>
  );
}

preloadModelAsset("/game/assets/models/kurczoker-map-props.glb");
