import { PolicyChrome, policyLinks } from '../components/PolicyChrome';

export default function SupportPage() {
  return (
    <PolicyChrome activeHref="/support" links={policyLinks}>
      <p className="policy-kicker">Help &amp; support</p>
      <h1>Get help from a real person.</h1>
      <p className="policy-lead">
        Tell us what happened and include the phone number or email connected to
        your Niva account when it is safe to do so.
      </p>
      <div className="policy-grid">
        <div>
          <h2>Account access</h2>
          <p>
            Help with sign-in, OTP delivery, verification review, profile
            updates, or account deletion.
          </p>
        </div>
        <div>
          <h2>Plans and hosting</h2>
          <p>
            Questions about join requests, host access, cancellations,
            attendance, chat, or plan details.
          </p>
        </div>
        <div>
          <h2>Privacy</h2>
          <p>
            Ask what Niva stores, request a correction, or raise a concern about
            how your information is handled.
          </p>
        </div>
        <div>
          <h2>Safety concern</h2>
          <p>
            Use the in-app report flow for plan-specific concerns, or email the
            care team if you cannot access the app.
          </p>
        </div>
      </div>
      <div className="support-contact">
        <p>Typical response during the beta: within two working days.</p>
        <a href="mailto:care@niva.community?subject=Niva%20support%20request">
          Email care@niva.community
        </a>
      </div>
    </PolicyChrome>
  );
}
