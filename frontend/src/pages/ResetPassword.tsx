import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AuthPageLayout from '../components/AuthPageLayout.tsx';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { buildPath } from '../components/path';

const ResetPassword = () => {
  const [params] = useSearchParams();
  const uid = params.get('uid') ?? '';
  const token = params.get('token') ?? '';

  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const redirectTimeout = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (redirectTimeout.current) {
        clearTimeout(redirectTimeout.current);
      }
    };
  }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    try {
      const response = await fetch(buildPath('api/confirm-reset-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, token, newPassword })
      });

      const data = await response.json();

      if (response.ok && data.ok) {
        setSuccess(true);
        setStatus('Password updated! Redirecting to login...');
        redirectTimeout.current = window.setTimeout(() => navigate('/'), 2000);
        return;
      }

      if (data?.error === 'weak_password') {
        setStatus('Password must be at least 8 characters long.');
      } else if (data?.error === 'invalid_or_expired_token') {
        setStatus('Reset link invalid or expired.');
      } else if (data?.error === 'missing_fields') {
        setStatus('Reset link missing required information.');
      } else {
        setStatus('Reset failed. Please request a new link.');
      }
    } catch (err) {
      console.error('Confirm reset failed', err);
      setStatus('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (!uid || !token) {
    return (
      <AuthPageLayout tagline="Return to login to request a new link.">
        <div className="space-y-4 text-center text-[#1B4B5A]">
          <h2 className="text-2xl font-semibold">Invalid link</h2>
          <p className="text-[#1B4B5A]/80">
            This password reset link is missing required data.
          </p>
          <Button
            type="button"
            className="bg-[#2C6E7E] hover:bg-[#1B4B5A] text-[#FFD700]"
            onClick={() => navigate('/')}
          >
            Back to login
          </Button>
        </div>
      </AuthPageLayout>
    );
  }

  return (
    <AuthPageLayout tagline="Set a new password to continue your journey.">
      <div className="mb-6 text-center">
        <h2 className="text-[#1B4B5A] text-2xl mb-2">Choose a new password</h2>
        <p className="text-[#1B4B5A]/70">
          Your link will expire shortly, so update it as soon as you can.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="new-password" className="text-[#1B4B5A]">
            New password
          </Label>
          <Input
            id="new-password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter a new password"
            className="bg-white/80 border-[1.5px] border-[#2C6E7E] focus:border-[#1B4B5A] text-[#1B4B5A] placeholder:text-[#1B4B5A]/40"
            minLength={8}
            required
          />
        </div>

        <Button
          type="submit"
          className="w-full bg-[#2C6E7E] hover:bg-[#1B4B5A] text-[#FFD700]"
          disabled={loading || success}
        >
          {loading ? 'Saving...' : 'Update password'}
        </Button>

        {status && (
          <p className="text-center text-sm text-[#1B4B5A]/80">{status}</p>
        )}
      </form>
    </AuthPageLayout>
  );
};

export default ResetPassword;
