import { useState } from 'react';
import EarthGlobe from './components/EarthGlobe';
import { ConjunctionBullseye, ManeuverTimeline, FleetFuelStatus, ActiveCDMs } from './components/DashboardPanels';
import { useSimulation } from './lib/SimulationEngine';
import './App.css';

type Page = 'command' | 'analytics' | 'timeline';

function App() {
  const sim = useSimulation();
  const [page, setPage] = useState<Page>('command');

  const formattedTime = `T+${sim.time.toString().padStart(6, '0')}s`;

  return (
    <div className="app-shell">
      {/* ── Top Bar ── */}
      <div className="top-bar">
        <div className="brand">
          <h1>⯁ Orbital Insight</h1>
          <span className="subtitle">AUTONOMOUS CONSTELLATION MANAGER v1.0</span>
        </div>

        <div className="top-stats">
          <div className="stat-pill">
            <span className="label">EPOCH</span>
            <span className="value">{formattedTime}</span>
          </div>
          <div className="stat-pill">
            <div className={`status-dot ${sim.isRunning ? 'online' : 'offline'}`}></div>
            <span className="value" style={{ color: sim.isRunning ? 'var(--green)' : 'var(--red)' }}>
              {sim.isRunning ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>
          <div className="stat-pill">
            <span className="label">SATS</span>
            <span className="value">{sim.satellites.length}</span>
          </div>
          <div className="stat-pill">
            <span className="label">DEBRIS</span>
            <span className="value">{sim.debris.length}</span>
          </div>
          <div className="stat-pill">
            <span className="label">CDMs</span>
            <span className="value" style={{ color: sim.cdms.length > 0 ? 'var(--orange)' : undefined }}>{sim.cdms.length}</span>
          </div>
        </div>
      </div>

      {/* ── Navigation ── */}
      <div className="nav-tabs">
        <button className={`nav-tab ${page === 'command' ? 'active' : ''}`} onClick={() => setPage('command')}>
          🌐 Command Center
        </button>
        <button className={`nav-tab ${page === 'analytics' ? 'active' : ''}`} onClick={() => setPage('analytics')}>
          📊 Analytics
        </button>
        <button className={`nav-tab ${page === 'timeline' ? 'active' : ''}`} onClick={() => setPage('timeline')}>
          📅 Timeline &amp; CDMs
        </button>
        <div className="nav-spacer" />
      </div>

      {/* ── Page Content ── */}
      <div className="page-content">
        {page === 'command' && <CommandPage sim={sim} />}
        {page === 'analytics' && <AnalyticsPage sim={sim} formattedTime={formattedTime} />}
        {page === 'timeline' && <TimelinePage sim={sim} formattedTime={formattedTime} />}
      </div>

      {/* ── Bottom Control Bar ── */}
      <div className="control-bar">
        <div className="ctrl-group">
          <span className="ctrl-label">Step</span>
          <select
            className="ctrl-select"
            value={sim.stepSizeStr}
            onChange={e => sim.setStepSizeStr(e.target.value as '10min' | '1hr')}
          >
            <option value="10min">10 min</option>
            <option value="1hr">1 hour</option>
          </select>
        </div>

        <div className="ctrl-group">
          <button className="ctrl-btn" onClick={() => sim.advanceStep()}>▶ STEP</button>
          <button
            className={`ctrl-btn ${sim.isRunning ? 'running' : ''}`}
            onClick={() => sim.setIsRunning(!sim.isRunning)}
          >
            {sim.isRunning ? '◼ STOP' : '▶ AUTO'}
          </button>
        </div>

        <div className="ctrl-divider" />

        <div className="ctrl-group">
          <span className="ctrl-label">Speed</span>
          {[1, 2, 5, 10].map(s => (
            <button
              key={s}
              className={`ctrl-btn ${sim.speedMult === s ? 'active' : ''}`}
              onClick={() => sim.setSpeedMult(s)}
            >{s}x</button>
          ))}
        </div>

        <div className="ctrl-spacer" />

        <div className="ctrl-group">
          <button
            className="ctrl-btn danger"
            onClick={async () => {
              await sim.injectThreats();
              // Immediately step so CDMs + timeline populate
              await sim.advanceStep();
            }}
          >
            ⚠ INJECT THREATS
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   PAGE: Command Center (3D Globe + sidebar)
   ═══════════════════════════════════════════════ */
function CommandPage({ sim }: { sim: any }) {
  return (
    <div className="page-globe">
      <div className="globe-main">
        <EarthGlobe sim={sim} />

        {/* Toggle Chips */}
        <div className="globe-overlay-toggles">
          <label className="toggle-chip">
            <input type="checkbox" checked={sim.showDebris} onChange={e => sim.setShowDebris(e.target.checked)} />
            DEBRIS
          </label>
          <label className="toggle-chip">
            <input type="checkbox" checked={sim.showTrails} onChange={e => sim.setShowTrails(e.target.checked)} />
            TRAILS
          </label>
        </div>

        {/* Legend */}
        <div className="globe-overlay-legend">
          <span className="legend-item"><span className="legend-dot" style={{ background: '#00d4ff' }}></span> Satellite</span>
          <span className="legend-item"><span className="legend-dot" style={{ background: '#4466ff' }}></span> Debris</span>
          <span className="legend-item"><span className="legend-dot" style={{ background: '#ff4444' }}></span> Threat</span>
          <span className="legend-item"><span className="legend-dot" style={{ background: '#00ff00' }}></span> Ground Stn</span>
          <span className="legend-item"><span className="legend-dot" style={{ background: '#ffaa00' }}></span> Terminator</span>
        </div>
      </div>

      {/* Sidebar */}
      <div className="globe-sidebar">
        <Panel title="SATELLITE INSPECTOR">
          <SatelliteInspector sat={sim.satellites.find((s: any) => s.id === sim.selectedSatId)} />
          <div style={{ marginTop: '10px' }}>
            <select
              className="ctrl-select"
              style={{ width: '100%' }}
              value={sim.selectedSatId}
              onChange={e => sim.setSelectedSatId(e.target.value)}
            >
              {sim.satellites.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </Panel>
        <Panel title="FLEET FUEL STATUS">
          <FleetFuelStatus satellites={sim.satellites} />
        </Panel>
        <Panel title="CONJUNCTION BULLSEYE">
          <ConjunctionBullseye selectedSatId={sim.selectedSatId} threats={sim.threats} />
        </Panel>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   PAGE: Analytics
   ═══════════════════════════════════════════════ */
function AnalyticsPage({ sim, formattedTime }: { sim: any, formattedTime: string }) {
  return (
    <div className="page-analytics">
      <Panel title="CONJUNCTION BULLSEYE" extra={
        <select
          className="ctrl-select"
          value={sim.selectedSatId}
          onChange={e => sim.setSelectedSatId(e.target.value)}
        >
          {sim.satellites.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      }>
        <ConjunctionBullseye selectedSatId={sim.selectedSatId} threats={sim.threats} />
      </Panel>
      <Panel title="FLEET FUEL STATUS">
        <FleetFuelStatus satellites={sim.satellites} />
      </Panel>
      <Panel title="MANEUVER TIMELINE" extra={<span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{formattedTime}</span>}>
        <ManeuverTimeline time={sim.time} timeline={sim.timeline} />
      </Panel>
      <Panel title="SATELLITE INSPECTOR">
        <SatelliteInspector sat={sim.satellites.find((s: any) => s.id === sim.selectedSatId)} />
        <div style={{ marginTop: '12px' }}>
          <select
            className="ctrl-select"
            style={{ width: '100%' }}
            value={sim.selectedSatId}
            onChange={e => sim.setSelectedSatId(e.target.value)}
          >
            {sim.satellites.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </Panel>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   PAGE: Timeline & CDMs
   ═══════════════════════════════════════════════ */
function TimelinePage({ sim, formattedTime }: { sim: any, formattedTime: string }) {
  return (
    <div className="page-timeline">
      <Panel title="MANEUVER TIMELINE" extra={<span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{formattedTime}</span>}>
        <ManeuverTimeline time={sim.time} timeline={sim.timeline} />
      </Panel>
      <div className="panel-half">
        <Panel title="ACTIVE CONJUNCTION DATA MESSAGES" extra={
          <span style={{ background: sim.cdms.length > 0 ? 'var(--red)' : 'var(--text-muted)', color: '#000', padding: '1px 8px', borderRadius: '10px', fontWeight: 'bold', fontSize: '0.6rem' }}>
            {sim.cdms.length}
          </span>
        }>
          <ActiveCDMs cdms={sim.cdms} />
        </Panel>
        <Panel title="SATELLITE INSPECTOR">
          <SatelliteInspector sat={sim.satellites.find((s: any) => s.id === sim.selectedSatId)} />
          <div style={{ marginTop: '12px' }}>
            <select
              className="ctrl-select"
              style={{ width: '100%' }}
              value={sim.selectedSatId}
              onChange={e => sim.setSelectedSatId(e.target.value)}
            >
              {sim.satellites.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </Panel>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Shared Components
   ═══════════════════════════════════════════════ */
function Panel({ title, extra, children }: { title: string, extra?: React.ReactNode, children: React.ReactNode }) {
  return (
    <div className="panel">
      <div className="panel-header">
        <span>{title}</span>
        {extra}
      </div>
      <div className="panel-body">
        {children}
      </div>
    </div>
  );
}

function SatelliteInspector({ sat }: { sat?: any }) {
  if (!sat) return (
    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textAlign: 'center', padding: '30px 0' }}>
      Select a satellite to inspect
    </div>
  );

  const rows = [
    { label: 'STATUS', value: sat.status || 'NOMINAL', color: 'var(--green)' },
    { label: 'LATITUDE', value: `${sat.pos.lat.toFixed(2)}°`, color: 'var(--cyan)' },
    { label: 'LONGITUDE', value: `${sat.pos.lon.toFixed(2)}°`, color: 'var(--cyan)' },
    { label: 'ALTITUDE', value: `${sat.pos.alt.toFixed(0)} km`, color: 'var(--cyan)' },
    { label: 'FUEL', value: `${sat.fuelKg.toFixed(1)} kg (${Math.round(sat.fuelPercent)}%)`, color: sat.fuelPercent > 50 ? 'var(--green)' : 'var(--orange)' },
    { label: 'DRIFT', value: `${sat.drift.toFixed(3)} km`, color: 'var(--text-primary)' },
  ];

  return (
    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>
      <div style={{ color: 'var(--cyan)', fontWeight: 'bold', fontSize: '0.8rem', marginBottom: '10px', paddingBottom: '6px', borderBottom: '1px solid var(--border-dim)' }}>
        {sat.name}
      </div>
      {rows.map(r => (
        <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
          <span style={{ color: 'var(--text-muted)' }}>{r.label}</span>
          <span style={{ color: r.color }}>{r.value}</span>
        </div>
      ))}
    </div>
  );
}

export default App;
