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
import { PasswordChecklist } from './components/PasswordChecklist';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    companyName: '',
    phone: '',
    taxId: '',
    email: '',
    password: '',
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'IN',
  });

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      await register({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        companyName: formData.companyName || undefined,
        phone: formData.phone || undefined,
        taxId: formData.taxId || undefined,
        billingAddress: {
          street: formData.street,
          city: formData.city,
          state: formData.state,
          postalCode: formData.postalCode,
          country: formData.country,
        },
      });
      navigate('/profile');
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMsg(err.problem.detail || err.problem.title);
      } else {
        setErrorMsg('Registration failed. Please check inputs and try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 flex flex-col gap-6">
      <PageHeader
        title="CUSTOMER REGISTRATION"
        subtitle="Create a new customer account and establish tenant boundary."
        breadcrumbs={['AUTH', 'SIGN UP']}
      />

      {errorMsg && <Toast variant="error" message={`[ERR] ${errorMsg}`} />}

      <form onSubmit={handleSubmit}>
        <Panel title="ACCOUNT & BILLING CREDENTIALS">
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="PRIMARY CONTACT NAME" required>
                <TextInput
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Jane Doe"
                  required
                />
              </Field>

              <Field label="COMPANY NAME (LEGAL ENTITY)">
                <TextInput
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  placeholder="e.g. Acme Corporation"
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="EMAIL ADDRESS" required>
                <TextInput
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="e.g. jane@acme.com"
                  required
                />
              </Field>

              <Field label="PHONE NUMBER">
                <TextInput
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="e.g. +91 98765 43210"
                />
              </Field>
            </div>

            <Field label="TAX IDENTIFIER (GSTIN / VAT)">
              <TextInput
                name="taxId"
                value={formData.taxId}
                onChange={handleChange}
                placeholder="e.g. 29AAAAA0000A1Z5"
              />
            </Field>

            <Field label="PASSWORD" required>
              <TextInput
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter strong password (9+ characters)"
                required
              />
            </Field>

            {/* Live Password Checklist (§8 Invariant) */}
            <PasswordChecklist password={formData.password} />

            <div className="border-t border-line pt-3 mt-2">
              <div className="font-mono text-xs uppercase font-bold text-ink-muted mb-3">
                PRIMARY BILLING ADDRESS
              </div>
              <div className="flex flex-col gap-3">
                <Field label="STREET ADDRESS">
                  <TextInput
                    name="street"
                    value={formData.street}
                    onChange={handleChange}
                    placeholder="e.g. 100 Outer Ring Road, Tech Park"
                  />
                </Field>

                <div className="grid grid-cols-3 gap-2">
                  <Field label="CITY">
                    <TextInput
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="Bengaluru"
                    />
                  </Field>
                  <Field label="STATE">
                    <TextInput
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      placeholder="Karnataka"
                    />
                  </Field>
                  <Field label="POSTAL CODE">
                    <TextInput
                      name="postalCode"
                      value={formData.postalCode}
                      onChange={handleChange}
                      placeholder="560103"
                    />
                  </Field>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-line pt-4 mt-2">
              <Link
                to="/login"
                className="font-mono text-xs text-ink hover:text-amber font-bold"
              >
                [ALREADY REGISTERED? LOG IN]
              </Link>
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'PROCESSING REGISTRATION…' : 'CONFIRM & REGISTER'}
              </Button>
            </div>
          </div>
        </Panel>
      </form>
    </div>
  );
};
