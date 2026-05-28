import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Input, Label, Select } from '../components/ui';
import { UserPlus, User, Mail, Phone, KeyRound, AlertCircle, ArrowRight } from 'lucide-react';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('PARTICIPANT');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !phone || !password) {
      return setError('All fields are required.');
    }

    setError('');
    setLoading(true);

    try {
      const user = await register(name, email, phone, password, role);
      if (user.role === 'ORGANIZER') {
        navigate('/admin');
      } else if (user.role === 'VOLUNTEER') {
        navigate('/volunteer');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[85vh] items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900/10">
      <div className="absolute top-1/4 left-1/4 h-72 w-72 rounded-full bg-purple-500/10 blur-3xl -z-10" />
      <div className="absolute bottom-1/4 right-1/4 h-80 w-80 rounded-full bg-green-500/5 blur-3xl -z-10" />

      <Card className="w-full max-w-md border-slate-200/60 dark:border-slate-800/40 shadow-2xl transition-all duration-300 hover:shadow-purple-500/5">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 mb-2">
            <UserPlus className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Create an account</CardTitle>
          <CardDescription>
            Register as a runner, organizer, or volunteer
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/30 p-3 text-sm text-red-600 dark:text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-slate-400" />
                <span>Full Name</span>
              </Label>
              <Input
                id="name"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-1.5">
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
              <Label htmlFor="phone" className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-slate-400" />
                <span>Phone Number</span>
              </Label>
              <Input
                id="phone"
                placeholder="+1 (555) 000-0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-1.5">
                <KeyRound className="h-3.5 w-3.5 text-slate-400" />
                <span>Password</span>
              </Label>
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

            <div className="space-y-2">
              <Label htmlFor="role">Account Role</Label>
              <Select id="role" value={role} onChange={(e) => setRole(e.target.value)} disabled={loading}>
                <option value="PARTICIPANT">Participant / Runner</option>
                <option value="ORGANIZER">Organizer / Admin</option>
                <option value="VOLUNTEER">Volunteer</option>
              </Select>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" variant="glow" className="w-full flex items-center justify-center gap-2" disabled={loading}>
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <span>Sign Up</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>

            <div className="text-center text-sm text-slate-500 dark:text-slate-400">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-purple-600 dark:text-purple-400 hover:underline">
                Sign in
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
