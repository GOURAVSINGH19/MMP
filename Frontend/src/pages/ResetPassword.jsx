import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Input, Label } from '../components/ui';
import { KeyRound, Check, X, ArrowRight, Eye, EyeOff } from 'lucide-react';
import api from '../services/api';
import { toast } from 'react-toastify';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Password criteria checklist
  const criteria = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  const allValid = Object.values(criteria).every(Boolean);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      return toast.error('Reset token is missing from URL.');
    }
    if (!allValid) {
      return toast.warn('Please meet all password strength requirements.');
    }
    if (password !== confirmPassword) {
      return toast.warn('Passwords do not match.');
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, newPassword: password });
      setSuccess(true);
      toast.success('Password reset successful!');
      setTimeout(() => {
        navigate('/login');
      }, 5000);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Set a new password" subtitle="Choose a strong password to secure your marathon account.">
      <Card glass className="border-slate-200/60 shadow-xl">
        <CardHeader className="space-y-1.5 text-center pb-2">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-primary/10 text-brand-primary">
            <KeyRound className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl">New password</CardTitle>
          <CardDescription>Set your new credentials to access your account.</CardDescription>
        </CardHeader>

        {!success ? (
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              {/* Password strength visual guidelines */}
              <div className="rounded-xl border border-slate-200/80 bg-brand-light/50 p-3.5 text-xs space-y-2">
                <p className="font-semibold text-slate-700">Password requirements</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  <div className="flex items-center gap-1.5">
                    {criteria.length ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <X className="h-3.5 w-3.5 text-rose-500" />}
                    <span className={criteria.length ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}>Min 8 characters</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {criteria.uppercase ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <X className="h-3.5 w-3.5 text-rose-500" />}
                    <span className={criteria.uppercase ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}>1 Uppercase letter</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {criteria.lowercase ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <X className="h-3.5 w-3.5 text-rose-500" />}
                    <span className={criteria.lowercase ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}>1 Lowercase letter</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {criteria.number ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <X className="h-3.5 w-3.5 text-rose-500" />}
                    <span className={criteria.number ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}>1 Number</span>
                  </div>
                  <div className="flex items-center gap-1.5 col-span-1 sm:col-span-2">
                    {criteria.special ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <X className="h-3.5 w-3.5 text-rose-500" />}
                    <span className={criteria.special ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}>1 Special character (!@#$%^&*)</span>
                  </div>
                </div>
              </div>
            </CardContent>

            <CardFooter>
              <Button
                type="submit"
                variant="glow"
                className="w-full gap-2"
                disabled={loading || !allValid || password !== confirmPassword}
              >
                {loading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-555 border-t-transparent" />
                ) : (
                  <>
                    <span>Reset Password</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        ) : (
          <CardContent className="space-y-4 py-6 text-center">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 rounded-lg text-sm border border-emerald-100 dark:border-emerald-900/30">
              Your password has been reset successfully! Redirecting you to login in a few seconds...
            </div>
            <Link to="/login" className="inline-flex items-center gap-1.5 font-semibold text-brand-primary hover:underline">
              <span>Go to sign in</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </CardContent>
        )}
      </Card>
    </AuthLayout>
  );
}
