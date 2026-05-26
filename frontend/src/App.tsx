import { useState, useCallback } from 'react';
import EarthGlobe from './components/EarthGlobe';
import './App.css';

interface TelemetryData {
  altitude: number;
  velocity: number;
  lat: number;
  lon: number;
  inclination: number;
}

function App() {
  const [telemetry, setTelemetry] = useState<TelemetryData>({
    altitude: 0,
    velocity: 0,
    lat: 0,
    lon: 0,
    inclination: 51.6,
  });

  const [isConnected] = useState(true);

  const handleTelemetryUpdate = useCallback((data: TelemetryData) => {
    setTelemetry(data);
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0a14 0%, #0f0f1e 50%, #1a1a2e 100%)',
      padding: '24px',
      fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
      color: '#e0e0e0',
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <h1 style={{
              fontSize: '2rem',
              fontWeight: 700,
              color: '#00d4ff',
              margin: 0,
              letterSpacing: '-0.5px',
              textShadow: '0 0 20px rgba(0, 212, 255, 0.3)',
            }}>
              🛰️ Orbital Insight
            </h1>
            <p style={{ color: '#888', margin: '4px 0 0', fontSize: '0.9rem' }}>
              Space Situational Awareness Dashboard — Live Tracking
            </p>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            background: 'rgba(0, 212, 255, 0.08)',
            borderRadius: '20px',
            border: '1px solid rgba(0, 212, 255, 0.2)',
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: isConnected ? '#00ff88' : '#ff4444',
              boxShadow: isConnected ? '0 0 8px #00ff88' : '0 0 8px #ff4444',
              animation: 'pulse 2s infinite',
            }} />
            <span style={{ fontSize: '0.8rem', color: isConnected ? '#00ff88' : '#ff4444' }}>
              {isConnected ? 'LIVE' : 'OFFLINE'}
            </span>
          </div>
        </div>

        {/* Main Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 320px',
          gap: '20px',
          minHeight: '70vh',
        }}>

          {/* 3D Globe Panel */}
          <div style={{
            background: 'rgba(15, 15, 30, 0.8)',
            borderRadius: '16px',
            border: '1px solid rgba(0, 212, 255, 0.15)',
            padding: '16px',
            position: 'relative',
            overflow: 'hidden',
            backdropFilter: 'blur(10px)',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px',
            }}>
              <h2 style={{
                fontSize: '1rem',
                fontWeight: 600,
                color: '#00d4ff',
                margin: 0,
              }}>
                🌍 Live 3D Orbital View
              </h2>
              <span style={{
                fontSize: '0.7rem',
                color: '#666',
                padding: '4px 10px',
                background: 'rgba(0, 212, 255, 0.06)',
                borderRadius: '10px',
                border: '1px solid rgba(0, 212, 255, 0.1)',
              }}>
                Drag to rotate • Scroll to zoom
              </span>
            </div>
            <div style={{ height: 'calc(100% - 40px)', minHeight: '500px' }}>
              <EarthGlobe onTelemetryUpdate={handleTelemetryUpdate} />
            </div>
          </div>

          {/* Right Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Telemetry Panel */}
            <div style={{
              background: 'rgba(15, 15, 30, 0.8)',
              borderRadius: '16px',
              border: '1px solid rgba(0, 212, 255, 0.15)',
              padding: '20px',
              backdropFilter: 'blur(10px)',
            }}>
              <h2 style={{
                fontSize: '1rem',
                fontWeight: 600,
                color: '#00d4ff',
                margin: '0 0 16px',
              }}>
                📡 Live Telemetry
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <TelemetryRow label="Altitude" value={`${telemetry.altitude.toFixed(1)} km`} icon="📏" color="#00ff88" />
                <TelemetryRow label="Velocity" value={`${telemetry.velocity.toFixed(2)} km/s`} icon="⚡" color="#ffaa00" />
                <TelemetryRow label="Latitude" value={`${telemetry.lat.toFixed(2)}°`} icon="🌐" color="#00d4ff" />
                <TelemetryRow label="Longitude" value={`${telemetry.lon.toFixed(2)}°`} icon="🌐" color="#00d4ff" />
                <TelemetryRow label="Inclination" value={`${telemetry.inclination.toFixed(1)}°`} icon="📐" color="#ff66aa" />
              </div>
            </div>

            {/* Satellite Info */}
            <div style={{
              background: 'rgba(15, 15, 30, 0.8)',
              borderRadius: '16px',
              border: '1px solid rgba(0, 212, 255, 0.15)',
              padding: '20px',
              backdropFilter: 'blur(10px)',
            }}>
              <h2 style={{
                fontSize: '1rem',
                fontWeight: 600,
                color: '#00d4ff',
                margin: '0 0 16px',
              }}>
                🛰️ Satellite Info
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem' }}>
                <InfoRow label="Name" value="ISS (ZARYA)" />
                <InfoRow label="NORAD ID" value="25544" />
                <InfoRow label="Orbit Type" value="LEO" />
                <InfoRow label="Period" value="~92 min" />
                <InfoRow label="Launch" value="1998-11-20" />
              </div>
            </div>

            {/* Orbital Parameters */}
            <div style={{
              background: 'rgba(15, 15, 30, 0.8)',
              borderRadius: '16px',
              border: '1px solid rgba(0, 212, 255, 0.15)',
              padding: '20px',
              backdropFilter: 'blur(10px)',
            }}>
              <h2 style={{
                fontSize: '1rem',
                fontWeight: 600,
                color: '#00d4ff',
                margin: '0 0 16px',
              }}>
                🔭 Orbital Parameters
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem' }}>
                <InfoRow label="Semi-major axis" value="6,779 km" />
                <InfoRow label="Eccentricity" value="0.0001" />
                <InfoRow label="Perigee" value="408 km" />
                <InfoRow label="Apogee" value="410 km" />
                <InfoRow label="RAAN" value="234.5°" />
                <InfoRow label="Arg. Perigee" value="120.3°" />
              </div>
            </div>

          </div>
        </div>

        {/* Footer bar */}
        <div style={{
          marginTop: '20px',
          padding: '12px 20px',
          background: 'rgba(15, 15, 30, 0.6)',
          borderRadius: '12px',
          border: '1px solid rgba(0, 212, 255, 0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.75rem',
          color: '#666',
        }}>
          <span>Orbital Insight v0.1.0 • Powered by RK4 + J2 Propagator</span>
          <span>Backend: FastAPI on :8000 | Frontend: Vite on :5173</span>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

// ── Telemetry row component ──
function TelemetryRow({ label, value, icon, color }: { label: string; value: string; icon: string; color: string }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '10px 12px',
      background: 'rgba(0, 0, 0, 0.3)',
      borderRadius: '10px',
      border: '1px solid rgba(255, 255, 255, 0.04)',
    }}>
      <span style={{ color: '#888', fontSize: '0.85rem' }}>
        {icon} {label}
      </span>
      <span style={{
        color,
        fontWeight: 600,
        fontSize: '0.9rem',
        fontFamily: "'Courier New', monospace",
        textShadow: `0 0 8px ${color}40`,
      }}>
        {value}
      </span>
    </div>
  );
}

// ── Info row component ──
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      padding: '6px 0',
      borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
    }}>
      <span style={{ color: '#666' }}>{label}</span>
      <span style={{ color: '#ccc', fontFamily: "'Courier New', monospace" }}>{value}</span>
    </div>
  );
}

export default App;
