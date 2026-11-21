// One place that turns feed timestamps into instants and instants into the
// "9:00 AM" the UI shows. Everything here goes through IANA zone names and
// Intl, never hardcoded offsets or PST/PDT strings: BC moved to permanent
// UTC-7 in November 2026, so America/Vancouver no longer follows the old
// PST/PDT switch, and the feeds' own abbreviations can lag behind that.
// scripts/check-tzdata.mjs fails the build if the runtime's tzdata predates it.

export type ZonedWallTime = {
  year: number;
  month: number; // 1-12
  day: number;
  hour: number; // 0-23
  minute: number;
};

// Offset of `timeZone` from UTC at `instant`, in minutes (UTC-7 -> -420).
export function zoneOffsetMinutes(instant: Date, timeZone: string): number {
  const part = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "longOffset",
  })
    .formatToParts(instant)
    .find((p) => p.type === "timeZoneName")?.value;
  // "GMT-07:00", "GMT+05:30", or bare "GMT" for UTC.
  const m = part?.match(/GMT([+-])(\d{2}):?(\d{2})?/);
  if (!m) return 0;
  const mins = Number(m[2]) * 60 + Number(m[3] ?? 0);
  return m[1] === "-" ? -mins : mins;
}

// A wall-clock reading in `timeZone` -> the instant it names. Two passes so a
// reading near an offset change still lands on the right side of it.
export function zonedWallTimeToInstant(t: ZonedWallTime, timeZone: string): Date {
  const naiveUtc = Date.UTC(t.year, t.month - 1, t.day, t.hour, t.minute);
  let guess = naiveUtc - zoneOffsetMinutes(new Date(naiveUtc), timeZone) * 60_000;
  guess = naiveUtc - zoneOffsetMinutes(new Date(guess), timeZone) * 60_000;
  return new Date(guess);
}

// US zone abbreviations as CBP prints them. These are safe to map to fixed
// offsets because they describe the US side, which still observes DST; the
// abbreviation already says which half of the year it is.
const US_ABBREVIATION_OFFSETS: Record<string, number> = {
  EST: -300,
  EDT: -240,
  CST: -360,
  CDT: -300,
  MST: -420,
  MDT: -360,
  PST: -480,
  PDT: -420,
  AKST: -540,
  AKDT: -480,
  AST: -240,
  ADT: -180,
};

// CBP: "9:00 am PST" (the "At " prefix is stripped earlier), plus the port's
// own date field ("11/21/2026") when present. Returns null if the shape is
// unfamiliar, and the caller falls back to showing the raw text.
export function parseCbpUpdateTime(
  time: string | null,
  date: string | null | undefined,
  now: Date = new Date(),
): Date | null {
  if (!time) return null;
  const m = time.trim().match(/^(\d{1,2}):(\d{2})\s*([ap])\.?m\.?\s+([A-Z]{2,4})$/i);
  if (!m) return null;
  const offset = US_ABBREVIATION_OFFSETS[m[4].toUpperCase()];
  if (offset === undefined) return null;
  let hour = Number(m[1]) % 12;
  if (m[3].toLowerCase() === "p") hour += 12;
  const minute = Number(m[2]);

  const toInstant = (y: number, mo: number, d: number) =>
    new Date(Date.UTC(y, mo - 1, d, hour, minute) - offset * 60_000);

  const dm = date?.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dm) return toInstant(Number(dm[3]), Number(dm[1]), Number(dm[2]));

  // No date: take "today" on that clock, or yesterday if that would be in the
  // future (a 11:45 pm reading fetched just after midnight).
  const local = new Date(now.getTime() + offset * 60_000);
  let at = toInstant(local.getUTCFullYear(), local.getUTCMonth() + 1, local.getUTCDate());
  if (at.getTime() - now.getTime() > 60 * 60_000) {
    at = new Date(at.getTime() - 24 * 60 * 60_000);
  }
  return at;
}

// CBSA: "2026-11-21 09:00 PDT". The clock reading is the port's local time;
// the trailing abbreviation is ignored on purpose, because CBSA's labels for
// BC don't track the zone change (the same 9:00 has been labelled PDT in
// November). The crossing's IANA zone is the authority.
export function parseCbsaUpdateTime(raw: string | null, timeZone: string): Date | null {
  if (!raw) return null;
  const m = raw.trim().match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{1,2}):(\d{2})/);
  if (!m) return null;
  return zonedWallTimeToInstant(
    {
      year: Number(m[1]),
      month: Number(m[2]),
      day: Number(m[3]),
      hour: Number(m[4]),
      minute: Number(m[5]),
    },
    timeZone,
  );
}

// The single formatter for "updated ..." text: "9:00 AM" when the reading is
// from the last 12 hours, "Nov 20, 9:00 AM" when it is older, so a stale feed
// can't pass for a fresh one.
export function formatUpdatedClock(
  instant: Date,
  timeZone: string,
  now: Date = new Date(),
): string {
  const stale = now.getTime() - instant.getTime() > 12 * 60 * 60_000;
  const text = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
    ...(stale ? { month: "short", day: "numeric" } : {}),
  }).format(instant);
  // Newer ICU puts a narrow no-break space before AM/PM; keep it no-break but
  // use the ordinary width so both feeds render identically everywhere.
  return text.replace(/ /g, " ");
}

// Price-default dates are calendar dates ("2026-10-01"), not instants, so they
// are read in UTC to keep the day from shifting. StatCan's is the first of the
// surveyed month and EIA's is the survey week, so each gets its own wording.
function calendarDate(iso: string): Date | null {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]))) : null;
}

function withYearIfOld(d: Date, now: Date, opts: Intl.DateTimeFormatOptions): string {
  const year = d.getUTCFullYear() !== now.getUTCFullYear() ? { year: "numeric" as const } : {};
  return new Intl.DateTimeFormat("en-US", { timeZone: "UTC", ...opts, ...year }).format(d);
}

// "2026-10-01" -> "October" (or "October 2025" in another year).
export function formatPriceMonth(iso: string, now: Date = new Date()): string {
  const d = calendarDate(iso);
  return d ? withYearIfOld(d, now, { month: "long" }) : iso;
}

// "2026-11-16" -> "Nov 16" (or "Nov 16, 2025" in another year).
export function formatPriceWeek(iso: string, now: Date = new Date()): string {
  const d = calendarDate(iso);
  return d ? withYearIfOld(d, now, { month: "short", day: "numeric" }) : iso;
}
