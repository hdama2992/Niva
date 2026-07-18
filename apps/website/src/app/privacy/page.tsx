import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <main className="policy-shell">
      <header className="policy-header">
        <Link className="policy-brand" href="/">
          Niva
        </Link>
        <nav className="policy-nav" aria-label="Legal and support">
          <Link href="/community-promise">Community Promise</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/support">Get help</Link>
        </nav>
        <Link className="policy-open" href="/">
          Open Niva
        </Link>
      </header>

      <div className="policy-layout">
        <aside className="policy-sidebar">
          <a className="active" href="#overview">
            Overview
          </a>
          <a href="#profile">Your profile</a>
          <a href="#selfies">Verification selfies</a>
          <a href="#location">Location & plans</a>
          <a href="#reports">Reports & safety</a>
          <a href="#retention">Data retention</a>
          <Link href="/delete-account">Delete your account</Link>
          <a href="mailto:care@niva.community">Contact us</a>
        </aside>

        <article className="policy-content" id="overview">
          <h1>Privacy &amp; safety at Niva</h1>
          <p className="policy-lead">
            Clear information about what Niva collects, why it is needed, and
            the choices you have.
          </p>

          <section className="policy-section" id="profile">
            <h2>Profile photos and verification selfies are different</h2>
            <div className="privacy-comparison">
              <div className="privacy-card public-card">
                <p className="privacy-kicker">Public profile photo</p>
                <ul>
                  <li>Visible to approved members in plan contexts</li>
                  <li>Chosen from your camera or gallery</li>
                  <li>You can replace it from your profile</li>
                </ul>
                <strong>You control what you share.</strong>
              </div>
              <div className="privacy-card private-card" id="selfies">
                <p className="privacy-kicker">Private verification selfie</p>
                <ul>
                  <li>Seen only by authorised reviewers</li>
                  <li>Never displayed to members or hosts</li>
                  <li>Used solely for identity and safety review</li>
                </ul>
                <strong>It is not your profile photo.</strong>
              </div>
            </div>
          </section>

          <section className="policy-grid">
            <div id="location">
              <h2>Location &amp; plans</h2>
              <p>
                Niva uses your selected city and plan memberships to show
                relevant activities, unlock approved plan details, and operate
                reminders. Exact meeting details are limited to approved
                members.
              </p>
            </div>
            <div id="reports">
              <h2>Reports &amp; safety</h2>
              <p>
                Reports, blocks, moderation decisions, and related safety
                records are restricted to authorised operations staff. Niva does
                not sell personal information.
              </p>
            </div>
            <div id="retention">
              <h2>Retention and deletion</h2>
              <p>
                Data is kept only while it is needed to operate the account,
                meet safety and legal obligations, or resolve a report. Deleting
                an account removes its private selfie and uploaded profile
                images.
              </p>
            </div>
            <div>
              <h2>Your choices</h2>
              <p>
                You can change notification and discovery settings, replace your
                profile details, block members, and permanently delete your
                account.
              </p>
            </div>
          </section>

          <div className="deletion-callout">
            <div>
              <strong>Delete your account</strong>
              <p>
                You can delete your account and associated data at any time.
                Deletion cannot be recovered.
              </p>
            </div>
            <Link href="/delete-account">Start deletion request</Link>
          </div>
          <p className="policy-updated">Last updated 19 July 2026</p>
        </article>
      </div>

      <footer className="policy-footer">
        <strong>Niva</strong>
        <span>Plans designed for real life.</span>
        <a href="mailto:care@niva.community">care@niva.community</a>
      </footer>
    </main>
  );
}
