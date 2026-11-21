import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-5 py-12">
      <h1 className="text-4xl font-normal tracking-[-0.035em]">Crossing not found</h1>
      <p className="opacity-80">
        We don&apos;t have a page for that crossing. Maybe try one of the curated ones.
      </p>
      <Link href="/" className="link text-sm">
        ← All crossings
      </Link>
    </main>
  );
}
