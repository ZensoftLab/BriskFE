import { useEffect, useMemo, useRef, useState } from "react";
import {
  MapContainer,
  Marker,
  Circle,
  GeoJSON,
  Polygon,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "../buisnessarea.css";

const BANGLADESH_VIEW = [23.685, 90.3563];
const BANGLADESH_BOUNDS = [
  [20.5, 88.0],
  [26.7, 92.7],
];
const BANGLADESH_BOUNDARY_URL =
  "https://raw.githubusercontent.com/wmgeolab/geoBoundaries/7876441648e7068fcce200709394ad259b0ab428/releaseData/gbOpen/BGD/ADM0/geoBoundaries-BGD-ADM0_simplified.geojson";
const BANGLADESH_BOUNDARY_FALLBACK_URL =
  "https://cdn.jsdelivr.net/gh/wmgeolab/geoBoundaries@7876441648e7068fcce200709394ad259b0ab428/releaseData/gbOpen/BGD/ADM0/geoBoundaries-BGD-ADM0_simplified.geojson";

const wifiMarkerHtml = `
  <span class="coverage-map-marker__pin" aria-hidden="true">
    <span class="coverage-map-marker__wifi">
      <svg viewBox="0 0 16 16" focusable="false">
        <path d="M1.5 5.8a10.5 10.5 0 0 1 13 0M4.1 8.7a6.3 6.3 0 0 1 7.8 0M6.8 11.6a2.1 2.1 0 0 1 2.4 0" />
        <circle cx="8" cy="13.2" r=".8" fill="currentColor" stroke="none" />
      </svg>
    </span>
  </span>`;

const businessIcon = L.divIcon({
  className: "coverage-map-marker coverage-map-marker--business",
  html: wifiMarkerHtml,
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -28],
});

const selectedBusinessIcon = L.divIcon({
  className: "coverage-map-marker coverage-map-marker--business coverage-map-marker--selected",
  html: wifiMarkerHtml,
  iconSize: [34, 34],
  iconAnchor: [17, 34],
  popupAnchor: [0, -32],
});

const currentLocationIcon = L.divIcon({
  className: "coverage-map-current-location",
  html: '<span aria-hidden="true"></span>',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

function isValidLocation(location) {
  return (
    Number.isFinite(Number(location?.latitude)) &&
    Number.isFinite(Number(location?.longitude))
  );
}

function FitCoverageBounds({ locations }) {
  const map = useMap();

  useEffect(() => {
    if (!locations.length) {
      map.fitBounds(BANGLADESH_BOUNDS, { padding: [24, 24] });
      return;
    }

    const bounds = L.latLngBounds(
      locations.map(({ latitude, longitude }) => [latitude, longitude]),
    );
    map.fitBounds(bounds, { padding: [28, 28], maxZoom: 12 });
  }, [locations, map]);

  return null;
}

function CurrentLocationControl() {
  const map = useMap();
  const [position, setPosition] = useState(null);

  useEffect(() => {
    const control = L.control({ position: "topleft" });
    let button;
    let resetTimer;

    control.onAdd = () => {
      const container = L.DomUtil.create(
        "div",
        "leaflet-bar leaflet-control coverage-map-locate-control",
      );
      button = L.DomUtil.create("button", "coverage-map-locate-button", container);
      button.type = "button";
      button.setAttribute("aria-label", "Show my current location");
      button.title = "Show my current location";
      button.innerHTML =
        '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3"></circle><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5.64 5.64l2.12 2.12M16.24 16.24l2.12 2.12M18.36 5.64l-2.12 2.12M7.76 16.24l-2.12 2.12"></path></svg>';

      L.DomEvent.disableClickPropagation(container);
      L.DomEvent.on(button, "click", () => {
        if (!navigator.geolocation) {
          button.title = "Location is not available in this browser";
          return;
        }

        button.disabled = true;
        button.classList.add("is-loading");
        button.title = "Finding your location…";

        navigator.geolocation.getCurrentPosition(
          ({ coords }) => {
            const nextPosition = [coords.latitude, coords.longitude];
            setPosition(nextPosition);
            map.flyTo(nextPosition, Math.max(map.getZoom(), 14), {
              animate: true,
              duration: 0.8,
            });
            button.disabled = false;
            button.classList.remove("is-loading");
            button.title = "Show my current location";
          },
          () => {
            button.disabled = false;
            button.classList.remove("is-loading");
            button.title = "Location permission was denied or unavailable";
            clearTimeout(resetTimer);
            resetTimer = setTimeout(() => {
              if (button) button.title = "Show my current location";
            }, 4000);
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
        );
      });

      return container;
    };

    control.addTo(map);

    return () => {
      clearTimeout(resetTimer);
      control.remove();
    };
  }, [map]);

  return position ? (
    <>
      <Circle
        center={position}
        radius={80}
        pathOptions={{
          color: "#2563eb",
          fillColor: "#60a5fa",
          fillOpacity: 0.16,
          weight: 1.5,
        }}
      />
      <Marker position={position} icon={currentLocationIcon}>
        <Popup>You are here</Popup>
      </Marker>
    </>
  ) : null;
}

function BangladeshBoundary() {
  const [boundary, setBoundary] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    const loadBoundary = async () => {
      for (const url of [BANGLADESH_BOUNDARY_URL, BANGLADESH_BOUNDARY_FALLBACK_URL]) {
        try {
          const response = await fetch(url, {
            signal: controller.signal,
            cache: "no-store",
          });
          if (!response.ok) continue;
          setBoundary(await response.json());
          return;
        } catch (requestError) {
          if (requestError.name === "AbortError") return;
        }
      }
    };

    loadBoundary()
      .catch((requestError) => {
        if (requestError.name !== "AbortError") {
          // The map remains usable if the external boundary service is unavailable.
          setBoundary(null);
        }
      });

    return () => controller.abort();
  }, []);

  if (!boundary) return null;

  return (
    <GeoJSON
      key="bangladesh-adm0-boundary"
      data={boundary}
      style={{
        color: "#2e358c",
        weight: 2,
        opacity: 0.85,
        fill: false,
        fillOpacity: 0,
      }}
      interactive={false}
    />
  );
}

function crossProduct(origin, pointA, pointB) {
  return (
    (pointA[0] - origin[0]) * (pointB[1] - origin[1]) -
    (pointA[1] - origin[1]) * (pointB[0] - origin[0])
  );
}

function createCoverageBoundary(area) {
  const points = [area, ...(area.sub_locations || [])]
    .filter(isValidLocation)
    .map(({ latitude, longitude }) => [Number(latitude), Number(longitude)])
    .sort(([latitudeA, longitudeA], [latitudeB, longitudeB]) =>
      latitudeA === latitudeB ? longitudeA - longitudeB : latitudeA - latitudeB,
    );

  if (!points.length) return [];

  if (points.length < 3) {
    const [[latitude, longitude]] = points;
    const padding = 0.0025;
    return [
      [latitude - padding, longitude - padding],
      [latitude - padding, longitude + padding],
      [latitude + padding, longitude + padding],
      [latitude + padding, longitude - padding],
    ];
  }

  const lower = [];
  points.forEach((point) => {
    while (lower.length >= 2 && crossProduct(lower[lower.length - 2], lower[lower.length - 1], point) <= 0) {
      lower.pop();
    }
    lower.push(point);
  });

  const upper = [];
  [...points].reverse().forEach((point) => {
    while (upper.length >= 2 && crossProduct(upper[upper.length - 2], upper[upper.length - 1], point) <= 0) {
      upper.pop();
    }
    upper.push(point);
  });

  const hull = lower.slice(0, -1).concat(upper.slice(0, -1));
  if (hull.length >= 3) return hull;

  const [[latitude, longitude]] = points;
  const padding = 0.0025;
  return [
    [latitude - padding, longitude - padding],
    [latitude - padding, longitude + padding],
    [latitude + padding, longitude + padding],
    [latitude + padding, longitude - padding],
  ];
}

function getBoundaryGeometry(boundary) {
  if (!boundary) return null;
  if (boundary.type === "Feature") return boundary.geometry;
  if (boundary.type === "FeatureCollection") {
    return boundary.features?.find((feature) => feature.geometry)?.geometry || null;
  }
  if (boundary.type === "Polygon" || boundary.type === "MultiPolygon") {
    return boundary;
  }
  return null;
}

function SelectedCoverageBoundary({ area }) {
  const boundary = useMemo(() => createCoverageBoundary(area), [area]);
  const boundaryGeometry = getBoundaryGeometry(area.boundary);

  const boundaryStyle = {
    className: "coverage-map-boundary",
    color: "#0a9d5b",
    weight: 2,
    opacity: 0.9,
    fillColor: "#45d88f",
    fillOpacity: 0.16,
  };

  if (boundaryGeometry?.type && boundaryGeometry.coordinates?.length) {
    return (
      <GeoJSON
        key={`coverage-boundary-${area.region_id}`}
        data={{
          type: "Feature",
          properties: {},
          geometry: boundaryGeometry,
        }}
        style={boundaryStyle}
      />
    );
  }

  if (!boundary.length) return null;

  return (
    <Polygon
      key={`coverage-boundary-${area.region_id}`}
      positions={boundary}
      pathOptions={boundaryStyle}
      smoothFactor={1.2}
    />
  );
}

function CoverageSidebar({
  areas,
  query,
  setQuery,
  selectedArea,
  onSelectArea,
}) {
  const sidebarRef = useRef(null);

  useEffect(() => {
    if (!sidebarRef.current) return undefined;

    L.DomEvent.disableScrollPropagation(sidebarRef.current);
    L.DomEvent.disableClickPropagation(sidebarRef.current);

    return () => {
      L.DomEvent.enableScrollPropagation(sidebarRef.current);
      L.DomEvent.enableClickPropagation(sidebarRef.current);
    };
  }, []);

  const visibleAreas = areas.filter((area) => {
    const searchableText = [
      area.area_name,
      ...(area.sub_locations || []).map((location) => location.name),
    ]
      .join(" ")
      .toLowerCase();

    return searchableText.includes(query.trim().toLowerCase());
  });
  return (
    <aside
      ref={sidebarRef}
      className="coverage-map-sidebar"
      aria-label="Coverage area search and locations"
      onClick={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
    >
      <div className="coverage-map-sidebar__intro">
        <span className="coverage-map-sidebar__eyebrow">BRISK SYSTEMS</span>
        <h2>Coverage <em>Map</em></h2>
        <p>Find out if high-speed Brisk Systems Internet is available in your area.</p>
      </div>

      <label className="coverage-map-search">
        <span className="coverage-map-search__icon" aria-hidden="true">⌕</span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search area or location..."
          aria-label="Search area or location"
        />
      </label>

      <div className="coverage-map-sidebar__section-heading">
        <span>Coverage areas</span>
        <small>{visibleAreas.length} available</small>
      </div>

      <div className="coverage-map-area-list">
        {visibleAreas.length ? (
          <>
            {visibleAreas.map((area) => {
            const isSelected = selectedArea?.region_id === area.region_id;
            return (
              <div
                className={`coverage-map-area ${isSelected ? "coverage-map-area--selected" : ""}`}
                key={area.region_id}
              >
                <button
                  className="coverage-map-area__button"
                  type="button"
                  onClick={() => onSelectArea(area)}
                  aria-expanded={isSelected}
                >
                  <span className="coverage-map-area__pin" aria-hidden="true">⌖</span>
                  <span className="coverage-map-area__copy">
                    <strong>{area.area_name}</strong>
                    <small>Dhaka, Bangladesh</small>
                  </span>
                  <span className="coverage-map-area__status">Available</span>
                  <span className={`coverage-map-area__chevron ${isSelected ? "is-open" : ""}`} aria-hidden="true">›</span>
                </button>

                {isSelected && area.sub_locations?.length ? (
                  <div className="coverage-map-subareas">
                    <h3>Covered locations</h3>
                    {area.sub_locations.map((location) => (
                      <button
                        className="coverage-map-subarea"
                        type="button"
                        key={`${area.region_id}-${location.name}`}
                        onClick={() => onSelectArea(area, location)}
                      >
                        <span aria-hidden="true">✓</span>
                        {location.name}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            );
            })}
          </>
        ) : (
          <p className="coverage-map-empty">No locations match your search.</p>
        )}
      </div>

      <div className="coverage-map-help">
        <span className="coverage-map-help__bulb" aria-hidden="true">♧</span>
        <div>
          <strong>Can't find your area?</strong>
          <p>Click any location on the map to check coverage in that area.</p>
        </div>
      </div>
    </aside>
  );
}

function CoverageMapControls({ selectedArea, coverageArea }) {
  const map = useMap();

  useEffect(() => {
    if (!selectedArea) return;

    const geometry = getBoundaryGeometry(coverageArea?.boundary);
    if (geometry?.coordinates?.length) {
      const bounds = L.geoJSON({
        type: "Feature",
        properties: {},
        geometry,
      }).getBounds();

      if (bounds.isValid()) {
        map.fitBounds(bounds, {
          animate: true,
          duration: 0.8,
          maxZoom: 14,
          padding: [80, 80],
        });
        return;
      }
    }

    map.flyTo([selectedArea.latitude, selectedArea.longitude], 13, {
      animate: true,
      duration: 0.8,
    });
  }, [coverageArea, map, selectedArea]);

  return null;
}

function makeBusinessLocations(coverageAreas) {
  return coverageAreas
    .filter(isValidLocation)
    .map((area) => ({
      name: area.area_name,
      latitude: area.latitude,
      longitude: area.longitude,
      type: "business",
      areaName: area.area_name,
      region_id: area.region_id,
    }));
}

export default function BusinessCoverageMap() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [selectedArea, setSelectedArea] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    fetch("/json/coverage_areas.json", {
      signal: controller.signal,
      cache: "no-store",
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Coverage data request failed: ${response.status}`);
        }
        return response.json();
      })
      .then((coverageData) => setData(coverageData))
      .catch((requestError) => {
        if (requestError.name !== "AbortError") {
          setError("Coverage locations could not be loaded right now.");
        }
      });

    return () => controller.abort();
  }, []);

  const businessLocations = useMemo(
    () => makeBusinessLocations(data?.coverage_areas || []),
    [data],
  );
  const allLocations = businessLocations;

  const selectArea = (area, location) => {
    const areaType = area.type || "coverage";
    const isSameSelection = areaType === "reseller"
      ? selectedArea?.type === "reseller" && selectedArea.name === area.name
      : selectedArea?.type === "coverage" && selectedArea.region_id === area.region_id;

    if (!location && isSameSelection) {
      setSelectedArea(null);
      return;
    }

    setSelectedArea({
      ...area,
      type: areaType,
      isSubLocation: Boolean(location),
      selectedLocationName: location?.name || "",
      latitude: location?.latitude ?? area.latitude,
      longitude: location?.longitude ?? area.longitude,
    });
  };

  const selectedCoverageArea = selectedArea?.type === "coverage"
    ? data?.coverage_areas?.find((area) => area.region_id === selectedArea.region_id)
    : null;

  if (error) {
    return <div className="coverage-map-status coverage-map-status--error">{error}</div>;
  }

  if (!data) {
    return <div className="coverage-map-status">Loading coverage map…</div>;
  }

  return (
    <div className="coverage-map-shell">
      <CoverageSidebar
        areas={data.coverage_areas || []}
        query={query}
        setQuery={setQuery}
        selectedArea={selectedArea}
        onSelectArea={selectArea}
      />

      <MapContainer
        center={BANGLADESH_VIEW}
        zoom={7}
        minZoom={6}
        scrollWheelZoom
        className="coverage-map"
        aria-label="Business coverage and reseller locations across Bangladesh"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <BangladeshBoundary />
        <FitCoverageBounds locations={allLocations} />
        <CurrentLocationControl />
        <CoverageMapControls
          selectedArea={selectedArea}
          coverageArea={selectedCoverageArea}
        />
        {selectedCoverageArea ? <SelectedCoverageBoundary area={selectedCoverageArea} /> : null}

        {businessLocations.map((location, index) => (
          <Marker
            key={`business-${location.name}-${location.latitude}-${location.longitude}-${index}`}
            position={[location.latitude, location.longitude]}
            icon={selectedCoverageArea?.area_name === location.areaName ? selectedBusinessIcon : businessIcon}
            eventHandlers={{ click: () => selectArea(data.coverage_areas.find((area) => area.area_name === location.areaName) || location) }}
          >
            <Popup>
              <strong>{location.name}</strong>
              {location.areaName && location.areaName !== location.name ? (
                <small>Business coverage: {location.areaName}</small>
              ) : null}
            </Popup>
          </Marker>
        ))}

        {selectedArea?.type === "coverage" && selectedArea.isSubLocation ? (
          <Marker
            key={`selected-sub-location-${selectedArea.region_id}-${selectedArea.selectedLocationName}`}
            position={[selectedArea.latitude, selectedArea.longitude]}
            icon={businessIcon}
          >
            <Popup>
              <strong>{selectedArea.selectedLocationName}</strong>
              <small>Covered location: {selectedArea.area_name}</small>
            </Popup>
          </Marker>
        ) : null}

        <div className="coverage-map-legend" aria-label="Map legend">
          <div className="coverage-map-legend__item">
            <span className="coverage-map-legend__dot coverage-map-legend__dot--business" />
            Coverage area
          </div>
        </div>
      </MapContainer>
    </div>
  );
}
