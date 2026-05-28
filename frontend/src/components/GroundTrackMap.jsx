import React, { useRef, useEffect } from 'react';
import './GroundTrackMap.css';

const GROUND_STATIONS = [
  { id: 'IIT Delhi', lat: 28.54, lon: 77.19 },
  { id: 'Svalbard', lat: 78.22, lon: 15.62 },
  { id: 'Goldstone', lat: 35.42, lon: -116.89 },
  { id: 'Punta Arenas', lat: -53.15, lon: -70.90 },
  { id: 'ISTRAC', lat: 13.03, lon: 77.51 },
  { id: 'McMurdo', lat: -77.84, lon: 166.66 }
];

const SAT_COLORS = ['#00ffff', '#00e5ff', '#00ccff', '#33bbff', '#66aaff', '#9999ff'];

export default function GroundTrackMap({ satellites, time, threats = [] }) {
  const trailsRef = useRef({});

  const getXY = (lat, lon) => ({
    x: ((lon + 180) / 360) * 100,
    y: ((90 - lat) / 180) * 100
  });

  // Store last 15 trail points per satellite
  useEffect(() => {
    if (!satellites || satellites.length === 0) return;
    satellites.forEach((sat, i) => {
      const key = sat.id || i;
      if (!trailsRef.current[key]) trailsRef.current[key] = [];
      const pt = getXY(sat.lat, sat.lon);
      const arr = trailsRef.current[key];
      if (arr.length === 0 || Math.abs(arr[arr.length - 1].x - pt.x) > 0.1 || Math.abs(arr[arr.length - 1].y - pt.y) > 0.1) {
        arr.push(pt);
      }
      if (arr.length > 15) arr.shift();
    });
  }, [satellites, time]);

  const toSvgPath = (pts) => {
    if (!pts || pts.length < 2) return '';
    let d = '';
    for (let i = 0; i < pts.length; i++) {
      if (i === 0) { d += 'M' + pts[i].x.toFixed(1) + ',' + pts[i].y.toFixed(1); continue; }
      if (Math.abs(pts[i].x - pts[i-1].x) > 40) {
        d += ' M' + pts[i].x.toFixed(1) + ',' + pts[i].y.toFixed(1);
      } else {
        d += ' L' + pts[i].x.toFixed(1) + ',' + pts[i].y.toFixed(1);
      }
    }
    return d;
  };

  // Simple predicted path
  const predictPath = (sat, i) => {
    const pts = [];
    const inc = sat.inclination || 51.6;
    for (let j = 0; j < 12; j++) {
      const t = j * 0.08;
      const lat = inc * Math.sin(t + (time || 0) * 0.001 + i);
      const lon = ((sat.lon + j * 6) + 540) % 360 - 180;
      pts.push(getXY(lat, lon));
    }
    return toSvgPath(pts);
  };

  // Day/night terminator — position moves with simTime
  const tPhase = ((time || 0) / 86400) * 2 * Math.PI;
  const sunLon = ((-tPhase * 180 / Math.PI) % 360 + 360) % 360; // Sun subsolar longitude [0,360]

  // Build a terminator polygon (night = right side of terminator)
  // The terminator is roughly a sinusoidal curve offset by sun position
  const terminatorPath = (() => {
    // Night shadow overlay: a polygon covering the "dark" half
    const nightCenterX = ((sunLon + 180) % 360 / 360) * 100; // opposite of sun
    let d = '';
    for (let i = 0; i <= 50; i++) {
      const frac = i / 50;
      const yPct = frac * 100;
      const lat = 90 - frac * 180;
      // Terminator wobble based on axial tilt (23.5 deg)
      const wobble = 23.5 * Math.sin(tPhase);
      const lonOffset = Math.acos(Math.max(-1, Math.min(1, -Math.tan(lat * Math.PI / 180) * Math.tan(wobble * Math.PI / 180)))) * 180 / Math.PI;
      const xLeft = nightCenterX - (lonOffset / 360) * 100;
      const xRight = nightCenterX + (lonOffset / 360) * 100;
      if (i === 0) {
        d += 'M' + xLeft.toFixed(1) + ',' + yPct.toFixed(1);
      } else {
        d += ' L' + xLeft.toFixed(1) + ',' + yPct.toFixed(1);
      }
    }
    // Go back up via right edge
    for (let i = 50; i >= 0; i--) {
      const frac = i / 50;
      const yPct = frac * 100;
      const lat = 90 - frac * 180;
      const wobble = 23.5 * Math.sin(tPhase);
      const lonOffset = Math.acos(Math.max(-1, Math.min(1, -Math.tan(lat * Math.PI / 180) * Math.tan(wobble * Math.PI / 180)))) * 180 / Math.PI;
      const xRight = nightCenterX + (lonOffset / 360) * 100;
      d += ' L' + xRight.toFixed(1) + ',' + yPct.toFixed(1);
    }
    d += ' Z';
    return d;
  })();

  return (
    <div className="ground-track-container">
      {/* Real Earth image background */}
      <div className="ground-track-earth-bg" />

      {/* Day/night overlay */}
      <div className="ground-track-night-overlay">
        <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d={terminatorPath} fill="rgba(0,0,15,0.55)" />
        </svg>
      </div>

      <div className="ground-track-title">
        <span className="ground-track-title-text">GROUND TRACK (MERCATOR)</span>
        <span className="ground-track-time">T+{Math.round((time || 0) / 3600)}h</span>
        <span className="ground-track-daynight-badge">DAY/NIGHT</span>
      </div>

      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" className="ground-track-svg">
        {/* Grid lines */}
        {[0,10,20,30,40,50,60,70,80,90,100].map(x => (
          <line key={'gx'+x} x1={x} y1={0} x2={x} y2={100} stroke="rgba(255,255,255,0.04)" strokeWidth="0.12" />
        ))}
        {[0,12.5,25,37.5,50,62.5,75,87.5,100].map(y => (
          <line key={'gy'+y} x1={0} y1={y} x2={100} y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="0.12" />
        ))}
        {/* Equator */}
        <line x1={0} y1={50} x2={100} y2={50} stroke="rgba(255,255,255,0.08)" strokeWidth="0.15" strokeDasharray="1,1" />
        {/* Prime meridian */}
        <line x1={50} y1={0} x2={50} y2={100} stroke="rgba(255,255,255,0.06)" strokeWidth="0.12" strokeDasharray="1,1" />

        {/* Lat/Lon labels */}
        <text x="1" y="50.5" fill="rgba(255,255,255,0.15)" fontSize="1.8" fontFamily="monospace">0N</text>
        <text x="1" y="25.5" fill="rgba(255,255,255,0.12)" fontSize="1.5" fontFamily="monospace">45N</text>
        <text x="1" y="75.5" fill="rgba(255,255,255,0.12)" fontSize="1.5" fontFamily="monospace">45S</text>
        <text x="50.5" y="99" fill="rgba(255,255,255,0.12)" fontSize="1.5" fontFamily="monospace">0E</text>
        <text x="25" y="99" fill="rgba(255,255,255,0.1)" fontSize="1.3" fontFamily="monospace">90W</text>
        <text x="75" y="99" fill="rgba(255,255,255,0.1)" fontSize="1.3" fontFamily="monospace">90E</text>

        {/* Ground stations */}
        {GROUND_STATIONS.map(gs => {
          const p = getXY(gs.lat, gs.lon);
          return (
            <g key={gs.id} className="gs-marker">
              <circle cx={p.x} cy={p.y} r={4} fill="none" stroke="rgba(0,255,0,0.1)" strokeWidth="0.2" strokeDasharray="0.8,0.8" className="gs-range-circle" />
              <circle cx={p.x} cy={p.y} r={2} fill="none" stroke="rgba(0,255,0,0.06)" strokeWidth="0.15" />
              <polygon points={p.x+','+(p.y-1)+' '+(p.x+0.8)+','+(p.y+0.5)+' '+(p.x-0.8)+','+(p.y+0.5)} fill="#00ff00" />
              <text x={p.x + 1.2} y={p.y - 1.2} fill="#00ff00" fontSize="1.4" fontFamily="monospace" opacity="0.45">{gs.id}</text>
            </g>
          );
        })}

        {/* Satellite trails and markers */}
        {satellites.map((sat, i) => {
          const { x, y } = getXY(sat.lat, sat.lon);
          const key = sat.id || i;
          const trail = trailsRef.current[key] || [];
          const color = SAT_COLORS[i % SAT_COLORS.length];

          return (
            <g key={'sat-' + i}>
              {/* History trail */}
              {trail.length > 1 && (
                <path d={toSvgPath(trail)} fill="none" stroke={color} strokeWidth="0.3" opacity="0.5" />
              )}
              {/* Predicted path */}
              <path d={predictPath(sat, i)} fill="none" stroke={color} strokeWidth="0.2" strokeDasharray="0.8,0.5" opacity="0.25" />
              {/* Satellite diamond */}
              <polygon points={x+','+(y-1.2)+' '+(x+1.2)+','+y+' '+x+','+(y+1.2)+' '+(x-1.2)+','+y} fill={color} className="sat-marker" />
              {/* Label */}
              <text x={x + 1.6} y={y - 1} fill={color} fontSize="1.8" fontFamily="monospace" opacity="0.8">{'\u03B1'}{i+1}</text>
              {/* Status: SAFE or DIED */}
              <text x={x + 1.6} y={y + 2.5} fill={sat.fuel_kg > 0 ? '#00ff88' : '#ff3366'} fontSize="1.2" fontFamily="monospace" opacity="0.6">
                {sat.fuel_kg > 0 ? 'SAFE' : 'DIED'}
              </text>
            </g>
          );
        })}
        {/* Threat markers on map */}
        {threats.map((t, i) => {
          if (!t.pos) return null;
          const { x, y } = getXY(t.pos.lat, t.pos.lon);
          return (
            <g key={'thr-' + i} className="threat-map-marker">
              <rect x={x - 1} y={y - 1} width="2" height="2" fill="#ff3366" className="sat-marker" />
              <circle cx={x} cy={y} r="3" fill="none" stroke="#ff3366" strokeWidth="0.2" opacity="0.4" className="gs-range-circle" />
              <text x={x + 2} y={y - 1.5} fill="#ff3366" fontSize="1.3" fontFamily="monospace" opacity="0.7">{t.id}</text>
            </g>
          );
        })}
      </svg>

      <div className="ground-track-info">
        <span><span style={{color:'#00ffff'}}>&#9670;</span> Satellites</span>
        <span><span style={{color:'#ff3366'}}>&#9632;</span> Threat</span>
        <span><span style={{color:'#00ff00'}}>&#9650;</span> Ground Stn</span>
        <span><span style={{color:'rgba(255,255,255,0.3)'}}>|</span> Day/Night</span>
      </div>
    </div>
  );
}
