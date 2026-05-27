import React, { useEffect, useState } from 'react';

interface EarthGlobeProps {
  isPaused: boolean;
  satellites: any[];
  debris: any[];
  threats: any[];
  onTelemetryUpdate?: (data: any) => void;
  onCollisionWarning?: (active: boolean) => void;
}

// 6 fixed ground stations
const GROUND_STATIONS = [
  { id: 'IIT Delhi', lat: 28.54, lon: 77.19 },
  { id: 'Svalbard', lat: 78.22, lon: 15.62 },
  { id: 'Goldstone', lat: 35.42, lon: -116.89 },
  { id: 'Punta Arenas', lat: -53.15, lon: -70.90 },
  { id: 'ISTRAC', lat: 13.03, lon: 77.51 },
  { id: 'McMurdo', lat: -77.84, lon: 166.66 }
];

export default function EarthGlobe({ isPaused, satellites, debris, threats, onTelemetryUpdate, onCollisionWarning }: EarthGlobeProps) {
  
  // Send telemetry for alpha-1 every few renders for the sidebar
  useEffect(() => {
    if (satellites.length > 0 && !isPaused) {
      const s1 = satellites[0];
      if (onTelemetryUpdate) {
        onTelemetryUpdate({
          altitude: s1.alt,
          velocity: 7.58, // Approx fixed for 550km
          lat: s1.lat,
          lon: s1.lon,
          inclination: 51.6
        });
      }
    }
  }, [satellites, isPaused, onTelemetryUpdate]);

  // Check collision distance (mock logic for threat)
  useEffect(() => {
    if (threats.length > 0 && satellites.length > 0) {
      const t = threats[0]; // Active threat
      // If TCA is low, trigger warning
      if (t.timeToCollision < 1800) {
         if (onCollisionWarning) onCollisionWarning(true);
      } else {
         if (onCollisionWarning) onCollisionWarning(false);
      }
    } else {
      if (onCollisionWarning) onCollisionWarning(false);
    }
  }, [threats, satellites, onCollisionWarning]);

  // Helper to map Lat/Lon to a CSS 3D transform string
  // Radius of the CSS globe is 250px (width 500 / 2). 
  // We add altitude scaling: Earth=6371km. 550km is approx +8.6% radius. 
  // 250px * 1.086 = 271.5px orbit radius.
  const getTransform = (lat: number, lon: number, altKm: number) => {
    const scale = 1 + (altKm / 6371);
    const r = 250 * scale;
    // Rotate Y for Longitude, Rotate X for negative Latitude (CSS Y axis is flipped compared to standard math)
    return `rotateY(${lon}deg) rotateX(${-lat}deg) translateZ(${r}px)`;
  };

  return (
    <div className="css-globe-container">
      <div className={`css-globe-wrapper ${isPaused ? '' : 'playing'}`}>
        
        {/* The 3D Surface (Shading and background) */}
        <div className="css-globe-surface"></div>

        {/* Render Debris Belt (Limiting to first 200 for CSS DOM performance) */}
        {debris.slice(0, 200).map(deb => (
           <div key={deb[0]} className="css-marker css-debris" style={{ transform: getTransform(deb[1], deb[2], deb[3]) }}>
             <div className="css-marker-inner" />
           </div>
        ))}

        {/* Render Ground Stations */}
        {GROUND_STATIONS.map(gs => (
           <div key={gs.id} className="css-marker css-gs" style={{ transform: getTransform(gs.lat, gs.lon, 0) }}>
             <div className="css-marker-inner" title={gs.id} />
           </div>
        ))}

        {/* Render Active Satellites */}
        {satellites.map((sat, i) => (
           <div key={sat.id} className="css-marker css-sat" style={{ transform: getTransform(sat.lat, sat.lon, sat.alt) }}>
             <div className="css-marker-inner" title={`α${i+1}`} />
           </div>
        ))}

        {/* Render Threats */}
        {threats.map(thr => (
           <div key={thr.id} className="css-marker css-threat" style={{ transform: getTransform(thr.pos.lat, thr.pos.lon, thr.pos.alt) }}>
             <div className="css-marker-inner" />
           </div>
        ))}

      </div>
    </div>
  );
}
