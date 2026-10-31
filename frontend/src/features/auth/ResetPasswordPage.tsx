import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Button,
  Field,
  PageHeader,
  Panel,
  TextInput,
  Toast,
} from '../../design-system';
import { apiClient, ApiError } from '../../lib/api-client';
import { PasswordChecklist } from './components/PasswordChecklist';

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get('token') || '';

  const [token, setToken] = useState(tokenFromUrl);
  const [newPassword, setNewPassword] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    try {
      const res = await apiClient.post<{ message: string }>('/auth/reset-password', {
        token,
        newPassword,
      });
      setSuccessMsg(res.data.message);
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMsg(err.problem.detail || err.problem.title);
      } else {
        setErrorMsg('Password reset failed. Token may be expired or already used.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 flex flex-col gap-6">
      <PageHeader
        title="DEFINE NEW PASSWORD"
        subtitle="Validate token and establish new password credentials."
        breadcrumbs={['AUTH', 'RESET']}
      />

      {errorMsg && <Toast variant="error" message={`[ERR] ${errorMsg}`} />}
      {successMsg && <Toast variant="success" message={`[OK] ${successMsg}`} />}

      {successMsg ? (
        <Panel title="OPERATION COMPLETE">
          <div className="flex flex-col gap-3 font-mono text-xs">
            <p className="text-ink">
              Your password has been successfully updated. All active sessions have been revoked.
            </p>
            <div className="border-t border-line pt-3 flex justify-end">
              <Link to="/login">
                <Button variant="primary">PROCEED TO LOGIN</Button>
              </Link>
            </div>
          </div>
        </Panel>
      ) : (
        <form onSubmit={handleSubmit}>
          <Panel title="SET NEW CREDENTIALS">
            <div className="flex flex-col gap-4">
              <Field label="SECURITY RESET TOKEN" required>
                <TextInput
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Paste 64-character token"
                  required
                />
              </Field>

              <Field label="NEW PASSWORD" required>
                <TextInput
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter compliant new password"
                  required
                />
              </Field>

              <PasswordChecklist password={newPassword} />

              <div className="border-t border-line pt-4 flex items-center justify-between">
                <Link
                  to="/login"
                  className="font-mono text-xs text-ink hover:text-amber"
                >
                  [CANCEL]
                </Link>
                <Button type="submit" variant="primary" disabled={isSubmitting}>
                  {isSubmitting ? 'UPDATING…' : 'UPDATE PASSWORD'}
                </Button>
              </div>
            </div>
          </Panel>
        </form>
      )}
    </div>
  );
};
