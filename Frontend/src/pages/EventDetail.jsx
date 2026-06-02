import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui';
import { ArrowLeft, ArrowRight, Calendar, Clock, HelpCircle, MapPin, ShieldAlert, Sparkles, Trophy, Users } from 'lucide-react';
import Countdown from '../components/Countdown';
import Leaderboard from '../components/Leaderboard';

const formatDate = (value) => {
  if (!value) return 'To be announced';
  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
};

const sponsorOrder = ['TITLE', 'PLATINUM', 'GOLD', 'SILVER', 'BRONZE'];

export default function EventDetail() {
  const { id } = useParams();
  const { user, isParticipant, isOrganizer } = useAuth();
  const [event, setEvent] = useState(null);
  const [myRegistration, setMyRegistration] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const requests = [api.get(`/participant/events/${id}`)];
        if (user && isParticipant() && !isOrganizer()) {
          requests.push(api.get('/participant/my-events'));
        }
        const [eventRes, myEventsRes] = await Promise.all(requests);
        setEvent(eventRes.data);
        if (myEventsRes?.data) {
          const { current, history } = myEventsRes.data;
          const match =
            current?.event?.id === id
              ? current
              : (history || []).find((r) => r.event?.id === id);
          setMyRegistration(match || null);
        }
      } catch (err) {
        setError(err.response?.data?.error || 'Event details could not be loaded.');
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id, user, isParticipant, isOrganizer]);

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/20">
          <CardContent className="p-6 flex items-center gap-3 text-amber-700 dark:text-amber-300">
            <ShieldAlert className="h-5 w-5" />
            <span>{error || 'Event not found.'}</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  const groupedSponsors = (event.sponsors || []).reduce((acc, sponsor) => {
    acc[sponsor.category] = [...(acc[sponsor.category] || []), sponsor];
    return acc;
  }, {});

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 text-left">
      <Link to="/events" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-purple-650">
        <ArrowLeft className="h-4 w-4" />
        Back to events
      </Link>

      <section className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 md:p-8 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="space-y-4">
            <Badge variant={event.eventStatus === 'REGISTRATION_OPEN' ? 'success' : 'secondary'}>
              {event.eventStatus.replaceAll('_', ' ')}
            </Badge>
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-slate-950 dark:text-white tracking-tight">{event.name}</h1>
              <p className="mt-3 max-w-3xl text-slate-500 dark:text-slate-400">{event.description}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              {(event.distances || []).map((distance) => (
                <Badge key={distance} variant="default">{distance}</Badge>
              ))}
            </div>
          </div>
          {user && isOrganizer() ? (
            <Link to={`/admin?eventId=${event.id}`}>
              <Button variant="glow" size="lg" className="flex items-center gap-2">
                <span>Manage event</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          ) : myRegistration ? (
            <div className="flex flex-col gap-2 sm:items-end">
              <Badge variant="success">Already registered</Badge>
              <Link to="/dashboard">
                <Button variant="glow" size="lg" className="flex items-center gap-2">
                  <span>View registration</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          ) : (
            <Link to={`/register-marathon?eventId=${event.id}`}>
              <Button variant="glow" size="lg" className="flex items-center gap-2">
                <span>Register Now</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>
        {event.date && (
          <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3 text-center">Countdown to race day</p>
            <Countdown targetDate={event.date} className="!text-slate-900" />
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-500">
              <Calendar className="h-4 w-4 text-purple-650" />
              Race Date
            </div>
            <div className="mt-2 text-sm font-bold text-slate-900 dark:text-white">{formatDate(event.date)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-500">
              <Clock className="h-4 w-4 text-purple-650" />
              Registration Deadline
            </div>
            <div className="mt-2 text-sm font-bold text-slate-900 dark:text-white">{formatDate(event.registrationDeadline)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-500">
              <MapPin className="h-4 w-4 text-purple-650" />
              Location
            </div>
            <div className="mt-2 text-sm font-bold text-slate-900 dark:text-white">{event.location}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_0.8fr] gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-purple-650" />
              Distances & Schedule
            </CardTitle>
            <CardDescription>Public race information for runners and guests.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(event.distances || []).map((distance) => (
              <div key={distance} className="rounded-lg border border-slate-200 dark:border-slate-800 p-4">
                <div className="text-lg font-black text-slate-950 dark:text-white">{distance}</div>
                <div className="mt-1 text-xs text-slate-500">Official timed race category</div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-650" />
              Live Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              ['Registrations', event._count?.registrations || 0],
              ['Volunteers', event._count?.volunteers || 0],
              ['Sponsors', event._count?.sponsors || 0],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-800 px-4 py-3">
                <span className="text-sm text-slate-500">{label}</span>
                <span className="text-lg font-black text-slate-950 dark:text-white">{value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-650" />
            Sponsors
          </CardTitle>
          <CardDescription>Sponsors appear grouped by category on the public event page.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {event.sponsors?.length ? (
            sponsorOrder.filter((category) => groupedSponsors[category]).map((category) => (
              <div key={category}>
                <div className="mb-2 text-xs font-black uppercase tracking-wide text-slate-500">{category.replaceAll('_', ' ')}</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {groupedSponsors[category].map((sponsor) => (
                    <div key={sponsor.id} className="rounded-lg border border-slate-200 dark:border-slate-800 p-4">
                      <div className="font-bold text-slate-950 dark:text-white">{sponsor.name}</div>
                      <div className="mt-1 text-xs text-slate-500">{sponsor.description || sponsor.website || 'Official event sponsor'}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-lg border border-dashed border-slate-200 dark:border-slate-800 p-6 text-center text-sm text-slate-500">
              Sponsors will appear here after organizers assign them to this event.
            </div>
          )}
        </CardContent>
      </Card>

      {['COMPLETED', 'ARCHIVED', 'RACE_DAY'].includes(event.eventStatus) && (
        <Leaderboard events={[event]} defaultEventId={event.id} />
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-purple-650" />
            FAQ
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            ['When do I collect my BIB?', 'After organizer approval and BIB assignment, your participant dashboard will show the QR code for kit collection.'],
            ['Can volunteers scan every participant?', 'Only scanner-enabled volunteer roles can access the QR scanner.'],
            ['When is my certificate available?', 'After finish recording and organizer verification, the certificate download appears in your dashboard.'],
            ['Can I register without an account?', 'Yes. Registration creates a participant account and shows your temporary password after submission.'],
          ].map(([question, answer]) => (
            <div key={question} className="rounded-lg border border-slate-200 dark:border-slate-800 p-4">
              <div className="text-sm font-bold text-slate-950 dark:text-white">{question}</div>
              <div className="mt-2 text-xs leading-relaxed text-slate-500">{answer}</div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
