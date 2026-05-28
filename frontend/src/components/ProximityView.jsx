import React from 'react';
import './ProximityView.css';

const SAT_IDS = ['alpha-01', 'alpha-02', 'alpha-03', 'alpha-04', 'alpha-05', 'alpha-06'];

export default function ProximityView({ threats = [], selectedSat = 0 }) {
  const satId = SAT_IDS[selectedSat] || 'alpha-01';

  // Filter threats targeting selected satellite; show all if none match
  const filtered = threats.filter(t => t.targetSatId === satId);
  const displayThreats = filtered.length > 0 ? filtered : threats;

  const rings = [
    { r: 40, label: '10km', color: 'rgba(0,255,136,0.12)' },
    { r: 27, label: '5km', color: 'rgba(255,170,0,0.15)' },
    { r: 13, label: '1km', color: 'rgba(255,51,102,0.18)' },
  ];

  const radarPoints = displayThreats.map((t, i) => {
    const tca = t.timeToCollision || 10000;
    const dist = Math.min(tca / 250, 40);
    const angle = ((i * 67) + 15) * (Math.PI / 180);
    const cx = 50 + Math.cos(angle) * dist;
    const cy = 50 + Math.sin(angle) * dist;

    let color = '#00ff88';
    if (tca < 1000) color = '#ff3366';
    else if (tca < 5000) color = '#ffaa00';

    const isTarget = t.targetSatId === satId;
    const opacity = isTarget ? 0.9 : 0.2;

    return { id: t.id, cx, cy, color, tca: Math.round(tca), opacity, isTarget };
  });

  return (
    <div className="proximity-container">
      <h3 className="proximity-title">PROXIMITY OPS</h3>

      <div className="proximity-plot">
        <svg viewBox="0 0 100 100" width="100%" height="100%">
          <circle cx="50" cy="50" r="45" fill="rgba(0,20,0,0.3)" stroke="rgba(0,255,136,0.08)" strokeWidth="0.3" />

          {rings.map((ring, i) => (
            <g key={i}>
              <circle cx="50" cy="50" r={ring.r} fill="none" stroke={ring.color} strokeWidth="0.4" strokeDasharray="2,1" />
              <text x={52} y={50 - ring.r + 3} fill="rgba(255,255,255,0.25)" fontSize="2" fontFamily="monospace">{ring.label}</text>
            </g>
          ))}

          <line x1="10" y1="50" x2="90" y2="50" stroke="rgba(0,255,136,0.08)" strokeWidth="0.2" />
          <line x1="50" y1="10" x2="50" y2="90" stroke="rgba(0,255,136,0.08)" strokeWidth="0.2" />

          {/* Radar sweep */}
          <line x1="50" y1="50" x2="50" y2="8" stroke="rgba(0,255,136,0.4)" strokeWidth="0.5" className="radar-sweep-line" />
          <path d="M50,50 L47,12 A40,40 0 0,1 53,12 Z" fill="rgba(0,255,136,0.05)" className="radar-sweep-line" />

          {/* Center = selected satellite */}
          <polygon points="50,47 53,50 50,53 47,50" fill="#00ffff" />
          <text x="55" y="49" fill="#00ffff" fontSize="2.5" fontFamily="monospace">{'\u03B1'}{selectedSat + 1}</text>

          {radarPoints.map(tp => (
            <g key={tp.id} opacity={tp.opacity}>
              {tp.isTarget && (
                <circle cx={tp.cx} cy={tp.cy} r="1.5" fill="none" stroke={tp.color} strokeWidth="0.3" className="threat-ping" />
              )}
              <circle cx={tp.cx} cy={tp.cy} r="1.5" fill={tp.color} />
              <line x1="50" y1="50" x2={tp.cx} y2={tp.cy} stroke={tp.color} strokeWidth="0.2" opacity="0.3" strokeDasharray="0.5,0.5" />
              <text x={tp.cx + 2.5} y={tp.cy - 1.5} fill={tp.color} fontSize="2" fontFamily="monospace">{tp.tca}s</text>
            </g>
          ))}

          {radarPoints.length === 0 && (
            <text x="50" y="80" fill="rgba(0,255,136,0.4)" fontSize="2.5" textAnchor="middle" fontFamily="monospace">CLEAR ZONE</text>
          )}
        </svg>
      </div>

      <div className="proximity-legend">
        <span style={{ color: '#00ff88' }}>SAFE</span>
        <span style={{ color: '#ffaa00' }}>WARN</span>
        <span style={{ color: '#ff3366' }}>CRIT</span>
      </div>
    </div>
  );
}
