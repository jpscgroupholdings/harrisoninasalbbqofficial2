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
  CheckIcon,
  ChevronDown,
  ClockIcon,
  Globe,
  HomeIcon,
  LoaderCircle,
  MapPin,
  MapPinIcon,
  MapPinned,
  PhoneIcon,
  Search,
  SunIcon,
} from "lucide-react";
import {
  branchIcon,
  nearestBranchIcon,
  selectedAndNearestBranchIcon,
  selectedBranchIcon,
  userIcon,
} from "./markerIcon";
import { haversine } from "./functions/haversine";
import { nearestBranch } from "./functions/nearestBranch";
import { useBranch } from "@/contexts/BranchContext";
import { fredoka } from "@/app/font";
import { useBranches } from "@/hooks/api/useBranch";
import { Branch } from "@/types/branch";

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
    <div className="absolute top-8 left-1/2 -translate-x-1/2 z-999 px-4 py-2 bg-white text-brand-color-500 text-xs md:text-sm text-nowrap font-medium rounded-full shadow-md border border-brand-color-100 transition-opacity">
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

// ── Replace your BranchInfoCard component ────────────────────────────────────
type BranchInfoCardProps = {
  type: "nearest" | "selected" | "branch";
  branch: Branch;
  distanceKm?: number;
  onViewMap: () => void;
};

const BranchInfoCard = ({
  type,
  branch,
  distanceKm,
  onViewMap,
}: BranchInfoCardProps) => {
  const isNearest = type === "nearest";
  const isSelected = type === "selected";
  const isBranch = type === "branch";

  return (
    <div
      className={`border rounded-xl overflow-hidden w-full transition-colors ${
        isNearest
          ? "bg-white border-slate-200 shadow-sm"
          : isSelected
            ? "bg-white border-brand-color-200 shadow-sm"
            : "bg-gray-50 border-gray-100"
      }`}
    >
      {/* Badge pill — only for nearest and selected */}
      {!isBranch && (
        <div className="px-3 pt-3 pb-0">
          <span
            className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
              isNearest
                ? "bg-slate-50 text-slate-700 border border-slate-200"
                : "bg-brand-color-50 text-brand-color-700 border border-brand-color-200"
            }`}
          >
            {isNearest ? "📍 Nearest" : "✓ Selected"}
          </span>
        </div>
      )}

      {/* Branch info */}
      <div
        className={`px-3 pb-3 space-y-0.5 ${!isBranch ? "pt-2" : "pt-3"}`}
      >
        <p
          className={`text-sm font-semibold leading-snug ${
            isBranch ? "text-slate-600" : "text-slate-900"
          }`}
        >
          {branch.name}
        </p>
        <p className="text-[11px] text-slate-400 leading-snug capitalize">
          {branch.address}
        </p>
        {distanceKm !== undefined && (
          <p className="text-[11px] text-brand-color-400">
            {distanceKm.toFixed(1)} km away
          </p>
        )}

        <button
          onClick={onViewMap}
          className={`mt-2 w-full py-1.5 px-3 text-[11px] font-medium rounded-lg border-0 cursor-pointer transition-colors ${
            isBranch
              ? "bg-gray-200 hover:bg-gray-300 text-gray-600"
              : "bg-dark-green-700 hover:bg-dark-green-800 text-white"
          }`}
        >
          View on map
        </button>
      </div>
    </div>
  );
};

// ---------------- Component ----------------------
const Map = () => {
  const { data: branches = [], isPending } = useBranches();

  // selected branch from context
  const {
    selectedBranch,
    setSelectedBranch,
    userLocation: userMarker,
    setUserLocation,
  } = useBranch();

  const mapRef = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);

  // store ref for each branch marker so we can open their popups programmatically when user clicks "View on map" in the side panel
  const branchMarkerRef = useRef<Record<string, L.Marker | null>>({});

  // true = geolocated but user hasn't confirmed (shows "Select a place?" popup)
  const [isMarkerPending, setIsMarkerPending] = useState(false);

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
    // ── Already have a saved location from sessionStorage — skip geolocation ──
    if (userMarker) {
      setTimeout(() => {
        mapRef.current?.flyTo(userMarker, 14, { duration: 1.5 });
         setTimeout(() => {
            userMarkerRef.current?.openPopup();
          }, 1800);
      }, 600);
      return;
    }

    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const latlng: [number, number] = [
          pos.coords.latitude,
          pos.coords.longitude,
        ];
        setUserLocation(latlng);
        setIsMarkerPending(true);
        setTimeout(() => {
          mapRef.current?.flyTo(latlng, 14, { duration: 1.5 });
          setTimeout(() => {
            userMarkerRef.current?.openPopup();
          }, 1800);
        }, 600);
      },
      () => {
        setError(
          "Location access denied. Please enable it or select manually.",
        );
      },
    );
  }, []); // ── empty deps — runs once on mount only ──

  // ---------- Place Marker with radius check --------------
  const placeMarker = useCallback(
    (latlng: [number, number]) => {
      const dist = haversine(METRO_MANILA_CENTER, latlng);
      if (dist > ALLOWED_RADIUS_METERS) {
        setError(
          `That location is outside Metro Manila (${(dist / 1000).toFixed(1)} km away). Please click within the highlighted area.`,
        );
        setSuccess(null);
        return;
      }

      // Pass branches from useBranches() hook
      const info = nearestBranch(latlng, branches);

      setUserLocation(latlng);
      setIsMarkerPending(false);
      setNearestInfo(info);
      setError(null);
    },
    [branches],
  );

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
    const isNearest =
      nearestInfo?.branch._id === branch._id && !isMarkerPending;
    const isSelected = selectedBranch?._id === branch._id;

    if (isNearest && isSelected) return selectedAndNearestBranchIcon;
    if (isNearest) return nearestBranchIcon;
    if (isSelected) return selectedBranchIcon;

    return branchIcon;
  };

  function getDistance(a: [number, number], b: [number, number]): number {
    return haversine(a, b) / 1000; // returns km directly
  }

  /** GeoJSON stores [longitude, latitude] — Leaflet wants [latitude, longitude] */
  const toLatLng = (coordinates: [number, number]): [number, number] => [
    coordinates[1],
    coordinates[0],
  ];

  const flyToBranchAndOpenPopup = useCallback((branch: Branch) => {
    const latlng = toLatLng(branch.location.coordinates);
    mapRef.current?.flyTo(latlng, 16, { duration: 1.2 });
    setTimeout(() => {
      branchMarkerRef.current[branch._id]?.openPopup();
    }, 1400); // slight longer than fly duration to ensure popup opens after animation completes
  }, []);

  const dotColors = ["#e53e3e", "#38a169", "#d69e2e", "#7c3aed", "#3b82f6"];

  return (
    <section
      className={`${fredoka.className} flex flex-col md:flex-row gap-3 items-start  w-full`}
    >
      <div className="relative max-w-7xl h-full mx-auto space-y-4 w-full z-10">
        {/** Search */}
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
                  <p className="hidden md:block text-slate-700 group-hover:text-slate-800">
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
            className="flex items-center gap-2 py-2.5 px-3.5 border-0 bg-brand-color-500 hover:bg-brand-color-600 rounded-lg text-white text-xs md:text-sm cursor-pointer shadow whitespace-nowrap"
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

        <div className="flex-1 min-w-0">
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
            {/* ── Branch markers (red pins/ or yello/green for selected and nearest) ── */}
            {!isPending &&
              branches.length > 0 &&
              branches.map((branch) => {
                const [lng, lat] = branch.location?.coordinates || [0, 0];
                if (lng === 0 && lat === 0) return null; // Skip branches with no coordinates
                return (
                  <Marker
                    key={branch._id}
                    position={[lat, lng]}
                    title={branch.name}
                    icon={getBranchIcon(branch)}
                    ref={(ref) => {
                      branchMarkerRef.current[branch._id] = ref;
                    }} // store each branch marker ref by its _id
                  >
                    <Popup>
                      <div className="w-56 overflow-hidden rounded-xl border border-gray-200 shadow-lg bg-white">
                        {/* Header */}
                        <div className="bg-dark-green-700 px-3 py-2.5">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-[10px] font-medium text-white/60 uppercase tracking-widest">
                                Branch
                              </p>
                              <p className="mt-0.5 font-medium text-white uppercase">
                                {branch.name}
                              </p>
                            </div>
                            <div className="shrink-0 w-7 h-7 rounded-full bg-white/15 flex items-center justify-center">
                              <MapPinIcon className="w-3.5 h-3.5 text-white" />
                            </div>
                          </div>
                          {nearestInfo?.branch._id === branch._id &&
                            !isMarkerPending && (
                              <div className="mt-1.5">
                                <span className="inline-flex text-[10px] font-medium text-white bg-white/20 rounded-full px-2 py-0.5">
                                  Nearest to you
                                </span>
                              </div>
                            )}
                        </div>
                        {/* Details */}
                        <div className="px-3 py-2.5 space-y-1.5 border-b border-gray-100">
                          <div className="flex items-start gap-1.5">
                            <HomeIcon className="w-3 h-3 text-gray-400 mt-0.5 shrink-0" />
                            <span className="text-[11px] text-gray-500 leading-snug capitalize">
                              {branch.address}
                            </span>
                          </div>
                          {branch.contactNumber && (
                            <div className="flex items-center gap-1.5">
                              <PhoneIcon className="w-3 h-3 text-gray-400 shrink-0" />
                              <span className="text-[11px] text-gray-500">
                                {branch.contactNumber}
                              </span>
                            </div>
                          )}
                          {branch.operatingHours && (
                            <div className="flex items-center gap-1.5">
                              <ClockIcon className="w-3 h-3 text-gray-400 shrink-0" />
                              <span className="text-[11px] text-gray-500">
                                {branch.operatingHours.open} –{" "}
                                {branch.operatingHours.close}
                              </span>
                            </div>
                          )}
                          {branch.location?.coordinates && (
                            <div className="flex items-center gap-1.5">
                              <Globe className="w-3 h-3 text-gray-400 shrink-0" />
                              <span className="text-[11px] text-gray-500">
                                {lat.toFixed(4)}, {lng.toFixed(4)}
                              </span>
                            </div>
                          )}
                        </div>
                        {/* Footer */}
                        <div className="px-3 py-2">
                          {userMarker && !isMarkerPending && (
                            <p className="text-[10px] text-gray-400 mb-1.5">
                              {getDistance(
                                toLatLng(branch.location.coordinates),
                                userMarker,
                              ).toFixed(1)}{" "}
                              km from your location
                            </p>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedBranch(branch);
                            }}
                            className={`w-full py-1.5 text-xs font-medium rounded-lg border-0 cursor-pointer transition-colors flex items-center justify-center gap-1.5 ${
                              selectedBranch?._id === branch._id
                                ? "bg-green-50 text-dark-green-700 border border-green-200"
                                : "bg-dark-green-700 hover:bg-dark-green-800 text-white"
                            }`}
                          >
                            {selectedBranch?._id === branch._id ? (
                              <>
                                <CheckIcon className="w-3.5 h-3.5" />
                                Selected branch
                              </>
                            ) : (
                              "Select this branch"
                            )}
                          </button>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            {/* ── User marker (brand-color pin) ── */}
            {userMarker && (
              <Marker position={userMarker} icon={userIcon} ref={userMarkerRef}>
                <Popup>
                  {isMarkerPending ? (
                    // ── Pending state ──
                    <div className="w-56 overflow-hidden rounded-xl bg-white">
                      <div className="bg-brand-color-500 px-3 py-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-[10px] font-medium text-white/60 uppercase tracking-widest">
                              Your Location
                            </p>
                            <p className="mt-0.5 text-sm font-medium text-white leading-snug">
                              Confirm this spot?
                            </p>
                          </div>
                          <div className="shrink-0 w-7 h-7 rounded-full bg-white/15 flex items-center justify-center">
                            <SunIcon className="w-3.5 h-3.5 text-white" />{" "}
                            {/* or CrosshairIcon */}
                          </div>
                        </div>
                      </div>
                      <div className="px-3 py-2.5 border-b border-gray-100">
                        <p className="text-[11px] text-gray-500 leading-relaxed">
                          This is your auto-detected location. Confirm it or tap
                          anywhere on the map to choose a different spot.
                        </p>
                      </div>
                      <div className="px-3 py-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            placeMarker(userMarker);
                          }}
                          className="w-full py-1.5 bg-brand-color-500 hover:bg-brand-color-600 text-white text-xs font-medium rounded-lg border-0 cursor-pointer transition-colors flex items-center justify-center gap-1.5"
                        >
                          <CheckIcon className="w-3.5 h-3.5" />
                          Confirm this location
                        </button>
                      </div>
                    </div>
                  ) : (
                    // ── Confirmed state ──
                    <div className="w-56 overflow-hidden rounded-xl bg-white">
                      <div className="bg-dark-green-700 px-3 py-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-[10px] font-medium text-white/60 uppercase tracking-widest">
                              Location confirmed
                            </p>
                            <p className="mt-0.5 text-sm font-medium text-white leading-snug">
                              Your pinned location on the map.
                            </p>
                          </div>
                          <div className="shrink-0 w-7 h-7 rounded-full bg-white/15 flex items-center justify-center">
                            <MapPinIcon className="w-3.5 h-3.5 text-white" />
                          </div>
                        </div>
                      </div>
                      <div className="px-3 py-2.5 border-b border-gray-100 space-y-1.5">
                        <div className="flex items-center gap-1.5">
                          <Globe className="w-3 h-3 text-gray-400 shrink-0" />
                          <span className="text-[11px] text-gray-500">
                            {userMarker[0].toFixed(4)},{" "}
                            {userMarker[1].toFixed(4)}
                          </span>
                        </div>
                      </div>
                      <div className="px-3 py-2">
                        <p className="text-[10px] text-gray-400 text-center">
                          Tap the map to move your pin
                        </p>
                      </div>
                    </div>
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

            {/** Locate my marker button */}
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
      </div>

   
        <div>
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
                <div className="absolute top-full mb-2 left-0 bg-[#1c1c1e] opacity-90 rounded-lg p-2.5 min-w-44 shadow-lg z-9999">
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
          {/* Right side panel — only visible when there's something to show */}
          <div className="flex flex-row md:flex-col gap-3 shrink-0 pt-1">
        {/* Scrollable branch list */}
<div className="flex flex-col gap-3 overflow-y-auto">

  {/* Pinned: nearest */}
  {nearestInfo && (
    <BranchInfoCard
      type="nearest"
      branch={nearestInfo.branch}
      distanceKm={nearestInfo.km}
      onViewMap={() => flyToBranchAndOpenPopup(nearestInfo.branch)}
    />
  )}

  {/* Pinned: selected (only if different from nearest) */}
  {selectedBranch && selectedBranch._id !== nearestInfo?.branch._id && (
    <BranchInfoCard
      type="selected"
      branch={selectedBranch}
      distanceKm={
        userMarker
          ? getDistance(toLatLng(selectedBranch.location.coordinates), userMarker)
          : undefined
      }
      onViewMap={() => flyToBranchAndOpenPopup(selectedBranch)}
    />
  )}

  {/* Divider */}
  {(nearestInfo || selectedBranch) && branches.length > 0 && (
    <div className="flex items-center gap-2 px-1">
      <div className="flex-1 h-px bg-gray-100" />
      <span className="text-[10px] text-gray-400 font-medium">All branches</span>
      <div className="flex-1 h-px bg-gray-100" />
    </div>
  )}

  {/* All branches (excluding nearest and selected) */}
  {branches
    .filter(b =>
      b._id !== nearestInfo?.branch._id &&
      b._id !== selectedBranch?._id
    )
    .map((branch) => (
      <BranchInfoCard
        key={branch._id}
        type="branch"
        branch={branch}
        distanceKm={
          userMarker
            ? getDistance(toLatLng(branch.location.coordinates), userMarker)
            : undefined
        }
        onViewMap={() => flyToBranchAndOpenPopup(branch)}
      />
    ))}
</div>
          </div>
        </div>
      
    </section>
  );
};

export default Map;
