const pendingReviews = [
  {
    id: 'vr-101',
    name: 'Himaja Rao',
    username: 'himaja',
    city: 'Bangalore',
    submitted: '12 min ago',
    status: 'Pending',
  },
  {
    id: 'vr-102',
    name: 'Meera Iyer',
    username: 'meera_reads',
    city: 'Bangalore',
    submitted: '34 min ago',
    status: 'Needs review',
  },
];

const trustEvents = [
  'PHONE_VERIFIED',
  'USERNAME_SET',
  'PROFILE_COMPLETED',
  'SELF_DECLARATION_ACCEPTED',
  'SELFIE_SUBMITTED',
];

export default function Home() {
  return (
    <main className="min-h-screen bg-stone-50 px-6 py-8 text-stone-950">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="flex flex-col gap-4 border-b border-stone-200 pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-2 text-sm font-semibold text-rose-700">
              Niva Admin
            </p>
            <h1 className="text-4xl font-bold tracking-tight">
              Selfie review queue
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-stone-600">
              Manual-lite verification for Sprint 2. Approvals move members into
              basic verified status and unlock event, circle, and chat access.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <Metric label="Pending" value="12" />
            <Metric label="Approved" value="48" />
            <Metric label="Flagged" value="3" />
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">Pending reviews</h2>
              <span className="rounded-full bg-teal-50 px-3 py-1 text-sm font-semibold text-teal-800">
                Admin key required
              </span>
            </div>
            <div className="grid gap-3">
              {pendingReviews.map((review) => (
                <article
                  className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm"
                  key={review.id}
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-rose-700">
                        {review.status}
                      </p>
                      <h3 className="mt-1 text-lg font-bold">{review.name}</h3>
                      <p className="text-sm text-stone-600">
                        @{review.username} · {review.city} · {review.submitted}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-bold text-white">
                        Approve
                      </button>
                      <button className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-bold text-stone-800">
                        Review
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <aside className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-bold">Trust event path</h2>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              These events are private signals. Members see milestones, not the
              raw score.
            </p>
            <div className="mt-5 grid gap-3">
              {trustEvents.map((event, index) => (
                <div className="flex items-center gap-3" key={event}>
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-sm font-bold text-amber-900">
                    {index + 1}
                  </span>
                  <span className="text-sm font-semibold text-stone-800">
                    {event}
                  </span>
                </div>
              ))}
            </div>
          </aside>
        </section>

        <section className="grid gap-4 rounded-lg border border-stone-200 bg-white p-5 shadow-sm md:grid-cols-2">
          <div>
            <h2 className="text-xl font-bold">What the admin key means</h2>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              `NIVA_ADMIN_KEY` is the beta admin password for protected backend
              review routes. The dashboard sends it as `x-niva-admin-key`; the
              backend rejects review actions without it.
            </p>
          </div>
          <div>
            <h2 className="text-xl font-bold">Dashboard and backend</h2>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              The dashboard is only the operator screen. The backend owns the
              approval, rejection, verification status, trust score, and trust
              tier updates.
            </p>
          </div>
        </section>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-stone-200 bg-white px-4 py-3 shadow-sm">
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs font-semibold text-stone-500">{label}</p>
    </div>
  );
}
