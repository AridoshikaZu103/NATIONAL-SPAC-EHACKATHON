import React, { useState, useEffect, useCallback } from 'react';
import './HelpTutorial.css';

// ─── Tutorial Steps ───
const TUTORIAL_STEPS = [
  {
    icon: '\uD83D\uDE80',
    title: 'Welcome to Orbital Insight',
    subtitle: 'Space Situational Awareness Dashboard',
    body: (
      <>
        <p>This dashboard monitors <span className="key">6 satellites</span> orbiting Earth at ~550 km altitude alongside <span className="key">518 debris</span> objects.</p>
        <p>Your mission: <strong>detect collisions early and dodge them automatically</strong> before they destroy your satellites.</p>
      </>
    ),
  },
  {
    icon: '\u23F1\uFE0F',
    title: 'Step 1: Advance Time',
    subtitle: 'Simulate Forward',
    body: (
      <>
        <p>Click <span className="key">STEP +1HR</span> to advance the simulation by 1 hour. The physics engine propagates all 524 objects through space.</p>
        <p>Use the <span className="key">Step</span> dropdown to change the time jump (1 min to 1 day).</p>
        <p>Enable <span className="key">AUTO ON</span> to auto-advance continuously. Adjust speed with the slider.</p>
      </>
    ),
  },
  {
    icon: '\u26A0\uFE0F',
    title: 'Step 2: Spawn a Threat',
    subtitle: 'Create a collision scenario',
    body: (
      <>
        <p>Click <span className="crit">SPAWN THREAT</span> to inject a debris object on a collision course with alpha-1.</p>
        <p>Watch the <span className="warn">Bullseye Plot</span> and <span className="key">Proximity Ops</span> radar light up with the incoming threat.</p>
        <p>The threat counter in the top bar turns <span className="crit">red</span>.</p>
      </>
    ),
  },
  {
    icon: '\uD83D\uDEE1\uFE0F',
    title: 'Step 3: Auto-Dodge',
    subtitle: 'COLA Engine Fires Automatically',
    body: (
      <>
        <p>Keep stepping forward. When the threat's <span className="warn">Time to Closest Approach (TCA)</span> drops below 5 hours:</p>
        <p>1. A <span className="warn">CDM</span> (Conjunction Data Message) is created</p>
        <p>2. Evasion + Recovery burns are scheduled on the <span className="key">Gantt Timeline</span></p>
        <p>3. When TCA drops below 5 hrs, the <span className="safe">COLA engine fires</span> automatically, consuming 2.5 kg of fuel</p>
        <p>4. The threat disappears. Satellite is safe!</p>
      </>
    ),
  },
  {
    icon: '\uD83D\uDCCA',
    title: 'Step 4: Monitor Resources',
    subtitle: 'Check fuel and costs',
    body: (
      <>
        <p><span className="key">Fleet Propellant</span> bars show remaining fuel per satellite (starts at 50 kg each).</p>
        <p>Color codes: <span className="safe">Green</span> = healthy, <span className="warn">Yellow</span> = caution, <span className="crit">Red</span> = critical.</p>
        <p><span className="key">Delta-V Cost Analysis</span> tracks cumulative fuel spent vs. collisions avoided.</p>
      </>
    ),
  },
  {
    icon: '\uD83D\uDDFA\uFE0F',
    title: 'Step 5: Track Satellites',
    subtitle: 'Ground Track & Telemetry',
    body: (
      <>
        <p>The <span className="key">Ground Track (Mercator)</span> map shows satellite positions on a 2D map with live CSS transitions.</p>
        <p>Click <span className="key">{'\u03B1'}1</span> through <span className="key">{'\u03B1'}6</span> tabs in the telemetry panel to view individual satellite data.</p>
        <p>The <span className="key">3D Globe</span> shows the full orbital picture. Drag to rotate, scroll to zoom.</p>
      </>
    ),
  },
  {
    icon: '\uD83D\uDCC4',
    title: 'Reports',
    subtitle: 'View simulation summary',
    body: (
      <>
        <p>Click the <span className="key">REPORT</span> button in the header to see a live summary:</p>
        <p>- Fleet fuel status for all 6 satellites</p>
        <p>- CDM log with risk levels and TCA</p>
        <p>- Maneuver history (evasion + recovery burns)</p>
        <p>The report updates in real-time as you simulate.</p>
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
  const icons = { info: '\u2139\uFE0F', success: '\u2705', warning: '\u26A0\uFE0F', danger: '\uD83D\uDEA8' };
  return { id: ++toastId, type, title, message, icon: icons[type] || '\u2139\uFE0F', time: Date.now() };
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
