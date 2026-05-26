import DeckMap from './components/DeckMap';

import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div className="min-h-screen bg-space-darker p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-space-accent mb-2">
            Orbital Insight
          </h1>
          <p className="text-gray-400 mb-8">
            Space Situational Awareness Dashboard
          </p>

          {/* Dashboard Grid - To be populated with charts, maps, and telemetry */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Ground Track Map */}
            <div className="lg:col-span-2 bg-space-dark rounded-lg border border-space-accent/20 p-4 h-96">
              <h2 className="text-lg font-semibold text-space-accent mb-4">Ground Track Map</h2>
              <DeckMap />
            </div>

            {/* Telemetry Panel */}
            <div className="bg-space-dark rounded-lg border border-space-accent/20 p-4">
              <h2 className="text-lg font-semibold text-space-accent mb-4">
                Telemetry
              </h2>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-400">Altitude:</span>
                  <span className="float-right text-space-accent">--</span>
                </div>
                <div>
                  <span className="text-gray-400">Velocity:</span>
                  <span className="float-right text-space-accent">--</span>
                </div>
                <div>
                  <span className="text-gray-400">Inclination:</span>
                  <span className="float-right text-space-accent">--</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <button
              onClick={() => setCount((count) => count + 1)}
              className="px-6 py-2 bg-space-accent text-space-dark font-semibold rounded hover:bg-space-accent/80 transition"
            >
              count is {count}
            </button>
            <p className="text-gray-400 mt-4">
              Edit <code>src/App.tsx</code> and save to test HMR
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

export default App
