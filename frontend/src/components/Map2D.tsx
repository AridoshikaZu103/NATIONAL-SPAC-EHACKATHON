import React from 'react';
import { Satellite, Debris, Threat, GroundStation } from '../lib/SimulationEngine';

interface Map2DProps {
  sim: any;
}

export default function Map2D({ sim }: Map2DProps) {
  const trailsRef = React.useRef<Record<string, {lat: number, lon: number}[]>>({});

  const latToY = (lat: number) => {
    return `${50 - (lat / 90) * 50}%`;
  };
  
  const lonToX = (lon: number) => {
    return `${50 + (lon / 180) * 50}%`;
  };

  // Update trail history
  sim.satellites?.forEach((sat: Satellite) => {
    if (!trailsRef.current[sat.id]) trailsRef.current[sat.id] = [];
    const history = trailsRef.current[sat.id];
    if (history.length === 0 || Math.abs(history[history.length-1].lat - sat.pos.lat) > 0.5 || Math.abs(history[history.length-1].lon - sat.pos.lon) > 0.5) {
      history.push({ lat: sat.pos.lat, lon: sat.pos.lon });
      if (history.length > 50) history.shift(); // Keep last 50 points
    }
  });

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: '#051122' }}>
      <img 
        src="https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg" 
        style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6, filter: 'hue-rotate(180deg) brightness(0.8)' }} 
        alt="World Map 2D" 
      />
      
      {/* Grid lines */}
      <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, borderTop: '1px dashed rgba(0,212,255,0.2)' }} />
      <div style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', borderLeft: '1px dashed rgba(0,212,255,0.2)' }} />

      <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
        {/* Orbital Path (approx sine wave at equator with 7.6 deg inclination) */}
        <path d="M 0 50 Q 25 45.7, 50 50 T 100 50" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" strokeDasharray="2 2" vectorEffect="non-scaling-stroke" />
        
        {/* Terminator Line (Simplified Day/Night boundary) */}
        {/* Approximated as vertical lines at -90 and +90 offset from sun at 0 lon */}
        <path d="M 25 0 L 25 100 M 75 0 L 75 100" fill="none" stroke="#ffaa00" strokeWidth="0.5" strokeDasharray="2 2" vectorEffect="non-scaling-stroke" />

        {/* Satellite Trails */}
        {sim.showTrails && Object.entries(trailsRef.current).map(([id, hist]) => {
          if (hist.length < 2) return null;
          // Split path if it crosses the anti-meridian to prevent lines crossing the whole map
          const paths: string[] = [];
          let currentPath = "";
          for (let i = 0; i < hist.length; i++) {
            const p = hist[i];
            const px = 50 + (p.lon/180)*50;
            const py = 50 - (p.lat/90)*50;
            if (i > 0 && Math.abs(hist[i].lon - hist[i-1].lon) > 180) {
              paths.push(currentPath);
              currentPath = `${px},${py}`;
            } else {
              currentPath += (currentPath ? " " : "") + `${px},${py}`;
            }
          }
          if (currentPath) paths.push(currentPath);
          
          return paths.map((pts, i) => (
            <polyline key={`${id}-${i}`} points={pts} fill="none" stroke="#00d4ff" strokeWidth="0.5" strokeOpacity="0.5" vectorEffect="non-scaling-stroke" />
          ));
        })}
      </svg>

      {/* Ground Stations */}
      {sim.groundStations?.map((gs: GroundStation) => (
        <div key={`gs-${gs.id}`} style={{
          position: 'absolute',
          left: lonToX(gs.lon),
          top: latToY(gs.lat),
          width: 0,
          height: 0,
          borderLeft: '4px solid transparent',
          borderRight: '4px solid transparent',
          borderBottom: '8px solid #00ff00',
          transform: 'translate(-50%, -50%)',
        }} title={`GS: ${gs.id}`} />
      ))}

      {/* Debris */}
      {sim.showDebris && sim.debris?.map((deb: Debris, i: number) => (
        <div key={`deb-${i}`} style={{
          position: 'absolute',
          left: lonToX(deb.pos.lon),
          top: latToY(deb.pos.lat),
          width: '3px',
          height: '3px',
          background: '#4466ff',
          transform: 'translate(-50%, -50%)',
          borderRadius: '50%',
          pointerEvents: 'none'
        }} />
      ))}

      {/* Satellites */}
      {sim.satellites?.map((sat: Satellite) => {
        const isSelected = sim.selectedSatId === sat.id;
        return (
          <div key={`sat-${sat.id}`} style={{
            position: 'absolute',
            left: lonToX(sat.pos.lon),
            top: latToY(sat.pos.lat),
            width: isSelected ? '8px' : '5px',
            height: isSelected ? '8px' : '5px',
            background: isSelected ? '#ffffff' : '#00d4ff',
            transform: 'translate(-50%, -50%)',
            borderRadius: '50%',
            boxShadow: isSelected ? '0 0 8px #ffffff' : 'none',
            zIndex: 10,
            cursor: 'pointer'
          }} title={sat.name} onClick={() => sim.setSelectedSatId(sat.id)} />
        );
      })}

      {/* Threats */}
      {sim.threats?.map((thr: Threat) => (
        <div key={`thr-${thr.id}`} style={{
          position: 'absolute',
          left: lonToX(thr.pos.lon),
          top: latToY(thr.pos.lat),
          width: '6px',
          height: '6px',
          background: '#ff4444',
          transform: 'translate(-50%, -50%)',
          boxShadow: '0 0 5px #ff4444',
          zIndex: 5,
          pointerEvents: 'none'
        }} title={`Threat: ${thr.id}`} />
      ))}
    </div>
  );
}
