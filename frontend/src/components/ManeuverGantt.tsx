import React from 'react';

interface TimelineEvent {
  id: string;
  satId: string;
  timeStart: number;
  timeEnd: number;
  type: string; // "EVASION" | "RECOVERY"
}

interface GanttProps {
  timeline: TimelineEvent[];
  currentTime: number;
}

export default function ManeuverGantt({ timeline, currentTime }: GanttProps) {
  // We'll show a window of Time: CurrentTime - 1 hour to CurrentTime + 3 hours
  const windowStart = Math.max(0, currentTime - 3600);
  const windowEnd = windowStart + (4 * 3600); // 4 hours total window
  const windowDuration = windowEnd - windowStart;

  // Group events by satellite ID for row display
  const rows = ['SAT-Alpha-01', 'SAT-Alpha-02', 'SAT-Alpha-03', 'SAT-Alpha-04', 'SAT-Alpha-05', 'SAT-Alpha-06'];

  const getLeftPct = (time: number) => {
    const clamped = Math.max(windowStart, Math.min(windowEnd, time));
    return ((clamped - windowStart) / windowDuration) * 100;
  };

  const getWidthPct = (start: number, end: number) => {
    if (end < windowStart || start > windowEnd) return 0;
    const s = Math.max(windowStart, start);
    const e = Math.min(windowEnd, end);
    return ((e - s) / windowDuration) * 100;
  };

  return (
    <div style={{ width: '100%', height: '100%', background: 'rgba(15, 15, 30, 0.6)', borderRadius: '12px', border: '1px solid rgba(0, 212, 255, 0.15)', padding: '16px', display: 'flex', flexDirection: 'column' }}>
      <h3 style={{ color: '#ffaa00', marginTop: 0, marginBottom: '16px', fontSize: '1rem' }}>⏱️ Maneuver Timeline (Gantt)</h3>
      
      <div style={{ display: 'flex', flexGrow: 1, position: 'relative' }}>
        
        {/* Y Axis Labels (Satellites) */}
        <div style={{ width: '100px', display: 'flex', flexDirection: 'column', justifyContent: 'space-around', borderRight: '1px solid rgba(255,255,255,0.1)', paddingRight: '10px' }}>
          {rows.map((sat, i) => (
            <div key={sat} style={{ fontSize: '0.75rem', color: '#ccc', fontFamily: 'monospace' }}>α{i+1}</div>
          ))}
        </div>

        {/* Timeline Grid */}
        <div style={{ flexGrow: 1, position: 'relative', background: 'rgba(0,0,0,0.2)', overflow: 'hidden' }}>
          
          {/* Vertical Time Guides */}
          {[0, 1, 2, 3, 4].map(h => (
            <div key={h} style={{ position: 'absolute', left: `${(h/4)*100}%`, top: 0, bottom: 0, borderLeft: '1px dashed rgba(255,255,255,0.1)' }}>
              <span style={{ position: 'absolute', top: '-15px', left: '2px', fontSize: '10px', color: '#888' }}>
                T+{Math.round((windowStart + h*3600)/3600)}h
              </span>
            </div>
          ))}

          {/* Current Time Indicator */}
          <div style={{
            position: 'absolute', 
            left: `${getLeftPct(currentTime)}%`, 
            top: 0, bottom: 0, 
            borderLeft: '2px solid #00ff88',
            zIndex: 10,
            boxShadow: '0 0 5px #00ff88'
          }} />

          {/* Rows */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-around', height: '100%', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
            {rows.map(satId => {
              const satEvents = timeline.filter(e => e.satId === satId);
              return (
                <div key={satId} style={{ height: '24px', position: 'relative', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  {satEvents.map(ev => {
                    const left = getLeftPct(ev.timeStart);
                    const width = getWidthPct(ev.timeStart, ev.timeEnd);
                    if (width <= 0) return null;
                    
                    const isEvasion = ev.type === 'EVASION';
                    const color = isEvasion ? '#ff4444' : '#00d4ff';
                    
                    return (
                      <React.Fragment key={ev.id}>
                        {/* Main Burn Block */}
                        <div style={{
                          position: 'absolute',
                          left: `${left}%`,
                          width: `${width}%`,
                          height: '16px',
                          top: '4px',
                          background: color,
                          opacity: 0.8,
                          borderRadius: '2px',
                          fontSize: '9px',
                          color: '#000',
                          fontWeight: 'bold',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden'
                        }}>
                          {width > 5 ? ev.type : ''}
                        </div>
                        
                        {/* 600s Cooldown Block (Blackout Zone) following the burn */}
                        {/* Only draw if the cooldown fits in the window */}
                        {ev.timeEnd < windowEnd && (
                          <div style={{
                            position: 'absolute',
                            left: `${getLeftPct(ev.timeEnd)}%`,
                            width: `${getWidthPct(ev.timeEnd, ev.timeEnd + 600)}%`,
                            height: '16px',
                            top: '4px',
                            background: 'repeating-linear-gradient(45deg, #333, #333 2px, #000 2px, #000 4px)',
                            border: '1px solid #555',
                            opacity: 0.6,
                            borderRadius: '0 2px 2px 0'
                          }} title="600s Thruster Cooldown" />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Legend */}
      <div style={{ display: 'flex', gap: '16px', marginTop: '12px', fontSize: '0.75rem', justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '12px', height: '12px', background: '#ff4444', borderRadius: '2px' }}/> Evasion Burn</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '12px', height: '12px', background: '#00d4ff', borderRadius: '2px' }}/> Recovery Burn</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '12px', height: '12px', background: 'repeating-linear-gradient(45deg, #333, #333 2px, #000 2px, #000 4px)', border: '1px solid #555' }}/> 600s Cooldown (Blackout)</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '2px', height: '12px', background: '#00ff88' }}/> Current Time</div>
      </div>
    </div>
  );
}
