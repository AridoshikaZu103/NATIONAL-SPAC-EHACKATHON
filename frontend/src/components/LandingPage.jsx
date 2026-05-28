import React, { useMemo } from 'react';
import './LandingPage.css';

export default function LandingPage({ onStart }) {
  const stars = useMemo(() => {
    return Array.from({ length: 100 }, (_, i) => ({
      id: i,
      left: Math.random() * 100 + '%',
      top: Math.random() * 100 + '%',
      size: 1 + Math.random() * 2,
      delay: Math.random() * 3 + 's',
      duration: 2 + Math.random() * 3 + 's',
    }));
  }, []);

  return (
    <div className="landing-page">
      {/* Star field */}
      <div className="star-field">
        {stars.map(s => (
          <div key={s.id} className="star" style={{
            left: s.left, top: s.top,
            width: s.size + 'px', height: s.size + 'px',
            animationDelay: s.delay, animationDuration: s.duration,
          }} />
        ))}
      </div>

      {/* Orbital rings */}
      <div className="orbit-ring orbit-ring-1"><div className="orbit-dot" /></div>
      <div className="orbit-ring orbit-ring-2"><div className="orbit-dot dot-green" /></div>
      <div className="orbit-ring orbit-ring-3"><div className="orbit-dot dot-amber" /></div>

      {/* Center content */}
      <div className="landing-content">
        {/* Pure CSS Satellite icon - no emoji */}
        <div className="css-satellite">
          <div className="sat-body">
            <div className="sat-panel-left" />
            <div className="sat-core">
              <div className="sat-antenna" />
              <div className="sat-dish" />
            </div>
            <div className="sat-panel-right" />
          </div>
          <div className="sat-signal sat-signal-1" />
          <div className="sat-signal sat-signal-2" />
        </div>

        <h1 className="landing-title">ORBITAL INSIGHT</h1>
        <p className="landing-subtitle-main">Space Situational Awareness System</p>
        <p className="landing-desc">Autonomous constellation management with real-time debris tracking, collision avoidance, and orbital mechanics simulation</p>

        <div className="landing-stats">
          <div className="landing-stat">
            <span className="landing-stat-value">6</span>
            <span className="landing-stat-label">Satellites</span>
          </div>
          <div className="landing-stat">
            <span className="landing-stat-value">518</span>
            <span className="landing-stat-label">Debris</span>
          </div>
          <div className="landing-stat">
            <span className="landing-stat-value">6</span>
            <span className="landing-stat-label">Ground Stations</span>
          </div>
          <div className="landing-stat">
            <span className="landing-stat-value">RK4</span>
            <span className="landing-stat-label">Propagator</span>
          </div>
        </div>

        <button className="start-btn" onClick={onStart}>
          <span className="start-btn-text">LAUNCH MISSION</span>
          <span className="start-btn-arrow">&rarr;</span>
        </button>

        <div className="landing-features">
          <span>3D WebGL Globe</span>
          <span className="feat-dot"></span>
          <span>COLA Engine</span>
          <span className="feat-dot"></span>
          <span>Live Telemetry</span>
        </div>
      </div>

      <span className="landing-version">v1.0 | National Space Hackathon 2026</span>
    </div>
  );
}
