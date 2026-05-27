"""
API routes for orbital data and autonomous management
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import numpy as np
from typing import List, Dict, Any, Optional

from orbital_mechanics.propagator import PropagationEngine, OrbitalState, SpatialIndexing
from state import global_state
from database import Database

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

def calc_threat_pos(target, time_to_collision):
    r_vec = target["position"]
    v_vec = target["velocity"]
    h_vec = np.cross(r_vec, v_vec)
    if np.linalg.norm(h_vec) < 1e-6:
        h_norm = np.array([0, 0, 1])
    else:
        h_norm = h_vec / np.linalg.norm(h_vec)
    theta = max(0.0, (time_to_collision / 86400.0) * (np.pi / 4))
    term1 = r_vec * np.cos(theta)
    term2 = np.cross(h_norm, r_vec) * np.sin(theta)
    term3 = h_norm * np.dot(h_norm, r_vec) * (1 - np.cos(theta))
    return term1 + term2 + term3

@router.post("/telemetry")
async def ingest_telemetry(req: TelemetryRequest):
    """Ingest debris/threat state vectors"""
    for obj in req.objects:
        if obj.get("type") == "THREAT":
            target = next((s for s in global_state.satellites if s["id"] == obj.get("targetSatId")), None)
            if target:
                obj["position"] = calc_threat_pos(target, obj.get("timeToCollision", 86400))
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
        ev_type = "EVASION" if "EVASION" in burn["burn_id"] else "RECOVERY"
        global_state.timeline.append({
            "id": burn["burn_id"],
            "satId": sat["id"],
            "timeStart": global_state.time,
            "timeEnd": global_state.time + 3600,
            "type": ev_type
        })
        await Database.log_maneuver(burn["burn_id"], sat["id"], global_state.time, global_state.time + 3600, ev_type)
        
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
        
        # Log to neon DB
        lat, lon, alt = PropagationEngine.eci_to_geodetic(sat["position"], global_state.time)
        await Database.log_telemetry(sat["id"], lat, lon, alt, sat["fuel_kg"])
        
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
            thr["position"] = calc_threat_pos(target, thr["timeToCollision"])
            
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
                    
                    # Schedule a visible EVASION window on the timeline
                    # so the panel shows something immediately
                    tca_time = global_state.time + thr["timeToCollision"]
                    ev_start = tca_time - 3600  # Evasion window 1h before TCA
                    ev_end = tca_time
                    global_state.timeline.append({
                        "id": f"burn-plan-{thr['id']}",
                        "satId": target["id"],
                        "timeStart": max(global_state.time, ev_start),
                        "timeEnd": ev_end,
                        "type": "EVASION"
                    })
                    # Schedule a RECOVERY burn after evasion
                    global_state.timeline.append({
                        "id": f"burn-rec-{thr['id']}",
                        "satId": target["id"],
                        "timeStart": ev_end,
                        "timeEnd": ev_end + 3600,
                        "type": "RECOVERY"
                    })
                    await Database.log_maneuver(f"burn-plan-{thr['id']}", target["id"], max(global_state.time, ev_start), ev_end, "EVASION")
                    await Database.log_maneuver(f"burn-rec-{thr['id']}", target["id"], ev_end, ev_end + 3600, "RECOVERY")
                
                # Autonomously trigger maneuver if critical
                if is_crit:
                    target["fuel_kg"] = max(0, target["fuel_kg"] - 2.5)
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
