import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import PageHeader from '../components/PageHeader';
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui';
import { ArrowRight, Calendar, MapPin, Settings, ShieldAlert, Trophy, Users } from 'lucide-react';

const formatDate = (value) => {
  if (!value) return 'TBA';
  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
};

export default function OrganizerEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await api.get('/admin/events');
        setEvents(response.data || []);
        setError('');
      } catch (err) {
        setError(err.response?.data?.error || 'Could not load events.');
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  return (
    <div className="space-y-8 pb-12">
      <PageHeader
        icon={Trophy}
        badge="Organizer"
        title="Manage marathon events"
        description="Update event details, registration settings, and race-day configuration from the admin panel."
      />

      <div className="flex flex-wrap gap-3">
        <Link to="/admin">
          <Button variant="glow" className="gap-2">
            <Settings className="h-4 w-4" />
            Open admin panel
          </Button>
        </Link>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-primary border-t-transparent" />
          <p className="text-sm text-slate-500">Loading events…</p>
        </div>
      ) : events.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-sm text-slate-500">
            No events yet. Create one in the{' '}
            <Link to="/admin" className="font-semibold text-brand-primary hover:underline">
              admin panel
            </Link>
            .
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {events.map((event) => (
            <Card key={event.id} className="overflow-hidden border-slate-200/80 hover:shadow-md transition">
              <div className="h-2 bg-gradient-to-r from-brand-primary via-brand-accent to-strip-primary" />
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-xl">{event.name}</CardTitle>
                    <CardDescription className="mt-1">{event.description}</CardDescription>
                  </div>
                  <Badge variant={event.eventStatus === 'REGISTRATION_OPEN' ? 'success' : 'secondary'}>
                    {event.eventStatus?.replaceAll('_', ' ')}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2 text-sm">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Calendar className="h-4 w-4 text-brand-primary" />
                    {formatDate(event.date)}
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <MapPin className="h-4 w-4 text-brand-primary" />
                    {event.location}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Users className="h-4 w-4" />
                  {event._count?.registrations ?? 0} registrations · {event._count?.volunteers ?? 0} volunteers
                </div>
                <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                  <Link to={`/events/${event.id}`}>
                    <Button size="sm" variant="outline">
                      View public page
                    </Button>
                  </Link>
                  <Link to={`/admin?eventId=${event.id}`}>
                    <Button size="sm" variant="glow" className="gap-1.5">
                      <Settings className="h-3.5 w-3.5" />
                      Manage event
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
