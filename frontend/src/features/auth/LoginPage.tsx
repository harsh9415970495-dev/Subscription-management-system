import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Button,
  Field,
  PageHeader,
  Panel,
  TextInput,
  Toast,
} from '../../design-system';
import { ApiError } from '../../lib/api-client';
import { useAuth } from './AuthContext';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      await login(email, password);
      navigate('/profile');
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMsg(err.problem.detail || err.problem.title);
      } else {
        setErrorMsg('Authentication failed. Check your credentials.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillQuickCredentials = (e: string, p: string) => {
    setEmail(e);
    setPassword(p);
  };

  return (
    <div className="max-w-md mx-auto py-12 flex flex-col gap-6">
      <PageHeader
        title="SYSTEM AUTHENTICATION"
        subtitle="Operator and customer access gate."
        breadcrumbs={['AUTH', 'LOGIN']}
      />

      {errorMsg && <Toast variant="error" message={`[ERR] ${errorMsg}`} />}

      <form onSubmit={handleSubmit}>
        <Panel title="ENTER CREDENTIALS">
          <div className="flex flex-col gap-4">
            <Field label="OPERATOR / USER EMAIL" required>
              <TextInput
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operator@brightloop.local"
                required
              />
            </Field>

            <Field label="PASSWORD" required>
              <TextInput
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
              />
            </Field>

            <div className="flex items-center justify-between text-xs font-mono pt-1">
              <Link
                to="/forgot-password"
                className="text-ink hover:text-amber underline"
              >
                [RECOVER PASSWORD]
              </Link>
              <Link
                to="/register"
                className="text-ink hover:text-amber font-bold"
              >
                [NEW CUSTOMER? REGISTER]
              </Link>
            </div>

            <div className="border-t border-line pt-4 flex justify-end">
              <Button type="submit" variant="primary" disabled={isSubmitting}>
                {isSubmitting ? 'AUTHENTICATING…' : 'AUTHENTICATE & ENTER'}
              </Button>
            </div>
          </div>
        </Panel>
      </form>

      {/* Developer / Demo Quick-Fill Credentials */}
      <Panel title="DEV SEED CREDENTIALS (CLICK TO FILL)">
        <div className="flex flex-col gap-2 font-mono text-xs">
          <button
            type="button"
            onClick={() => fillQuickCredentials('admin@brightloop.local', 'Admin123!@#')}
            className="text-left p-1.5 border border-line-soft hover:bg-surface-alt cursor-pointer"
          >
            <span className="font-bold text-amber">[ADMIN]</span> admin@brightloop.local / Admin123!@#
          </button>
          <button
            type="button"
            onClick={() => fillQuickCredentials('staff1@brightloop.local', 'Staff123!@#')}
            className="text-left p-1.5 border border-line-soft hover:bg-surface-alt cursor-pointer"
          >
            <span className="font-bold text-steel">[STAFF]</span> staff1@brightloop.local / Staff123!@#
          </button>
          <button
            type="button"
            onClick={() => fillQuickCredentials('john@acme.com', 'Customer123!@#')}
            className="text-left p-1.5 border border-line-soft hover:bg-surface-alt cursor-pointer"
          >
            <span className="font-bold text-green">[CUSTOMER]</span> john@acme.com / Customer123!@#
          </button>
        </div>
      </Panel>
    </div>
  );
};
