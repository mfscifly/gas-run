// Flat illustration of a highway running up to a border booth under a low
// sun. Pure SVG with no hooks or CSS classes, so the same JSX renders on the
// site and inside the Satori share card (src/lib/og.tsx).
//
// The viewBox skips the empty sky above y=140, so a box with the same aspect
// (1200:260) shows the whole scene; shorter boxes crop the top and cut off
// the sun, so every hero uses that aspect at all widths.
//
// Smooth curves and soft gradients only: no hard polygon edges.
//
// Palette is fixed rather than themed: the scene always sits on the blue
// hero band, in light and dark mode alike.
export const SCENE = {
  skyTop: "#1f4fe0",
  skyBottom: "#4a78f5",
  sun: "#ffd27a",
  farTop: "#93b0ff",
  farBottom: "#5b84f6",
  midTop: "#2f5ce0",
  midBottom: "#1b43c2",
  nearTop: "#183da6",
  nearBottom: "#0f2b7e",
  tree: "#10307f",
  treeNear: "#0a2063",
  road: "#0a1a4a",
  line: "#ffffff",
} as const;

// Tree and Cloud are called as plain functions, not as <Tree />, because Satori
// serialises SVG children directly and doesn't render nested components there.
// A rounded conifer, drawn around (0,0) at its tip; ~20 wide, ~26 tall.
function Tree({ x, y, s = 1, fill }: { x: number; y: number; s?: number; fill: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path
        d="M0 0 C-2 5 -6 9 -6 12 C-6 14 -3 14 -4 15 C-7 18 -10 21 -10 23 C-10 26 10 26 10 23 C10 21 7 18 4 15 C3 14 6 14 6 12 C6 9 2 5 0 0Z"
        fill={fill}
      />
      <rect x="-1.2" y="24" width="2.4" height="4" rx="1" fill={fill} />
    </g>
  );
}

function Cloud({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} fill="#ffffff" opacity="0.22">
      <circle cx="16" cy="10" r="10" />
      <circle cx="32" cy="6" r="13" />
      <circle cx="49" cy="11" r="9" />
      <rect x="6" y="10" width="52" height="11" rx="5.5" />
    </g>
  );
}

export function BorderScene({
  width = "100%",
  height = "100%",
  idPrefix = "scene",
  preserveAspectRatio = "xMidYMax slice",
}: {
  width?: number | string;
  height?: number | string;
  /** Unique per page instance, since gradient ids are document-global. */
  idPrefix?: string;
  preserveAspectRatio?: string;
}) {
  const id = (k: string) => `${idPrefix}-${k}`;
  const url = (k: string) => `url(#${id(k)})`;
  return (
    <svg
      viewBox="0 140 1200 260"
      width={width}
      height={height}
      preserveAspectRatio={preserveAspectRatio}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id={id("glow")} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={SCENE.sun} stopOpacity="0.55" />
          <stop offset="1" stopColor={SCENE.sun} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={id("far")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={SCENE.farTop} />
          <stop offset="1" stopColor={SCENE.farBottom} />
        </linearGradient>
        <linearGradient id={id("mid")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={SCENE.midTop} />
          <stop offset="1" stopColor={SCENE.midBottom} />
        </linearGradient>
        <linearGradient id={id("near")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={SCENE.nearTop} />
          <stop offset="1" stopColor={SCENE.nearBottom} />
        </linearGradient>
      </defs>

      {/* Sun and its glow */}
      <circle cx="905" cy="214" r="72" fill={url("glow")} />
      <circle cx="905" cy="214" r="44" fill={SCENE.sun} />

      {Cloud({ x: 190, y: 162, s: 1.1 })}
      {Cloud({ x: 700, y: 156, s: 0.8 })}
      {Cloud({ x: 1040, y: 176, s: 0.9 })}

      {/* Far ridge: soft, rounded peaks */}
      <path
        d="M0 262 C70 250 110 214 180 212 C250 210 280 246 350 244 C420 242 460 196 540 194 C620 192 650 236 720 238 C790 240 830 206 900 204 C970 202 1010 240 1080 236 C1140 232 1170 218 1200 214 V400 H0Z"
        fill={url("far")}
      />
      {/* Rolling middle hills */}
      <path
        d="M0 300 C120 276 220 286 330 296 C440 306 520 282 600 280 C700 278 780 300 880 292 C980 284 1080 270 1200 282 V400 H0Z"
        fill={url("mid")}
      />
      {Tree({ x: 292, y: 270, s: 0.9, fill: SCENE.tree })}
      {Tree({ x: 310, y: 276, s: 0.75, fill: SCENE.tree })}
      {Tree({ x: 326, y: 272, s: 0.85, fill: SCENE.tree })}
      {Tree({ x: 812, y: 268, s: 0.85, fill: SCENE.tree })}
      {Tree({ x: 830, y: 274, s: 0.7, fill: SCENE.tree })}
      {Tree({ x: 1110, y: 254, s: 0.8, fill: SCENE.tree })}

      {/* Foreground */}
      <path
        d="M0 342 C160 326 300 334 450 344 C560 351 640 350 760 340 C900 328 1040 330 1200 340 V400 H0Z"
        fill={url("near")}
      />
      {Tree({ x: 120, y: 300, s: 1.5, fill: SCENE.treeNear })}
      {Tree({ x: 150, y: 312, s: 1.15, fill: SCENE.treeNear })}
      {Tree({ x: 1010, y: 298, s: 1.4, fill: SCENE.treeNear })}
      {Tree({ x: 1040, y: 310, s: 1.05, fill: SCENE.treeNear })}
      {Tree({ x: 1068, y: 304, s: 1.25, fill: SCENE.treeNear })}

      {/* Winding highway */}
      <path
        d="M595 282 C586 304 612 322 604 346 C598 366 560 384 520 400 L690 400 C664 384 630 366 632 346 C636 322 610 304 605 282Z"
        fill={SCENE.road}
      />
      <path
        d="M600 286 C596 306 622 324 618 346 C615 366 600 384 605 400"
        fill="none"
        stroke={SCENE.line}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeDasharray="5 8"
        opacity="0.9"
      />

      {/* Border booth with canopy, barrier arm and flag */}
      <rect x="620" y="261" width="28" height="20" rx="3" fill={SCENE.line} />
      <rect x="616" y="255" width="36" height="7" rx="3.5" fill={SCENE.sun} />
      <rect x="626" y="266" width="16" height="7" rx="2" fill={SCENE.midBottom} />
      <path d="M612 283 H584" stroke={SCENE.line} strokeWidth="3" strokeLinecap="round" />
      <circle cx="613" cy="283" r="3" fill={SCENE.sun} />
      <rect x="565" y="234" width="2.4" height="50" rx="1.2" fill={SCENE.line} />
      <path
        d="M567.4 236 C573 232 579 240 587 236 V248 C579 252 573 244 567.4 248Z"
        fill={SCENE.sun}
      />
    </svg>
  );
}
