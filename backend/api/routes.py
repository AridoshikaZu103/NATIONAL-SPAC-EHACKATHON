"""
API routes for orbital data
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import numpy as np
from orbital_mechanics import OrbitalState, PropagationEngine

router = APIRouter(prefix="/api", tags=["orbital"])

class OrbitInitRequest(BaseModel):
    """Initial orbit parameters"""
    position: list  # [x, y, z] in km
    velocity: list  # [vx, vy, vz] in km/s
    duration: float  # propagation duration in seconds

class SatelliteData(BaseModel):
    """Satellite telemetry"""
    time: float
    position: list
    velocity: list
    altitude: float

@router.post("/propagate")
async def propagate_orbit(request: OrbitInitRequest) -> dict:
    """Propagate satellite orbit"""
    try:
        initial_state = OrbitalState(request.position, request.velocity)
        engine = PropagationEngine()
        trajectory = engine.propagate(initial_state, request.duration)
        
        data = []
        for t, state in trajectory:
            r = np.linalg.norm(state.position)
            altitude = r - PropagationEngine.EARTH_RADIUS
            data.append({
                "time": t,
                "position": state.position.tolist(),
                "velocity": state.velocity.tolist(),
                "altitude": altitude
            })
        
        return {"trajectory": data}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/status")
async def orbital_status():
    """Get simulation status"""
    return {"status": "running"}
