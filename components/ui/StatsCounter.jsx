'use client';

import { useEffect, useRef, useState } from 'react';

const stats = [
  { label: 'Missions Launched', value: 127, suffix: '+', icon: '🚀' },
  { label: 'Satellites in Orbit', value: 425, suffix: '+', icon: '🛰️' },
  { label: 'Astronauts Trained', value: 580, suffix: '+', icon: '👨‍🚀' },
  { label: 'Countries Participating', value: 72, suffix: '', icon: '🌍' },
];

function useCountUp(end, duration, trigger) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!trigger) return;
    let start = 0;
    const step = end / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [end, duration, trigger]);
  return count;
}

function StatItem({ stat, visible }) {
  const count = useCountUp(stat.value, 2000, visible);
  return (
    <div className={`stat-item ${visible ? 'stat-item--visible' : ''}`}>
      <div className="stat-item__icon">{stat.icon}</div>
      <div className="stat-item__value">
        {count.toLocaleString()}{stat.suffix}
      </div>
      <div className="stat-item__label">{stat.label}</div>
      <style jsx>{`
        .stat-item { text-align: center; opacity: 0; transform: translateY(30px); transition: all 0.6s ease; }
        .stat-item--visible { opacity: 1; transform: translateY(0); }
        .stat-item__icon { font-size: 2.5rem; margin-bottom: 0.8rem; }
        .stat-item__value { font-family: var(--font-heading); font-size: clamp(2rem, 5vw, 3.5rem); font-weight: 900; background: var(--gradient-primary); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .stat-item__label { font-family: var(--font-mono); font-size: 0.75rem; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.12em; margin-top: 0.4rem; }
      `}</style>
    </div>
  );
}

export default function StatsCounter() {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="stats-section section-spacing" id="stats" ref={ref}>
      <div className="section-container">
        <div className="section-header">
          <span className="section-label">📊 By the Numbers</span>
          <h2>Global Space <span className="gradient-text">Impact</span></h2>
          <p>The scale of humanity&apos;s spacefaring achievements continues to grow.</p>
        </div>
        <div className="stats-grid">
          {stats.map((s) => (
            <StatItem key={s.label} stat={s} visible={visible} />
          ))}
        </div>
      </div>
      <style jsx>{`
        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 2rem; }
        @media (max-width: 768px) { .stats-grid { grid-template-columns: repeat(2, 1fr); gap: 2rem 1rem; } }
      `}</style>
    </section>
  );
}
