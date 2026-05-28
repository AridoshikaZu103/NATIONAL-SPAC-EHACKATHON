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

export default function GroundTrackMap({ satellites, time }) {
  const trailsRef = useRef({});

  const getXY = (lat, lon) => ({
    x: ((lon + 180) / 360) * 100,
    y: ((90 - lat) / 180) * 100
  });

  // Store ONLY last 15 points per satellite (keeps trails clean)
  useEffect(() => {
    if (!satellites || satellites.length === 0) return;
    satellites.forEach((sat, i) => {
      const key = sat.id || i;
      if (!trailsRef.current[key]) trailsRef.current[key] = [];
      const pt = getXY(sat.lat, sat.lon);
      const arr = trailsRef.current[key];
      // Avoid duplicate points
      if (arr.length === 0 || Math.abs(arr[arr.length - 1].x - pt.x) > 0.1 || Math.abs(arr[arr.length - 1].y - pt.y) > 0.1) {
        arr.push(pt);
      }
      if (arr.length > 15) arr.shift();
    });
  }, [satellites, time]);

  const toSvgPath = (pts) => {
    if (!pts || pts.length < 2) return '';
    // Break path at wrap-around (lon jump > 40%)
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

  // Simple predicted path (short, clean)
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

  // Sinusoidal terminator
  const tPhase = ((time || 0) / 86400) * 2 * Math.PI;
  const terminatorPath = (() => {
    let d = '';
    for (let i = 0; i <= 40; i++) {
      const frac = i / 40;
      const x = frac * 100;
      const yOff = 12 * Math.sin(tPhase + frac * Math.PI * 2);
      d += (i === 0 ? 'M' : 'L') + x.toFixed(1) + ',' + (50 + yOff).toFixed(1);
    }
    return d + ' L100,100 L0,100 Z';
  })();

  return (
    <div className="ground-track-container">
      <div className="ground-track-title">
        <span className="ground-track-title-text">GROUND TRACK (MERCATOR)</span>
        <span className="ground-track-time">T+{Math.round((time || 0) / 3600)}h</span>
      </div>

      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" className="ground-track-svg">
        {/* Grid */}
        {[0,20,40,60,80,100].map(x => (
          <line key={'gx'+x} x1={x} y1={0} x2={x} y2={100} stroke="rgba(0,212,255,0.05)" strokeWidth="0.15" />
        ))}
        {[0,25,50,75,100].map(y => (
          <line key={'gy'+y} x1={0} y1={y} x2={100} y2={y} stroke="rgba(0,212,255,0.05)" strokeWidth="0.15" />
        ))}
        {/* Equator */}
        <line x1={0} y1={50} x2={100} y2={50} stroke="rgba(0,212,255,0.12)" strokeWidth="0.2" strokeDasharray="1,1" />

        {/* Continents */}
        <path d="M12,28 L15,24 L19,22 L23,21 L27,23 L29,27 L29,32 L27,36 L24,39 L20,41 L16,40 L12,36 Z" fill="rgba(0,229,255,0.04)" stroke="rgba(0,229,255,0.1)" strokeWidth="0.2" />
        <path d="M24,54 L27,52 L30,54 L31,60 L29,66 L27,70 L24,68 L22,62 Z" fill="rgba(0,229,255,0.04)" stroke="rgba(0,229,255,0.1)" strokeWidth="0.2" />
        <path d="M47,24 L51,21 L54,23 L53,28 L49,29 Z" fill="rgba(0,229,255,0.04)" stroke="rgba(0,229,255,0.1)" strokeWidth="0.2" />
        <path d="M47,38 L53,36 L57,39 L58,46 L56,54 L52,58 L48,54 L46,46 Z" fill="rgba(0,229,255,0.04)" stroke="rgba(0,229,255,0.1)" strokeWidth="0.2" />
        <path d="M56,19 L64,16 L74,15 L82,18 L83,26 L77,32 L66,30 L58,24 Z" fill="rgba(0,229,255,0.04)" stroke="rgba(0,229,255,0.1)" strokeWidth="0.2" />
        <path d="M78,60 L84,58 L87,62 L85,67 L80,68 Z" fill="rgba(0,229,255,0.04)" stroke="rgba(0,229,255,0.1)" strokeWidth="0.2" />

        {/* Terminator */}
        <path d={terminatorPath} fill="rgba(0,0,20,0.25)" />

        {/* Ground stations */}
        {GROUND_STATIONS.map(gs => {
          const p = getXY(gs.lat, gs.lon);
          return (
            <g key={gs.id} className="gs-marker">
              <circle cx={p.x} cy={p.y} r={4} fill="none" stroke="rgba(0,255,0,0.12)" strokeWidth="0.25" strokeDasharray="0.8,0.8" className="gs-range-circle" />
              <polygon points={p.x+','+(p.y-1)+' '+(p.x+0.8)+','+(p.y+0.5)+' '+(p.x-0.8)+','+(p.y+0.5)} fill="#00ff00" />
              <text x={p.x + 1.2} y={p.y - 1.2} fill="#00ff00" fontSize="1.6" fontFamily="monospace" opacity="0.5">{gs.id}</text>
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
              {/* Clean history trail (solid, short) */}
              {trail.length > 1 && (
                <path d={toSvgPath(trail)} fill="none" stroke={color} strokeWidth="0.3" opacity="0.4" />
              )}
              {/* Short predicted path (dashed) */}
              <path d={predictPath(sat, i)} fill="none" stroke={color} strokeWidth="0.2" strokeDasharray="0.8,0.5" opacity="0.3" />
              {/* Satellite diamond marker */}
              <polygon points={x+','+(y-1.2)+' '+(x+1.2)+','+y+' '+x+','+(y+1.2)+' '+(x-1.2)+','+y} fill={color} className="sat-marker" />
              <text x={x + 1.6} y={y - 1} fill={color} fontSize="2" fontFamily="monospace" opacity="0.8">{'\u03B1'}{i+1}</text>
            </g>
          );
        })}
      </svg>

      <div className="ground-track-info">
        <span><span style={{color:'#00ffff'}}>&#9670;</span> Satellites</span>
        <span><span style={{color:'#00ff00'}}>&#9650;</span> Ground Stn</span>
      </div>
    </div>
  );
}
