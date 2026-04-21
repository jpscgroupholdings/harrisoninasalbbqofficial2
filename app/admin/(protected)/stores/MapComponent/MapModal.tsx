import React, { useState } from "react";
import {
  Circle,
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
} from "react-leaflet";
import { LatLng } from "leaflet";

import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import { useBranches } from "@/hooks/api/useBranch";

const METRO_MANILA_CENTER: [number, number] = [14.5995, 120.9842];
const ALLOWED_RADIUS_METERS = 25_000;

type MapParentProps = {
  onSelectCoordinates: (latitude: number, longitude: number) => void;
};

const MapClickHandler = ({
  selectedCoords,
  setSelectedCoords,
}: {
  selectedCoords: LatLng | null;
  setSelectedCoords: (coords: LatLng) => void;
}) => {
  useMapEvents({
    click(e) {
      setSelectedCoords(e.latlng);
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
  const { data: branches = [], isPending } = useBranches();
  const [selectedCoords, setSelectedCoords] = useState<LatLng | null>(null);

  const handleSave = () => {
    if (!selectedCoords) return;
    onSelectCoordinates(selectedCoords.lat, selectedCoords.lng);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="bg-dark-green-50 border border-dark-green-200 rounded-lg p-3">
        <p className="text-sm text-dark-green-900">
          <span className="font-semibold">Click on the map</span> to select the
          branch location. The selected point will be marked on the map.
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

          {/* Service Area Circle */}
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

          {/* Render Existing Branches */}
          {!isPending &&
            branches.map((branch) => {
              const [lng, lat] = branch.location?.coordinates || [0, 0];
              if (lng === 0 && lat === 0) return null; // Skip branches with no coordinates

              return (
                <Marker
                  key={branch._id}
                  position={[lat, lng]}
                  title={branch.name}
                >
                  <Popup>
                    <div className="text-sm">
                      <p className="font-semibold">{branch.name}</p>
                      <p className="text-xs text-gray-600">{branch.code}</p>
                      <p className="text-xs text-gray-600">{branch.address}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {lat.toFixed(4)}, {lng.toFixed(4)}
                      </p>
                    </div>
                  </Popup>
                </Marker>
              );
            })}

          {/* Selected Location Marker */}
          <MapClickHandler
            selectedCoords={selectedCoords}
            setSelectedCoords={setSelectedCoords}
          />
        </MapContainer>
      </div>

      <button
        onClick={handleSave}
        disabled={!selectedCoords}
        className="bg-dark-green-700 hover:bg-dark-green-800 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2 rounded-md shadow text-sm cursor-pointer"
      >
        Save Changes
      </button>
    </div>
  );
};

export default MapParent;