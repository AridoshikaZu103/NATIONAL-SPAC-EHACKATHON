'use client';

export default function Footer() {
  const year = new Date().getFullYear();
  const links = [
    { title: 'Explore', items: ['Missions', 'Timeline', 'Statistics', 'Gallery'] },
    { title: 'Resources', items: ['ISRO Portal', 'NASA Open Data', 'SpaceX API', 'Documentation'] },
    { title: 'Connect', items: ['GitHub', 'Discord', 'Twitter/X', 'Contact Us'] },
  ];

  return (
    <footer className="footer" id="footer">
      <div className="footer__glow" />
      <div className="section-container">
        <div className="footer__top">
          <div className="footer__brand">
            <div className="footer__logo">🚀 SPACE<span className="gradient-text">HUB</span></div>
            <p className="footer__tagline">Exploring the cosmos through technology and innovation. Built for the National Space Hackathon.</p>
            <div className="footer__socials">
              {['🌐', '💻', '🐦', '📧'].map((icon, i) => (
                <a key={i} href="#" className="footer__social-btn" aria-label={`Social link ${i}`}>{icon}</a>
              ))}
            </div>
          </div>
          <div className="footer__links-grid">
            {links.map((group) => (
              <div key={group.title} className="footer__link-group">
                <h4 className="footer__link-title">{group.title}</h4>
                {group.items.map((item) => (
                  <a key={item} href="#" className="footer__link">{item}</a>
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className="footer__divider" />
        <div className="footer__bottom">
          <span>© {year} National Space Hackathon. All rights reserved.</span>
          <span className="footer__badge">🏆 Built with Next.js + R3F</span>
        </div>
      </div>
      <style jsx>{`
        .footer { position: relative; background: var(--color-bg-secondary); padding: 4rem 0 2rem; overflow: hidden; }
        .footer__glow { position: absolute; top: 0; left: 50%; transform: translateX(-50%); width: 80%; height: 1px; background: linear-gradient(90deg, transparent, var(--color-accent-primary), var(--color-accent-secondary), transparent); }
        .footer__top { display: grid; grid-template-columns: 1.2fr 2fr; gap: 3rem; margin-bottom: 3rem; }
        .footer__logo { font-family: var(--font-heading); font-weight: 800; font-size: 1.5rem; margin-bottom: 1rem; color: var(--color-text-primary); }
        .footer__tagline { font-size: 0.9rem; color: var(--color-text-secondary); line-height: 1.6; margin-bottom: 1.5rem; }
        .footer__socials { display: flex; gap: 0.8rem; }
        .footer__social-btn { width: 40px; height: 40px; border-radius: 50%; background: var(--color-bg-glass); border: 1px solid var(--color-border); display: flex; align-items: center; justify-content: center; font-size: 1.1rem; transition: all var(--transition-base); text-decoration: none; }
        .footer__social-btn:hover { background: var(--color-bg-glass-hover); border-color: var(--color-accent-primary); transform: translateY(-2px); }
        .footer__links-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem; }
        .footer__link-title { font-family: var(--font-heading); font-weight: 600; font-size: 0.9rem; color: var(--color-text-primary); margin-bottom: 1rem; }
        .footer__link { display: block; font-size: 0.85rem; color: var(--color-text-secondary); margin-bottom: 0.6rem; transition: color var(--transition-fast); text-decoration: none; }
        .footer__link:hover { color: var(--color-accent-secondary); }
        .footer__divider { height: 1px; background: var(--color-border); margin-bottom: 1.5rem; }
        .footer__bottom { display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem; color: var(--color-text-muted); }
        .footer__badge { font-family: var(--font-mono); font-size: 0.7rem; padding: 0.3rem 0.8rem; border: 1px solid var(--color-border); border-radius: 9999px; }
        @media (max-width: 768px) {
          .footer__top { grid-template-columns: 1fr; }
          .footer__links-grid { grid-template-columns: repeat(2, 1fr); }
          .footer__bottom { flex-direction: column; gap: 0.8rem; text-align: center; }
        }
      `}</style>
    </footer>
  );
}
