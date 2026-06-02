import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/AuthLayout';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Input, Label } from '../components/ui';
import { UserPlus, User, Mail, Phone, KeyRound, AlertCircle, ArrowRight } from 'lucide-react';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !phone || !password || !confirmPassword) {
      return setError('All fields are required.');
    }
    if (password !== confirmPassword) {
      return setError('Passwords do not match.');
    }

    setError('');
    setLoading(true);

    try {
      await register(name, email, phone, password);
      navigate('/events');
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Join the starting line" subtitle="Create your account and choose participant or volunteer options from event discovery.">
      <Card glass className="border-slate-200/60 shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-primary/10 text-brand-primary">
            <UserPlus className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl">Create account</CardTitle>
          <CardDescription>Create your marathon portal account</CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-1.5 normal-case tracking-normal text-slate-600">
                <User className="h-3.5 w-3.5 text-slate-400" />
                Full name
              </Label>
              <Input id="name" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} disabled={loading} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-1.5 normal-case tracking-normal text-slate-600">
                <Mail className="h-3.5 w-3.5 text-slate-400" />
                Email
              </Label>
              <Input id="email" type="email" placeholder="runner@example.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-1.5 normal-case tracking-normal text-slate-600">
                <Phone className="h-3.5 w-3.5 text-slate-400" />
                Phone
              </Label>
              <Input id="phone" placeholder="+1 (555) 000-0000" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={loading} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-1.5 normal-case tracking-normal text-slate-600">
                <KeyRound className="h-3.5 w-3.5 text-slate-400" />
                Password
              </Label>
              <Input id="password" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="flex items-center gap-1.5 normal-case tracking-normal text-slate-600">
                <KeyRound className="h-3.5 w-3.5 text-slate-400" />
                Confirm password
              </Label>
              <Input id="confirmPassword" type="password" placeholder="Confirm password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} disabled={loading} required />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" variant="glow" className="w-full gap-2" disabled={loading}>
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <>
                  <span>Sign Up</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>

            <p className="text-center text-sm text-slate-500">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-brand-primary hover:underline">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </AuthLayout>
  );
}
