import { useState, useCallback, useEffect, useRef } from 'react';
import axios from 'axios';
import EarthGlobe from './components/EarthGlobe';
import GroundTrackMap from './components/GroundTrackMap';
import BullseyePlot from './components/BullseyePlot';
import ResourceDash from './components/ResourceDash';
import ManeuverGantt from './components/ManeuverGantt';
import './App.css';

export default function App() {
  const [telemetry, setTelemetry] = useState({
    altitude: 550, velocity: 7.58, lat: 0, lon: 0, inclination: 51.6,
  });

  const [isPaused, setIsPaused] = useState(false);
  const [colaWarning, setColaWarning] = useState(false);

  // Backend state
  const [simTime, setSimTime] = useState(0);
  const [simTimestamp, setSimTimestamp] = useState('');
  const [satellites, setSatellites] = useState([]);
  const [debris, setDebris] = useState([]);
  const [threats, setThreats] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [deltaVData, setDeltaVData] = useState([]);
  const [maneuverCount, setManeuverCount] = useState(0);

  // Auto Mode with adjustable speed
  const [isAutoMode, setIsAutoMode] = useState(false);
  const [stepSize, setStepSize] = useState(3600); // seconds per step
  const [autoSpeed, setAutoSpeed] = useState(2000); // ms between steps

  // Fetch Snapshot
  useEffect(() => {
    let interval;
    const fetchSnapshot = async () => {
      if (isPaused) return;
      try {
        const res = await axios.get('/api/visualization/snapshot');
        const data = res.data;
        setSimTime(data.time);
        setSimTimestamp(data.timestamp || '');
        setSatellites(data.satellites || []);
        setDebris(data.debris_cloud || []);
        setThreats(data.threats || []);
        setTimeline(data.timeline || []);
        if (data.deltaVData) setDeltaVData(data.deltaVData);
        if (data.maneuver_count !== undefined) setManeuverCount(data.maneuver_count);
      } catch (err) {
        console.error("API Error:", err);
      }
    };
    fetchSnapshot(); // Fetch immediately
    interval = setInterval(fetchSnapshot, 1000);
    return () => clearInterval(interval);
  }, [isPaused]);

  // Auto Mode Loop
  useEffect(() => {
    let interval;
    if (isAutoMode && !isPaused) {
      interval = setInterval(async () => {
        try {
          await axios.post('/api/simulate/step', { step_seconds: stepSize });
        } catch (e) { console.error(e); }
      }, autoSpeed);
    }
    return () => clearInterval(interval);
  }, [isAutoMode, isPaused, stepSize, autoSpeed]);

  const handleStep = async () => {
    try {
      const res = await axios.post('/api/simulate/step', { step_seconds: stepSize });
      console.log('Step result:', res.data);
    } catch (e) { console.error(e); }
  };

  const simulateThreat = async () => {
    try {
      await axios.post('/api/telemetry', {
        timestamp: new Date().toISOString(),
        objects: [{
          id: 'DEB-THR-' + Math.floor(Math.random() * 9000 + 1000),
          type: "THREAT",
          targetSatId: "alpha-01",
          timeToCollision: 7200 + Math.random() * 7200
        }]
      });
    } catch (e) { console.error(e); }
  };

  const handleTelemetryUpdate = (data) => setTelemetry(data);
  const handleCollisionWarning = (val) => setColaWarning(val);

  const formatTime = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return h + 'h ' + m + 'm';
  };

  return (
    <div className="app-container">
      <div className="max-width-container">

        {/* Header */}
        <div className="header-bar">
          <div>
            <h1 className="main-title">ORBITAL INSIGHT SSA</h1>
            <p className="subtitle">
              Space Situational Awareness &bull; Autonomous Constellation Manager
            </p>
          </div>

          <div className="status-badges">
            <button
              className={'control-btn' + (isAutoMode ? ' auto-active' : '')}
              onClick={() => setIsAutoMode(!isAutoMode)}
            >
              {isAutoMode ? 'AUTO ON' : 'AUTO OFF'}
            </button>
            <button className="control-btn" onClick={handleStep}>
              STEP +{stepSize >= 3600 ? (stepSize / 3600) + 'HR' : stepSize + 'S'}
            </button>
            <button className="control-btn threat-btn" onClick={simulateThreat}>
              SPAWN THREAT
            </button>
            <button
              className={'control-btn ' + (isPaused ? 'paused' : 'playing')}
              onClick={() => setIsPaused(!isPaused)}
            >
              {isPaused ? 'PLAY' : 'PAUSE'}
            </button>
          </div>
        </div>

        {/* Speed Controls */}
        <div className="speed-controls">
          <div className="speed-group">
            <label>Step Size:</label>
            <select value={stepSize} onChange={(e) => setStepSize(Number(e.target.value))}>
              <option value={60}>1 min</option>
              <option value={600}>10 min</option>
              <option value={3600}>1 hour</option>
              <option value={7200}>2 hours</option>
              <option value={86400}>1 day</option>
            </select>
          </div>
          <div className="speed-group">
            <label>Auto Speed:</label>
            <input type="range" min="500" max="5000" step="500" value={autoSpeed}
              onChange={(e) => setAutoSpeed(Number(e.target.value))} />
            <span>{(autoSpeed / 1000).toFixed(1)}s</span>
          </div>
          <div className="sim-clock">
            <span className="clock-label">SIM CLOCK</span>
            <span className="clock-value">{formatTime(simTime)}</span>
          </div>
          <div className="sim-clock">
            <span className="clock-label">THREATS</span>
            <span className="clock-value" style={{ color: threats.length > 0 ? '#ff3366' : '#00ff88' }}>
              {threats.length}
            </span>
          </div>
          <div className="sim-clock">
            <span className="clock-label">MANEUVERS</span>
            <span className="clock-value">{maneuverCount}</span>
          </div>
        </div>

        {/* COLA Banner */}
        {colaWarning && !isPaused && (
          <div className="cola-banner">
            <strong>COLA ALERT:</strong> Close approach detected! Automatic evasion burn required.
          </div>
        )}

        {/* Main Grid */}
        <div className="main-layout">
          <div className="globe-panel glass-panel">
            <div className="panel-header">
              <h2>LIVE 3D ORBITAL VIEW</h2>
              <span className="hint-badge">Drag to rotate &bull; Scroll to zoom</span>
            </div>

            <div className="legend-overlay">
              <div className="legend-item"><span className="symbol cyan-diamond">&#9670;</span> Satellites</div>
              <div className="legend-item"><span className="symbol blue-dot">&#9679;</span> 518 Debris</div>
              <div className="legend-item"><span className="symbol red-square">&#9632;</span> Threat</div>
              <div className="legend-item"><span className="symbol green-triangle">&#9650;</span> Ground Stn</div>
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
            <div className="glass-panel">
              <h2 className="panel-title">LIVE TELEMETRY ({'\u03B1'}1)</h2>
              <div className="info-list">
                <TelemetryRow label="Altitude" value={telemetry.altitude.toFixed(1) + ' km'} color="#00ff88" />
                <TelemetryRow label="Velocity" value={telemetry.velocity.toFixed(2) + ' km/s'} color="#ffaa00" />
                <TelemetryRow label="Latitude" value={telemetry.lat.toFixed(2) + '\u00B0'} color="#00d4ff" />
                <TelemetryRow label="Longitude" value={telemetry.lon.toFixed(2) + '\u00B0'} color="#00d4ff" />
                <TelemetryRow label="Inclination" value={telemetry.inclination.toFixed(1) + '\u00B0'} color="#ff66aa" />
              </div>
            </div>

            <div className="glass-panel">
              <h2 className="panel-title">ENGINE STATUS</h2>
              <div className="info-list text-small">
                <InfoRow label="Constellation" value="Walker Delta (6)" />
                <InfoRow label="Debris Tracked" value="518" />
                <InfoRow label="Ground Stations" value="6 Active" />
                <InfoRow label="Sim Time" value={formatTime(simTime)} />
                <InfoRow
                  label="COLA Engine"
                  value={colaWarning ? "FIRING" : "STANDBY"}
                  valueColor={colaWarning ? "#ff3366" : "#00ff88"}
                />
              </div>
            </div>

            <div className="glass-panel sidebar-bullseye">
              <BullseyePlot threats={threats} />
            </div>
          </div>
        </div>

        {/* Secondary Modules */}
        <div className="modules-layout">
          <div className="glass-panel module-panel">
            <GroundTrackMap satellites={satellites} time={simTime} />
          </div>
          <div className="glass-panel module-panel">
            <ManeuverGantt timeline={timeline} currentTime={simTime} />
          </div>
          <div className="glass-panel module-wide">
            <ResourceDash satellites={satellites} deltaVData={deltaVData} />
          </div>
        </div>

        <div className="footer-bar">
          <span>Orbital Insight SSA v1.0 &bull; Autonomous Constellation Manager</span>
          <span>{simTimestamp || 'Connecting...'}</span>
        </div>
      </div>
    </div>
  );
}

function TelemetryRow({ label, value, color }) {
  return (
    <div className="telemetry-row">
      <span className="telemetry-label">{label}</span>
      <span className="telemetry-value" style={{ color, textShadow: '0 0 8px ' + color + '40' }}>{value}</span>
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
