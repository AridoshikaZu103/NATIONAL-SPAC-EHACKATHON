import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, LineChart, Line, Cell } from 'recharts';

interface SatelliteData {
  id: string;
  name: string;
  fuel_kg: number;
}

interface ResourceDashProps {
  satellites: SatelliteData[];
  time: number;
}

export default function ResourceDash({ satellites, time }: ResourceDashProps) {
  // Format data for Recharts
  const fuelData = satellites.map(sat => ({
    name: sat.name || sat.id.split('-')[1],
    fuel: sat.fuel_kg,
    fill: sat.fuel_kg > 20 ? '#00d4ff' : '#ff4444' // color coding based on fuel level
  }));

  // Fake historical data for Fuel vs Collisions Avoided based on time
  // In a real app this would come from a historical backend endpoint
  const efficiencyData = [
    { time: 'T-5h', fuelUsed: 12, avoided: 2 },
    { time: 'T-4h', fuelUsed: 15, avoided: 3 },
    { time: 'T-3h', fuelUsed: 22, avoided: 5 },
    { time: 'T-2h', fuelUsed: 25, avoided: 5 },
    { time: 'T-1h', fuelUsed: 30, avoided: 8 },
    { time: 'Now', fuelUsed: 32 + (time > 0 ? 2 : 0), avoided: 9 + (time > 0 ? 1 : 0) },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', width: '100%', height: '100%' }}>
      
      {/* Fuel Gauge */}
      <div style={{ background: 'rgba(15, 15, 30, 0.6)', borderRadius: '12px', padding: '16px', border: '1px solid rgba(0, 212, 255, 0.15)' }}>
        <h3 style={{ color: '#00d4ff', marginTop: 0, marginBottom: '16px', fontSize: '1rem' }}>⛽ Fleet Fuel Reserves (kg)</h3>
        <div style={{ height: '220px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={fuelData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" horizontal={false} />
              <XAxis type="number" domain={[0, 50]} stroke="#888" tick={{ fill: '#888' }} />
              <YAxis dataKey="name" type="category" stroke="#888" tick={{ fill: '#ccc', fontSize: 12 }} width={50} />
              <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#0f0f1e', borderColor: '#00d4ff' }} />
              <Bar dataKey="fuel" radius={[0, 4, 4, 0]}>
                {fuelData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ∆v Cost Analysis */}
      <div style={{ background: 'rgba(15, 15, 30, 0.6)', borderRadius: '12px', padding: '16px', border: '1px solid rgba(0, 212, 255, 0.15)' }}>
        <h3 style={{ color: '#00ff88', marginTop: 0, marginBottom: '16px', fontSize: '1rem' }}>📈 Algorithm Efficiency (Cost vs Avoided)</h3>
        <div style={{ height: '220px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={efficiencyData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="time" stroke="#888" tick={{ fill: '#888', fontSize: 12 }} />
              <YAxis yAxisId="left" stroke="#00d4ff" tick={{ fill: '#00d4ff', fontSize: 12 }} />
              <YAxis yAxisId="right" orientation="right" stroke="#ffaa00" tick={{ fill: '#ffaa00', fontSize: 12 }} />
              <Tooltip contentStyle={{ backgroundColor: '#0f0f1e', borderColor: '#00ff88' }} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Line yAxisId="left" type="monotone" dataKey="fuelUsed" name="Fuel Consumed (kg)" stroke="#00d4ff" strokeWidth={2} activeDot={{ r: 6 }} />
              <Line yAxisId="right" type="stepAfter" dataKey="avoided" name="Collisions Avoided" stroke="#ffaa00" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}
