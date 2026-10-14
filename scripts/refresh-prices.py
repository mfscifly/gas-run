#!/usr/bin/env python3
"""Regenerate the pump-price defaults in src/data/crossings.ts.

Both sources are free and keyless, which is why they were chosen over AAA or
GasBuddy (no public API):

  Canada  Statistics Canada table 18-10-0001, monthly average retail price for
          regular unleaded at self service, by city. JSON over a plain POST.
  US      EIA "Weekly Retail Gasoline and Diesel Prices", regular, all
          formulations. Only distributed as a legacy .xls workbook.

Rewrites everything between the <generated:prices> markers. Run with --check to
verify freshness without writing.

Exit codes: 0 written or already current, 1 stale (--check) or a source broke
or returned an insane value, 3 written but some market moved more than
MAX_RUN_CHANGE since the last run. CI commits 0 straight to main and routes 3
to a PR for a human to look at.

Usage:
    python3 scripts/refresh-prices.py [--check]
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import pathlib
import re
import sys
import urllib.request

import xlrd

TARGET = pathlib.Path(__file__).resolve().parent.parent / "src/data/crossings.ts"

STATCAN_URL = (
    "https://www150.statcan.gc.ca/t1/wds/rest/"
    "getDataFromCubePidCoordAndLatestNPeriods"
)
EIA_URL = "https://www.eia.gov/petroleum/gasdiesel/xls/pswrgvwall.xls"

# StatCan geography member ids from table 18-10-0001, keyed by the CaMarket
# union in src/data/crossings.ts. Each crossing points at one of these, so a
# province with several surveyed markets (Ontario) is no longer flattened to one.
CA_MARKETS = {
    "Vancouver": (16, "Vancouver"),
    "Calgary": (15, "Calgary"),
    "Regina": (12, "Regina"),
    "Winnipeg": (11, "Winnipeg"),
    "Toronto": (9, "Toronto"),
    "ThunderBay": (10, "Thunder Bay"),
    "Ottawa": (8, "Ottawa-Gatineau"),
    "Montreal": (7, "Montreal"),
    "SaintJohn": (5, "Saint John"),
}
# Dimension 2 member 2 = regular unleaded at self service filling stations.
CA_FUEL_MEMBER = 2

# EIA sourcekeys from sheet "Data 3" (regular, all formulations). EIA only
# breaks out nine states weekly; anything it does not cover falls back to the
# PADD region containing it.
US_MARKETS = {
    "WA": ("EMM_EPMR_PTE_SWA_DPG", "state series"),
    "MN": ("EMM_EPMR_PTE_SMN_DPG", "state series"),
    "NY": ("EMM_EPMR_PTE_SNY_DPG", "state series"),
    "MT": ("EMM_EPMR_PTE_R40_DPG", "PADD 4 Rocky Mountain"),
    "ND": ("EMM_EPMR_PTE_R20_DPG", "PADD 2 Midwest"),
    "MI": ("EMM_EPMR_PTE_R20_DPG", "PADD 2 Midwest"),
    "VT": ("EMM_EPMR_PTE_R1X_DPG", "PADD 1A New England"),
    "NH": ("EMM_EPMR_PTE_R1X_DPG", "PADD 1A New England"),
    "ME": ("EMM_EPMR_PTE_R1X_DPG", "PADD 1A New England"),
}

# Declaration order in the generated tables, matching the Province / UsState
# unions so the file reads consistently.
CA_ORDER = [
    "Vancouver", "Calgary", "Regina", "Winnipeg", "Toronto",
    "ThunderBay", "Ottawa", "Montreal", "SaintJohn",
]
US_ORDER = ["WA", "MT", "ND", "MN", "MI", "NY", "VT", "NH", "ME"]

# A price outside these bounds means the source changed shape or we grabbed the
# wrong series. Better to fail loudly than to publish it.
SANITY_MIN_CAD_PER_L, SANITY_MAX_CAD_PER_L = 0.80, 4.00
SANITY_MIN_USD_PER_GAL, SANITY_MAX_USD_PER_GAL = 1.50, 10.00

# Plausible but large moves between runs. Real prices rarely swing this much in
# a week or a month, so anything past it gets a human look before it ships.
MAX_RUN_CHANGE = 0.15
EXIT_NEEDS_REVIEW = 3

PRICE_LINE = re.compile(r"^\s+(\w+): \{ (?:cadPerL|usdPerGal): ([\d.]+),", re.M)


def fetch_canada() -> tuple[dict[str, float], str]:
    """Latest StatCan monthly price per market, in CAD/L."""
    payload = [
        {
            "productId": 18100001,
            "coordinate": f"{geo}.{CA_FUEL_MEMBER}.0.0.0.0.0.0.0.0",
            "latestN": 1,
        }
        for geo, _label in CA_MARKETS.values()
    ]
    req = urllib.request.Request(
        STATCAN_URL,
        data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=60) as r:
        body = json.load(r)

    by_geo: dict[int, tuple[float, str]] = {}
    for entry in body:
        if entry.get("status") != "SUCCESS":
            raise SystemExit(f"StatCan returned a non-success row: {entry}")
        obj = entry["object"]
        geo = int(obj["coordinate"].split(".")[0])
        point = obj["vectorDataPoint"][0]
        by_geo[geo] = (point["value"], point["refPer"])

    prices: dict[str, float] = {}
    periods = set()
    for market, (geo, label) in CA_MARKETS.items():
        if geo not in by_geo:
            raise SystemExit(f"StatCan returned no data for {market} ({label})")
        cents, ref_per = by_geo[geo]
        dollars = round(cents / 100, 3)
        if not SANITY_MIN_CAD_PER_L <= dollars <= SANITY_MAX_CAD_PER_L:
            raise SystemExit(f"{market} price {dollars} CAD/L is outside sane bounds")
        prices[market] = dollars
        periods.add(ref_per)

    if len(periods) != 1:
        raise SystemExit(f"StatCan mixed reference periods: {sorted(periods)}")
    return prices, periods.pop()


def fetch_us() -> tuple[dict[str, float], str]:
    """Latest EIA weekly price per state, in USD/gal."""
    with urllib.request.urlopen(EIA_URL, timeout=120) as r:
        blob = r.read()

    book = xlrd.open_workbook(file_contents=blob)
    sheet = book.sheet_by_name("Data 3")
    keys = [sheet.cell_value(1, c) for c in range(sheet.ncols)]
    col_of = {k: i for i, k in enumerate(keys)}

    last = None
    for row in range(sheet.nrows - 1, 2, -1):
        if isinstance(sheet.cell_value(row, 0), float):
            last = row
            break
    if last is None:
        raise SystemExit("EIA workbook had no dated rows")

    period = xlrd.xldate_as_datetime(sheet.cell_value(last, 0), book.datemode)

    prices: dict[str, float] = {}
    for state, (sourcekey, _note) in US_MARKETS.items():
        if sourcekey not in col_of:
            raise SystemExit(f"EIA workbook is missing sourcekey {sourcekey}")
        value = sheet.cell_value(last, col_of[sourcekey])
        if not isinstance(value, float):
            raise SystemExit(f"{state} ({sourcekey}) had a non-numeric value: {value!r}")
        if not SANITY_MIN_USD_PER_GAL <= value <= SANITY_MAX_USD_PER_GAL:
            raise SystemExit(f"{state} price {value} USD/gal is outside sane bounds")
        prices[state] = round(value, 3)

    return prices, period.date().isoformat()


def render(ca: dict[str, float], ca_date: str, us: dict[str, float], us_date: str) -> str:
    geo_hint = ", ".join(
        f"{label} {geo}" for _market, (geo, label) in CA_MARKETS.items()
    )
    lines = [
        "// Canadian defaults: Statistics Canada table 18-10-0001, \"Monthly average",
        "// retail prices for gasoline and fuel oil, by geography\", regular unleaded at",
        "// self service. Monthly, so this is the most recent month published. Each",
        "// crossing is keyed to the surveyed market nearest it, via Crossing.caMarket.",
        f"// Geography members: {geo_hint}.",
        f'const CA_PRICE_UPDATED = "{ca_date}";',
        "",
        "// US defaults: EIA \"Weekly Retail Gasoline and Diesel Prices\", regular, all",
        "// formulations, from pswrgvwall.xls sheet \"Data 3\". EIA only breaks out a",
        "// handful of states weekly, so states it does not cover fall back to their",
        "// PADD region, noted per entry.",
        f'const US_PRICE_UPDATED = "{us_date}";',
        "",
        "export const CA_MARKET_PRICES: Record<CaMarket, CaMarketPriceDefault> = {",
    ]
    for market in CA_ORDER:
        lines.append(
            f"  {market}: {{ cadPerL: {ca[market]:.3f}, updatedAt: CA_PRICE_UPDATED }},"
        )
    lines += ["};", "", "export const US_STATE_PRICES: Record<UsState, UsStatePriceDefault> = {"]
    for state in US_ORDER:
        note = US_MARKETS[state][1]
        lines.append(
            f"  {state}: {{ usdPerGal: {us[state]:.3f}, updatedAt: US_PRICE_UPDATED }}, // {note}"
        )
    lines.append("};")
    return "\n".join(lines)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument(
        "--check",
        action="store_true",
        help="report whether the file is current; write nothing",
    )
    args = ap.parse_args()

    ca, ca_date = fetch_canada()
    us, us_date = fetch_us()

    source = TARGET.read_text()
    pattern = re.compile(
        r"(// <generated:prices>[^\n]*\n)(.*?)(\n// </generated:prices>)", re.S
    )
    match = pattern.search(source)
    if not match:
        raise SystemExit(f"{TARGET} is missing its <generated:prices> markers")

    block = render(ca, ca_date, us, us_date)
    if match.group(2) == block:
        print(f"Prices already current (CA {ca_date}, US {us_date}).")
        return 0

    print(f"Prices are stale. Newest: CA {ca_date}, US {us_date}.")
    for market in CA_ORDER:
        print(f"  {market} {ca[market]:.3f} CAD/L  ({CA_MARKETS[market][1]})")
    for state in US_ORDER:
        print(f"  {state} {us[state]:.3f} USD/gal  ({US_MARKETS[state][1]})")

    if args.check:
        return 1

    old = {key: float(val) for key, val in PRICE_LINE.findall(match.group(2))}
    new = {**ca, **us}
    jumps = [
        f"  {key} {old[key]:.3f} -> {new[key]:.3f} ({(new[key] - old[key]) / old[key]:+.1%})"
        for key in CA_ORDER + US_ORDER
        if key in old and abs(new[key] - old[key]) / old[key] > MAX_RUN_CHANGE
    ]

    TARGET.write_text(source[: match.start(2)] + block + source[match.end(2) :])
    print(f"\nWrote {TARGET}.")

    if jumps:
        print(f"\nMoved more than {MAX_RUN_CHANGE:.0%} since the last run:")
        print("\n".join(jumps))
        return EXIT_NEEDS_REVIEW
    return 0


if __name__ == "__main__":
    sys.exit(main())
