# Orbital Insight - SSA Dashboard

A fully responsive, 3D WebGL dashboard for Space Situational Awareness (SSA), demonstrating collision avoidance algorithms (COLA) and constellation tracking. 

## Features
- **Live 3D Globe Simulation**: Built with React and Three.js.
- **Walker Delta Constellation**: Tracks 6 active satellites orbiting in a uniform pattern.
- **Debris Belt Tracking**: Simulates 518 debris objects orbiting Earth.
- **Collision Avoidance (COLA)**: Triggers an alert when threat debris gets too close to an active satellite.
- **Play/Pause Engine**: Allows pausing the simulation time without freezing the viewport navigation.
- **Responsive Design**: Adapts cleanly from desktop displays to mobile phones without overlapping panels.

---

## Visual Legend

| Symbol | Color | Representation | Description |
| :--- | :--- | :--- | :--- |
| **◆** Diamond | <span style="color:#00ffff">Cyan</span> | **Active Satellites (α1-α6)** | A 6-satellite Walker Delta constellation at 550km altitude, moving counter-clockwise. |
| **●** Dot | <span style="color:#4488ff">Blue</span> | **Debris Field** | 518 tracked debris items (dead satellites, rockets, bolts) forming an orbital belt. |
| **■** Square | <span style="color:#ff0000">Red</span> | **Threat Object** | A piece of debris injected directly onto a collision path with α1. |
| **▲** Triangle | <span style="color:#00ff00">Green</span> | **Ground Stations** | 6 ground communication hubs required for uplinking burn commands. |
| **--** Line | <span style="color:#ffcc00">Yellow (Dashed)</span> | **Terminator Line** | The day/night boundary. Satellites switch to battery power on the dark side. |
| **--** Ring | <span style="color:#666666">Gray (Dashed)</span> | **Orbital Ring** | The primary 550km altitude circular orbital path. |

---

## Ground Stations Reference

The following ground stations are physically placed on the 3D globe:

| Station Name | Latitude | Longitude | Location |
| :--- | :--- | :--- | :--- |
| **IIT Delhi** | 28.54° N | 77.19° E | India |
| **Svalbard** | 78.22° N | 15.62° E | Norway (Arctic) |
| **Goldstone** | 35.42° N | 116.89° W | California, USA |
| **Punta Arenas** | 53.15° S | 70.90° W | Chile |
| **ISTRAC** | 13.03° N | 77.51° E | India |
| **McMurdo** | 77.84° S | 166.66° E | Antarctica |

---

## Setup & Running the Application

This project features a React/Vite frontend and a FastAPI backend. Both must be running simultaneously.

### 1. Backend Setup
The backend handles the Python-based orbital mechanics propagation and API endpoints.

```bash
# 1. Navigate to the project root
cd CODE/NATIONAL_SPACE_HACKATHON

# 2. Activate the virtual environment
# Windows:
.\.venv\Scripts\activate
# Mac/Linux:
source .venv/bin/activate

# 3. Start the FastAPI server (runs on port 8000)
python backend/main.py
```

### 2. Frontend Setup
The frontend renders the 3D dashboard using Three.js and React.

```bash
# 1. Navigate to the frontend directory
cd CODE/NATIONAL_SPACE_HACKATHON/frontend

# 2. Install dependencies (First time only)
npm install

# 3. Start the Vite dev server (runs on port 5173)
npm run dev
```

### 3. View the Dashboard
Open your web browser and navigate to:
**[http://localhost:5173](http://localhost:5173)**
