import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";

const ICON_COLORS = {
  start: ["#f8e7a1", "#2f8f5b"],
  battle: ["#7fd7ff", "#2557b8"],
  elite: ["#aaf0ff", "#6d3ecf"],
  treasure: ["#ffd86b", "#b86f16"],
  shop: ["#99f2bd", "#25744f"],
  boss: ["#ff8a58", "#8a1f1f"]
};

export function PixelBillboard({ type = "battle", active = false, offered = false, scale = 1 }) {
  const ref = useRef(null);
  const colors = ICON_COLORS[type] ?? ICON_COLORS.battle;
  const marks = useMemo(() => {
    if (type === "treasure") return [[0, 0.11, 0.2, 0.12], [0, -0.05, 0.32, 0.2], [0, -0.2, 0.22, 0.08]];
    if (type === "shop") return [[0, 0.08, 0.34, 0.1], [-0.11, -0.08, 0.1, 0.24], [0.11, -0.08, 0.1, 0.24]];
    if (type === "boss") return [[0, 0.13, 0.28, 0.12], [-0.12, 0.02, 0.12, 0.28], [0.12, 0.02, 0.12, 0.28]];
    if (type === "start") return [[0, 0.08, 0.12, 0.32], [0.11, 0.15, 0.2, 0.14], [0.03, -0.12, 0.24, 0.08]];
    return [[0, 0.02, 0.3, 0.16], [-0.09, 0.13, 0.08, 0.16], [0.09, 0.13, 0.08, 0.16]];
  }, [type]);

  useFrame(({ camera }) => {
    ref.current?.quaternion.copy(camera.quaternion);
  });

  return (
    <group ref={ref} scale={scale}>
      <mesh position={[0, 0, 0.04]}>
        <planeGeometry args={[0.64, 0.54]} />
        <meshBasicMaterial color={offered ? colors[0] : "#6b7280"} transparent opacity={offered ? 0.94 : 0.58} />
      </mesh>
      {marks.map(([x, y, width, height], index) => (
        <mesh key={`${type}-${index}`} position={[x, y, 0.07]}>
          <planeGeometry args={[width, height]} />
          <meshBasicMaterial color={active ? "#fff3a3" : colors[1]} transparent opacity={offered ? 1 : 0.65} />
        </mesh>
      ))}
    </group>
  );
}
