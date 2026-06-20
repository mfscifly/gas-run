import { NextResponse } from "next/server";

type ExchangeRateApiResponse = {
  result: "success" | "error";
  conversion_rates?: Record<string, number>;
  "error-type"?: string;
};

export async function GET() {
  const key = process.env.EXCHANGE_RATE_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "EXCHANGE_RATE_API_KEY not configured" },
      { status: 500 },
    );
  }

  const res = await fetch(
    `https://v6.exchangerate-api.com/v6/${key}/latest/USD`,
    { next: { revalidate: 3600 } },
  );

  if (!res.ok) {
    return NextResponse.json(
      { error: `ExchangeRate-API responded ${res.status}` },
      { status: 502 },
    );
  }

  const data = (await res.json()) as ExchangeRateApiResponse;
  const cad = data.conversion_rates?.CAD;
  if (data.result !== "success" || typeof cad !== "number") {
    return NextResponse.json(
      { error: data["error-type"] ?? "Unexpected response" },
      { status: 502 },
    );
  }

  return NextResponse.json({ usdToCad: cad, fetchedAt: new Date().toISOString() });
}
