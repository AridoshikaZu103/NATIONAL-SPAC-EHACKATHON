"""
Global Simulation State for Autonomous Constellation Manager
"""
import numpy as np

class SimulationState:
    def __init__(self):
        self.time = 0.0 # T+ seconds
        self.satellites = []
        self.debris = []
        self.threats = []
        self.cdms = []
        self.timeline = []
        
        self.init_satellites()
        self.init_debris()
        
    def init_satellites(self):
        EARTH_RADIUS = 6371.0
        LEO_ALT = 550.0
        r_orb = EARTH_RADIUS + LEO_ALT
        # Rough circular orbit velocity: sqrt(mu/r)
        mu = 398600.4418
        v_orb = np.sqrt(mu / r_orb)
        
        for i in range(1, 7):
            # Spread out around the equator slightly inclined
            angle = (2 * np.pi / 6) * i
            
            # Position
            x = r_orb * np.cos(angle)
            y = r_orb * np.sin(angle)
            z = 0.0
            
            # Velocity (perpendicular)
            vx = -v_orb * np.sin(angle)
            vy = v_orb * np.cos(angle)
            vz = 1.0 # Slight inclination
            
            self.satellites.append({
                "id": f"alpha-0{i}",
                "name": f"SAT-Alpha-0{i}",
                "position": np.array([x, y, z]),
                "velocity": np.array([vx, vy, vz]),
                "fuel_kg": 50.0,
                "status": "NOMINAL",
                "drift": 0.0
            })
            
    def init_debris(self):
        EARTH_RADIUS = 6371.0
        LEO_ALT = 550.0
        r_orb = EARTH_RADIUS + LEO_ALT
        mu = 398600.4418
        v_orb = np.sqrt(mu / r_orb)
        
        np.random.seed(42)
        for i in range(518):
            angle = np.random.uniform(0, 2*np.pi)
            alt_var = np.random.uniform(-20, 20)
            r = r_orb + alt_var
            
            # Random slight inclinations
            inc = np.random.uniform(-0.1, 0.1)
            
            x = r * np.cos(angle)
            y = r * np.sin(angle)
            z = r * inc
            
            # Velocity
            v = np.sqrt(mu / r)
            vx = -v * np.sin(angle)
            vy = v * np.cos(angle)
            vz = v * np.random.uniform(-0.01, 0.01)
            
            self.debris.append({
                "id": f"deb-{i}",
                "position": np.array([x, y, z]),
                "velocity": np.array([vx, vy, vz])
            })

global_state = SimulationState()
