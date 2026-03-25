import dynamic from "next/dynamic";
import React, { useMemo } from "react";

type MapParentProps = {
  onSelectCoordinates: (latitude: number, longitude: number) => void;
};

const MapParent = ({ onSelectCoordinates }: MapParentProps) => {
  const Map = useMemo(
    () =>
      dynamic(() => import("./MapModal"), {
        loading: (): React.ReactNode => (
          <div className="flex items-center justify-center h-full bg-slate-100 text-slate-500 text-sm">
            Loading harrison map...
          </div>
        ),
        ssr: false,
      }),
    [],
  );

  return (
    <div>
      <Map onSelectCoordinates={onSelectCoordinates} />
    </div>
  );
};

export default MapParent;
