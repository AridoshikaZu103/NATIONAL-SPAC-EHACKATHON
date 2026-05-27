import React from 'react';
import { Satellite, Debris, Threat, GroundStation } from '../lib/SimulationEngine';

interface Map2DProps {
  sim: any;
}

export default function Map2D({ sim }: Map2DProps) {
  const latToY = (lat: number) => {
    return `${50 - (lat / 90) * 50}%`;
  };
  
  const lonToX = (lon: number) => {
    return `${50 + (lon / 180) * 50}%`;
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: '#051122' }}>
      <img 
        src="https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg" 
        style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6, filter: 'hue-rotate(180deg) brightness(0.8)' }} 
        alt="World Map 2D" 
      />
      
      {/* Grid lines */}
      <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, borderTop: '1px dashed rgba(0,212,255,0.2)' }} />
      <div style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', borderLeft: '1px dashed rgba(0,212,255,0.2)' }} />

      {/* Ground Stations */}
      {sim.groundStations?.map((gs: GroundStation) => (
        <div key={`gs-${gs.id}`} style={{
          position: 'absolute',
          left: lonToX(gs.lon),
          top: latToY(gs.lat),
          width: '6px',
          height: '6px',
          background: '#00ff00',
          transform: 'translate(-50%, -50%)',
          borderRadius: '50%'
        }} title={`GS: ${gs.id}`} />
      ))}

      {/* Debris */}
      {sim.debris?.map((deb: Debris, i: number) => (
        <div key={`deb-${i}`} style={{
          position: 'absolute',
          left: lonToX(deb.pos.lon),
          top: latToY(deb.pos.lat),
          width: '3px',
          height: '3px',
          background: '#4466ff',
          transform: 'translate(-50%, -50%)',
          borderRadius: '50%',
          pointerEvents: 'none'
        }} />
      ))}

      {/* Satellites */}
      {sim.satellites?.map((sat: Satellite) => {
        const isSelected = sim.selectedSatId === sat.id;
        return (
          <div key={`sat-${sat.id}`} style={{
            position: 'absolute',
            left: lonToX(sat.pos.lon),
            top: latToY(sat.pos.lat),
            width: isSelected ? '8px' : '5px',
            height: isSelected ? '8px' : '5px',
            background: isSelected ? '#ffffff' : '#00d4ff',
            transform: 'translate(-50%, -50%)',
            borderRadius: '50%',
            boxShadow: isSelected ? '0 0 8px #ffffff' : 'none',
            zIndex: 10,
            cursor: 'pointer'
          }} title={sat.name} onClick={() => sim.setSelectedSatId(sat.id)} />
        );
      })}

      {/* Threats */}
      {sim.threats?.map((thr: Threat) => (
        <div key={`thr-${thr.id}`} style={{
          position: 'absolute',
          left: lonToX(thr.pos.lon),
          top: latToY(thr.pos.lat),
          width: '6px',
          height: '6px',
          background: '#ff4444',
          transform: 'translate(-50%, -50%)',
          boxShadow: '0 0 5px #ff4444',
          zIndex: 5,
          pointerEvents: 'none'
        }} title={`Threat: ${thr.id}`} />
      ))}
    </div>
  );
}
