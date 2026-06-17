"use client";

import React, { useState } from "react";
import { useBranches } from "@/hooks/api/useBranch";
import {
  BaseLeafletMap,
  MapCircle,
  MapClickHandler,
  MapMarker,
  type MapCoordinates,
} from "@/components/leaflet";
import {
  METRO_MANILA_CENTER,
  METRO_MANILA_DELIVERY_RADIUS_METERS,
} from "@/lib/deliveryArea";

type MapParentProps = {
  onSelectCoordinates: (latitude: number, longitude: number) => void;
};

const MapParent: React.FC<MapParentProps> = ({ onSelectCoordinates }) => {
  const { data: branches = [], isPending } = useBranches();
  const [selectedCoords, setSelectedCoords] = useState<MapCoordinates | null>(
    null,
  );

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
        <BaseLeafletMap
          center={METRO_MANILA_CENTER}
          zoom={12}
          height={500}
          className="w-full overflow-hidden rounded-lg border border-slate-200 bg-white"
        >
          <MapCircle
            center={{ lat: METRO_MANILA_CENTER[0], lng: METRO_MANILA_CENTER[1] }}
            radius={METRO_MANILA_DELIVERY_RADIUS_METERS}
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
                <MapMarker
                  key={branch._id}
                  position={{ lat, lng }}
                  title={branch.name}
                >
                  <div className="text-sm">
                    <p className="font-semibold">{branch.name}</p>
                    <p className="text-xs text-gray-600">{branch.code}</p>
                    <p className="text-xs text-gray-600">{branch.address}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {lat.toFixed(4)}, {lng.toFixed(4)}
                    </p>
                  </div>
                </MapMarker>
              );
            })}

          <MapClickHandler onClick={setSelectedCoords} />

          {selectedCoords && (
            <MapMarker
              position={selectedCoords}
              title={`${selectedCoords.lat.toFixed(4)}, ${selectedCoords.lng.toFixed(4)}`}
            />
          )}
        </BaseLeafletMap>
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
