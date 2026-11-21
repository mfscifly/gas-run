import { XMLParser } from "fast-xml-parser";
import { crossingTimeZone, type Crossing } from "@/data/crossings";
import { parseCbpUpdateTime, parseCbsaUpdateTime } from "@/lib/time";

const CBP_FEED_URL = "https://bwt.cbp.gov/xml/bwt.xml";
const CBSA_FEED_URL = "https://www.cbsa-asfc.gc.ca/bwt-taf/bwt-eng.csv";
const REVALIDATE_SECONDS = 300;

export type LaneStatus = "open" | "closed" | "update-pending";

export type WaitTime = {
  delayMin: number | null;
  status: LaneStatus;
  // The feed's own text, kept only as a fallback for display when it can't be
  // parsed. Render updatedAt through formatUpdatedClock instead.
  updateTime: string | null;
  // ISO instant of updateTime, or null if the feed's format wasn't recognized.
  // For CBSA this is filled in by getCrossingWaits, which knows the zone.
  updatedAt: string | null;
};

export type CbpWait = WaitTime & {
  nexusDelayMin: number | null;
  readyLanesDelayMin: number | null;
};

export type CrossingWaits = {
  usBound: CbpWait | null;
  caBound: WaitTime | null;
};

export type WaitsData = {
  byCbpPort: Map<string, CbpWait>;
  byCbsaOffice: Map<string, WaitTime>;
};

// ---------- CBP (US-bound) ----------

type CbpLaneBlock = {
  delay_minutes?: number | string;
  operational_status?: string;
  update_time?: string;
};

type CbpPort = {
  port_number?: string | number;
  date?: string;
  passenger_vehicle_lanes?: {
    standard_lanes?: CbpLaneBlock;
    NEXUS_SENTRI_lanes?: CbpLaneBlock;
    ready_lanes?: CbpLaneBlock;
  };
};

type CbpFeed = {
  border_wait_time?: {
    port?: CbpPort | CbpPort[];
  };
};

// CBP's own feed bakes an "At " prefix into update_time (e.g. "At 9:00 am PDT").
// Strip it here so WaitTime.updateTime is a bare timestamp and the view can own
// the word "updated" for both feeds consistently. Matched case-insensitively,
// anchored to the start, and tolerant of extra whitespace, since this is an
// external feed that can change shape without notice; if the prefix isn't
// there, the value is left untouched.
function stripCbpUpdatePrefix(raw: string | null | undefined): string | null {
  if (raw === null || raw === undefined) return null;
  const match = raw.match(/^\s*at\s+(.*)$/i);
  if (!match) return raw;
  const rest = match[1].trim();
  return rest === "" ? null : rest;
}

function parseDelay(block: CbpLaneBlock | undefined): number | null {
  if (!block) return null;
  const raw = block.delay_minutes;
  if (raw === undefined || raw === null || raw === "") return null;
  const n = typeof raw === "number" ? raw : Number(raw);
  return Number.isFinite(n) ? n : null;
}

function deriveCbpStatus(port: CbpPort, standard: number | null): LaneStatus {
  const op = port.passenger_vehicle_lanes?.standard_lanes?.operational_status;
  if (op && /closed/i.test(op)) return "closed";
  if (standard === null) return "update-pending";
  return "open";
}

function toCbpWait(port: CbpPort): { portNumber: string; wait: CbpWait } | null {
  const portNumber = port.port_number?.toString();
  if (!portNumber) return null;
  const std = parseDelay(port.passenger_vehicle_lanes?.standard_lanes);
  const updateTime = stripCbpUpdatePrefix(
    port.passenger_vehicle_lanes?.standard_lanes?.update_time ?? null,
  );
  const updatedAt = parseCbpUpdateTime(updateTime, port.date?.toString());
  return {
    portNumber,
    wait: {
      delayMin: std,
      nexusDelayMin: parseDelay(port.passenger_vehicle_lanes?.NEXUS_SENTRI_lanes),
      readyLanesDelayMin: parseDelay(port.passenger_vehicle_lanes?.ready_lanes),
      status: deriveCbpStatus(port, std),
      updateTime,
      updatedAt: updatedAt?.toISOString() ?? null,
    },
  };
}

let xmlParserSingleton: XMLParser | null = null;
function xmlParser(): XMLParser {
  if (!xmlParserSingleton) {
    xmlParserSingleton = new XMLParser({
      ignoreAttributes: true,
      parseTagValue: true,
      trimValues: true,
    });
  }
  return xmlParserSingleton;
}

async function fetchCbp(): Promise<Map<string, CbpWait>> {
  const map = new Map<string, CbpWait>();
  try {
    const res = await fetch(CBP_FEED_URL, {
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!res.ok) return map;
    const xml = await res.text();
    const parsed = xmlParser().parse(xml) as CbpFeed;
    const portsRaw = parsed.border_wait_time?.port;
    const ports: CbpPort[] = Array.isArray(portsRaw)
      ? portsRaw
      : portsRaw
        ? [portsRaw]
        : [];
    for (const p of ports) {
      const entry = toCbpWait(p);
      if (entry) map.set(entry.portNumber, entry.wait);
    }
  } catch (err) {
    console.error("[wait-times] CBP fetch failed:", err);
  }
  return map;
}

// ---------- CBSA (Canada-bound) ----------

function parseCbsaDelay(raw: string): { delayMin: number | null; status: LaneStatus } {
  const v = raw.trim();
  if (v === "" || v === "--") return { delayMin: null, status: "update-pending" };
  if (/^not applicable$/i.test(v)) return { delayMin: null, status: "closed" };
  // The feed reports an out-of-hours or suspended port as "Temporarily closed".
  // Without this it fell through to update-pending and the UI claimed the wait
  // was unavailable, when in fact the feed told us exactly what was going on.
  if (/closed/i.test(v)) return { delayMin: null, status: "closed" };
  if (/^no delay$/i.test(v)) return { delayMin: 0, status: "open" };
  const m = v.match(/^(\d+)\s*minute/i);
  if (m) return { delayMin: Number(m[1]), status: "open" };
  return { delayMin: null, status: "update-pending" };
}

function parseCbsaCsv(csv: string): Map<string, WaitTime> {
  const map = new Map<string, WaitTime>();
  // Strip BOM if present.
  const body = csv.replace(/^﻿/, "");
  const lines = body.split(/\r?\n/);
  // Skip header (line 0); split by ";;".
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    const cols = line.split(";;").map((c) => c.trim());
    // Columns: office, location, lastUpdated, commCa, commUs, travCa, travUs, (trailing)
    if (cols.length < 7) continue;
    const office = cols[0];
    const updateTime = cols[2] || null;
    const travCaRaw = cols[5] ?? "";
    const { delayMin, status } = parseCbsaDelay(travCaRaw);
    if (!office) continue;
    map.set(office, { delayMin, status, updateTime, updatedAt: null });
  }
  return map;
}

async function fetchCbsa(): Promise<Map<string, WaitTime>> {
  const map = new Map<string, WaitTime>();
  try {
    const res = await fetch(CBSA_FEED_URL, {
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!res.ok) return map;
    const csv = await res.text();
    return parseCbsaCsv(csv);
  } catch (err) {
    console.error("[wait-times] CBSA fetch failed:", err);
  }
  return map;
}

// ---------- Public API ----------

export async function getAllWaits(): Promise<WaitsData> {
  const [byCbpPort, byCbsaOffice] = await Promise.all([fetchCbp(), fetchCbsa()]);
  return { byCbpPort, byCbsaOffice };
}

export function getCrossingWaits(
  crossing: Crossing,
  data: WaitsData,
): CrossingWaits {
  const ca = crossing.cbsaOffice
    ? data.byCbsaOffice.get(crossing.cbsaOffice) ?? null
    : null;
  return {
    usBound: crossing.cbpPortNumber
      ? data.byCbpPort.get(crossing.cbpPortNumber) ?? null
      : null,
    // CBSA reports wall-clock time at the port, so it can only become an
    // instant once we know which crossing (and therefore which zone) it is.
    caBound: ca && {
      ...ca,
      updatedAt:
        parseCbsaUpdateTime(ca.updateTime, crossingTimeZone(crossing))?.toISOString() ??
        null,
    },
  };
}
