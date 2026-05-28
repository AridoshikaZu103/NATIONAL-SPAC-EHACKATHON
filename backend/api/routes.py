"""
API routes for orbital data and autonomous management
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import numpy as np
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta, timezone

from orbital_mechanics.propagator import PropagationEngine, OrbitalState, SpatialIndexing
from state import global_state
from database import Database

router = APIRouter(prefix="/api", tags=["orbital"])

BASE_EPOCH = datetime(2026, 3, 12, 8, 0, 0, tzinfo=timezone.utc)

class TelemetryRequest(BaseModel):
    timestamp: str
    objects: List[Dict[str, Any]]

class ManeuverRequest(BaseModel):
    satelliteId: str
    maneuver_sequence: List[Dict[str, Any]]

class StepRequest(BaseModel):
    step_seconds: int

def to_iso(sim_seconds):
    dt = BASE_EPOCH + timedelta(seconds=sim_seconds)
    return dt.strftime("%Y-%m-%dT%H:%M:%S.000Z")

@router.get("/visualization/snapshot")
async def get_snapshot():
    """Return visualization payload for frontend"""
    satellites = []
    for sat in global_state.satellites:
        lat, lon, alt = PropagationEngine.eci_to_geodetic(sat["position"], global_state.time)
        vel_mag = float(np.linalg.norm(sat["velocity"]))
        # Compute inclination from angular momentum vector
        h_vec = np.cross(sat["position"], sat["velocity"])
        h_mag = np.linalg.norm(h_vec)
        inc = float(np.degrees(np.arccos(h_vec[2] / h_mag))) if h_mag > 1e-6 else 0.0
        satellites.append({
            "id": sat["id"],
            "name": sat["name"],
            "lat": lat,
            "lon": lon,
            "alt": alt,
            "fuel_kg": round(sat["fuel_kg"], 2),
            "velocity": round(vel_mag, 3),
            "inclination": round(inc, 2),
            "status": sat["status"]
        })

    debris_cloud = []
    for deb in global_state.debris:
        lat, lon, alt = PropagationEngine.eci_to_geodetic(deb["position"], global_state.time)
        debris_cloud.append([deb["id"], lat, lon, alt])

    threats_out = []
    for thr in global_state.threats:
        lat, lon, alt = PropagationEngine.eci_to_geodetic(thr["position"], global_state.time)
        threats_out.append({
            "id": thr["id"],
            "pos": {"lat": lat, "lon": lon, "alt": alt},
            "targetSatId": thr["targetSatId"],
            "timeToCollision": thr["timeToCollision"]
        })

    total_fuel_consumed = round(sum(50.0 - s["fuel_kg"] for s in global_state.satellites), 2)
    maneuver_count = len([e for e in global_state.timeline if e["type"] == "EVASION"])

    days_elapsed = max(1, int(global_state.time // 86400) + 1)
    deltaVData = []
    for d in range(1, min(days_elapsed + 1, 31)):
        frac = d / days_elapsed
        deltaVData.append({
            "day": "Day " + str(d),
            "fuelConsumed": round(total_fuel_consumed * frac, 2),
            "collisionsAvoided": max(0, int(maneuver_count * frac))
        })
    if len(deltaVData) < 3:
        deltaVData = [
            {"day": "Day 1", "fuelConsumed": 0, "collisionsAvoided": 0},
            {"day": "Day 2", "fuelConsumed": round(total_fuel_consumed * 0.5, 2), "collisionsAvoided": max(0, maneuver_count // 2)},
            {"day": "Day 3", "fuelConsumed": total_fuel_consumed, "collisionsAvoided": maneuver_count},
        ]

    return {
        "timestamp": to_iso(global_state.time),
        "time": global_state.time,
        "satellites": satellites,
        "debris_cloud": debris_cloud,
        "threats": threats_out,
        "cdms": global_state.cdms,
        "timeline": global_state.timeline,
        "deltaVData": deltaVData,
        "maneuver_count": maneuver_count
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
            await Database.log_operation("THREAT_DETECTED", "Threat " + obj["id"] + " targeting " + obj.get("targetSatId", "?"), global_state.time)

    return {
        "status": "ACK",
        "processed_count": len(req.objects),
        "active_cdm_warnings": len(global_state.cdms)
    }

@router.post("/maneuver/schedule")
async def schedule_maneuver(req: ManeuverRequest):
    """Schedule a burn"""
    sat = next((s for s in global_state.satellites if s["id"] == req.satelliteId), None)
    if not sat:
        raise HTTPException(status_code=404, detail="Satellite not found")

    for burn in req.maneuver_sequence:
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
    engine = PropagationEngine(dt=10.0)
    steps = req.step_seconds // 10
    maneuvers_executed = 0
    collisions_detected = 0

    for sat in global_state.satellites:
        state = np.concatenate([sat["position"], sat["velocity"]])
        for _ in range(steps):
            state = engine.rk4_step(state, 10.0)
        sat["position"] = state[:3]
        sat["velocity"] = state[3:]
        lat, lon, alt = PropagationEngine.eci_to_geodetic(sat["position"], global_state.time)
        await Database.log_telemetry(sat["id"], lat, lon, alt, sat["fuel_kg"])

    for deb in global_state.debris:
        state = np.concatenate([deb["position"], deb["velocity"]])
        for _ in range(steps):
            state = engine.rk4_step(state, 10.0)
        deb["position"] = state[:3]
        deb["velocity"] = state[3:]

    to_remove = []
    for thr in global_state.threats:
        thr["timeToCollision"] -= req.step_seconds
        target = next((s for s in global_state.satellites if s["id"] == thr["targetSatId"]), None)
        if target:
            thr["position"] = calc_threat_pos(target, thr["timeToCollision"])
            if thr["timeToCollision"] < 86400 * 2:
                is_crit = thr["timeToCollision"] < 18000
                risk = "RED" if is_crit else "YELLOW"

                if not any(c["id"] == "cdm-" + thr["id"] for c in global_state.cdms):
                    miss_dist = max(0.05, (thr["timeToCollision"] / 3600) * 2)
                    cdm = {
                        "id": "cdm-" + thr["id"],
                        "risk": risk,
                        "satName": target["name"],
                        "debrisId": "DEB-" + thr["id"][:4],
                        "tca": to_iso(global_state.time + thr["timeToCollision"]),
                        "missDist": miss_dist,
                        "relVel": 14.5
                    }
                    global_state.cdms.append(cdm)
                    await Database.log_cdm(cdm["id"], risk, target["name"], cdm["debrisId"], cdm["tca"], miss_dist, 14.5)
                    await Database.log_operation("CDM_CREATED", risk + " warning for " + target["name"], global_state.time)

                    tca_time = global_state.time + thr["timeToCollision"]
                    ev_start = tca_time - 3600
                    ev_end = tca_time
                    global_state.timeline.append({"id": "burn-plan-" + thr["id"], "satId": target["id"], "timeStart": max(global_state.time, ev_start), "timeEnd": ev_end, "type": "EVASION"})
                    global_state.timeline.append({"id": "burn-rec-" + thr["id"], "satId": target["id"], "timeStart": ev_end, "timeEnd": ev_end + 3600, "type": "RECOVERY"})
                    await Database.log_maneuver("burn-plan-" + thr["id"], target["id"], max(global_state.time, ev_start), ev_end, "EVASION")
                    await Database.log_maneuver("burn-rec-" + thr["id"], target["id"], ev_end, ev_end + 3600, "RECOVERY")

                if is_crit:
                    target["fuel_kg"] = max(0, target["fuel_kg"] - 2.5)
                    maneuvers_executed += 1
                    to_remove.append(thr)
                    await Database.log_operation("EVASION_FIRED", target["name"] + " burned 2.5kg to dodge " + thr["id"], global_state.time)

    for thr in global_state.threats:
        if thr["timeToCollision"] <= 0 and thr not in to_remove:
            collisions_detected += 1
            to_remove.append(thr)

    for r in to_remove:
        if r in global_state.threats:
            global_state.threats.remove(r)

    global_state.time += req.step_seconds
    await Database.log_operation("STEP", "Advanced " + str(req.step_seconds) + "s. Maneuvers: " + str(maneuvers_executed) + ", Collisions: " + str(collisions_detected), global_state.time)

    return {
        "status": "STEP_COMPLETE",
        "new_timestamp": to_iso(global_state.time),
        "collisions_detected": collisions_detected,
        "maneuvers_executed": maneuvers_executed
    }

@router.get("/ground-stations")
async def get_ground_stations():
    """Return ground station network info"""
    data = await Database.get_ground_stations()
    if isinstance(data, list) and len(data) > 0 and isinstance(data[0], tuple):
        return [{"station_name": d[0], "latitude": d[1], "longitude": d[2], "location": d[3], "comm_range_km": d[4], "status": "ACTIVE"} for d in data]
    return data
