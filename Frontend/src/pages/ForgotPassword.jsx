import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Input, Label } from '../components/ui';
import { Mail, ArrowLeft, Send, KeyRound, ShieldCheck, ArrowRight } from 'lucide-react';
import api from '../services/api';
import { toast } from 'react-toastify';

const steps = ['Email', 'OTP', 'Password'];

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const sendOtp = async (e) => {
    e.preventDefault();
    if (!email) {
      return toast.warn('Please enter your email address.');
    }

    setLoading(true);
    try {
      await api.post('/auth/send-otp', { email });
      setStep(1);
      toast.success('OTP sent. Check your inbox.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      return toast.warn('Enter the 6-digit OTP.');
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/verify-otp', { email, otp });
      setResetToken(response.data.token);
      setStep(2);
      toast.success('OTP verified.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to verify OTP.');
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return toast.warn('Passwords do not match.');
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token: resetToken, newPassword: password });
      toast.success('Password reset successful.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Reset your password" subtitle="Verify your email with an OTP, then choose a new password.">
      <Card glass className="border-slate-200/60 shadow-xl">
        <CardHeader className="space-y-1.5 text-center pb-2">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-primary/10 text-brand-primary">
            {step === 0 && <Mail className="h-6 w-6" />}
            {step === 1 && <ShieldCheck className="h-6 w-6" />}
            {step === 2 && <KeyRound className="h-6 w-6" />}
          </div>
          <CardTitle className="text-2xl">Forgot password</CardTitle>
          <CardDescription>{steps[step]} verification</CardDescription>
        </CardHeader>

        <div className="px-6 pb-2">
          <div className="grid grid-cols-3 gap-2">
            {steps.map((label, index) => (
              <div key={label} className={`h-1.5 rounded-full ${index <= step ? 'bg-brand-primary' : 'bg-slate-200'}`} />
            ))}
          </div>
        </div>

        {step === 0 && (
          <form onSubmit={sendOtp}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="normal-case tracking-normal text-slate-600">Email</Label>
                <Input id="email" type="email" placeholder="runner@example.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} required />
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" variant="glow" className="w-full gap-2" disabled={loading}>
                {loading ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <><span>Send OTP</span><Send className="h-4 w-4" /></>}
              </Button>
              <Link to="/login" className="inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-brand-primary hover:underline">
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to sign in
              </Link>
            </CardFooter>
          </form>
        )}

        {step === 1 && (
          <form onSubmit={verifyOtp}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp" className="normal-case tracking-normal text-slate-600">6-digit OTP</Label>
                <Input id="otp" inputMode="numeric" maxLength={6} placeholder="123456" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} disabled={loading} required />
              </div>
              <Button type="button" variant="ghost" className="w-full" onClick={sendOtp} disabled={loading}>
                Resend OTP
              </Button>
            </CardContent>

            <CardFooter>
              <Button type="submit" variant="glow" className="w-full gap-2" disabled={loading}>
                {loading ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <><span>Verify OTP</span><ArrowRight className="h-4 w-4" /></>}
              </Button>
            </CardFooter>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={resetPassword}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="normal-case tracking-normal text-slate-600">New password</Label>
                <Input id="password" type="password" placeholder="New password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="normal-case tracking-normal text-slate-600">Confirm password</Label>
                <Input id="confirmPassword" type="password" placeholder="Confirm password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} disabled={loading} required />
              </div>
            </CardContent>

            <CardFooter>
              <Button type="submit" variant="glow" className="w-full gap-2" disabled={loading || !resetToken}>
                {loading ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <><span>Reset Password</span><ArrowRight className="h-4 w-4" /></>}
              </Button>
            </CardFooter>
          </form>
        )}
      </Card>
    </AuthLayout>
  );
}
