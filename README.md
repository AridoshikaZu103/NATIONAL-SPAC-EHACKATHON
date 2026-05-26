# Orbital Insight - Space Situational Awareness Dashboard

## Project Structure

```
NATIONAL_SPACE_HACKATHON/
├── frontend/                    # React + TypeScript frontend
│   ├── src/
│   │   ├── components/         # React components
│   │   ├── services/           # API clients
│   │   ├── types/              # TypeScript type definitions
│   │   └── App.tsx
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── tailwind.config.ts
│
├── backend/                     # FastAPI Python backend
│   ├── orbital_mechanics/       # Orbital propagation engine
│   │   ├── propagator.py       # RK4 + J2 propagator
│   │   └── __init__.py
│   ├── api/                     # API routes
│   │   ├── routes.py
│   │   └── __init__.py
│   ├── main.py                 # FastAPI application
│   ├── requirements.txt
│   └── .env
│
└── document_pdf.pdf            # Competition requirements
```

## Tech Stack

### Frontend

- **Vite** - Fast build tool
- **React 18** - UI library
- **TypeScript** - Type safety
- **TailwindCSS** - Styling
- **Deck.gl** - 2D high-performance rendering
- **Three.js** - Optional 3D globe
- **Recharts** - Data visualization

### Backend

- **FastAPI** - API framework
- **NumPy/SciPy** - Orbital mechanics
- **Pydantic** - Data validation
- **Python 3.9+** - Runtime

## Installation

### Frontend

```bash
cd frontend
npm install
npm run dev       # Start dev server (http://localhost:5173)
npm run build     # Build for production
```

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # macOS/Linux
pip install -r requirements.txt
python main.py          # Start server (http://localhost:8000)
```

## API Endpoints

- `POST /api/propagate` - Propagate satellite orbit
- `GET /api/status` - Get simulation status
- `GET /api/health` - Health check

## Development

1. Install Node.js (v18+) and Python (3.9+)
2. Install frontend deps: `npm install`
3. Install backend deps: `pip install -r requirements.txt`
4. Start both servers in separate terminals
5. Frontend proxy automatically routes `/api` to backend

## Features

- ✅ 2D Ground Track Map (Deck.gl)
- ✅ Real-time satellite propagation (RK4 + J2)
- ✅ Conjunction detection (KD-tree spatial indexing)
- ⚙️ Telemetry dashboard
- ⚙️ Orbital mechanics visualization
- 🔜 3D globe enhancement (Three.js)
