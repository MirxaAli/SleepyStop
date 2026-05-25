import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import { sampleStations } from "../../utils/sampleStations.js";

export default function SubwayMap({ selectedStation, userLocation }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const selectedMarkerRef = useRef(null);
  const userMarkerRef = useRef(null);

  useEffect(() => {
    const token = import.meta.env.VITE_MAPBOX_TOKEN;

    if (!token) {
      console.error("Missing VITE_MAPBOX_TOKEN in frontend/.env");
      return;
    }

    mapboxgl.accessToken = token;

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [-73.9855, 40.758],
      zoom: 11
    });

    mapRef.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    sampleStations.forEach((station) => {
      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <strong>${station.name}</strong>
        <br />
        Lines: ${station.lines.join(", ")}
      `);

      new mapboxgl.Marker()
        .setLngLat([station.longitude, station.latitude])
        .setPopup(popup)
        .addTo(mapRef.current);
    });

    return () => {
      mapRef.current?.remove();
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !selectedStation) return;

    if (selectedMarkerRef.current) {
      selectedMarkerRef.current.remove();
    }

    const markerElement = document.createElement("div");
    markerElement.className = "selected-marker";
    markerElement.textContent = "★";

    selectedMarkerRef.current = new mapboxgl.Marker(markerElement)
      .setLngLat([selectedStation.longitude, selectedStation.latitude])
      .setPopup(
        new mapboxgl.Popup({ offset: 25 }).setHTML(`
          <strong>Destination: ${selectedStation.name}</strong>
          <br />
          Alert distance: 100 meters
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

    if (userMarkerRef.current) {
      userMarkerRef.current.setLngLat([
        userLocation.longitude,
        userLocation.latitude
      ]);
      return;
    }

    const markerElement = document.createElement("div");
    markerElement.className = "user-marker";

    userMarkerRef.current = new mapboxgl.Marker(markerElement)
      .setLngLat([userLocation.longitude, userLocation.latitude])
      .setPopup(
        new mapboxgl.Popup({ offset: 25 }).setHTML("<strong>Your location</strong>")
      )
      .addTo(mapRef.current);
  }, [userLocation]);

  return <div className="map-container" ref={mapContainerRef}></div>;
}
