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
        <p>A real-time <span className="key">Space Situational Awareness</span> system that monitors a constellation of <span className="key">6 LEO satellites</span> orbiting at ~550 km altitude alongside <span className="key">518 tracked debris</span> objects.</p>
        <div className="help-what">YOUR MISSION</div>
        <p>Detect collision threats early and manage autonomous evasion maneuvers using the <span className="crit">COLA Engine</span> (Collision Avoidance). Every decision costs fuel — balance safety with mission longevity.</p>
        <div className="help-what">TECH UNDER THE HOOD</div>
        <p><span className="key">RK4 + J2</span> orbital propagation, real-time CDM generation, WebGL 3D visualization, and a PostgreSQL-backed telemetry logger.</p>
      </>
    ),
  },
  {
    icon: '\u25B6',
    title: 'Step 1 \u2014 Start the Simulation',
    subtitle: 'Activate the live feed and time controls',
    body: (
      <>
        <div className="help-what">WHAT TO DO</div>
        <p>1. Click <span className="key">\u25B6 PLAY</span> — this starts live polling from the backend (refreshes every 500ms)</p>
        <p>2. Click <span className="key">AUTO ON</span> — this auto-advances simulation time continuously</p>
        <p>3. Use <span className="key">STEP +1HR</span> for manual time jumps</p>
        <div className="help-what">WHAT HAPPENS</div>
        <p>Satellites begin orbiting on the <span className="key">3D Globe</span> and <span className="key">Ground Track Map</span>. The <span className="warn">day/night terminator</span> shifts with simulation time. Debris particles scatter across LEO.</p>
        <p>Tip: Change the step dropdown to <span className="key">1 min</span>, <span className="key">10 min</span>, or <span className="key">1 day</span> for different time scales. Use the <span className="key">Speed slider</span> to control auto-step interval.</p>
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
        <p>Click the <span className="crit">SPAWN THREAT</span> button on the left panel.</p>
        <div className="help-what">WHAT HAPPENS</div>
        <p>1. A <span className="warn">5-second countdown</span> begins (simulates threat detection delay)</p>
        <p>2. Debris is injected targeting a <span className="key">random satellite</span> ({'\u03B1'}1\u2013{'\u03B1'}6)</p>
        <p>3. A full-screen <span className="crit">COLLISION WARNING</span> alert appears with the target satellite ID, debris ID, and TCA (Time to Closest Approach)</p>
        <p>4. Click <span className="key">ACKNOWLEDGE</span> to dismiss, or wait 6 seconds</p>
        <p>5. The threat appears as a <span className="crit">red marker</span> on both the 3D Globe and Ground Track map</p>
        <p>The <span className="warn">Bullseye Plot</span> shows the threat's miss distance, and <span className="key">Proximity Ops</span> radar lights up with the approaching object.</p>
      </>
    ),
  },
  {
    icon: '\u2604',
    title: 'Step 3 \u2014 Watch COLA Auto-Dodge',
    subtitle: 'The Collision Avoidance engine fires automatically',
    body: (
      <>
        <div className="help-what">WHAT TO DO</div>
        <p>Keep clicking <span className="key">STEP +1HR</span> or let AUTO mode run. Watch the TCA count down.</p>
        <div className="help-what">WHAT HAPPENS (in order)</div>
        <p>1. When TCA drops below <span className="warn">48 hours</span> \u2192 a <span className="warn">YELLOW CDM</span> (Conjunction Data Message) is created</p>
        <p>2. Evasion + Recovery burns appear on the <span className="key">Maneuver Gantt</span> timeline</p>
        <p>3. When TCA drops below <span className="crit">5 hours</span> \u2192 risk escalates to <span className="crit">RED</span></p>
        <p>4. The <span className="safe">COLA engine fires automatically</span> — burns ~2.5 kg of propellant</p>
        <p>5. The threat is <span className="safe">neutralized</span> and removed. The satellite returns to nominal orbit via a recovery burn.</p>
        <p>Toast notifications appear at the top for each event: threat detected \u2192 CDM generated \u2192 evasion fired \u2192 threat cleared.</p>
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
        <p>Check the <span className="key">FLEET PROPELLANT</span> panel (right side) and the <span className="key">DELTA-V COST ANALYSIS</span> chart below it.</p>
        <div className="help-what">WHAT HAPPENS</div>
        <p>Each satellite starts with <span className="key">50 kg</span> of fuel. Every evasion costs ~2.5 kg.</p>
        <p>Fuel bar colors indicate health:</p>
        <p>\u2022 <span className="safe">Green ({'>'}30 kg)</span> \u2014 Healthy. Full operational capability.</p>
        <p>\u2022 <span className="warn">Yellow (15\u201330 kg)</span> \u2014 Caution. Limited maneuvers remaining.</p>
        <p>\u2022 <span className="crit">Red ({'<'}15 kg)</span> \u2014 Critical. Fuel reserves dangerously low.</p>
        <p>The <span className="key">Delta-V chart</span> plots cumulative fuel consumed vs. collisions avoided over time — this tells you if your fleet is sustainable.</p>
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
        <p>\u2022 <span className="key">3D Globe</span> \u2014 Drag to rotate, scroll to zoom. Watch orbit rings and satellite markers move in real-time.</p>
        <p>\u2022 <span className="key">Ground Track (Mercator)</span> \u2014 NASA Blue Marble map with live <span className="warn">day/night terminator</span> that shifts with sim time.</p>
        <p>\u2022 Click <span className="key">{'\u03B1'}1</span> through <span className="key">{'\u03B1'}6</span> tabs to view individual satellite data.</p>
        <div className="help-what">WHAT CHANGES PER TAB</div>
        <p>\u2022 <span className="key">Bullseye Plot</span> \u2014 Shows miss distance for that satellite's closest conjunction</p>
        <p>\u2022 <span className="key">Proximity Ops</span> \u2014 Radar view of nearby objects relative to the selected satellite</p>
        <p>\u2022 <span className="key">Maneuver Gantt</span> \u2014 Timeline of evasion/recovery burns for that satellite</p>
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
        <p>Click the <span className="key">REPORT</span> button on the left panel.</p>
        <div className="help-what">WHAT YOU SEE</div>
        <p>\u2022 <span className="key">Fleet Status Table</span> \u2014 All 6 satellites with fuel, status, and altitude</p>
        <p>\u2022 <span className="key">Maneuver Log</span> \u2014 History of evasion + recovery burns with timestamps</p>
        <p>\u2022 <span className="key">Active Threats</span> \u2014 Current threats with target, TCA, and risk level (SAFE / WARNING / CRITICAL)</p>
        <p>\u2022 <span className="key">Simulation Summary</span> \u2014 Total elapsed time, evasions count, fuel consumed, fleet health</p>
        <p>Reports update <span className="safe">in real-time</span> as the simulation progresses. Use this for mission review and decision-making.</p>
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
