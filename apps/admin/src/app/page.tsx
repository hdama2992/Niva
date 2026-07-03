export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-rose-50 p-8 text-slate-900">
      <section className="max-w-xl rounded-3xl bg-white p-10 shadow-xl shadow-rose-100">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-rose-500">
          Niva admin
        </p>
        <h1 className="mb-4 text-4xl font-bold tracking-tight">
          The dashboard is ready for Sprint 1.
        </h1>
        <p className="text-lg leading-8 text-slate-600">
          Manage communities, activities, and member safety from one place.
        </p>
      </section>
    </main>
  );
}
