import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';

export default function ResourceDash({ satellites }) {
  // Fuel Data for Bar Chart
  const fuelData = satellites.map((s, i) => ({
    name: `α${i+1}`,
    fuel: s.fuel || (50 - (i * 2.5)) // fallback mockup
  }));

  // Δv Cost Analysis (Fuel Consumed vs Collisions Avoided)
  const deltaVData = [
    { day: 'Day 1', fuelConsumed: 0.2, collisionsAvoided: 1 },
    { day: 'Day 2', fuelConsumed: 0.5, collisionsAvoided: 3 },
    { day: 'Day 3', fuelConsumed: 1.2, collisionsAvoided: 8 },
    { day: 'Day 4', fuelConsumed: 1.5, collisionsAvoided: 12 },
    { day: 'Day 5', fuelConsumed: 2.1, collisionsAvoided: 15 },
  ];

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', gap: '20px' }}>
      
      {/* Fuel Gauge (Heatmap/Bar) */}
      <div style={{ flex: 1, background: 'rgba(15, 15, 30, 0.6)', borderRadius: '12px', border: '1px solid rgba(0, 212, 255, 0.15)', padding: '16px', display: 'flex', flexDirection: 'column' }}>
        <h3 style={{ color: '#00d4ff', marginTop: 0, marginBottom: '16px', fontSize: '0.9rem', textTransform: 'uppercase' }}>Fleet Propellant (kg)</h3>
        <div style={{ flexGrow: 1 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={fuelData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="name" stroke="#888" fontSize={10} />
              <YAxis stroke="#888" fontSize={10} domain={[0, 50]} />
              <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ background: '#0a0a14', border: '1px solid #00d4ff' }} />
              <Bar dataKey="fuel" fill="#00ff88" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Δv Cost Analysis */}
      <div style={{ flex: 1, background: 'rgba(15, 15, 30, 0.6)', borderRadius: '12px', border: '1px solid rgba(0, 212, 255, 0.15)', padding: '16px', display: 'flex', flexDirection: 'column' }}>
        <h3 style={{ color: '#00d4ff', marginTop: 0, marginBottom: '16px', fontSize: '0.9rem', textTransform: 'uppercase' }}>Δv Cost Analysis</h3>
        <div style={{ flexGrow: 1 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={deltaVData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="day" stroke="#888" fontSize={10} />
              <YAxis yAxisId="left" stroke="#ff4444" fontSize={10} />
              <YAxis yAxisId="right" orientation="right" stroke="#00d4ff" fontSize={10} />
              <Tooltip contentStyle={{ background: '#0a0a14', border: '1px solid #00d4ff' }} />
              <Legend wrapperStyle={{ fontSize: '10px' }} />
              <Line yAxisId="left" type="monotone" dataKey="fuelConsumed" name="Fuel (kg)" stroke="#ff4444" strokeWidth={2} dot={{ r: 3 }} />
              <Line yAxisId="right" type="monotone" dataKey="collisionsAvoided" name="Avoided" stroke="#00d4ff" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}
