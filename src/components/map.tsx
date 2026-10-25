"use client";
import dynamic from "next/dynamic";
const LeafletMap = dynamic(() => import("./map-inner"), {
  ssr: false,
  loading: () => <div className="loading-area">Loading OpenStreetMap…</div>,
});
export function MapView({
  points = [],
  value,
  onChange,
  large = false,
}: {
  points?: { id: string; title: string; latitude: number; longitude: number; city: string }[];
  value?: [number, number];
  onChange?: (position: [number, number]) => void;
  large?: boolean;
}) {
  return (
    <div className={`map-container ${large ? "map-large" : ""}`}>
      <LeafletMap points={points} value={value} onChange={onChange} />
    </div>
  );
}
