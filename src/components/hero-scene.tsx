import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial, Environment, RoundedBox, Text } from "@react-three/drei";
import * as THREE from "three";

function Document({ position, rotation, color, label }: { position: [number, number, number]; rotation: [number, number, number]; color: string; label: string }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock, mouse }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    // Larger, more visible rotation and float
    ref.current.rotation.y = rotation[1] + Math.sin(t * 0.7) * 0.35 + mouse.x * 0.5;
    ref.current.rotation.x = rotation[0] + Math.cos(t * 0.5) * 0.18 + mouse.y * 0.25;
    ref.current.position.y = position[1] + Math.sin(t * 1.1 + position[0]) * 0.35;
    ref.current.position.x = position[0] + Math.cos(t * 0.4 + position[1]) * 0.15;
  });
  return (
    <group ref={ref} position={position}>
      <RoundedBox args={[2.2, 3, 0.06]} radius={0.08} smoothness={4} castShadow receiveShadow>
        <meshPhysicalMaterial color="#ffffff" roughness={0.35} metalness={0.05} clearcoat={0.6} clearcoatRoughness={0.2} />
      </RoundedBox>
      <mesh position={[0, 1.2, 0.033]}>
        <planeGeometry args={[2.2, 0.35]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      {[0.6, 0.35, 0.1, -0.15, -0.4, -0.65, -0.9].map((y, i) => (
        <mesh key={i} position={[-0.5 - (i % 2) * 0.2, y, 0.033]}>
          <planeGeometry args={[1.1 - (i * 0.05), 0.06]} />
          <meshBasicMaterial color="#d5d8e5" />
        </mesh>
      ))}
      <mesh position={[0.55, -1.25, 0.033]}>
        <planeGeometry args={[1, 0.32]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      <Text position={[0.55, -1.25, 0.04]} fontSize={0.16} color="#ffffff" anchorX="center" anchorY="middle">
        {label}
      </Text>
    </group>
  );
}

function Blob({ position, color, scale = 1 }: { position: [number, number, number]; color: string; scale?: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    ref.current.rotation.x = t * 0.35;
    ref.current.rotation.y = t * 0.25;
    ref.current.position.y = position[1] + Math.sin(t * 0.9) * 0.4;
  });
  return (
    <Float speed={2.4} rotationIntensity={1.4} floatIntensity={2.2}>
      <mesh ref={ref} position={position} scale={scale}>
        <icosahedronGeometry args={[0.85, 32]} />
        <MeshDistortMaterial color={color} distort={0.6} speed={3.5} roughness={0.1} metalness={0.5} />
      </mesh>
    </Float>
  );
}

function Coin({ position, color }: { position: [number, number, number]; color: string }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    ref.current.rotation.y = t * 2.2;
    ref.current.rotation.z = Math.sin(t) * 0.2;
    ref.current.position.y = position[1] + Math.sin(t * 1.8 + position[0]) * 0.5;
    ref.current.position.x = position[0] + Math.cos(t * 1.1 + position[1]) * 0.25;
  });
  return (
    <mesh ref={ref} position={position} castShadow>
      <cylinderGeometry args={[0.42, 0.42, 0.1, 48]} />
      <meshPhysicalMaterial color={color} metalness={0.95} roughness={0.15} clearcoat={1} />
    </mesh>
  );
}

function Scene({ primary, accent }: { primary: string; accent: string }) {
  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[5, 5, 5]} intensity={1.4} castShadow />
      <directionalLight position={[-5, 3, -3]} intensity={0.5} color={primary} />
      <pointLight position={[0, -4, 3]} intensity={0.6} color={accent} />
      <Environment preset="city" />
      <Float speed={1.6} rotationIntensity={0.6} floatIntensity={1.2}>
        <Document position={[-1.6, 0, -0.5]} rotation={[0.1, 0.4, -0.1]} color={primary} label="₹ 12,450" />
      </Float>
      <Float speed={1.4} rotationIntensity={0.7} floatIntensity={1.4}>
        <Document position={[1.4, -0.3, 0.5]} rotation={[-0.05, -0.35, 0.05]} color={accent} label="PAID" />
      </Float>
      <Blob position={[-2.7, 1.9, -1.5]} color={primary} scale={1.15} />
      <Blob position={[2.6, -1.8, -1]} color={accent} scale={1.05} />
      <Coin position={[2.4, 1.7, 0.5]} color={accent} />
      <Coin position={[-2.5, -1.5, 0.4]} color={primary} />
      <Coin position={[0, 2.2, 1]} color={primary} />
    </>
  );
}

export function HeroScene({ primary, accent }: { primary: string; accent: string }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) {
    return (
      <div className="w-full h-full grid place-items-center">
        <div className="size-40 rounded-full animate-pulse" style={{ background: `radial-gradient(circle, ${primary}66, transparent)` }} />
      </div>
    );
  }
  return (
    <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 0, 6], fov: 45 }} gl={{ antialias: true, alpha: true }}>
      <Scene primary={primary} accent={accent} />
    </Canvas>
  );
}
