import { PolicyChrome, policyLinks } from '../components/PolicyChrome';

export default function TermsPage() {
  return (
    <PolicyChrome activeHref="/terms" links={policyLinks}>
      <p className="policy-kicker">Terms of participation</p>
      <h1>Clear expectations for taking part.</h1>
      <p className="policy-lead">
        The practical rules that keep Niva plans respectful, accurate, and safe
        for members and hosts.
      </p>
      <div className="policy-prose">
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
        <p className="policy-updated">Last updated 19 July 2026</p>
      </div>
    </PolicyChrome>
  );
}
