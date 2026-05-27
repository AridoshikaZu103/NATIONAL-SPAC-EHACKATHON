"""
API routes for orbital data and autonomous management
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import numpy as np
from typing import List, Dict, Any, Optional

from orbital_mechanics.propagator import PropagationEngine, OrbitalState, SpatialIndexing
from state import global_state

router = APIRouter(prefix="/api", tags=["orbital"])

class TelemetryRequest(BaseModel):
    timestamp: str
    objects: List[Dict[str, Any]]

class ManeuverRequest(BaseModel):
    satelliteId: str
    maneuver_sequence: List[Dict[str, Any]]

class StepRequest(BaseModel):
    step_seconds: int

@router.get("/visualization/snapshot")
async def get_snapshot():
    """Return highly compressed JSON payload for frontend"""
    satellites = []
    for sat in global_state.satellites:
        # Convert ECI to Geodetic
        lat, lon, alt = PropagationEngine.eci_to_geodetic(sat["position"], global_state.time)
        satellites.append({
            "id": sat["id"],
            "name": sat["name"],
            "lat": lat,
            "lon": lon,
            "alt": alt,
            "fuel_kg": sat["fuel_kg"],
            "status": sat["status"]
        })
        
    debris_cloud = []
    for deb in global_state.debris:
        lat, lon, alt = PropagationEngine.eci_to_geodetic(deb["position"], global_state.time)
        debris_cloud.append([deb["id"], lat, lon, alt])
        
    # Also pass down threats and CDMs for the dashboard
    threats_out = []
    for thr in global_state.threats:
        lat, lon, alt = PropagationEngine.eci_to_geodetic(thr["position"], global_state.time)
        threats_out.append({
            "id": thr["id"],
            "pos": {"lat": lat, "lon": lon, "alt": alt},
            "targetSatId": thr["targetSatId"],
            "timeToCollision": thr["timeToCollision"]
        })
        
    return {
        "timestamp": f"T+{global_state.time}s",
        "time": global_state.time,
        "satellites": satellites,
        "debris_cloud": debris_cloud,
        "threats": threats_out,
        "cdms": global_state.cdms,
        "timeline": global_state.timeline
    }

@router.post("/telemetry")
async def ingest_telemetry(req: TelemetryRequest):
    """Ingest debris/threat state vectors"""
    # For hackathon demo, we translate incoming artificial threats directly
    for obj in req.objects:
        if obj.get("type") == "THREAT":
            # Initialize with a valid ECI position to avoid division by zero (NaN)
            target = next((s for s in global_state.satellites if s["id"] == obj.get("targetSatId")), None)
            if target:
                obj["position"] = target["position"] + np.array([2000.0, 2000.0, 0.0])
            else:
                obj["position"] = np.array([7000.0, 0.0, 0.0])
            global_state.threats.append(obj)
            
    return {
        "status": "ACK",
        "processed_count": len(req.objects),
        "active_cdm_warnings": len(global_state.cdms)
    }

@router.post("/maneuver/schedule")
async def schedule_maneuver(req: ManeuverRequest):
    """Schedule a burn"""
    # Simple validation for the demo
    sat = next((s for s in global_state.satellites if s["id"] == req.satelliteId), None)
    if not sat:
        raise HTTPException(status_code=404, detail="Satellite not found")
        
    for burn in req.maneuver_sequence:
        # Subtract fuel according to hackathon rules (approx 2.5kg per evasion)
        sat["fuel_kg"] = max(0, sat["fuel_kg"] - 2.5)
        global_state.timeline.append({
            "id": burn["burn_id"],
            "satId": sat["id"],
            "timeStart": global_state.time,
            "timeEnd": global_state.time + 3600,
            "type": "EVASION" if "EVASION" in burn["burn_id"] else "RECOVERY"
        })
        
    return {
        "status": "SCHEDULED",
        "validation": {
            "ground_station_los": True,
            "sufficient_fuel": sat["fuel_kg"] > 0,
            "projected_mass_remaining_kg": sat["fuel_kg"] + 500.0
        }
    }

@router.post("/simulate/step")
async def simulate_step(req: StepRequest):
    """Advance simulation physics"""
    engine = PropagationEngine(dt=10.0) # 10s integration steps
    steps = req.step_seconds // 10
    
    # 1. Propagate Satellites
    for sat in global_state.satellites:
        state = np.concatenate([sat["position"], sat["velocity"]])
        for _ in range(steps):
            state = engine.rk4_step(state, 10.0)
        sat["position"] = state[:3]
        sat["velocity"] = state[3:]
        
    # 2. Propagate Debris
    for deb in global_state.debris:
        state = np.concatenate([deb["position"], deb["velocity"]])
        for _ in range(steps):
            state = engine.rk4_step(state, 10.0)
        deb["position"] = state[:3]
        deb["velocity"] = state[3:]
        
    # 3. Propagate Threats & Detect Conjunctions
    new_cdms = []
    to_remove = []
    
    for thr in global_state.threats:
        thr["timeToCollision"] -= req.step_seconds
        
        target = next((s for s in global_state.satellites if s["id"] == thr["targetSatId"]), None)
        if target:
            # Simple linear interpolation towards target for the demo threat
            # In a real scenario, threat is just another object. 
            # We move the threat towards the satellite.
            dist_factor = max(0.01, thr["timeToCollision"] / 86400)
            thr["position"] = target["position"] + dist_factor * np.array([200, 200, 0])
            
            if thr["timeToCollision"] < 86400 * 2:
                is_crit = thr["timeToCollision"] < 18000
                risk = "RED" if is_crit else "YELLOW"
                
                # Deduplicate CDMs
                if not any(c["id"] == f"cdm-{thr['id']}" for c in global_state.cdms):
                    cdm = {
                        "id": f"cdm-{thr['id']}",
                        "risk": risk,
                        "satName": target["name"],
                        "debrisId": f"DEB-{thr['id'][:4]}",
                        "tca": f"T+{global_state.time + thr['timeToCollision']}s",
                        "missDist": max(0.05, (thr["timeToCollision"] / 3600) * 2),
                        "relVel": 14.5
                    }
                    global_state.cdms.append(cdm)
                
                # Autonomously trigger maneuver if critical
                if is_crit:
                    target["fuel_kg"] = max(0, target["fuel_kg"] - 2.5)
                    global_state.timeline.append({
                        "id": f"burn-ev-{global_state.time}",
                        "satId": target["id"],
                        "timeStart": global_state.time,
                        "timeEnd": global_state.time + 3600,
                        "type": "EVASION"
                    })
                    to_remove.append(thr)
                    
    # Clean up resolved threats
    for r in to_remove:
        if r in global_state.threats:
            global_state.threats.remove(r)
            
    global_state.time += req.step_seconds
    
    return {
        "status": "STEP_COMPLETE",
        "new_timestamp": f"T+{global_state.time}s",
        "collisions_detected": 0,
        "maneuvers_executed": len(to_remove)
    }
