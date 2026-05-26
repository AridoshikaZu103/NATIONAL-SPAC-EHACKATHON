import React, { useEffect, useRef } from 'react';
import { Deck } from '@deck.gl/core';
import { GeoJsonLayer } from '@deck.gl/layers';

export default function DeckMap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const deckRef = useRef<Deck | null>(null);

  useEffect(() => {
    if (canvasRef.current && !deckRef.current) {
      deckRef.current = new Deck({
        canvas: canvasRef.current,
        initialViewState: {
          longitude: 0,
          latitude: 0,
          zoom: 2,
          pitch: 30,
        },
        controller: true,
        layers: [
          new GeoJsonLayer({
            id: 'world',
            data: 'https://raw.githubusercontent.com/visgl/geojson-vt/master/fixtures/land.geojson',
            filled: true,
            getFillColor: [200, 200, 200],
          })
        ],
      });
    }
  }, []);

  return <canvas ref={canvasRef} className="w-full h-full" />;
}
