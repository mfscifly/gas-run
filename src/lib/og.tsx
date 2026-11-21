import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { BorderScene, SCENE } from "@/components/BorderScene";

// Shared renderer for the link-preview cards (Open Graph + Twitter) on the
// homepage and every crossing page: the blue hero band with the border scene,
// as on the site. Satori can't read our CSS variables, so colours are fixed.
export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

const WHITE = "#ffffff";

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
      <rect width="32" height="32" fill={WHITE} />
      <rect x="8.5" y="7.5" width="10" height="17" fill={SCENE.skyTop} />
      <rect x="7" y="23.5" width="13" height="2.5" fill={SCENE.skyTop} />
      <rect x="10.5" y="10" width="6" height="4.5" fill={WHITE} />
      <path
        d="M18.5 11h2.2l2.3 2.3v7.2a1.25 1.25 0 0 1-2.5 0v-3a1.6 1.6 0 0 0-1.6-1.6h-.4"
        fill="none"
        stroke={SCENE.sun}
        strokeWidth="1.8"
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
          position: "relative",
          background: SCENE.skyTop,
          color: WHITE,
          fontFamily: "Geist",
        }}
      >
        {/* Scene along the bottom edge */}
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 260, display: "flex" }}>
          <BorderScene width={1200} height={260} idPrefix="og" />
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "44px 64px 0",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Mark size={44} />
            <span style={{ fontSize: 30, letterSpacing: -0.5 }}>Gas Tools</span>
          </div>
          <span style={{ ...mono, opacity: 0.8 }}>gastools.netlify.app</span>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
            padding: "40px 64px 0",
          }}
        >
          <span style={{ ...mono, color: SCENE.sun }}>{eyebrow}</span>
          <span
            style={{
              fontSize: title.length > 30 ? 64 : 76,
              lineHeight: 1.02,
              letterSpacing: -2.5,
              maxWidth: 820,
            }}
          >
            {title}
          </span>
          <span style={{ fontSize: 28, lineHeight: 1.3, opacity: 0.85, maxWidth: 760 }}>
            {subtitle}
          </span>
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: await fonts() },
  );
}
