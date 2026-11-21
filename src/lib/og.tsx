import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

// Shared renderer for the link-preview cards (Open Graph + Twitter) on the
// homepage and every crossing page. Satori can't read our CSS variables, so the
// dark-theme palette from globals.css is hardcoded here.
export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

const BG = "#09090a";
const FG = "#ededee";
const MUTED = "#8b8b90";
const LINE = "rgba(237,237,238,0.14)";
const ACCENT = "#6f93ff";

async function fonts() {
  // Latin subsets only: keep card text to Latin-1 plus dashes (no ⇄ or other
  // symbols), or Satori renders an empty box.
  const dir = join(process.cwd(), "src/assets/fonts");
  const [sans, mono] = await Promise.all([
    readFile(join(dir, "geist-latin-400-normal.woff")),
    readFile(join(dir, "geist-mono-latin-500-normal.woff")),
  ]);
  return [
    { name: "Geist", data: sans, weight: 400 as const, style: "normal" as const },
    { name: "Geist Mono", data: mono, weight: 500 as const, style: "normal" as const },
  ];
}

function Mark({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32">
      <rect width="32" height="32" fill={FG} />
      <rect x="8.5" y="7.5" width="10" height="17" fill={BG} />
      <rect x="7" y="23.5" width="13" height="2.5" fill={BG} />
      <rect x="10.5" y="10" width="6" height="4.5" fill={FG} />
      <path
        d="M18.5 11h2.2l2.3 2.3v7.2a1.25 1.25 0 0 1-2.5 0v-3a1.6 1.6 0 0 0-1.6-1.6h-.4"
        fill="none"
        stroke={ACCENT}
        strokeWidth="1.7"
        strokeLinecap="square"
      />
    </svg>
  );
}

const mono = {
  fontFamily: "Geist Mono",
  fontSize: 20,
  letterSpacing: 2,
  textTransform: "uppercase" as const,
  color: MUTED,
};

export async function renderShareCard({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: BG,
          color: FG,
          fontFamily: "Geist",
          padding: 40,
        }}
      >
        {/* Hairline frame with a top bar and a bottom bar, like a spec sheet. */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            border: `1px solid ${LINE}`,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "24px 32px",
              borderBottom: `1px solid ${LINE}`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <Mark size={40} />
              <span style={{ fontSize: 28, letterSpacing: -0.5 }}>Gas Tools</span>
            </div>
            <span style={mono}>Canada – US</span>
          </div>

          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-end",
              gap: 22,
              padding: "0 32px 36px",
            }}
          >
            <span style={{ ...mono, color: ACCENT }}>{eyebrow}</span>
            <span
              style={{
                fontSize: title.length > 30 ? 68 : 80,
                lineHeight: 1.02,
                letterSpacing: -2.5,
                maxWidth: 860,
              }}
            >
              {title}
            </span>
            <span style={{ fontSize: 30, lineHeight: 1.3, color: MUTED, maxWidth: 940 }}>
              {subtitle}
            </span>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "18px 32px",
              borderTop: `1px solid ${LINE}`,
            }}
          >
            <span style={mono}>Live waits · Pump prices · Savings</span>
            <span style={mono}>gastools.netlify.app</span>
          </div>
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: await fonts() },
  );
}
