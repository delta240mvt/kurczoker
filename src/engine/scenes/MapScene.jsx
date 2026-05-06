import { useMemo } from "react";
import { MapNode } from "../components/MapNode.jsx";

function buildNodePositions(nodes) {
  if (nodes.length === 0) {
    return new Map();
  }

  const byDepth = new Map();
  for (const node of nodes) {
    const depthNodes = byDepth.get(node.depth) ?? [];
    depthNodes.push(node);
    byDepth.set(node.depth, depthNodes);
  }

  const maxDepth = Math.max(...nodes.map((node) => node.depth), 1);
  const xStep = 8.2 / maxDepth;
  const positions = new Map();

  for (const [depth, depthNodes] of byDepth.entries()) {
    const yStep = 1.26;
    const startY = ((depthNodes.length - 1) * yStep) / 2;
    depthNodes.forEach((node, index) => {
      const branchOffset = depth % 2 === 0 ? 0.08 : -0.08;
      positions.set(node.id, [(depth - maxDepth / 2) * xStep, startY - index * yStep + branchOffset, 0]);
    });
  }

  return positions;
}

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
  return (
    <group position={[0, 0, -0.85]}>
      <mesh position={[0, 0, -0.28]}>
        <planeGeometry args={[10.8, 5.8]} />
        <meshBasicMaterial color="#1d7668" />
      </mesh>
      <mesh position={[-2.2, 0.85, -0.18]} rotation={[0, 0, -0.12]}>
        <planeGeometry args={[7.4, 2.9]} />
        <meshBasicMaterial color="#3da86b" transparent opacity={0.86} />
      </mesh>
      <mesh position={[2.1, -1.0, -0.16]} rotation={[0, 0, 0.14]}>
        <planeGeometry args={[7.8, 2.7]} />
        <meshBasicMaterial color="#276db5" transparent opacity={0.76} />
      </mesh>
      <mesh position={[0.3, 0.05, -0.1]} rotation={[0, 0, -0.04]}>
        <planeGeometry args={[8.9, 3.9]} />
        <meshBasicMaterial color="#5fbf75" transparent opacity={0.5} />
      </mesh>
      <mesh position={[0, 0, 0.02]}>
        <planeGeometry args={[10.2, 5.2]} />
        <meshBasicMaterial color="#0f2d44" transparent opacity={0.18} />
      </mesh>
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
