import { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { Satellite, Debris, Threat, GroundStation } from '../lib/SimulationEngine';

interface EarthGlobeProps {
  sim: any;
}

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

  const objectsRef = useRef<{
    satellites: Record<string, THREE.Mesh>,
    debris: THREE.Points | null,
    threats: Record<string, THREE.Mesh>,
    trailLines: Record<string, THREE.Line>,
    earthGroup: THREE.Group | null
  }>({ satellites: {}, debris: null, threats: {}, trailLines: {}, earthGroup: null });

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

    // Earth Sphere
    const earthRadius = 1.0;
    const earthGeo = new THREE.SphereGeometry(earthRadius, 64, 64);
    const earthMat = new THREE.MeshPhongMaterial({
      color: 0x051122,
      emissive: 0x020510,
      specular: 0x111111,
      shininess: 10,
    });

    const textureLoader = new THREE.TextureLoader();
    textureLoader.load('https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg', (tex) => {
      earthMat.map = tex;
      earthMat.color.setHex(0x55aaaa);
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

    // Atmosphere glow
    const atmosGeo = new THREE.SphereGeometry(earthRadius * 1.05, 64, 64);
    const atmosMat = new THREE.MeshPhongMaterial({
      color: 0x00d4ff,
      transparent: true,
      opacity: 0.12,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
    });
    earthGroup.add(new THREE.Mesh(atmosGeo, atmosMat));

    // Grid
    const gridMat = new THREE.LineBasicMaterial({ color: 0x00d4ff, transparent: true, opacity: 0.08 });
    const gridGeo = new THREE.EdgesGeometry(new THREE.SphereGeometry(earthRadius * 1.01, 16, 16));
    earthGroup.add(new THREE.LineSegments(gridGeo, gridMat));

    // Ground Stations (green cones)
    const gsGeo = new THREE.ConeGeometry(0.015, 0.04, 3);
    gsGeo.rotateX(Math.PI / 2);
    const gsMat = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    sim.groundStations.forEach((gs: GroundStation) => {
      const gsMesh = new THREE.Mesh(gsGeo, gsMat);
      const pos = latLonToVec3(gs.lat, gs.lon, earthRadius);
      gsMesh.position.copy(pos);
      gsMesh.lookAt(new THREE.Vector3(0, 0, 0));
      earthGroup.add(gsMesh);
    });

    // Orbital Ring (550km, dashed white)
    const r_orb = 1.0 + (550 / 6371);
    const orbitPoints: THREE.Vector3[] = [];
    for (let i = 0; i <= 128; i++) {
      const a = (i / 128) * Math.PI * 2;
      orbitPoints.push(new THREE.Vector3(Math.cos(a) * r_orb, Math.sin(a) * r_orb, 0));
    }
    const orbitGeo = new THREE.BufferGeometry().setFromPoints(orbitPoints);
    const orbitMat = new THREE.LineDashedMaterial({ color: 0xffffff, dashSize: 0.04, gapSize: 0.04, transparent: true, opacity: 0.25 });
    const orbitalRing = new THREE.Line(orbitGeo, orbitMat);
    orbitalRing.computeLineDistances();
    earthGroup.add(orbitalRing);

    // Terminator Line (dashed yellow, YZ plane)
    const termPoints: THREE.Vector3[] = [];
    for (let i = 0; i <= 128; i++) {
      const a = (i / 128) * Math.PI * 2;
      termPoints.push(new THREE.Vector3(0, Math.cos(a) * 1.001, Math.sin(a) * 1.001));
    }
    const termGeo = new THREE.BufferGeometry().setFromPoints(termPoints);
    const termMat = new THREE.LineDashedMaterial({ color: 0xffaa00, dashSize: 0.04, gapSize: 0.04 });
    const terminator = new THREE.Line(termGeo, termMat);
    terminator.computeLineDistances();
    earthGroup.add(terminator);

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

    // Wheel zoom — works inside the globe canvas only (stopPropagation prevents page scroll conflict)
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (cameraRef.current) {
        const newZ = cameraRef.current.position.z + e.deltaY * 0.002;
        cameraRef.current.position.z = Math.max(1.5, Math.min(8, newZ));
      }
    };

    renderer.domElement.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    renderer.domElement.addEventListener('wheel', onWheel, { passive: false });

    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
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

  // Sync dynamic objects
  useEffect(() => {
    if (!objectsRef.current.earthGroup) return;
    const group = objectsRef.current.earthGroup;

    // ── Satellites ──
    sim.satellites.forEach((sat: Satellite) => {
      let mesh = objectsRef.current.satellites[sat.id];
      if (!mesh) {
        const geo = new THREE.OctahedronGeometry(0.02, 0);
        const mat = new THREE.MeshBasicMaterial({ color: 0x00d4ff });
        mesh = new THREE.Mesh(geo, mat);
        group.add(mesh);
        objectsRef.current.satellites[sat.id] = mesh;
      }
      const r = 1.0 + (sat.pos.alt / 6371);
      mesh.position.copy(latLonToVec3(sat.pos.lat, sat.pos.lon, r));

      if (sim.selectedSatId === sat.id) {
        mesh.scale.setScalar(1.5);
        (mesh.material as THREE.MeshBasicMaterial).color.setHex(0xffffff);
      } else {
        mesh.scale.setScalar(1);
        (mesh.material as THREE.MeshBasicMaterial).color.setHex(0x00d4ff);
      }

      // ── Trail: short line from prev position to current ──
      let trailLine = objectsRef.current.trailLines[sat.id];
      if (!trailLine) {
        const mat = new THREE.LineBasicMaterial({ color: 0x00d4ff, transparent: true, opacity: 0.35 });
        const geo = new THREE.BufferGeometry();
        // Pre-allocate for 8 points
        const arr = new Float32Array(8 * 3);
        geo.setAttribute('position', new THREE.BufferAttribute(arr, 3));
        geo.setDrawRange(0, 0);
        trailLine = new THREE.Line(geo, mat);
        group.add(trailLine);
        objectsRef.current.trailLines[sat.id] = trailLine;
        (trailLine as any)._trailHistory = [];
      }

      const history = (trailLine as any)._trailHistory as THREE.Vector3[];
      const newPos = mesh.position.clone();

      // Only push if moved enough (prevents spam from polling)
      if (history.length === 0 || history[history.length - 1].distanceTo(newPos) > 0.005) {
        history.push(newPos);
        // Keep only last 8 positions — prevents the mesh buildup
        if (history.length > 8) history.shift();
      }

      trailLine.visible = sim.showTrails;
      if (sim.showTrails && history.length > 1) {
        const posAttr = trailLine.geometry.attributes.position;
        for (let j = 0; j < history.length; j++) {
          (posAttr.array as Float32Array)[j * 3] = history[j].x;
          (posAttr.array as Float32Array)[j * 3 + 1] = history[j].y;
          (posAttr.array as Float32Array)[j * 3 + 2] = history[j].z;
        }
        posAttr.needsUpdate = true;
        trailLine.geometry.setDrawRange(0, history.length);
      }
    });

    // ── Debris ──
    if (!objectsRef.current.debris) {
      const geo = new THREE.BufferGeometry();
      const posArray = new Float32Array(sim.debris.length * 3);
      geo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
      const mat = new THREE.PointsMaterial({ color: 0x4466ff, size: 0.012, transparent: true, opacity: 0.7 });
      const points = new THREE.Points(geo, mat);
      group.add(points);
      objectsRef.current.debris = points;
    }

    objectsRef.current.debris.visible = sim.showDebris;

    if (sim.showDebris) {
      const debPositions = objectsRef.current.debris.geometry.attributes.position.array as Float32Array;
      sim.debris.forEach((deb: Debris, i: number) => {
        const r = 1.0 + (deb.pos.alt / 6371);
        const v = latLonToVec3(deb.pos.lat, deb.pos.lon, r);
        debPositions[i * 3] = v.x;
        debPositions[i * 3 + 1] = v.y;
        debPositions[i * 3 + 2] = v.z;
      });
      objectsRef.current.debris.geometry.attributes.position.needsUpdate = true;
    }

    // ── Threats ──
    const currentThreatIds = new Set(sim.threats.map((t: Threat) => t.id));
    Object.keys(objectsRef.current.threats).forEach(id => {
      if (!currentThreatIds.has(id)) {
        group.remove(objectsRef.current.threats[id]);
        delete objectsRef.current.threats[id];
      }
    });

    sim.threats.forEach((thr: Threat) => {
      let mesh = objectsRef.current.threats[thr.id];
      if (!mesh) {
        const geo = new THREE.BoxGeometry(0.025, 0.025, 0.025);
        const mat = new THREE.MeshBasicMaterial({ color: 0xff4444 });
        mesh = new THREE.Mesh(geo, mat);
        group.add(mesh);
        objectsRef.current.threats[thr.id] = mesh;
      }
      const r = 1.0 + (thr.pos.alt / 6371);
      mesh.position.copy(latLonToVec3(thr.pos.lat, thr.pos.lon, r));
      const scale = 1.0 + Math.sin(Date.now() * 0.005) * 0.3;
      mesh.scale.setScalar(scale);
    });

  }, [sim.time, sim.satellites, sim.debris, sim.threats, sim.selectedSatId, sim.showDebris, sim.showTrails]);

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', cursor: 'grab' }}
    />
  );
}
