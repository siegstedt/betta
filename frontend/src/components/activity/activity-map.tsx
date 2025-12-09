'use client';

import React, { useEffect, useState } from 'react';

interface ActivityMapProps {
  track: unknown[];
  activityId: string;
}

export default function ActivityMap({ track, activityId }: ActivityMapProps) {
  const [MapComponent, setMapComponent] = useState<React.ComponentType | null>(
    null
  );

  useEffect(() => {
    // Dynamically import components only on client
    import('react-leaflet').then((mod) => {
      const MapContainer = mod.MapContainer;
      const TileLayer = mod.TileLayer;
      const Polyline = mod.Polyline;
      const useMap = mod.useMap;

      // Import leaflet types
      import('leaflet').then((leaflet) => {
        const LatLngBounds = leaflet.LatLngBounds;

        // Create MapController component
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const MapController = ({ bounds }: { bounds: any }) => {
          const map = useMap();
          useEffect(() => {
            if (
              bounds &&
              typeof bounds.isValid === 'function' &&
              bounds.isValid()
            ) {
              map.fitBounds(bounds, { padding: [20, 20] });
            }
          }, [map, bounds]);
          return null;
        };

        // Create the map component
        const MapComp = () => {
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
              <Polyline
                positions={track as any} // eslint-disable-line @typescript-eslint/no-explicit-any
                color="blue"
              />
              <MapController bounds={bounds} />
            </MapContainer>
          );
        };

        setMapComponent(() => MapComp);
      });
    });
  }, [track, activityId]);

  if (!MapComponent) {
    return (
      <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
        <p>Loading map...</p>
      </div>
    );
  }

  return <MapComponent />;
}
