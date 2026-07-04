'use client';

import { useState } from 'react';

const steps = [
  {
    id: 'mobile',
    title: 'React Native App',
    role: 'The product experience users hold.',
    detail: 'Collects verified intent from the user and sends HTTPS requests to the backend.',
  },
  {
    id: 'firebase',
    title: 'Firebase Auth',
    role: 'The identity provider.',
    detail: 'Handles phone verification, OTP delivery, and signed ID tokens.',
  },
  {
    id: 'backend',
    title: 'NestJS Backend',
    role: 'The business rules layer.',
    detail: 'Checks Firebase tokens, decides what users can do, and protects the database.',
  },
  {
    id: 'database',
    title: 'PostgreSQL',
    role: 'The product memory.',
    detail: 'Stores Niva users, communities, attendance, trust, and future matching data.',
  },
];

export function ArchitectureFlow() {
  const [activeStep, setActiveStep] = useState(steps[0]);

  return (
    <div className="flow-panel">
      <div className="flow-track" aria-label="Niva architecture layers">
        {steps.map((step, index) => (
          <button
            className={step.id === activeStep.id ? 'flow-node active' : 'flow-node'}
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
