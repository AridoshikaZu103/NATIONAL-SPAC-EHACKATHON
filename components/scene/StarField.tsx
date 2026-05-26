'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function StarField() {
  const pointsRef = useRef<THREE.Points>(null);

  const { positions, colors, sizes } = useMemo(() => {
    const count = 6000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      // Distribute in a sphere
      const radius = 80 + Math.random() * 120;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = radius * Math.cos(phi);

      // Vary star colors: white, blue-white, warm-white
      const colorChoice = Math.random();
      if (colorChoice < 0.6) {
        // White
        colors[i3] = 0.9 + Math.random() * 0.1;
        colors[i3 + 1] = 0.9 + Math.random() * 0.1;
        colors[i3 + 2] = 1.0;
      } else if (colorChoice < 0.8) {
        // Blue-white
        colors[i3] = 0.6 + Math.random() * 0.2;
        colors[i3 + 1] = 0.8 + Math.random() * 0.2;
        colors[i3 + 2] = 1.0;
      } else {
        // Warm gold
        colors[i3] = 1.0;
        colors[i3 + 1] = 0.85 + Math.random() * 0.15;
        colors[i3 + 2] = 0.6 + Math.random() * 0.2;
      }

      sizes[i] = Math.random() * 2.5 + 0.5;
    }

    return { positions, colors, sizes };
  }, []);

  useFrame((_, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.008;
      pointsRef.current.rotation.x += delta * 0.003;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
        <bufferAttribute
          attach="attributes-size"
          args={[sizes, 1]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={1.5}
        sizeAttenuation
        vertexColors
        transparent
        opacity={0.9}
        depthWrite={false}
      />
    </points>
  );
}
