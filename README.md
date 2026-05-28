# Project AETHER — Autonomous Constellation Manager

Advanced Autonomous Constellation Manager (ACM) for the **National Space Hackathon 2026**. Features a high-performance Python/FastAPI backend with Runge-Kutta orbital propagation and a React/Three.js dashboard for real-time Space Situational Awareness (SSA).

## Features

### 3D WebGL Globe
- **Three.js** photorealistic Earth with bump maps, specular reflections, and atmospheric clouds
- 6 active satellites (cyan diamonds), 518 debris (blue dots), threats (red cubes), and 6 ground stations (green triangles)

### Visualization Modules
- **Ground Track (Mercator)** — Live CSS map with animated satellite markers, trail history, sinusoidal terminator, and ground station comm-range circles
- **Conjunction Bullseye** — Pure SVG polar chart: center = satellite, radius = TCA, color = risk level
- **Proximity Operations** — Radar sweep display with range rings showing nearby objects in real-time
- **Maneuver Timeline (Gantt)** — Chronological EVASION/RECOVERY burns with 600s thermal cooldown zones
- **Fleet Propellant** — Color-coded bar chart (green/yellow/red) for all 6 satellites
- **Delta-V Cost Analysis** — Fuel consumed vs. collisions avoided over simulation days
- **Multi-Satellite Telemetry** — Clickable selector for alpha-1 through alpha-6 telemetry

### Backend Physics Engine
- **FastAPI** REST endpoints: `/api/telemetry`, `/api/maneuver/schedule`, `/api/simulate/step`
- Runge-Kutta 4th-order integration with J2 perturbation
- Autonomous COLA (Collision Avoidance) engine

### Database (Neon PostgreSQL)
5 tables for full operational logging:
- `telemetry` — Satellite position/fuel snapshots
- `maneuver_events` — Evasion and recovery burns
- `cdm_log` — Conjunction Data Messages with risk levels
- `operations_log` — Audit trail of all simulation events
- `ground_stations` — Communication hub reference data

---

## Environment Variables

| Variable | Description | Required |
|:---------|:-----------|:---------|
| `DATABASE_URL` | Neon PostgreSQL connection string | Yes |
| `BACKEND_PORT` | Backend port (default: 8000) | No |

---

## Setup

### Docker (Hackathon Grader)
```bash
docker build -t project-aether .
docker run -p 8000:8000 project-aether
```

### Local Development
```bash
# Backend
cd backend
python -m venv .venv
.\.venv\Scripts\activate  # Windows
pip install -r requirements.txt
python main.py

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
```

### Vercel Deployment
1. Push to GitHub
2. Import in Vercel dashboard
3. Add `DATABASE_URL` environment variable
4. Deploy — `vercel.json` handles build + routing automatically

---

## Ground Stations

| Station | Location | Coordinates |
|:--------|:---------|:-----------|
| IIT Delhi | India | 28.54N, 77.19E |
| Svalbard | Norway | 78.22N, 15.62E |
| Goldstone | California, USA | 35.42N, 116.89W |
| Punta Arenas | Chile | 53.15S, 70.90W |
| ISTRAC | India | 13.03N, 77.51E |
| McMurdo | Antarctica | 77.84S, 166.66E |

---

## API Endpoints

| Method | Endpoint | Description |
|:-------|:---------|:-----------|
| GET | `/api/health` | Health check |
| GET | `/api/visualization/snapshot` | Full dashboard state |
| GET | `/api/ground-stations` | Ground station network |
| POST | `/api/telemetry` | Ingest threat/debris objects |
| POST | `/api/maneuver/schedule` | Schedule evasion burns |
| POST | `/api/simulate/step` | Advance simulation clock |

---

*Built for the 2026 Orbital Debris Avoidance & Constellation Management System Challenge.*
