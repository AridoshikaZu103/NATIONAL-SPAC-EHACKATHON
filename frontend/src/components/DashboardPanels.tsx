import React from 'react';
import { Satellite, CDM, TimelineEvent, Threat } from '../lib/SimulationEngine';

export function ConjunctionBullseye({ selectedSatId, threats }: { selectedSatId: string, threats: Threat[] }) {
  // Find threats for the selected satellite
  const activeThreats = threats.filter(t => t.targetSatId === selectedSatId);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0, 0, 0, 0.2)', borderRadius: '8px' }}>
      {/* Radar rings */}
      <div style={{ position: 'absolute', width: '120px', height: '120px', borderRadius: '50%', border: '1px solid rgba(0, 212, 255, 0.1)' }}></div>
      <div style={{ position: 'absolute', width: '80px', height: '80px', borderRadius: '50%', border: '1px solid rgba(0, 212, 255, 0.2)' }}></div>
      <div style={{ position: 'absolute', width: '40px', height: '40px', borderRadius: '50%', border: '1px solid rgba(0, 212, 255, 0.4)' }}></div>
      
      {/* Center dot (satellite) */}
      <div style={{ position: 'absolute', width: '8px', height: '8px', borderRadius: '50%', background: '#00d4ff', boxShadow: '0 0 8px #00d4ff', zIndex: 10 }}></div>

      {activeThreats.length === 0 && (
        <div style={{ position: 'absolute', bottom: '10px', fontSize: '0.7rem', color: '#00d4ff', opacity: 0.6 }}>NO CONJUNCTIONS</div>
      )}

      {/* Threat dots */}
      {activeThreats.map((thr, i) => {
        // Distance mapped to radius (simplified mapping)
        const isCritical = thr.timeToCollision < 18000;
        const radiusMap = Math.max(0, Math.min(60, (thr.timeToCollision / 86400) * 60)); 
        const angle = i * (Math.PI * 2 / activeThreats.length) + Math.PI/4; // randomish angle spread
        const x = Math.cos(angle) * radiusMap;
        const y = Math.sin(angle) * radiusMap;
        
        return (
          <div key={thr.id} style={{
            position: 'absolute',
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: isCritical ? '#ff4444' : '#ffaa00',
            boxShadow: `0 0 8px ${isCritical ? '#ff4444' : '#ffaa00'}`,
            transform: `translate(${x}px, ${y}px)`
          }} />
        );
      })}
    </div>
  );
}

export function ManeuverTimeline({ time, timeline }: { time: number, timeline: TimelineEvent[] }) {
  const satIds = ['alpha-01', 'alpha-02', 'alpha-03', 'alpha-04', 'alpha-05', 'alpha-06'];
  const viewWindowSeconds = 3600 * 48; // Look ahead 48 hours to catch injected threats (start at 24h)
  
  if (timeline.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#666', fontSize: '0.75rem' }}>
        NO MANEUVERS SCHEDULED — INJECT THREATS ⚠ THEN STEP SIM
      </div>
    );
  }

  return (
    <div style={{ padding: '10px 0', fontSize: '0.7rem' }}>
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(0,212,255,0.2)', paddingBottom: '4px', marginBottom: '8px', color: '#00d4ff' }}>
        <div style={{ width: '40px' }}>SAT</div>
        <div style={{ flex: 1, position: 'relative', height: '14px' }}>
          <span style={{ position: 'absolute', left: '0%' }}>NOW</span>
          <span style={{ position: 'absolute', left: '12.5%' }}>+6h</span>
          <span style={{ position: 'absolute', left: '25%' }}>+12h</span>
          <span style={{ position: 'absolute', left: '50%' }}>+24h</span>
          <span style={{ position: 'absolute', left: '75%' }}>+36h</span>
          <span style={{ position: 'absolute', left: '95%' }}>+48h</span>
        </div>
      </div>
      
      {satIds.map(satId => {
        const events = timeline.filter(e => e.satId === satId && e.timeEnd > time - 3600 && e.timeStart < time + viewWindowSeconds);
        
        return (
          <div key={satId} style={{ display: 'flex', alignItems: 'center', height: '24px', borderBottom: '1px dashed rgba(255,255,255,0.05)' }}>
            <div style={{ width: '40px', color: '#00d4ff' }}>{satId.replace('alpha-', 'α')}</div>
            <div style={{ flex: 1, height: '100%', position: 'relative', background: 'rgba(0, 212, 255, 0.02)' }}>
              {/* Timeline current time marker */}
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '1px', background: 'rgba(0,212,255,0.5)' }} />
              
              {events.map((ev, i) => {
                const leftPercent = Math.max(0, ((ev.timeStart - time) / viewWindowSeconds) * 100);
                const widthPercent = Math.max(0.5, ((ev.timeEnd - Math.max(ev.timeStart, time)) / viewWindowSeconds) * 100);
                const isEvasion = ev.type === 'EVASION';
                
                return (
                  <div key={i} title={`${ev.type} | ${ev.satId}`} style={{
                    position: 'absolute',
                    left: `${leftPercent}%`,
                    width: `${widthPercent}%`,
                    top: '4px',
                    height: '16px',
                    background: isEvasion ? 'linear-gradient(90deg, #ff8800, #ff4400)' : 'linear-gradient(90deg, #0088ff, #00ccff)',
                    borderRadius: '2px',
                    boxShadow: `0 0 6px ${isEvasion ? '#ff880080' : '#0088ff80'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.55rem',
                    color: '#fff',
                    fontWeight: 'bold',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    cursor: 'default'
                  }}>
                    {widthPercent > 3 ? (isEvasion ? 'EVA' : 'REC') : ''}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function FleetFuelStatus({ satellites }: { satellites: Satellite[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.75rem' }}>
      {satellites.map(sat => (
        <div key={sat.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '60px', color: '#aaa' }}>{sat.name.replace('SAT-', '')}</div>
          <div style={{ flex: 1, height: '12px', background: 'rgba(0,0,0,0.4)', borderRadius: '6px', overflow: 'hidden', border: '1px solid rgba(0, 255, 136, 0.2)' }}>
            <div style={{
              width: `${sat.fuelPercent}%`,
              height: '100%',
              background: sat.fuelPercent > 50 ? '#00ff88' : (sat.fuelPercent > 20 ? '#ffaa00' : '#ff4444'),
              boxShadow: `0 0 8px ${sat.fuelPercent > 50 ? '#00ff88' : '#ff4444'}`,
              transition: 'width 0.5s ease-out'
            }} />
          </div>
          <div style={{ width: '30px', textAlign: 'right', color: '#00ff88', fontWeight: 'bold' }}>
            {Math.round(sat.fuelPercent)}%
          </div>
        </div>
      ))}
    </div>
  );
}

export function ActiveCDMs({ cdms }: { cdms: CDM[] }) {
  if (cdms.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100px', color: '#666', fontSize: '0.8rem' }}>
        NO ACTIVE CONJUNCTIONS - STEP SIM TO SCAN
      </div>
    );
  }

  return (
    <div style={{ overflowY: 'auto', maxHeight: '150px' }}>
      <table style={{ width: '100%', fontSize: '0.7rem', textAlign: 'left', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ color: '#00d4ff', borderBottom: '1px solid rgba(0, 212, 255, 0.2)' }}>
            <th style={{ padding: '4px' }}>RISK</th>
            <th style={{ padding: '4px' }}>SATELLITE</th>
            <th style={{ padding: '4px' }}>DEBRIS</th>
            <th style={{ padding: '4px' }}>TCA</th>
            <th style={{ padding: '4px' }}>MISS DIST</th>
            <th style={{ padding: '4px' }}>REL VEL</th>
          </tr>
        </thead>
        <tbody>
          {cdms.map(cdm => (
            <tr key={cdm.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <td style={{ padding: '4px' }}>
                <span style={{ 
                  background: cdm.risk === 'RED' ? '#ff4444' : '#ffaa00', 
                  color: '#000', 
                  padding: '2px 6px', 
                  borderRadius: '4px', 
                  fontWeight: 'bold' 
                }}>
                  {cdm.risk}
                </span>
              </td>
              <td style={{ padding: '4px', color: '#fff' }}>{cdm.satName}</td>
              <td style={{ padding: '4px', color: '#aaa' }}>{cdm.debrisId}</td>
              <td style={{ padding: '4px', color: '#00d4ff' }}>{cdm.tca}</td>
              <td style={{ padding: '4px', color: '#fff' }}>{cdm.missDist.toFixed(2)} km</td>
              <td style={{ padding: '4px', color: '#aaa' }}>{cdm.relVel.toFixed(2)} km/s</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
