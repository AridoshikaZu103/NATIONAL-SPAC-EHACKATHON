import { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';

// ── Satellite data type ──
interface SatellitePoint {
  time: number;
  lat: number;
  lon: number;
  altitude: number;
  velocity: number;
}

interface EarthGlobeProps {
  onTelemetryUpdate?: (data: {
    altitude: number;
    velocity: number;
    lat: number;
    lon: number;
    inclination: number;
  }) => void;
}

// ── Convert ECI (km) to lat/lon/alt ──
function eciToGeo(x: number, y: number, z: number, t: number): { lat: number; lon: number; alt: number } {
  const R = 6371;
  const r = Math.sqrt(x * x + y * y + z * z);
  const lat = Math.asin(z / r) * (180 / Math.PI);
  // Rotate with Earth (simplified GMST)
  const gmst = (t / 3600) * 15; // degrees per hour
  const lonEci = Math.atan2(y, x) * (180 / Math.PI);
  const lon = ((lonEci - gmst + 540) % 360) - 180;
  const alt = r - R;
  return { lat, lon, alt };
}

// ── Convert lat/lon to 3D sphere position ──
function latLonToVec3(lat: number, lon: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

// ── Generate ISS-like orbit data (no backend needed for demo) ──
function generateOrbitData(): SatellitePoint[] {
  const points: SatellitePoint[] = [];
  const R = 6371;
  const alt = 408; // ISS altitude km
  const r = R + alt;
  const mu = 398600.4418;
  const v = Math.sqrt(mu / r); // orbital velocity
  const inclination = 51.6 * (Math.PI / 180); // ISS inclination
  const period = 2 * Math.PI * r / v;

  for (let i = 0; i < 500; i++) {
    const t = (i / 500) * period;
    const angle = (2 * Math.PI * t) / period;

    // Simple orbital mechanics in ECI
    const x = r * Math.cos(angle);
    const yOrb = r * Math.sin(angle);
    const xEci = x;
    const yEci = yOrb * Math.cos(inclination);
    const zEci = yOrb * Math.sin(inclination);

    const geo = eciToGeo(xEci, yEci, zEci, t);

    points.push({
      time: t,
      lat: geo.lat,
      lon: geo.lon,
      altitude: geo.alt,
      velocity: v,
    });
  }
  return points;
}

export default function EarthGlobe({ onTelemetryUpdate }: EarthGlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const frameRef = useRef<number>(0);
  const sceneRef = useRef<THREE.Scene | null>(null);

  const initScene = useCallback(() => {
    if (!containerRef.current) return;

    // Clean up previous
    if (rendererRef.current) {
      rendererRef.current.dispose();
      cancelAnimationFrame(frameRef.current);
    }

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // ── Scene ──
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // ── Camera ──
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 3.5);

    // ── Renderer ──
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

    // ── Earth sphere ──
    const earthRadius = 1.0;
    const earthGeo = new THREE.SphereGeometry(earthRadius, 64, 64);

    // Procedural Earth shader
    const earthMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
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

        // Simple noise for continents
        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
        }
        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          float a = hash(i);
          float b = hash(i + vec2(1.0, 0.0));
          float c = hash(i + vec2(0.0, 1.0));
          float d = hash(i + vec2(1.0, 1.0));
          return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
        }
        float fbm(vec2 p) {
          float val = 0.0;
          float amp = 0.5;
          for (int i = 0; i < 5; i++) {
            val += amp * noise(p);
            p *= 2.0;
            amp *= 0.5;
          }
          return val;
        }

        void main() {
          vec3 lightDir = normalize(vec3(1.0, 0.5, 1.0));
          float diff = max(dot(vNormal, lightDir), 0.0);
          float ambient = 0.12;

          // Generate continent-like pattern
          vec2 uv = vUv * vec2(8.0, 4.0);
          float land = fbm(uv + vec2(0.0, 0.5));
          land = smoothstep(0.35, 0.5, land);

          // Ocean color (deep blue with variation)
          vec3 ocean = mix(
            vec3(0.02, 0.08, 0.25),
            vec3(0.05, 0.15, 0.45),
            fbm(uv * 2.0)
          );

          // Land color (green/brown)
          vec3 landColor = mix(
            vec3(0.1, 0.35, 0.1),
            vec3(0.35, 0.28, 0.12),
            fbm(uv * 3.0 + vec2(10.0, 5.0))
          );

          // Ice caps
          float iceCap = smoothstep(0.85, 0.95, abs(vUv.y - 0.5) * 2.0);
          vec3 ice = vec3(0.85, 0.9, 0.95);

          // Combine
          vec3 surface = mix(ocean, landColor, land);
          surface = mix(surface, ice, iceCap);

          // Night side city lights
          float nightSide = 1.0 - smoothstep(-0.1, 0.1, diff);
          float cities = step(0.7, fbm(uv * 10.0)) * land;
          vec3 cityLights = vec3(1.0, 0.8, 0.3) * cities * nightSide * 0.6;

          // Final lighting
          vec3 color = surface * (ambient + diff * 0.9) + cityLights;

          // Fresnel glow (atmosphere rim)
          float fresnel = pow(1.0 - max(dot(vNormal, normalize(-vPosition)), 0.0), 3.0);
          color += vec3(0.3, 0.6, 1.0) * fresnel * 0.4;

          gl_FragColor = vec4(color, 1.0);
        }
      `,
    });
    const earth = new THREE.Mesh(earthGeo, earthMat);
    scene.add(earth);

    // ── Atmosphere glow ──
    const atmosGeo = new THREE.SphereGeometry(earthRadius * 1.03, 64, 64);
    const atmosMat = new THREE.ShaderMaterial({
      uniforms: {},
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          float intensity = pow(0.7 - dot(vNormal, normalize(-vPosition)), 2.0);
          gl_FragColor = vec4(0.3, 0.6, 1.0, intensity * 0.5);
        }
      `,
      transparent: true,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
    });
    scene.add(new THREE.Mesh(atmosGeo, atmosMat));

    // ── Grid lines (latitude/longitude) ──
    const gridMat = new THREE.LineBasicMaterial({ color: 0x00d4ff, transparent: true, opacity: 0.08 });
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const curve = new THREE.EllipseCurve(0, 0, earthRadius * 1.001, earthRadius * 1.001, 0, Math.PI * 2, false, 0);
      const pts = curve.getPoints(64);
      const geo3 = new THREE.BufferGeometry().setFromPoints(pts.map(p => new THREE.Vector3(p.x, 0, p.y)));
      const line = new THREE.Line(geo3, gridMat);
      line.rotation.y = angle;
      scene.add(line);
    }
    for (let i = 1; i < 6; i++) {
      const latAngle = (i / 6) * Math.PI - Math.PI / 2;
      const r2 = Math.cos(latAngle) * earthRadius * 1.001;
      const y2 = Math.sin(latAngle) * earthRadius * 1.001;
      const curve = new THREE.EllipseCurve(0, 0, r2, r2, 0, Math.PI * 2, false, 0);
      const pts = curve.getPoints(64);
      const geo3 = new THREE.BufferGeometry().setFromPoints(pts.map(p => new THREE.Vector3(p.x, y2, p.y)));
      scene.add(new THREE.Line(geo3, gridMat));
    }

    // ── Satellite orbit path ──
    const orbitData = generateOrbitData();
    const orbitPoints = orbitData.map(p => {
      const globeR = earthRadius + (p.altitude / 6371) * 0.15;
      return latLonToVec3(p.lat, p.lon, globeR);
    });
    const orbitGeo = new THREE.BufferGeometry().setFromPoints(orbitPoints);
    const orbitMat = new THREE.LineBasicMaterial({
      color: 0x00ff88,
      transparent: true,
      opacity: 0.6,
    });
    const orbitLine = new THREE.Line(orbitGeo, orbitMat);
    scene.add(orbitLine);

    // ── Satellite marker ──
    const satGeo = new THREE.SphereGeometry(0.02, 16, 16);
    const satMat = new THREE.MeshBasicMaterial({ color: 0xff4444 });
    const satellite = new THREE.Mesh(satGeo, satMat);
    scene.add(satellite);

    // Satellite glow
    const satGlowGeo = new THREE.SphereGeometry(0.04, 16, 16);
    const satGlowMat = new THREE.MeshBasicMaterial({
      color: 0xff4444,
      transparent: true,
      opacity: 0.3,
    });
    const satGlow = new THREE.Mesh(satGlowGeo, satGlowMat);
    scene.add(satGlow);

    // ── Orbit trail (recent positions glow) ──
    const trailLength = 40;
    const trailGeo = new THREE.BufferGeometry();
    const trailPositions = new Float32Array(trailLength * 3);
    trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
    const trailMat = new THREE.LineBasicMaterial({ color: 0xff6666, transparent: true, opacity: 0.8 });
    const trail = new THREE.Line(trailGeo, trailMat);
    scene.add(trail);

    // ── Mouse drag rotation ──
    let isDragging = false;
    let prevMouse = { x: 0, y: 0 };
    let rotationTarget = { x: 0.3, y: 0 };
    let currentRotation = { x: 0.3, y: 0 };
    let autoRotateSpeed = 0.002;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouse = { x: e.clientX, y: e.clientY };
      autoRotateSpeed = 0;
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
    const onMouseUp = () => {
      isDragging = false;
      setTimeout(() => { autoRotateSpeed = 0.002; }, 2000);
    };
    const onWheel = (e: WheelEvent) => {
      camera.position.z = Math.max(2, Math.min(8, camera.position.z + e.deltaY * 0.002));
    };

    renderer.domElement.addEventListener('mousedown', onMouseDown);
    renderer.domElement.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('mouseup', onMouseUp);
    renderer.domElement.addEventListener('wheel', onWheel);

    // ── Animation loop ──
    let time = 0;
    const clock = new THREE.Clock();

    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      time += delta;

      // Auto-rotate
      rotationTarget.y += autoRotateSpeed;

      // Smooth rotation
      currentRotation.x += (rotationTarget.x - currentRotation.x) * 0.05;
      currentRotation.y += (rotationTarget.y - currentRotation.y) * 0.05;

      earth.rotation.x = currentRotation.x;
      earth.rotation.y = currentRotation.y;
      orbitLine.rotation.x = currentRotation.x;
      orbitLine.rotation.y = currentRotation.y;

      // Update shader time
      earthMat.uniforms.uTime.value = time;

      // Animate satellite along orbit
      const idx = Math.floor((time * 20) % orbitData.length);
      const satData = orbitData[idx];
      const globeR = earthRadius + (satData.altitude / 6371) * 0.15;
      const satPos = latLonToVec3(satData.lat, satData.lon, globeR);

      // Apply same rotation as Earth
      satPos.applyEuler(new THREE.Euler(currentRotation.x, currentRotation.y, 0));
      satellite.position.copy(satPos);
      satGlow.position.copy(satPos);

      // Pulsing glow
      satGlow.scale.setScalar(1.0 + Math.sin(time * 4) * 0.3);

      // Update trail
      const trailPositionsArr = trail.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < trailLength; i++) {
        const ti = (idx - i + orbitData.length) % orbitData.length;
        const td = orbitData[ti];
        const tr = earthRadius + (td.altitude / 6371) * 0.15;
        const tp = latLonToVec3(td.lat, td.lon, tr);
        tp.applyEuler(new THREE.Euler(currentRotation.x, currentRotation.y, 0));
        trailPositionsArr[i * 3] = tp.x;
        trailPositionsArr[i * 3 + 1] = tp.y;
        trailPositionsArr[i * 3 + 2] = tp.z;
      }
      trail.geometry.attributes.position.needsUpdate = true;

      // Send telemetry updates
      if (onTelemetryUpdate && Math.floor(time * 10) % 2 === 0) {
        onTelemetryUpdate({
          altitude: satData.altitude,
          velocity: satData.velocity,
          lat: satData.lat,
          lon: satData.lon,
          inclination: 51.6,
        });
      }

      renderer.render(scene, camera);
    };
    animate();

    // ── Handle resize ──
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
      renderer.domElement.removeEventListener('mousemove', onMouseMove);
      renderer.domElement.removeEventListener('mouseup', onMouseUp);
      renderer.domElement.removeEventListener('wheel', onWheel);
      cancelAnimationFrame(frameRef.current);
      renderer.dispose();
    };
  }, [onTelemetryUpdate]);

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
