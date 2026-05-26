'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function SpaceStation() {
  const groupRef = useRef(null);
  const orbitRef = useRef(null);

  useFrame((state) => {
    if (orbitRef.current) {
      const t = state.clock.elapsedTime * 0.15;
      orbitRef.current.position.x = Math.cos(t) * 5 + 3;
      orbitRef.current.position.z = Math.sin(t) * 5 - 2;
      orbitRef.current.position.y = Math.sin(t * 0.5) * 0.5 + 2;
      orbitRef.current.rotation.y = t;
    }
    if (groupRef.current) {
      groupRef.current.rotation.z += 0.002;
    }
  });

  return (
    <group ref={orbitRef}>
      <group ref={groupRef} scale={0.12}>
        <mesh>
          <cylinderGeometry args={[0.8, 0.8, 3, 8]} />
          <meshStandardMaterial color="#aabbcc" metalness={0.8} roughness={0.2} />
        </mesh>

        <mesh position={[-3, 0, 0]}>
          <boxGeometry args={[4, 0.05, 1.5]} />
          <meshStandardMaterial color="#223366" metalness={0.6} roughness={0.3} />
        </mesh>

        <mesh position={[3, 0, 0]}>
          <boxGeometry args={[4, 0.05, 1.5]} />
          <meshStandardMaterial color="#223366" metalness={0.6} roughness={0.3} />
        </mesh>

        <mesh>
          <boxGeometry args={[10, 0.15, 0.15]} />
          <meshStandardMaterial color="#888888" metalness={0.9} roughness={0.1} />
        </mesh>

        <mesh position={[0, 0, 1.2]}>
          <cylinderGeometry args={[0.5, 0.5, 1.5, 6]} />
          <meshStandardMaterial color="#99aabc" metalness={0.7} roughness={0.3} />
        </mesh>

        <mesh position={[0, 1.8, 0]}>
          <cylinderGeometry args={[0.3, 0.4, 0.6, 8]} />
          <meshStandardMaterial color="#bbccdd" metalness={0.8} roughness={0.2} />
        </mesh>

        <mesh position={[0, -1.8, 0]}>
          <coneGeometry args={[0.2, 1, 6]} />
          <meshStandardMaterial color="#cccccc" metalness={0.9} roughness={0.1} />
        </mesh>

        <mesh position={[0, 0.5, 0.85]}>
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshBasicMaterial color={new THREE.Color(1.5, 1.2, 0.5)} toneMapped={false} />
        </mesh>
        <mesh position={[0, -0.3, 0.85]}>
          <sphereGeometry args={[0.08, 8, 8]} />
          <meshBasicMaterial color={new THREE.Color(1.5, 1.2, 0.5)} toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
}
