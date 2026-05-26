'use client';

import { useEffect, useRef, useState } from 'react';

const missions = [
  { icon: '🛰️', title: 'Chandrayaan-3', subtitle: 'Lunar Exploration', description: 'Historic soft landing on the lunar south pole, making India the 4th country to land on the Moon.', stats: 'Launched: July 2023', color: '#7b2ff7' },
  { icon: '☀️', title: 'Aditya-L1', subtitle: 'Solar Observatory', description: "India's first space-based solar observatory studying the Sun's corona from the L1 Lagrange point.", stats: 'Launched: Sept 2023', color: '#ffd700' },
  { icon: '🔴', title: 'Mangalyaan-2', subtitle: 'Mars Orbiter', description: 'Next-gen Mars orbiter for atmospheric studies, surface mapping, and searching for past water.', stats: 'Upcoming Mission', color: '#ff6b6b' },
  { icon: '🌍', title: 'Gaganyaan', subtitle: 'Human Spaceflight', description: "India's first crewed orbital spaceflight to send 3 astronauts to low Earth orbit.", stats: 'In Development', color: '#00d4ff' },
  { icon: '🔭', title: 'XPoSat', subtitle: 'X-ray Polarimetry', description: 'Studying cosmic X-ray sources, black holes, and neutron stars with unprecedented precision.', stats: 'Launched: Jan 2024', color: '#c471f5' },
  { icon: '🌙', title: 'LUPEX', subtitle: 'Lunar Polar Exploration', description: 'Joint ISRO-JAXA mission to explore the lunar south pole and investigate water ice.', stats: 'Planned: 2026', color: '#12d8fa' },
];

export default function MissionCards() {
  const [visibleCards, setVisibleCards] = useState(new Set());
  const cardsRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const idx = Number(entry.target.getAttribute('data-index'));
          if (entry.isIntersecting) {
            setVisibleCards((prev) => new Set(prev).add(idx));
          }
        });
      },
      { threshold: 0.15 }
    );
    const cards = cardsRef.current?.querySelectorAll('.mission-card');
    cards?.forEach((c) => observer.observe(c));
    return () => observer.disconnect();
  }, []);

  return (
    <section className="missions section-spacing" id="missions">
      <div className="section-container">
        <div className="section-header">
          <span className="section-label">🛰️ Active Programs</span>
          <h2>Space <span className="gradient-text">Missions</span></h2>
          <p>Groundbreaking missions pushing the boundaries of human knowledge and space exploration.</p>
        </div>
        <div className="missions__grid" ref={cardsRef}>
          {missions.map((m, i) => (
            <div key={m.title} className={`mission-card glass-card ${visibleCards.has(i) ? 'mission-card--visible' : ''}`} data-index={i} style={{ transitionDelay: `${i * 100}ms` }} id={`mission-card-${i}`}>
              <div className="mission-card__icon">{m.icon}</div>
              <span className="mission-card__subtitle" style={{ color: m.color }}>{m.subtitle}</span>
              <h3 className="mission-card__title">{m.title}</h3>
              <p className="mission-card__desc">{m.description}</p>
              <div className="mission-card__footer">
                <span className="mission-card__stats">{m.stats}</span>
                <span className="mission-card__dot" style={{ background: m.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <style jsx>{`
        .missions__grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 1.5rem; }
        .mission-card { position: relative; padding: 2rem; overflow: hidden; opacity: 0; transform: translateY(40px); transition: opacity 0.6s ease, transform 0.6s ease, background var(--transition-base), border-color var(--transition-base), box-shadow var(--transition-base); }
        .mission-card--visible { opacity: 1; transform: translateY(0); }
        .mission-card__icon { font-size: 2.5rem; margin-bottom: 1rem; }
        .mission-card__subtitle { font-family: var(--font-mono); font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; }
        .mission-card__title { font-size: 1.4rem; margin: 0.3rem 0 0.8rem; color: var(--color-text-primary); }
        .mission-card__desc { font-size: 0.9rem; line-height: 1.6; margin-bottom: 1.2rem; }
        .mission-card__footer { display: flex; align-items: center; justify-content: space-between; }
        .mission-card__stats { font-family: var(--font-mono); font-size: 0.75rem; color: var(--color-text-muted); }
        .mission-card__dot { width: 8px; height: 8px; border-radius: 50%; animation: pulse 2s ease-in-out infinite; }
        @media (max-width: 768px) { .missions__grid { grid-template-columns: 1fr; } }
      `}</style>
    </section>
  );
}
