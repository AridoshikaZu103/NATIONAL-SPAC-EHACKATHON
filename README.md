# Orbital Insight Dashboard

Autonomous Constellation Manager v1.0 - A "submission-ready" React frontend demonstrating live tracking of satellites, space debris, and real-time Conjunction Data Messages (CDMs) using simulated orbital mechanics.

## Features
- **Live 3D Earth Globe:** Fully interactive high-resolution 3D view of satellites and debris.
- **Conjunction Bullseye:** Radar-style tracking of threat objects approaching satellites.
- **Active CDMs:** Table showing calculated Time to Closest Approach (TCA) and Risk metrics.
- **Maneuver Timeline:** Visualization of evasion and recovery burns triggered autonomously.
- **Fleet Fuel Status:** Live tracking of satellite fuel levels during evasion maneuvers.
- **Simulation Engine:** Built-in React state engine handling 6 satellites, 518 background debris objects, and dynamically injected threats.

## Quickstart

### Prerequisites
- Node.js v18+
- npm or yarn

### Setup
1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open your browser to `http://localhost:5173`.

### Usage
- Use the **SIM STEP** dropdown to control time jump resolution.
- Click **▶ AUTO** to start the simulation loop.
- Change the **SPEED** multiplier (e.g., 10x) for faster visualization.
- Click **⚠ THREATS** to inject objects on collision courses with the fleet and watch the autonomous COLA (Collision Avoidance) engine react!
