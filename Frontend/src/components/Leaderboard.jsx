import { useState, useEffect } from 'react';
import api from '../services/api';
import { Card, CardHeader, CardTitle, CardContent, Badge, Select, Label, TableContainer, TableHeader, TableBody, TableRow, TableHead, TableCell } from './ui';
import { Trophy, Medal, Search, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Leaderboard({ events = [], defaultEventId = '' }) {
  const { user } = useAuth();
  const [selectedEventId, setSelectedEventId] = useState(defaultEventId);
  const [selectedDistance, setSelectedDistance] = useState('ALL');
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const completedEvents = events.filter(e => {
    const status = e.status || e.eventStatus;
    return ['COMPLETED', 'ARCHIVED'].includes(status);
  });

  useEffect(() => {
    if (defaultEventId) {
      setSelectedEventId(defaultEventId);
    } else if (!selectedEventId && completedEvents.length > 0) {
      setSelectedEventId(completedEvents[0].id);
    }
  }, [completedEvents, selectedEventId, defaultEventId]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      if (!selectedEventId) return;
      setLoading(true);
      setError('');
      try {
        const query = selectedDistance !== 'ALL' ? `?distance=${selectedDistance}` : '';
        const res = await api.get(`/events/${selectedEventId}/leaderboard${query}`);
        setLeaderboardData(res.data.leaderboard || []);
      } catch (err) {
        setError('Failed to load leaderboard data.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [selectedEventId, selectedDistance]);

  const activeEvent = completedEvents.find(e => e.id === selectedEventId);
  const distances = activeEvent?.distances || [];

  if (completedEvents.length === 0) {
    return (
      <Card className="border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30">
        <CardContent className="p-8 text-center flex flex-col items-center">
          <Trophy className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-3" />
          <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">No Leaderboards Available</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-sm">
            Leaderboards will appear here once an event is completed.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg border-slate-200/60 dark:border-slate-800/40">
      <CardHeader className="border-b border-slate-200/50 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/20 pb-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-xl">Official Leaderboards</CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">Rankings for completed marathon events</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            {completedEvents.length > 1 && (
              <div className="flex-1 sm:w-[220px]">
                <Label className="sr-only">Select Event</Label>
                <Select 
                  value={selectedEventId} 
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="w-full"
                >
                  {completedEvents.map(ev => (
                    <option key={ev.id} value={ev.id}>{ev.name}</option>
                  ))}
                </Select>
              </div>
            )}
            <div className="flex-1 sm:w-[140px]">
              <Label className="sr-only">Select Distance</Label>
              <Select 
                value={selectedDistance} 
                onChange={(e) => setSelectedDistance(e.target.value)}
                className="w-full"
              >
                <option value="ALL">All Categories</option>
                {distances.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </Select>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin text-brand-primary mb-4" />
            <p className="text-sm">Calculating rankings...</p>
          </div>
        ) : error ? (
          <div className="py-12 text-center text-red-500 text-sm">
            {error}
          </div>
        ) : leaderboardData.length === 0 ? (
          <div className="py-16 text-center text-slate-500 flex flex-col items-center">
            <Search className="h-8 w-8 text-slate-300 mb-3" />
            <p className="font-medium text-slate-700 dark:text-slate-300">No results found</p>
            <p className="text-xs mt-1">Try selecting a different category or event.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <TableContainer>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20 text-center">Rank</TableHead>
                  <TableHead>Runner</TableHead>
                  <TableHead className="text-center">BIB</TableHead>
                  <TableHead className="text-center">Category</TableHead>
                  <TableHead className="text-right">Finish Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaderboardData.map((row, idx) => {
                  const isMe = user?.email && (row.runnerEmail || row.email) === user.email;
                  return (
                    <TableRow key={idx} className={isMe ? "bg-brand-primary/5 hover:bg-brand-primary/10 border-l-2 border-l-brand-primary" : ""}>
                      <TableCell className="text-center">
                        {row.rank === 1 ? (
                          <div className="mx-auto h-7 w-7 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center font-bold text-xs border border-yellow-200">1</div>
                        ) : row.rank === 2 ? (
                          <div className="mx-auto h-7 w-7 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-xs border border-slate-200">2</div>
                        ) : row.rank === 3 ? (
                          <div className="mx-auto h-7 w-7 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-xs border border-orange-200">3</div>
                        ) : (
                          <span className="font-medium text-slate-500">{row.rank}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                          {row.runnerName || row.name}
                          {isMe && <Badge variant="secondary" className="bg-brand-primary/10 text-brand-primary border-brand-primary/20 text-[9px] px-1.5 py-0">YOU</Badge>}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-mono font-medium text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300">
                          {row.bibNumber}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="text-[10px]">{row.distance}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                          {row.finishTime}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </TableContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
