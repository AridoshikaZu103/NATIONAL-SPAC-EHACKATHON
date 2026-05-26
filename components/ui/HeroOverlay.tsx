'use client';

import { useState, useEffect } from 'react';

export default function HeroOverlay() {
  const [displayText, setDisplayText] = useState('');
  const fullText = 'Discover the infinite possibilities beyond our atmosphere';

  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      if (i <= fullText.length) {
        setDisplayText(fullText.slice(0, i));
        i++;
      } else {
        clearInterval(timer);
      }
    }, 40);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="hero" id="hero">
      <div className="hero__content">
        <div className="hero__badge">
          <span className="hero__badge-dot" />
          National Space Hackathon 2026
        </div>

        <h1 className="hero__title">
          EXPLORE THE
          <br />
          <span className="gradient-text">COSMOS</span>
        </h1>

        <p className="hero__subtitle">
          {displayText}
          <span className="hero__cursor">|</span>
        </p>

        <div className="hero__actions">
          <a href="#missions" className="btn-primary">
            <span>🛸</span> Start Exploring
          </a>
          <a href="#timeline" className="btn-secondary">
            <span>📡</span> View Timeline
          </a>
        </div>

        <div className="hero__stats-row">
          <div className="hero__mini-stat">
            <span className="hero__mini-stat-num">50+</span>
            <span className="hero__mini-stat-label">Missions</span>
          </div>
          <div className="hero__mini-stat-divider" />
          <div className="hero__mini-stat">
            <span className="hero__mini-stat-num">120+</span>
            <span className="hero__mini-stat-label">Satellites</span>
          </div>
          <div className="hero__mini-stat-divider" />
          <div className="hero__mini-stat">
            <span className="hero__mini-stat-num">15+</span>
            <span className="hero__mini-stat-label">Countries</span>
          </div>
        </div>
      </div>

      <div className="hero__scroll-indicator">
        <span>Scroll to explore</span>
        <div className="hero__scroll-arrow">↓</div>
      </div>

      <div className="hero__gradient-overlay" />

      <style jsx>{`
        .hero {
          position: relative;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: var(--z-overlay);
          pointer-events: none;
        }

        .hero__content {
          text-align: center;
          padding: 0 2rem;
          max-width: 900px;
          animation: fadeInUp 1s ease 0.3s both;
          pointer-events: auto;
        }

        .hero__badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          font-family: var(--font-mono);
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--color-accent-secondary);
          background: rgba(0, 212, 255, 0.06);
          border: 1px solid rgba(0, 212, 255, 0.2);
          padding: 0.4rem 1.2rem;
          border-radius: 9999px;
          margin-bottom: 2rem;
        }

        .hero__badge-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #00ff88;
          animation: pulse 2s ease-in-out infinite;
        }

        .hero__title {
          font-size: clamp(3rem, 8vw, 6.5rem);
          font-weight: 900;
          line-height: 1.05;
          letter-spacing: -0.03em;
          margin-bottom: 1.5rem;
          text-shadow: 0 0 80px rgba(123, 47, 247, 0.3);
        }

        .hero__subtitle {
          font-size: clamp(1rem, 2vw, 1.25rem);
          color: var(--color-text-secondary);
          max-width: 550px;
          margin: 0 auto 2.5rem;
          min-height: 2em;
        }

        .hero__cursor {
          color: var(--color-accent-secondary);
          animation: blink 1s step-end infinite;
          font-weight: 300;
        }

        .hero__actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
          margin-bottom: 3rem;
        }

        .hero__stats-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 2rem;
          animation: fadeInUp 1s ease 0.8s both;
        }

        .hero__mini-stat {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.2rem;
        }

        .hero__mini-stat-num {
          font-family: var(--font-heading);
          font-weight: 800;
          font-size: 1.5rem;
          color: var(--color-text-primary);
        }

        .hero__mini-stat-label {
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: var(--color-text-muted);
          font-family: var(--font-mono);
        }

        .hero__mini-stat-divider {
          width: 1px;
          height: 30px;
          background: var(--color-border);
        }

        .hero__scroll-indicator {
          position: absolute;
          bottom: 2rem;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          color: var(--color-text-muted);
          font-size: 0.7rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          font-family: var(--font-mono);
          pointer-events: auto;
          animation: fadeIn 1s ease 1.5s both;
        }

        .hero__scroll-arrow {
          font-size: 1.2rem;
          animation: scrollDown 2s ease infinite;
        }

        .hero__gradient-overlay {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 200px;
          background: linear-gradient(transparent, var(--color-bg-primary));
          pointer-events: none;
        }

        @media (max-width: 768px) {
          .hero__title {
            font-size: clamp(2.5rem, 10vw, 4rem);
          }

          .hero__stats-row {
            gap: 1rem;
          }

          .hero__mini-stat-num {
            font-size: 1.2rem;
          }
        }
      `}</style>
    </section>
  );
}
