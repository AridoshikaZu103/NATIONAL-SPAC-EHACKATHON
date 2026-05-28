# Project AETHER - Autonomous Constellation Manager

An advanced Autonomous Constellation Manager (ACM) built for the **National Space Hackathon 2026**. This system features a high-performance Python/FastAPI backend for numerical orbital propagation and a stunning React/Three.js frontend dashboard to provide real-time situational awareness (SSA).

## 🚀 Key Features

### 1. High-Fidelity 3D WebGL Globe
- Built using **Three.js**, porting photorealistic textures (Bump maps, Specular reflections, Atmospheric clouds).
- Dynamically maps ECI (Earth-Centered Inertial) state vectors into 3D Cartesian space.
- Plots **6 Active Satellites (Cyan)**, **518 Debris Fragments (Blue)**, and active **Threats (Red)**.
- Renders the 6 global Ground Station communication hubs as **Green Triangles**.

### 2. Operational Flight Dynamics Dashboard
- **Ground Track Map (Mercator)**: Tracks historical paths, 90-minute predictive trajectories, and overlays the dynamic "Terminator Line" shadow.
- **Conjunction Bullseye Plot**: A custom polar scatter chart centering the target satellite, mapping Time to Closest Approach (TCA) as radial distance, and dynamically color-coding risk (Safe/Warning/Critical).
- **Resource Heatmaps**: Features live fleet propellant gauges and a **Δv Cost Analysis** line chart comparing "Fuel Consumed vs. Collisions Avoided".
- **Maneuver Timeline (Gantt)**: Chronologically schedules Evasion and Recovery burns across the constellation, including the mandatory 600-second thermal cooldowns.
- **Simulation Control Panel**: Features an "AUTO ON" loop to advance the simulation clock iteratively, and a "SPAWN THREAT" trigger for testing COLA behavior.

### 3. Backend Physics Engine
- **FastAPI / Python**: Exposes the required REST endpoints (`/api/telemetry`, `/api/maneuver/schedule`, `/api/simulate/step`).
- Integrates a numerical propagator utilizing Runge-Kutta integration to step physics forward.
- **Cloud Database (PostgreSQL)**: Fully integrated with a remote Neon/Supabase PostgreSQL database to log telemetry and executed maneuvers.

---

## 💻 Setup & Deployment

### Method 1: Docker (Official Hackathon Grader Setup)
The project includes a root `Dockerfile` using the mandated `ubuntu:22.04` base image. It builds both the frontend and backend, and exposes the required **Port 8000**.
Because the database is hosted remotely on Neon, **no local database setup is required**.

```bash
# 1. Build the Docker image
docker build -t project-aether .

# 2. Run the container, binding to port 8000
docker run -p 8000:8000 project-aether
```
Once running, you can access the dashboard and API directly at `http://localhost:8000`.

### Method 2: Local Development
To run the components separately with Hot Module Replacement (HMR):

#### Backend:
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Or .\.venv\Scripts\activate on Windows
pip install -r requirements.txt
python main.py
```

#### Frontend:
```bash
cd frontend
npm install
npm run dev
```
Navigate to `http://localhost:5173` to view the UI.

---

## 🌎 Ground Stations Reference
The backend ensures maneuvers are only scheduled if the satellite has line-of-sight to one of these hubs:
1. **IIT Delhi** (India)
2. **Svalbard** (Norway)
3. **Goldstone** (California, USA)
4. **Punta Arenas** (Chile)
5. **ISTRAC** (India)
6. **McMurdo** (Antarctica)

---
*Built for the 2026 Orbital Debris Avoidance & Constellation Management System Challenge.*
