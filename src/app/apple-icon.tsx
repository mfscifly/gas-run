import { ImageResponse } from "next/og";

// iOS home-screen icon. iOS rounds the corners itself.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#0b0b0c" }}>
        <svg width="180" height="180" viewBox="4 4 24 24">
          <rect x="8.5" y="7.5" width="10" height="17" fill="#fff" />
          <rect x="7" y="23.5" width="13" height="2.5" fill="#fff" />
          <rect x="10.5" y="10" width="6" height="4.5" fill="#0b0b0c" />
          <path
            d="M18.5 11h2.2l2.3 2.3v7.2a1.25 1.25 0 0 1-2.5 0v-3a1.6 1.6 0 0 0-1.6-1.6h-.4"
            fill="none"
            stroke="#6f93ff"
            strokeWidth="1.6"
            strokeLinecap="square"
          />
        </svg>
      </div>
    ),
    size,
  );
}
