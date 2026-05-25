import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";

export default function SubwayMap({
  stations,
  subwayLines,
  selectedStation,
  userLocation
}) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const selectedMarkerRef = useRef(null);
  const userMarkerRef = useRef(null);
  const stationMarkersRef = useRef([]);

  useEffect(() => {
    const token = import.meta.env.VITE_MAPBOX_TOKEN;

    if (!token) {
      console.error("Missing VITE_MAPBOX_TOKEN in frontend/.env");
      return;
    }

    mapboxgl.accessToken = token;

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/navigation-day-v1",
      center: [-73.9855, 40.758],
      zoom: 10.5
    });

    mapRef.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    return () => {
      mapRef.current?.remove();
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !subwayLines) return;

    const map = mapRef.current;

    function addLines() {
      if (map.getSource("subway-lines")) {
        map.getSource("subway-lines").setData(subwayLines);
        return;
      }

      map.addSource("subway-lines", {
        type: "geojson",
        data: subwayLines
      });

      map.addLayer({
        id: "subway-lines-layer",
        type: "line",
        source: "subway-lines",
        paint: {
          "line-color": ["get", "color"],
          "line-width": 4,
          "line-opacity": 0.85
        }
      });
    }

    if (map.isStyleLoaded()) {
      addLines();
    } else {
      map.once("load", addLines);
    }
  }, [subwayLines]);

  useEffect(() => {
    if (!mapRef.current || stations.length === 0) return;

    stationMarkersRef.current.forEach((marker) => marker.remove());
    stationMarkersRef.current = [];

    stations.forEach((station) => {
      if (
        typeof station.longitude !== "number" ||
        typeof station.latitude !== "number"
      ) {
        return;
      }

      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <strong>${station.name}</strong>
        <br />
        Lines: ${station.lines?.join(", ") || "Not assigned"}
      `);

      const marker = new mapboxgl.Marker()
        .setLngLat([station.longitude, station.latitude])
        .setPopup(popup)
        .addTo(mapRef.current);

      stationMarkersRef.current.push(marker);
    });
  }, [stations]);

  useEffect(() => {
    if (!mapRef.current || !selectedStation) return;

    if (
      typeof selectedStation.longitude !== "number" ||
      typeof selectedStation.latitude !== "number"
    ) {
      return;
    }

    if (selectedMarkerRef.current) {
      selectedMarkerRef.current.remove();
    }

    const markerElement = document.createElement("div");
    markerElement.className = "selected-marker-wrapper";

    const innerMarker = document.createElement("div");
    innerMarker.className = "selected-marker-dot";
    innerMarker.textContent = "★";

    markerElement.appendChild(innerMarker);

    selectedMarkerRef.current = new mapboxgl.Marker(markerElement)
      .setLngLat([selectedStation.longitude, selectedStation.latitude])
      .setPopup(
        new mapboxgl.Popup({ offset: 25 }).setHTML(`
          <strong>Destination: ${selectedStation.name}</strong>
          <br />
          Alert distance enabled
        `)
      )
      .addTo(mapRef.current);

    mapRef.current.flyTo({
      center: [selectedStation.longitude, selectedStation.latitude],
      zoom: 14,
      essential: true
    });
  }, [selectedStation]);

  useEffect(() => {
    if (!mapRef.current || !userLocation) return;

    if (
      typeof userLocation.longitude !== "number" ||
      typeof userLocation.latitude !== "number"
    ) {
      return;
    }

    if (userMarkerRef.current) {
      userMarkerRef.current.setLngLat([
        userLocation.longitude,
        userLocation.latitude
      ]);
      return;
    }

    const markerElement = document.createElement("div");
    markerElement.className = "user-marker-wrapper";

    const innerMarker = document.createElement("div");
    innerMarker.className = "user-marker-dot";

    markerElement.appendChild(innerMarker);

    userMarkerRef.current = new mapboxgl.Marker(markerElement)
      .setLngLat([userLocation.longitude, userLocation.latitude])
      .setPopup(
        new mapboxgl.Popup({ offset: 25 }).setHTML("<strong>Your location</strong>")
      )
      .addTo(mapRef.current);
  }, [userLocation]);

  return <div className="map-container" ref={mapContainerRef}></div>;
}
