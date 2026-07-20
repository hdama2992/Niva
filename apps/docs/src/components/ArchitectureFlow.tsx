'use client';

import { useState } from 'react';

const steps = [
  {
    id: 'mobile',
    title: 'React Native App',
    role: 'The product experience users hold.',
    detail:
      'Collects verified intent from the user and sends HTTPS requests to the backend.',
  },
  {
    id: 'firebase',
    title: 'Firebase Auth',
    role: 'The identity provider.',
    detail: 'Handles phone verification, OTP delivery, and signed ID tokens.',
  },
  {
    id: 'backend',
    title: 'Cloud Functions API',
    role: 'The business rules layer.',
    detail:
      'Checks Firebase tokens, enforces product rules, and performs privileged Firestore writes.',
  },
  {
    id: 'database',
    title: 'Cloud Firestore',
    role: 'The product memory.',
    detail:
      'Stores users, profiles, reviews, plans, attendance, notifications, and audit records.',
  },
  {
    id: 'trust',
    title: 'Trust Layer',
    role: 'The private safety signal.',
    detail:
      'Turns verification, attendance, feedback, no-shows, and reports into internal milestones.',
  },
  {
    id: 'admin',
    title: 'Admin Review',
    role: 'The manual safety lane.',
    detail:
      'Approves or rejects pending selfie reviews before members can join events and circles.',
  },
];

export function ArchitectureFlow() {
  const [activeStep, setActiveStep] = useState(steps[0]);

  return (
    <div className="flow-panel">
      <div className="flow-track" aria-label="Niva architecture layers">
        {steps.map((step, index) => (
          <button
            className={
              step.id === activeStep.id ? 'flow-node active' : 'flow-node'
            }
            key={step.id}
            onClick={() => setActiveStep(step)}
            type="button"
          >
            <span className="flow-index">{index + 1}</span>
            <span>{step.title}</span>
          </button>
        ))}
      </div>

      <div className="flow-detail">
        <p className="eyebrow">Selected Layer</p>
        <h3>{activeStep.title}</h3>
        <p className="role">{activeStep.role}</p>
        <p>{activeStep.detail}</p>
      </div>
    </div>
  );
}
