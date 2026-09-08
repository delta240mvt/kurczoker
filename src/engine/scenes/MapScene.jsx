import { Suspense, useMemo } from "react";
import { BufferGeometry, Vector3 } from "three";
import { World } from "../tactical/World.jsx";
import { Chicken } from "../tactical/Chicken.jsx";

export function MapScene({ game, selectNode, quality, menu = false }) {
  const positions = useMemo(
    () =>
      new Map(
        game.map.nodes.map((n, i) => [
          n.id,
          [
            (n.depth - 3) * 1.65,
            0.07,
            n.id === "shop-1"
              ? -1.4
              : n.id === "treasure-1"
                ? 0.9
                : Math.sin(i * 1.7) * 0.45,
          ],
        ]),
      ),
    [game.map],
  );
  const path = useMemo(
    () =>
      new BufferGeometry().setFromPoints(
        game.map.edges
          .flatMap((e) => [positions.get(e.from), positions.get(e.to)])
          .map((p) => new Vector3(...p)),
      ),
    [positions, game.map],
  );
  const selected = positions.get(game.run.currentNodeId) ?? [-5, 0, 0];
  return (
    <>
      <World quality={quality} map />
      {!menu && (
        <>
          <lineSegments geometry={path}>
            <lineBasicMaterial color="#f9e1a4" />
          </lineSegments>
          {game.map.nodes.map((n) => {
            const active = game.run.offeredNodeIds.includes(n.id),
              done = game.run.completedNodeIds.includes(n.id);
            return (
              <group
                key={n.id}
                position={positions.get(n.id)}
                onClick={(e) => {
                  e.stopPropagation();
                  if (active) selectNode(n.id);
                }}
              >
                <mesh receiveShadow>
                  <cylinderGeometry args={[0.33, 0.4, 0.12, 8]} />
                  <meshStandardMaterial
                    color={active ? "#f2ce7e" : done ? "#548b74" : "#939983"}
                    emissive={active ? "#8e6327" : "#000"}
                    emissiveIntensity={0.35}
                  />
                </mesh>
                <mesh position={[0, 0.21, 0]}>
                  <octahedronGeometry
                    args={[n.type === "boss" ? 0.32 : 0.17, 0]}
                  />
                  <meshStandardMaterial
                    color={
                      n.type === "boss"
                        ? "#a24e47"
                        : active
                          ? "#ffedb3"
                          : "#697d75"
                    }
                    metalness={0.2}
                    roughness={0.4}
                  />
                </mesh>
                {active && (
                  <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
                    <ringGeometry args={[0.49, 0.54, 32]} />
                    <meshBasicMaterial color="#fff1bb" side={2} />
                  </mesh>
                )}
              </group>
            );
          })}
        </>
      )}
      <Suspense fallback={null}>
        <Chicken
          position={
            menu ? [2.5, 0.05, 1] : [selected[0] - 0.3, 0.1, selected[2] + 0.6]
          }
          decorative={menu}
        />
      </Suspense>
    </>
  );
}
