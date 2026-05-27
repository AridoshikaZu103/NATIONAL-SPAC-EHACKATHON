import { useEffect, useRef } from 'react';
import { Satellite, Debris, Threat, GroundStation } from '../lib/SimulationEngine';

interface WorldMap2DProps {
  sim: any;
}

export default function WorldMap2D({ sim }: WorldMap2DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Load map image
    const mapImg = new Image();
    mapImg.src = 'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg';

    let animationFrameId: number;

    const render = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      ctx.clearRect(0, 0, width, height);

      // Draw map background
      if (mapImg.complete) {
        ctx.globalAlpha = 0.5; // tint it slightly to match aesthetic
        ctx.drawImage(mapImg, 0, 0, width, height);
        ctx.globalAlpha = 1.0;
      } else {
        ctx.fillStyle = '#051122';
        ctx.fillRect(0, 0, width, height);
      }

      // Add a slight dark tint
      ctx.fillStyle = 'rgba(5, 17, 34, 0.4)';
      ctx.fillRect(0, 0, width, height);

      // Helper to convert lat/lon to canvas x/y
      const getXY = (lat: number, lon: number) => {
        const x = ((lon + 180) / 360) * width;
        const y = ((90 - lat) / 180) * height;
        return { x, y };
      };

      // Draw grid
      ctx.strokeStyle = 'rgba(0, 212, 255, 0.1)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let lon = -180; lon <= 180; lon += 30) {
        const { x } = getXY(0, lon);
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let lat = -90; lat <= 90; lat += 30) {
        const { y } = getXY(lat, 0);
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();

      // Draw Ground Stations
      ctx.fillStyle = '#00ff00';
      sim.groundStations.forEach((gs: GroundStation) => {
        const { x, y } = getXY(gs.lat, gs.lon);
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw Debris
      ctx.fillStyle = '#4466ff';
      sim.debris.forEach((deb: Debris) => {
        const { x, y } = getXY(deb.pos.lat, deb.pos.lon);
        ctx.fillRect(x - 1, y - 1, 2, 2);
      });

      // Draw Satellites
      sim.satellites.forEach((sat: Satellite) => {
        const { x, y } = getXY(sat.pos.lat, sat.pos.lon);
        
        if (sim.selectedSatId === sat.id) {
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(x, y, 4, 0, Math.PI * 2);
          ctx.fill();
          
          // Selection ring
          ctx.strokeStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(x, y, 8, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          ctx.fillStyle = '#00d4ff';
          ctx.beginPath();
          ctx.moveTo(x, y - 3);
          ctx.lineTo(x + 3, y + 3);
          ctx.lineTo(x - 3, y + 3);
          ctx.fill();
        }
      });

      // Draw Threats
      ctx.fillStyle = '#ff4444';
      const timeScale = 1.0 + Math.sin(Date.now() * 0.005) * 0.5;
      sim.threats.forEach((thr: Threat) => {
        const { x, y } = getXY(thr.pos.lat, thr.pos.lon);
        const size = 3 * timeScale;
        ctx.fillRect(x - size, y - size, size * 2, size * 2);
      });

      animationFrameId = requestAnimationFrame(render);
    };

    mapImg.onload = () => {
      // Force a render when the image loads
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [sim.time, sim.satellites, sim.debris, sim.threats, sim.selectedSatId]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
    </div>
  );
}
