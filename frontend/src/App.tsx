import { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import EarthGlobe from './components/EarthGlobe';
import GroundTrackMap from './components/GroundTrackMap';
import BullseyePlot from './components/BullseyePlot';
import ResourceDash from './components/ResourceDash';
import ManeuverGantt from './components/ManeuverGantt';
import './App.css';

interface TelemetryData {
  altitude: number;
  velocity: number;
  lat: number;
  lon: number;
  inclination: number;
}

export default function App() {
  const [telemetry, setTelemetry] = useState<TelemetryData>({
    altitude: 550,
    velocity: 7.58,
    lat: 0,
    lon: 0,
    inclination: 51.6,
  });

  const [isConnected, setIsConnected] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [colaWarning, setColaWarning] = useState(false);

  // Backend state for visualization modules
  const [simTime, setSimTime] = useState(0);
  const [satellites, setSatellites] = useState<any[]>([]);
  const [threats, setThreats] = useState<any[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]);

  // Fetch Snapshot API
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    
    const fetchSnapshot = async () => {
      if (isPaused) return;
      try {
        const res = await axios.get('/api/visualization/snapshot');
        const data = res.data;
        
        setIsConnected(true);
        setSimTime(data.time);
        setSatellites(data.satellites || []);
        
        // The API returns threats with timeToCollision
        setThreats(data.threats || []);
        setTimeline(data.timeline || []);

      } catch (err) {
        setIsConnected(false);
        console.error("API Error:", err);
      }
    };

    // Poll every 1 second
    interval = setInterval(fetchSnapshot, 1000);
    return () => clearInterval(interval);
  }, [isPaused]);


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
              Space Situational Awareness • Advanced Visualization Modules
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

        {/* Main Grid: 3D Globe + Telemetry */}
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

            {/* Conjunction Bullseye Plot */}
            <div className="glass-panel" style={{ flexGrow: 1, padding: 0, overflow: 'hidden' }}>
              <BullseyePlot threats={threats} />
            </div>

          </div>
        </div>

        {/* Secondary Modules Layout */}
        <div className="modules-layout">
          {/* Ground Track Map */}
          <div className="glass-panel" style={{ height: '400px', padding: 0 }}>
             <GroundTrackMap satellites={satellites} time={simTime} />
          </div>

          {/* Maneuver Gantt Scheduler */}
          <div className="glass-panel" style={{ height: '400px', padding: 0 }}>
             <ManeuverGantt timeline={timeline} currentTime={simTime} />
          </div>

          {/* Telemetry & Resource Heatmaps */}
          <div className="glass-panel" style={{ gridColumn: '1 / -1', padding: 0, border: 'none', background: 'transparent' }}>
             <ResourceDash satellites={satellites} time={simTime} />
          </div>
        </div>

        {/* Footer bar */}
        <div className="footer-bar" style={{ marginTop: '40px' }}>
          <span>Orbital Insight SSA Dashboard v0.3.0 • 3D Constellation Tracking & Advanced Visualization Modules</span>
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
