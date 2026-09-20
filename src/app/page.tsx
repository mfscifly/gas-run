import Link from "next/link";
import { ProvinceAccordion } from "@/components/ProvinceAccordion";
import { PriceConverter } from "@/components/PriceConverter";
import { getAllWaits } from "@/lib/wait-times";

export const revalidate = 300;

export default async function Home() {
  const waits = await getAllWaits();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-5 py-8 sm:py-14">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
          Cross-Border Gas Tools
        </h1>
        <p className="text-base opacity-80">
          Decide whether the trip across the border is worth it. Pick your crossing for live wait times and a savings estimate based on local pump prices.
        </p>
      </header>

      <section className="flex flex-col gap-3">
        <header className="flex flex-col gap-1">
          <h2 className="text-xl font-semibold">Pick a crossing</h2>
          <p className="text-xs opacity-60 tabular-nums">
            To US (CBP) · To CA (CBSA) · updates every 5 min
          </p>
        </header>
        <ProvinceAccordion data={waits} />
      </section>

      <section className="flex flex-col gap-3">
        <header>
          <h2 className="text-xl font-semibold">Quick price converter</h2>
          <p className="text-sm opacity-70">
            See what a US/gal price means in CAD/L (or vice versa). Updates as you type.
          </p>
        </header>
        <PriceConverter />
      </section>

      <footer className="border-t border-black/10 dark:border-white/15 pt-6 text-sm opacity-70 flex flex-wrap gap-x-4 gap-y-1">
        <span>FX: ExchangeRate-API · Waits: CBP</span>
        <Link
          href="https://www.gasbuddy.com/gaspricemap"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          Live pump prices: GasBuddy
        </Link>
      </footer>
    </main>
  );
}
