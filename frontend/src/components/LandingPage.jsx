import React, { useMemo } from 'react';
import './LandingPage.css';

export default function LandingPage({ onStart }) {
  // Generate random stars
  const stars = useMemo(() => {
    return Array.from({ length: 80 }, (_, i) => ({
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
            left: s.left,
            top: s.top,
            width: s.size + 'px',
            height: s.size + 'px',
            animationDelay: s.delay,
            animationDuration: s.duration,
          }} />
        ))}
      </div>

      {/* Orbital rings */}
      <div className="orbit-ring orbit-ring-1">
        <div className="orbit-dot" />
      </div>
      <div className="orbit-ring orbit-ring-2">
        <div className="orbit-dot" style={{ background: '#00ff88', boxShadow: '0 0 10px #00ff88' }} />
      </div>
      <div className="orbit-ring orbit-ring-3">
        <div className="orbit-dot" style={{ background: '#ffaa00', boxShadow: '0 0 10px #ffaa00' }} />
      </div>

      {/* Center content */}
      <div className="landing-content">
        <div className="landing-icon">{'\uD83D\uDE80'}</div>
        <h1 className="landing-title">ORBITAL INSIGHT SSA</h1>
        <p className="landing-subtitle">Autonomous Constellation Management System</p>

        <div className="landing-stats">
          <div className="landing-stat">
            <span className="landing-stat-value">6</span>
            <span className="landing-stat-label">Satellites</span>
          </div>
          <div className="landing-stat">
            <span className="landing-stat-value">518</span>
            <span className="landing-stat-label">Debris Tracked</span>
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
          START MISSION
        </button>
      </div>

      <span className="landing-version">v1.0 | National Space Hackathon 2026</span>
    </div>
  );
}
