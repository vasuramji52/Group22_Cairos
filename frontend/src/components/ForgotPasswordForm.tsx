import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { buildPath } from './path';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

const ForgotPasswordForm = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    try {
      const response = await fetch(buildPath('api/request-password-reset'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        setStatus('Error requesting reset. Please try again.');
        return;
      }

      setStatus(data.message || 'If that email exists, a link was sent.');
    } catch (err) {
      console.error('Reset request failed', err);
      setStatus('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative z-10">
      <div className="mb-6 text-center">
        <h2 className="text-[#1B4B5A] text-2xl mb-2">Reset password</h2>
        <p className="text-[#1B4B5A]/70">
          Enter your email and we&apos;ll send you a magic link.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="reset-email" className="text-[#1B4B5A]">
            Email
          </Label>
          <Input
            id="reset-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@gmail.com"
            className="bg-white/80 border-[1.5px] border-[#2C6E7E] focus:border-[#1B4B5A] text-[#1B4B5A] placeholder:text-[#1B4B5A]/40"
            required
          />
        </div>

        <Button
          type="submit"
          className="w-full bg-[#2C6E7E] hover:bg-[#1B4B5A] text-[#FFD700]"
          disabled={loading}
        >
          {loading ? 'Sending...' : 'Send reset link'}
        </Button>

        {status && (
          <p className="text-center text-sm text-[#1B4B5A]/80">{status}</p>
        )}
      </form>

      <div className="mt-6 pt-6 border-t border-[#C5A572]/30 text-center">
        <p className="text-sm text-[#1B4B5A]/80">
          Remembered your password?{' '}
          <button
            type="button"
            className="text-[#2C6E7E] hover:text-[#1B4B5A] underline"
            onClick={() => navigate('/')}
          >
            Back to login
          </button>
        </p>
      </div>
    </div>
  );
};

export default ForgotPasswordForm;
