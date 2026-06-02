import { useAuth } from '../context/AuthContext';
import PublicEvents from './PublicEvents';

/** Unified event discovery: every signed-in user can choose participant or volunteer path per event. */
export default function EventsRouter() {
  useAuth();

  return <PublicEvents />;
}
