import React from 'react';

export default function ManeuverGantt({ timeline = [], currentTime = 0 }) {
  // Show window: CurrentTime - 1hr to CurrentTime + 5hr
  const windowStart = Math.max(0, currentTime - 3600);
  const windowEnd = windowStart + (6 * 3600); // 6 hours total
  const windowDuration = windowEnd - windowStart;

  const rows = ['alpha-01', 'alpha-02', 'alpha-03', 'alpha-04', 'alpha-05', 'alpha-06'];

  const getLeftPct = (time) => {
    const clamped = Math.max(windowStart, Math.min(windowEnd, time));
    return ((clamped - windowStart) / windowDuration) * 100;
  };

  const getWidthPct = (start, end) => {
    if (end < windowStart || start > windowEnd) return 0;
    const s = Math.max(windowStart, start);
    const e = Math.min(windowEnd, end);
    return ((e - s) / windowDuration) * 100;
  };

  // Count events per row for status indicator
  const hasEvents = rows.map(satId => timeline.some(e => e.satId === satId));

  return (
    <div className="gantt-container">
      <div className="gantt-header">
        <h3 className="gantt-title">MANEUVER TIMELINE</h3>
        <span className="gantt-time-badge">T+{Math.round(currentTime / 3600)}h</span>
      </div>

      <div className="gantt-body">
        {/* Y Axis */}
        <div className="gantt-y-axis">
          {rows.map((sat, i) => (
            <div key={sat} className="gantt-y-label">
              <span className="gantt-sat-dot" style={{ background: hasEvents[i] ? '#ffaa00' : '#333' }}></span>
              {'\u03B1'}{i + 1}
            </div>
          ))}
        </div>

        {/* Timeline Grid */}
        <div className="gantt-grid">
          {/* Vertical time guides */}
          {[0, 1, 2, 3, 4, 5, 6].map(h => (
            <div key={h} className="gantt-time-guide" style={{ left: (h / 6 * 100) + '%' }}>
              <span className="gantt-time-label">T+{Math.round((windowStart + h * 3600) / 3600)}h</span>
            </div>
          ))}

          {/* Current time indicator */}
          <div className="gantt-now-line" style={{ left: getLeftPct(currentTime) + '%' }} />

          {/* Rows with events */}
          <div className="gantt-rows">
            {rows.map(satId => {
              const satEvents = timeline.filter(e => e.satId === satId);
              return (
                <div key={satId} className="gantt-row">
                  {satEvents.map(ev => {
                    const left = getLeftPct(ev.timeStart);
                    const width = getWidthPct(ev.timeStart, ev.timeEnd);
                    if (width <= 0) return null;

                    const isEvasion = ev.type === 'EVASION';
                    const color = isEvasion ? '#ff3366' : '#00e5ff';

                    return (
                      <React.Fragment key={ev.id}>
                        <div className="gantt-event" style={{
                          left: left + '%',
                          width: width + '%',
                          background: color,
                        }}>
                          {width > 8 ? ev.type : ''}
                        </div>
                        {/* 600s Cooldown */}
                        {ev.timeEnd < windowEnd && (
                          <div className="gantt-cooldown" style={{
                            left: getLeftPct(ev.timeEnd) + '%',
                            width: getWidthPct(ev.timeEnd, ev.timeEnd + 600) + '%',
                          }} title="600s Cooldown" />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Empty state */}
          {timeline.length === 0 && (
            <div className="gantt-empty">
              NO MANEUVERS SCHEDULED — SPAWN A THREAT TO TRIGGER COLA
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="gantt-legend">
        <div className="gantt-legend-item"><div className="gantt-legend-box" style={{ background: '#ff3366' }}></div>EVASION</div>
        <div className="gantt-legend-item"><div className="gantt-legend-box" style={{ background: '#00e5ff' }}></div>RECOVERY</div>
        <div className="gantt-legend-item"><div className="gantt-legend-box gantt-cooldown-box"></div>COOLDOWN</div>
        <div className="gantt-legend-item"><div style={{ width: '2px', height: '12px', background: '#00ff88' }}></div>NOW</div>
      </div>
    </div>
  );
}
