import { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';

// ── Types ──
interface TelemetryData {
  altitude: number;
  velocity: number;
  lat: number;
  lon: number;
  inclination: number;
}

interface EarthGlobeProps {
  isPaused?: boolean;
  onTelemetryUpdate?: (data: TelemetryData) => void;
  onCollisionWarning?: (active: boolean) => void;
}

// ── Constants & Helpers ──
const EARTH_RADIUS = 1.0;
const ALTITUDE_550KM = 0.086; // 550 / 6371 * 1.0
const ORBIT_RADIUS = EARTH_RADIUS + ALTITUDE_550KM;

// Ground station coordinates (Lat, Lon)
const GROUND_STATIONS = [
  { name: 'IIT Delhi', lat: 28.54, lon: 77.19 },
  { name: 'Svalbard', lat: 78.22, lon: 15.62 },
  { name: 'Goldstone', lat: 35.42, lon: -116.89 },
  { name: 'Punta Arenas', lat: -53.15, lon: -70.90 },
  { name: 'ISTRAC', lat: 13.03, lon: 77.51 },
  { name: 'McMurdo', lat: -77.84, lon: 166.66 },
];

function latLonToVec3(lat: number, lon: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

export default function EarthGlobe({ isPaused = false, onTelemetryUpdate, onCollisionWarning }: EarthGlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const frameRef = useRef<number>(0);
  const sceneRef = useRef<THREE.Scene | null>(null);

  // Mutable refs to hold animation state
  const stateRef = useRef({
    time: 0,
    isPaused: false,
    autoRotateSpeed: 0.001,
    rotationTarget: { x: 0.3, y: 0 },
    currentRotation: { x: 0.3, y: 0 }
  });

  // Sync prop to ref to avoid re-initializing the whole scene
  useEffect(() => {
    stateRef.current.isPaused = isPaused;
  }, [isPaused]);

  const initScene = useCallback(() => {
    if (!containerRef.current) return;

    if (rendererRef.current) {
      rendererRef.current.dispose();
      cancelAnimationFrame(frameRef.current);
    }

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 3.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // ── Stars background ──
    const starsGeo = new THREE.BufferGeometry();
    const starsCount = 2000;
    const starPositions = new Float32Array(starsCount * 3);
    for (let i = 0; i < starsCount * 3; i++) {
      starPositions[i] = (Math.random() - 0.5) * 100;
    }
    starsGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starsMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.05, transparent: true, opacity: 0.8 });
    scene.add(new THREE.Points(starsGeo, starsMat));

    // Group that will rotate (Earth + fixed objects on Earth)
    const earthGroup = new THREE.Group();
    scene.add(earthGroup);

    // Group for objects orbiting Earth (Satellites, Debris)
    const orbitGroup = new THREE.Group();
    scene.add(orbitGroup);

    // ── Earth sphere ──
    const earthGeo = new THREE.SphereGeometry(EARTH_RADIUS, 64, 64);
    
    // Light direction for day/night
    const lightDir = new THREE.Vector3(1.0, 0.2, 1.0).normalize();

    const earthMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uLightDir: { value: lightDir }
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec2 vUv;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec2 vUv;
        uniform float uTime;
        uniform vec3 uLightDir;

        float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float noise(vec2 p) {
          vec2 i = floor(p); vec2 f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
                     mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
        }
        float fbm(vec2 p) {
          float val = 0.0; float amp = 0.5;
          for (int i = 0; i < 5; i++) { val += amp * noise(p); p *= 2.0; amp *= 0.5; }
          return val;
        }

        void main() {
          float diff = max(dot(vNormal, normalize(uLightDir)), 0.0);
          float ambient = 0.12;

          vec2 uv = vUv * vec2(8.0, 4.0);
          float land = smoothstep(0.35, 0.5, fbm(uv + vec2(0.0, 0.5)));

          vec3 ocean = mix(vec3(0.02, 0.08, 0.25), vec3(0.05, 0.15, 0.45), fbm(uv * 2.0));
          vec3 landColor = mix(vec3(0.1, 0.35, 0.1), vec3(0.35, 0.28, 0.12), fbm(uv * 3.0 + vec2(10.0, 5.0)));
          
          float iceCap = smoothstep(0.85, 0.95, abs(vUv.y - 0.5) * 2.0);
          vec3 ice = vec3(0.85, 0.9, 0.95);

          vec3 surface = mix(ocean, landColor, land);
          surface = mix(surface, ice, iceCap);

          float nightSide = 1.0 - smoothstep(-0.1, 0.1, diff);
          float cities = step(0.7, fbm(uv * 10.0)) * land;
          vec3 cityLights = vec3(1.0, 0.8, 0.3) * cities * nightSide * 0.6;

          vec3 color = surface * (ambient + diff * 0.9) + cityLights;
          
          // Fresnel
          float fresnel = pow(1.0 - max(dot(vNormal, normalize(-vPosition)), 0.0), 3.0);
          color += vec3(0.3, 0.6, 1.0) * fresnel * 0.4;

          gl_FragColor = vec4(color, 1.0);
        }
      `,
    });
    earthGroup.add(new THREE.Mesh(earthGeo, earthMat));

    // ── Terminator Line (Day/Night Boundary) ──
    // Create a dashed yellow line separating day and night
    // The plane normal is the light direction
    const terminatorGeo = new THREE.BufferGeometry();
    const termPts = [];
    for (let i = 0; i <= 64; i++) {
        const theta = (i / 64) * Math.PI * 2;
        // Circle in XY plane
        const p = new THREE.Vector3(Math.cos(theta) * 1.002, Math.sin(theta) * 1.002, 0);
        termPts.push(p);
    }
    terminatorGeo.setFromPoints(termPts);
    const terminatorMat = new THREE.LineDashedMaterial({
        color: 0xffcc00,
        dashSize: 0.05,
        gapSize: 0.03,
        transparent: true,
        opacity: 0.8,
        linewidth: 2
    });
    const terminator = new THREE.Line(terminatorGeo, terminatorMat);
    terminator.computeLineDistances(); // Required for dashed line
    
    // Rotate terminator to align with light perpendicular plane
    terminator.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), lightDir);
    // Add to main scene, NOT earthGroup, because day/night doesn't rotate with Earth
    scene.add(terminator);

    // ── Ground Stations (Green Triangles) ──
    const stationGeo = new THREE.ConeGeometry(0.015, 0.04, 3);
    stationGeo.translate(0, 0.02, 0); // shift pivot to base
    stationGeo.rotateX(Math.PI / 2); // point outwards
    const stationMat = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    
    GROUND_STATIONS.forEach(station => {
      const mesh = new THREE.Mesh(stationGeo, stationMat);
      const pos = latLonToVec3(station.lat, station.lon, EARTH_RADIUS + 0.001);
      mesh.position.copy(pos);
      mesh.lookAt(new THREE.Vector3(0, 0, 0)); // look at center
      earthGroup.add(mesh);
    });

    // ── Orbital Ring (Dashed, 550km) ──
    // Orbit inclination 51.6 deg
    const inclination = 51.6 * (Math.PI / 180);
    const orbitRingGeo = new THREE.BufferGeometry();
    const ringPts = [];
    for (let i = 0; i <= 128; i++) {
      const th = (i / 128) * Math.PI * 2;
      const x = ORBIT_RADIUS * Math.cos(th);
      const y = ORBIT_RADIUS * Math.sin(th) * Math.cos(inclination);
      const z = ORBIT_RADIUS * Math.sin(th) * Math.sin(inclination);
      ringPts.push(new THREE.Vector3(x, y, z));
    }
    orbitRingGeo.setFromPoints(ringPts);
    const orbitRingMat = new THREE.LineDashedMaterial({ color: 0x666666, dashSize: 0.05, gapSize: 0.05, transparent: true, opacity: 0.5 });
    const orbitRing = new THREE.Line(orbitRingGeo, orbitRingMat);
    orbitRing.computeLineDistances();
    orbitGroup.add(orbitRing);

    // ── Walker Delta Constellation (6 Satellites: α1-α6) ──
    const satGeo = new THREE.OctahedronGeometry(0.02, 0);
    const satMat = new THREE.MeshBasicMaterial({ color: 0x00ffff }); // Cyan diamonds
    const satellites: THREE.Mesh[] = [];
    for (let i = 0; i < 6; i++) {
      const sat = new THREE.Mesh(satGeo, satMat);
      orbitGroup.add(sat);
      satellites.push(sat);
    }

    // ── Debris Belt (518 blue dots) ──
    const debrisGeo = new THREE.BufferGeometry();
    const debrisCount = 518;
    const debrisPos = new Float32Array(debrisCount * 3);
    for (let i = 0; i < debrisCount; i++) {
      // Random position in a spherical shell around 550km +/- 50km
      const altVar = (Math.random() - 0.5) * 0.02; 
      const r = ORBIT_RADIUS + altVar;
      const theta = Math.random() * Math.PI * 2;
      const u = Math.random() * 2 - 1;
      const v = Math.sqrt(1 - u * u);
      // Mostly near the orbital inclination band, so constrain u
      const constrainedU = u * Math.sin(inclination) * 1.5; 
      const constrainedV = Math.sqrt(1 - Math.min(1, constrainedU * constrainedU));

      debrisPos[i * 3] = r * constrainedV * Math.cos(theta);
      debrisPos[i * 3 + 1] = r * constrainedU;
      debrisPos[i * 3 + 2] = r * constrainedV * Math.sin(theta);
    }
    debrisGeo.setAttribute('position', new THREE.BufferAttribute(debrisPos, 3));
    const debrisMat = new THREE.PointsMaterial({ color: 0x4488ff, size: 0.015 });
    const debrisSystem = new THREE.Points(debrisGeo, debrisMat);
    orbitGroup.add(debrisSystem);

    // ── Threat Debris (Red Square) ──
    const earthGeometry = new THREE.SphereGeometry(1, 64, 64);
    const earthMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x051530,
      emissive: 0x010515,
      roughness: 0.6,
      metalness: 0.4,
      clearcoat: 0.2,
      clearcoatRoughness: 0.3
    });
    const earth = new THREE.Mesh(earthGeometry, earthMaterial);
    scene.add(earth);

    // Advanced Atmosphere Rim Glow
    const atmosphereMaterial = new THREE.MeshPhongMaterial({
      color: 0x00aaff,
      transparent: true,
      opacity: 0.15,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const atmosphere = new THREE.Mesh(new THREE.SphereGeometry(1.04, 64, 64), atmosphereMaterial);
    scene.add(atmosphere);

    const threatGeo = new THREE.BoxGeometry(0.03, 0.03, 0.03);
    const threatMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const threatDebris = new THREE.Mesh(threatGeo, threatMat);
    
    const threatGlowGeo = new THREE.BoxGeometry(0.05, 0.05, 0.05);
    const threatGlowMat = new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.4 });
    const threatGlow = new THREE.Mesh(threatGlowGeo, threatGlowMat);
    threatDebris.add(threatGlow);
    orbitGroup.add(threatDebris);


    // ── Mouse Controls ──
    let isDragging = false;
    let prevMouse = { x: 0, y: 0 };

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouse = { x: e.clientX, y: e.clientY };
      stateRef.current.autoRotateSpeed = 0;
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - prevMouse.x;
      const dy = e.clientY - prevMouse.y;
      stateRef.current.rotationTarget.y += dx * 0.005;
      stateRef.current.rotationTarget.x += dy * 0.005;
      stateRef.current.rotationTarget.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, stateRef.current.rotationTarget.x));
      prevMouse = { x: e.clientX, y: e.clientY };
    };
    const onMouseUp = () => {
      isDragging = false;
      setTimeout(() => { stateRef.current.autoRotateSpeed = 0.001; }, 2000);
    };
    const onWheel = (e: WheelEvent) => {
      camera.position.z = Math.max(1.5, Math.min(8, camera.position.z + e.deltaY * 0.002));
    };

    renderer.domElement.addEventListener('mousedown', onMouseDown);
    renderer.domElement.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('mouseup', onMouseUp);
    renderer.domElement.addEventListener('wheel', onWheel);

    // ── Animation Loop ──
    let simulationTime = 0;
    const clock = new THREE.Clock();

    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      
      const delta = clock.getDelta();
      const state = stateRef.current;
      
      if (!state.isPaused) {
        simulationTime += delta * 0.5;
      }

      state.rotationTarget.y += state.autoRotateSpeed;
      state.currentRotation.x += (state.rotationTarget.x - state.currentRotation.x) * 0.1;
      state.currentRotation.y += (state.rotationTarget.y - state.currentRotation.y) * 0.1;

      earthGroup.rotation.x = state.currentRotation.x;
      earthGroup.rotation.y = state.currentRotation.y;
      orbitGroup.rotation.x = state.currentRotation.x;
      orbitGroup.rotation.y = state.currentRotation.y;

      earthMat.uniforms.uTime.value += delta;

      if (!state.isPaused) {
          earthGroup.rotateY(delta * 0.1); 
      }

      satellites.forEach((sat, i) => {
        const offset = (i / 6) * Math.PI * 2;
        const angle = -simulationTime + offset;
        sat.position.set(
          ORBIT_RADIUS * Math.cos(angle),
          ORBIT_RADIUS * Math.sin(angle) * Math.cos(inclination),
          ORBIT_RADIUS * Math.sin(angle) * Math.sin(inclination)
        );
      });

      const alpha1Angle = -simulationTime;
      const threatAngle = alpha1Angle - 0.2 + (simulationTime * 0.05);
      
      threatDebris.position.set(
        ORBIT_RADIUS * Math.cos(threatAngle),
        ORBIT_RADIUS * Math.sin(threatAngle) * Math.cos(inclination + 0.02),
        ORBIT_RADIUS * Math.sin(threatAngle) * Math.sin(inclination + 0.02)
      );

      threatGlow.scale.setScalar(1.0 + Math.sin(performance.now() * 0.01) * 0.4);

      const dist = satellites[0].position.distanceTo(threatDebris.position);
      if (onCollisionWarning) {
        onCollisionWarning(dist < 0.15);
      }

      if (!state.isPaused) {
        debrisSystem.rotation.y += delta * 0.02;
      }

      if (onTelemetryUpdate && !state.isPaused && Math.floor(simulationTime * 10) % 5 === 0) {
        const satWorldPos = new THREE.Vector3();
        satellites[0].getWorldPosition(satWorldPos);
        
        const r = satWorldPos.length();
        const lat = Math.asin(satWorldPos.y / r) * (180 / Math.PI);
        const lon = Math.atan2(satWorldPos.z, satWorldPos.x) * (180 / Math.PI);

        onTelemetryUpdate({
          altitude: 550,
          velocity: 7.58,
          lat,
          lon,
          inclination: 51.6,
        });
      }

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

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '+' || e.key === '=') {
        camera.position.z = Math.max(1.5, camera.position.z - 0.5);
      } else if (e.key === '-') {
        camera.position.z = Math.min(10, camera.position.z + 0.5);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      renderer.domElement.removeEventListener('mousedown', onMouseDown);
      renderer.domElement.removeEventListener('mousemove', onMouseMove);
      renderer.domElement.removeEventListener('mouseup', onMouseUp);
      renderer.domElement.removeEventListener('wheel', onWheel);
      cancelAnimationFrame(frameRef.current);
      renderer.dispose();
    };
  }, [onTelemetryUpdate, onCollisionWarning]);

  useEffect(() => {
    const cleanup = initScene();
    return cleanup;
  }, [initScene]);

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', cursor: 'grab', borderRadius: '8px', overflow: 'hidden' }}
    />
  );
}
