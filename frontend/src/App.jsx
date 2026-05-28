import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import EarthGlobe from './components/EarthGlobe';
import GroundTrackMap from './components/GroundTrackMap';
import BullseyePlot from './components/BullseyePlot';
import ResourceDash from './components/ResourceDash';
import ManeuverGantt from './components/ManeuverGantt';
import ProximityView from './components/ProximityView';
import { HelpTutorial, ToastContainer, createToast, ReportModal } from './components/HelpTutorial';
import './App.css';

export default function App() {
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

  // Selected satellite for telemetry (0-5)
  const [selectedSat, setSelectedSat] = useState(0);

  // Auto Mode
  const [isAutoMode, setIsAutoMode] = useState(false);
  const [stepSize, setStepSize] = useState(3600);
  const [autoSpeed, setAutoSpeed] = useState(2000);

  // UI state
  const [showHelp, setShowHelp] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [prevThreats, setPrevThreats] = useState(0);
  const [prevManeuvers, setPrevManeuvers] = useState(0);

  const addToast = useCallback((type, title, message) => {
    const t = createToast(type, title, message);
    setToasts(prev => [...prev.slice(-4), t]);
    setTimeout(() => setToasts(prev => prev.filter(x => x.id !== t.id)), 5000);
  }, []);

  // Fetch Snapshot — 500ms for live feel
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
    fetchSnapshot();
    interval = setInterval(fetchSnapshot, 500);
    return () => clearInterval(interval);
  }, [isPaused]);

  // Toast notifications for threat/maneuver changes
  useEffect(() => {
    if (threats.length > prevThreats) {
      addToast('danger', 'THREAT DETECTED', 'New debris on collision course with ' + (threats[threats.length - 1]?.targetSatId || 'satellite'));
    } else if (threats.length < prevThreats && prevThreats > 0) {
      addToast('success', 'THREAT CLEARED', 'Evasion maneuver successful. Satellite safe.');
    }
    setPrevThreats(threats.length);
  }, [threats.length]);

  useEffect(() => {
    const currentEvasions = timeline.filter(e => e.type === 'EVASION').length;
    if (currentEvasions > prevManeuvers) {
      addToast('warning', 'EVASION BURN', 'COLA engine fired. Fuel consumed: 2.5 kg');
    }
    setPrevManeuvers(currentEvasions);
  }, [timeline.length]);

  // Auto Mode Loop
  useEffect(() => {
    let interval;
    if (isAutoMode && !isPaused) {
      interval = setInterval(async () => {
        try { await axios.post('/api/simulate/step', { step_seconds: stepSize }); } catch (e) { console.error(e); }
      }, autoSpeed);
    }
    return () => clearInterval(interval);
  }, [isAutoMode, isPaused, stepSize, autoSpeed]);

  const handleStep = async () => {
    try {
      const res = await axios.post('/api/simulate/step', { step_seconds: stepSize });
      addToast('info', 'STEP COMPLETE', 'Advanced ' + (stepSize >= 3600 ? (stepSize/3600) + 'hr' : stepSize + 's') + '. Maneuvers: ' + (res.data.maneuvers_executed || 0));
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

  const handleTelemetryUpdate = () => {};
  const handleCollisionWarning = (val) => setColaWarning(val);
  const dismissToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  const formatTime = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return h + 'h ' + m + 'm';
  };

  const currentSat = satellites[selectedSat] || { lat: 0, lon: 0, alt: 550, velocity: 7.58, inclination: 51.6, fuel_kg: 50 };

  return (
    <div className="app-container">
      <div className="max-width-container">

        {/* Toast Notifications */}
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />

        {/* Help Tutorial */}
        <HelpTutorial isOpen={showHelp} onClose={() => setShowHelp(false)} />

        {/* Report Modal */}
        <ReportModal isOpen={showReport} onClose={() => setShowReport(false)} satellites={satellites} timeline={timeline} threats={threats} simTime={simTime} />

        {/* Floating Help Button */}
        <button className="help-fab" onClick={() => setShowHelp(true)} title="How to use">?</button>

        {/* Header */}
        <div className="header-bar">
          <div>
            <h1 className="main-title">ORBITAL INSIGHT SSA</h1>
            <p className="subtitle">Autonomous Constellation Manager</p>
          </div>
          <div className="status-badges">
            <button className={'control-btn' + (isAutoMode ? ' auto-active' : '')} onClick={() => setIsAutoMode(!isAutoMode)}>
              {isAutoMode ? 'AUTO ON' : 'AUTO OFF'}
            </button>
            <button className="control-btn" onClick={handleStep}>
              STEP +{stepSize >= 3600 ? (stepSize / 3600) + 'HR' : stepSize + 'S'}
            </button>
            <button className="control-btn threat-btn" onClick={simulateThreat}>SPAWN THREAT</button>
            <button className="control-btn report-btn" onClick={() => setShowReport(true)}>REPORT</button>
            <button className={'control-btn ' + (isPaused ? 'paused' : 'playing')} onClick={() => setIsPaused(!isPaused)}>
              {isPaused ? 'PLAY' : 'PAUSE'}
            </button>
          </div>
        </div>

        {/* Speed Controls */}
        <div className="speed-controls">
          <div className="speed-group">
            <label>Step:</label>
            <select value={stepSize} onChange={(e) => setStepSize(Number(e.target.value))}>
              <option value={60}>1 min</option>
              <option value={600}>10 min</option>
              <option value={3600}>1 hour</option>
              <option value={7200}>2 hours</option>
              <option value={86400}>1 day</option>
            </select>
          </div>
          <div className="speed-group">
            <label>Speed:</label>
            <input type="range" min="500" max="5000" step="500" value={autoSpeed} onChange={(e) => setAutoSpeed(Number(e.target.value))} />
            <span>{(autoSpeed / 1000).toFixed(1)}s</span>
          </div>
          <div className="sim-clock">
            <span className="clock-label">SIM CLOCK</span>
            <span className="clock-value">{formatTime(simTime)}</span>
          </div>
          <div className="sim-clock">
            <span className="clock-label">THREATS</span>
            <span className="clock-value" style={{ color: threats.length > 0 ? '#ff3366' : '#00ff88' }}>{threats.length}</span>
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
              <span className="hint-badge">Drag to rotate</span>
            </div>
            <div className="legend-overlay">
              <div className="legend-item"><span className="symbol cyan-diamond">&#9670;</span> Satellites</div>
              <div className="legend-item"><span className="symbol blue-dot">&#9679;</span> 518 Debris</div>
              <div className="legend-item"><span className="symbol red-square">&#9632;</span> Threat</div>
              <div className="legend-item"><span className="symbol green-triangle">&#9650;</span> Ground Stn</div>
            </div>
            <div className="globe-container">
              <EarthGlobe isPaused={isPaused} satellites={satellites} debris={debris} threats={threats} onTelemetryUpdate={handleTelemetryUpdate} onCollisionWarning={handleCollisionWarning} />
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="sidebar">
            <div className="glass-panel">
              <h2 className="panel-title">LIVE TELEMETRY</h2>
              <div className="sat-selector">
                {[0,1,2,3,4,5].map(i => (
                  <button key={i} className={'sat-tab' + (selectedSat === i ? ' sat-tab-active' : '')} onClick={() => setSelectedSat(i)}>
                    {'\u03B1'}{i + 1}
                  </button>
                ))}
              </div>
              <div className="info-list">
                <TelemetryRow label="Altitude" value={(currentSat.alt || 550).toFixed(1) + ' km'} color="#00ff88" />
                <TelemetryRow label="Velocity" value={(currentSat.velocity || 7.58).toFixed(3) + ' km/s'} color="#ffaa00" />
                <TelemetryRow label="Latitude" value={(currentSat.lat || 0).toFixed(2) + '\u00B0'} color="#00d4ff" />
                <TelemetryRow label="Longitude" value={(currentSat.lon || 0).toFixed(2) + '\u00B0'} color="#00d4ff" />
                <TelemetryRow label="Inclination" value={(currentSat.inclination || 51.6).toFixed(1) + '\u00B0'} color="#ff66aa" />
                <TelemetryRow label="Fuel" value={(currentSat.fuel_kg || 50).toFixed(1) + ' kg'} color={currentSat.fuel_kg > 30 ? '#00ff88' : currentSat.fuel_kg > 15 ? '#ffaa00' : '#ff3366'} />
              </div>
            </div>

            <div className="glass-panel">
              <h2 className="panel-title">ENGINE STATUS</h2>
              <div className="info-list text-small">
                <InfoRow label="Constellation" value="Walker Delta (6)" />
                <InfoRow label="Debris Tracked" value="518" />
                <InfoRow label="Ground Stations" value="6 Active" />
                <InfoRow label="Sim Time" value={formatTime(simTime)} />
                <InfoRow label="COLA Engine" value={colaWarning ? "FIRING" : "STANDBY"} valueColor={colaWarning ? "#ff3366" : "#00ff88"} />
              </div>
            </div>

            <div className="glass-panel sidebar-bullseye">
              <BullseyePlot threats={threats} />
            </div>

            <div className="glass-panel sidebar-proximity">
              <ProximityView threats={threats} selectedSat={selectedSat} />
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
          <span>Orbital Insight SSA v1.0</span>
          <span>{simTimestamp || 'Connecting...'}</span>
        </div>
      </div>
    </div>
  );
}

function TelemetryRow({ label, value, color }) {
  // Extract numeric value for bar width
  const numMatch = value.match(/[\d.]+/);
  const num = numMatch ? parseFloat(numMatch[0]) : 0;

  // Map label to icon and bar range
  const icons = { Altitude: '\u2191', Velocity: '\u2192', Latitude: '\u2195', Longitude: '\u2194', Inclination: '\u2220', Fuel: '\u26FD' };
  const maxVals = { Altitude: 700, Velocity: 10, Latitude: 90, Longitude: 180, Inclination: 90, Fuel: 50 };
  const icon = icons[label] || '\u2022';
  const maxVal = maxVals[label] || 100;
  const barPct = Math.min(100, (Math.abs(num) / maxVal) * 100);

  return (
    <div className="telemetry-row">
      <div className="telemetry-left">
        <span className="telemetry-icon" style={{ color }}>{icon}</span>
        <span className="telemetry-label">{label}</span>
      </div>
      <div className="telemetry-right">
        <div className="telemetry-bar-track">
          <div className="telemetry-bar-fill" style={{ width: barPct + '%', background: 'linear-gradient(90deg, ' + color + '80, ' + color + ')' }} />
        </div>
        <span className="telemetry-value" style={{ color, textShadow: '0 0 8px ' + color + '40' }}>{value}</span>
      </div>
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
