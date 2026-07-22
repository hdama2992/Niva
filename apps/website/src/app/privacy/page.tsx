import Link from 'next/link';
import { PolicyChrome, policyLinks } from '../components/PolicyChrome';

export default function PrivacyPage() {
  return (
    <PolicyChrome activeHref="/privacy" links={policyLinks}>
      <p className="policy-kicker">Privacy Policy</p>
      <h1>How Niva handles your information.</h1>
      <p className="policy-lead">
        This policy explains what Niva processes, why it is needed, who can see
        it, and the choices you have.
      </p>

      <div className="policy-prose">
        <h2>1. Who we are</h2>
        <p>
          Niva is a women-centred community platform for discovering, creating,
          and participating in local plans and circles. Niva is independently
          operated by its founder as an individual based in Bengaluru,
          Karnataka, India. In this policy, “Niva,” “we,” “our,” and “us” refer
          to that individual operator and the Niva app, website, and related
          services.
        </p>
        <p>
          The founder and operator is also Niva’s privacy and grievance contact.
          Questions and requests can be sent to{' '}
          <a href="mailto:care@niva.community">care@niva.community</a>.
        </p>

        <h2>2. Where this policy applies</h2>
        <p>
          This policy applies to the Niva mobile app, website, beta-access and
          account-deletion forms, support channels, and related services.
        </p>

        <h2>3. Information we process</h2>
        <h3>Account and authentication information</h3>
        <p>
          You provide your phone number and, where applicable, your email
          address when creating or accessing your Niva account. We use this
          information to authenticate sign-ins, protect your account, and
          prevent misuse.
        </p>
        <p>
          When your account is created, Niva’s authentication service
          automatically generates an internal account identifier and records
          basic account information such as the sign-in method and
          account-creation time. You do not provide this internal identifier
          directly.
        </p>

        <h3>Profile information</h3>
        <p>
          We process the information you add to your profile, including your
          username, display name, age, city, bio, occupation, interests,
          languages, and profile photo. Profile information is shown where
          needed for discovery, hosting, plan participation, and approved-member
          community features.
        </p>

        <h3>Private verification information</h3>
        <p>
          If you request verification, we process a private verification selfie,
          its submission time, the review decision, and any reason associated
          with that decision. Only authorised Niva reviewers can access the
          selfie. It is not shown to hosts or members and is not used as your
          profile photo, for advertising, or for unrelated facial recognition.
        </p>
        <p>
          A verification decision can reduce certain forms of misuse, but it is
          not a criminal background check or a guarantee of a member’s identity,
          intentions, or conduct.
        </p>

        <h3>Plans, circles, and location</h3>
        <p>
          We process plan and circle details such as their title, description,
          schedule, city, meeting place, optional coordinates, capacity, cover
          image, membership, join status, attendance, and cancellations. Exact
          meeting information is limited to people authorised to view it.
        </p>
        <p>
          When a host chooses to use their current location to select a meeting
          place, Niva requests foreground location access. Niva does not collect
          continuous or background member location.
        </p>

        <h3>Community activity and communications</h3>
        <p>
          We process join requests, hosting history, feedback, preferences,
          Terms and Privacy Policy acceptance, notification activity, icebreaker
          information, and messages sent in approved plan or circle chats.
          Messages may be reviewed when reported or when reasonably necessary to
          investigate misuse or protect members.
        </p>

        <h3>Safety information</h3>
        <p>
          We process reports, report descriptions, blocks, moderation decisions,
          trust status, and related plan or account information. Access is
          restricted to authorised Niva safety and operations personnel, except
          where disclosure is required by law.
        </p>

        <h3>Notifications, support, and technical information</h3>
        <p>
          We process push-notification tokens and preferences, notification
          delivery status, app platform information, and basic service and
          security logs. We also process information submitted through the
          beta-access, support, privacy, and account-deletion forms.
        </p>

        <h3>Information about another person</h3>
        <p>
          If you provide emergency-contact information, you must have permission
          to provide that person’s name, phone number, and relationship to you.
        </p>

        <h2>4. How we use information</h2>
        <ul>
          <li>Create, authenticate, and protect accounts.</li>
          <li>Build profiles and operate verification reviews.</li>
          <li>
            Recommend and operate plans, circles, chats, and notifications.
          </li>
          <li>Display restricted plan details to approved participants.</li>
          <li>Process reports, blocks, support requests, and moderation.</li>
          <li>Prevent fraud, abuse, and threats to member safety.</li>
          <li>Maintain, secure, and improve the reliability of Niva.</li>
          <li>Enforce our Terms and protect members from misuse.</li>
          <li>Comply with applicable law and valid legal requests.</li>
        </ul>
        <p>Niva does not sell personal information.</p>

        <h2>5. Who receives information</h2>
        <p>Information may be disclosed to:</p>
        <ul>
          <li>Members and hosts where required for a Niva feature.</li>
          <li>Authorised Niva reviewers, moderators, and support personnel.</li>
          <li>
            Google Firebase, which Niva uses for authentication, databases,
            private file storage, cloud functions, and notifications.
          </li>
          <li>
            Vendors used for security, diagnostics, or support if those services
            are introduced and appropriately disclosed.
          </li>
          <li>
            Professional advisers, authorities, or courts where disclosure is
            reasonably necessary or legally required.
          </li>
          <li>
            A successor operator during a merger, acquisition, or restructuring,
            subject to appropriate protection and notice.
          </li>
        </ul>

        <h2>6. Device permissions</h2>
        <p>
          Camera and photo-library permission is requested only when you choose
          to take or select a profile photo, verification selfie, or activity
          cover. Foreground location is requested only when a host chooses to
          use it to select a meeting place. Notification permission is used for
          plan changes, join decisions, reminders, and safety notices.
        </p>

        <h2>7. Retention</h2>
        <p>
          Account and profile information is generally retained while your
          account is active. A verification selfie is retained while its review
          is pending and is deleted within 30 days after a final approval or
          rejection. The resulting status and review record may remain while
          your account is active or as needed for safety.
        </p>
        <p>
          Plan, membership, location, communication, support, and technical
          records are retained only while reasonably needed to operate Niva,
          protect members, resolve disputes, enforce our rules, or meet legal
          obligations. Closed safety and moderation records may be retained for
          a limited additional period where necessary to identify repeated abuse
          or respond to legal claims.
        </p>

        <h2>8. Account deletion</h2>
        <p>
          You can delete your account through Profile → Settings → Delete
          account. If you cannot sign in, use Niva’s{' '}
          <Link href="/delete-account">public deletion request</Link>. Niva
          verifies ownership before completing an external request.
        </p>
        <p>
          Account deletion removes your authentication identity, profile,
          memberships, notification tokens, authored ordinary chat messages,
          private verification selfie, and uploaded profile images. Restricted
          report or moderation records may be retained when necessary for
          safety, fraud prevention, legal claims, or compliance, and are deleted
          when that reason ends. Deletion cannot be reversed.
        </p>

        <h2>9. Your choices and rights</h2>
        <p>Subject to applicable law, you may:</p>
        <ul>
          <li>Request information about personal data processed by Niva.</li>
          <li>Correct inaccurate account or profile information.</li>
          <li>Delete your account and associated information.</li>
          <li>
            Withdraw optional consent and change notification preferences.
          </li>
          <li>Block members and raise a privacy grievance.</li>
        </ul>
        <p>
          Send requests to{' '}
          <a href="mailto:care@niva.community">care@niva.community</a>. We may
          request reasonable verification before acting on a request.
        </p>

        <h2>10. Age restriction</h2>
        <p>
          Niva is only for people aged 18 or older. If we learn that a minor has
          created an account, we may restrict and delete it.
        </p>

        <h2>11. Security</h2>
        <p>
          Niva uses authentication, access controls, restricted administrator
          roles, private file storage, and encrypted network connections
          designed to protect personal information. No online system can be
          guaranteed completely secure.
        </p>

        <h2>12. Changes and contact</h2>
        <p>
          We may update this policy when Niva’s features, service providers, or
          legal obligations change. Material changes will be communicated
          through the app, website, or account contact information where
          appropriate.
        </p>
        <p>
          Operator, privacy, and grievance contact:{' '}
          <a href="mailto:care@niva.community">care@niva.community</a>
        </p>
        <p className="policy-updated">
          Effective 22 July 2026 · Version 2026-07-22
        </p>
      </div>
    </PolicyChrome>
  );
}
