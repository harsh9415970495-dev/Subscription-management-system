import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Button,
  Field,
  PageHeader,
  Panel,
  TextInput,
  Toast,
} from '../../design-system';
import { apiClient, ApiError } from '../../lib/api-client';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [previewToken, setPreviewToken] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setPreviewToken(null);
    setIsSubmitting(true);

    try {
      const res = await apiClient.post<{ message: string; previewToken?: string }>(
        '/auth/forgot-password',
        { email },
      );
      setSuccessMsg(res.data.message);
      if (res.data.previewToken) {
        setPreviewToken(res.data.previewToken);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMsg(err.problem.detail || err.problem.title);
      } else {
        setErrorMsg('Request failed. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 flex flex-col gap-6">
      <PageHeader
        title="PASSWORD RECOVERY"
        subtitle="Dispatches a single-use cryptographically secure reset link."
        breadcrumbs={['AUTH', 'RECOVER']}
      />

      {errorMsg && <Toast variant="error" message={`[ERR] ${errorMsg}`} />}
      {successMsg && <Toast variant="success" message={`[OK] ${successMsg}`} />}

      <form onSubmit={handleSubmit}>
        <Panel title="IDENTIFY ACCOUNT">
          <div className="flex flex-col gap-4">
            <Field label="REGISTERED EMAIL ADDRESS" required>
              <TextInput
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@brightloop.local"
                required
              />
            </Field>

            <div className="border-t border-line pt-4 flex items-center justify-between">
              <Link
                to="/login"
                className="font-mono text-xs text-ink hover:text-amber"
              >
                [RETURN TO LOGIN]
              </Link>
              <Button type="submit" variant="primary" disabled={isSubmitting}>
                {isSubmitting ? 'DISPATCHING…' : 'DISPATCH RESET LINK'}
              </Button>
            </div>
          </div>
        </Panel>
      </form>

      {previewToken && (
        <Panel title="DEV ENVIRONMENT RESET TOKEN LINK">
          <div className="flex flex-col gap-2 font-mono text-xs">
            <p className="text-ink-muted">
              Mailpit preview token extracted:
            </p>
            <div className="p-2 bg-surface-alt border border-line break-all">
              {previewToken}
            </div>
            <Link
              to={`/reset-password?token=${previewToken}`}
              className="text-amber font-bold underline mt-1"
            >
              [CLICK HERE TO PROCEED TO RESET PAGE]
            </Link>
          </div>
        </Panel>
      )}
    </div>
  );
};
