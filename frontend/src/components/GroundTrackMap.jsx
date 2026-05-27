import React from 'react';

export default function GroundTrackMap({ satellites }) {
  // Convert lat/lon to Mercator x/y
  const getXY = (lat, lon) => {
    // Basic equirectangular mapping for visual demo
    const x = ((lon + 180) / 360) * 100;
    let y = ((90 - lat) / 180) * 100;
    return { x, y };
  };

  // Generate a mock orbit trajectory (sine wave representing 51.6 deg inclination)
  const generateOrbitPath = (baseLon, isHistory) => {
    const points = [];
    for (let i = 0; i <= 100; i++) {
      // time proxy
      const t = isHistory ? (i / 100) * Math.PI : (i / 100) * Math.PI + Math.PI;
      const lat = 51.6 * Math.sin(t);
      const lon = ((baseLon + (t * 180 / Math.PI)) + 180) % 360 - 180;
      points.push(getXY(lat, lon));
    }
    return points;
  };

  const drawPath = (points) => {
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: '#0a101d', borderRadius: '12px', border: '1px solid rgba(0, 212, 255, 0.15)', overflow: 'hidden' }}>
      
      {/* Base Map Image (Mercator) */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        backgroundImage: 'url("https://upload.wikimedia.org/wikipedia/commons/e/e8/Equirectangular_projection_SW.jpg")',
        backgroundSize: '100% 100%',
        opacity: 0.3,
        filter: 'grayscale(100%) invert(100%) brightness(1.5) contrast(1.2)'
      }} />

      {/* Terminator Line Shadow (Solar Eclipse Zone) */}
      <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }} viewBox="0 0 100 100" preserveAspectRatio="none">
        {/* Mock terminator sine wave shading */}
        <path d="M 0 50 Q 25 10 50 50 T 100 50 L 100 100 L 0 100 Z" fill="rgba(0,0,0,0.5)" />
      </svg>

      <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }} viewBox="0 0 100 100" preserveAspectRatio="none">
        {satellites.map((sat, i) => {
          const { x, y } = getXY(sat.lat, sat.lon);
          const historyPath = generateOrbitPath(sat.lon - 90, true);
          const futurePath = generateOrbitPath(sat.lon, false);

          return (
            <g key={`sat-${i}`}>
              {/* Historical Trajectory */}
              <path d={drawPath(historyPath)} fill="none" stroke="rgba(0, 255, 255, 0.3)" strokeWidth="0.5" />
              {/* Predicted Trajectory (Dashed) */}
              <path d={drawPath(futurePath)} fill="none" stroke="rgba(0, 255, 255, 0.8)" strokeWidth="0.5" strokeDasharray="1,1" />
              {/* Active Marker */}
              <polygon points={`${x},${y-1.5} ${x+1.5},${y} ${x},${y+1.5} ${x-1.5},${y}`} fill="#00ffff" />
              <text x={x + 2} y={y - 2} fill="#00ffff" fontSize="3" fontFamily="monospace">α{i+1}</text>
            </g>
          );
        })}
      </svg>
      
      <div style={{ position: 'absolute', top: '10px', left: '10px', background: 'rgba(0,0,0,0.5)', padding: '5px 10px', borderRadius: '5px', fontSize: '0.8rem', border: '1px solid #00d4ff40' }}>
        <h3 style={{ margin: 0, color: '#00d4ff', fontSize: '0.9rem' }}>Ground Track (Mercator)</h3>
      </div>
    </div>
  );
}
