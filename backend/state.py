"""
Global Simulation State for Autonomous Constellation Manager
Pure Python implementation (no numpy).
"""
import math
import random

class SimulationState:
    def __init__(self):
        self.time = 0.0  # T+ seconds
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
        mu = 398600.4418
        v_orb = math.sqrt(mu / r_orb)

        for i in range(1, 7):
            angle = (2 * math.pi / 6) * i

            x = r_orb * math.cos(angle)
            y = r_orb * math.sin(angle)
            z = 0.0

            vx = -v_orb * math.sin(angle)
            vy = v_orb * math.cos(angle)
            vz = 1.0

            self.satellites.append({
                "id": f"alpha-0{i}",
                "name": f"SAT-Alpha-0{i}",
                "position": [x, y, z],
                "velocity": [vx, vy, vz],
                "fuel_kg": 50.0,
                "status": "NOMINAL",
                "drift": 0.0
            })

    def init_debris(self):
        EARTH_RADIUS = 6371.0
        LEO_ALT = 550.0
        r_orb = EARTH_RADIUS + LEO_ALT
        mu = 398600.4418

        random.seed(42)
        for i in range(518):
            angle = random.uniform(0, 2 * math.pi)
            alt_var = random.uniform(-20, 20)
            r = r_orb + alt_var

            inc = random.uniform(-0.1, 0.1)

            x = r * math.cos(angle)
            y = r * math.sin(angle)
            z = r * inc

            v = math.sqrt(mu / r)
            vx = -v * math.sin(angle)
            vy = v * math.cos(angle)
            vz = v * random.uniform(-0.01, 0.01)

            self.debris.append({
                "id": f"deb-{i}",
                "position": [x, y, z],
                "velocity": [vx, vy, vz]
            })

global_state = SimulationState()
