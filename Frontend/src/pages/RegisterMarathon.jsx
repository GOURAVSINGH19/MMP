import { useEffect, useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Input, Label, Select } from '../components/ui';
import { ArrowLeft, ArrowRight, CheckCircle2, User, Mail, Phone, Trophy, Shirt, ShieldAlert, Check } from 'lucide-react';
import { toast } from 'react-toastify';

export default function RegisterMarathon() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [credentials, setCredentials] = useState(null);
  const [events, setEvents] = useState([]);
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Form Fields State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    gender: '',
    age: '',
    bloodGroup: '',
    eventId: '',
    distance: '10K',
    tshirtSize: 'M',
    emergencyName: '',
    emergencyPhone: '',
    emergencyRelationship: '',
    waiverAccepted: false,
  });

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await api.get('/participant/events');
        setEvents(response.data);
        if (response.data.length > 0) {
          const requestedEventId = searchParams.get('eventId');
          const firstEvent = response.data.find((event) => event.id === requestedEventId) || response.data[0];
          setFormData((prev) => ({
            ...prev,
            eventId: firstEvent.id,
            distance: firstEvent.distances?.[0] || prev.distance
          }));
        }
      } catch (err) {
        setError('Events could not be loaded. Please try again later.');
      }
    };

    fetchEvents();
  }, [searchParams]);

  const effectiveEventId = formData.eventId || events[0]?.id || '';
  const selectedEvent = events.find((event) => event.id === effectiveEventId);
  const availableDistances = selectedEvent?.distances?.length ? selectedEvent.distances : ['5K', '10K', '21K', '42K'];

  const handleChange = (e) => {
    const { id, value } = e.target;
    if (id === 'eventId') {
      const nextEvent = events.find((event) => event.id === value);
      setFormData(prev => ({
        ...prev,
        eventId: value,
        distance: nextEvent?.distances?.[0] || prev.distance
      }));
      return;
    }
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const nextStep = () => {
    if (step === 1) {
      if (!formData.name || !formData.email || !formData.phone) {
        return setError('Please fill in your name, email, and phone number.');
      }
    } else if (step === 2) {
      if (events.length > 0 && !effectiveEventId) {
        return setError('Please select a marathon event.');
      }
      if (!formData.distance || !formData.tshirtSize) {
        return setError('Please select a distance category and t-shirt size.');
      }
    } else if (step === 3) {
      if (!formData.emergencyName || !formData.emergencyPhone) {
        return setError('Emergency contact details are required.');
      }
    } else if (step === 4) {
      if (!formData.waiverAccepted) {
        return setError('You must accept the waiver and terms to continue.');
      }
    }
    setError('');
    setStep(prev => prev + 1);
  };

  const prevStep = () => {
    setError('');
    setStep(prev => prev - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.waiverAccepted) {
      return setError('You must accept the waiver and terms to register.');
    }

    setError('');
    setLoading(true);

    try {
      const response = await api.post('/participant/register', {
        ...formData,
        eventId: effectiveEventId,
        waiverAccepted: true,
      });

      const { isPaid, paymentId, tempPassword, user } = response.data;

      setCredentials({
        email: user?.email || formData.email,
        password: tempPassword || ''
      });

      if (tempPassword) {
        localStorage.setItem('mmp_temp_email', user?.email || formData.email);
        localStorage.setItem('mmp_temp_pass', tempPassword);
      }

      if (isPaid && paymentId) {
        toast.info('Paid event! Redirecting to secure Paytm simulator...');
        setTimeout(() => {
          navigate(`/paytm-checkout/${paymentId}`);
        }, 1500);
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[85vh] items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900/10">
      <div className="absolute top-1/4 left-1/4 h-72 w-72 rounded-full bg-purple-500/10 blur-3xl -z-10" />
      <div className="absolute bottom-1/4 right-1/4 h-80 w-80 rounded-full bg-green-500/5 blur-3xl -z-10" />

      <Card className="w-full max-w-lg border-slate-200/60 dark:border-slate-800/40 shadow-2xl transition-all duration-300">
        {!success ? (
          <>
            {/* Step Progress Indicators */}
            <div className="px-6 pt-6 flex items-center justify-between">
              {[1, 2, 3, 4, 5].map((num) => (
                <div key={num} className="flex items-center flex-1 last:flex-initial">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all duration-300 font-semibold text-sm ${
                    step === num
                      ? 'border-purple-600 bg-purple-600 text-white shadow-[0_0_10px_rgba(170,59,255,0.4)]'
                      : step > num
                      ? 'border-green-500 bg-green-500 text-white'
                      : 'border-slate-250 dark:border-slate-800 text-slate-400'
                  }`}>
                    {step > num ? <Check className="h-4 w-4" /> : num}
                  </div>
                  {num < 5 && (
                    <div className={`h-[2px] flex-1 mx-2 transition-all duration-300 ${
                      step > num ? 'bg-green-500' : 'bg-slate-200 dark:bg-slate-800'
                    }`} />
                  )}
                </div>
              ))}
            </div>

            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl font-bold tracking-tight">Marathon Entry Form</CardTitle>
              <CardDescription>
                {step === 1 && 'Step 1: Personal information'}
                {step === 2 && 'Step 2: Race category & kit'}
                {step === 3 && 'Step 3: Emergency contact'}
                {step === 4 && 'Step 4: Waiver & terms'}
                {step === 5 && 'Step 5: Review & submit'}
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4 pt-4">
                {error && (
                  <div className="flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/30 p-3 text-sm text-red-600 dark:text-red-400">
                    <ShieldAlert className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* STEP 1: Personal Details */}
                {step === 1 && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-slate-400" />
                        <span>Full Name</span>
                      </Label>
                      <Input
                        id="name"
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={handleChange}
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
                        value={formData.email}
                        onChange={handleChange}
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
                        placeholder="+1 (555) 123-4567"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="gender">Gender</Label>
                        <Select id="gender" value={formData.gender} onChange={handleChange}>
                          <option value="">Select</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="age">Age</Label>
                        <Input id="age" type="number" min="10" max="99" value={formData.age} onChange={handleChange} />
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: Marathon Configuration */}
                {step === 2 && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="eventId" className="flex items-center gap-1.5">
                        <Trophy className="h-3.5 w-3.5 text-slate-400" />
                        <span>Marathon Event</span>
                      </Label>
                      <Select id="eventId" value={effectiveEventId} onChange={handleChange} disabled={events.length === 0}>
                        {events.length === 0 ? (
                          <option value="">Default marathon event</option>
                        ) : (
                          events.map((event) => (
                            <option key={event.id} value={event.id}>
                              {event.name} {event.isPaid ? `(${event.currency || 'INR'} ${(event.registrationFee + (event.tax || 0) + (event.convenienceFee || 0)).toFixed(2)})` : '(Free)'}
                            </option>
                          ))
                        )}
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="distance" className="flex items-center gap-1.5">
                        <Trophy className="h-3.5 w-3.5 text-slate-400" />
                        <span>Race Distance</span>
                      </Label>
                      <Select id="distance" value={formData.distance} onChange={handleChange}>
                        {availableDistances.map((distance) => (
                          <option key={distance} value={distance}>{distance}</option>
                        ))}
                      </Select>
                      <p className="text-xs text-slate-400 mt-1">Select the official timing category you wish to enter.</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tshirtSize" className="flex items-center gap-1.5">
                        <Shirt className="h-3.5 w-3.5 text-slate-400" />
                        <span>Finisher T-Shirt Size</span>
                      </Label>
                      <Select id="tshirtSize" value={formData.tshirtSize} onChange={handleChange}>
                        <option value="S">Small (S)</option>
                        <option value="M">Medium (M)</option>
                        <option value="L">Large (L)</option>
                        <option value="XL">Extra Large (XL)</option>
                        <option value="XXL">Double Extra Large (XXL)</option>
                      </Select>
                      <p className="text-xs text-slate-400 mt-1">Unisex official athletic fit finisher tee.</p>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-4">
                    <div className="rounded-lg bg-purple-500/5 border border-purple-500/10 p-3 text-xs text-purple-700 leading-relaxed">
                      Provide someone reachable on race day who is not participating in the event.
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emergencyName">Emergency contact name</Label>
                      <Input id="emergencyName" value={formData.emergencyName} onChange={handleChange} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emergencyPhone">Emergency phone</Label>
                      <Input id="emergencyPhone" value={formData.emergencyPhone} onChange={handleChange} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emergencyRelationship">Relationship</Label>
                      <Input id="emergencyRelationship" placeholder="Spouse, parent, friend…" value={formData.emergencyRelationship} onChange={handleChange} />
                    </div>
                  </div>
                )}

                {step === 4 && (
                  <div className="space-y-4">
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs leading-relaxed text-slate-600 max-h-40 overflow-y-auto">
                      <p className="font-bold text-slate-800 mb-2">Liability waiver & participation terms</p>
                      <p>I understand marathon participation involves physical risk. I confirm I am medically fit, will follow race officials, and release organizers from liability for injury except where prohibited by law.</p>
                    </div>
                    <label className="flex items-start gap-3 cursor-pointer text-sm">
                      <input
                        type="checkbox"
                        checked={formData.waiverAccepted}
                        onChange={(e) => setFormData((prev) => ({ ...prev, waiverAccepted: e.target.checked }))}
                        className="mt-1"
                      />
                      <span>I have read and accept the waiver, race rules, and terms & conditions.</span>
                    </label>
                  </div>
                )}

                {step === 5 && (
                  <div className="space-y-3 text-sm text-slate-600">
                    <p><strong>Event:</strong> {selectedEvent?.name || 'Marathon'}</p>
                    <p><strong>Distance:</strong> {formData.distance} · <strong>T-shirt:</strong> {formData.tshirtSize}</p>
                    <p><strong>Runner:</strong> {formData.name} ({formData.email})</p>
                    {selectedEvent?.isPaid && (
                      <p className="text-brand-primary font-semibold">Payment will be collected on the next screen after submit.</p>
                    )}
                  </div>
                )}
              </CardContent>

              <CardFooter className="flex justify-between gap-4 mt-2">
                {step > 1 ? (
                  <Button type="button" variant="outline" className="flex items-center gap-2" onClick={prevStep} disabled={loading}>
                    <ArrowLeft className="h-4 w-4" />
                    <span>Back</span>
                  </Button>
                ) : (
                  <Link to="/login" className="text-sm font-semibold text-purple-650 hover:underline flex items-center">
                    Back to Log In
                  </Link>
                )}

                {step < 5 ? (
                  <Button type="button" className="flex items-center gap-2 ml-auto" onClick={nextStep}>
                    <span>Next</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button type="submit" variant="glow" className="flex items-center gap-2 ml-auto" disabled={loading}>
                    {loading ? (
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      <>
                        <span>Submit Registration</span>
                        <Check className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                )}
              </CardFooter>
            </form>
          </>
        ) : (
          /* SUCCESS SCREEN */
          <CardContent className="pt-8 text-center space-y-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-950/50 text-green-600 dark:text-green-400 animate-bounce">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">You're Registered!</h2>
              <p className="text-slate-500 dark:text-slate-400">
                Welcome to the Metropolis Marathon starting lineup, <strong>{formData.name}</strong>!
              </p>
            </div>

            <div className="rounded-xl border border-dashed border-purple-550/30 bg-purple-500/5 p-5 text-left max-w-sm mx-auto space-y-3">
              <h4 className="font-bold text-black dark:text-white text-sm text-center border-b border-purple-500/10 pb-1.5">🔑 IMPORTANT: YOUR CREDENTIALS</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Your participant account has been created. Use these credentials to log in and track your marathon status.
              </p>
              <div className="text-xs space-y-1 font-mono text-black dark:text-slate-350 bg-slate-100 dark:bg-slate-900 p-2.5 rounded-lg border">
                <div><strong>Email:</strong> {credentials?.email || formData.email}</div>
                <div><strong>Password:</strong> {credentials?.password || 'Check email/backend console'}</div>
              </div>
            </div>

            <p className="text-sm text-slate-500 dark:text-slate-400">
              The organizer will review your registration. Log in to track your status bubbles!
            </p>

            <Button onClick={() => navigate('/login')} variant="glow" className="w-full flex items-center justify-center gap-2">
              <span>Go to Login Panel</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
