import React from 'react';
import './BullseyePlot.css';

const SAT_IDS = ['alpha-01', 'alpha-02', 'alpha-03', 'alpha-04', 'alpha-05', 'alpha-06'];

export default function BullseyePlot({ threats = [], selectedSat = 0, satellites = [] }) {
  const maxTCA = 10000;
  const satId = SAT_IDS[selectedSat] || 'alpha-01';
  const satName = satellites[selectedSat]?.name || satId;

  // Filter threats targeting the selected satellite
  const filteredThreats = threats.filter(t => t.targetSatId === satId);
  // Also show ALL threats if none match (for visibility)
  const displayThreats = filteredThreats.length > 0 ? filteredThreats : threats;
  const isFiltered = filteredThreats.length > 0;

  const rings = [
    { r: 90, label: '10k s', color: 'rgba(0,255,136,0.15)' },
    { r: 60, label: '5k s', color: 'rgba(255,170,0,0.2)' },
    { r: 30, label: '1k s', color: 'rgba(255,51,102,0.2)' },
  ];

  const threatPoints = displayThreats.map((t, i) => {
    const tca = Math.min(t.timeToCollision, maxTCA);
    const radiusPct = (tca / maxTCA) * 90;
    const angle = (i * 72 + 30) * (Math.PI / 180);
    const cx = 50 + Math.cos(angle) * radiusPct * 0.5;
    const cy = 50 + Math.sin(angle) * radiusPct * 0.5;

    let color = '#00ff88';
    let risk = 'SAFE';
    if (tca < 1000) { color = '#ff3366'; risk = 'CRITICAL'; }
    else if (tca < 5000) { color = '#ffaa00'; risk = 'WARNING'; }

    // Dim threats not targeting this sat
    const isTarget = t.targetSatId === satId;
    const opacity = isTarget ? 1 : 0.25;

    return { id: t.id, cx, cy, color, risk, tca: Math.round(tca), opacity, isTarget };
  });

  return (
    <div className="bullseye-container">
      <h3 className="bullseye-title">CONJUNCTION BULLSEYE</h3>

      <div className="bullseye-plot">
        <svg viewBox="0 0 100 100" width="100%" height="100%">
          {rings.map((ring, i) => (
            <g key={i}>
              <circle cx="50" cy="50" r={ring.r * 0.5} fill="none" stroke={ring.color} strokeWidth="0.5" strokeDasharray="2,1" />
              <text x={51} y={50 - ring.r * 0.5 + 3} fill="rgba(255,255,255,0.3)" fontSize="2.5" fontFamily="monospace">{ring.label}</text>
            </g>
          ))}

          {/* Crosshairs */}
          <line x1="5" y1="50" x2="95" y2="50" stroke="rgba(0,212,255,0.1)" strokeWidth="0.3" />
          <line x1="50" y1="5" x2="50" y2="95" stroke="rgba(0,212,255,0.1)" strokeWidth="0.3" />
          <line x1="15" y1="15" x2="85" y2="85" stroke="rgba(0,212,255,0.05)" strokeWidth="0.2" />
          <line x1="85" y1="15" x2="15" y2="85" stroke="rgba(0,212,255,0.05)" strokeWidth="0.2" />

          {/* Center = selected satellite */}
          <polygon points="50,46 54,50 50,54 46,50" fill="#00ffff" />
          <text x="56" y="49" fill="#00ffff" fontSize="3" fontFamily="monospace">{'\u03B1'}{selectedSat + 1}</text>

          {/* Threat markers */}
          {threatPoints.map(tp => (
            <g key={tp.id} opacity={tp.opacity}>
              <rect x={tp.cx - 2} y={tp.cy - 2} width={4} height={4} fill={tp.color} rx="0.5">
                {tp.isTarget && <animate attributeName="opacity" values="1;0.4;1" dur="1.5s" repeatCount="indefinite" />}
              </rect>
              <line x1="50" y1="50" x2={tp.cx} y2={tp.cy} stroke={tp.color} strokeWidth="0.3" opacity="0.4" strokeDasharray="1,1" />
              <text x={tp.cx + 3} y={tp.cy - 1} fill={tp.color} fontSize="2.2" fontFamily="monospace">{tp.tca}s</text>
            </g>
          ))}

          {threatPoints.length === 0 && (
            <text x="50" y="85" fill="rgba(0,255,136,0.5)" fontSize="3" textAnchor="middle" fontFamily="monospace">ALL CLEAR</text>
          )}
        </svg>
      </div>

      <div className="bullseye-legend">
        <span style={{ color: '#00ff88' }}>SAFE &gt;5k</span>
        <span style={{ color: '#ffaa00' }}>WARN &lt;5k</span>
        <span style={{ color: '#ff3366' }}>CRIT &lt;1k</span>
      </div>
    </div>
  );
}
