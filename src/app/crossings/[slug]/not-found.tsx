import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-5 py-12">
      <h1 className="text-2xl font-semibold">Crossing not found</h1>
      <p className="opacity-80">
        We don&apos;t have a page for that crossing. Maybe try one of the curated ones.
      </p>
      <Link href="/" className="underline text-sm">
        ← All crossings
      </Link>
    </main>
  );
}
