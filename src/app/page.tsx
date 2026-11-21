import Link from "next/link";
import { ProvinceAccordion } from "@/components/ProvinceAccordion";
import { PriceConverter } from "@/components/PriceConverter";
import { BorderScene } from "@/components/BorderScene";
import { LiveCameras } from "@/components/LiveCameras";
import { getAllWaits } from "@/lib/wait-times";

export const revalidate = 300;

export default async function Home() {
  const waits = await getAllWaits();

  return (
    <>
    <header className="hero-band text-white">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-2.5 px-5 pt-6 sm:gap-4 sm:pt-16">
        <span className="label-mono text-sun opacity-100">Border waits · Pump prices · Savings</span>
        <h1 className="text-[2.5rem] sm:text-6xl font-normal tracking-[-0.035em] leading-[1.02]">
          Gas Run
        </h1>
        <p className="max-w-xl text-sm sm:text-lg leading-relaxed opacity-85">
          Decide whether the trip across the border is worth it. Pick your crossing for live wait times and a savings estimate based on local pump prices.
        </p>
      </div>
      <div className="mt-2 aspect-[1200/260] sm:mt-6">
        <BorderScene />
      </div>
    </header>

    <main className="mx-auto flex w-full max-w-3xl flex-col gap-14 px-5 py-6 sm:gap-16 sm:py-14">
      <section className="flex flex-col gap-4">
        <header className="section-head">
          <h2 className="text-xl font-medium tracking-tight">Pick a crossing</h2>
          <p className="label-mono tabular-nums">
            To US (CBP) · To CA (CBSA) · updates every 5 min
          </p>
        </header>
        <ProvinceAccordion data={waits} />
      </section>

      <section className="flex flex-col gap-4">
        <header className="section-head">
          <h2 className="text-xl font-medium tracking-tight">Live at the border</h2>
          <p className="label-mono">Camera stills · refresh every 5 min</p>
        </header>
        <LiveCameras revalidateSec={revalidate} />
        <Link href="/cameras" className="link self-start text-sm">
          See all border cameras →
        </Link>
      </section>

      <section className="flex flex-col gap-4">
        <header className="section-head">
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
    </>
  );
}
