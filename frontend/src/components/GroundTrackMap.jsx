import React from 'react';

const GROUND_STATIONS = [
  { id: 'IIT Delhi', lat: 28.54, lon: 77.19 },
  { id: 'Svalbard', lat: 78.22, lon: 15.62 },
  { id: 'Goldstone', lat: 35.42, lon: -116.89 },
  { id: 'Punta Arenas', lat: -53.15, lon: -70.90 },
  { id: 'ISTRAC', lat: 13.03, lon: 77.51 },
  { id: 'McMurdo', lat: -77.84, lon: 166.66 }
];

// Pure CSS 2D Mercator Ground Track Map
export default function GroundTrackMap({ satellites, time }) {
  const getXY = (lat, lon) => {
    const x = ((lon + 180) / 360) * 100;
    const y = ((90 - lat) / 180) * 100;
    return { x, y };
  };

  // Generate orbit ground track (sinusoidal for inclined orbit)
  const generateTrack = (sat, offset, count) => {
    const points = [];
    const inc = 51.6; // degrees
    for (let i = 0; i < count; i++) {
      const t = (offset + i) * 0.03;
      const lat = inc * Math.sin(t);
      const lon = ((sat.lon + (i - count/2) * 3.6) + 540) % 360 - 180;
      points.push(getXY(lat, lon));
    }
    return points;
  };

  const toSvgPath = (pts) => pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');

  // Compute terminator position based on sim time
  const terminatorOffset = ((time || 0) / 86400) * 360;

  return (
    <div className="ground-track-container">
      {/* Title */}
      <div className="ground-track-title">
        <span className="ground-track-title-text">GROUND TRACK (MERCATOR)</span>
        <span className="ground-track-time">T+{Math.round((time || 0) / 3600)}h</span>
      </div>

      {/* Pure CSS World Map Grid */}
      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" className="ground-track-svg">
        {/* Background grid lines - longitude */}
        {[0,10,20,30,40,50,60,70,80,90,100].map(x => (
          <line key={'gx'+x} x1={x} y1={0} x2={x} y2={100} stroke="rgba(0,212,255,0.08)" strokeWidth="0.2" />
        ))}
        {/* Background grid lines - latitude */}
        {[0,10,20,30,40,50,60,70,80,90,100].map(y => (
          <line key={'gy'+y} x1={0} y1={y} x2={100} y2={y} stroke="rgba(0,212,255,0.08)" strokeWidth="0.2" />
        ))}
        {/* Equator */}
        <line x1={0} y1={50} x2={100} y2={50} stroke="rgba(0,212,255,0.2)" strokeWidth="0.3" strokeDasharray="1,1" />

        {/* Simplified continent outlines - major landmasses as paths */}
        {/* North America */}
        <path d="M15,25 L18,22 L22,20 L25,22 L28,25 L30,30 L28,35 L25,38 L22,40 L18,42 L15,40 L12,35 L13,30 Z" fill="rgba(0,212,255,0.06)" stroke="rgba(0,212,255,0.15)" strokeWidth="0.3" />
        {/* South America */}
        <path d="M25,55 L28,52 L30,55 L32,60 L30,68 L27,72 L24,70 L22,65 L23,58 Z" fill="rgba(0,212,255,0.06)" stroke="rgba(0,212,255,0.15)" strokeWidth="0.3" />
        {/* Europe */}
        <path d="M48,22 L52,20 L55,22 L54,28 L50,30 L47,28 Z" fill="rgba(0,212,255,0.06)" stroke="rgba(0,212,255,0.15)" strokeWidth="0.3" />
        {/* Africa */}
        <path d="M48,38 L55,35 L58,40 L60,50 L57,60 L52,62 L48,58 L46,50 L47,42 Z" fill="rgba(0,212,255,0.06)" stroke="rgba(0,212,255,0.15)" strokeWidth="0.3" />
        {/* Asia */}
        <path d="M55,18 L70,15 L80,18 L85,22 L82,30 L75,35 L68,32 L60,28 L56,24 Z" fill="rgba(0,212,255,0.06)" stroke="rgba(0,212,255,0.15)" strokeWidth="0.3" />
        {/* Australia */}
        <path d="M78,60 L85,58 L88,62 L86,68 L80,70 L76,66 Z" fill="rgba(0,212,255,0.06)" stroke="rgba(0,212,255,0.15)" strokeWidth="0.3" />

        {/* Terminator shadow band */}
        <rect x={(terminatorOffset % 100)} y={0} width={50} height={100} fill="rgba(0,0,20,0.4)" />

        {/* Ground Stations */}
        {GROUND_STATIONS.map(gs => {
          const p = getXY(gs.lat, gs.lon);
          return (
            <g key={gs.id}>
              <polygon points={`${p.x},${p.y-1.5} ${p.x+1.2},${p.y+0.8} ${p.x-1.2},${p.y+0.8}`} fill="#00ff00" />
              <text x={p.x + 1.5} y={p.y - 1} fill="#00ff00" fontSize="2" fontFamily="monospace" opacity="0.7">{gs.id}</text>
            </g>
          );
        })}

        {/* Satellite tracks and markers */}
        {satellites.map((sat, i) => {
          const { x, y } = getXY(sat.lat, sat.lon);
          const historyPts = generateTrack(sat, -30, 30);
          const futurePts = generateTrack(sat, 0, 30);

          return (
            <g key={'sat-track-' + i}>
              <path d={toSvgPath(historyPts)} fill="none" stroke="rgba(0,255,255,0.25)" strokeWidth="0.4" />
              <path d={toSvgPath(futurePts)} fill="none" stroke="rgba(0,255,255,0.6)" strokeWidth="0.4" strokeDasharray="1,0.5" />
              <polygon points={`${x},${y-1.5} ${x+1.5},${y} ${x},${y+1.5} ${x-1.5},${y}`} fill="#00ffff" />
              <text x={x + 2} y={y - 1} fill="#00ffff" fontSize="2.5" fontFamily="monospace">{'\u03B1'}{i+1}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
