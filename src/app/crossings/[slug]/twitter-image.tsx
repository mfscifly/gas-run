import { CROSSINGS, PROVINCE_LABELS, getCrossing } from "@/data/crossings";
import { OG_CONTENT_TYPE, OG_SIZE, renderShareCard } from "@/lib/og";

export const alt = "Crossing wait times and gas savings";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export function generateStaticParams() {
  return CROSSINGS.map((c) => ({ slug: c.slug }));
}

export default async function TwitterImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const c = getCrossing(slug);
  return renderShareCard({
    eyebrow: c ? `${PROVINCE_LABELS[c.province]} crossing` : "Border crossing",
    title: c?.name ?? "Crossing not found",
    subtitle: c
      ? `${c.canadianTown} to ${c.americanTown}. Live waits both ways and what a tank saves you.`
      : "Live border waits and gas savings.",
  });
}
