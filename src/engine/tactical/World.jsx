import { useMemo } from "react";
import { Color, Object3D } from "three";

function Trees({ count = 24, seed = 0 }) {
  const trees = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const n = Math.sin((i + seed + 1) * 78.233) * 43758.5;
        const r = n - Math.floor(n);
        return {
          x: -8 + (i / count) * 16,
          z: -2.4 - r * 3,
          scale: 0.65 + r * 0.65,
        };
      }),
    [count, seed],
  );
  const setInstances = (mesh, canopy) => {
    if (!mesh) return;
    const object = new Object3D();
    trees.forEach((t, i) => {
      object.position.set(t.x, canopy ? t.scale * 1.1 : t.scale * 0.4, t.z);
      object.scale.set(t.scale, t.scale, t.scale);
      object.rotation.y = i;
      object.updateMatrix();
      mesh.setMatrixAt(i, object.matrix);
      if (canopy) mesh.setColorAt(i, new Color(i % 3 ? "#567955" : "#7b9055"));
    });
    mesh.instanceMatrix.needsUpdate = true;
  };
  return (
    <group>
      <instancedMesh
        args={[null, null, count]}
        ref={(m) => setInstances(m, false)}
        castShadow
      >
        <cylinderGeometry args={[0.08, 0.13, 0.9, 5]} />
        <meshStandardMaterial color="#765b42" />
      </instancedMesh>
      <instancedMesh
        args={[null, null, count]}
        ref={(m) => setInstances(m, true)}
        castShadow
      >
        <icosahedronGeometry args={[0.7, 1]} />
        <meshStandardMaterial roughness={1} />
      </instancedMesh>
    </group>
  );
}

function Flowers() {
  function place(mesh, bloom) {
    if (!mesh) return;
    const object = new Object3D();
    for (let i = 0; i < 18; i++) {
      object.position.set(
        -6.3 + ((i * 2.73) % 12.6) + (bloom ? 0.025 : 0),
        bloom ? 0.25 : 0.09,
        0.9 + (i % 3) * 0.25,
      );
      object.updateMatrix();
      mesh.setMatrixAt(i, object.matrix);
      if (bloom) mesh.setColorAt(i, new Color(i % 2 ? "#eaca80" : "#faf0d3"));
    }
    mesh.instanceMatrix.needsUpdate = true;
  }
  return (
    <group>
      <instancedMesh args={[null, null, 18]} ref={(m) => place(m, false)}>
        <coneGeometry args={[0.08, 0.3, 4]} />
        <meshStandardMaterial color="#687a48" />
      </instancedMesh>
      <instancedMesh args={[null, null, 18]} ref={(m) => place(m, true)}>
        <icosahedronGeometry args={[0.06, 0]} />
        <meshStandardMaterial />
      </instancedMesh>
    </group>
  );
}
export function Castle({ position = [4, 0, -4], scale = 1, boss = false }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.65, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.1, 1.3, 0.9]} />
        <meshStandardMaterial
          color={boss ? "#454951" : "#c8baa0"}
          roughness={0.9}
        />
      </mesh>
      {[-1, 1].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <mesh position={[0, 1.05, 0]} castShadow>
            <cylinderGeometry args={[0.34, 0.42, 2.1, 8]} />
            <meshStandardMaterial color={boss ? "#515663" : "#d6c6a7"} />
          </mesh>
          <mesh position={[0, 2.3, 0]} castShadow>
            <coneGeometry args={[0.56, 0.9, 8]} />
            <meshStandardMaterial color={boss ? "#7d3740" : "#385e65"} />
          </mesh>
          <mesh position={[0, 1.5, 0.34]}>
            <boxGeometry args={[0.12, 0.3, 0.035]} />
            <meshStandardMaterial
              color="#e9bc68"
              emissive="#e9bc68"
              emissiveIntensity={0.35}
            />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 0.42, 0.47]}>
        <boxGeometry args={[0.48, 0.84, 0.045]} />
        <meshStandardMaterial color="#514737" />
      </mesh>
      <mesh position={[0, 1.45, 0]} castShadow>
        <coneGeometry args={[1.5, 0.7, 4]} />
        <meshStandardMaterial color="#496b64" />
      </mesh>
      <mesh position={[0.15, 2.22, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 1.4, 6]} />
        <meshStandardMaterial color="#93734a" />
      </mesh>
      <mesh position={[0.48, 2.65, 0]}>
        <boxGeometry args={[0.62, 0.32, 0.025]} />
        <meshStandardMaterial color={boss ? "#c65353" : "#e7bb62"} />
      </mesh>
    </group>
  );
}

export function World({ arena, quality = "high", map = false }) {
  const platforms = arena?.platforms ?? [
    { id: "map", x: 0, y: -0.35, width: 14, height: 0.7, depth: 5 },
  ];
  const boss = arena?.variant === 2;
  return (
    <group>
      <color attach="background" args={[boss ? "#b2b9bf" : "#d3dbce"]} />
      <fog attach="fog" args={[boss ? "#b2b9bf" : "#d3dbce", 24, 58]} />
      <ambientLight intensity={0.7} />
      <hemisphereLight args={["#e2f3ee", "#776146", 1.25]} />
      <directionalLight
        position={[-5, 10, 5]}
        intensity={2.5}
        color="#fff0cc"
        castShadow={quality !== "low"}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={8}
        shadow-camera-bottom={-6}
        shadow-bias={-0.0005}
        shadow-normalBias={0.04}
      />
      {platforms.map((p) => (
        <group key={p.id} position={[p.x, p.y, 0]}>
          <mesh receiveShadow castShadow>
            <boxGeometry args={[p.width, p.height, p.depth]} />
            <meshStandardMaterial
              color={boss ? "#70745e" : "#8c9b66"}
              roughness={1}
            />
          </mesh>
          <mesh position={[0, p.height / 2 - 0.03, 0]} receiveShadow>
            <boxGeometry args={[p.width + 0.04, 0.065, p.depth + 0.04]} />
            <meshStandardMaterial
              color={boss ? "#96966b" : "#b1bd7c"}
              roughness={1}
            />
          </mesh>
        </group>
      ))}
      <mesh
        position={[0, -1.25, 0]}
        scale={[7.8, 1.5, map ? 3.4 : 2.4]}
        castShadow
      >
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial color="#817561" flatShading roughness={1} />
      </mesh>
      {Array.from({ length: 11 }, (_, i) => (
        <mesh
          key={i}
          position={[-6.5 + i * 1.3, -0.95 - (i % 3) * 0.18, 1.7]}
          rotation={[i * 0.6, i, 0]}
          scale={[0.8, 0.7, 0.65]}
          castShadow
        >
          <dodecahedronGeometry args={[0.75, 0]} />
          <meshStandardMaterial
            color={i % 2 ? "#978975" : "#b0a083"}
            roughness={1}
          />
        </mesh>
      ))}
      <Trees count={quality === "low" ? 14 : 26} seed={arena?.variant ?? 0} />
      <Castle position={[4.4, 0, -4.3]} scale={boss ? 1.4 : 1} boss={boss} />
      {[-1, 1].map((side, i) => (
        <mesh
          key={side}
          position={[side * 10, -1, -10 - i * 5]}
          rotation={[0, 0.4, 0]}
          scale={[8, 4 + i * 2, 5]}
        >
          <icosahedronGeometry args={[1, 1]} />
          <meshStandardMaterial color={i ? "#a8bbac" : "#8fa89c"} flatShading />
        </mesh>
      ))}
      <mesh
        position={[0, -3.4, -2]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[150, 150]} />
        <meshStandardMaterial color="#b8cbc2" roughness={0.55} />
      </mesh>
      <Flowers />
    </group>
  );
}
