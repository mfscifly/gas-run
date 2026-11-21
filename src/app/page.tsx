import Link from "next/link";
import { ProvinceAccordion } from "@/components/ProvinceAccordion";
import { PriceConverter } from "@/components/PriceConverter";
import { getAllWaits } from "@/lib/wait-times";

export const revalidate = 300;

export default async function Home() {
  const waits = await getAllWaits();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-14 px-5 py-10 sm:gap-16 sm:py-16">
      <header className="flex flex-col gap-4">
        <span className="label-mono text-accent opacity-100">Border waits · Pump prices · Savings</span>
        <h1 className="text-4xl sm:text-6xl font-normal tracking-[-0.035em] leading-[1.02]">
          Cross-Border Gas Tools
        </h1>
        <p className="max-w-xl text-base sm:text-lg leading-relaxed opacity-70">
          Decide whether the trip across the border is worth it. Pick your crossing for live wait times and a savings estimate based on local pump prices.
        </p>
      </header>

      <section className="flex flex-col gap-4">
        <header className="flex flex-col gap-1.5 border-t border-foreground pt-4">
          <h2 className="text-xl font-medium tracking-tight">Pick a crossing</h2>
          <p className="label-mono tabular-nums">
            To US (CBP) · To CA (CBSA) · updates every 5 min
          </p>
        </header>
        <ProvinceAccordion data={waits} />
      </section>

      <section className="flex flex-col gap-4">
        <header className="flex flex-col gap-1.5 border-t border-foreground pt-4">
          <h2 className="text-xl font-medium tracking-tight">Quick price converter</h2>
          <p className="text-sm opacity-70">
            See what a US/gal price means in CAD/L (or vice versa). Updates as you type.
          </p>
        </header>
        <PriceConverter />
      </section>

      <footer className="border-t border-line pt-6 text-sm opacity-70 flex flex-wrap gap-x-4 gap-y-1">
        <span>FX: ExchangeRate-API · Waits: CBP</span>
        <Link
          href="https://www.gasbuddy.com/gaspricemap"
          target="_blank"
          rel="noopener noreferrer"
          className="link"
        >
          Live pump prices: GasBuddy
        </Link>
      </footer>
    </main>
  );
}
