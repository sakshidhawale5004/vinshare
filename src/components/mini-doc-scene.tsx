import { useEffect, useState, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, RoundedBox, Environment } from "@react-three/drei";
import * as THREE from "three";

function Doc({ color }: { color: string }) {
  const g = useRef<THREE.Group>(null);
  useFrame(({ clock, mouse }) => {
    if (!g.current) return;
    const t = clock.getElapsedTime();
    g.current.rotation.y = Math.sin(t * 0.6) * 0.45 + mouse.x * 0.4;
    g.current.rotation.x = Math.cos(t * 0.5) * 0.25 + mouse.y * 0.25;
    g.current.position.y = Math.sin(t * 1.2) * 0.25;
  });
  return (
    <group ref={g}>
      <RoundedBox args={[1.6, 2.2, 0.08]} radius={0.08} smoothness={4} castShadow>
        <meshPhysicalMaterial color="#ffffff" clearcoat={0.8} roughness={0.3} />
      </RoundedBox>
      <mesh position={[0, 0.85, 0.045]}>
        <planeGeometry args={[1.6, 0.28]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      {[0.4, 0.2, 0, -0.2, -0.4].map((y, i) => (
        <mesh key={i} position={[-0.4 - (i % 2) * 0.2, y, 0.045]}>
          <planeGeometry args={[0.7 - i * 0.04, 0.05]} />
          <meshBasicMaterial color="#dbdfea" />
        </mesh>
      ))}
      <mesh position={[0.4, -0.9, 0.045]}>
        <planeGeometry args={[0.7, 0.24]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
    </group>
  );
}

function Coin({ x, y, color }: { x: number; y: number; color: string }) {
  const r = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!r.current) return;
    const t = clock.getElapsedTime();
    r.current.rotation.y = t * 2;
    r.current.position.y = y + Math.sin(t * 1.8 + x) * 0.35;
  });
  return (
    <mesh ref={r} position={[x, y, 0]} castShadow>
      <cylinderGeometry args={[0.22, 0.22, 0.06, 40]} />
      <meshPhysicalMaterial color={color} metalness={0.95} roughness={0.18} clearcoat={1} />
    </mesh>
  );
}

export function MiniDocScene({ primary, accent }: { primary: string; accent: string }) {
  const [m, setM] = useState(false);
  useEffect(() => setM(true), []);
  if (!m) return null;
  return (
    <Canvas dpr={[1, 2]} camera={{ position: [0, 0, 4.5], fov: 45 }} gl={{ alpha: true, antialias: true }}>
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 3, 3]} intensity={1.2} />
      <Environment preset="city" />
      <Float speed={1.8} rotationIntensity={0.6} floatIntensity={1.2}>
        <Doc color={primary} />
      </Float>
      <Coin x={-1.5} y={0.8} color={accent} />
      <Coin x={1.5} y={-0.6} color={primary} />
      <Coin x={1.3} y={1.0} color={accent} />
    </Canvas>
  );
}
