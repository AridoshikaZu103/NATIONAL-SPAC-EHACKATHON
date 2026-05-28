# Orbital Debris Avoidance & Constellation Management System

> **National Space Hackathon 2026** | Autonomous Space Situational Awareness (SSA) Dashboard

A full-stack real-time orbital simulation platform that tracks 6 satellites and 518 debris objects in LEO (Low Earth Orbit), featuring autonomous collision avoidance, 3D WebGL visualization, and mission-critical decision support.

---

## Key Features

| Feature | Description |
|---|---|
| **3D WebGL Globe** | Real Earth with day/night cycle, 6 orbit rings, satellite markers, 518 debris points, and threat visualization |
| **Ground Track (Mercator)** | NASA Blue Marble Earth image with live day/night terminator overlay |
| **COLA Engine** | Collision Avoidance — auto-fires evasion + recovery burns when TCA < 5 hours |
| **Random Threat Simulation** | Spawn debris targeting any satellite (alpha-01 to alpha-06) with 5-second countdown timer and center-screen COLLISION WARNING alert |
| **Satellite Status** | SAFE / DIED status labels on 2D map based on fuel level |
| **Live Telemetry** | Per-satellite altitude, velocity, lat/lon, inclination, and fuel monitoring |
| **Conjunction Bullseye Plot** | SVG radar showing threat distance/angle relative to selected satellite |
| **Proximity Operations** | Radar view of nearby objects with TCA countdown and color-coded risk levels |
| **Maneuver Gantt Timeline** | Visual timeline of evasion and recovery burns with dynamic time windowing |
| **Fleet Resource Dashboard** | Propellant bars, delta-V cost analysis, and mission budget tracking |
| **40 Ground Stations** | Global coverage from NASA DSN, ESA ESTRACK, ISRO, JAXA, CNSA networks (CSV + SQL) |
| **Interactive Tutorial** | 7-step guided walkthrough explaining every feature |
| **Threat Alert System** | Center-screen pulsing collision warning with shake animation and ACKNOWLEDGE button |
| **Toast Notifications** | Top-center notification system for all simulation events |
| **Reports & Analysis** | Live mission summary with fleet status, CDM logs, and maneuver history |
| **Responsive Design** | Works on desktop, tablet, and smartphone |
| **Custom Satellite Favicon** | SVG satellite icon replacing default Vite favicon |

---

## Architecture

```
Frontend (React + Vite)          Backend (FastAPI + Python)
--------------------------       ---------------------------
|  Landing Page           |      |  main.py (Uvicorn)      |
|  App.jsx (Dashboard)    | <--> |  routes.py (API)        |
|  EarthGlobe (Three.js)  |      |  state.py (Physics)     |
|  GroundTrackMap (SVG)    |      |  database.py (Neon PG)  |
|  BullseyePlot (SVG)     |      |  seed.sql (Schema)      |
|  ProximityView (SVG)     |      ---------------------------
|  ManeuverGantt (SVG)     |             |
|  ResourceDash (SVG)      |      PostgreSQL (Neon/Supabase)
|  HelpTutorial (Modal)    |      ---------------------------
|  Telemetry (CSS bars)    |      |  telemetry              |
--------------------------       |  maneuver_events         |
                                 |  cdm_log                 |
                                 |  operations_log          |
                                 |  ground_stations          |
                                 ---------------------------
```

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React 18 + Vite | UI framework and build tool |
| **3D Rendering** | Three.js + OrbitControls | WebGL Earth globe with textures |
| **Styling** | Vanilla CSS | Glassmorphism, animations, responsive |
| **Backend** | FastAPI + Uvicorn | REST API with async Python |
| **Physics** | RK4 Propagator (Python) | Orbital mechanics simulation |
| **Database** | PostgreSQL (Neon) | Telemetry, CDM, and maneuver storage |
| **Deployment** | Vercel (frontend) | Static hosting with API proxy |

---

## Simulation Process

### Orbital Mechanics
1. **Walker Delta Constellation**: 6 satellites at ~550 km altitude, 51.6 deg inclination
2. **RK4 Propagation**: 4th-order Runge-Kutta integrator for accurate orbit prediction
3. **Debris Cloud**: 518 tracked objects with independent orbital parameters
4. **J2 Perturbation**: Earth oblateness effects on orbital precession

### Collision Avoidance (COLA)
1. **Threat Detection**: Debris objects on collision course are identified
2. **CDM Generation**: Conjunction Data Messages with probability of collision (Pc)
3. **TCA Monitoring**: Time to Closest Approach tracked in real-time
4. **Auto-Evasion**: When TCA < 5 hours, COLA engine fires automatically
5. **Delta-V Budget**: Each evasion costs ~2.5 kg propellant, recovery burn returns to nominal orbit

### Day/Night Cycle
- **3D Globe**: DirectionalLight (sun) rotates based on simulation time
- **2D Map**: Terminator line with 23.5 deg axial tilt overlay

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/visualization/snapshot` | Current state: satellites, debris, threats, timeline |
| `POST` | `/api/simulate/step` | Advance simulation by `step_seconds` |
| `POST` | `/api/telemetry` | Inject telemetry data (threats, debris) |
| `GET` | `/api/health` | Backend health check |

### Snapshot Response Schema
```json
{
  "time": 3600,
  "timestamp": "2026-05-28T12:00:00Z",
  "satellites": [
    { "id": "alpha-01", "lat": 28.5, "lon": 77.2, "alt": 550, "velocity": 7.58, "fuel_kg": 47.5 }
  ],
  "debris_cloud": [[0, 45.2, -120.3, 580], ...],
  "threats": [
    { "id": "DEB-THR-1234", "targetSatId": "alpha-03", "timeToCollision": 7200, "pos": { "lat": 30, "lon": 80, "alt": 555 } }
  ],
  "timeline": [
    { "id": "burn-plan-...", "type": "EVASION", "satId": "alpha-01", "timeStart": 3600, "timeEnd": 4200 }
  ],
  "maneuver_count": 4
}
```

---

## Setup & Installation

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL (Neon or Supabase)

### Quick Start
```powershell
# Clone
git clone https://github.com/AridoshikaZu103/Orbital-Debris-Avoidance-Constellation-Management-System.git
cd Orbital-Debris-Avoidance-Constellation-Management-System

# One-command install + launch (recommended)
.\install_Launch.ps1

# Or manually:
# Backend
cd backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env   # Add DATABASE_URL

# Load ground stations (optional)
python load_ground_stations.py

# Frontend
cd ../frontend
npm install

# Launch both servers
cd ..
.\start.ps1
```

### Environment Variables
```env
# backend/.env
DATABASE_URL=postgresql://user:pass@host:5432/dbname
```

---

## Project Structure

```
NATIONAL_SPACE_HACKATHON/
|-- backend/
|   |-- main.py                    # FastAPI app entry point
|   |-- routes.py                   # API routes + physics engine
|   |-- state.py                    # Global simulation state
|   |-- database.py                 # PostgreSQL connection (Neon)
|   |-- seed.sql                    # Database schema
|   |-- GROUND_STATIONS_DATA.csv    # 40 ground stations worldwide
|   |-- load_ground_stations.py     # CSV -> PostgreSQL loader
|   |-- requirements.txt            # Python dependencies
|   |-- .env                        # Database credentials
|
|-- frontend/
|   |-- src/
|   |   |-- App.jsx                 # Main dashboard + state management
|   |   |-- App.css                 # Global styles + responsive
|   |   |-- assets/
|   |   |   |-- satellite.svg       # Custom satellite favicon
|   |   |-- components/
|   |   |   |-- LandingPage.jsx/css    # Splash screen + CSS satellite
|   |   |   |-- EarthGlobe.jsx         # 3D WebGL globe (Three.js)
|   |   |   |-- GroundTrackMap.jsx/css  # 2D Mercator map (NASA image)
|   |   |   |-- BullseyePlot.jsx/css   # Conjunction radar
|   |   |   |-- ProximityView.jsx/css  # Proximity operations radar
|   |   |   |-- ManeuverGantt.jsx/css  # Maneuver timeline
|   |   |   |-- ResourceDash.jsx/css   # Fleet fuel dashboard
|   |   |   |-- HelpTutorial.jsx/css   # Tutorial + toasts + alerts
|   |-- index.html
|   |-- vite.config.js
|
|-- install_Launch.ps1             # One-command install + launch
|-- start.ps1                      # PowerShell launcher (2 terminals)
|-- vercel.json               # Vercel deployment config
|-- .gitignore
|-- README.md
```

---

## Deployment

### Vercel (Frontend)
```json
// vercel.json
{
  "buildCommand": "cd frontend && npm install && npm run build",
  "outputDirectory": "frontend/dist",
  "rewrites": [
    { "source": "/api/(.*)", "destination": "https://your-backend.onrender.com/api/$1" }
  ]
}
```

### Backend (Render / Railway)
Deploy `backend/` as a Python web service with:
```
Build: pip install -r requirements.txt
Start: uvicorn main:app --host 0.0.0.0 --port 8000
```

---

## Ground Station Network

| Station | Location | Lat | Lon |
|---|---|---|---|
| IIT Delhi | New Delhi, India | 28.54 N | 77.19 E |
| Svalbard | Norway (Arctic) | 78.22 N | 15.62 E |
| Goldstone | California, USA | 35.42 N | 116.89 W |
| Punta Arenas | Chile | 53.15 S | 70.90 W |
| ISTRAC | Bangalore, India | 13.03 N | 77.51 E |
| McMurdo | Antarctica | 77.84 S | 166.66 E |

---

## Constellation Parameters

| Parameter | Value |
|---|---|
| Formation | Walker Delta 6/6/1 |
| Altitude | 550 km (LEO) |
| Inclination | 51.6 deg |
| Orbital Period | ~95.6 min |
| Velocity | ~7.58 km/s |
| Propellant | 50 kg hydrazine per satellite |
| Debris Tracked | 518 objects |
| Propagator | RK4 (4th-order Runge-Kutta) |

---

## License

MIT License. Built for the National Space Hackathon 2026.
