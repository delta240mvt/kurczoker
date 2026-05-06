export function SceneLights() {
  return (
    <>
      <ambientLight intensity={0.65} />
      <directionalLight position={[4, 6, 8]} intensity={1.15} />
    </>
  );
}
