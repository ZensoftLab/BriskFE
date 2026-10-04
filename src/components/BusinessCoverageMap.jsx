import { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  Marker,
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

const businessIcon = L.divIcon({
  className: "coverage-map-marker coverage-map-marker--business",
  html: '<span aria-hidden="true"></span>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
  popupAnchor: [0, -11],
});

const resellerIcon = L.divIcon({
  className: "coverage-map-marker coverage-map-marker--reseller",
  html: '<span aria-hidden="true"></span>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
  popupAnchor: [0, -12],
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

function makeBusinessLocations(coverageAreas) {
  return coverageAreas.flatMap((area) => {
    const subLocations = Array.isArray(area.sub_locations)
      ? area.sub_locations.filter(isValidLocation)
      : [];

    if (subLocations.length) {
      return subLocations.map((location) => ({
        ...location,
        type: "business",
        areaName: area.area_name,
      }));
    }

    return isValidLocation(area)
      ? [
          {
            name: area.area_name,
            latitude: area.latitude,
            longitude: area.longitude,
            type: "business",
            areaName: area.area_name,
          },
        ]
      : [];
  });
}

export default function BusinessCoverageMap() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

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
  const resellerLocations = useMemo(
    () => (data?.resellers || []).filter(isValidLocation),
    [data],
  );
  const allLocations = useMemo(
    () => [...businessLocations, ...resellerLocations],
    [businessLocations, resellerLocations],
  );

  if (error) {
    return <div className="coverage-map-status coverage-map-status--error">{error}</div>;
  }

  if (!data) {
    return <div className="coverage-map-status">Loading coverage map…</div>;
  }

  return (
    <div className="coverage-map-shell">
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
        <FitCoverageBounds locations={allLocations} />

        {businessLocations.map((location, index) => (
          <Marker
            key={`business-${location.name}-${location.latitude}-${location.longitude}-${index}`}
            position={[location.latitude, location.longitude]}
            icon={businessIcon}
          >
            <Popup>
              <strong>{location.name}</strong>
              {location.areaName && location.areaName !== location.name ? (
                <small>Business coverage: {location.areaName}</small>
              ) : null}
            </Popup>
          </Marker>
        ))}

        {resellerLocations.map((location, index) => (
          <Marker
            key={`reseller-${location.name}-${location.latitude}-${location.longitude}-${index}`}
            position={[location.latitude, location.longitude]}
            icon={resellerIcon}
          >
            <Popup>
              <strong>{location.name}</strong>
              <small>Reseller{location.city ? ` · ${location.city}` : ""}</small>
            </Popup>
          </Marker>
        ))}

        <div className="coverage-map-legend" aria-label="Map legend">
          <div className="coverage-map-legend__item">
            <span className="coverage-map-legend__dot coverage-map-legend__dot--business" />
            Business coverage
          </div>
          <div className="coverage-map-legend__item">
            <span className="coverage-map-legend__dot coverage-map-legend__dot--reseller" />
            Reseller
          </div>
        </div>
      </MapContainer>
    </div>
  );
}
