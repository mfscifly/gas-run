import { OG_CONTENT_TYPE, OG_SIZE, renderShareCard } from "@/lib/og";

export const alt = "Gas Run: live border waits and gas savings";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function TwitterImage() {
  return renderShareCard({
    eyebrow: "Cross-border gas",
    title: "Is the trip across the border worth it?",
    subtitle: "Live wait times at 22 crossings and a savings estimate from local pump prices.",
  });
}
