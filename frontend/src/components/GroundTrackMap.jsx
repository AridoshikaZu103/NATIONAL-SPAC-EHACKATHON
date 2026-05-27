import React from 'react';

export default function GroundTrackMap({ satellites, time, width = 800, height = 400 }) {
  // Helper to convert lat/lon to X/Y on a simple equirectangular projection
  const getXY = (lat, lon) => {
    const x = ((lon + 180) / 360) * width;
    const y = ((90 - lat) / 180) * height;
    return { x, y };
  };

  // Generate a sine wave to represent the terminator shadow
  // The terminator shifts 15 degrees per hour.
  const phaseShift = (time / 3600) * 15 * (Math.PI / 180); 
  
  const terminatorPoints = [];
  for (let x = 0; x <= width; x += 10) {
    const lon = (x / width) * 360 - 180;
    // Simple approximation of the terminator curve
    const lat = Math.sin((lon * Math.PI) / 180 + phaseShift) * 23.5; 
    terminatorPoints.push(`${x},${getXY(lat, lon).y}`);
  }
  
  // Create a polygon covering the "night" side (bottom or top depending on season, we'll just shade the bottom half of the sine curve for visualization)
  const shadowPath = `M 0,${height} L 0,${terminatorPoints[0].split(',')[1]} L ${terminatorPoints.join(' L ')} L ${width},${height} Z`;

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: 'radial-gradient(circle at center, #0a192f 0%, #030816 100%)', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(0, 212, 255, 0.3)', boxShadow: 'inset 0 0 30px rgba(0,0,0,0.8)' }}>
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
        
        <defs>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Simple grid lines for Longitude and Latitude */}
        {[...Array(13)].map((_, i) => (
          <line key={`v-${i}`} x1={(i * width) / 12} y1={0} x2={(i * width) / 12} y2={height} stroke="rgba(0, 212, 255, 0.08)" strokeWidth="1" />
        ))}
        {[...Array(7)].map((_, i) => (
          <line key={`h-${i}`} x1={0} y1={(i * height) / 6} x2={width} y2={(i * height) / 6} stroke="rgba(0, 212, 255, 0.08)" strokeWidth="1" />
        ))}

        {/* Equator */}
        <line x1={0} y1={height / 2} x2={width} y2={height / 2} stroke="rgba(0, 255, 255, 0.4)" strokeWidth="1" strokeDasharray="5,5" filter="url(#glow)" />

        {/* Terminator Shadow */}
        <path d={shadowPath} fill="rgba(0, 0, 0, 0.4)" />
        <path d={`M ${terminatorPoints.join(' L ')}`} fill="none" stroke="#ffcc00" strokeWidth="2" strokeDasharray="4,4" opacity="0.6" />

        {/* Satellites and Orbits */}
        {satellites.map((sat, index) => {
          const { x, y } = getXY(sat.lat, sat.lon);
          
          // Generate a fake historical trailing path (a sine wave segment behind it)
          const pathPoints = [];
          for (let i = 0; i < 20; i++) {
             const prevLon = sat.lon - i * 2;
             if (prevLon < -180) continue; // Prevent wrap-around glitch for simple drawing
             const prevLat = sat.lat * Math.cos(i * 0.1); 
             const pt = getXY(prevLat, prevLon);
             pathPoints.push(`${pt.x},${pt.y}`);
          }

          // Projected Path
          const projPoints = [];
          for (let i = 0; i < 20; i++) {
             const nextLon = sat.lon + i * 2;
             if (nextLon > 180) continue;
             const nextLat = sat.lat * Math.cos(i * 0.1); 
             const pt = getXY(nextLat, nextLon);
             projPoints.push(`${pt.x},${pt.y}`);
          }

          return (
            <g key={sat.id}>
              {/* Past Path */}
              {pathPoints.length > 0 && <path d={`M ${pathPoints.join(' L ')}`} fill="none" stroke="#00ffff" strokeWidth="1.5" opacity="0.4" />}
              {/* Projected Path */}
              {projPoints.length > 0 && <path d={`M ${projPoints.join(' L ')}`} fill="none" stroke="#00ffff" strokeWidth="1" strokeDasharray="3,3" opacity="0.3" />}
              
              {/* Active Marker */}
              <circle cx={x} cy={y} r="5" fill="#00ffff" className="pulse-dot-svg" />
              <text x={x + 8} y={y + 4} fill="#00ffff" fontSize="10" fontFamily="monospace" opacity="0.8">α{index + 1}</text>
            </g>
          );
        })}
      </svg>
      <div style={{ position: 'absolute', top: 8, left: 12, color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', fontWeight: 600 }}>Ground Track Map</div>
      <style>{`
        .pulse-dot-svg {
          animation: svgPulse 2s infinite;
          transform-origin: center;
          transform-box: fill-box;
        }
        @keyframes svgPulse {
          0% { stroke: rgba(0, 255, 255, 0.8); stroke-width: 0px; }
          100% { stroke: rgba(0, 255, 255, 0); stroke-width: 15px; }
        }
      `}</style>
    </div>
  );
}
