import React from 'react';

interface ThreatData {
  id: string;
  targetSatId: string;
  timeToCollision: number;
}

interface BullseyeProps {
  threats: ThreatData[];
}

export default function BullseyePlot({ threats }: BullseyeProps) {
  const size = 300;
  const center = size / 2;
  const maxDistance = 3600; // max 1 hour TCA to show on edge

  // Determine risk color
  const getRiskColor = (tca: number) => {
    if (tca < 600) return '#ff4444'; // Red < 10 mins
    if (tca < 1800) return '#ffaa00'; // Yellow < 30 mins
    return '#00ff88'; // Green > 30 mins
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: 'rgba(15, 15, 30, 0.6)', borderRadius: '12px', border: '1px solid rgba(0, 212, 255, 0.15)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', top: 12, left: 12, color: '#00d4ff', fontSize: '0.9rem', fontWeight: 600 }}>◎ Conjunction Bullseye</div>
      
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Radar concentric rings */}
        {[1, 2, 3].map((r) => (
          <circle key={r} cx={center} cy={center} r={(center - 20) * (r / 3)} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeDasharray="4,4" />
        ))}
        {/* Radar crosshairs */}
        <line x1={center} y1={20} x2={center} y2={size - 20} stroke="rgba(255,255,255,0.1)" />
        <line x1={20} y1={center} x2={size - 20} y2={center} stroke="rgba(255,255,255,0.1)" />
        
        {/* Target Satellite (Center) */}
        <circle cx={center} cy={center} r="6" fill="#00ffff" />
        <text x={center + 10} y={center - 10} fill="#00ffff" fontSize="10" fontFamily="monospace">Target SAT</text>

        {/* Radar Sweep Animation (CSS) */}
        <path d={`M ${center} ${center} L ${center} 20 A ${center-20} ${center-20} 0 0 1 ${size-20} ${center} Z`} fill="url(#radarGradient)" className="radar-sweep" style={{ transformOrigin: 'center' }} />

        {/* Threats */}
        {threats.map((threat, index) => {
          // Fake angle for demo based on index and ID so it scatters visually
          const angle = (parseInt(threat.id.slice(-2), 16) || index * 45) * (Math.PI / 180);
          
          // Map TCA to radial distance
          const normalizedDist = Math.max(0, Math.min(1, threat.timeToCollision / maxDistance));
          const r = normalizedDist * (center - 20);
          
          const x = center + r * Math.cos(angle);
          const y = center + r * Math.sin(angle);
          const color = getRiskColor(threat.timeToCollision);

          return (
            <g key={threat.id}>
              <circle cx={x} cy={y} r="4" fill={color} />
              <text x={x + 6} y={y + 4} fill={color} fontSize="9" fontFamily="monospace">TCA: {Math.round(threat.timeToCollision)}s</text>
            </g>
          );
        })}
        
        <defs>
          <linearGradient id="radarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(0, 212, 255, 0.4)" />
            <stop offset="100%" stopColor="rgba(0, 212, 255, 0)" />
          </linearGradient>
        </defs>
      </svg>

      <style>{`
        .radar-sweep {
          animation: sweep 4s infinite linear;
        }
        @keyframes sweep {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
