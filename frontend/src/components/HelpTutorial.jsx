import React, { useState, useEffect, useCallback } from 'react';
import './HelpTutorial.css';

// --- Tutorial Steps (7 steps) ---
const TUTORIAL_STEPS = [
  {
    icon: '\u2726',
    title: 'Welcome to Orbital Insight SSA',
    subtitle: 'Space Situational Awareness Dashboard',
    body: (
      <>
        <div className="help-what">WHAT IS THIS?</div>
        <p>A real-time <span className="key">Space Situational Awareness</span> system monitoring a constellation of <span className="key">6 LEO satellites</span> (Walker Delta, ~550 km altitude) alongside <span className="key">518 tracked debris</span> objects.</p>
        <div className="help-what">YOUR MISSION</div>
        <p>Detect collision threats early and manage autonomous evasion maneuvers using the <span className="crit">COLA Engine</span> (Collision Avoidance). Every dodge costs <span className="warn">~2.5 kg fuel</span> — balance safety with mission longevity.</p>
        <div className="help-what">TECH UNDER THE HOOD</div>
        <p><span className="key">RK4 + J2</span> orbital propagation, real-time CDM generation, WebGL 3D Globe, NASA Blue Marble Ground Track, and PostgreSQL telemetry logging.</p>
      </>
    ),
  },
  {
    icon: '\u25B6',
    title: 'Step 1 \u2014 Start the Simulation',
    subtitle: 'Activate live feed and time controls',
    body: (
      <>
        <div className="help-what">WHAT TO DO</div>
        <p>1. Click <span className="key">{'\u25B6'} PLAY</span> to start live polling (data refreshes every 500ms)</p>
        <p>2. Click <span className="key">AUTO ON</span> to auto-advance simulation time</p>
        <p>3. Or click <span className="key">STEP</span> for manual time jumps</p>
        <div className="help-what">SPEED PRESETS</div>
        <p>Use the speed buttons in the control bar:</p>
        <p>{'\u2022'} <span className="key">1x</span> = 1 min/tick {'\u2022'} <span className="key">5x</span> = 5 min {'\u2022'} <span className="key">10x</span> = 10 min</p>
        <p>{'\u2022'} <span className="key">50x</span> = 1 hour/tick {'\u2022'} <span className="key">100x</span> = 2 hours {'\u2022'} <span className="key">MAX</span> = 1 day</p>
        <div className="help-what">WHAT HAPPENS</div>
        <p>Satellites begin orbiting on the <span className="key">3D Globe</span> and <span className="key">Ground Track</span>. The <span className="warn">day/night terminator</span> shifts with simulation time.</p>
      </>
    ),
  },
  {
    icon: '\u26A0',
    title: 'Step 2 \u2014 Spawn a Threat',
    subtitle: 'Inject debris on a collision course',
    body: (
      <>
        <div className="help-what">WHAT TO DO</div>
        <p>Click <span className="crit">SPAWN THREAT</span> in the header bar.</p>
        <div className="help-what">WHAT HAPPENS</div>
        <p>1. A <span className="warn">5-second countdown</span> begins (simulates detection delay)</p>
        <p>2. Debris is injected targeting a <span className="key">random satellite</span> ({'\u03B1'}1{'\u2013'}{'\u03B1'}6)</p>
        <p>3. TCA (Time to Closest Approach) is set to <span className="warn">24{'\u2013'}48 hours</span></p>
        <p>4. A full-screen <span className="crit">COLLISION WARNING</span> alert appears with target ID, debris ID, and TCA</p>
        <p>5. Click <span className="key">ACKNOWLEDGE</span> to dismiss (auto-closes after 6s)</p>
        <p>6. Threat appears as a <span className="crit">red marker</span> on the 3D Globe and Ground Track</p>
        <p>The <span className="warn">Bullseye Plot</span> and <span className="key">Proximity Ops</span> radar update with the approaching object.</p>
      </>
    ),
  },
  {
    icon: '\u2604',
    title: 'Step 3 \u2014 Watch COLA Auto-Dodge',
    subtitle: 'Collision Avoidance engine fires automatically',
    body: (
      <>
        <div className="help-what">WHAT TO DO</div>
        <p>Set speed to <span className="key">50x</span> or <span className="key">100x</span> and enable <span className="key">AUTO ON</span>. Or keep clicking <span className="key">STEP</span> manually. Watch the TCA count down.</p>
        <div className="help-what">WHAT HAPPENS (in order)</div>
        <p>1. <span className="warn">TCA {'<'} 48h</span> {'\u2192'} <span className="warn">YELLOW CDM</span> (Conjunction Data Message) is generated</p>
        <p>2. Evasion + Recovery burns appear on the <span className="key">Maneuver Gantt</span> timeline</p>
        <p>3. <span className="crit">TCA {'<'} 5h</span> {'\u2192'} risk escalates to <span className="crit">RED</span></p>
        <p>4. <span className="safe">COLA engine fires</span> automatically — burns ~2.5 kg propellant</p>
        <p>5. Threat is <span className="safe">neutralized</span> and removed. Satellite returns to nominal via recovery burn.</p>
        <p>Toast notifications appear for each event: threat {'\u2192'} CDM {'\u2192'} evasion {'\u2192'} cleared.</p>
      </>
    ),
  },
  {
    icon: '\u2693',
    title: 'Step 4 \u2014 Monitor Fleet Resources',
    subtitle: 'Track fuel consumption and mission health',
    body: (
      <>
        <div className="help-what">WHAT TO DO</div>
        <p>Check the <span className="key">FLEET PROPELLANT</span> panel (right side) and <span className="key">DELTA-V COST ANALYSIS</span> chart.</p>
        <div className="help-what">WHAT HAPPENS</div>
        <p>Each satellite starts with <span className="key">50 kg</span> fuel. Every evasion costs ~2.5 kg.</p>
        <p>Fuel bar colors indicate health:</p>
        <p>{'\u2022'} <span className="safe">Green ({'>'}30 kg)</span> {'\u2014'} Healthy. Full capability.</p>
        <p>{'\u2022'} <span className="warn">Yellow (15{'\u2013'}30 kg)</span> {'\u2014'} Caution. Limited maneuvers.</p>
        <p>{'\u2022'} <span className="crit">Red ({'<'}15 kg)</span> {'\u2014'} Critical. Dangerously low.</p>
        <p>The <span className="key">Delta-V chart</span> plots cumulative fuel consumed vs. collisions avoided — shows if your fleet is sustainable.</p>
      </>
    ),
  },
  {
    icon: '\u2295',
    title: 'Step 5 \u2014 Explore Visualizations',
    subtitle: '3D Globe, Ground Track, Satellite Tabs',
    body: (
      <>
        <div className="help-what">WHAT TO DO</div>
        <p>Interact with the visualization panels:</p>
        <p>{'\u2022'} <span className="key">3D Globe</span> {'\u2014'} Drag to rotate, scroll to zoom. Watch orbit rings and satellite markers move.</p>
        <p>{'\u2022'} <span className="key">Ground Track (Mercator)</span> {'\u2014'} NASA Blue Marble map with live <span className="warn">day/night terminator</span>.</p>
        <p>{'\u2022'} Click <span className="key">{'\u03B1'}1</span> through <span className="key">{'\u03B1'}6</span> tabs to view individual satellite data.</p>
        <div className="help-what">WHAT CHANGES PER TAB</div>
        <p>{'\u2022'} <span className="key">Bullseye Plot</span> {'\u2014'} Miss distance for that satellite{"'"}s closest conjunction</p>
        <p>{'\u2022'} <span className="key">Proximity Ops</span> {'\u2014'} Radar view of nearby objects</p>
        <p>{'\u2022'} <span className="key">Maneuver Gantt</span> {'\u2014'} Evasion/recovery burn timeline for that satellite</p>
      </>
    ),
  },
  {
    icon: '\u2263',
    title: 'Step 6 \u2014 Generate Reports',
    subtitle: 'Mission summary with live data',
    body: (
      <>
        <div className="help-what">WHAT TO DO</div>
        <p>Click the <span className="key">REPORT</span> button in the header bar.</p>
        <div className="help-what">WHAT YOU SEE</div>
        <p>{'\u2022'} <span className="key">Fleet Status</span> {'\u2014'} All 6 satellites with fuel, status, altitude</p>
        <p>{'\u2022'} <span className="key">Maneuver Log</span> {'\u2014'} History of evasion + recovery burns with timestamps</p>
        <p>{'\u2022'} <span className="key">Active Threats</span> {'\u2014'} Current threats with TCA and risk level</p>
        <p>{'\u2022'} <span className="key">Summary</span> {'\u2014'} Elapsed time, total evasions, fuel consumed, fleet health</p>
        <p>Reports update <span className="safe">in real-time</span> as simulation progresses.</p>
      </>
    ),
  },
];

// ─── Help Tutorial Modal ───
export function HelpTutorial({ isOpen, onClose }) {
  const [step, setStep] = useState(0);

  if (!isOpen) return null;

  const s = TUTORIAL_STEPS[step];
  const isLast = step === TUTORIAL_STEPS.length - 1;

  return (
    <div className="help-overlay" onClick={onClose}>
      <div className="help-modal" onClick={(e) => e.stopPropagation()}>
        <button className="help-close" onClick={onClose}>X</button>

        <div className="help-step-indicator">
          {TUTORIAL_STEPS.map((_, i) => (
            <div key={i} className={'help-dot' + (i === step ? ' active' : i < step ? ' done' : '')} />
          ))}
        </div>

        <div className="help-icon">{s.icon}</div>
        <h2 className="help-title">{s.title}</h2>
        <p className="help-subtitle">{s.subtitle}</p>
        <div className="help-body">{s.body}</div>

        <div className="help-nav">
          <button className="help-btn" onClick={() => setStep(step - 1)} disabled={step === 0}>BACK</button>
          <span className="help-page-num">{step + 1} / {TUTORIAL_STEPS.length}</span>
          {isLast ? (
            <button className="help-btn primary" onClick={onClose}>DONE</button>
          ) : (
            <button className="help-btn primary" onClick={() => setStep(step + 1)}>NEXT</button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Toast Notification System ───
let toastId = 0;

export function ToastContainer({ toasts, onDismiss }) {
  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={'toast toast-' + t.type} onClick={() => onDismiss(t.id)}>
          <span className="toast-icon">{t.icon}</span>
          <div className="toast-content">
            <div className="toast-title">{t.title}</div>
            <div className="toast-msg">{t.message}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function createToast(type, title, message) {
  const icons = { info: 'i', success: '\u2713', warning: '!', danger: '\u2716' };
  return { id: ++toastId, type, title, message, icon: icons[type] || 'i', time: Date.now() };
}

// --- Threat Alert (center screen) ---
export function ThreatAlert({ threat, onDismiss }) {
  if (!threat) return null;

  return (
    <div className="threat-alert-overlay" onClick={onDismiss}>
      <div className="threat-alert-box" onClick={(e) => e.stopPropagation()}>
        <div className="threat-alert-pulse" />
        <div className="threat-alert-icon">!</div>
        <h2 className="threat-alert-title">COLLISION WARNING</h2>
        <p className="threat-alert-target">Target: <span>{threat.targetSatId}</span></p>
        <p className="threat-alert-id">Debris: {threat.id}</p>
        <p className="threat-alert-tca">TCA: <span>{Math.round(threat.timeToCollision)}s</span></p>
        <div className="threat-alert-bar">
          <div className="threat-alert-bar-fill" />
        </div>
        <p className="threat-alert-msg">COLA engine will auto-fire when TCA drops below 5 hours</p>
        <button className="help-btn primary" onClick={onDismiss}>ACKNOWLEDGE</button>
      </div>
    </div>
  );
}

// ─── Report Modal ───
export function ReportModal({ isOpen, onClose, satellites, timeline, threats, simTime }) {
  if (!isOpen) return null;

  const formatTime = (s) => Math.floor(s / 3600) + 'h ' + Math.floor((s % 3600) / 60) + 'm';
  const evasions = timeline.filter(e => e.type === 'EVASION');
  const recoveries = timeline.filter(e => e.type === 'RECOVERY');

  return (
    <div className="report-overlay" onClick={onClose}>
      <div className="report-modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="report-title">Simulation Report</h2>

        <div className="report-section">
          <h4>Fleet Status</h4>
          <table className="report-table">
            <thead><tr><th>Satellite</th><th>Fuel (kg)</th><th>Status</th><th>Alt (km)</th></tr></thead>
            <tbody>
              {satellites.map((s, i) => (
                <tr key={i}>
                  <td>{'\u03B1'}{i + 1} ({s.name || s.id})</td>
                  <td style={{ color: s.fuel_kg > 30 ? '#00ff88' : s.fuel_kg > 15 ? '#ffaa00' : '#ff3366' }}>{(s.fuel_kg || 50).toFixed(1)}</td>
                  <td style={{ color: '#00ff88' }}>{s.status || 'NOMINAL'}</td>
                  <td>{(s.alt || 550).toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="report-section">
          <h4>Maneuver Log ({evasions.length} evasions, {recoveries.length} recoveries)</h4>
          {evasions.length > 0 ? (
            <table className="report-table">
              <thead><tr><th>ID</th><th>Satellite</th><th>Start</th><th>Type</th></tr></thead>
              <tbody>
                {timeline.slice(-10).map((e, i) => (
                  <tr key={i}>
                    <td>{e.id}</td>
                    <td>{e.satId}</td>
                    <td>{formatTime(e.timeStart)}</td>
                    <td style={{ color: e.type === 'EVASION' ? '#ff3366' : '#00e5ff' }}>{e.type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ color: '#555', fontSize: '0.75rem', fontFamily: 'monospace' }}>No maneuvers executed yet. Spawn a threat and step forward.</p>
          )}
        </div>

        <div className="report-section">
          <h4>Active Threats: {threats.length}</h4>
          {threats.length > 0 ? (
            <table className="report-table">
              <thead><tr><th>ID</th><th>Target</th><th>TCA (s)</th><th>Risk</th></tr></thead>
              <tbody>
                {threats.map((t, i) => {
                  const tca = Math.round(t.timeToCollision);
                  const risk = tca < 1000 ? 'CRITICAL' : tca < 5000 ? 'WARNING' : 'SAFE';
                  const color = tca < 1000 ? '#ff3366' : tca < 5000 ? '#ffaa00' : '#00ff88';
                  return (
                    <tr key={i}>
                      <td>{t.id}</td>
                      <td>{t.targetSatId}</td>
                      <td>{tca}</td>
                      <td style={{ color }}>{risk}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <p style={{ color: '#00ff88', fontSize: '0.75rem', fontFamily: 'monospace' }}>No active threats. All clear.</p>
          )}
        </div>

        <div className="report-section">
          <h4>Simulation Summary</h4>
          <table className="report-table">
            <tbody>
              <tr><td>Elapsed Time</td><td>{formatTime(simTime)}</td></tr>
              <tr><td>Total Evasions</td><td>{evasions.length}</td></tr>
              <tr><td>Total Fuel Consumed</td><td>{satellites.reduce((a, s) => a + (50 - (s.fuel_kg || 50)), 0).toFixed(1)} kg</td></tr>
              <tr><td>Fleet Health</td><td style={{ color: '#00ff88' }}>NOMINAL</td></tr>
            </tbody>
          </table>
        </div>

        <div className="report-footer">
          <button className="help-btn primary" onClick={onClose}>CLOSE</button>
        </div>
      </div>
    </div>
  );
}
