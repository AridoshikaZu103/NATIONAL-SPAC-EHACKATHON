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

  const getXY = (lat, lon) => {
    const x = ((lon + 180) / 360) * 100;
    const y = ((90 - lat) / 180) * 100;
    return { x, y };
  };

  // Store trail history (last 30 positions per satellite)
  useEffect(() => {
    if (!satellites || satellites.length === 0) return;
    satellites.forEach((sat, i) => {
      const key = sat.id || i;
      if (!trailsRef.current[key]) trailsRef.current[key] = [];
      trailsRef.current[key].push(getXY(sat.lat, sat.lon));
      if (trailsRef.current[key].length > 40) trailsRef.current[key].shift();
    });
  }, [satellites, time]);

  const toSvgPath = (pts) => {
    if (!pts || pts.length < 2) return '';
    return pts.map((p, i) => (i === 0 ? 'M' : 'L') + p.x.toFixed(2) + ',' + p.y.toFixed(2)).join(' ');
  };

  // Generate predicted track
  const generateFuture = (sat, count) => {
    const pts = [];
    const inc = 51.6;
    for (let i = 0; i < count; i++) {
      const t = i * 0.05;
      const lat = inc * Math.sin(t);
      const lon = ((sat.lon + i * 4.5) + 540) % 360 - 180;
      pts.push(getXY(lat, lon));
    }
    return pts;
  };

  // Sinusoidal terminator
  const terminatorPhase = ((time || 0) / 86400) * 2 * Math.PI;
  const terminatorPath = Array.from({ length: 50 }, (_, i) => {
    const frac = i / 49;
    const xBase = frac * 100;
    const yOff = 15 * Math.sin(terminatorPhase + frac * Math.PI * 2);
    return (i === 0 ? 'M' : 'L') + xBase.toFixed(1) + ',' + (50 + yOff).toFixed(1);
  }).join(' ') + ' L100,100 L0,100 Z';

  return (
    <div className="ground-track-container">
      <div className="ground-track-title">
        <span className="ground-track-title-text">GROUND TRACK (MERCATOR)</span>
        <span className="ground-track-time">T+{Math.round((time || 0) / 3600)}h</span>
      </div>

      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" className="ground-track-svg">
        {/* Grid */}
        {[0,10,20,30,40,50,60,70,80,90,100].map(x => (
          <line key={'gx'+x} x1={x} y1={0} x2={x} y2={100} stroke="rgba(0,212,255,0.06)" strokeWidth="0.15" />
        ))}
        {[0,10,20,30,40,50,60,70,80,90,100].map(y => (
          <line key={'gy'+y} x1={0} y1={y} x2={100} y2={y} stroke="rgba(0,212,255,0.06)" strokeWidth="0.15" />
        ))}
        <line x1={0} y1={50} x2={100} y2={50} stroke="rgba(0,212,255,0.15)" strokeWidth="0.25" strokeDasharray="1,1" />

        {/* Continent outlines */}
        <path d="M12,28 L15,24 L18,22 L22,21 L26,22 L28,24 L30,28 L30,32 L28,36 L25,39 L22,41 L18,42 L15,40 L12,36 L11,32 Z" fill="rgba(0,229,255,0.04)" stroke="rgba(0,229,255,0.12)" strokeWidth="0.25" />
        <path d="M24,54 L27,52 L30,53 L32,58 L31,64 L29,68 L27,72 L24,70 L22,65 L22,60 Z" fill="rgba(0,229,255,0.04)" stroke="rgba(0,229,255,0.12)" strokeWidth="0.25" />
        <path d="M47,23 L50,20 L54,21 L55,25 L53,28 L49,30 L47,27 Z" fill="rgba(0,229,255,0.04)" stroke="rgba(0,229,255,0.12)" strokeWidth="0.25" />
        <path d="M47,38 L53,35 L57,38 L59,44 L58,52 L56,58 L52,62 L48,58 L46,50 L46,42 Z" fill="rgba(0,229,255,0.04)" stroke="rgba(0,229,255,0.12)" strokeWidth="0.25" />
        <path d="M55,18 L62,15 L70,14 L78,16 L84,20 L82,28 L76,34 L68,32 L60,26 L56,22 Z" fill="rgba(0,229,255,0.04)" stroke="rgba(0,229,255,0.12)" strokeWidth="0.25" />
        <path d="M77,60 L84,57 L88,60 L87,66 L82,70 L77,67 Z" fill="rgba(0,229,255,0.04)" stroke="rgba(0,229,255,0.12)" strokeWidth="0.25" />
        <path d="M36,90 L64,90 L64,100 L36,100 Z" fill="rgba(0,229,255,0.02)" stroke="rgba(0,229,255,0.08)" strokeWidth="0.2" />

        {/* Terminator shadow */}
        <path d={terminatorPath} fill="rgba(0,0,20,0.35)" />

        {/* Ground station markers + range circles */}
        {GROUND_STATIONS.map(gs => {
          const p = getXY(gs.lat, gs.lon);
          return (
            <g key={gs.id} className="gs-marker">
              <circle cx={p.x} cy={p.y} r={6} fill="none" stroke="rgba(0,255,0,0.15)" strokeWidth="0.3" strokeDasharray="1,1" className="gs-range-circle" />
              <polygon points={p.x+','+( p.y-1.2)+' '+(p.x+1)+','+(p.y+0.6)+' '+(p.x-1)+','+(p.y+0.6)} fill="#00ff00" />
              <text x={p.x + 1.5} y={p.y - 1.5} fill="#00ff00" fontSize="1.8" fontFamily="monospace" opacity="0.6">{gs.id}</text>
            </g>
          );
        })}

        {/* Satellite trails and markers */}
        {satellites.map((sat, i) => {
          const { x, y } = getXY(sat.lat, sat.lon);
          const key = sat.id || i;
          const trail = trailsRef.current[key] || [];
          const futurePts = generateFuture(sat, 25);
          const color = SAT_COLORS[i % SAT_COLORS.length];

          return (
            <g key={'sat-' + i}>
              {/* History trail (solid, fading) */}
              {trail.length > 1 && (
                <path d={toSvgPath(trail)} fill="none" stroke={color} strokeWidth="0.35" opacity="0.3" className="sat-trail-history" />
              )}
              {/* Future track (dashed) */}
              <path d={toSvgPath(futurePts)} fill="none" stroke={color} strokeWidth="0.3" strokeDasharray="1,0.5" opacity="0.5" className="sat-trail-future" />
              {/* Satellite marker with CSS transition */}
              <g className="sat-marker" style={{ transform: 'translate(' + x + '%, ' + y + '%)' }}>
                <polygon points={x+','+(y-1.3)+' '+(x+1.3)+','+y+' '+x+','+(y+1.3)+' '+(x-1.3)+','+y} fill={color} />
              </g>
              <text x={x + 1.8} y={y - 1.2} fill={color} fontSize="2.2" fontFamily="monospace">{'\u03B1'}{i+1}</text>
            </g>
          );
        })}
      </svg>

      {/* Info badges */}
      <div className="ground-track-info">
        <span><span style={{color:'#00ffff'}}>&#9670;</span> Satellites</span>
        <span><span style={{color:'#00ff00'}}>&#9650;</span> Ground Stn</span>
        <span><span style={{color:'rgba(0,0,20,0.6)'}}>&#9632;</span> Terminator</span>
      </div>
    </div>
  );
}
