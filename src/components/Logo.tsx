// The brand mark: a fuel pump on a border-blue square, hose in sun yellow.
// Kept in sync by hand with src/app/icon.svg (favicon), src/app/apple-icon.tsx
// and src/lib/og.tsx, which can't read CSS variables.
export function LogoMark({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={className}>
      <rect width="32" height="32" fill="#1f4fe0" />
      <g fill="#ffffff">
        <rect x="8.5" y="7.5" width="10" height="17" />
        <rect x="7" y="23.5" width="13" height="2.5" />
      </g>
      <rect x="10.5" y="10" width="6" height="4.5" fill="#1f4fe0" />
      <path
        d="M18.5 11h2.2l2.3 2.3v7.2a1.25 1.25 0 0 1-2.5 0v-3a1.6 1.6 0 0 0-1.6-1.6h-.4"
        fill="none"
        stroke="#ffd27a"
        strokeWidth="1.8"
        strokeLinecap="square"
      />
    </svg>
  );
}
