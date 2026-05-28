import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, TableContainer, TableHeader, TableBody, TableRow, TableHead, TableCell, Badge, Input, Select, Label, CardFooter } from '../components/ui';
import { Users, CheckCircle, ShieldAlert, Award, FileText, PlusCircle, Search, Calendar, Trophy, Clock, X, Check, AwardIcon } from 'lucide-react';

export default function OrganizerDashboard() {
  const { user, logout } = useAuth();
  const [participants, setParticipants] = useState([]);
  const [stats, setStats] = useState({ totalRegistrations: 0, pendingApprovals: 0, finishers: 0, volunteers: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [distanceFilter, setDistanceFilter] = useState('ALL');

  // Modals state
  const [activeModal, setActiveModal] = useState(null); // 'BIB' or 'TIME' or null
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [bibInput, setBibInput] = useState('');
  const [timeInput, setTimeInput] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch admin dashboard data
  const fetchData = async () => {
    try {
      const [participantsRes, statsRes] = await Promise.all([
        api.get('/admin/participants'),
        api.get('/admin/stats')
      ]);
      setParticipants(participantsRes.data);
      setStats(statsRes.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch organizer dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Approve participant registration
  const handleApprove = async (participantId) => {
    if (!window.confirm('Are you sure you want to approve this marathon registration?')) return;
    try {
      await api.post('/admin/approve', { participantId });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Approval failed');
    }
  };

  // Open modal to assign BIB
  const openBibModal = (participant) => {
    setSelectedParticipant(participant);
    setBibInput(participant.bib || '');
    setActiveModal('BIB');
  };

  // Submit BIB assignment
  const handleAssignBibSubmit = async (e) => {
    e.preventDefault();
    if (!bibInput) return alert('Please enter a valid BIB number.');

    setActionLoading(true);
    try {
      await api.post('/admin/assign-bib', {
        participantId: selectedParticipant.id,
        bib: bibInput
      });
      setActiveModal(null);
      setBibInput('');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to assign BIB');
    } finally {
      setActionLoading(false);
    }
  };

  // Open modal to enter finish time
  const openTimeModal = (participant) => {
    setSelectedParticipant(participant);
    setTimeInput(participant.finishTime || '02:30:00');
    setActiveModal('TIME');
  };

  // Submit finish time
  const handleTimeSubmit = async (e) => {
    e.preventDefault();
    if (!timeInput) return alert('Please enter the finish time.');

    setActionLoading(true);
    try {
      await api.post('/admin/finish-time', {
        participantId: selectedParticipant.id,
        finishTime: timeInput
      });
      setActiveModal(null);
      setTimeInput('');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to enter finish time');
    } finally {
      setActionLoading(false);
    }
  };

  // Filter logic
  const filteredParticipants = participants.filter((p) => {
    const matchesSearch = p.user.name.toLowerCase().includes(search.toLowerCase()) ||
      p.user.email.toLowerCase().includes(search.toLowerCase()) ||
      (p.bib && p.bib.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
    const matchesDistance = distanceFilter === 'ALL' || p.distance === distanceFilter;

    return matchesSearch && matchesStatus && matchesDistance;
  });

  if (loading) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
        <p className="mt-4 text-sm text-slate-500">Loading organizer dashboard...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Organizer Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white m-0 tracking-tight flex items-center gap-2">
            <Trophy className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            Organizer Dashboard
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Marathon Event Management & Participant Verification Systems
          </p>
        </div>
        <Button variant="outline" onClick={logout} className="flex items-center gap-2 border-red-500/20 hover:bg-red-500/10 text-red-650">
          Sign Out
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 p-4 text-sm text-red-650">
          <ShieldAlert className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* STATS METRICS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-md border-slate-200/50 hover:shadow-purple-500/5 duration-300">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Registrations</div>
              <div className="text-3xl font-black text-slate-800 dark:text-white">{stats.totalRegistrations}</div>
            </div>
            <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-950/50 text-purple-650 dark:text-purple-400 flex items-center justify-center">
              <Users className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md border-slate-200/50 hover:shadow-amber-500/5 duration-300">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Approvals</div>
              <div className="text-3xl font-black text-slate-800 dark:text-white">{stats.pendingApprovals}</div>
            </div>
            <div className="h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-650 dark:text-amber-400 flex items-center justify-center">
              <Clock className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md border-slate-200/50 hover:shadow-green-500/5 duration-300">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Volunteers</div>
              <div className="text-3xl font-black text-slate-800 dark:text-white">{stats.volunteers}</div>
            </div>
            <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-950/50 text-green-650 dark:text-green-400 flex items-center justify-center">
              <Users className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md border-slate-200/50 hover:shadow-emerald-500/5 duration-300">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Finishers</div>
              <div className="text-3xl font-black text-slate-800 dark:text-white">{stats.finishers}</div>
            </div>
            <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-650 dark:text-emerald-400 flex items-center justify-center">
              <Award className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SEARCH AND FILTERS */}
      <Card className="shadow-sm border-slate-200/60 dark:border-slate-800/40">
        <CardContent className="p-6 flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full space-y-1.5">
            <Label htmlFor="search" className="flex items-center gap-1">
              <Search className="h-3 w-3 text-slate-400" />
              <span>Search Participants</span>
            </Label>
            <Input
              id="search"
              placeholder="Search by name, email, or BIB..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="w-full md:w-48 space-y-1.5">
            <Label htmlFor="statusFilter">Status Filter</Label>
            <Select id="statusFilter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="ALL">All Statuses</option>
              <option value="REGISTERED">Registered</option>
              <option value="APPROVED">Approved</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="BIB_COLLECTED">BIB Collected</option>
              <option value="COMPLETED">Completed</option>
            </Select>
          </div>

          <div className="w-full md:w-48 space-y-1.5">
            <Label htmlFor="distanceFilter">Distance Category</Label>
            <Select id="distanceFilter" value={distanceFilter} onChange={(e) => setDistanceFilter(e.target.value)}>
              <option value="ALL">All Distances</option>
              <option value="5K">Fun Run (5K)</option>
              <option value="10K">Quarter Marathon (10K)</option>
              <option value="21K">Half Marathon (21K)</option>
              <option value="42K">Full Marathon (42K)</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* REGISTRATIONS TABLE */}
      <Card className="shadow-lg border-slate-200/60 dark:border-slate-800/40 overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle>Marathon Entry Ledger</CardTitle>
          <CardDescription>
            Showing {filteredParticipants.length} matching event registrations
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <TableContainer>
            <TableHeader>
              <TableRow>
                <TableHead>Participant</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>T-Shirt Size</TableHead>
                <TableHead>BIB Number</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredParticipants.length > 0 ? (
                filteredParticipants.map((participant) => (
                  <TableRow key={participant.id}>
                    <TableCell>
                      <div className="font-semibold text-slate-800 dark:text-white">{participant.user.name}</div>
                      <div className="text-xs text-slate-400 font-mono">{participant.user.email}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-mono">
                        {participant.distance}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-bold">{participant.tshirtSize}</TableCell>
                    <TableCell>
                      {participant.bib ? (
                        <div className="font-mono font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 border px-2 py-0.5 rounded-lg w-max shadow-sm">
                          <span>{participant.bib}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">Not Assigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          participant.status === 'COMPLETED' ? 'success' :
                            participant.status === 'BIB_COLLECTED' ? 'secondary' :
                              participant.status === 'CONFIRMED' ? 'default' :
                                participant.status === 'APPROVED' ? 'warning' : 'danger'
                        }
                      >
                        {participant.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {/* Action 1: Approve (REGISTERED -> APPROVED) */}
                        {participant.status === 'REGISTERED' && (
                          <Button
                            variant="glow"
                            size="sm"
                            className="bg-emerald-650 hover:bg-emerald-700"
                            onClick={() => handleApprove(participant.id)}
                          >
                            <Check className="h-3.5 w-3.5 mr-1" />
                            Approve
                          </Button>
                        )}

                        {/* Action 2: Assign BIB (APPROVED/CONFIRMED -> modal) */}
                        {(participant.status === 'APPROVED' || participant.status === 'CONFIRMED') && (
                          <Button
                            variant="glow"
                            size="sm"
                            onClick={() => openBibModal(participant)}
                          >
                            Assign BIB
                          </Button>
                        )}

                        {/* Action 3: Enter Finish Time (BIB_COLLECTED -> modal) */}
                        {participant.status === 'BIB_COLLECTED' && (
                          <Button
                            variant="glow"
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700"
                            onClick={() => openTimeModal(participant)}
                          >
                            Finish Time
                          </Button>
                        )}

                        {/* Display Finish stats if completed */}
                        {participant.status === 'COMPLETED' && (
                          <div className="text-xs font-mono font-bold text-green-600 bg-green-500/10 border border-green-500/20 px-2 py-1 rounded-lg">
                            ⏱ {participant.finishTime}
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                    No registrations found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </TableContainer>
        </CardContent>
      </Card>

      {/* --- MODALS FOR ACTIONS --- */}

      {/* 1. BIB Assignment Modal */}
      {activeModal === 'BIB' && selectedParticipant && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 px-4">
          <Card className="w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
              <div>
                <CardTitle className="text-lg">Assign Official BIB</CardTitle>
                <CardDescription>Assigning bib for {selectedParticipant.user.name}</CardDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setActiveModal(null)} className="h-8 w-8 rounded-full border">
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <form onSubmit={handleAssignBibSubmit}>
              <CardContent className="space-y-4 pt-4">
                <div className="space-y-1.5">
                  <Label htmlFor="bib">BIB Number</Label>
                  <Input
                    id="bib"
                    placeholder="e.g. BIB-3045"
                    value={bibInput}
                    onChange={(e) => setBibInput(e.target.value)}
                    required
                    autoFocus
                  />
                  <p className="text-xs text-slate-400 mt-1">Assigning a BIB automatically generates a checkin QR and notifies the runner via email.</p>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2 border-t pt-4">
                <Button type="button" variant="outline" onClick={() => setActiveModal(null)}>Cancel</Button>
                <Button type="submit" variant="glow" disabled={actionLoading}>
                  {actionLoading ? "Generating QR..." : "Confirm & Send"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      )}

      {/* 2. Finish Time Modal */}
      {activeModal === 'TIME' && selectedParticipant && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 px-4">
          <Card className="w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
              <div>
                <CardTitle className="text-lg">Log Finish Time</CardTitle>
                <CardDescription>Record final timing stats for {selectedParticipant.user.name}</CardDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setActiveModal(null)} className="h-8 w-8 rounded-full border">
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <form onSubmit={handleTimeSubmit}>
              <CardContent className="space-y-4 pt-4">
                <div className="space-y-1.5">
                  <Label htmlFor="time">Marathon Finish Time</Label>
                  <Input
                    id="time"
                    placeholder="HH:MM:SS (e.g. 02:45:12)"
                    value={timeInput}
                    onChange={(e) => setTimeInput(e.target.value)}
                    required
                    autoFocus
                  />
                  <p className="text-xs text-slate-400 mt-1">Entering a finish time transitions status to COMPLETED, triggers completion certificate PDFs and sends them via email.</p>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2 border-t pt-4">
                <Button type="button" variant="outline" onClick={() => setActiveModal(null)}>Cancel</Button>
                <Button type="submit" variant="glow" className="bg-emerald-600 hover:bg-emerald-700" disabled={actionLoading}>
                  {actionLoading ? "Processing..." : "Complete & Issue Certificate"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      )}

    </div>
  );
}
