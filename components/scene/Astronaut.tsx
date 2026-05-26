'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function Astronaut() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      const t = state.clock.elapsedTime;
      // Gentle floating motion
      groupRef.current.position.y = -1 + Math.sin(t * 0.5) * 0.3;
      groupRef.current.rotation.z = Math.sin(t * 0.3) * 0.1;
      groupRef.current.rotation.x = Math.sin(t * 0.2) * 0.05;
    }
  });

  const suitColor = '#e8e8f0';
  const visorColor = new THREE.Color(0.5, 1.2, 2.0);

  return (
    <group ref={groupRef} position={[-3, -1, 1]} scale={0.35}>
      {/* Helmet */}
      <mesh position={[0, 1.8, 0]}>
        <sphereGeometry args={[0.55, 16, 16]} />
        <meshStandardMaterial color={suitColor} metalness={0.2} roughness={0.6} />
      </mesh>

      {/* Visor */}
      <mesh position={[0, 1.8, 0.35]}>
        <sphereGeometry args={[0.35, 16, 16, 0, Math.PI, 0, Math.PI * 0.6]} />
        <meshBasicMaterial
          color={visorColor}
          transparent
          opacity={0.7}
          toneMapped={false}
        />
      </mesh>

      {/* Body / Torso */}
      <mesh position={[0, 0.7, 0]}>
        <capsuleGeometry args={[0.45, 0.8, 8, 16]} />
        <meshStandardMaterial color={suitColor} metalness={0.15} roughness={0.7} />
      </mesh>

      {/* Backpack / Life support */}
      <mesh position={[0, 0.8, -0.45]}>
        <boxGeometry args={[0.6, 0.8, 0.3]} />
        <meshStandardMaterial color="#ccccdd" metalness={0.3} roughness={0.5} />
      </mesh>

      {/* Left arm */}
      <mesh position={[-0.65, 0.8, 0]} rotation={[0, 0, 0.4]}>
        <capsuleGeometry args={[0.15, 0.6, 6, 12]} />
        <meshStandardMaterial color={suitColor} metalness={0.15} roughness={0.7} />
      </mesh>

      {/* Right arm */}
      <mesh position={[0.65, 0.9, 0.1]} rotation={[0.3, 0, -0.6]}>
        <capsuleGeometry args={[0.15, 0.6, 6, 12]} />
        <meshStandardMaterial color={suitColor} metalness={0.15} roughness={0.7} />
      </mesh>

      {/* Left leg */}
      <mesh position={[-0.22, -0.2, 0]} rotation={[0.1, 0, 0.05]}>
        <capsuleGeometry args={[0.17, 0.7, 6, 12]} />
        <meshStandardMaterial color={suitColor} metalness={0.15} roughness={0.7} />
      </mesh>

      {/* Right leg */}
      <mesh position={[0.22, -0.3, 0.1]} rotation={[-0.2, 0, -0.05]}>
        <capsuleGeometry args={[0.17, 0.7, 6, 12]} />
        <meshStandardMaterial color={suitColor} metalness={0.15} roughness={0.7} />
      </mesh>

      {/* Helmet light */}
      <mesh position={[0, 2.1, 0.3]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshBasicMaterial
          color={new THREE.Color(2.0, 2.0, 2.0)}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}
