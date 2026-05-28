import React from 'react';

export default function ResourceDash({ satellites = [], deltaVData = [] }) {
  // Fuel Data - uses real fuel_kg from backend
  const fuelData = satellites.map((s, i) => ({
    name: '\u03B1' + (i + 1),
    fuel: s.fuel_kg !== undefined ? s.fuel_kg : 50,
    maxFuel: 50
  }));

  // Fallback deltaV if backend returns empty
  const chartData = deltaVData.length >= 2 ? deltaVData : [
    { day: 'Day 1', fuelConsumed: 0, collisionsAvoided: 0 },
    { day: 'Day 2', fuelConsumed: 0, collisionsAvoided: 0 },
    { day: 'Day 3', fuelConsumed: 0, collisionsAvoided: 0 },
  ];

  // Compute max values for chart scaling
  const maxFuel = Math.max(1, ...chartData.map(d => d.fuelConsumed));
  const maxAvoided = Math.max(1, ...chartData.map(d => d.collisionsAvoided));

  return (
    <div className="resource-dash-container">
      {/* Fleet Propellant Bar Chart */}
      <div className="resource-panel">
        <h3 className="resource-title">FLEET PROPELLANT (KG)</h3>
        <div className="fuel-bars">
          {fuelData.map((sat, i) => {
            const pct = (sat.fuel / sat.maxFuel) * 100;
            const barColor = pct > 60 ? '#00ff88' : pct > 30 ? '#ffaa00' : '#ff3366';
            return (
              <div key={i} className="fuel-bar-col">
                <div className="fuel-bar-track">
                  <div className="fuel-bar-fill" style={{ height: pct + '%', background: barColor, boxShadow: '0 0 8px ' + barColor + '60' }} />
                </div>
                <span className="fuel-bar-label">{sat.name}</span>
                <span className="fuel-bar-value" style={{ color: barColor }}>{sat.fuel.toFixed(1)}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Delta-V Cost Analysis Line Chart (Pure SVG) */}
      <div className="resource-panel">
        <h3 className="resource-title">{'\u0394'}V COST ANALYSIS</h3>
        <div className="deltav-chart">
          <svg viewBox="0 0 200 120" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
            {/* Grid */}
            {[0,1,2,3,4].map(i => (
              <line key={'hg'+i} x1="30" y1={20 + i * 22} x2="195" y2={20 + i * 22} stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
            ))}

            {/* Axes */}
            <line x1="30" y1="15" x2="30" y2="110" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />
            <line x1="30" y1="110" x2="195" y2="110" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />

            {/* Fuel consumed line (red) */}
            <polyline
              fill="none"
              stroke="#ff3366"
              strokeWidth="1.5"
              points={chartData.map((d, i) => {
                const x = 35 + (i / Math.max(1, chartData.length - 1)) * 155;
                const y = 105 - (d.fuelConsumed / maxFuel) * 85;
                return x + ',' + y;
              }).join(' ')}
            />
            {/* Fuel consumed dots */}
            {chartData.map((d, i) => {
              const x = 35 + (i / Math.max(1, chartData.length - 1)) * 155;
              const y = 105 - (d.fuelConsumed / maxFuel) * 85;
              return <circle key={'fd'+i} cx={x} cy={y} r="2" fill="#ff3366" />;
            })}

            {/* Collisions avoided line (cyan) */}
            <polyline
              fill="none"
              stroke="#00e5ff"
              strokeWidth="1.5"
              points={chartData.map((d, i) => {
                const x = 35 + (i / Math.max(1, chartData.length - 1)) * 155;
                const y = 105 - (d.collisionsAvoided / maxAvoided) * 85;
                return x + ',' + y;
              }).join(' ')}
            />
            {/* Avoided dots */}
            {chartData.map((d, i) => {
              const x = 35 + (i / Math.max(1, chartData.length - 1)) * 155;
              const y = 105 - (d.collisionsAvoided / maxAvoided) * 85;
              return <circle key={'ad'+i} cx={x} cy={y} r="2" fill="#00e5ff" />;
            })}

            {/* X axis labels */}
            {chartData.map((d, i) => {
              const x = 35 + (i / Math.max(1, chartData.length - 1)) * 155;
              return <text key={'xl'+i} x={x} y="118" fill="#888" fontSize="5" textAnchor="middle" fontFamily="monospace">{d.day}</text>;
            })}

            {/* Y axis labels */}
            <text x="8" y="25" fill="#ff3366" fontSize="5" fontFamily="monospace">{maxFuel.toFixed(1)}</text>
            <text x="8" y="108" fill="#ff3366" fontSize="5" fontFamily="monospace">0</text>
          </svg>

          {/* Legend */}
          <div className="deltav-legend">
            <span><span className="legend-dot" style={{ background: '#ff3366' }}></span>Fuel (kg)</span>
            <span><span className="legend-dot" style={{ background: '#00e5ff' }}></span>Avoided</span>
          </div>
        </div>
      </div>
    </div>
  );
}
