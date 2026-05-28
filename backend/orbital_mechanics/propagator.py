"""
Orbital mechanics module for satellite propagation
Pure Python implementation (no numpy/scipy) for Vercel serverless deployment.
"""
import math
from typing import Tuple, List


def _vec_add(a, b):
    return [a[0]+b[0], a[1]+b[1], a[2]+b[2]]

def _vec_sub(a, b):
    return [a[0]-b[0], a[1]-b[1], a[2]-b[2]]

def _vec_scale(a, s):
    return [a[0]*s, a[1]*s, a[2]*s]

def _vec_norm(a):
    return math.sqrt(a[0]**2 + a[1]**2 + a[2]**2)

def _vec_dot(a, b):
    return a[0]*b[0] + a[1]*b[1] + a[2]*b[2]

def _vec_cross(a, b):
    return [
        a[1]*b[2] - a[2]*b[1],
        a[2]*b[0] - a[0]*b[2],
        a[0]*b[1] - a[1]*b[0]
    ]

def _vec_concat(a, b):
    return list(a) + list(b)


class OrbitalState:
    """6D state vector: [x, y, z, vx, vy, vz]"""

    def __init__(self, position, velocity):
        self.position = list(position)
        self.velocity = list(velocity)

    def to_array(self):
        """Convert to 6D state vector"""
        return self.position + self.velocity

    @classmethod
    def from_array(cls, state):
        """Create from 6D state vector"""
        return cls(state[:3], state[3:])


class PropagationEngine:
    """Runge-Kutta 4th order + J2 perturbation propagator"""

    # Constants
    EARTH_RADIUS = 6371.0  # km
    EARTH_MU = 398600.4418  # km^3/s^2
    J2 = 0.00108263  # J2 perturbation coefficient

    def __init__(self, dt: float = 10.0, max_steps: int = 10000):
        self.dt = dt
        self.max_steps = max_steps

    def rk4_step(self, state, dt: float):
        """Single RK4 integration step"""
        k1 = self._derivatives(state)
        s2 = [state[i] + 0.5 * dt * k1[i] for i in range(6)]
        k2 = self._derivatives(s2)
        s3 = [state[i] + 0.5 * dt * k2[i] for i in range(6)]
        k3 = self._derivatives(s3)
        s4 = [state[i] + dt * k3[i] for i in range(6)]
        k4 = self._derivatives(s4)

        return [state[i] + (dt / 6.0) * (k1[i] + 2*k2[i] + 2*k3[i] + k4[i]) for i in range(6)]

    def _derivatives(self, state):
        """Calculate state derivatives including J2 perturbation"""
        r_vec = state[:3]
        v_vec = state[3:]
        r = _vec_norm(r_vec)

        # Base acceleration (Kepler)
        factor = -self.EARTH_MU / r**3
        a_kepler = _vec_scale(r_vec, factor)

        # J2 perturbation
        z2_r2 = (r_vec[2]**2) / (r**2)
        j2_factor = 1.5 * self.J2 * (self.EARTH_MU * self.EARTH_RADIUS**2 / r**5)
        a_j2 = [r_vec[i] * j2_factor * (5 * z2_r2 - 1) for i in range(3)]
        a_j2[2] *= 5  # z-component extra factor

        a_total = _vec_add(a_kepler, a_j2)

        return v_vec + a_total  # concatenate [v, a]

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
    def eci_to_geodetic(position, time_sec: float) -> Tuple[float, float, float]:
        """Convert ECI to Geodetic (Lat, Lon, Alt)"""
        x, y, z = position[0], position[1], position[2]
        r = _vec_norm(position)

        # Earth rotation
        theta = time_sec * (2 * math.pi / 86400.0)

        lat = math.asin(max(-1, min(1, z / r))) * (180.0 / math.pi)
        lon = (math.atan2(y, x) - theta) * (180.0 / math.pi)

        # Normalize lon to -180 to 180
        lon = (lon + 180) % 360 - 180

        alt = r - PropagationEngine.EARTH_RADIUS
        return lat, lon, alt


class SpatialIndexing:
    """Simple brute-force spatial search (replaces scipy KD-Tree)"""

    def __init__(self):
        self.positions = None

    def build_index(self, positions):
        """Store positions for neighbor search"""
        self.positions = positions

    def query_neighbors(self, position, radius: float) -> List[int]:
        """Find all satellites within radius (brute force)"""
        if self.positions is None:
            return []
        neighbors = []
        for i, pos in enumerate(self.positions):
            dist = _vec_norm(_vec_sub(pos, position))
            if dist <= radius:
                neighbors.append(i)
        return neighbors
