'use client';

import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Preload } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import StarField from './StarField';
import Planet from './Planet';
import GalaxySpiral from './GalaxySpiral';
import SpaceStation from './SpaceStation';
import Astronaut from './Astronaut';

export default function SpaceScene() {
  return (
    <div
      id="space-canvas"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 1,
        background: '#030014',
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 8], fov: 55, near: 0.1, far: 500 }}
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
        }}
      >
        <color attach="background" args={['#030014']} />

        <ambientLight intensity={0.15} />
        <directionalLight position={[10, 8, 5]} intensity={1.2} color="#ffffff" />
        <pointLight position={[-5, 3, -3]} intensity={0.5} color="#7b2ff7" />
        <pointLight position={[6, -2, 4]} intensity={0.3} color="#00d4ff" />

        <Suspense fallback={null}>
          <StarField />
          <Planet />
          <GalaxySpiral />
          <SpaceStation />
          <Astronaut />
        </Suspense>

        <EffectComposer>
          <Bloom
            mipmapBlur
            intensity={0.8}
            luminanceThreshold={0.9}
            luminanceSmoothing={0.5}
            radius={0.8}
          />
        </EffectComposer>

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.3}
          maxPolarAngle={Math.PI / 1.5}
          minPolarAngle={Math.PI / 3}
        />

        <Preload all />
      </Canvas>
    </div>
  );
}
