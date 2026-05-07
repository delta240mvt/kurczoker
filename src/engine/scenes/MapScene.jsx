import { Suspense, useMemo } from "react";
import { BufferGeometry, Vector3 } from "three";
import { MapNode } from "../components/MapNode.jsx";
import { ModelAsset } from "../components/ModelAsset.jsx";
import { buildNodePositions } from "../runtime/mapLayout.js";

const WORLD_ASSET_BASE = "/game/assets/models/hyper3d-clean";

function RoutePath({ from, to, active = false }) {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const length = Math.hypot(dx, dy);
  const routeGeometry = useMemo(
    () =>
      new BufferGeometry().setFromPoints([
        new Vector3(from[0], from[1], 8.08),
        new Vector3(to[0], to[1], 8.08)
      ]),
    [from, to]
  );
  const beads = useMemo(() => {
    const count = Math.max(3, Math.floor(length / 0.38));
    return Array.from({ length: count }, (_, index) => {
      const t = (index + 1) / (count + 1);
      return [from[0] + dx * t, from[1] + dy * t, 8.12];
    });
  }, [dx, dy, from, length]);

  return (
    <group>
      <line geometry={routeGeometry}>
        <lineBasicMaterial color={active ? "#f8d36c" : "#c7a26a"} transparent opacity={active ? 0.8 : 0.42} />
      </line>
      {beads.map((point, index) => (
        <mesh key={index} position={point}>
          <sphereGeometry args={[active ? 0.034 : 0.024, 10, 8]} />
          <meshBasicMaterial color={active ? "#facc15" : "#d8b975"} transparent opacity={active ? 0.86 : 0.48} />
        </mesh>
      ))}
    </group>
  );
}

function PaintedMapBackdrop() {
  return (
    <group position={[0, -0.18, -0.72]} rotation={[-0.2, 0, 0]}>
      <Suspense fallback={null}>
        <ModelAsset src={`${WORLD_ASSET_BASE}/clean-world-terrain.glb`} scale={7.4} position={[0, -0.12, -0.26]} />
        <ModelAsset src={`${WORLD_ASSET_BASE}/clean-world-terrain.glb`} scale={4.6} position={[-3.65, 0.42, -0.05]} rotation={[0, 0.32, 0.08]} />
        <ModelAsset src={`${WORLD_ASSET_BASE}/clean-world-terrain.glb`} scale={4.25} position={[3.85, 0.38, -0.05]} rotation={[0, -0.28, -0.08]} />
        <ModelAsset src={`${WORLD_ASSET_BASE}/clean-platform.glb`} scale={1.45} position={[-2.72, -0.78, 0.38]} rotation={[0, 0.1, 0]} />
        <ModelAsset src={`${WORLD_ASSET_BASE}/clean-platform.glb`} scale={1.2} position={[1.95, -0.86, 0.38]} rotation={[0, -0.18, 0]} />
        <ModelAsset src={`${WORLD_ASSET_BASE}/clean-forest.glb`} scale={1.7} position={[-4.28, 0.82, 0.5]} rotation={[0, 0.22, 0.05]} />
        <ModelAsset src={`${WORLD_ASSET_BASE}/clean-forest.glb`} scale={1.36} position={[4.12, 0.68, 0.36]} rotation={[0, -0.2, -0.05]} />
        <ModelAsset src={`${WORLD_ASSET_BASE}/clean-windmill.glb`} scale={0.9} position={[-3.45, 0.06, 0.86]} rotation={[0, -0.15, 0]} />
        <ModelAsset src={`${WORLD_ASSET_BASE}/clean-castle.glb`} scale={1.02} position={[3.38, 0.76, 1]} rotation={[0, -0.28, 0]} />
        <ModelAsset src={`${WORLD_ASSET_BASE}/clean-shop.glb`} scale={0.58} position={[-1.68, 0.08, 0.82]} rotation={[0, 0.34, 0]} />
        <ModelAsset src={`${WORLD_ASSET_BASE}/clean-treasure.glb`} scale={0.56} position={[-0.16, -0.68, 0.78]} rotation={[0, -0.12, 0]} />
        <ModelAsset src={`${WORLD_ASSET_BASE}/clean-boss-altar.glb`} scale={0.84} position={[4.18, -0.66, 0.8]} rotation={[0, -0.34, 0]} />
      </Suspense>
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
          position={(positions.get(node.id) ?? [0, 0, 0]).map((value, index) => (index === 2 ? value + 8.18 : value))}
          offered={offeredNodeIds.has(node.id)}
          active={currentNodeId === node.id}
          completed={completedNodeIds.has(node.id)}
          onSelect={selectNode}
        />
      ))}
    </group>
  );
}
