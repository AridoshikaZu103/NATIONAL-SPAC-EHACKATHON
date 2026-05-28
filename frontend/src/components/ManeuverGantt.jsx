import React from 'react';
import './ManeuverGantt.css';

export default function ManeuverGantt({ timeline = [], currentTime = 0 }) {
  // Dynamic window: find the actual range of events, or default to currentTime window
  let minTime = currentTime - 3600;
  let maxTime = currentTime + 5 * 3600;

  if (timeline.length > 0) {
    const allStarts = timeline.map(e => e.timeStart);
    const allEnds = timeline.map(e => e.timeEnd);
    const evMin = Math.min(...allStarts);
    const evMax = Math.max(...allEnds);
    // Expand window to include all events
    minTime = Math.min(minTime, evMin - 1800);
    maxTime = Math.max(maxTime, evMax + 1800);
  }

  const windowStart = Math.max(0, minTime);
  const windowEnd = maxTime;
  const windowDuration = windowEnd - windowStart || 1;

  const rows = ['alpha-01', 'alpha-02', 'alpha-03', 'alpha-04', 'alpha-05', 'alpha-06'];

  const getLeftPct = (time) => {
    const clamped = Math.max(windowStart, Math.min(windowEnd, time));
    return ((clamped - windowStart) / windowDuration) * 100;
  };

  const getWidthPct = (start, end) => {
    if (end < windowStart || start > windowEnd) return 0;
    const s = Math.max(windowStart, start);
    const e = Math.min(windowEnd, end);
    return Math.max(1.5, ((e - s) / windowDuration) * 100); // Min 1.5% visible
  };

  const hasEvents = rows.map(satId => timeline.some(e => e.satId === satId));

  // Generate time labels based on window
  const hourSpan = Math.max(1, Math.ceil((windowEnd - windowStart) / 3600));
  const labelCount = Math.min(hourSpan + 1, 8);
  const labelStep = (windowEnd - windowStart) / (labelCount - 1);

  return (
    <div className="gantt-container">
      <div className="gantt-header">
        <h3 className="gantt-title">MANEUVER TIMELINE</h3>
        <span className="gantt-time-badge">T+{Math.round(currentTime / 3600)}h</span>
      </div>

      <div className="gantt-body">
        <div className="gantt-y-axis">
          {rows.map((sat, i) => (
            <div key={sat} className="gantt-y-label">
              <span className="gantt-sat-dot" style={{ background: hasEvents[i] ? '#ffaa00' : '#333' }}></span>
              {'\u03B1'}{i + 1}
            </div>
          ))}
        </div>

        <div className="gantt-grid">
          {/* Time guides */}
          {Array.from({ length: labelCount }, (_, h) => {
            const t = windowStart + h * labelStep;
            return (
              <div key={h} className="gantt-time-guide" style={{ left: (h / (labelCount - 1) * 100) + '%' }}>
                <span className="gantt-time-label">T+{Math.round(t / 3600)}h</span>
              </div>
            );
          })}

          {/* NOW line */}
          <div className="gantt-now-line" style={{ left: getLeftPct(currentTime) + '%' }} />

          {/* Event rows */}
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
                        <div className="gantt-event" style={{ left: left + '%', width: width + '%', background: color }} title={ev.type + ': ' + ev.id}>
                          {width > 8 ? ev.type : ''}
                        </div>
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

          {timeline.length === 0 && (
            <div className="gantt-empty">NO MANEUVERS SCHEDULED</div>
          )}
        </div>
      </div>

      <div className="gantt-legend">
        <div className="gantt-legend-item"><div className="gantt-legend-box" style={{ background: '#ff3366' }}></div>EVASION</div>
        <div className="gantt-legend-item"><div className="gantt-legend-box" style={{ background: '#00e5ff' }}></div>RECOVERY</div>
        <div className="gantt-legend-item"><div className="gantt-legend-box gantt-cooldown-box"></div>COOLDOWN</div>
        <div className="gantt-legend-item"><div style={{ width: '2px', height: '12px', background: '#00ff88' }}></div>NOW</div>
      </div>
    </div>
  );
}
