"use client";

/**
 * ------------ Why this file is client only ----------------
 * Leaflet reads 'window' and 'document' at import time. Next.js renders page on the server first,
 * so any leaflet import must be deferred to the browser. The parent page.tsx wraps this component
 * in 'dynamic(..., {ssr: false})', which guarantees this file never runs on the server.
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Circle,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fixes the missing default marker icons that Webpack strips out
import "leaflet-defaulticon-compatibility";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";

import { InputField } from "@/components/ui/InputField";
import {
  ChevronDown,
  LoaderCircle,
  MapPin,
  MapPinHouse,
  MapPinned,
  PersonStanding,
  Search,
} from "lucide-react";
import {
  Branch,
  BRANCHES,
  branchIcon,
  nearestBranchIcon,
  selectedAndNearestBranchIcon,
  selectedBranchIcon,
  userIcon,
} from "./mockupData";
import { haversine } from "./functions/haversine";
import { nearestBranch } from "./functions/nearestBranch";
import { useBranch } from "@/contexts/BranchContext";
import { fredoka } from "@/app/font";

const METRO_MANILA_CENTER: [number, number] = [14.5995, 120.9842];
const ALLOWED_RADIUS_METERS = 25_000; // 25 km - covers the entire NCR

// ── Click handler (child component so it can access map events) ───────────────
function ClickHandler({
  onPlace,
}: {
  onPlace: (latlng: [number, number]) => void;
}) {
  useMapEvents({
    dblclick(e) {
      onPlace([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

const ClickHintHandler = () => {
  const [show, setShow] = useState(false);

  useMapEvents({
    click: () => {
      setShow(true);
      setTimeout(() => setShow(false), 2000);
    },
  });

  return show ? (
    <div className="absolute top-8 left-1/2 -translate-x-1/2 z-999 px-4 py-2 bg-white text-brand-color-500 text-sm font-medium rounded-full shadow-md border border-brand-color-100 transition-opacity">
      Double-click on the map to set your location
    </div>
  ) : null;
};

// ---- Search bar ------------
interface SearchResult {
  display_name: string;
  lat: string;
  lon: string;
}

type BranchInfoCardProps = {
  label: string;
  branch: Branch;
  distanceKm?: number;
  onViewMap: () => void;
};

const BranchInfoCard = ({
  label,
  branch,
  distanceKm,
  onViewMap,
}: BranchInfoCardProps) => (
  <div className="flex items-center justify-between w-full py-3 px-4 rounded-lg bg-gray-50 border border-gray-200 text-sm shadow-sm">
    <div>
      <p className="text-lg font-medium text-slate-900">
        {label}: {branch.name}
      </p>
      <p className="text-slate-700 mt-0.5">
        {branch.address}
        {distanceKm !== undefined && (
          <>
            {" "}
            &mdash;{" "}
            <span className="font-medium">
              {distanceKm.toFixed(1)} km from your location
            </span>
          </>
        )}
      </p>
    </div>
    <button
      onClick={onViewMap}
      className="shrink-0 ml-3 bg-brand-color-500 hover:bg-brand-color-600 text-white text-xs py-1.5 px-3 rounded-lg cursor-pointer border-0 transition-colors"
    >
      View on map
    </button>
  </div>
);

// ---------------- Component ----------------------
const Map = () => {
  const mapRef = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);

  // null - not yet located
  const [userMarker, setUserMarker] = useState<[number, number] | null>(null);

  // true = geolocated but user hasn't confirmed (shows "Select a place?" popup)
  const [isMarkerPending, setIsMarkerPending] = useState(false);

  // selected branch from context
  const { selectedBranch, setSelectedBranch } = useBranch();

  const [nearestInfo, setNearestInfo] = useState<{
    branch: Branch;
    km: number;
  } | null>(null);

  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Search state
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  const [legendOpen, setLegendOpen] = useState(false);

  // -- Auto request geolocation on mount ---------------
  // Drops a pending marker at the user's detected location with a
  // "Select a place?" popup so they can confirm or choose a different spot.
  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const latlng: [number, number] = [
          pos.coords.latitude,
          pos.coords.longitude,
        ];
        setUserMarker(latlng);
        setIsMarkerPending(true);
        // Small delay so MapContainer has fully initialised before flyTo
        setTimeout(() => {
          mapRef.current?.flyTo(latlng, 14, { duration: 1.5 });

          // open popup afer fly animation finishes
          setTimeout(() => {
            userMarkerRef.current?.openPopup();
          }, 1800);
        }, 600);
      },
      () => {
        // Permission denied or unavailable — silent fail, user can still click
        setError(
          "Location access denied. Please enable it or select manually.",
        );
      },
    );
  }, []);

  // ---------- Place Marker with radius check --------------
  const placeMarker = useCallback((latlng: [number, number]) => {
    const dist = haversine(METRO_MANILA_CENTER, latlng);
    if (dist > ALLOWED_RADIUS_METERS) {
      setError(
        `That location is outside Metro Manila (${(dist / 1000).toFixed(1)} km away). Please click within the highlighted area.`,
      );
      setSuccess(null);
      return;
    }

    const info = nearestBranch(latlng);

    setUserMarker(latlng);
    setIsMarkerPending(false);
    setNearestInfo(info);
    setError(null);
  }, []);

  // ──Manual Geolocation button ───────────────────────────────────────────────────────────
  const handleLocate = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const latlng: [number, number] = [
          pos.coords.latitude,
          pos.coords.longitude,
        ];
        placeMarker(latlng);
        mapRef.current?.flyTo(latlng, 15, { duration: 1.2 });
      },
      () => setError("Unable to retrieve your location."),
    );
  }, [placeMarker]);

  // ── Nominatim search ──────────────────────────────────────────────────────
  const handleSearch = useCallback(async (query: string) => {
    setQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          query + ", Philippines",
        )}&format=json&limit=5`,
        { headers: { "Accept-Language": "en" } },
      );
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const handleSearchResult = useCallback(
    (r: SearchResult) => {
      const latlng: [number, number] = [parseFloat(r.lat), parseFloat(r.lon)];
      setSearchResults([]);
      setQuery(r.display_name.split(",")[0]);
      placeMarker(latlng);
      mapRef.current?.flyTo(latlng, 15, { duration: 1.2 });
    },
    [placeMarker],
  );

  const getBranchIcon = (branch: Branch) => {
    const isNearest = nearestInfo?.branch.id === branch.id && !isMarkerPending;
    const isSelected = selectedBranch?.id === branch.id;

    if (isNearest && isSelected) return selectedAndNearestBranchIcon;
    if (isNearest) return nearestBranchIcon;
    if (isSelected) return selectedBranchIcon;

    return branchIcon;
  };

  function getDistance(a: [number, number], b: [number, number]): number {
    return haversine(a, b) / 1000; // returns km directly
  }

  const dotColors = ["#e53e3e", "#38a169", "#d69e2e", "#7c3aed", "#3b82f6"];

  return (
    <section className={`${fredoka.className} relative w-full font-sans z-0`}>
      <div className="relative max-w-7xl h-full mx-auto space-y-4 my-4">
        <div className="flex gap-2">
          <InputField
            placeholder="Search your address or area"
            name="search-branch"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e: React.KeyboardEvent) => {
              if (e.key === "Enter") handleSearch(query);
            }}
            rightElement={
              !searching ? (
                <div className="flex items-center gap-2 cursor-pointer group">
                  <Search
                    size={18}
                    onClick={() => handleSearch(query)}
                    className=" text-brand-color-500 group-hover:text-brand-color-600"
                  />
                  <p className="text-slate-700 group-hover:text-slate-800">
                    Search
                  </p>
                </div>
              ) : (
                <LoaderCircle className="animate-spin" />
              )
            }
          />
          <button
            onClick={handleLocate}
            title="Use my current location"
            className="flex items-center gap-2 py-2.5 px-3.5 border-0 bg-brand-color-500 hover:bg-brand-color-600 rounded-lg text-white text-sm cursor-pointer shadow whitespace-nowrap"
          >
            <MapPin size={16} />
            My Location
          </button>
        </div>

        {/* ── Search dropdown ── */}
        {searchResults.length > 0 && (
          <div className="w-full bg-white rounded-lg shadow overflow-hidden">
            {searchResults.map((r, i) => (
              <button
                key={i}
                onClick={() => handleSearchResult(r)}
                className={`block w-full text-left py-2.5 px-3.5 bg-white ${i < searchResults.length - 1 ? "border-b border-b-brand-color-500" : "border-0"}text-sm cursor-pointer text-brand-color-500 hover:bg-gray-50`}
              >
                {r.display_name}
              </button>
            ))}
          </div>
        )}

        {nearestInfo && !isMarkerPending && (
          <BranchInfoCard
            label="Nearest branch"
            branch={nearestInfo.branch}
            distanceKm={nearestInfo.km}
            onViewMap={() =>
              mapRef.current?.flyTo(nearestInfo.branch.position, 16, {
                duration: 1.2,
              })
            }
          />
        )}

        {selectedBranch && !isMarkerPending && (
          <BranchInfoCard
            label="Selected branch"
            branch={selectedBranch}
            distanceKm={
              userMarker
                ? getDistance(selectedBranch.position, userMarker)
                : undefined
            }
            onViewMap={() =>
              mapRef.current?.flyTo(selectedBranch.position, 16, {
                duration: 1.2,
              })
            }
          />
        )}

        {error && (
          <div className="w-full py-2.5 px-3.5 rounded-lg bg-white border border-brand-color-500 text-brand-color-500 text-sm font-medium shadow">
            {error}
          </div>
        )}

        {success && !error && (
          <div className="w-full py-2.5 px-3.5 rounded-lg bg-white border border-dark-green-500 text-dark-green-500 text-sm font-medium shadow">
            {success}
          </div>
        )}

        {/** ---- Leaflet map ------------------ */}
        {/** CRITICAL : MapContainer MUST have an explicit height. Without it, Leaflet renders a 0-px-tall container
         * and shows nothing. We set width/height to 100% and rely on the parent <main> being 100vh
         */}

        <MapContainer
          center={METRO_MANILA_CENTER}
          zoom={12}
          scrollWheelZoom
          doubleClickZoom={false}
          style={{ width: "100%", height: "500px" }}
          ref={mapRef}
        >
          <TileLayer
            attribution='&copy; <a href="/">Harrison House of Inasal & BBQ</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Allowed area boundary */}
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

          {/* ── Branch markers (red pins) ── */}
          {BRANCHES.map((branch) => (
            <Marker
              key={branch.id}
              position={branch.position}
              icon={getBranchIcon(branch)}
            >
              <Popup>
                <div className="min-w-44 space-y-2">
                  {/* Header */}
                  <div className="border-b border-gray-100 pb-2">
                    <p className="font-bold text-sm text-gray-800">
                      {branch.name}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {branch.address}
                    </p>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-1">
                    {nearestInfo?.branch.id === branch.id &&
                      !isMarkerPending && (
                        <span className="inline-flex items-center gap-1 bg-dark-green-50 text-dark-green-600 text-xs font-semibold py-0.5 px-2 rounded-full border border-dark-green-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-dark-green-500 inline-block" />
                          Nearest to you
                        </span>
                      )}
                    {selectedBranch?.id === branch.id && (
                      <span className="inline-flex items-center gap-1 bg-brand-color-50 text-brand-color-600 text-xs font-semibold py-0.5 px-2 rounded-full border border-brand-color-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-color-500 inline-block" />
                        Selected
                      </span>
                    )}
                  </div>

                  {/* Distance — only if user placed a marker */}
                  {userMarker && !isMarkerPending && (
                    <p className="text-xs text-gray-400">
                      {getDistance(branch.position, userMarker).toFixed(1)} km
                      from your location
                    </p>
                  )}

                  {/* Select button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedBranch(branch);
                    }}
                    className={`w-full py-1.5 text-xs font-semibold rounded-md border-0 cursor-pointer transition-colors ${
                      selectedBranch?.id === branch.id
                        ? "bg-dark-green-500 text-white"
                        : "bg-brand-color-500 hover:bg-brand-color-600 text-white"
                    }`}
                  >
                    {selectedBranch?.id === branch.id
                      ? "✓ Selected branch"
                      : "Select this branch"}
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* ── User marker (blue pin) ── */}
          {userMarker && (
            <Marker position={userMarker} icon={userIcon} ref={userMarkerRef}>
              <Popup>
                {isMarkerPending ? (
                  // ── Pending state: auto-geolocated, not yet confirmed ──
                  <div className="min-w-40">
                    <p className="font-bold mb-1">Select Place?</p>
                    <p className="text-sm text-gray-500 mb-2.5">
                      This is your detected location. Confirm it or click
                      anywhere on the map to choose a different spot.
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        placeMarker(userMarker);
                      }}
                      className="w-full py-2 bg-brand-color-500 text-white border-0 rounded-sm text-sm font-semibold cursor-pointer"
                    >
                      Confirm this location
                    </button>
                  </div>
                ) : (
                  //** confirmed state */}
                  "Your are here"
                )}
              </Popup>
            </Marker>
          )}

          {/** Double click to map hint when user click once */}
          <ClickHintHandler />

          {/** Double click on map to place marker*/}
          <ClickHandler onPlace={placeMarker} />

          {/* ── Logo badge overlaid on map bottom-left ── */}
          <div className="absolute bottom-2 left-2 bg-white shadow-md px-3 py-2 rounded-lg flex items-center z-9999">
            <img
              src="/images/harrison_logo_landscape.png"
              alt="Harrison Logo"
              className="h-6"
            />
            <span className="translate-x-1 text-xs font-black text-brand-color-500">
              Map
            </span>
          </div>

          <button
            onClick={() => {
              mapRef.current?.flyTo(userMarker ? userMarker : [0, 0], 14, {
                duration: 1.2,
              });
            }}
            aria-label="Locate my marker"
            title="Locate my current marker"
            className="absolute top-5 right-5 z-999 bg-brand-color-500 hover:bg-brand-color-600 rounded-full p-2 cursor-pointer"
          >
            <MapPinned size={18} className="text-white" />
          </button>
        </MapContainer>
      </div>

      {/* ── Legend ── */}
      <div className="z-9999">
        <div className="relative">
          {/* Trigger button */}
          <button
            onClick={() => setLegendOpen((p) => !p)}
            className="flex items-center gap-1.5 bg-[#1c1c1e] text-white text-xs font-medium px-2.5 py-1.5 rounded-lg cursor-pointer border-0"
          >
            <span className="flex items-center">
              {dotColors.map((color, i) => (
                <div
                  key={i}
                  className="h-3 w-3 border border-gray-500 rounded-full -ml-1.5 first:ml-0"
                  style={{ backgroundColor: color }}
                />
              ))}
            </span>
            Markers Legend
            <ChevronDown
              size={12}
              className={`transition-transform duration-200 ${legendOpen ? "rotate-180" : ""}`}
            />
          </button>

          {/* Dropdown panel */}
          {legendOpen && (
            <div className="absolute bottom-full mb-2 left-0 bg-[#1c1c1e] opacity-90 rounded-lg p-2.5 min-w-44 shadow-lg z-9999">
              {[
                { icon: userIcon, label: "Your location" },
                { icon: branchIcon, label: "Branch" },
                { icon: selectedBranchIcon, label: "Selected branch" },
                { icon: nearestBranchIcon, label: "Nearest branch" },
                {
                  icon: selectedAndNearestBranchIcon,
                  label: "Selected & nearest",
                },
              ].map(({ icon, label }) => (
                <div key={label} className="flex items-center gap-2 py-1">
                  <img
                    src={icon.options.iconUrl}
                    className="h-6 w-auto"
                    alt={label}
                  />
                  <span className="text-xs text-gray-200">{label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default Map;
