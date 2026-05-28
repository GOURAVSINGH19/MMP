import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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

      // Role-based navigation redirect
      if (loggedUser.role === 'ORGANIZER') {
        navigate('/admin');
      } else if (loggedUser.role === 'VOLUNTEER') {
        navigate('/volunteer');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      toast.error(err.message || err || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-8 bg-slate-50/50 dark:bg-slate-900/10">
      <Card className="w-full max-w-md border-slate-200/50 dark:border-slate-800/40 shadow-xl transition-all duration-300">
        <CardHeader className="space-y-1.5 text-center pb-4">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100 mb-2 border border-slate-200/80 dark:border-slate-800/85">
            <LogIn className="h-5 w-5" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Welcome back</CardTitle>
          <CardDescription className="text-slate-500 dark:text-slate-400">
            Enter your credentials to access your marathon dashboard
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                <Mail className="h-3.5 w-3.5 text-slate-400" />
                <span>Email Address</span>
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
                <Label htmlFor="password" className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                  <KeyRound className="h-3.5 w-3.5 text-slate-400" />
                  <span>Password</span>
                </Label>
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

          <CardFooter className="flex flex-col gap-4 pt-2">
            <Button type="submit" variant="glow" className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900 shadow-lg" disabled={loading}>
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-550 border-t-transparent" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>

            <div className="text-center text-sm text-slate-500 dark:text-slate-400">
              New to the marathon?{' '}
              <Link to="/register" className="font-semibold text-purple-650 dark:text-purple-400 hover:underline">
                Register here
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
