export function ProjectileTrail({ points }) {
  return (
    <group>
      {points.map((point, index) => {
        const age = index / Math.max(points.length - 1, 1);
        const previous = points[Math.max(index - 1, 0)];
        const dx = point[0] - previous[0];
        const dy = point[1] - previous[1];
        const angle = Math.atan2(dy, dx);
        return (
          <group key={`${point[0]}-${point[1]}-${index}`} position={[point[0], point[1], 0.02]} rotation={[0, 0, angle]}>
            <mesh scale={[0.5 + age * 0.9, 0.22 + age * 0.34, 1]}>
              <sphereGeometry args={[0.08, 12, 8]} />
              <meshBasicMaterial color={index % 2 === 0 ? "#fef3c7" : "#fb923c"} transparent opacity={0.08 + age * 0.3} />
            </mesh>
            {index > points.length - 5 ? (
              <mesh position={[-0.08, 0, 0.01]} scale={0.13 + age * 0.12}>
                <sphereGeometry args={[0.08, 10, 6]} />
                <meshBasicMaterial color="#facc15" transparent opacity={0.18 + age * 0.28} />
              </mesh>
            ) : null}
          </group>
        );
      })}
    </group>
  );
}
