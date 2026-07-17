import Link from 'next/link';

export default function TermsPage() {
  return (
    <main className="legal-page">
      <nav>
        <Link href="/">niva.</Link>
      </nav>
      <article>
        <p className="eyebrow">Beta terms</p>
        <h1>Participation with clear expectations.</h1>
        <p>Last updated: 17 July 2026</p>
        <h2>Closed beta</h2>
        <p>
          Niva is an early closed-beta service. Availability, activities, and
          features may change while the community team learns from members.
        </p>
        <h2>Member responsibility</h2>
        <p>
          Members must provide accurate account information, follow community
          guidelines, respect activity boundaries, and use cohort conversations
          only for their intended community purpose.
        </p>
        <h2>Hosts and activities</h2>
        <p>
          Hosts are responsible for accurate activity information and
          appropriate group management. Niva may cancel an activity or restrict
          access when necessary for member safety or beta operations.
        </p>
        <h2>Safety</h2>
        <p>
          Niva&apos;s verification and trust controls reduce obvious misuse but
          cannot eliminate all risk. Members should use public meeting places
          and make independent safety decisions.
        </p>
        <h2>Account access</h2>
        <p>
          Niva may hold, restrict, or close an account that violates community
          expectations or creates material risk. Members may delete their
          account at any time.
        </p>
        <p>
          Questions can be sent to{' '}
          <a href="mailto:care@niva.community">care@niva.community</a>.
        </p>
      </article>
    </main>
  );
}
