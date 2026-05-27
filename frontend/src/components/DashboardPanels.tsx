import React from 'react';
import { Satellite, CDM, TimelineEvent, Threat } from '../lib/SimulationEngine';

export function ConjunctionBullseye({ selectedSatId, threats }: { selectedSatId: string, threats: Threat[] }) {
  const activeThreats = threats.filter(t => t.targetSatId === selectedSatId);
  const allThreats = threats; // Show all threats on the bullseye too, dimmed

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0, 0, 0, 0.15)', borderRadius: '8px', overflow: 'hidden' }}>
      {/* Animated scan line */}
      <div style={{
        position: 'absolute',
        width: '100%',
        height: '2px',
        background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.3), transparent)',
        animation: 'scanLine 3s ease-in-out infinite',
        top: '50%'
      }} />

      {/* Radar rings with labels */}
      {[120, 80, 40].map((size, i) => (
        <React.Fragment key={size}>
          <div style={{
            position: 'absolute',
            width: `${size}px`,
            height: `${size}px`,
            borderRadius: '50%',
            border: `1px solid rgba(0, 212, 255, ${0.08 + i * 0.08})`
          }} />
          <span style={{
            position: 'absolute',
            fontSize: '0.5rem',
            color: 'rgba(0,212,255,0.3)',
            transform: `translate(${size / 2 + 4}px, 0)`,
            fontFamily: 'var(--font-mono)'
          }}>
            {i === 0 ? '48h' : i === 1 ? '24h' : '5h'}
          </span>
        </React.Fragment>
      ))}

      {/* Cross-hairs */}
      <div style={{ position: 'absolute', width: '140px', height: '1px', background: 'rgba(0,212,255,0.06)' }} />
      <div style={{ position: 'absolute', width: '1px', height: '140px', background: 'rgba(0,212,255,0.06)' }} />

      {/* Center dot (selected satellite) */}
      <div style={{
        position: 'absolute',
        width: '10px',
        height: '10px',
        borderRadius: '50%',
        background: '#00d4ff',
        boxShadow: '0 0 12px #00d4ff, 0 0 4px #00d4ff',
        zIndex: 10
      }} />

      {/* Status text */}
      <div style={{
        position: 'absolute',
        top: '8px',
        left: '8px',
        fontSize: '0.55rem',
        color: activeThreats.length > 0 ? '#ff4444' : 'rgba(0,212,255,0.5)',
        fontFamily: 'var(--font-mono)',
        textTransform: 'uppercase',
        letterSpacing: '1px'
      }}>
        {activeThreats.length > 0
          ? `⚠ ${activeThreats.length} CONJUNCTION${activeThreats.length > 1 ? 'S' : ''}`
          : '✓ CLEAR'}
      </div>

      <div style={{
        position: 'absolute',
        top: '8px',
        right: '8px',
        fontSize: '0.55rem',
        color: 'rgba(0,212,255,0.4)',
        fontFamily: 'var(--font-mono)'
      }}>
        {selectedSatId.replace('alpha-', 'α')}
      </div>

      {/* All threat dots (dimmed) */}
      {allThreats.filter(t => t.targetSatId !== selectedSatId).map((thr, i) => {
        const radiusMap = Math.max(5, Math.min(60, (thr.timeToCollision / 86400) * 60));
        const angle = (i * 1.3) + Math.PI / 6;
        const x = Math.cos(angle) * radiusMap;
        const y = Math.sin(angle) * radiusMap;

        return (
          <div key={`other-${thr.id}`} style={{
            position: 'absolute',
            width: '4px',
            height: '4px',
            borderRadius: '50%',
            background: 'rgba(255,170,0,0.3)',
            transform: `translate(${x}px, ${y}px)`
          }} />
        );
      })}

      {/* Active threat dots (bright) */}
      {activeThreats.map((thr, i) => {
        const isCritical = thr.timeToCollision < 18000;
        const radiusMap = Math.max(5, Math.min(60, (thr.timeToCollision / 86400) * 60));
        const angle = i * (Math.PI * 2 / Math.max(1, activeThreats.length)) + Math.PI / 4;
        const x = Math.cos(angle) * radiusMap;
        const y = Math.sin(angle) * radiusMap;

        return (
          <React.Fragment key={thr.id}>
            <div style={{
              position: 'absolute',
              width: isCritical ? '10px' : '7px',
              height: isCritical ? '10px' : '7px',
              borderRadius: '50%',
              background: isCritical ? '#ff4444' : '#ffaa00',
              boxShadow: `0 0 10px ${isCritical ? '#ff4444' : '#ffaa00'}, 0 0 4px ${isCritical ? '#ff4444' : '#ffaa00'}`,
              transform: `translate(${x}px, ${y}px)`,
              animation: isCritical ? 'pulse-glow 1s ease-in-out infinite' : undefined,
              zIndex: 5
            }} />
            {/* Label */}
            <span style={{
              position: 'absolute',
              fontSize: '0.5rem',
              color: isCritical ? '#ff4444' : '#ffaa00',
              fontFamily: 'var(--font-mono)',
              transform: `translate(${x + 8}px, ${y - 8}px)`,
              zIndex: 5,
              whiteSpace: 'nowrap'
            }}>
              {Math.round(thr.timeToCollision / 3600)}h
            </span>
          </React.Fragment>
        );
      })}

      <style>{`
        @keyframes scanLine {
          0% { transform: translateY(-70px); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateY(70px); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

export function ManeuverTimeline({ time, timeline }: { time: number, timeline: TimelineEvent[] }) {
  const satIds = ['alpha-01', 'alpha-02', 'alpha-03', 'alpha-04', 'alpha-05', 'alpha-06'];
  const viewWindowSeconds = 3600 * 48;

  if (timeline.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '8px' }}>
        <div style={{ fontSize: '2rem', opacity: 0.3 }}>📅</div>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontFamily: 'var(--font-mono)', textAlign: 'center' }}>
          NO MANEUVERS SCHEDULED<br/>
          <span style={{ fontSize: '0.6rem', opacity: 0.6 }}>Click ⚠ INJECT THREATS to trigger COLA engine</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '8px 0', fontSize: '0.65rem', fontFamily: 'var(--font-mono)', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Time axis header */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-dim)', paddingBottom: '6px', marginBottom: '6px', color: 'var(--cyan-dim)' }}>
        <div style={{ width: '44px', flexShrink: 0 }}>SAT</div>
        <div style={{ flex: 1, position: 'relative', height: '12px' }}>
          {['NOW', '+6h', '+12h', '+24h', '+36h', '+48h'].map((label, i) => (
            <span key={label} style={{ position: 'absolute', left: `${[0, 12.5, 25, 50, 75, 95][i]}%`, fontSize: '0.55rem' }}>{label}</span>
          ))}
        </div>
      </div>

      {/* Satellite rows */}
      <div style={{ flex: 1 }}>
        {satIds.map(satId => {
          const events = timeline.filter(e => e.satId === satId && e.timeEnd > time - 3600 && e.timeStart < time + viewWindowSeconds);

          return (
            <div key={satId} style={{ display: 'flex', alignItems: 'center', height: '22px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
              <div style={{ width: '44px', color: 'var(--cyan)', flexShrink: 0 }}>{satId.replace('alpha-', 'α')}</div>
              <div style={{ flex: 1, height: '100%', position: 'relative', background: 'rgba(0, 212, 255, 0.015)' }}>
                {/* Now marker */}
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '1px', background: 'rgba(0,212,255,0.4)' }} />

                {events.map((ev, i) => {
                  const leftPercent = Math.max(0, ((ev.timeStart - time) / viewWindowSeconds) * 100);
                  const widthPercent = Math.max(0.5, ((ev.timeEnd - Math.max(ev.timeStart, time)) / viewWindowSeconds) * 100);
                  const isEvasion = ev.type === 'EVASION';

                  return (
                    <div key={i} title={`${ev.type} | ${ev.satId}`} style={{
                      position: 'absolute',
                      left: `${leftPercent}%`,
                      width: `${widthPercent}%`,
                      top: '3px',
                      height: '16px',
                      background: isEvasion
                        ? 'linear-gradient(90deg, #ff8800, #ff4400)'
                        : 'linear-gradient(90deg, #0088ff, #00ccff)',
                      borderRadius: '3px',
                      boxShadow: `0 0 6px ${isEvasion ? 'rgba(255,136,0,0.4)' : 'rgba(0,136,255,0.4)'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.5rem',
                      color: '#fff',
                      fontWeight: 'bold',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap'
                    }}>
                      {widthPercent > 2.5 ? (isEvasion ? 'EVA' : 'REC') : ''}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '14px', paddingTop: '8px', borderTop: '1px solid var(--border-dim)', fontSize: '0.55rem', color: 'var(--text-muted)' }}>
        <span><span style={{ display: 'inline-block', width: '10px', height: '6px', background: 'linear-gradient(90deg, #ff8800, #ff4400)', borderRadius: '2px', marginRight: '4px' }}></span>EVASION</span>
        <span><span style={{ display: 'inline-block', width: '10px', height: '6px', background: 'linear-gradient(90deg, #0088ff, #00ccff)', borderRadius: '2px', marginRight: '4px' }}></span>RECOVERY</span>
      </div>
    </div>
  );
}

export function FleetFuelStatus({ satellites }: { satellites: Satellite[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.7rem', fontFamily: 'var(--font-mono)' }}>
      {satellites.map(sat => (
        <div key={sat.id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '50px', color: 'var(--cyan)', fontSize: '0.65rem' }}>{sat.id.replace('alpha-', 'α')}</div>
          <div style={{ flex: 1, height: '14px', background: 'rgba(0,0,0,0.3)', borderRadius: '7px', overflow: 'hidden', border: '1px solid rgba(0, 255, 136, 0.15)' }}>
            <div style={{
              width: `${sat.fuelPercent}%`,
              height: '100%',
              background: sat.fuelPercent > 50
                ? 'linear-gradient(90deg, #00cc66, #00ff88)'
                : (sat.fuelPercent > 20 ? 'linear-gradient(90deg, #cc8800, #ffaa00)' : 'linear-gradient(90deg, #cc2200, #ff4444)'),
              boxShadow: `0 0 6px ${sat.fuelPercent > 50 ? 'rgba(0,255,136,0.4)' : 'rgba(255,68,68,0.4)'}`,
              transition: 'width 0.5s ease-out',
              borderRadius: '7px'
            }} />
          </div>
          <div style={{ width: '45px', textAlign: 'right', color: sat.fuelPercent > 50 ? 'var(--green)' : 'var(--orange)', fontWeight: 'bold', fontSize: '0.65rem' }}>
            {sat.fuelKg.toFixed(1)}kg
          </div>
        </div>
      ))}
    </div>
  );
}

export function ActiveCDMs({ cdms }: { cdms: CDM[] }) {
  if (cdms.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '8px' }}>
        <div style={{ fontSize: '2rem', opacity: 0.3 }}>🛡️</div>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontFamily: 'var(--font-mono)', textAlign: 'center' }}>
          NO ACTIVE CONJUNCTIONS<br/>
          <span style={{ fontSize: '0.6rem', opacity: 0.6 }}>Step simulation to scan for close approaches</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ overflowY: 'auto', height: '100%', fontFamily: 'var(--font-mono)' }}>
      <table style={{ width: '100%', fontSize: '0.65rem', textAlign: 'left', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ color: 'var(--cyan-dim)', borderBottom: '1px solid var(--border-dim)' }}>
            <th style={{ padding: '6px' }}>RISK</th>
            <th style={{ padding: '6px' }}>SATELLITE</th>
            <th style={{ padding: '6px' }}>DEBRIS</th>
            <th style={{ padding: '6px' }}>TCA</th>
            <th style={{ padding: '6px' }}>MISS DIST</th>
            <th style={{ padding: '6px' }}>REL VEL</th>
          </tr>
        </thead>
        <tbody>
          {cdms.map(cdm => (
            <tr key={cdm.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.03)' }}>
              <td style={{ padding: '6px' }}>
                <span style={{
                  background: cdm.risk === 'RED' ? '#ff4444' : '#ffaa00',
                  color: '#000',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontWeight: 'bold',
                  fontSize: '0.6rem'
                }}>
                  {cdm.risk}
                </span>
              </td>
              <td style={{ padding: '6px', color: '#fff' }}>{cdm.satName}</td>
              <td style={{ padding: '6px', color: 'var(--text-muted)' }}>{cdm.debrisId}</td>
              <td style={{ padding: '6px', color: 'var(--cyan)' }}>{cdm.tca}</td>
              <td style={{ padding: '6px', color: '#fff' }}>{cdm.missDist.toFixed(2)} km</td>
              <td style={{ padding: '6px', color: 'var(--text-muted)' }}>{cdm.relVel.toFixed(2)} km/s</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
