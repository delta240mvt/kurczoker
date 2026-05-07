import { useMemo, useState } from "react";
import { NODE_TYPES } from "../../game/constants.js";
import { PixelBillboard } from "./PixelBillboard.jsx";

const NODE_STYLE = {
  [NODE_TYPES.START]: { color: "#62d58d", emissive: "#b9f7bd" },
  [NODE_TYPES.BATTLE]: { color: "#2771d9", emissive: "#7dd3fc" },
  [NODE_TYPES.ELITE]: { color: "#6d4de6", emissive: "#d8b4fe" },
  [NODE_TYPES.TREASURE]: { color: "#d7a03a", emissive: "#fde68a" },
  [NODE_TYPES.SHOP]: { color: "#2ca66f", emissive: "#86efac" },
  [NODE_TYPES.BOSS]: { color: "#a8322d", emissive: "#fb923c" }
};

export function MapNode({ node, position, offered = false, active = false, completed = false, onSelect }) {
  const [hovered, setHovered] = useState(false);
  const style = NODE_STYLE[node.type] ?? NODE_STYLE[NODE_TYPES.BATTLE];
  const nodeColor = offered || active ? style.color : completed ? "#6b7280" : "#3d4d5d";
  const glowColor = active ? "#facc15" : style.emissive;
  const glowIntensity = active ? 0.62 : offered ? 0.38 : 0;
  const scale = useMemo(() => {
    if (hovered && offered) return 1.12;
    if (active) return 1.08;
    return 1;
  }, [active, hovered, offered]);

  return (
    <group
      position={position}
      scale={scale}
      onClick={(event) => {
        event.stopPropagation();
        if (offered) onSelect(node.id);
      }}
      onPointerOver={(event) => {
        event.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
    >
      {(offered || active) && (
        <mesh position={[0, -0.02, -0.08]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.32, active ? 0.5 : 0.45, 36]} />
          <meshBasicMaterial color={glowColor} transparent opacity={active ? 0.48 : 0.34} />
        </mesh>
      )}
      <mesh position={[0, 0, -0.05]} rotation={[0.08, 0, 0]}>
        <cylinderGeometry args={[0.26, 0.32, 0.14, 32]} />
        <meshStandardMaterial
          color={nodeColor}
          emissive={glowColor}
          emissiveIntensity={glowIntensity}
          roughness={0.42}
          metalness={0.08}
        />
      </mesh>
      <mesh position={[0, -0.02, -0.18]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.38, 32]} />
        <meshBasicMaterial color="#163c4a" transparent opacity={0.28} />
      </mesh>
      <group position={[0, 0.2, 0.08]}>
        <PixelBillboard type={node.type} active={active} offered={offered || active} scale={0.46} />
      </group>
    </group>
  );
}
