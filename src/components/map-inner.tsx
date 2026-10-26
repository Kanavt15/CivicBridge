"use client";
import { MapContainer, TileLayer, CircleMarker, Popup, useMapEvents, useMap } from "react-leaflet";
import { useEffect } from "react";
import "leaflet/dist/leaflet.css";
function Picker({ onChange }: { onChange: (value: [number, number]) => void }) {
  useMapEvents({
    click(e) {
      onChange([Number(e.latlng.lat.toFixed(6)), Number(e.latlng.lng.toFixed(6))]);
    },
  });
  return null;
}
function FollowLocation({ value }: { value: [number, number] }) {
  const map = useMap();
  const [latitude, longitude] = value;
  useEffect(() => {
    if (Number.isFinite(latitude) && Number.isFinite(longitude))
      map.setView([latitude, longitude], map.getZoom(), { animate: false });
  }, [map, latitude, longitude]);
  return null;
}
export default function MapInner({
  points,
  value,
  onChange,
}: {
  points: { id: string; title: string; latitude: number; longitude: number; city: string }[];
  value?: [number, number];
  onChange?: (value: [number, number]) => void;
}) {
  return (
    <MapContainer center={value || [22.5, 79]} zoom={value ? 10 : 5} scrollWheelZoom={false}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {onChange && <Picker onChange={onChange} />}
      {value && <FollowLocation value={value} />}
      <>
        {value && (
          <CircleMarker
            center={value}
            radius={9}
            pathOptions={{ color: "#177e69", fillColor: "#2b9e85", fillOpacity: 0.8 }}
          />
        )}
        {points.map((p) => (
          <CircleMarker
            key={p.id}
            center={[p.latitude, p.longitude]}
            radius={8}
            pathOptions={{ color: "#177e69", fillColor: "#2b9e85", fillOpacity: 0.7 }}
          >
            <Popup>
              <a href={`/problems/${p.id}`}>{p.title}</a>
              <br />
              {p.city}
            </Popup>
          </CircleMarker>
        ))}
      </>
    </MapContainer>
  );
}
