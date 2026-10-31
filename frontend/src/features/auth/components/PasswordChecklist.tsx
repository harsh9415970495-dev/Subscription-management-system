import React from 'react';

export interface PasswordChecklistProps {
  password: string;
}

export const PasswordChecklist: React.FC<PasswordChecklistProps> = ({ password }) => {
  const p = password || '';
  const checks = [
    { label: 'Minimum 9 characters', ok: p.length >= 9 },
    { label: 'Uppercase letter (A-Z)', ok: /[A-Z]/.test(p) },
    { label: 'Lowercase letter (a-z)', ok: /[a-z]/.test(p) },
    { label: 'Numeric digit (0-9)', ok: /[0-9]/.test(p) },
    { label: 'Special symbol (!@#$%^&*...)', ok: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(p) },
  ];

  return (
    <div className="border border-line-soft bg-surface p-3 flex flex-col gap-1.5 my-2">
      <div className="font-mono text-xs uppercase font-bold text-ink-muted tracking-wider mb-1">
        PASSWORD COMPLEXITY REQUIREMENTS
      </div>
      {checks.map((c) => (
        <div key={c.label} className="flex items-center gap-2 font-mono text-xs">
          <span
            className={`font-bold px-1 ${
              c.ok ? 'text-green bg-green/10' : 'text-ink-muted bg-surface-alt'
            }`}
          >
            {c.ok ? '[OK]' : '[--]'}
          </span>
          <span className={c.ok ? 'text-ink' : 'text-ink-muted'}>{c.label}</span>
        </div>
      ))}
    </div>
  );
};
