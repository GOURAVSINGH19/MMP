import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/AuthLayout';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Input, Label } from '../components/ui';
import { LogIn, KeyRound, Mail, ArrowRight } from 'lucide-react';
import { toast } from 'react-toastify';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      return toast.warn('Please enter both email and password.');
    }

    setLoading(true);

    try {
      const loggedUser = await login(email, password);
      toast.success(`Welcome back, ${loggedUser.name}!`);

      if (['ORGANIZER', 'EVENT_MANAGER', 'SUPER_ADMIN'].includes(loggedUser.role)) {
        navigate('/admin');
      } else if (loggedUser.role === 'VOLUNTEER') {
        navigate('/volunteer');
      } else {
        navigate('/events');
      }
    } catch (err) {
      toast.error(err.message || err || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Welcome back, runner" subtitle="Sign in to manage your registration, bib, and race-day updates.">
      <Card glass className="border-slate-200/60 shadow-xl">
        <CardHeader className="space-y-1.5 text-center pb-2">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-primary/10 text-brand-primary">
            <LogIn className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl">Sign in</CardTitle>
          <CardDescription>Access your marathon dashboard</CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-1.5 normal-case tracking-normal text-slate-600">
                <Mail className="h-3.5 w-3.5 text-slate-400" />
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="runner@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="flex items-center gap-1.5 normal-case tracking-normal text-slate-600">
                  <KeyRound className="h-3.5 w-3.5 text-slate-400" />
                  Password
                </Label>
                <Link to="/forgot-password" className="text-xs font-semibold text-brand-primary hover:underline">
                  Forgot?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" variant="glow" className="w-full gap-2" disabled={loading}>
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>

            <p className="text-center text-sm text-slate-500">
              New here?{' '}
              <Link to="/register" className="font-semibold text-brand-primary hover:underline">
                Create an account
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </AuthLayout>
  );
}
