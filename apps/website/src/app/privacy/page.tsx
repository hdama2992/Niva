import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <main className="legal-page">
      <nav>
        <Link href="/">niva.</Link>
      </nav>
      <article>
        <p className="eyebrow">Privacy</p>
        <h1>How Niva handles member information.</h1>
        <p>Last updated: 17 July 2026</p>
        <h2>Information we collect</h2>
        <p>
          Niva stores account identifiers, profile details, interests, activity
          memberships, cohort messages, trust events, settings, and safety
          records needed to operate the community.
        </p>
        <h2>Verification images</h2>
        <p>
          Verification selfies are private. Members cannot read them. Approved
          administrators receive only a short-lived review link, and the image
          is removed when the account is deleted.
        </p>
        <h2>How information is used</h2>
        <p>
          We use member information to authenticate accounts, operate events and
          circles, review join eligibility, deliver notifications, protect
          members, and understand whether the beta is creating repeat
          participation.
        </p>
        <h2>Sharing and retention</h2>
        <p>
          Niva does not sell personal information. Service providers receive
          only the information needed to provide hosting, authentication,
          storage, notification, and operational services. Retention periods
          will be finalized before public launch.
        </p>
        <h2>Your choices</h2>
        <p>
          You can change discovery and notification settings in the app. You can
          permanently delete your account in Settings or use the public deletion
          request page.
        </p>
        <p>
          <Link href="/delete-account">Request account deletion</Link> or
          contact <a href="mailto:care@niva.community">care@niva.community</a>.
        </p>
      </article>
    </main>
  );
}
