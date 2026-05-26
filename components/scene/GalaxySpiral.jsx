'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function GalaxySpiral() {
  const pointsRef = useRef(null);

  const { posAttr, colorAttr } = useMemo(() => {
    const count = 4000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const branches = 3;
    const spin = 2.5;
    const radius = 8;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const r = Math.random() * radius;
      const branchAngle = ((i % branches) / branches) * Math.PI * 2;
      const spinAngle = r * spin;

      const randomX = (Math.random() - 0.5) * (r * 0.35);
      const randomY = (Math.random() - 0.5) * (r * 0.08);
      const randomZ = (Math.random() - 0.5) * (r * 0.35);

      positions[i3] = Math.cos(branchAngle + spinAngle) * r + randomX;
      positions[i3 + 1] = randomY;
      positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * r + randomZ;

      const t = r / radius;
      const innerColor = new THREE.Color('#ffcc77');
      const outerColor = new THREE.Color('#5533dd');
      const mixed = innerColor.clone().lerp(outerColor, t);

      colors[i3] = mixed.r;
      colors[i3 + 1] = mixed.g;
      colors[i3 + 2] = mixed.b;
    }

    return {
      posAttr: new THREE.Float32BufferAttribute(positions, 3),
      colorAttr: new THREE.Float32BufferAttribute(colors, 3),
    };
  }, []);

  useFrame((_, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.04;
    }
  });

  return (
    <group position={[-12, 4, -25]} rotation={[0.5, 0.3, 0.2]}>
      <points ref={pointsRef}>
        <bufferGeometry>
          <primitive attach="attributes-position" object={posAttr} />
          <primitive attach="attributes-color" object={colorAttr} />
        </bufferGeometry>
        <pointsMaterial
          size={0.15}
          sizeAttenuation
          vertexColors
          transparent
          opacity={0.85}
          depthWrite={false}
          toneMapped={false}
        />
      </points>
      <mesh>
        <sphereGeometry args={[0.8, 16, 16]} />
        <meshBasicMaterial
          color={new THREE.Color(2.0, 1.5, 0.8)}
          transparent
          opacity={0.3}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}
