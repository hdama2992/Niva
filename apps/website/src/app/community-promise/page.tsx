import { PolicyChrome, policyLinks } from '../components/PolicyChrome';

export default function CommunityPromisePage() {
  return (
    <PolicyChrome activeHref="/community-promise" links={policyLinks}>
      <p className="policy-kicker">Community Promise</p>
      <h1>Friendly plans start with clear boundaries.</h1>
      <p className="policy-lead">
        Every member and host agrees to these expectations before joining the
        Niva community.
      </p>
      <div className="policy-principles">
        <section>
          <span>01</span>
          <h2>Be genuine</h2>
          <p>
            Use accurate profile information, a clear photo, and participate as
            yourself.
          </p>
        </section>
        <section>
          <span>02</span>
          <h2>Be respectful</h2>
          <p>
            Respect consent, personal space, identities, schedules, and the
            boundaries of every member.
          </p>
        </section>
        <section>
          <span>03</span>
          <h2>Help plans feel safe</h2>
          <p>
            Meet in the stated place, follow host guidance, and report behaviour
            that could put someone at risk.
          </p>
        </section>
        <section>
          <span>04</span>
          <h2>Be reliable</h2>
          <p>
            Only join plans you intend to attend. If something changes, update
            the host as early as possible.
          </p>
        </section>
      </div>
      <div className="safety-callout">
        <strong>If something feels wrong</strong>
        <p>
          Leave the situation, contact someone you trust, and use Niva&apos;s
          report and block controls. For immediate danger, contact local
          emergency services.
        </p>
        <a href="mailto:care@niva.community">Contact Niva care</a>
      </div>
      <p className="policy-updated">Last updated 19 July 2026</p>
    </PolicyChrome>
  );
}
