export function SceneLights() {
  return (
    <>
      <ambientLight intensity={0.48} />
      <hemisphereLight args={["#b7e8ff", "#50300f", 0.72]} />
      <directionalLight
        position={[4, 6, 8]}
        intensity={1.55}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-5}
        shadow-camera-right={5}
        shadow-camera-top={4}
        shadow-camera-bottom={-4}
      />
      <pointLight position={[-3.8, 1.35, 2.2]} color="#f97316" intensity={0.72} distance={5} />
      <pointLight position={[3.7, 1.15, 2.4]} color="#facc15" intensity={0.54} distance={5} />
    </>
  );
}
