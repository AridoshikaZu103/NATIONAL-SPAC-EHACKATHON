'use client';

import { useState, useEffect } from 'react';

export default function LoadingScreen() {
  const [progress, setProgress] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(() => setLoaded(true), 400);
          return 100;
        }
        return prev + Math.random() * 8 + 2;
      });
    }, 60);
    return () => clearInterval(timer);
  }, []);

  if (loaded) return null;

  return (
    <div className={`loading ${progress >= 100 ? 'loading--done' : ''}`} id="loading-screen">
      <div className="loading__content">
        <div className="loading__icon">🚀</div>
        <h2 className="loading__title">SPACE<span className="gradient-text">HUB</span></h2>
        <div className="loading__bar-track">
          <div className="loading__bar-fill" style={{ width: `${Math.min(progress, 100)}%` }} />
        </div>
        <p className="loading__text">
          {progress < 30 ? 'Initializing systems...' : progress < 60 ? 'Loading star charts...' : progress < 90 ? 'Calibrating sensors...' : 'Launch ready!'}
        </p>
        <span className="loading__percent">{Math.floor(Math.min(progress, 100))}%</span>
      </div>
      <style jsx>{`
        .loading { position: fixed; inset: 0; z-index: var(--z-loading); background: var(--color-bg-primary); display: flex; align-items: center; justify-content: center; transition: opacity 0.6s ease; }
        .loading--done { opacity: 0; pointer-events: none; }
        .loading__content { text-align: center; }
        .loading__icon { font-size: 3rem; margin-bottom: 1rem; animation: float 2s ease-in-out infinite; }
        .loading__title { font-family: var(--font-heading); font-size: 2rem; font-weight: 800; letter-spacing: 0.05em; margin-bottom: 2rem; color: var(--color-text-primary); }
        .loading__bar-track { width: 280px; height: 3px; background: rgba(255,255,255,0.08); border-radius: 9999px; overflow: hidden; margin: 0 auto 1rem; }
        .loading__bar-fill { height: 100%; background: var(--gradient-primary); border-radius: 9999px; transition: width 0.1s ease; }
        .loading__text { font-family: var(--font-mono); font-size: 0.75rem; color: var(--color-text-muted); letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 0.5rem; }
        .loading__percent { font-family: var(--font-mono); font-size: 0.85rem; color: var(--color-accent-secondary); font-weight: 700; }
      `}</style>
    </div>
  );
}
