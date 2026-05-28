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

export default function EarthGlobe({ isPaused, satellites = [], debris = [], threats = [], onTelemetryUpdate, onCollisionWarning, simTime = 0 }) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const dataGroupRef = useRef(null);
  const sunRef = useRef(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const TEXTURE_PATH = 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/123879/';
    const earthRadius = 80;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, mountRef.current.clientWidth / mountRef.current.clientHeight, 1, 10000);
    camera.position.set(0, 0, earthRadius * 4);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = true;
    controls.enableZoom = true;
    controls.maxDistance = earthRadius * 8;
    controls.minDistance = earthRadius * 2;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // Groups
    const worldRotationPoint = new THREE.Group();
    scene.add(worldRotationPoint);

    const dataGroup = new THREE.Group();
    worldRotationPoint.add(dataGroup);
    dataGroupRef.current = dataGroup;

    // Lighting — Day/Night via sun position
    scene.add(new THREE.AmbientLight(0x111122, 1.5));

    const sun = new THREE.DirectionalLight(0xffeecc, 3.5);
    sun.position.set(-400, 0, 100);
    sunRef.current = sun;
    scene.add(sun);

    // Hemisphere light for subtle blue tint on dark side
    const hemi = new THREE.HemisphereLight(0x0044ff, 0x000000, 0.3);
    scene.add(hemi);

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
      shininess: 8,
      map: texture,
      specularMap: spec,
      specular: new THREE.Color(0x333333),
      bumpMap: bump,
      bumpScale: 0.5,
      emissive: new THREE.Color(0x112244),
      emissiveIntensity: 0.08,
    });

    const sphere = new THREE.Mesh(earthGeo, earthMat);
    sphere.rotation.y = -1 * (8.7 * Math.PI / 17);
    worldRotationPoint.add(sphere);

    // Cloud Layer
    const cloudGeo = new THREE.SphereGeometry(earthRadius + 0.5, 64, 64);
    const cloudMat = new THREE.MeshPhongMaterial({
      alphaMap: alpha,
      transparent: true,
      side: THREE.DoubleSide,
      opacity: 0.4,
      depthWrite: false,
    });
    const sphereCloud = new THREE.Mesh(cloudGeo, cloudMat);
    worldRotationPoint.add(sphereCloud);

    // Atmosphere glow (rim light effect)
    const atmosGeo = new THREE.SphereGeometry(earthRadius * 1.015, 64, 64);
    const atmosMat = new THREE.MeshPhongMaterial({
      color: 0x0088ff,
      transparent: true,
      opacity: 0.08,
      side: THREE.BackSide,
      depthWrite: false,
    });
    const atmosphere = new THREE.Mesh(atmosGeo, atmosMat);
    worldRotationPoint.add(atmosphere);

    // Glow Sprite
    const glowMap = loader.load(TEXTURE_PATH + 'glow.png');
    const spriteMaterial = new THREE.SpriteMaterial({
      map: glowMap,
      color: 0x0077cc,
      transparent: true,
      blending: THREE.AdditiveBlending
    });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(earthRadius * 2.5, earthRadius * 2.5, 1.0);
    worldRotationPoint.add(sprite);

    // Skybox
    const cubeLoader = new THREE.CubeTextureLoader();
    cubeLoader.setCrossOrigin('anonymous');
    const urls = Array(6).fill(TEXTURE_PATH + 'test.jpg');
    cubeLoader.load(urls, (textureCube) => {
      scene.background = textureCube;
    });

    // Orbit rings for each satellite slot (thin transparent circles)
    const orbitRingMat = new THREE.LineBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.06 });
    for (let i = 0; i < 6; i++) {
      const inc = (51.6 + i * 0.2) * Math.PI / 180;
      const r = earthRadius * (1 + 550 / 6371);
      const pts = [];
      for (let j = 0; j <= 128; j++) {
        const a = (j / 128) * Math.PI * 2;
        pts.push(new THREE.Vector3(
          r * Math.cos(a),
          r * Math.sin(a) * Math.sin(inc),
          r * Math.sin(a) * Math.cos(inc)
        ));
      }
      const orbitGeo = new THREE.BufferGeometry().setFromPoints(pts);
      const orbitLine = new THREE.Line(orbitGeo, orbitRingMat);
      orbitLine.rotation.y = i * Math.PI / 3;
      worldRotationPoint.add(orbitLine);
    }

    // Animation Loop
    let animationId;
    let elapsed = 0;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      if (!isPaused) {
        sphereCloud.rotation.y += 0.00025;
        elapsed += 0.016;
      }
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Resize
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
  }, []);

  // Rotate sun based on simTime for day/night
  useEffect(() => {
    if (!sunRef.current) return;
    const angle = ((simTime || 0) / 86400) * Math.PI * 2;
    sunRef.current.position.set(
      -400 * Math.cos(angle),
      50 * Math.sin(angle * 0.5),
      400 * Math.sin(angle)
    );
  }, [simTime]);

  // Sync satellites/debris/threats into Three.js
  useEffect(() => {
    if (!dataGroupRef.current) return;

    const group = dataGroupRef.current;
    while (group.children.length > 0) {
      const child = group.children[0];
      group.remove(child);
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
    }

    const earthRadius = 80;

    const getPos = (lat, lon, altKm) => {
      const scale = 1 + (altKm / 6371);
      const r = earthRadius * scale;
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lon + 180) * (Math.PI / 180);
      const x = -(r * Math.sin(phi) * Math.cos(theta));
      const z = (r * Math.sin(phi) * Math.sin(theta));
      const y = r * Math.cos(phi);
      return new THREE.Vector3(x, y, z);
    };

    // Satellites (cyan octahedrons with glow)
    satellites.forEach((sat, i) => {
      const satGeo = new THREE.OctahedronGeometry(1.8, 0);
      const satMat = new THREE.MeshBasicMaterial({ color: 0x00ffff, wireframe: true });
      const mesh = new THREE.Mesh(satGeo, satMat);
      mesh.position.copy(getPos(sat.lat, sat.lon, sat.alt));
      group.add(mesh);

      // Small glow sphere around satellite
      const glowGeo = new THREE.SphereGeometry(3, 8, 8);
      const glowMat = new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.08 });
      const glow = new THREE.Mesh(glowGeo, glowMat);
      glow.position.copy(mesh.position);
      group.add(glow);

      if (i === 0 && onTelemetryUpdate) {
        onTelemetryUpdate({ altitude: sat.alt, velocity: 7.58, lat: sat.lat, lon: sat.lon, inclination: 51.6 });
      }
    });

    // Ground Stations (green cones)
    const gsGeo = new THREE.ConeGeometry(1.5, 3, 4);
    gsGeo.rotateX(Math.PI / 2);
    const gsMat = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    GROUND_STATIONS.forEach(gs => {
      const mesh = new THREE.Mesh(gsGeo, gsMat);
      const pos = getPos(gs.lat, gs.lon, 0);
      mesh.position.copy(pos);
      mesh.lookAt(new THREE.Vector3(0, 0, 0));
      group.add(mesh);
    });

    // Debris (blue points — smaller, transparent)
    if (debris.length > 0) {
      const pointsGeo = new THREE.BufferGeometry();
      const vertices = [];
      debris.slice(0, 500).forEach(d => {
        const v = getPos(d[1], d[2], d[3]);
        vertices.push(v.x, v.y, v.z);
      });
      pointsGeo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
      const pointsMat = new THREE.PointsMaterial({ color: 0x4488ff, size: 0.5, transparent: true, opacity: 0.6 });
      const points = new THREE.Points(pointsGeo, pointsMat);
      group.add(points);
    }

    // Threats (red pulsing spheres)
    if (threats.length > 0) {
      threats.forEach(t => {
        const thrGeo = new THREE.SphereGeometry(2.5, 16, 16);
        const thrMat = new THREE.MeshBasicMaterial({ color: 0xff3366, transparent: true, opacity: 0.8 });
        const mesh = new THREE.Mesh(thrGeo, thrMat);
        mesh.position.copy(getPos(t.pos.lat, t.pos.lon, t.pos.alt));
        group.add(mesh);

        // Threat ring
        const ringGeo = new THREE.RingGeometry(3.5, 4.5, 32);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0xff3366, transparent: true, opacity: 0.3, side: THREE.DoubleSide });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.position.copy(mesh.position);
        ring.lookAt(new THREE.Vector3(0, 0, 0));
        group.add(ring);
      });

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
