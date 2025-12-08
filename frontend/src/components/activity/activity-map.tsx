'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { LatLngExpression, LatLngBounds } from 'leaflet';

interface ActivityMapProps {
  track: LatLngExpression[];
  activityId: string; // Add activityId to props
}

// This sub-component is used to apply imperative commands to the map instance.
const MapController = ({ bounds }: { bounds: LatLngBounds }) => {
  const map = useMap();
  useEffect(() => {
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [map, bounds]);
  return null;
};

export default function ActivityMap({ track, activityId }: ActivityMapProps) {
  // Using a key that is stable for the component instance but changes on
  // hot-reload is a common pattern to solve this specific react-leaflet issue.

  if (!track || track.length === 0) {
    return (
      <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
        <p>No GPS data available.</p>
      </div>
    );
  }

  const bounds = new LatLngBounds(track as [number, number][]);

  return (
    <MapContainer
      key={activityId}
      center={[0, 0]}
      zoom={13}
      style={{ height: '100%', width: '100%' }}
      className="rounded-lg shadow-md"
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <Polyline positions={track} color="blue" />
      <MapController bounds={bounds} />
    </MapContainer>
  );
}
