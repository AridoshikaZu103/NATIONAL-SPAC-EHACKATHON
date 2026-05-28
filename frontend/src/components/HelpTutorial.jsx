import React, { useState, useEffect, useCallback } from 'react';
import './HelpTutorial.css';

// --- Tutorial Steps (7 steps, no emojis) ---
const TUTORIAL_STEPS = [
  {
    icon: '*',
    title: 'Welcome to Orbital Insight',
    subtitle: 'Space Situational Awareness Dashboard',
    body: (
      <>
        <p>This dashboard monitors <span className="key">6 satellites</span> (Walker Delta constellation) orbiting at ~550 km alongside <span className="key">518 tracked debris</span> objects.</p>
        <p>Your mission: <strong>detect collisions early and dodge them automatically</strong> using the onboard COLA (Collision Avoidance) engine.</p>
        <p>The simulation uses <span className="key">RK4 orbital propagation</span> for realistic physics.</p>
      </>
    ),
  },
  {
    icon: '>',
    title: 'Step 1: Start the Simulation',
    subtitle: 'PLAY and AUTO Controls',
    body: (
      <>
        <p>Click <span className="key">PLAY</span> to begin live polling from the backend. Data refreshes every 500ms.</p>
        <p>Click <span className="key">AUTO ON</span> to auto-advance time continuously. Both work independently.</p>
        <p>Use <span className="key">STEP +1HR</span> for manual time jumps. Change step size with the dropdown (1 min to 1 day).</p>
        <p>Adjust the <span className="key">Speed slider</span> to control auto-step interval.</p>
      </>
    ),
  },
  {
    icon: '!',
    title: 'Step 2: Spawn a Threat',
    subtitle: 'Simulating debris on collision course',
    body: (
      <>
        <p>Click <span className="crit">SPAWN THREAT</span> to inject debris targeting a <span className="warn">random satellite</span> (any of the 6).</p>
        <p>A <span className="crit">COLLISION WARNING</span> alert appears at screen center with target ID, TCA, and risk level.</p>
        <p>Click <span className="key">ACKNOWLEDGE</span> to dismiss, or it auto-closes after 6 seconds.</p>
        <p>Watch the <span className="warn">Bullseye Plot</span> and <span className="key">Proximity Ops</span> radar light up.</p>
      </>
    ),
  },
  {
    icon: '#',
    title: 'Step 3: Auto-Dodge (COLA)',
    subtitle: 'Collision Avoidance Engine fires',
    body: (
      <>
        <p>Keep stepping. When TCA drops below <span className="warn">5 hours</span>:</p>
        <p>1. A <span className="warn">CDM</span> (Conjunction Data Message) is generated</p>
        <p>2. Evasion + Recovery burns are scheduled on the <span className="key">Gantt Timeline</span></p>
        <p>3. The <span className="safe">COLA engine fires</span> automatically, consuming ~2.5 kg fuel</p>
        <p>4. The threat is neutralized. Satellite returns to nominal orbit.</p>
      </>
    ),
  },
  {
    icon: '%',
    title: 'Step 4: Monitor Resources',
    subtitle: 'Fleet fuel and delta-V costs',
    body: (
      <>
        <p><span className="key">Fleet Propellant</span> bars show fuel per satellite (50 kg max).</p>
        <p>Colors: <span className="safe">Green</span> = healthy, <span className="warn">Yellow</span> = caution, <span className="crit">Red</span> = critical.</p>
        <p><span className="key">Delta-V Cost Analysis</span> tracks cumulative fuel vs. collisions avoided.</p>
        <p>Each evasion costs ~2.5 kg. Plan wisely to extend mission life.</p>
      </>
    ),
  },
  {
    icon: '@',
    title: 'Step 5: Track & Observe',
    subtitle: '3D Globe, Ground Track, Day/Night',
    body: (
      <>
        <p>The <span className="key">3D Globe</span> shows real Earth with <span className="warn">day/night lighting</span> that rotates with sim time. Drag to rotate, scroll to zoom.</p>
        <p>The <span className="key">Ground Track (Mercator)</span> uses a real NASA Earth image with a <span className="warn">day/night terminator</span> overlay.</p>
        <p>Click <span className="key">{'\u03B1'}1</span> through <span className="key">{'\u03B1'}6</span> tabs to view individual satellite telemetry, bullseye, and proximity data.</p>
      </>
    ),
  },
  {
    icon: '=',
    title: 'Step 6: Reports & Analysis',
    subtitle: 'Mission summary and CDM logs',
    body: (
      <>
        <p>Click <span className="key">REPORT</span> to view a live simulation summary:</p>
        <p>- Fleet fuel status for all 6 satellites</p>
        <p>- CDM log with risk levels and TCA values</p>
        <p>- Maneuver history (evasion + recovery burns)</p>
        <p>- Total fuel consumed and fleet health assessment</p>
        <p>Reports update in real-time as the simulation progresses.</p>
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
