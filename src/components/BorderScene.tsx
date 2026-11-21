// Flat illustration of a highway running up to a border booth under a low
// sun. Pure SVG with no hooks or CSS classes, so the same JSX renders on the
// site and inside the Satori share card (src/lib/og.tsx).
//
// The viewBox skips the empty sky above y=140, so a box with the same aspect
// (1200:260) shows the whole scene; shorter boxes crop the top.
//
// Palette is fixed rather than themed: the scene always sits on the blue
// hero band, in light and dark mode alike.
export const SCENE = {
  skyTop: "#1f4fe0",
  skyBottom: "#4a78f5",
  sun: "#ffd27a",
  far: "#6c93fa",
  mid: "#1c45c6",
  near: "#11318d",
  road: "#0a1a4a",
  line: "#ffffff",
} as const;

export function BorderScene({
  width = "100%",
  height = "100%",
  idPrefix = "scene",
  preserveAspectRatio = "xMidYMax slice",
  sky = false,
}: {
  width?: number | string;
  height?: number | string;
  idPrefix?: string;
  preserveAspectRatio?: string;
  /** Paint the sky gradient. Off on the site, where the hero band's flat blue
      is the sky, so a cropped scene never shows a seam. */
  sky?: boolean;
}) {
  const skyId = `${idPrefix}-sky`;
  return (
    <svg
      viewBox="0 140 1200 260"
      width={width}
      height={height}
      preserveAspectRatio={preserveAspectRatio}
      aria-hidden="true"
    >
      {sky && (
        <defs>
          <linearGradient id={skyId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={SCENE.skyTop} />
            <stop offset="1" stopColor={SCENE.skyBottom} />
          </linearGradient>
        </defs>
      )}
      {sky && <rect width="1200" height="400" fill={`url(#${skyId})`} />}
      <circle cx="905" cy="204" r="52" fill={SCENE.sun} />
      <path
        d="M0 252 L110 196 L200 232 L320 158 L440 226 L560 176 L680 238 L790 186 L905 244 L1030 172 L1200 236 V400 H0Z"
        fill={SCENE.far}
      />
      <path
        d="M0 292 C150 252 260 302 400 272 C540 242 640 292 780 267 C920 242 1050 287 1200 262 V400 H0Z"
        fill={SCENE.mid}
      />
      <path
        d="M0 334 C200 312 400 342 600 327 C800 312 1000 337 1200 322 V400 H0Z"
        fill={SCENE.near}
      />
      {/* Highway in perspective */}
      <path d="M591 270 L609 270 L780 400 L420 400Z" fill={SCENE.road} />
      <g fill={SCENE.line}>
        <rect x="599.2" y="278" width="1.6" height="4" />
        <rect x="598.8" y="292" width="2.4" height="6" />
        <rect x="598.2" y="312" width="3.6" height="9" />
        <rect x="597.2" y="340" width="5.6" height="14" />
        <rect x="596" y="378" width="8" height="22" />
      </g>
      {/* Border booth, flag and stop line */}
      <rect x="586" y="286" width="28" height="2" fill={SCENE.line} opacity="0.9" />
      <rect x="622" y="262" width="24" height="18" fill={SCENE.line} />
      <rect x="619" y="258" width="30" height="5" fill={SCENE.sun} />
      <rect x="627" y="267" width="14" height="6" fill={SCENE.mid} />
      <rect x="566" y="236" width="2" height="46" fill={SCENE.line} />
      <rect x="568" y="236" width="18" height="11" fill={SCENE.sun} />
    </svg>
  );
}
