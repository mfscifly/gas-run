// The brand mark: a fuel pump knocked out of a solid square, with the hose in
// the accent colour. Kept in sync by hand with src/app/icon.svg (favicon),
// src/app/apple-icon.tsx and src/lib/og.tsx, which can't read CSS variables.
export function LogoMark({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={className}>
      <rect width="32" height="32" className="fill-foreground" />
      <g className="fill-background">
        <rect x="8.5" y="7.5" width="10" height="17" />
        <rect x="7" y="23.5" width="13" height="2.5" />
      </g>
      <rect x="10.5" y="10" width="6" height="4.5" className="fill-foreground" />
      <path
        d="M18.5 11h2.2l2.3 2.3v7.2a1.25 1.25 0 0 1-2.5 0v-3a1.6 1.6 0 0 0-1.6-1.6h-.4"
        fill="none"
        strokeWidth="1.7"
        strokeLinecap="square"
        strokeLinejoin="miter"
        className="stroke-accent"
      />
    </svg>
  );
}
