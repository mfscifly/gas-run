import { XMLParser } from "fast-xml-parser";
import type { Crossing } from "@/data/crossings";

const CBP_FEED_URL = "https://bwt.cbp.gov/xml/bwt.xml";
const CBSA_FEED_URL = "https://www.cbsa-asfc.gc.ca/bwt-taf/bwt-eng.csv";
const REVALIDATE_SECONDS = 300;

export type LaneStatus = "open" | "closed" | "update-pending";

export type WaitTime = {
  delayMin: number | null;
  status: LaneStatus;
  updateTime: string | null;
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
  return {
    portNumber,
    wait: {
      delayMin: std,
      nexusDelayMin: parseDelay(port.passenger_vehicle_lanes?.NEXUS_SENTRI_lanes),
      readyLanesDelayMin: parseDelay(port.passenger_vehicle_lanes?.ready_lanes),
      status: deriveCbpStatus(port, std),
      updateTime: port.passenger_vehicle_lanes?.standard_lanes?.update_time ?? null,
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
    map.set(office, { delayMin, status, updateTime });
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
  return {
    usBound: crossing.cbpPortNumber
      ? data.byCbpPort.get(crossing.cbpPortNumber) ?? null
      : null,
    caBound: crossing.cbsaOffice
      ? data.byCbsaOffice.get(crossing.cbsaOffice) ?? null
      : null,
  };
}
