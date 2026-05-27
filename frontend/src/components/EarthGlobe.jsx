import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const GROUND_STATIONS = [
  { id: 'IIT Delhi', lat: 28.54, lon: 77.19 },
  { id: 'Svalbard', lat: 78.22, lon: 15.62 },
  { id: 'Goldstone', lat: 35.42, lon: -116.89 },
  { id: 'Punta Arenas', lat: -53.15, lon: -70.90 },
  { id: 'ISTRAC', lat: 13.03, lon: 77.51 },
  { id: 'McMurdo', lat: -77.84, lon: 166.66 }
];

export default function EarthGlobe({ isPaused, satellites = [], debris = [], threats = [], onTelemetryUpdate, onCollisionWarning }) {
  const mountRef = useRef(null);
  
  // Refs to hold our 3D groups so we can update them without re-creating the scene
  const sceneRef = useRef(null);
  const dataGroupRef = useRef(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const TEXTURE_PATH = 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/123879/';
    const earthRadius = 80;
    
    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, mountRef.current.clientWidth / mountRef.current.clientHeight, 1, 10000);
    camera.position.set(0, 0, earthRadius * 4);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    mountRef.current.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = true;
    controls.enableZoom = true; 
    controls.maxDistance = earthRadius * 8;
    controls.minDistance = earthRadius * 2;

    // Groups
    const baseRotationPoint = new THREE.Group();
    scene.add(baseRotationPoint);
    
    const worldRotationPoint = new THREE.Group();
    scene.add(worldRotationPoint);

    const dataGroup = new THREE.Group(); // Holds satellites, debris, threats
    worldRotationPoint.add(dataGroup);
    dataGroupRef.current = dataGroup;

    // Lighting - modern Three.js requires 0 decay to simulate legacy PointLights over large distances, or high intensity.
    scene.add(new THREE.AmbientLight(0x222222, 2)); // Boosted ambient

    const sun = new THREE.DirectionalLight(0xffeecc, 3); // Sun is better as DirectionalLight
    sun.position.set(-400, 0, 100);
    scene.add(sun);

    // Fill lights
    const light2 = new THREE.DirectionalLight(0xffffff, 0.8);
    light2.position.set(-400, 0, 250);
    scene.add(light2);
    
    const light3 = new THREE.DirectionalLight(0xffffff, 0.8);
    light3.position.set(-400, 0, -150);
    scene.add(light3);

    // Earth Sphere
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');
    
    const texture = loader.load(TEXTURE_PATH + 'ColorMap.jpg');
    const bump = loader.load(TEXTURE_PATH + 'Bump.jpg');
    const spec = loader.load(TEXTURE_PATH + 'SpecMask.jpg');
    const alpha = loader.load(TEXTURE_PATH + 'alphaMap.jpg');

    const earthGeo = new THREE.SphereGeometry(earthRadius, 64, 64);
    const earthMat = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      shininess: 5,
      map: texture,
      specularMap: spec,
      specular: new THREE.Color(0x333333),
      bumpMap: bump,
    });
    
    const sphere = new THREE.Mesh(earthGeo, earthMat);
    sphere.rotation.y = -1 * (8.7 * Math.PI / 17); // Focus on prime meridian
    worldRotationPoint.add(sphere);

    // Cloud Layer
    const cloudGeo = new THREE.SphereGeometry(earthRadius + 0.5, 64, 64);
    const cloudMat = new THREE.MeshPhongMaterial({
      alphaMap: alpha,
      transparent: true,
      side: THREE.DoubleSide
    });
    const sphereCloud = new THREE.Mesh(cloudGeo, cloudMat);
    worldRotationPoint.add(sphereCloud);

    // Glow Sprite
    const glowMap = loader.load(TEXTURE_PATH + "glow.png");
    const spriteMaterial = new THREE.SpriteMaterial({
      map: glowMap,
      color: 0x0099ff,
      transparent: true,
      blending: THREE.AdditiveBlending
    });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(earthRadius * 2.5, earthRadius * 2.5, 1.0);
    worldRotationPoint.add(sprite);

    // Skybox (stars)
    const cubeLoader = new THREE.CubeTextureLoader();
    cubeLoader.setCrossOrigin('anonymous');
    const urls = Array(6).fill(TEXTURE_PATH + 'test.jpg');
    cubeLoader.load(urls, (textureCube) => {
      scene.background = textureCube;
    });

    // Animation Loop
    let animationId;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      if (!isPaused) {
        // Clouds move slightly independently
        sphereCloud.rotation.y += 0.00025;
      }
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Handle Resize
    const handleResize = () => {
      if (!mountRef.current) return;
      camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
      if (mountRef.current) mountRef.current.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []); // Only run once on mount

  // Sync React State (Satellites, Debris) into Three.js Data Group
  useEffect(() => {
    if (!dataGroupRef.current) return;
    
    const group = dataGroupRef.current;
    
    // Clear existing objects
    while(group.children.length > 0){ 
        const child = group.children[0];
        group.remove(child); 
        if (child.geometry) child.geometry.dispose();
        if (child.material) child.material.dispose();
    }

    const earthRadius = 80;

    // Helper: Convert Lat/Lon/Alt to Cartesian
    const getPos = (lat, lon, altKm) => {
      const scale = 1 + (altKm / 6371); 
      const r = earthRadius * scale;
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lon + 180) * (Math.PI / 180); // shift lon by 180 to align with map texture
      
      const x = -(r * Math.sin(phi) * Math.cos(theta));
      const z = (r * Math.sin(phi) * Math.sin(theta));
      const y = r * Math.cos(phi);
      
      return new THREE.Vector3(x, y, z);
    };

    // Draw Satellites (Cyan diamonds)
    const satGeo = new THREE.OctahedronGeometry(1.5, 0);
    const satMat = new THREE.MeshBasicMaterial({ color: 0x00ffff, wireframe: true });
    
    satellites.forEach((sat, i) => {
      const mesh = new THREE.Mesh(satGeo, satMat);
      mesh.position.copy(getPos(sat.lat, sat.lon, sat.alt));
      group.add(mesh);

      // Report telemetry for alpha-1
      if (i === 0 && onTelemetryUpdate) {
        onTelemetryUpdate({
          altitude: sat.alt,
          velocity: 7.58, 
          lat: sat.lat,
          lon: sat.lon,
          inclination: 51.6
        });
      }
    });

    // Draw Ground Stations (Green Triangles / Cones)
    const gsGeo = new THREE.ConeGeometry(1.5, 3, 4);
    gsGeo.rotateX(Math.PI / 2); // Point outward
    const gsMat = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    GROUND_STATIONS.forEach(gs => {
      const mesh = new THREE.Mesh(gsGeo, gsMat);
      const pos = getPos(gs.lat, gs.lon, 0);
      mesh.position.copy(pos);
      mesh.lookAt(new THREE.Vector3(0,0,0)); // base facing earth
      group.add(mesh);
    });

    // Draw Debris (Blue points)
    // We use InstancedMesh or Points for performance, but simple Points is easier.
    if (debris.length > 0) {
      const pointsGeo = new THREE.BufferGeometry();
      const vertices = [];
      // Only draw 500 for perf, debris format: [id, lat, lon, alt]
      debris.slice(0, 500).forEach(d => {
        const v = getPos(d[1], d[2], d[3]);
        vertices.push(v.x, v.y, v.z);
      });
      pointsGeo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
      const pointsMat = new THREE.PointsMaterial({ color: 0x4488ff, size: 0.8 });
      const points = new THREE.Points(pointsGeo, pointsMat);
      group.add(points);
    }

    // Draw Threats (Red pulsing)
    if (threats.length > 0) {
      const thrGeo = new THREE.SphereGeometry(2, 16, 16);
      const thrMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
      threats.forEach(t => {
        const mesh = new THREE.Mesh(thrGeo, thrMat);
        mesh.position.copy(getPos(t.pos.lat, t.pos.lon, t.pos.alt));
        group.add(mesh);
      });

      // Cola Warning
      const t = threats[0];
      if (t.timeToCollision < 1800) {
         if (onCollisionWarning) onCollisionWarning(true);
      } else {
         if (onCollisionWarning) onCollisionWarning(false);
      }
    } else {
      if (onCollisionWarning) onCollisionWarning(false);
    }

  }, [satellites, debris, threats, onTelemetryUpdate, onCollisionWarning]);

  return (
    <div ref={mountRef} style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }} />
  );
}
