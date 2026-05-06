export function ProjectileTrail({ points }) {
  return (
    <group>
      {points.map((point, index) => {
        const age = index / Math.max(points.length - 1, 1);
        return (
          <mesh key={`${point[0]}-${point[1]}-${index}`} position={[point[0], point[1], 0.02]} scale={0.35 + age * 0.55}>
            <sphereGeometry args={[0.08, 12, 8]} />
            <meshBasicMaterial color={index % 2 === 0 ? "#fef3c7" : "#fb923c"} transparent opacity={0.1 + age * 0.34} />
          </mesh>
        );
      })}
    </group>
  );
}
