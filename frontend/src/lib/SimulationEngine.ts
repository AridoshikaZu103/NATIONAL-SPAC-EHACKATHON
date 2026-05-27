import { useState, useCallback, useEffect } from 'react';

// Types
export interface Position {
  lat: number;
  lon: number;
  alt: number;
}

export interface Satellite {
  id: string;
  name: string;
  pos: Position;
  fuelKg: number; // Max 50
  fuelPercent: number; // 0-100
  drift: number;
  status: string;
}

export interface Debris {
  id: string;
  pos: Position;
}

export interface Threat {
  id: string;
  pos: Position;
  targetSatId: string;
  timeToCollision: number; // seconds
}

export interface CDM {
  id: string;
  risk: 'RED' | 'YELLOW';
  satName: string;
  debrisId: string;
  tca: string; 
  missDist: number; 
  relVel: number; 
}

export interface TimelineEvent {
  id: string;
  satId: string;
  timeStart: number;
  timeEnd: number;
  type: 'EVASION' | 'RECOVERY';
}

export interface GroundStation {
  id: string;
  name: string;
  lat: number;
  lon: number;
}

const GROUND_STATIONS: GroundStation[] = [
  { id: 'IITDL', name: 'IIT Delhi', lat: 28.5, lon: 77.2 },
  { id: 'SVLBRD', name: 'Svalbard', lat: 78.2, lon: 15.6 },
  { id: 'GSSTON', name: 'Goldstone', lat: 35.3, lon: -116.8 },
  { id: 'ESTRAK', name: 'ISTRAC', lat: 13.0, lon: 77.5 },
  { id: 'PARNA', name: 'Punta Arenas', lat: -53.1, lon: -70.9 },
  { id: 'MCMRDO', name: 'McMurdo', lat: -77.8, lon: 166.6 }
];

const API_BASE = 'http://localhost:8000/api';

export function useSimulation() {
  const [time, setTime] = useState(0); 
  const [isRunning, setIsRunning] = useState(false);
  const [speedMult, setSpeedMult] = useState<number>(10); 
  const [stepSizeStr, setStepSizeStr] = useState<'10min' | '1hr'>('10min');
  
  const [showDebris, setShowDebris] = useState(true);
  const [showTrails, setShowTrails] = useState(true);
  
  const [satellites, setSatellites] = useState<Satellite[]>([]);
  const [debris, setDebris] = useState<Debris[]>([]);
  const [threats, setThreats] = useState<Threat[]>([]);
  const [cdms, setCdms] = useState<CDM[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  
  const [selectedSatId, setSelectedSatId] = useState<string>('alpha-01');

  // Fetch snapshot from backend
  const fetchSnapshot = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/visualization/snapshot`);
      const data = await res.json();
      
      setTime(data.time);
      
      setSatellites(data.satellites.map((s: any) => ({
        id: s.id,
        name: s.name,
        pos: { lat: s.lat, lon: s.lon, alt: s.alt },
        fuelKg: s.fuel_kg,
        fuelPercent: (s.fuel_kg / 50) * 100,
        drift: 0,
        status: s.status
      })));
      
      setDebris(data.debris_cloud.map((d: any) => ({
        id: d[0],
        pos: { lat: d[1], lon: d[2], alt: d[3] }
      })));
      
      setThreats(data.threats || []);
      setCdms(data.cdms || []);
      setTimeline(data.timeline || []);
    } catch (err) {
      console.error("Error fetching snapshot:", err);
    }
  }, []);

  // Poll snapshot
  useEffect(() => {
    fetchSnapshot(); // initial fetch
    
    // Poll at 5Hz to get smooth updates if backend is stepped
    const interval = setInterval(fetchSnapshot, 200);
    return () => clearInterval(interval);
  }, [fetchSnapshot]);

  // Step function (calls backend)
  const advanceStep = useCallback(async () => {
    const stepSeconds = stepSizeStr === '1hr' ? 3600 : 600;
    try {
      await fetch(`${API_BASE}/simulate/step`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step_seconds: stepSeconds })
      });
      // Immediately fetch snapshot to reflect new state
      await fetchSnapshot();
    } catch (err) {
      console.error("Error advancing step:", err);
    }
  }, [stepSizeStr, fetchSnapshot]);

  // Main loop for AUTO mode
  useEffect(() => {
    if (!isRunning) return;
    
    // speedMult indicates how many steps to do per second?
    // In backend, stepping takes longer, let's limit it to a steady beat
    const interval = setInterval(() => {
      advanceStep();
    }, 1000 / (speedMult > 5 ? 5 : speedMult)); // Cap at 5 requests/sec to not overwhelm backend
    
    return () => clearInterval(interval);
  }, [isRunning, speedMult, advanceStep]);

  const injectThreats = async () => {
    // Generate artificial threats based on current satellite positions
    const newThreats = satellites.map((sat, i) => ({
      id: `thr-${Date.now()}-${i}`,
      type: 'THREAT',
      position: [0, 0, 0], // backend uses ECI, but backend handles this mock logic in telemetry for now
      targetSatId: sat.id,
      timeToCollision: 86400, // 24 hours away
    }));
    
    try {
      await fetch(`${API_BASE}/telemetry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          timestamp: new Date().toISOString(),
          objects: newThreats 
        })
      });
    } catch (err) {
      console.error("Error injecting threats:", err);
    }
  };

  return {
    time,
    isRunning,
    setIsRunning,
    speedMult,
    setSpeedMult,
    stepSizeStr,
    setStepSizeStr,
    showDebris,
    setShowDebris,
    showTrails,
    setShowTrails,
    advanceStep,
    satellites,
    debris,
    threats,
    cdms,
    timeline,
    selectedSatId,
    setSelectedSatId,
    injectThreats,
    groundStations: GROUND_STATIONS
  };
}
