"""
Orbital mechanics module for satellite propagation
"""
import numpy as np
from scipy.integrate import odeint
from typing import Tuple, List

class OrbitalState:
    """6D state vector: [x, y, z, vx, vy, vz]"""
    
    def __init__(self, position: np.ndarray, velocity: np.ndarray):
        self.position = np.array(position)
        self.velocity = np.array(velocity)
    
    def to_array(self) -> np.ndarray:
        """Convert to 6D state vector"""
        return np.concatenate([self.position, self.velocity])
    
    @classmethod
    def from_array(cls, state: np.ndarray):
        """Create from 6D state vector"""
        return cls(state[:3], state[3:])


class PropagationEngine:
    """Runge-Kutta 4th order + J2 perturbation propagator"""
    
    # Constants
    EARTH_RADIUS = 6371.0  # km
    EARTH_MU = 398600.4418  # km^3/s^2
    J2 = 0.00108263  # J2 perturbation coefficient
    
    def __init__(self, dt: float = 10.0, max_steps: int = 10000):
        self.dt = dt  # time step (seconds)
        self.max_steps = max_steps
    
    def rk4_step(self, state: np.ndarray, dt: float) -> np.ndarray:
        """Single RK4 integration step"""
        k1 = self._derivatives(state)
        k2 = self._derivatives(state + 0.5 * dt * k1)
        k3 = self._derivatives(state + 0.5 * dt * k2)
        k4 = self._derivatives(state + dt * k3)
        
        return state + (dt / 6.0) * (k1 + 2*k2 + 2*k3 + k4)
    
    def _derivatives(self, state: np.ndarray) -> np.ndarray:
        """Calculate state derivatives including J2 perturbation"""
        r_vec = state[:3]
        v_vec = state[3:]
        r = np.linalg.norm(r_vec)
        
        # Base acceleration (Kepler + J2)
        a_kepler = -self.EARTH_MU / r**3 * r_vec
        
        # J2 perturbation
        z2_r2 = (r_vec[2]**2) / (r**2)
        a_j2 = 1.5 * self.J2 * (self.EARTH_MU * self.EARTH_RADIUS**2 / r**5) * r_vec
        a_j2 = a_j2 * (5 * z2_r2 - 1)
        a_j2[2] *= 5  # z-component
        
        a_total = a_kepler + a_j2
        
        return np.concatenate([v_vec, a_total])
    
    def propagate(self, initial_state: OrbitalState, duration: float) -> List[Tuple[float, OrbitalState]]:
        """Propagate satellite for given duration"""
        trajectory = []
        state = initial_state.to_array()
        t = 0.0
        
        while t < duration and len(trajectory) < self.max_steps:
            trajectory.append((t, OrbitalState.from_array(state)))
            state = self.rk4_step(state, self.dt)
            t += self.dt
        
        return trajectory

    @staticmethod
    def eci_to_geodetic(position: np.ndarray, time_sec: float) -> Tuple[float, float, float]:
        """Convert ECI to Geodetic (Lat, Lon, Alt) approximating Earth rotation"""
        x, y, z = position
        r = np.linalg.norm(position)
        
        # Earth rotation (2pi per 86400 seconds)
        theta = time_sec * (2 * np.pi / 86400.0)
        
        lat = np.arcsin(z / r) * (180.0 / np.pi)
        lon = (np.arctan2(y, x) - theta) * (180.0 / np.pi)
        
        # Normalize lon to -180 to 180
        lon = (lon + 180) % 360 - 180
        
        alt = r - PropagationEngine.EARTH_RADIUS
        return lat, lon, alt


class SpatialIndexing:
    """KD-Tree for conjunction detection"""
    
    def __init__(self):
        self.tree = None
        self.positions = None
    
    def build_index(self, positions: np.ndarray):
        """Build KD-tree from position array"""
        from scipy.spatial import cKDTree
        self.tree = cKDTree(positions)
        self.positions = positions
    
    def query_neighbors(self, position: np.ndarray, radius: float) -> List[int]:
        """Find all satellites within radius"""
        if self.tree is None:
            return []
        neighbors = self.tree.query_ball_point(position, radius)
        return neighbors
