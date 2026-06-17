"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Marker as LeafletMarker } from "leaflet";

import { DynamicIcon } from "@/components/ui/DynamicIcon";
import { userIcon } from "@/app/customer/map/markerIcon";
import {
  BaseLeafletMap,
  DraggableMapMarker,
  MapCircle,
  MapClickHandler,
  RecenterMap,
  type MapCoordinates,
} from "@/components/leaflet";
import {
  isWithinMetroManilaDeliveryArea,
  METRO_MANILA_CENTER,
  METRO_MANILA_DELIVERY_RADIUS_METERS,
  OUTSIDE_DELIVERY_AREA_MESSAGE,
} from "@/lib/deliveryArea";

type DeliveryCoordinates = MapCoordinates;

type SearchResult = {
  display_name: string;
  lat: string;
  lon: string;
};

export type ResolvedDeliveryAddress = {
  placeName?: string;
  line2?: string;
  city?: string;
  province?: string;
  zipCode?: string;
};

type ReverseGeocodeResponse = {
  name?: string;
  display_name?: string;
  address?: {
    road?: string;
    quarter?: string;
    neighbourhood?: string;
    city?: string;
    town?: string;
    municipality?: string;
    village?: string;
    suburb?: string;
    city_district?: string;
    county?: string;
    state_district?: string;
    state?: string;
    region?: string;
    postcode?: string;
  };
};

type DeliveryLocationPickerProps = {
  value?: DeliveryCoordinates;
  addressQuery: string;
  error?: string;
  onChange: (coordinates: DeliveryCoordinates) => void;
  onAddressResolved?: (address: ResolvedDeliveryAddress) => void;
};

const getUniqueAddressParts = (
  parts: Array<string | undefined>,
): string[] => {
  const seen = new Set<string>();

  return parts.filter((part): part is string => {
    const normalized = part?.trim();
    if (!normalized) return false;

    const key = normalized.toLowerCase();
    if (seen.has(key)) return false;

    seen.add(key);
    return true;
  });
};

const DeliveryLocationPicker = ({
  value,
  addressQuery,
  error,
  onChange,
  onAddressResolved,
}: DeliveryLocationPickerProps) => {
  const markerRef = useRef<LeafletMarker | null>(null);
  const [query, setQuery] = useState(addressQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    setQuery(addressQuery);
  }, [addressQuery]);

  const resolveAddressFromCoordinates = useCallback(
    async (coordinates: DeliveryCoordinates) => {
      if (!onAddressResolved) return;

      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${coordinates.lat}&lon=${coordinates.lng}&format=json&addressdetails=1`,
          { headers: { "Accept-Language": "en" } },
        );

        if (!response.ok) return;

        const data = (await response.json()) as ReverseGeocodeResponse;
        const address = data.address;
        if (!address) return;

        const line2 =
          address.quarter ??
          address.neighbourhood ??
          address.suburb ??
          address.village ??
          address.city_district;
        const city = address.city ?? address.town ?? address.municipality;
        const province =
          address.state ??
          address.region ??
          address.state_district ??
          address.county;
        const placeName = getUniqueAddressParts([
          data.name ?? address.road,
          line2,
          city,
        ])
          .slice(0, 3)
          .join(", ");

        onAddressResolved({
          placeName: placeName || data.display_name,
          line2,
          city,
          province,
          zipCode: address.postcode,
        });
      } catch {
        // Reverse geocoding is a convenience; the pinned coordinates remain authoritative.
      }
    },
    [onAddressResolved],
  );

  const selectCoordinates = useCallback(
    (coordinates: DeliveryCoordinates) => {
      const nextCoordinates = {
        lat: Number(coordinates.lat.toFixed(6)),
        lng: Number(coordinates.lng.toFixed(6)),
      };

      if (!isWithinMetroManilaDeliveryArea(nextCoordinates)) {
        setLocationError(OUTSIDE_DELIVERY_AREA_MESSAGE);
        return;
      }

      setLocationError(null);
      onChange(nextCoordinates);
      resolveAddressFromCoordinates(nextCoordinates);
      setTimeout(() => markerRef.current?.openPopup(), 300);
    },
    [onChange, resolveAddressFromCoordinates],
  );

  const searchAddress = useCallback(
    async (searchText: string) => {
      const trimmed = searchText.trim();
      if (trimmed.length < 3) {
        setResults([]);
        setLocationError("Enter at least 3 characters to search an address.");
        return;
      }

      setIsSearching(true);
      setLocationError(null);

      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
            `${trimmed}, Philippines`,
          )}&format=json&limit=5&countrycodes=ph`,
          { headers: { "Accept-Language": "en" } },
        );

        if (!response.ok) {
          throw new Error("Address search failed.");
        }

        const data = (await response.json()) as SearchResult[];
        setResults(data);

        if (data.length === 0) {
          setLocationError("No matching address found. Try a nearby landmark.");
        }
      } catch (searchError) {
        setResults([]);
        setLocationError(
          searchError instanceof Error
            ? searchError.message
            : "Address search failed.",
        );
      } finally {
        setIsSearching(false);
      }
    },
    [],
  );

  const useCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError("Your browser does not support location access.");
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        selectCoordinates({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setIsLocating(false);
      },
      () => {
        setLocationError(
          "Location access was denied or unavailable. Search your address or click the map instead.",
        );
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10_000,
        maximumAge: 60_000,
      },
    );
  }, [selectCoordinates]);

  const handleResultSelect = (result: SearchResult) => {
    setResults([]);
    setQuery(result.display_name);
    selectCoordinates({
      lat: Number(result.lat),
      lng: Number(result.lon),
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 md:flex-row">
        <div className="relative flex-1">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                searchAddress(query);
              }
            }}
            placeholder="Search delivery address or landmark"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 pr-10 text-sm outline-none focus:border-brand-color-500 focus:ring-1 focus:ring-brand-color-500"
          />
          <DynamicIcon
            name="Search"
            size={16}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
        </div>

        <button
          type="button"
          onClick={() => searchAddress(query)}
          disabled={isSearching}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSearching ? (
            <DynamicIcon name="Loader2" size={15} className="animate-spin" />
          ) : (
            <DynamicIcon name="Search" size={15} />
          )}
          Search
        </button>

        <button
          type="button"
          onClick={useCurrentLocation}
          disabled={isLocating}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-color-500 px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-color-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLocating ? (
            <DynamicIcon name="Loader2" size={15} className="animate-spin" />
          ) : (
            <DynamicIcon name="LocateFixed" size={15} />
          )}
          Current location
        </button>
      </div>

      {results.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          {results.map((result) => (
            <button
              key={`${result.lat}-${result.lon}-${result.display_name}`}
              type="button"
              onClick={() => handleResultSelect(result)}
              className="block w-full border-b border-slate-100 px-3 py-2 text-left text-xs text-slate-600 last:border-b-0 hover:bg-slate-50"
            >
              {result.display_name}
            </button>
          ))}
        </div>
      )}

      {(locationError || error) && (
        <p className="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-medium text-red-500">
          {locationError || error}
        </p>
      )}

      <BaseLeafletMap
        center={value ? [value.lat, value.lng] : METRO_MANILA_CENTER}
        zoom={value ? 16 : 12}
      >
        <MapCircle
          center={{ lat: METRO_MANILA_CENTER[0], lng: METRO_MANILA_CENTER[1] }}
          radius={METRO_MANILA_DELIVERY_RADIUS_METERS}
          pathOptions={{
            color: "#16a34a",
            fillColor: "#22c55e",
            fillOpacity: 0.08,
            weight: 2,
            dashArray: "6 4",
          }}
        />
        <MapClickHandler onClick={selectCoordinates} />
        <RecenterMap value={value} />

        {value && (
          <DraggableMapMarker
            position={value}
            icon={userIcon}
            markerRef={markerRef}
            onDragEnd={selectCoordinates}
          >
            <div className="space-y-1 text-xs bg-white p-4 w-full">
              <p className="font-semibold text-slate-800">
                Delivery location
              </p>
              <p className="text-slate-500">
                {value.lat.toFixed(6)}, {value.lng.toFixed(6)}
              </p>
              <p className="text-slate-400">
                Drag the pin or click the map to adjust.
              </p>
            </div>
          </DraggableMapMarker>
        )}
      </BaseLeafletMap>

      <div className="flex items-start gap-2 text-xs text-slate-500">
        <DynamicIcon name="MapPinned" size={15} className="mt-0.5 shrink-0" />
        <p>
          Click inside the highlighted Metro Manila service area to place your
          delivery pin, drag the pin to fine-tune it, or allow location access
          to start from your current position.
        </p>
      </div>

      {value && (
        <div className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs text-slate-600">
          <DynamicIcon name="CheckCircle2" size={15} className="text-green-600" />
          <span>
            Pinned at {value.lat.toFixed(6)}, {value.lng.toFixed(6)}
          </span>
        </div>
      )}
    </div>
  );
};

export default DeliveryLocationPicker;
