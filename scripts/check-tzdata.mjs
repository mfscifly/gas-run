// Fails the build when the Node runtime's time zone data predates BC's move to
// permanent UTC-7 (November 2026). Wait-time clocks are rendered through Intl
// in America/Vancouver, so stale tzdata would silently show BC times an hour
// early ("8:00 AM" for a 9:00 AM reading). Node bundles its own ICU tzdata, so
// the fix is a newer Node, not a system package.
const zone = "America/Vancouver";
const probe = new Date("2026-12-01T20:00:00Z"); // winter, after the change

const offset = new Intl.DateTimeFormat("en-US", {
  timeZone: zone,
  timeZoneName: "longOffset",
})
  .formatToParts(probe)
  .find((p) => p.type === "timeZoneName")?.value;

if (offset !== "GMT-07:00") {
  console.error(
    `[check-tzdata] ${zone} reports ${offset} for December 2026; expected GMT-07:00.\n` +
      `  Node ${process.version} ships tzdata ${process.versions.tz ?? "unknown"}, which predates BC's\n` +
      `  switch to permanent UTC-7. Upgrade Node (netlify.toml NODE_VERSION) before deploying.`,
  );
  process.exit(1);
}
console.log(`[check-tzdata] ok: ${zone} is ${offset} (tzdata ${process.versions.tz ?? "?"})`);
