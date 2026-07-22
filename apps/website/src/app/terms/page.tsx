import { PolicyChrome, policyLinks } from '../components/PolicyChrome';

export default function TermsPage() {
  return (
    <PolicyChrome activeHref="/terms" links={policyLinks}>
      <p className="policy-kicker">Terms of Service</p>
      <h1>Clear terms for using Niva.</h1>
      <p className="policy-lead">
        These Terms govern the Niva mobile app, website, and related services.
      </p>

      <div className="policy-prose">
        <p>
          Niva is independently operated by its founder as an individual based
          in Bengaluru, Karnataka, India. In these Terms, “Niva” refers to that
          individual operator and the Niva services.
        </p>
        <h2>1. Agreement</h2>
        <p>
          By creating an account or selecting “Agree and continue,” you agree to
          these Terms and acknowledge the Privacy Policy. If you do not agree,
          do not use Niva.
        </p>

        <h2>2. Eligibility</h2>
        <p>You must:</p>
        <ul>
          <li>Be at least 18 years old.</li>
          <li>Have legal capacity to enter into this agreement.</li>
          <li>Provide accurate account and profile information.</li>
          <li>
            Meet the women-centred community eligibility statement presented
            during registration.
          </li>
          <li>Use Niva only for lawful personal and community purposes.</li>
          <li>Not be suspended or prohibited from using Niva.</li>
        </ul>
        <p>
          You must not misrepresent your age, identity, eligibility, or
          relationship to another person.
        </p>

        <h2>3. What Niva provides</h2>
        <p>
          Niva helps members discover, create, and participate in local plans
          and circles. Unless expressly stated otherwise, Niva is not an event
          organiser for member-hosted plans, an employer or agent of a host, an
          emergency service, a background-check provider, a dating service, or a
          guarantee of any person’s identity, conduct, or safety.
        </p>

        <h2>4. Accounts</h2>
        <p>
          You are responsible for activity through your account and for
          protecting your phone, OTP, and authenticated device. Contact Niva if
          you believe your account has been compromised. You may not sell,
          transfer, share, or create an account for another person.
        </p>

        <h2>5. Member responsibilities</h2>
        <ul>
          <li>Treat others respectfully and respect consent and privacy.</li>
          <li>Use accurate profile and plan information.</li>
          <li>Join only plans you genuinely intend to attend.</li>
          <li>Cancel or notify the host when you cannot attend.</li>
          <li>Follow reasonable host and venue instructions.</li>
          <li>Keep restricted meeting details confidential.</li>
          <li>Keep group chats relevant to their community purpose.</li>
          <li>Report serious concerns honestly and responsibly.</li>
        </ul>

        <h2>6. Host responsibilities</h2>
        <p>
          Hosts must provide accurate plan details, select reasonably
          appropriate meeting places, manage capacity fairly, communicate
          material changes, respect member privacy, and avoid unsafe, unlawful,
          or misleading activities. Hosts are responsible for permissions,
          licences, or insurance required for their activities.
        </p>

        <h2>7. Prohibited conduct and content</h2>
        <p>You must not use Niva to:</p>
        <ul>
          <li>Harass, threaten, intimidate, stalk, or bully anyone.</li>
          <li>
            Share hateful, degrading, discriminatory, or exploitative content.
          </li>
          <li>Impersonate another person or create a fake profile.</li>
          <li>Scam, defraud, spam, or commercially solicit members.</li>
          <li>
            Share private information, photos, or messages without permission.
          </li>
          <li>Record or publish another person without appropriate consent.</li>
          <li>Promote illegal activity or dangerous conduct.</li>
          <li>Infringe copyright, trademark, or other rights.</li>
          <li>Bypass verification, access controls, or security measures.</li>
          <li>
            Retaliate against a good-faith report or submit a malicious report.
          </li>
          <li>Scrape, copy, or build a database of member information.</li>
        </ul>

        <h2>8. Your content</h2>
        <p>
          You retain ownership of content you submit. You grant Niva a limited,
          non-exclusive licence to host, store, process, reproduce, and display
          it only as reasonably necessary to operate, secure, and improve the
          service. You confirm that you have the rights and permissions needed
          to submit it.
        </p>

        <h2>9. Verification and safety</h2>
        <p>
          Niva may request a private selfie or other information to review
          eligibility and reduce misuse. Verification is not a comprehensive
          background check, endorsement, or guarantee.
        </p>
        <p>
          Meeting people through an online community involves risk. Make
          independent safety decisions, use appropriate public places, protect
          personal information, tell someone you trust, and leave any situation
          that feels unsafe. For immediate danger, contact local emergency
          services. Niva support is not an emergency-response service.
        </p>

        <h2>10. Reports and moderation</h2>
        <p>
          Niva may review reported messages, profiles, plans, and account
          activity to enforce these Terms and protect the community. Niva may
          remove content, restrict features, cancel a plan, pause verification,
          suspend or terminate an account, preserve restricted safety records,
          or notify authorities where required or reasonably necessary.
        </p>

        <h2>11. Plans, cancellations, and payments</h2>
        <p>
          Availability, capacity, and approval are not guaranteed. Hosts may
          edit or cancel plans, members may withdraw, and Niva may cancel or
          restrict a plan for operational, legal, or safety reasons.
        </p>
        <p>
          Niva does not currently process member payments. Separate terms will
          be provided before paid features, fees, refunds, or cancellation
          charges are introduced.
        </p>

        <h2>12. Notifications</h2>
        <p>
          You may receive service and safety communications. Optional push
          notifications can be controlled in Niva or device settings. Essential
          account, security, and legal communications may still be sent while
          your account is active.
        </p>

        <h2>13. Suspension and deletion</h2>
        <p>
          You may delete your account at any time. Niva may restrict or
          terminate access for violations, safety risks, fraud, legal
          requirements, or material misuse. Immediate restrictions may be used
          where reasonably necessary to protect members or the service.
        </p>

        <h2>14. Niva intellectual property</h2>
        <p>
          Niva’s software, design, branding, artwork, and original content
          belong to Niva or its licensors. You receive a limited, revocable,
          non-transferable right to use the service for its intended purpose.
        </p>

        <h2>15. Availability and disclaimers</h2>
        <p>
          Niva may change, suspend, or discontinue features, particularly while
          the service is in beta or early production. Niva does not guarantee
          uninterrupted or error-free operation.
        </p>
        <p>
          To the extent permitted by law, Niva is not responsible for the
          independent conduct of members or hosts, inaccurate user-supplied
          information, off-platform conduct, venue or transport failures, or
          indirect losses that were not reasonably foreseeable. Nothing in these
          Terms excludes liability that cannot legally be excluded.
        </p>

        <h2>16. Governing law</h2>
        <p>
          These Terms are governed by the laws of India. Subject to applicable
          consumer and statutory rights, courts in Bengaluru, Karnataka will
          have jurisdiction. Before formal proceedings, you and Niva should
          attempt to resolve the matter through the grievance process.
        </p>

        <h2>17. Changes and contact</h2>
        <p>
          Niva may update these Terms for service, safety, or legal changes.
          Material changes will be notified where appropriate, and fresh
          acceptance will be requested when required.
        </p>
        <p>
          Questions and grievances can be sent to Niva’s founder and operator
          at{' '}
          <a href="mailto:care@niva.community">care@niva.community</a>.
        </p>
        <p className="policy-updated">
          Effective 22 July 2026 · Version 2026-07-22
        </p>
      </div>
    </PolicyChrome>
  );
}
