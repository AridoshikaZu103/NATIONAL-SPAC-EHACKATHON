'use client';

import { useEffect, useRef, useState } from 'react';

const milestones = [
  { year: '1957', title: 'Sputnik 1', desc: 'First artificial satellite launched by the Soviet Union, marking the dawn of the Space Age.', icon: '🛰️' },
  { year: '1961', title: 'First Human in Space', desc: 'Yuri Gagarin orbits Earth aboard Vostok 1, becoming the first human in space.', icon: '👨‍🚀' },
  { year: '1969', title: 'Apollo 11 Moon Landing', desc: 'Neil Armstrong and Buzz Aldrin walk on the Moon — "One small step for man..."', icon: '🌙' },
  { year: '1975', title: 'Aryabhata', desc: "India's first satellite launched with Soviet assistance, marking ISRO's entry into space.", icon: '🇮🇳' },
  { year: '1998', title: 'ISS Construction', desc: 'International Space Station assembly begins — the largest structure in space.', icon: '🏗️' },
  { year: '2008', title: 'Chandrayaan-1', desc: "India's first lunar probe discovers water molecules on the Moon's surface.", icon: '💧' },
  { year: '2014', title: 'Mangalyaan', desc: 'ISRO reaches Mars on its first attempt, becoming the first Asian nation to do so.', icon: '🔴' },
  { year: '2023', title: 'Chandrayaan-3', desc: 'India becomes the 4th country to soft-land on the Moon, first at the south pole.', icon: '🚀' },
  { year: '2026', title: 'Gaganyaan', desc: "India's first crewed spaceflight mission to low Earth orbit — a new era begins.", icon: '🌍' },
];

export default function Timeline() {
  const [visibleItems, setVisibleItems] = useState(new Set());
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          const idx = Number(e.target.getAttribute('data-index'));
          if (e.isIntersecting) setVisibleItems((p) => new Set(p).add(idx));
        });
      },
      { threshold: 0.2 }
    );
    ref.current?.querySelectorAll('.tl-item').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <section className="timeline section-spacing" id="timeline">
      <div className="section-container">
        <div className="section-header">
          <span className="section-label">📅 Journey Through Time</span>
          <h2>Space Exploration <span className="gradient-text">Timeline</span></h2>
          <p>Key milestones that shaped humanity&apos;s journey beyond Earth.</p>
        </div>
        <div className="tl" ref={ref}>
          <div className="tl__line" />
          {milestones.map((m, i) => (
            <div key={m.year} className={`tl-item ${i % 2 === 0 ? 'tl-item--left' : 'tl-item--right'} ${visibleItems.has(i) ? 'tl-item--visible' : ''}`} data-index={i} style={{ transitionDelay: `${i * 80}ms` }}>
              <div className="tl-item__dot">{m.icon}</div>
              <div className="tl-item__card glass-card">
                <span className="tl-item__year">{m.year}</span>
                <h3 className="tl-item__title">{m.title}</h3>
                <p className="tl-item__desc">{m.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <style jsx>{`
        .tl { position: relative; padding: 2rem 0; }
        .tl__line { position: absolute; left: 50%; top: 0; bottom: 0; width: 2px; background: linear-gradient(to bottom, transparent, var(--color-accent-primary), var(--color-accent-secondary), transparent); transform: translateX(-50%); }
        .tl-item { position: relative; display: flex; align-items: center; margin-bottom: 3rem; opacity: 0; transition: opacity 0.6s ease, transform 0.6s ease; }
        .tl-item--left { flex-direction: row-reverse; transform: translateX(-40px); }
        .tl-item--right { transform: translateX(40px); }
        .tl-item--visible { opacity: 1; transform: translateX(0) !important; }
        .tl-item__dot { position: absolute; left: 50%; transform: translateX(-50%); width: 40px; height: 40px; border-radius: 50%; background: var(--color-bg-secondary); border: 2px solid var(--color-accent-primary); display: flex; align-items: center; justify-content: center; font-size: 1.1rem; z-index: 2; }
        .tl-item__card { width: calc(50% - 50px); padding: 1.5rem; }
        .tl-item__year { font-family: var(--font-mono); font-size: 0.75rem; color: var(--color-accent-secondary); font-weight: 700; letter-spacing: 0.1em; }
        .tl-item__title { font-size: 1.2rem; margin: 0.3rem 0 0.5rem; color: var(--color-text-primary); }
        .tl-item__desc { font-size: 0.85rem; line-height: 1.5; }
        @media (max-width: 768px) {
          .tl__line { left: 20px; }
          .tl-item, .tl-item--left, .tl-item--right { flex-direction: row; }
          .tl-item__dot { left: 20px; }
          .tl-item__card { width: calc(100% - 60px); margin-left: 50px; }
          .tl-item--left { transform: translateX(0); }
          .tl-item--right { transform: translateX(0); }
        }
      `}</style>
    </section>
  );
}
