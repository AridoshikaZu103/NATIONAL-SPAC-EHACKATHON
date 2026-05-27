import { useState } from 'react';
import EarthGlobe from './components/EarthGlobe';
import { ConjunctionBullseye, ManeuverTimeline, FleetFuelStatus, ActiveCDMs } from './components/DashboardPanels';
import { useSimulation } from './lib/SimulationEngine';
import './App.css';

function App() {
  const sim = useSimulation();

  // Format time as T+XXXXs
  const formattedTime = `T+${sim.time.toString().padStart(6, '0')}s`;

  return (
    <div style={{
      minHeight: '100vh',
      background: '#050a12',
      fontFamily: "'Courier New', Courier, monospace",
      color: '#00d4ff',
      display: 'flex',
      flexDirection: 'column',
      padding: '12px',
      boxSizing: 'border-box'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: '12px',
        borderBottom: '1px solid rgba(0, 212, 255, 0.2)',
        marginBottom: '12px'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.2rem', letterSpacing: '2px', textTransform: 'uppercase' }}>
            <span style={{ color: '#00ffff' }}>⯁ ORBITAL INSIGHT</span>
          </h1>
          <div style={{ fontSize: '0.6rem', color: '#666', marginTop: '2px', letterSpacing: '1px' }}>
            AUTONOMOUS CONSTELLATION MANAGER v1.0
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.7rem', color: '#666' }}>EPOCH</span>
            <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{formattedTime}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00ff88', boxShadow: '0 0 8px #00ff88' }}></div>
            <span style={{ fontSize: '0.7rem', color: '#00ff88' }}>ONLINE</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <StatBox label="SATS" value={sim.satellites.length.toString()} />
          <StatBox label="DEBRIS" value={sim.debris.length.toString()} />
          <StatBox label="CDMS" value={sim.cdms.length.toString()} color="#ffaa00" />
          <StatBox label="COLLISIONS" value="0" color="#ff4444" />
        </div>
      </div>

      {/* Main Content */}
      <div style={{ display: 'flex', flex: 1, gap: '12px', minHeight: 0 }}>
        
        {/* Left Panel: Earth Globe */}
        <div style={{
          flex: 2,
          border: '1px solid rgba(0, 212, 255, 0.15)',
          borderRadius: '4px',
          background: '#0a0f18',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0, 212, 255, 0.1)' }}>
            <span style={{ fontSize: '0.8rem', letterSpacing: '1px' }}>GROUND TRACK & 3D GLOBE</span>
            <div style={{ display: 'flex', gap: '12px', fontSize: '0.7rem' }}>
              <label><input type="checkbox" defaultChecked /> DEBRIS</label>
              <label><input type="checkbox" defaultChecked /> TRAILS</label>
            </div>
          </div>
          <div style={{ flex: 1, position: 'relative' }}>
            <EarthGlobe sim={sim} />
            
            {/* Legend Overlay */}
            <div style={{ position: 'absolute', bottom: '12px', left: '12px', display: 'flex', gap: '12px', fontSize: '0.65rem', background: 'rgba(0,0,0,0.5)', padding: '4px 8px', borderRadius: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width:'6px', height:'6px', background:'#00d4ff', borderRadius:'50%' }}></div> SATELLITE</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width:'6px', height:'6px', background:'#4466ff', borderRadius:'50%' }}></div> DEBRIS</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width:'6px', height:'6px', background:'#ffaa00', borderRadius:'50%' }}></div> CDM WARNING</div>
            </div>
          </div>
        </div>

        {/* Right Panel: Dashboard Data */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          
          {/* Top Row: Bullseye & Fuel */}
          <div style={{ display: 'flex', gap: '12px', height: '220px' }}>
            <Panel title="CONJUNCTION BULLSEYE" extra={
              <select 
                value={sim.selectedSatId} 
                onChange={e => sim.setSelectedSatId(e.target.value)}
                style={{ background: 'transparent', color: '#00d4ff', border: '1px solid rgba(0,212,255,0.3)', padding: '2px', fontSize: '0.7rem' }}
              >
                {sim.satellites.map(s => <option key={s.id} value={s.id} style={{ background: '#0a0f18' }}>{s.name}</option>)}
              </select>
            }>
              <ConjunctionBullseye selectedSatId={sim.selectedSatId} threats={sim.threats} />
            </Panel>
            <Panel title="FLEET FUEL STATUS">
              <FleetFuelStatus satellites={sim.satellites} />
            </Panel>
          </div>

          {/* Middle Row: Timeline */}
          <div style={{ height: '200px' }}>
            <Panel title="MANEUVER TIMELINE" extra={<span style={{fontSize:'0.6rem'}}>NOW: {formattedTime}</span>}>
              <ManeuverTimeline time={sim.time} timeline={sim.timeline} />
            </Panel>
          </div>

          {/* Bottom Row: CDMs & Inspector */}
          <div style={{ display: 'flex', gap: '12px', flex: 1 }}>
            <div style={{ flex: 2 }}>
              <Panel title="ACTIVE CONJUNCTION DATA MESSAGES" extra={<span style={{background:'#ff4444', color:'#000', padding:'0 6px', borderRadius:'10px'}}>{sim.cdms.length}</span>}>
                <ActiveCDMs cdms={sim.cdms} />
              </Panel>
            </div>
            <div style={{ flex: 1 }}>
              <Panel title="SATELLITE INSPECTOR">
                <SatelliteInspector sat={sim.satellites.find(s => s.id === sim.selectedSatId)} />
              </Panel>
            </div>
          </div>

        </div>
      </div>

      {/* Footer Controls */}
      <div style={{
        marginTop: '12px',
        padding: '8px 12px',
        background: '#0a0f18',
        border: '1px solid rgba(0, 212, 255, 0.15)',
        borderRadius: '4px',
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        fontSize: '0.8rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: '#666' }}>SIM STEP</span>
          <select 
            value={sim.stepSizeStr} 
            onChange={e => sim.setStepSizeStr(e.target.value as '10min'|'1hr')}
            style={{ background: 'transparent', color: '#fff', border: '1px solid #444', padding: '4px' }}
          >
            <option value="10min">10min</option>
            <option value="1hr">1hr</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '4px' }}>
          <button onClick={() => sim.advanceStep()} style={btnStyle}>▶ STEP</button>
          <button onClick={() => sim.setIsRunning(!sim.isRunning)} style={{...btnStyle, color: sim.isRunning ? '#ff4444' : '#00d4ff'}}>
            {sim.isRunning ? '◼ STOP' : '▶ AUTO'}
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderLeft: '1px solid #333', paddingLeft: '20px' }}>
          <span style={{ color: '#666' }}>SPEED</span>
          {[0.5, 1, 2, 5, 10].map(s => (
            <button 
              key={s} 
              onClick={() => sim.setSpeedMult(s)}
              style={{...btnStyle, background: sim.speedMult === s ? 'rgba(0,212,255,0.2)' : 'transparent'}}
            >{s}x</button>
          ))}
        </div>

        <div style={{ flex: 1 }}></div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button style={btnStyle}>+ DEMO DATA</button>
          <button onClick={sim.injectThreats} style={{...btnStyle, border: '1px solid #ff4444', color: '#ff4444', background: 'rgba(255,68,68,0.1)'}}>
            ⚠ THREATS
          </button>
        </div>
      </div>

    </div>
  );
}

// Helpers
function StatBox({ label, value, color = '#00d4ff' }: { label: string, value: string, color?: string }) {
  return (
    <div style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '4px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '60px' }}>
      <div style={{ fontSize: '1.2rem', color }}>{value}</div>
      <div style={{ fontSize: '0.5rem', color: '#666' }}>{label}</div>
    </div>
  );
}

function Panel({ title, extra, children }: { title: string, extra?: React.ReactNode, children: React.ReactNode }) {
  return (
    <div style={{ border: '1px solid rgba(0, 212, 255, 0.15)', background: '#0a0f18', display: 'flex', flexDirection: 'column', flex: 1, borderRadius: '4px', overflow: 'hidden' }}>
      <div style={{ padding: '6px 12px', background: 'rgba(0,212,255,0.05)', borderBottom: '1px solid rgba(0,212,255,0.1)', fontSize: '0.7rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>{title}</span>
        {extra}
      </div>
      <div style={{ padding: '12px', flex: 1, overflow: 'hidden' }}>
        {children}
      </div>
    </div>
  );
}

function SatelliteInspector({ sat }: { sat?: any }) {
  if (!sat) return <div style={{ color: '#666', fontSize: '0.7rem', textAlign: 'center', marginTop: '40px' }}>Click a satellite on the map to inspect</div>;
  
  return (
    <div style={{ fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <div style={{ color: '#00d4ff', fontWeight: 'bold', borderBottom: '1px solid rgba(0,212,255,0.2)', paddingBottom: '4px', marginBottom: '4px' }}>{sat.name}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{color:'#666'}}>STATUS</span><span style={{color:'#00ff88'}}>NOMINAL</span></div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{color:'#666'}}>LAT</span><span>{sat.pos.lat.toFixed(1)}°</span></div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{color:'#666'}}>LON</span><span>{sat.pos.lon.toFixed(1)}°</span></div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{color:'#666'}}>ALT</span><span>{sat.pos.alt.toFixed(0)} km</span></div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{color:'#666'}}>FUEL</span><span>{sat.fuelKg.toFixed(2)} kg ({Math.round(sat.fuelPercent)}%)</span></div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{color:'#666'}}>SLOT DRIFT</span><span>{sat.drift.toFixed(3)} km</span></div>
    </div>
  );
}

const btnStyle = {
  background: 'transparent',
  border: '1px solid rgba(0,212,255,0.3)',
  color: '#00d4ff',
  padding: '4px 12px',
  cursor: 'pointer',
  fontSize: '0.7rem',
  borderRadius: '2px',
  fontFamily: 'inherit'
};

export default App;
