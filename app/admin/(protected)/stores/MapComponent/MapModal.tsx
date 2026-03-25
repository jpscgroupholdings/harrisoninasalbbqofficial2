import React, { useState } from "react";
import { Circle, MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { LatLng } from "leaflet";

import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";

const METRO_MANILA_CENTER: [number, number] = [14.5995, 120.9842];
const ALLOWED_RADIUS_METERS = 25_000; // 25 km

type MapParentProps = {
  onSelectCoordinates: (latitude: number, longitude: number) => void;
};

const MapClickHandler = ({
  onSelectCoordinates,
}: {
  onSelectCoordinates: (latitude: number, longitude: number) => void;
}) => {
  const [selectedCoords, setSelectedCoords] = useState<LatLng | null>(null);

  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setSelectedCoords(e.latlng);
      // Pass lat, lng to parent - note that our storage order is [longitude, latitude] for GeoJSON
      onSelectCoordinates(lat, lng);
    },
  });

  return selectedCoords ? (
    <Marker
      position={[selectedCoords.lat, selectedCoords.lng]}
      title={`${selectedCoords.lat.toFixed(4)}, ${selectedCoords.lng.toFixed(4)}`}
    />
  ) : null;
};

const MapParent: React.FC<MapParentProps> = ({ onSelectCoordinates }) => {
  return (
    <div className="flex flex-col gap-3">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-sm text-blue-900">
          <span className="font-semibold">Click on the map</span> to select the branch location.
          The selected point will be marked on the map.
        </p>
      </div>

      <div className="flex w-full z-0">
        <MapContainer
          center={METRO_MANILA_CENTER}
          zoom={12}
          style={{ width: "100%", height: "500px" }}
        >
          <TileLayer
            attribution='&copy; <a href="/">Harrison House of Inasal & BBQ</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* NCR Service Area Circle */}
          <Circle
            center={METRO_MANILA_CENTER}
            radius={ALLOWED_RADIUS_METERS}
            pathOptions={{
              color: "#2563eb",
              fillColor: "#3b82f6",
              fillOpacity: 0.08,
              weight: 2,
              dashArray: "6 4",
            }}
          />

          {/* Map Click Handler - adds marker on click */}
          <MapClickHandler onSelectCoordinates={onSelectCoordinates} />
        </MapContainer>
      </div>

      <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-200">
        <p className="font-medium mb-1">Coordinate Format:</p>
        <p>Latitude (Y-axis): -90 to 90</p>
        <p>Longitude (X-axis): -180 to 180</p>
        <p className="mt-2 text-slate-500">
          <span className="font-medium">Note:</span> The map stores coordinates as [longitude, latitude] (GeoJSON standard).
        </p>
      </div>
    </div>
  );
};

export default MapParent;