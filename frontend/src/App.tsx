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
    altitude: 550,
    velocity: 7.58,
    lat: 0,
    lon: 0,
    inclination: 51.6,
  });

  const [isConnected] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [colaWarning, setColaWarning] = useState(false);

  const handleTelemetryUpdate = useCallback((data: TelemetryData) => {
    setTelemetry(data);
  }, []);

  const handleCollisionWarning = useCallback((active: boolean) => {
    setColaWarning(active);
  }, []);

  return (
    <div className="app-container">
      <div className="max-width-container">

        {/* Header */}
        <div className="header-bar">
          <div>
            <h1 className="main-title">
              🛰️ Orbital Insight SSA
            </h1>
            <p className="subtitle">
              Space Situational Awareness • Walker Delta Constellation
            </p>
          </div>
          
          <div className="status-badges">
            <button 
              className={`control-btn ${isPaused ? 'paused' : 'playing'}`}
              onClick={() => setIsPaused(!isPaused)}
            >
              {isPaused ? '▶️ PLAY' : '⏸️ PAUSE'}
            </button>

            <div className={`status-badge ${isConnected ? 'live' : 'offline'}`}>
              <div className="pulse-dot" />
              <span>{isConnected ? 'LIVE' : 'OFFLINE'}</span>
            </div>
          </div>
        </div>

        {/* Collision Warning Banner */}
        {colaWarning && !isPaused && (
          <div className="cola-banner">
            ⚠️ <strong>COLA ALERT:</strong> Close approach detected between α1 and Threat Debris! Automatic evasion burn required.
          </div>
        )}

        {/* Main Grid */}
        <div className="main-layout">

          {/* 3D Globe Panel */}
          <div className="globe-panel glass-panel">
            <div className="panel-header">
              <h2>🌍 Live 3D Orbital View</h2>
              <span className="hint-badge">
                Drag to rotate • Scroll to zoom
              </span>
            </div>
            
            {/* Legend */}
            <div className="legend-overlay">
              <div className="legend-item"><span className="symbol cyan-diamond">◆</span> α1-α6 Satellites</div>
              <div className="legend-item"><span className="symbol blue-dot">●</span> 518 Debris</div>
              <div className="legend-item"><span className="symbol red-square">■</span> Threat Object</div>
              <div className="legend-item"><span className="symbol green-triangle">▲</span> Ground Station</div>
            </div>

            <div className="globe-container">
              <EarthGlobe 
                isPaused={isPaused} 
                onTelemetryUpdate={handleTelemetryUpdate}
                onCollisionWarning={handleCollisionWarning}
              />
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="sidebar">

            {/* Telemetry Panel */}
            <div className="glass-panel">
              <h2 className="panel-title">📡 Live Telemetry (α1)</h2>
              <div className="info-list">
                <TelemetryRow label="Altitude" value={`${telemetry.altitude.toFixed(1)} km`} icon="📏" color="#00ff88" />
                <TelemetryRow label="Velocity" value={`${telemetry.velocity.toFixed(2)} km/s`} icon="⚡" color="#ffaa00" />
                <TelemetryRow label="Latitude" value={`${telemetry.lat.toFixed(2)}°`} icon="🌐" color="#00d4ff" />
                <TelemetryRow label="Longitude" value={`${telemetry.lon.toFixed(2)}°`} icon="🌐" color="#00d4ff" />
                <TelemetryRow label="Inclination" value={`${telemetry.inclination.toFixed(1)}°`} icon="📐" color="#ff66aa" />
              </div>
            </div>

            {/* Simulation Status */}
            <div className="glass-panel">
              <h2 className="panel-title">⚙️ Engine Status</h2>
              <div className="info-list text-small">
                <InfoRow label="Constellation" value="Walker Delta (6)" />
                <InfoRow label="Debris Tracked" value="518" />
                <InfoRow label="Ground Stations" value="6 Active" />
                <InfoRow label="Terminator" value="Visible" />
                <InfoRow 
                  label="COLA Engine" 
                  value={colaWarning ? "FIRING" : "STANDBY"} 
                  valueColor={colaWarning ? "#ff4444" : "#00ff88"} 
                />
              </div>
            </div>

            {/* Orbital Parameters */}
            <div className="glass-panel">
              <h2 className="panel-title">🔭 Orbital Parameters</h2>
              <div className="info-list text-small">
                <InfoRow label="Semi-major axis" value="6,921 km" />
                <InfoRow label="Eccentricity" value="0.0000" />
                <InfoRow label="Perigee" value="550 km" />
                <InfoRow label="Apogee" value="550 km" />
                <InfoRow label="RAAN" value="0.0°" />
                <InfoRow label="Arg. Perigee" value="0.0°" />
              </div>
            </div>

          </div>
        </div>

        {/* Footer bar */}
        <div className="footer-bar">
          <span>Orbital Insight SSA Dashboard v0.2.0 • 3D Constellation Tracking</span>
          <span>Backend: FastAPI on :8000 | Frontend: Vite on :5173</span>
        </div>
      </div>
    </div>
  );
}

// ── Components ──
function TelemetryRow({ label, value, icon, color }: { label: string; value: string; icon: string; color: string }) {
  return (
    <div className="telemetry-row">
      <span className="telemetry-label">{icon} {label}</span>
      <span className="telemetry-value" style={{ color, textShadow: `0 0 8px ${color}40` }}>{value}</span>
    </div>
  );
}

function InfoRow({ label, value, valueColor = '#ccc' }: { label: string; value: string; valueColor?: string }) {
  return (
    <div className="info-row">
      <span className="info-label">{label}</span>
      <span className="info-value" style={{ color: valueColor }}>{value}</span>
    </div>
  );
}

export default App;
