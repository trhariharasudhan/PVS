import { ImageResponse } from "next/og";

// Code-drawn share image (no stock photos): brand mark on silk red with a zari border.
export const runtime = "nodejs";
export const alt = "PVS Silks — silk sarees woven to order in Salem district, Tamil Nadu";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  const kovil = Array.from({ length: 30 });
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#7A1022", color: "#F6EBD2" }}>
        <div style={{ display: "flex", height: 34, background: "#0F4D3A", borderBottom: "6px solid #C9A24E" }}>
          {kovil.map((_, i) => (
            <div key={i} style={{ width: 40, height: 34, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
              <div style={{ width: 0, height: 0, borderLeft: "14px solid transparent", borderRight: "14px solid transparent", borderBottom: "22px solid #C9A24E" }} />
            </div>
          ))}
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 90px" }}>
          <div style={{ fontSize: 30, letterSpacing: 10, color: "#E9C878" }}>WOVEN TO ORDER · SALEM, TAMIL NADU</div>
          <div style={{ fontSize: 150, fontWeight: 700, letterSpacing: 18, marginTop: 10 }}>PVS SILKS</div>
          <div style={{ fontSize: 40, marginTop: 10, color: "#F1DDB0" }}>Your colours. Your design. Our looms.</div>
        </div>
        <div style={{ display: "flex", height: 40, background: "#0F4D3A", borderTop: "6px solid #C9A24E" }} />
      </div>
    ),
    size,
  );
}
