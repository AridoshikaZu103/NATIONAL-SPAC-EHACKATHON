'use client';

import { useState, useEffect } from 'react';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = [
    { label: 'Home', href: '#hero' },
    { label: 'Missions', href: '#missions' },
    { label: 'Timeline', href: '#timeline' },
    { label: 'Statistics', href: '#stats' },
    { label: 'About', href: '#footer' },
  ];

  return (
    <nav className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`} id="navbar">
      <div className="navbar__inner">
        <a href="#hero" className="navbar__logo">
          <span className="navbar__logo-icon">🚀</span>
          <span className="navbar__logo-text">
            SPACE<span className="gradient-text">HUB</span>
          </span>
        </a>

        <div className={`navbar__links ${menuOpen ? 'navbar__links--open' : ''}`}>
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} className="navbar__link" onClick={() => setMenuOpen(false)}>
              {link.label}
            </a>
          ))}
          <a href="#missions" className="btn-primary navbar__cta" onClick={() => setMenuOpen(false)}>
            Launch
          </a>
        </div>

        <button
          className={`navbar__hamburger ${menuOpen ? 'navbar__hamburger--open' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
          id="menu-toggle"
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      <style jsx>{`
        .navbar { position: fixed; top: 0; left: 0; right: 0; z-index: var(--z-navbar); padding: 1rem 0; transition: all var(--transition-base); }
        .navbar--scrolled { background: rgba(3, 0, 20, 0.85); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border-bottom: 1px solid var(--color-border); padding: 0.6rem 0; }
        .navbar__inner { max-width: 1200px; margin: 0 auto; padding: 0 2rem; display: flex; align-items: center; justify-content: space-between; }
        .navbar__logo { display: flex; align-items: center; gap: 0.5rem; font-family: var(--font-heading); font-weight: 800; font-size: 1.4rem; color: var(--color-text-primary); text-decoration: none; letter-spacing: 0.05em; }
        .navbar__logo-icon { font-size: 1.6rem; }
        .navbar__links { display: flex; align-items: center; gap: 2rem; }
        .navbar__link { font-family: var(--font-body); font-weight: 500; font-size: 0.9rem; color: var(--color-text-secondary); text-decoration: none; transition: color var(--transition-fast); position: relative; }
        .navbar__link::after { content: ''; position: absolute; bottom: -4px; left: 0; width: 0; height: 2px; background: var(--gradient-primary); transition: width var(--transition-base); border-radius: 1px; }
        .navbar__link:hover { color: var(--color-text-primary); }
        .navbar__link:hover::after { width: 100%; }
        .navbar__cta { padding: 0.5rem 1.5rem; font-size: 0.85rem; }
        .navbar__hamburger { display: none; flex-direction: column; gap: 5px; background: none; border: none; cursor: pointer; padding: 4px; z-index: 200; }
        .navbar__hamburger span { width: 24px; height: 2px; background: var(--color-text-primary); transition: all var(--transition-base); border-radius: 2px; }
        .navbar__hamburger--open span:nth-child(1) { transform: rotate(45deg) translate(5px, 5px); }
        .navbar__hamburger--open span:nth-child(2) { opacity: 0; }
        .navbar__hamburger--open span:nth-child(3) { transform: rotate(-45deg) translate(5px, -5px); }
        @media (max-width: 768px) {
          .navbar__hamburger { display: flex; }
          .navbar__links { position: fixed; top: 0; right: 0; width: 280px; height: 100vh; flex-direction: column; justify-content: center; background: rgba(3, 0, 20, 0.97); backdrop-filter: blur(30px); transform: translateX(100%); transition: transform var(--transition-base); gap: 1.5rem; padding: 2rem; }
          .navbar__links--open { transform: translateX(0); }
          .navbar__link { font-size: 1.1rem; }
        }
      `}</style>
    </nav>
  );
}
