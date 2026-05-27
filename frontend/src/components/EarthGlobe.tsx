import { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { Satellite, Debris, Threat, GroundStation } from '../lib/SimulationEngine';

interface EarthGlobeProps {
  sim: any; // Return type of useSimulation
}

// Convert lat/lon to 3D sphere position
function latLonToVec3(lat: number, lon: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

export default function EarthGlobe({ sim }: EarthGlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const frameRef = useRef<number>(0);
  const zoomSliderRef = useRef<HTMLInputElement>(null);
  
  // Refs for dynamic objects so we don't recreate them every render
  const objectsRef = useRef<{
    satellites: Record<string, THREE.Mesh>,
    debris: THREE.Points | null,
    threats: Record<string, THREE.Mesh>,
    earthGroup: THREE.Group | null
  }>({ satellites: {}, debris: null, threats: {}, earthGroup: null });

  const initScene = useCallback(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 3.5);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const earthGroup = new THREE.Group();
    scene.add(earthGroup);
    objectsRef.current.earthGroup = earthGroup;

    // Earth Sphere (High-res texture approach)
    const earthRadius = 1.0;
    const earthGeo = new THREE.SphereGeometry(earthRadius, 64, 64);
    
    // Fallback simple dark material if texture fails or loading
    const earthMat = new THREE.MeshPhongMaterial({
      color: 0x051122,
      emissive: 0x020510,
      specular: 0x111111,
      shininess: 10,
    });

    const textureLoader = new THREE.TextureLoader();
    textureLoader.load('https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg', (tex) => {
      earthMat.map = tex;
      earthMat.color.setHex(0x55aaaa); // Tint it cyan-ish for aesthetic
      earthMat.needsUpdate = true;
    });

    const earth = new THREE.Mesh(earthGeo, earthMat);
    earthGroup.add(earth);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(5, 3, 5);
    scene.add(dirLight);

    // Atmosphere
    const atmosGeo = new THREE.SphereGeometry(earthRadius * 1.05, 64, 64);
    const atmosMat = new THREE.MeshPhongMaterial({
      color: 0x00d4ff,
      transparent: true,
      opacity: 0.15,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
    });
    const atmos = new THREE.Mesh(atmosGeo, atmosMat);
    earthGroup.add(atmos);

    // Grid
    const gridMat = new THREE.LineBasicMaterial({ color: 0x00d4ff, transparent: true, opacity: 0.1 });
    const gridGeo = new THREE.EdgesGeometry(new THREE.SphereGeometry(earthRadius * 1.01, 16, 16));
    const grid = new THREE.LineSegments(gridGeo, gridMat);
    earthGroup.add(grid);

    // Ground Stations
    const gsGeo = new THREE.ConeGeometry(0.015, 0.04, 3);
    gsGeo.rotateX(Math.PI/2);
    const gsMat = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    sim.groundStations.forEach((gs: GroundStation) => {
      const gsMesh = new THREE.Mesh(gsGeo, gsMat);
      const pos = latLonToVec3(gs.lat, gs.lon, earthRadius);
      gsMesh.position.copy(pos);
      gsMesh.lookAt(new THREE.Vector3(0,0,0)); // point inward
      earthGroup.add(gsMesh);
    });

    // Mouse Controls
    let isDragging = false;
    let prevMouse = { x: 0, y: 0 };
    let rotationTarget = { x: 0, y: 0 };
    let currentRotation = { x: 0, y: 0 };

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouse = { x: e.clientX, y: e.clientY };
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - prevMouse.x;
      const dy = e.clientY - prevMouse.y;
      rotationTarget.y += dx * 0.005;
      rotationTarget.x += dy * 0.005;
      rotationTarget.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, rotationTarget.x));
      prevMouse = { x: e.clientX, y: e.clientY };
    };
    const onMouseUp = () => isDragging = false;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const newZ = Math.max(1.5, Math.min(8, camera.position.z + e.deltaY * 0.002));
      camera.position.z = newZ;
      if (zoomSliderRef.current) {
        zoomSliderRef.current.value = (((8.0 - newZ) / 6.5) * 100).toString();
      }
    };

    renderer.domElement.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    renderer.domElement.addEventListener('wheel', onWheel);

    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);

      // Smooth rotate
      currentRotation.x += (rotationTarget.x - currentRotation.x) * 0.1;
      currentRotation.y += (rotationTarget.y - currentRotation.y) * 0.1;
      earthGroup.rotation.x = currentRotation.x;
      earthGroup.rotation.y = currentRotation.y;

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      renderer.domElement.removeEventListener('wheel', onWheel);
      cancelAnimationFrame(frameRef.current);
      renderer.dispose();
    };
  }, [sim.groundStations]);

  useEffect(() => {
    const cleanup = initScene();
    return cleanup;
  }, [initScene]);

  // Sync dynamic simulation objects (Satellites, Debris, Threats)
  useEffect(() => {
    if (!objectsRef.current.earthGroup) return;
    const group = objectsRef.current.earthGroup;

    // Update Satellites
    sim.satellites.forEach((sat: Satellite) => {
      let mesh = objectsRef.current.satellites[sat.id];
      if (!mesh) {
        // Cyan diamond
        const geo = new THREE.OctahedronGeometry(0.02, 0);
        const mat = new THREE.MeshBasicMaterial({ color: 0x00d4ff });
        mesh = new THREE.Mesh(geo, mat);
        group.add(mesh);
        objectsRef.current.satellites[sat.id] = mesh;
      }
      const r = 1.0 + (sat.pos.alt / 6371);
      mesh.position.copy(latLonToVec3(sat.pos.lat, sat.pos.lon, r));
      
      // Highlight selected
      if (sim.selectedSatId === sat.id) {
        mesh.scale.setScalar(1.5);
        (mesh.material as THREE.MeshBasicMaterial).color.setHex(0xffffff);
      } else {
        mesh.scale.setScalar(1);
        (mesh.material as THREE.MeshBasicMaterial).color.setHex(0x00d4ff);
      }
    });

    // Update Debris (Points)
    if (!objectsRef.current.debris) {
      const geo = new THREE.BufferGeometry();
      const posArray = new Float32Array(sim.debris.length * 3);
      geo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
      const mat = new THREE.PointsMaterial({ color: 0x4466ff, size: 0.015 });
      const points = new THREE.Points(geo, mat);
      group.add(points);
      objectsRef.current.debris = points;
    }
    const debPositions = objectsRef.current.debris.geometry.attributes.position.array as Float32Array;
    sim.debris.forEach((deb: Debris, i: number) => {
      const r = 1.0 + (deb.pos.alt / 6371);
      const v = latLonToVec3(deb.pos.lat, deb.pos.lon, r);
      debPositions[i*3] = v.x;
      debPositions[i*3+1] = v.y;
      debPositions[i*3+2] = v.z;
    });
    objectsRef.current.debris.geometry.attributes.position.needsUpdate = true;

    // Update Threats
    // First, clear missing threats
    const currentThreatIds = new Set(sim.threats.map((t: Threat) => t.id));
    Object.keys(objectsRef.current.threats).forEach(id => {
      if (!currentThreatIds.has(id)) {
        group.remove(objectsRef.current.threats[id]);
        delete objectsRef.current.threats[id];
      }
    });
    
    // Add/Update existing threats
    sim.threats.forEach((thr: Threat) => {
      let mesh = objectsRef.current.threats[thr.id];
      if (!mesh) {
        // Red square (Box)
        const geo = new THREE.BoxGeometry(0.02, 0.02, 0.02);
        const mat = new THREE.MeshBasicMaterial({ color: 0xff4444 });
        mesh = new THREE.Mesh(geo, mat);
        group.add(mesh);
        objectsRef.current.threats[thr.id] = mesh;
      }
      const r = 1.0 + (thr.pos.alt / 6371);
      mesh.position.copy(latLonToVec3(thr.pos.lat, thr.pos.lon, r));
      // Pulse animation based on time
      const scale = 1.0 + Math.sin(Date.now() * 0.005) * 0.3;
      mesh.scale.setScalar(scale);
    });

  }, [sim.time, sim.satellites, sim.debris, sim.threats, sim.selectedSatId]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div
        ref={containerRef}
        style={{ width: '100%', height: '100%', cursor: 'grab' }}
      />
      {/* Zoom Slider Overlay */}
      <div style={{
        position: 'absolute',
        right: '15px',
        top: '50%',
        transform: 'translateY(-50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        background: 'rgba(0, 0, 0, 0.5)',
        padding: '10px 5px',
        borderRadius: '20px',
        border: '1px solid rgba(0, 212, 255, 0.2)'
      }}>
        <span style={{ color: '#00d4ff', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer', userSelect: 'none' }} onClick={() => {
          if (cameraRef.current) {
            const newZ = Math.max(1.5, cameraRef.current.position.z - 0.5);
            cameraRef.current.position.z = newZ;
            if (zoomSliderRef.current) zoomSliderRef.current.value = (((8.0 - newZ) / 6.5) * 100).toString();
          }
        }}>+</span>
        <input 
          ref={zoomSliderRef}
          type="range" 
          min="0" 
          max="100" 
          step="1" 
          defaultValue={((8.0 - 3.5) / 6.5) * 100}
          style={{ 
            writingMode: 'vertical-lr', 
            direction: 'rtl',
            WebkitAppearance: 'slider-vertical',
            height: '100px', 
            cursor: 'pointer',
            accentColor: '#00d4ff'
          } as React.CSSProperties} 
          onChange={(e) => {
            if (cameraRef.current) {
              const val = parseFloat(e.target.value);
              cameraRef.current.position.z = 8.0 - (val / 100) * 6.5;
            }
          }}
        />
        <span style={{ color: '#00d4ff', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer', userSelect: 'none' }} onClick={() => {
          if (cameraRef.current) {
            const newZ = Math.min(8, cameraRef.current.position.z + 0.5);
            cameraRef.current.position.z = newZ;
            if (zoomSliderRef.current) zoomSliderRef.current.value = (((8.0 - newZ) / 6.5) * 100).toString();
          }
        }}>-</span>
      </div>
    </div>
  );
}
