import React from 'react';
import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip, Scatter, ScatterChart, XAxis, YAxis, ZAxis, ReferenceArea } from 'recharts';

export default function BullseyePlot({ debris, satellites, threats }) {
  // Center is the selected satellite (alpha-1 usually)
  const maxDistance = 5000; // Display up to 5km
  
  // Format threats into scatter points: Radius = TCA, Angle = some fixed or random relative approach vector for demo.
  // We plot Angle (theta) vs TCA (radius). In Recharts ScatterChart, we can fake a polar view by doing math, 
  // or use the actual ScatterChart with polar settings if supported. Recharts doesn't natively support polar scatter well.
  // Instead, we will use standard X/Y scatter but map polar coordinates (TCA, Angle) into X/Y.
  
  const formattedData = threats.map((t, i) => {
    // Math logic: TCA is distance. If TCA > 5000s, clamp it.
    const tca = Math.min(t.timeToCollision, maxDistance);
    
    // Determine Risk Color based on PDF: Green = Safe, Yellow < 5000m (or s), Red < 1000m.
    // The PDF says "Red = Critical < 1 km", "Yellow = Warning < 5 km". But threats have TCA (time to collision).
    // Let's assume distance in km is proportional to TCA for the hackathon UI, or simply use TCA as proxy.
    const dist = t.timeToCollision; // Let's pretend this is meters for the visual scale
    let color = '#00ff88';
    if (dist < 1000) color = '#ff4444';
    else if (dist < 5000) color = '#ffaa00';
    
    const angle = (i * 45) * (Math.PI / 180); // Fake angle
    const x = Math.cos(angle) * tca;
    const y = Math.sin(angle) * tca;
    
    return { id: t.id, x, y, tca, dist, color };
  });

  // Include the center point (Satellite)
  const centerPoint = [{ id: 'SAT', x: 0, y: 0, color: '#00ffff' }];

  const CustomShape = (props) => {
    const { cx, cy, fill, payload } = props;
    if (payload.id === 'SAT') {
      return <polygon points={`${cx},${cy-5} ${cx+5},${cy} ${cx},${cy+5} ${cx-5},${cy}`} fill="#00ffff" />;
    }
    // Debris threat is a square if red, else circle
    if (fill === '#ff4444') {
      return <rect x={cx-3} y={cy-3} width={6} height={6} fill={fill} />;
    }
    return <circle cx={cx} cy={cy} r={3} fill={fill} />;
  };

  return (
    <div style={{ width: '100%', height: '100%', background: 'rgba(15, 15, 30, 0.6)', borderRadius: '12px', border: '1px solid rgba(0, 212, 255, 0.15)', padding: '16px', display: 'flex', flexDirection: 'column' }}>
      <h3 style={{ color: '#ffaa00', marginTop: 0, marginBottom: '16px', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '2px' }}>Conjunction Bullseye</h3>
      
      <div style={{ flexGrow: 1, position: 'relative' }}>
        {/* Radar Rings Background manually drawn to mimic polar grid */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
           <div style={{ width: '80%', height: '80%', borderRadius: '50%', border: '1px solid rgba(0,212,255,0.1)', position: 'absolute' }} />
           <div style={{ width: '50%', height: '50%', borderRadius: '50%', border: '1px solid rgba(0,212,255,0.2)', position: 'absolute' }} />
           <div style={{ width: '20%', height: '20%', borderRadius: '50%', border: '1px solid rgba(255,68,68,0.3)', position: 'absolute', background: 'rgba(255,68,68,0.05)' }} />
           {/* Crosshairs */}
           <div style={{ width: '100%', height: '1px', background: 'rgba(0,212,255,0.1)', position: 'absolute' }} />
           <div style={{ width: '1px', height: '100%', background: 'rgba(0,212,255,0.1)', position: 'absolute' }} />
        </div>

        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <XAxis type="number" dataKey="x" domain={[-maxDistance, maxDistance]} hide />
            <YAxis type="number" dataKey="y" domain={[-maxDistance, maxDistance]} hide />
            <ZAxis range={[20, 200]} />
            <Tooltip 
              cursor={{ strokeDasharray: '3 3' }} 
              content={({ payload }) => {
                if (!payload || !payload.length) return null;
                const d = payload[0].payload;
                if (d.id === 'SAT') return <div style={{ background: '#000', padding: '5px', border: '1px solid #00ffff', color: '#00ffff' }}>Origin Satellite</div>;
                return (
                  <div style={{ background: 'rgba(0,0,0,0.8)', padding: '8px', border: `1px solid ${d.color}`, color: '#fff', fontSize: '0.8rem' }}>
                    <strong>{d.id}</strong><br/>
                    Miss Dist: {d.dist.toFixed(1)}m<br/>
                    Risk: <span style={{ color: d.color }}>{d.dist < 1000 ? 'CRITICAL' : (d.dist < 5000 ? 'WARNING' : 'SAFE')}</span>
                  </div>
                );
              }}
            />
            {/* Draw threats */}
            {formattedData.map((entry, index) => (
              <Scatter key={index} data={[entry]} fill={entry.color} shape={CustomShape} />
            ))}
            {/* Draw center satellite */}
            <Scatter data={centerPoint} fill="#00ffff" shape={CustomShape} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      
      {/* Legend */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', fontSize: '0.65rem', color: '#888', marginTop: '10px' }}>
         <span style={{ color: '#00ff88' }}>SAFE {'>'} 5km</span> | 
         <span style={{ color: '#ffaa00' }}>WARNING {'<'} 5km</span> | 
         <span style={{ color: '#ff4444' }}>CRITICAL {'<'} 1km</span>
      </div>
    </div>
  );
}
