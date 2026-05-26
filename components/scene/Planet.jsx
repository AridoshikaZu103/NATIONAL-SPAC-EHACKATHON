'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function Planet() {
  const planetRef = useRef(null);
  const atmosphereRef = useRef(null);
  const cloudRef = useRef(null);

  const surfaceTexture = useMemo(() => {
    const size = 256;
    const data = new Uint8Array(size * size * 4);

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const i = (y * size + x) * 4;
        const nx = x / size;
        const ny = y / size;

        const n1 = Math.sin(nx * 12 + ny * 8) * 0.5 + 0.5;
        const n2 = Math.sin(nx * 20 - ny * 15 + 3) * 0.5 + 0.5;
        const n3 = Math.sin(nx * 8 + ny * 25 - 1) * 0.5 + 0.5;
        const mixed = n1 * 0.5 + n2 * 0.3 + n3 * 0.2;

        const lat = Math.abs(ny - 0.5) * 2;

        if (lat > 0.85) {
          data[i] = 220;
          data[i + 1] = 230;
          data[i + 2] = 245;
        } else if (mixed > 0.55) {
          data[i] = Math.floor(40 + mixed * 60);
          data[i + 1] = Math.floor(80 + mixed * 80);
          data[i + 2] = Math.floor(30 + mixed * 40);
        } else {
          data[i] = Math.floor(10 + mixed * 30);
          data[i + 1] = Math.floor(40 + mixed * 60);
          data[i + 2] = Math.floor(120 + mixed * 100);
        }
        data[i + 3] = 255;
      }
    }

    const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
    texture.needsUpdate = true;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }, []);

  useFrame((_, delta) => {
    if (planetRef.current) {
      planetRef.current.rotation.y += delta * 0.05;
    }
    if (cloudRef.current) {
      cloudRef.current.rotation.y += delta * 0.07;
    }
    if (atmosphereRef.current) {
      const scale = 1.12 + Math.sin(Date.now() * 0.001) * 0.005;
      atmosphereRef.current.scale.setScalar(scale);
    }
  });

  return (
    <group ref={planetRef} position={[3, -0.5, -2]}>
      <mesh>
        <sphereGeometry args={[2, 64, 64]} />
        <meshStandardMaterial map={surfaceTexture} roughness={0.8} metalness={0.1} />
      </mesh>

      <mesh ref={cloudRef}>
        <sphereGeometry args={[2.03, 48, 48]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.15} roughness={1} depthWrite={false} />
      </mesh>

      <mesh ref={atmosphereRef}>
        <sphereGeometry args={[2.25, 48, 48]} />
        <meshBasicMaterial color="#4488ff" transparent opacity={0.12} side={THREE.BackSide} depthWrite={false} toneMapped={false} />
      </mesh>

      <mesh>
        <sphereGeometry args={[2.15, 48, 48]} />
        <meshBasicMaterial
          color={new THREE.Color(0.3, 0.6, 2.0)}
          transparent
          opacity={0.08}
          side={THREE.BackSide}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}
