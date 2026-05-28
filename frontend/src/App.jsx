import { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import EarthGlobe from './components/EarthGlobe';
import GroundTrackMap from './components/GroundTrackMap';
import BullseyePlot from './components/BullseyePlot';
import ResourceDash from './components/ResourceDash';
import ManeuverGantt from './components/ManeuverGantt';
import './App.css';

export default function App() {
  const [telemetry, setTelemetry] = useState({
    altitude: 550,
    velocity: 7.58,
    lat: 0,
    lon: 0,
    inclination: 51.6,
  });

  const [isPaused, setIsPaused] = useState(false);
  const [colaWarning, setColaWarning] = useState(false);

  // Backend state for visualization modules
  const [simTime, setSimTime] = useState(0);
  const [satellites, setSatellites] = useState([]);
  const [debris, setDebris] = useState([]);
  const [threats, setThreats] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [deltaVData, setDeltaVData] = useState([]);

  // Auto Mode
  const [isAutoMode, setIsAutoMode] = useState(false);

  // Fetch Snapshot API
  useEffect(() => {
    let interval;
    
    const fetchSnapshot = async () => {
      if (isPaused) return;
      try {
        const res = await axios.get('/api/visualization/snapshot');
        const data = res.data;
        
        setSimTime(data.time);
        setSatellites(data.satellites || []);
        setDebris(data.debris_cloud || []);
        
        // The API returns threats with timeToCollision
        setThreats(data.threats || []);
        setTimeline(data.timeline || []);
        if (data.deltaVData) setDeltaVData(data.deltaVData);

      } catch (err) {
        console.error("API Error:", err);
      }
    };

    // Poll every 1 second
    interval = setInterval(fetchSnapshot, 1000);
    return () => clearInterval(interval);
  }, [isPaused]);


  // Auto Mode Loop
  useEffect(() => {
    let interval;
    if (isAutoMode && !isPaused) {
      interval = setInterval(async () => {
        try {
          await axios.post('/api/simulate/step', { step_seconds: 3600 });
        } catch(e) { console.error(e); }
      }, 2000); // Step 1 hour every 2 seconds
    }
    return () => clearInterval(interval);
  }, [isAutoMode, isPaused]);

  const handleStep = async () => {
    try {
      await axios.post('/api/simulate/step', { step_seconds: 3600 });
    } catch(e) { console.error(e); }
  };

  const simulateThreat = async () => {
    try {
      await axios.post('/api/telemetry', {
        timestamp: new Date().toISOString(),
        objects: [
          {
            id: `DEB-TEST-${Math.floor(Math.random()*1000)}`,
            type: "THREAT",
            targetSatId: "alpha-01",
            timeToCollision: 8000 + Math.random()*2000 // approx 2+ hours away
          }
        ]
      });
    } catch(e) { console.error(e); }
  };

  const handleTelemetryUpdate = (data) => {
    setTelemetry(data);
  };

  const handleCollisionWarning = (val) => {
    setColaWarning(val);
  };

  return (
    <div className="app-container">
      <div className="max-width-container">

        {/* Header */}
        <div className="header-bar">
          <div>
            <h1 className="main-title">
              ORBITAL INSIGHT SSA
            </h1>
            <p className="subtitle">
              Space Situational Awareness • Advanced Visualization Modules
            </p>
          </div>
          
          <div className="status-badges">
            <button 
              className={`control-btn ${isAutoMode ? 'live' : ''}`}
              onClick={() => setIsAutoMode(!isAutoMode)}
              style={{ borderColor: isAutoMode ? '#00ff88' : '' }}
            >
              {isAutoMode ? 'AUTO ON' : 'AUTO OFF'}
            </button>
            <button className="control-btn" onClick={handleStep}>
              STEP +1HR
            </button>
            <button className="control-btn" onClick={simulateThreat} style={{ borderColor: '#ff4444' }}>
              SPAWN THREAT
            </button>
            <button 
              className={`control-btn ${isPaused ? 'paused' : 'playing'}`}
              onClick={async () => {setIsPaused(!isPaused)}}
            >
              {isPaused ? 'PLAY' : 'PAUSE'}
            </button>
          </div>
        </div>

        {/* Collision Warning Banner */}
        {colaWarning && !isPaused && (
          <div className="cola-banner">
            <strong>COLA ALERT:</strong> Close approach detected between α1 and Threat Debris! Automatic evasion burn required.
          </div>
        )}

        {/* Main Grid: 3D Globe + Telemetry */}
        <div className="main-layout">

          {/* 3D Globe Panel */}
          <div className="globe-panel glass-panel">
            <div className="panel-header">
              <h2>LIVE 3D ORBITAL VIEW</h2>
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
                satellites={satellites}
                debris={debris}
                threats={threats}
                onTelemetryUpdate={handleTelemetryUpdate}
                onCollisionWarning={handleCollisionWarning}
              />
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="sidebar">

            {/* Telemetry Panel */}
            <div className="glass-panel">
              <h2 className="panel-title">LIVE TELEMETRY (α1)</h2>
              <div className="info-list">
                <TelemetryRow label="Altitude" value={`${telemetry.altitude.toFixed(1)} km`} color="#00ff88" />
                <TelemetryRow label="Velocity" value={`${telemetry.velocity.toFixed(2)} km/s`} color="#ffaa00" />
                <TelemetryRow label="Latitude" value={`${telemetry.lat.toFixed(2)}°`} color="#00d4ff" />
                <TelemetryRow label="Longitude" value={`${telemetry.lon.toFixed(2)}°`} color="#00d4ff" />
                <TelemetryRow label="Inclination" value={`${telemetry.inclination.toFixed(1)}°`} color="#ff66aa" />
              </div>
            </div>

            {/* Simulation Status */}
            <div className="glass-panel">
              <h2 className="panel-title">ENGINE STATUS</h2>
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
             <ResourceDash satellites={satellites} time={simTime} deltaVData={deltaVData} />
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
function TelemetryRow({ label, value, color }) {
  return (
    <div className="telemetry-row">
      <span className="telemetry-label">{label}</span>
      <span className="telemetry-value" style={{ color, textShadow: `0 0 8px ${color}40` }}>{value}</span>
    </div>
  );
}

function InfoRow({ label, value, valueColor = '#ccc' }) {
  return (
    <div className="info-row">
      <span className="info-label">{label}</span>
      <span className="info-value" style={{ color: valueColor }}>{value}</span>
    </div>
  );
}
