import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, TableContainer, TableHeader, TableBody, TableRow, TableHead, TableCell, Badge, Input, Select, Label, CardFooter } from '../components/ui';
import {
  Users, ShieldAlert, Award, Search, Trophy, Clock, X, Check,
  QrCode, HeartPulse, Droplets, Map, PackageCheck, Radio, Megaphone,
  ClipboardList, BarChart3, History, ShieldCheck, Flag,
  CreditCard, Layers, MessageCircle, CheckSquare, Medal, Plus
} from 'lucide-react';
import OrganizerExtraTabs from '../components/OrganizerExtraTabs';
import Leaderboard from '../components/Leaderboard';
import { API_BASE_URL } from '../services/api';

const volunteerRoles = [
  { type: 'CHECK_IN', label: 'Check-In Volunteer', canScan: true, icon: QrCode, responsibilities: 'Verify registrations, distribute BIBs, scan QR during check-in' },
  { type: 'FINISH_LINE', label: 'Finish Line Volunteer', canScan: true, icon: Flag, responsibilities: 'Scan BIBs at the finish line and record completion' },
  { type: 'REGISTRATION_DESK', label: 'Registration Desk Volunteer', canScan: true, icon: ClipboardList, responsibilities: 'Registration verification and BIB distribution support' },
  { type: 'MEDICAL', label: 'Medical Volunteer', canScan: false, icon: HeartPulse, responsibilities: 'Medical support, emergency contacts, incident reporting' },
  { type: 'WATER_STATION', label: 'Water Station Volunteer', canScan: false, icon: Droplets, responsibilities: 'Hydration points, supplies, and checklist ownership' },
  { type: 'ROUTE_MARSHAL', label: 'Route Marshal', canScan: false, icon: Map, responsibilities: 'Guide participants and manage route flow' },
  { type: 'SECURITY', label: 'Security Volunteer', canScan: false, icon: ShieldCheck, responsibilities: 'Crowd management and event security' },
  { type: 'LOGISTICS', label: 'Logistics Volunteer', canScan: false, icon: PackageCheck, responsibilities: 'Setup, equipment handling, and operations support' },
  { type: 'END_OF_TRACK', label: 'End-of-Track Volunteer', canScan: false, icon: Award, responsibilities: 'Assist participants after race completion' },
];

const operationsModules = [
  { title: 'Check-In Management', icon: QrCode, items: ['On-site registration', 'Participant lookup', 'BIB collection tracking'] },
  { title: 'Race Control Center', icon: Radio, items: ['Live participant counts', 'Volunteer status', 'Emergency alerts'] },
  { title: 'Incident Management', icon: ShieldAlert, items: ['Medical incidents', 'Route issues', 'Escalation workflow'] },
  { title: 'Volunteer Scheduling', icon: Clock, items: ['Shift assignment', 'Attendance tracking', 'Role coverage'] },
  { title: 'Communication Center', icon: Megaphone, items: ['Email campaigns', 'WhatsApp broadcasts', 'Event reminders'] },
  { title: 'Reporting', icon: BarChart3, items: ['Participants', 'Volunteers', 'Completion and certificates'] },
  { title: 'Audit & Compliance', icon: History, items: ['Activity logs', 'Status history', 'Permission audit logs'] },
];

const teamStructure = [
  'Registration Coordinator',
  'Volunteer Coordinator',
  'Sponsor Coordinator',
  'Logistics Coordinator',
  'Marketing Coordinator',
  'Operations Coordinator',
];

const TABS = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'events', label: 'Events', icon: Trophy },
  { id: 'sponsors', label: 'Sponsors', icon: Award },
  { id: 'volunteers', label: 'Volunteers', icon: Users },
  // { id: 'team', label: 'Team', icon: ClipboardList },
  { id: 'communications', label: 'Communications', icon: Megaphone },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  // { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
  { id: 'audit', label: 'Audit', icon: History },
  { id: 'bulk', label: 'Bulk', icon: CheckSquare },
  { id: 'leaderboard', label: 'Leaderboard', icon: Medal },
];

const EVENT_SCOPED_TABS = ['sponsors', 'volunteers', 'team', 'communications', 'payments', 'whatsapp', 'audit', 'bulk', 'leaderboard'];

const toDatetimeLocal = (value) => {
  if (!value) return '';
  const d = new Date(value);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const paymentVariant = (status) => {
  if (status === 'SUCCESSFUL') return 'success';
  if (status === 'PENDING') return 'warning';
  if (status === 'FAILED') return 'danger';
  if (status === 'REFUNDED') return 'secondary';
  return 'secondary';
};

const formatMoney = (amount, currency = 'INR') => {
  if (amount === null || amount === undefined) return '';
  return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amount);
};

export default function OrganizerDashboard() {
  const { user, logout } = useAuth();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('overview');

  // ── Core data ──────────────────────────────────────────
  const [participants, setParticipants] = useState([]);
  const [stats, setStats] = useState({ totalRegistrations: 0, pendingApprovals: 0, finishers: 0, volunteers: 0 });
  const [events, setEvents] = useState([]);
  const [sponsors, setSponsors] = useState([]);
  const [volunteerAssignments, setVolunteerAssignments] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ── Search & Filter ────────────────────────────────────
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [distanceFilter, setDistanceFilter] = useState('ALL');

  // ── Modals ─────────────────────────────────────────────
  const [activeModal, setActiveModal] = useState(null);
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [bibInput, setBibInput] = useState('');
  const [timeInput, setTimeInput] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [volunteerSelectionMode, setVolunteerSelectionMode] = useState('new');
  const [availableVolunteers, setAvailableVolunteers] = useState([]);

  // ── Forms ──────────────────────────────────────────────
  const BLANK_EVENT_FORM = {
    id: '',
    name: '',
    description: '',
    date: '',
    registrationDeadline: '',
    location: '',
    eventStatus: 'DRAFT',
    distances: '5K,10K,21K,42K',
    isPaid: false,
    registrationFee: 0,
    currency: 'INR',
    tax: 0,
    convenienceFee: 0
  };
  const [eventForm, setEventForm] = useState(BLANK_EVENT_FORM);
  const [sponsorForm, setSponsorForm] = useState({ name: '', category: 'GOLD', website: '', description: '' });
  const [volunteerForm, setVolunteerForm] = useState({ userId: '', name: '', email: '', phone: '', volunteerRole: 'CHECK_IN' });
  const [teamForm, setTeamForm] = useState({ name: '', email: '', phone: '', permissions: ['VIEW_EVENT'] });

  // ── Payment Dashboard ──────────────────────────────────
  const [paymentData, setPaymentData] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);

  // ── CSV ────────────────────────────────────────────────
  const [csvType, setCsvType] = useState('participants');
  const [csvContent, setCsvContent] = useState('');
  const [csvImporting, setCsvImporting] = useState(false);
  const [csvResult, setCsvResult] = useState(null);
  const [csvJobs, setCsvJobs] = useState([]);
  const [exportFormat, setExportFormat] = useState('csv');
  const [exportType, setExportType] = useState('participants');
  const [selectedFileName, setSelectedFileName] = useState('');
  const fileInputRef = useRef(null);

  // ── WhatsApp ───────────────────────────────────────────
  const [whatsappGroups, setWhatsappGroups] = useState([]);
  const [waForm, setWaForm] = useState({ groupType: 'COMMUNITY', name: '', link: '', description: '' });
  const [waSaving, setWaSaving] = useState(false);

  // ── Audit Logs ─────────────────────────────────────────
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);

  // ── Bulk Actions ───────────────────────────────────────
  const [bulkAction, setBulkAction] = useState('approve');
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkResult, setBulkResult] = useState(null);
  const [selectedBulkIds, setSelectedBulkIds] = useState([]);
  const [startBibNumber, setStartBibNumber] = useState('1001');
  const [bulkNotifySubject, setBulkNotifySubject] = useState('Marathon announcement');
  const [bulkNotifyBody, setBulkNotifyBody] = useState('');
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [broadcastAudience, setBroadcastAudience] = useState('ALL_PARTICIPANTS');
  const [selectedEventId, setSelectedEventId] = useState('');
  const [commSearch, setCommSearch] = useState('');

  // Fetch admin dashboard data
  const fetchData = async () => {
    try {
      const [participantsRes, statsRes] = await Promise.all([
        api.get('/admin/participants'),
        api.get('/admin/stats')
      ]);
      setParticipants(participantsRes.data);
      setStats(statsRes.data);

      const [eventsRes, sponsorsRes, volunteersRes, teamRes, reportsRes] = await Promise.allSettled([
        api.get('/admin/events'),
        api.get('/admin/sponsors'),
        api.get('/admin/volunteers'),
        api.get('/admin/team-members'),
        api.get('/admin/reports')
      ]);

      if (eventsRes.status === 'fulfilled') setEvents(eventsRes.value.data);
      if (sponsorsRes.status === 'fulfilled') setSponsors(sponsorsRes.value.data);
      if (volunteersRes.status === 'fulfilled') setVolunteerAssignments(volunteersRes.value.data);
      if (teamRes.status === 'fulfilled') setTeamMembers(teamRes.value.data);
      if (reportsRes.status === 'fulfilled') setReports(reportsRes.value.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch organizer dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  // ── Fetch Payment Dashboard ────────────────────────────
  const fetchPaymentDashboard = async (eventId) => {
    if (!eventId) return;
    setPaymentLoading(true);
    try {
      const res = await api.get(`/payments/dashboard/${eventId}`);
      setPaymentData(res.data);
    } catch (err) {
      console.error('Payment dashboard error:', err);
    } finally {
      setPaymentLoading(false);
    }
  };

  // ── Fetch WhatsApp Groups ──────────────────────────────
  const fetchWhatsappGroups = async (eventId) => {
    if (!eventId) return;
    try {
      const res = await api.get(`/payments/whatsapp-groups/${eventId}`);
      setWhatsappGroups(res.data || []);
    } catch (err) { console.error('WhatsApp groups error:', err); }
  };

  // ── Fetch Audit Logs ───────────────────────────────────
  const fetchAuditLogs = async (eventId) => {
    if (!eventId) return;
    setAuditLoading(true);
    try {
      const res = await api.get(`/payments/audit-logs/${eventId}`);
      setAuditLogs(res.data || []);
    } catch (err) { console.error('Audit logs error:', err); }
    finally { setAuditLoading(false); }
  };

  // ── Fetch CSV Import Jobs ──────────────────────────────
  const fetchCsvJobs = async (eventId) => {
    if (!eventId) return;
    try {
      const res = await api.get(`/csv/import-jobs/${eventId}`);
      setCsvJobs(res.data?.imports || []);
    } catch (err) { console.error('CSV jobs error:', err); }
  };

  // ── Handle CSV File Upload ─────────────────────────────
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => setCsvContent(ev.target.result);
    reader.readAsText(file);
  };

  // ── Handle CSV Import Submit ───────────────────────────
  const handleCsvImport = async () => {
    if (!csvContent) return alert('Please upload or paste a CSV file first');
    if (!activeEventId) return alert('No event found. Create an event first.');
    setCsvImporting(true);
    setCsvResult(null);
    try {
      const res = await api.post(`/csv/import/${activeEventId}`, { type: csvType, csvContent });
      setCsvResult({ success: true, ...res.data });
      fetchCsvJobs(activeEventId);
    } catch (err) {
      setCsvResult({ success: false, error: err.response?.data?.error || 'Import failed' });
    } finally {
      setCsvImporting(false);
    }
  };

  const handleExport = () => {
    if (!activeEventId) return alert('No event found.');
    const url = `${API_BASE_URL}/csv/export/${activeEventId}?exportType=${exportType}&format=${exportFormat}`;
    const token = localStorage.getItem('mmp_token');
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.blob())
      .then((blob) => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${exportType}-export.${exportFormat}`;
        a.click();
      })
      .catch(() => alert('Export failed'));
  };

  const handleSampleDownload = (type) => {
    const token = localStorage.getItem('mmp_token');
    fetch(`${API_BASE_URL}/csv/sample/${type}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.blob())
      .then((blob) => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `sample-${type}.csv`;
        a.click();
      });
  };

  const handleSaveWhatsapp = async (e) => {
    e.preventDefault();
    if (!activeEventId) return alert('No event found.');
    setWaSaving(true);
    try {
      await api.post(`/payments/whatsapp-groups/${activeEventId}`, waForm);
      setWaForm({ groupType: 'COMMUNITY', name: '', link: '', description: '' });
      fetchWhatsappGroups(activeEventId);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save WhatsApp group');
    } finally {
      setWaSaving(false);
    }
  };

  const handleBulkAction = async () => {
    if (!activeEventId) return alert('No event found.');
    setBulkLoading(true);
    setBulkResult(null);
    try {
      let ids;
      if (bulkAction === 'bibs') {
        const unassigned = filteredParticipants.filter(p => !p.bib && !p.bibId);
        ids = selectedBulkIds.length > 0
          ? selectedBulkIds.filter(id => unassigned.some(u => u.id === id))
          : unassigned.map(p => p.id);
      } else {
        ids = selectedBulkIds.length > 0 ? selectedBulkIds : filteredParticipants.map((p) => p.id);
      }

      if (ids.length === 0) {
        throw new Error('No valid participants selected for this action.');
      }

      let res;
      if (bulkAction === 'approve') {
        res = await api.post('/registrations/bulk-approve', { ids });
      } else if (bulkAction === 'bibs') {
        res = await api.post('/registrations/bulk-assign-bibs', { ids, startBibNumber: parseInt(startBibNumber, 10) });
      } else if (bulkAction === 'notify') {
        const userIds = filteredParticipants
          .filter((p) => ids.includes(p.id))
          .map((p) => p.user?.id)
          .filter(Boolean);
        res = await api.post('/registrations/bulk-notify', {
          userIds,
          subject: bulkNotifySubject,
          body: bulkNotifyBody,
        });
      } else if (bulkAction === 'certs') {
        res = await api.post('/registrations/bulk-regenerate-certs', { ids });
      } else {
        throw new Error('Invalid action');
      }
      setBulkResult({ success: true, message: res.data?.message || 'Operation completed' });
      setSelectedBulkIds([]);
      fetchData();
    } catch (err) {
      setBulkResult({ success: false, message: err.response?.data?.error || err.message || 'Bulk action failed' });
    } finally {
      setBulkLoading(false);
    }
  };

  const handleAutoAssign = async () => {
    if (!activeEventId) return alert('No event found.');
    const unassigned = participants.filter((p) => p.eventId === activeEventId && !p.bib && !p.bibId);
    if (unassigned.length === 0) {
      alert('No unassigned participants to assign BIB numbers to.');
      return;
    }
    const ids = unassigned.map((p) => p.id);
    setBulkLoading(true);
    setBulkResult(null);
    try {
      const res = await api.post('/registrations/bulk-assign-bibs', {
        ids,
        startBibNumber: parseInt(startBibNumber, 10)
      });
      setBulkResult({ success: true, message: res.data?.message || 'Auto-assignment completed successfully!' });
      setSelectedBulkIds([]);
      fetchData();
    } catch (err) {
      setBulkResult({ success: false, message: err.response?.data?.error || 'Auto-assignment failed' });
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBroadcast = async () => {
    if (!activeEventId) return alert('Please select a marathon first.');
    if (!broadcastMsg.trim()) return alert('Broadcast message is required.');
    try {
      const res = await api.post(`/events/${activeEventId}/notifications/broadcast`, {
        audience: broadcastAudience,
        message: broadcastMsg.trim(),
        subject: 'Marathon update',
        channels: ['EMAIL'],
      });
      const failed = res.data.failed?.length || 0;
      alert(`Sent to ${res.data.sentCount} of ${res.data.recipientCount} recipients${failed ? ` (${failed} failed)` : ''}`);
      setBroadcastMsg('');
    } catch (err) {
      alert(err.response?.data?.error || 'Broadcast failed');
    }
  };

  const activeEventId = selectedEventId;
  const activeEvent = events.find((event) => event.id === activeEventId);
  const getEventRegistrationCount = (eventId) => participants.filter((participant) => participant.eventId === eventId).length;
  const activeEventParticipants = activeEventId ? participants.filter((participant) => participant.eventId === activeEventId) : [];
  const activeEventVolunteers = activeEventId ? volunteerAssignments.filter((assignment) => assignment.eventId === activeEventId || assignment.event?.id === activeEventId) : [];
  const activeEventStats = {
    totalRegistrations: activeEventParticipants.length,
    pendingApprovals: activeEventParticipants.filter((participant) => participant.status === 'REGISTERED').length,
    volunteers: activeEventVolunteers.length,
    finishers: activeEventParticipants.filter((participant) => participant.status === 'COMPLETED').length,
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const manageEventId = searchParams.get('eventId');
    if (!manageEventId || events.length === 0) return;
    const ev = events.find((e) => e.id === manageEventId);
    if (!ev) return;
    setSelectedEventId(ev.id);
    setEventForm({
      id: ev.id,
      name: ev.name || '',
      description: ev.description || '',
      date: toDatetimeLocal(ev.date),
      registrationDeadline: toDatetimeLocal(ev.registrationDeadline),
      location: ev.location || '',
      eventStatus: ev.eventStatus || 'DRAFT',
      distances: Array.isArray(ev.distances) ? ev.distances.join(',') : ev.distances || '',
      isPaid: ev.isPaid || false,
      registrationFee: ev.registrationFee || 0,
      currency: ev.currency || 'INR',
      tax: ev.tax || 0,
      convenienceFee: ev.convenienceFee || 0,
    });
    setActiveTab('events');
  }, [searchParams, events]);

  useEffect(() => {
    if (!activeEventId) return;
    if (activeTab === 'payments') fetchPaymentDashboard(activeEventId);
    if (activeTab === 'whatsapp') fetchWhatsappGroups(activeEventId);
    if (activeTab === 'audit') fetchAuditLogs(activeEventId);
    if (activeModal === 'CSV_IMPORT') fetchCsvJobs(activeEventId);
  }, [activeTab, activeModal, activeEventId]);

  useEffect(() => {
    if (volunteerSelectionMode === 'existing' && activeEventId && activeTab === 'volunteers') {
      const fetchAvailable = async () => {
        try {
          const res = await api.get('/admin/available-volunteers', {
            params: { eventId: activeEventId },
          });
          setAvailableVolunteers(res.data);
        } catch (err) {
          console.error('Failed to fetch available volunteers:', err);
        }
      };
      fetchAvailable();
    }
  }, [volunteerSelectionMode, activeEventId, activeTab]);

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
    setBibInput(typeof participant.bib === 'string' ? participant.bib : participant.bib?.bibNumber || '');
    setActiveModal('BIB');
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/events', {
        id: eventForm.id || undefined,
        name: eventForm.name,
        description: eventForm.description,
        date: eventForm.date,
        registrationDeadline: eventForm.registrationDeadline,
        location: eventForm.location,
        eventStatus: eventForm.eventStatus,
        distances: eventForm.distances.split(',').map((item) => item.trim()).filter(Boolean),
        isPaid: eventForm.isPaid,
        registrationFee: parseFloat(eventForm.registrationFee) || 0,
        currency: eventForm.currency,
        tax: parseFloat(eventForm.tax) || 0,
        convenienceFee: parseFloat(eventForm.convenienceFee) || 0,
      });
      fetchData();
      if (!eventForm.id) {
        setEventForm(BLANK_EVENT_FORM);
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save event');
    }
  };

  const handleCreateSponsor = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/sponsors', { ...sponsorForm, eventId: activeEventId });
      setSponsorForm({ name: '', category: 'GOLD', website: '', description: '' });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add sponsor');
    }
  };

  const handleAssignVolunteer = async (e) => {
    e.preventDefault();

    // Validate based on mode
    if (volunteerSelectionMode === 'existing' && !volunteerForm.userId) {
      return alert('Please select a volunteer from the list');
    }
    if (volunteerSelectionMode === 'new' && (!volunteerForm.name || !volunteerForm.email || !volunteerForm.phone)) {
      return alert('Please fill in all volunteer details');
    }

    try {
      // Only send userId if existing volunteer, otherwise send name/email/phone
      const payload = {
        eventId: activeEventId,
        volunteerRole: volunteerForm.volunteerRole
      };

      if (volunteerSelectionMode === 'existing') {
        payload.userId = volunteerForm.userId;
      } else {
        payload.name = volunteerForm.name;
        payload.email = volunteerForm.email;
        payload.phone = volunteerForm.phone;
      }

      await api.post('/admin/volunteers', payload);
      setVolunteerForm({ userId: '', name: '', email: '', phone: '', volunteerRole: 'CHECK_IN' });
      setVolunteerSelectionMode('new');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to assign volunteer');
    }
  };

  const handleCreateTeamMember = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/team-members', { ...teamForm, eventId: activeEventId });
      setTeamForm({ name: '', email: '', phone: '', permissions: ['VIEW_EVENT'] });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create team member');
    }
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
    if (!activeEventId || p.eventId !== activeEventId) return false;

    const bibNumber = typeof p.bib === 'string' ? p.bib : p.bib?.bibNumber;
    const matchesSearch = p.user.name.toLowerCase().includes(search.toLowerCase()) ||
      p.user.email.toLowerCase().includes(search.toLowerCase()) ||
      (bibNumber && bibNumber.toLowerCase().includes(search.toLowerCase()));

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
        <div className="flex items-center gap-3 shrink-0">
          <Button variant="glow" className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-1.5" onClick={() => setActiveModal('CSV_IMPORT')}>
            <Layers className="h-4 w-4" />
            <span>Import CSV</span>
          </Button>
          <Button variant="outline" className="flex items-center gap-1.5" onClick={() => setActiveModal('CSV_EXPORT')}>
            <span>Export Data</span>
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 p-4 text-sm text-red-650">
          <ShieldAlert className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── TAB NAVIGATION ───────────────────────────────── */}
      <div className="flex flex-wrap gap-1 border-b border-slate-200 dark:border-slate-800 pb-0">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-lg border-b-2 transition-all duration-200 ${activeTab === tab.id
                ? 'border-purple-600 text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/20'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {(EVENT_SCOPED_TABS.includes(activeTab) || activeTab === 'overview') && events.length > 0 && (
        <Card className="shadow-sm border-slate-200/60 dark:border-slate-800/40">
          <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <Label htmlFor="activeEvent" className="shrink-0 text-sm font-semibold text-slate-600 dark:text-slate-300">
              Selected marathon
            </Label>
            <Select
              id="activeEvent"
              className="sm:max-w-md"
              value={activeEventId || ''}
              onChange={(e) => setSelectedEventId(e.target.value)}
            >
              <option value="">Select a marathon</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>{ev.name}</option>
              ))}
            </Select>
          </CardContent>
        </Card>
      )}

      <OrganizerExtraTabs
        activeTab={activeTab}
        events={events}
        activeEventId={activeEventId}
        paymentData={paymentData}
        paymentLoading={paymentLoading}
        csvType={csvType}
        setCsvType={setCsvType}
        csvContent={csvContent}
        setCsvContent={setCsvContent}
        csvImporting={csvImporting}
        csvResult={csvResult}
        csvJobs={csvJobs}
        exportFormat={exportFormat}
        setExportFormat={setExportFormat}
        exportType={exportType}
        setExportType={setExportType}
        fileInputRef={fileInputRef}
        handleFileUpload={handleFileUpload}
        handleCsvImport={handleCsvImport}
        handleExport={handleExport}
        handleSampleDownload={handleSampleDownload}
        whatsappGroups={whatsappGroups}
        waForm={waForm}
        setWaForm={setWaForm}
        waSaving={waSaving}
        handleSaveWhatsapp={handleSaveWhatsapp}
        auditLogs={auditLogs}
        auditLoading={auditLoading}
        bulkAction={bulkAction}
        setBulkAction={setBulkAction}
        bulkLoading={bulkLoading}
        bulkResult={bulkResult}
        selectedBulkIds={selectedBulkIds}
        setSelectedBulkIds={setSelectedBulkIds}
        filteredParticipants={filteredParticipants}
        handleBulkAction={handleBulkAction}
        startBibNumber={startBibNumber}
        setStartBibNumber={setStartBibNumber}
        bulkNotifySubject={bulkNotifySubject}
        setBulkNotifySubject={setBulkNotifySubject}
        bulkNotifyBody={bulkNotifyBody}
        setBulkNotifyBody={setBulkNotifyBody}
        handleAutoAssign={handleAutoAssign}
        participants={participants}
        volunteerAssignments={volunteerAssignments}
      />

      {activeTab === 'leaderboard' && (
        <div className="mt-4">
          <Leaderboard events={events} defaultEventId={activeEventId} />
        </div>
      )}

      {activeTab === 'overview' && !activeEventId && (
        <Card className="shadow-md border-slate-200/60 dark:border-slate-800/40">
          <CardHeader>
            <CardTitle>Select Marathon To Manage</CardTitle>
            <CardDescription>
              Choose a marathon first. The entry ledger, bulk actions, volunteers, sponsors, payments, and reports will then show data only for that marathon.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {events.length > 0 ? events.map((event) => (
              <div key={event.id} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 text-left shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-base font-black text-slate-900 dark:text-white">{event.name}</div>
                    <div className="mt-1 text-sm text-slate-500">{event.location}</div>
                    <div className="mt-2 text-xs text-slate-400">
                      {new Date(event.date).toLocaleString()} · {getEventRegistrationCount(event.id)} registrations
                    </div>
                  </div>
                  <Badge variant={event.eventStatus === 'REGISTRATION_OPEN' ? 'success' : 'secondary'}>
                    {event.eventStatus?.replaceAll('_', ' ')}
                  </Badge>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Badge variant={event.isPaid ? 'warning' : 'success'}>
                    {event.isPaid ? `Paid ${formatMoney(event.registrationFee || 0, event.currency || 'INR')}` : 'Free'}
                  </Badge>
                  {event.isPaid && (
                    <span className="text-xs text-slate-500">
                      Payment statuses appear in the marathon ledger after you manage this event.
                    </span>
                  )}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {(event.distances || []).map((distance) => (
                    <Badge key={distance} variant="outline">{distance}</Badge>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="glow"
                  className="mt-4 w-full"
                  onClick={() => {
                    setSelectedEventId(event.id);
                    setEventForm({
                      id: event.id,
                      name: event.name || '',
                      description: event.description || '',
                      date: toDatetimeLocal(event.date),
                      registrationDeadline: toDatetimeLocal(event.registrationDeadline),
                      location: event.location || '',
                      eventStatus: event.eventStatus || 'DRAFT',
                      distances: Array.isArray(event.distances) ? event.distances.join(',') : '',
                      isPaid: event.isPaid || false,
                      registrationFee: event.registrationFee || 0,
                      currency: event.currency || 'INR',
                      tax: event.tax || 0,
                      convenienceFee: event.convenienceFee || 0,
                    });
                  }}
                >
                  Manage Marathon
                </Button>
              </div>
            )) : (
              <div className="md:col-span-2 rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
                No marathons found. Open the Events tab to create one.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'overview' && activeEventId && (
      <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-md border-slate-200/50 hover:shadow-purple-500/5 duration-300">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Registrations</div>
              <div className="text-3xl font-black text-slate-800 dark:text-white">{activeEventStats.totalRegistrations}</div>
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
              <div className="text-3xl font-black text-slate-800 dark:text-white">{activeEventStats.pendingApprovals}</div>
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
              <div className="text-3xl font-black text-slate-800 dark:text-white">{activeEventStats.volunteers}</div>
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
              <div className="text-3xl font-black text-slate-800 dark:text-white">{activeEventStats.finishers}</div>
            </div>
            <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-650 dark:text-emerald-400 flex items-center justify-center">
              <Award className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>
      {/* 
      <div className="grid grid-cols-1 xl:grid-cols-[1.25fr_0.75fr] gap-6">
        <Card className="shadow-md border-slate-200/60 dark:border-slate-800/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <UserCog className="h-5 w-5 text-purple-650" />
              Volunteer Role Operations
            </CardTitle>
            <CardDescription>
              Scanner access is applied automatically only for check-in, finish line, and registration desk roles.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {volunteerRoles.map((role) => {
              const Icon = role.icon;
              return (
                <div key={role.type} className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/30 p-4 text-left">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="h-9 w-9 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-850 dark:text-white">{role.label}</div>
                        <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{role.responsibilities}</p>
                      </div>
                    </div>
                    <Badge variant={role.canScan ? 'success' : 'secondary'} className="shrink-0">
                      {role.canScan ? 'Scanner' : 'No scanner'}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="shadow-md border-slate-200/60 dark:border-slate-800/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Radio className="h-5 w-5 text-purple-650" />
              Race Day Command Flow
            </CardTitle>
            <CardDescription>Operational chain from platform owner to participant support.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-left">
            {['Super Admin', 'Event Manager', 'Registration / Volunteer / Sponsor / Logistics / Medical / Security Teams', 'Participants'].map((step, index) => (
              <div key={step} className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-650 flex items-center justify-center text-xs font-black">
                  {index + 1}
                </div>
                <div className="text-sm font-semibold text-slate-750 dark:text-slate-200">{step}</div>
              </div>
            ))}
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
              <div className="text-xs font-black uppercase tracking-wide text-emerald-650">Scanning Workflow</div>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-350">
                Check-in scan updates BIB collection, finish scan records completion, organizer verifies time, and certificate generation follows.
              </p>
            </div>
          </CardContent>
        </Card>
      </div> */}

      {/* <Card className="shadow-md border-slate-200/60 dark:border-slate-800/40">
        <CardHeader>
          <CardTitle className="text-lg">Production Operations Modules</CardTitle>
          <CardDescription>Core modules needed to run a real marathon beyond participant registration.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {operationsModules.map((module) => {
            const Icon = module.icon;
            return (
              <div key={module.title} className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/30 p-4 text-left">
                <div className="flex items-center gap-2 text-sm font-black text-slate-850 dark:text-white">
                  <Icon className="h-4 w-4 text-purple-650" />
                  {module.title}
                </div>
                <div className="mt-3 space-y-2">
                  {module.items.map((item) => (
                    <div key={item} className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <Check className="h-3 w-3 text-emerald-550" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card> */}

      {/* <Card className="shadow-md border-slate-200/60 dark:border-slate-800/40">
        <CardHeader>
          <CardTitle className="text-lg">Team Member Permission Model</CardTitle>
          <CardDescription>Coordinators can be invited with module-level permissions for the assigned event.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 lg:grid-cols-[0.8fr_1.2fr] gap-6">
          <div className="space-y-2 text-left">
            {teamStructure.map((member) => (
              <div key={member} className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-800 px-3 py-2">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-250">{member}</span>
                <Badge variant="secondary">Team</Badge>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
            {[
              ['View Event', 'Read only'],
              ['Edit Event', 'Event management'],
              ['Manage Participants', 'Participant module'],
              ['Manage Volunteers', 'Volunteer module'],
              ['Manage Sponsors', 'Sponsor module'],
              ['Manage Tasks', 'Task board'],
              ['Reports', 'Analytics'],
            ].map(([permission, access]) => (
              <div key={permission} className="rounded-lg bg-white/70 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 p-3">
                <div className="text-sm font-bold text-slate-850 dark:text-white">{permission}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{access}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card> */}

      <Card className="shadow-md border-slate-200/60 dark:border-slate-800/40">
        <CardHeader>
          <CardTitle className="text-lg">Reports & Audit</CardTitle>
          <CardDescription>Registration, volunteer, sponsor, certificate, and audit summaries.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            ['Registrations', reports?.registrationStatus?.reduce((sum, item) => sum + item._count, 0) || stats.totalRegistrations],
            ['Volunteers', reports?.volunteerRoles?.reduce((sum, item) => sum + item._count, 0) || stats.volunteers],
            ['Sponsors', reports?.sponsorCategories?.reduce((sum, item) => sum + item._count, 0) || stats.sponsors || 0],
            ['Certificates', reports?.certificates || 0],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg border border-slate-200 dark:border-slate-800 p-4 text-left">
              <div className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</div>
              <div className="mt-2 text-2xl font-black text-slate-950 dark:text-white">{value}</div>
            </div>
          ))}
        </CardContent>
      </Card>

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
            {activeEvent?.name
              ? `Showing ${filteredParticipants.length} registrations for ${activeEvent.name}`
              : 'Select a marathon to view its registrations'}
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
                <TableHead>Payment</TableHead>
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
                      {(typeof participant.bib === 'string' ? participant.bib : participant.bib?.bibNumber) ? (
                        <div className="font-mono font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 border px-2 py-0.5 rounded-lg w-max shadow-sm">
                          <span>{typeof participant.bib === 'string' ? participant.bib : participant.bib?.bibNumber}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">Not Assigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {participant.event?.isPaid ? (
                        <div className="space-y-1">
                          <Badge variant={paymentVariant(participant.payments?.[0]?.status || 'PENDING')}>
                            {(participant.payments?.[0]?.status || 'PENDING').replaceAll('_', ' ')}
                          </Badge>
                          <div className="text-[11px] text-slate-500">
                            {formatMoney(participant.payments?.[0]?.amount ?? participant.event.registrationFee ?? 0, participant.payments?.[0]?.currency || participant.event.currency || 'INR')}
                          </div>
                        </div>
                      ) : (
                        <Badge variant="success">Free</Badge>
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
                  <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                    No registrations found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </TableContainer>
        </CardContent>
      </Card>
      </>
      )}

      {activeTab === 'events' && (
        <Card id="event-management" className="shadow-md border-slate-200/60 dark:border-slate-800/40">
          <CardHeader>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <CardTitle className="text-lg">
                  {eventForm.id ? '✏️ Edit event' : '🏆 Event management'}
                </CardTitle>
                <CardDescription>
                  {eventForm.id
                    ? 'Update this marathon’s details and save changes.'
                    : 'Create, publish, archive, and track marathon event lifecycle.'}
                </CardDescription>
              </div>
              {eventForm.id && (
                <Button 
                  type="button" 
                  variant="glow" 
                  size="sm"
                  onClick={() => setEventForm(BLANK_EVENT_FORM)}
                  className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 shrink-0 text-white"
                >
                  <Plus className="h-3.5 w-3.5" /> Create New Event
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleCreateEvent} className="grid grid-cols-1 md:grid-cols-2 gap-3 text-left">
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="eventName">Event Name</Label>
                <Input id="eventName" value={eventForm.name} onChange={(e) => setEventForm({ ...eventForm, name: e.target.value })} />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="eventDescription">Description</Label>
                <Input id="eventDescription" value={eventForm.description} onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="eventDate">Event Date</Label>
                <Input id="eventDate" type="datetime-local" value={eventForm.date} onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="registrationDeadline">Registration Close</Label>
                <Input id="registrationDeadline" type="datetime-local" value={eventForm.registrationDeadline} onChange={(e) => setEventForm({ ...eventForm, registrationDeadline: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="eventLocation">Location</Label>
                <Input id="eventLocation" value={eventForm.location} onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="eventStatus">Status</Label>
                <Select id="eventStatus" value={eventForm.eventStatus} onChange={(e) => setEventForm({ ...eventForm, eventStatus: e.target.value })}>
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="REGISTRATION_OPEN">Registration Open</option>
                  <option value="REGISTRATION_CLOSED">Registration Closed</option>
                  <option value="RACE_DAY">Race Day</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="ARCHIVED">Archived</option>
                </Select>
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="distances">Available Distances</Label>
                <Input id="distances" value={eventForm.distances} onChange={(e) => setEventForm({ ...eventForm, distances: e.target.value })} />
              </div>
              
              <div className="space-y-1.5 md:col-span-2 border-t pt-4 mt-2">
                <h4 className="text-sm font-bold text-slate-800 dark:text-white">Payment Configurations</h4>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="isPaid">Event Fee Type</Label>
                <Select id="isPaid" value={eventForm.isPaid ? 'true' : 'false'} onChange={(e) => setEventForm({ ...eventForm, isPaid: e.target.value === 'true' })}>
                  <option value="false">Free Event</option>
                  <option value="true">Paid Event</option>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="currency">Currency</Label>
                <Select id="currency" disabled={!eventForm.isPaid} value={eventForm.currency} onChange={(e) => setEventForm({ ...eventForm, currency: e.target.value })}>
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </Select>
              </div>
              {eventForm.isPaid && (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="registrationFee">Registration Fee</Label>
                    <Input id="registrationFee" type="number" min="0" step="0.01" value={eventForm.registrationFee} onChange={(e) => setEventForm({ ...eventForm, registrationFee: parseFloat(e.target.value) || 0 })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="tax">Tax Amount</Label>
                    <Input id="tax" type="number" min="0" step="0.01" value={eventForm.tax} onChange={(e) => setEventForm({ ...eventForm, tax: parseFloat(e.target.value) || 0 })} />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <Label htmlFor="convenienceFee">Convenience Fee</Label>
                    <Input id="convenienceFee" type="number" min="0" step="0.01" value={eventForm.convenienceFee} onChange={(e) => setEventForm({ ...eventForm, convenienceFee: parseFloat(e.target.value) || 0 })} />
                  </div>
                </>
              )}
              <Button type="submit" variant="glow" className="md:col-span-2">
                {eventForm.id ? 'Update Save' : 'Create New Event'}
              </Button>
            </form>
            <div className="space-y-2">
              {events.map((event) => (
                <div key={event.id} className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 dark:border-slate-800 px-3 py-2 text-left">
                  <div>
                    <div className="text-sm font-bold text-slate-850 dark:text-white">{event.name}</div>
                    <div className="text-xs text-slate-500">{event.location}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={event.eventStatus === 'REGISTRATION_OPEN' ? 'success' : 'secondary'}>{event.eventStatus.replaceAll('_', ' ')}</Badge>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedEventId(event.id);
                        setEventForm({
                          id: event.id,
                          name: event.name || '',
                          description: event.description || '',
                          date: toDatetimeLocal(event.date),
                          registrationDeadline: toDatetimeLocal(event.registrationDeadline),
                          location: event.location || '',
                          eventStatus: event.eventStatus || 'DRAFT',
                          distances: Array.isArray(event.distances) ? event.distances.join(',') : '',
                          isPaid: event.isPaid || false,
                          registrationFee: event.registrationFee || 0,
                          currency: event.currency || 'INR',
                          tax: event.tax || 0,
                          convenienceFee: event.convenienceFee || 0,
                        });
                        document.getElementById('event-management')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                    >
                      Manage
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'sponsors' && (
        <Card className="shadow-md border-slate-200/60 dark:border-slate-800/40">
          <CardHeader>
            <CardTitle className="text-lg">Sponsor Management</CardTitle>
            <CardDescription>Add sponsors and group them by category on event pages.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!activeEventId ? (
              <p className="text-sm text-slate-500">Create an event first, then add sponsors.</p>
            ) : (
              <>
                <form onSubmit={handleCreateSponsor} className="grid grid-cols-1 md:grid-cols-2 gap-3 text-left">
                  <Input placeholder="Sponsor name" value={sponsorForm.name} onChange={(e) => setSponsorForm({ ...sponsorForm, name: e.target.value })} required />
                  <Select value={sponsorForm.category} onChange={(e) => setSponsorForm({ ...sponsorForm, category: e.target.value })}>
                    <option value="TITLE">Title</option>
                    <option value="PLATINUM">Platinum</option>
                    <option value="GOLD">Gold</option>
                    <option value="SILVER">Silver</option>
                    <option value="BRONZE">Bronze</option>
                  </Select>
                  <Input placeholder="Website URL" value={sponsorForm.website} onChange={(e) => setSponsorForm({ ...sponsorForm, website: e.target.value })} />
                  <Input placeholder="Description" value={sponsorForm.description} onChange={(e) => setSponsorForm({ ...sponsorForm, description: e.target.value })} />
                  <Button type="submit" variant="glow" className="md:col-span-2">Add Sponsor</Button>
                </form>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {sponsors.filter((s) => (s.eventId || s.event?.id) === activeEventId).map((sponsor) => (
                    <div key={sponsor.id} className="rounded-lg border border-slate-200 dark:border-slate-800 p-3 text-left">
                      <div className="text-sm font-bold text-slate-850 dark:text-white">{sponsor.name}</div>
                      <div className="text-xs text-slate-500">{sponsor.category} - {sponsor.event?.name}</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'volunteers' && (
        <Card className="shadow-md border-slate-200/60 dark:border-slate-800/40">
          <CardHeader>
            <CardTitle className="text-lg">Volunteer Assignment</CardTitle>
            <CardDescription>Assign event roles and scanner permissions automatically.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!activeEventId ? (
              <p className="text-sm text-slate-500">Create an event first, then assign volunteers.</p>
            ) : (
              <>
                <div className="flex gap-2 mb-4">
                  <button
                    type="button"
                    onClick={() => setVolunteerSelectionMode('new')}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${volunteerSelectionMode === 'new'
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                  >
                    New Volunteer
                  </button>
                  <button
                    type="button"
                    onClick={() => setVolunteerSelectionMode('existing')}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${volunteerSelectionMode === 'existing'
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                  >
                    Select Present Volunteer
                  </button>
                </div>
                <form onSubmit={handleAssignVolunteer} className="grid grid-cols-1 md:grid-cols-2 gap-3 text-left">
                  {volunteerSelectionMode === 'new' ? (
                    <>
                      <Input placeholder="Full name" value={volunteerForm.name} onChange={(e) => setVolunteerForm({ ...volunteerForm, name: e.target.value })} />
                      <Input placeholder="Email" type="email" value={volunteerForm.email} onChange={(e) => setVolunteerForm({ ...volunteerForm, email: e.target.value })} />
                      <Input placeholder="Phone" value={volunteerForm.phone} onChange={(e) => setVolunteerForm({ ...volunteerForm, phone: e.target.value })} />
                    </>
                  ) : (
                    <>
                      <Select
                        value={volunteerForm.userId}
                        onChange={(e) => {
                          const selected = availableVolunteers.find((v) => v.id === e.target.value);
                          if (selected) {
                            setVolunteerForm({
                              userId: selected.id,
                              name: selected.name,
                              email: selected.email,
                              phone: selected.phone,
                              volunteerRole: volunteerForm.volunteerRole,
                            });
                          } else {
                            setVolunteerForm({ userId: '', name: '', email: '', phone: '', volunteerRole: volunteerForm.volunteerRole });
                          }
                        }}
                      >
                        <option value="">-- Select a volunteer --</option>
                        {availableVolunteers.map((volunteer) => (
                          <option key={volunteer.id} value={volunteer.id}>
                            {volunteer.name} ({volunteer.email})
                          </option>
                        ))}
                      </Select>
                      {volunteerForm.userId && (
                        <>
                          <Input placeholder="Name" value={volunteerForm.name} disabled className="bg-slate-100 dark:bg-slate-900" />
                          <Input placeholder="Email" value={volunteerForm.email} disabled className="bg-slate-100 dark:bg-slate-900" />
                          <Input placeholder="Phone" value={volunteerForm.phone} disabled className="bg-slate-100 dark:bg-slate-900" />
                        </>
                      )}
                    </>
                  )}
                  <Select value={volunteerForm.volunteerRole} onChange={(e) => setVolunteerForm({ ...volunteerForm, volunteerRole: e.target.value })}>
                    {volunteerRoles.map((role) => <option key={role.type} value={role.type}>{role.label}</option>)}
                  </Select>
                  <Button type="submit" variant="glow" className="md:col-span-2">Assign Volunteer</Button>
                </form>
                <div className="space-y-2">
                  {volunteerAssignments.filter((a) => (a.eventId || a.event?.id) === activeEventId).map((assignment) => (
                    <div key={assignment.id} className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-800 px-3 py-2 text-left">
                      <div>
                        <div className="text-sm font-bold text-slate-850 dark:text-white">{assignment.user?.name}</div>
                        <div className="text-xs text-slate-500">{assignment.volunteerRole.replaceAll('_', ' ')}</div>
                      </div>
                      <Badge variant={assignment.canScan ? 'success' : 'secondary'}>{assignment.canScan ? 'Scanner' : 'No scanner'}</Badge>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'team' && (
        <Card className="shadow-md border-slate-200/60 dark:border-slate-800/40">
          <CardHeader>
            <CardTitle className="text-lg">Team Management</CardTitle>
            <CardDescription>Create team members with permission-based module access.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!activeEventId ? (
              <p className="text-sm text-slate-500">Create an event first, then add team members.</p>
            ) : (
              <>
                <form onSubmit={handleCreateTeamMember} className="grid grid-cols-1 md:grid-cols-2 gap-3 text-left">
                  <Input placeholder="Full name" value={teamForm.name} onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })} required />
                  <Input placeholder="Email" type="email" value={teamForm.email} onChange={(e) => setTeamForm({ ...teamForm, email: e.target.value })} required />
                  <Input placeholder="Phone" value={teamForm.phone} onChange={(e) => setTeamForm({ ...teamForm, phone: e.target.value })} required />
                  <Select value={teamForm.permissions[0]} onChange={(e) => setTeamForm({ ...teamForm, permissions: [e.target.value] })}>
                    <option value="VIEW_EVENT">View Event</option>
                    <option value="EDIT_EVENT">Edit Event</option>
                    <option value="MANAGE_PARTICIPANTS">Manage Participants</option>
                    <option value="MANAGE_VOLUNTEERS">Manage Volunteers</option>
                    <option value="MANAGE_SPONSORS">Manage Sponsors</option>
                    <option value="MANAGE_TASKS">Manage Tasks</option>
                    <option value="VIEW_REPORTS">View Reports</option>
                  </Select>
                  <Button type="submit" variant="glow" className="md:col-span-2">Create Team Member</Button>
                </form>
                <div className="space-y-2">
                  {teamMembers.filter((m) => (m.eventId || m.event?.id) === activeEventId).map((member) => (
                    <div key={member.id} className="rounded-lg border border-slate-200 dark:border-slate-800 px-3 py-2 text-left">
                      <div className="text-sm font-bold text-slate-850 dark:text-white">{member.user?.name}</div>
                      <div className="text-xs text-slate-500">{member.permissions?.join(', ')}</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'communications' && (() => {
        // Resolve current audience users in the frontend
        const recipients = (() => {
          if (!activeEventId) return [];
          if (broadcastAudience === 'ALL_PARTICIPANTS') {
            return participants.filter(p => p.eventId === activeEventId).map(p => ({
              id: p.id,
              name: p.user?.name || 'Unknown',
              email: p.user?.email || '',
              phone: p.user?.phone || '',
              status: p.status
            }));
          }
          if (broadcastAudience === 'APPROVED_PARTICIPANTS') {
            return participants
              .filter(p => p.eventId === activeEventId && ['APPROVED', 'CONFIRMED', 'BIB_COLLECTED', 'COMPLETED'].includes(p.status))
              .map(p => ({
                id: p.id,
                name: p.user?.name || 'Unknown',
                email: p.user?.email || '',
                phone: p.user?.phone || '',
                status: p.status
              }));
          }
          if (broadcastAudience === 'ALL_VOLUNTEERS') {
            return volunteerAssignments
              .filter(a => a.eventId === activeEventId)
              .map(a => ({
                id: a.id,
                name: a.user?.name || 'Unknown',
                email: a.user?.email || '',
                phone: a.user?.phone || '',
                status: a.volunteerRole || 'Volunteer'
              }));
          }
          return [];
        })();

        const filteredRecipients = recipients.filter(r => 
          r.name.toLowerCase().includes(commSearch.toLowerCase()) ||
          r.email.toLowerCase().includes(commSearch.toLowerCase()) ||
          r.phone.includes(commSearch)
        );

        const handleSendWhatsApp = (recipient) => {
          if (!recipient.phone) {
            alert('This user does not have a phone number registered.');
            return;
          }
          if (!broadcastMsg) {
            alert('Please enter a message in the text area above to pre-fill the WhatsApp chat.');
            return;
          }
          const cleaned = recipient.phone.replace(/[^0-9]/g, '');
          const waPhone = cleaned.length === 10 ? '91' + cleaned : cleaned;
          const url = `https://api.whatsapp.com/send?phone=${waPhone}&text=${encodeURIComponent(broadcastMsg)}`;
          window.open(url, '_blank');
        };

        return (
          <Card className="shadow-md border-slate-200/60 dark:border-slate-800/40">
            <CardHeader className="text-left">
              <CardTitle className="text-lg flex items-center gap-2">
                <Megaphone className="h-5 w-5 text-brand-primary" />
                Communication center
              </CardTitle>
              <CardDescription>Broadcast email campaign or launch individual WhatsApp messages to your audience.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!activeEventId ? (
                <p className="text-sm text-slate-500 text-left">Create an event first to send broadcasts.</p>
              ) : (
                <>
                  <div className="flex flex-col sm:flex-row gap-3 text-left">
                    <div className="flex-grow">
                      <Label htmlFor="commAudience" className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 block">Audience Group</Label>
                      <Select id="commAudience" value={broadcastAudience} onChange={(e) => setBroadcastAudience(e.target.value)} className="w-full">
                        <option value="ALL_PARTICIPANTS">All participants</option>
                        <option value="APPROVED_PARTICIPANTS">Approved participants</option>
                        <option value="ALL_VOLUNTEERS">All volunteers</option>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-1.5 text-left">
                    <Label htmlFor="commMessage" className="text-xs font-bold uppercase tracking-wider text-slate-500">Broadcast Message</Label>
                    <textarea
                      id="commMessage"
                      className="w-full min-h-[100px] rounded-xl border border-slate-200 p-3 text-sm focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                      placeholder="Type your message here. This will be sent as email broadcast, or pre-filled in WhatsApp chats below…"
                      value={broadcastMsg}
                      onChange={(e) => setBroadcastMsg(e.target.value)}
                    />
                  </div>

                  <div className="flex gap-2 text-left">
                    <Button variant="glow" onClick={handleBroadcast}>Send email broadcast</Button>
                  </div>

                  {/* Recipient WhatsApp directory */}
                  <div className="border-t border-slate-200 dark:border-slate-800 pt-5 mt-2 space-y-3 text-left">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-bold text-slate-800 dark:text-white">Direct WhatsApp Messenger ({filteredRecipients.length} matching)</h4>
                        <p className="text-xs text-slate-400">Pre-fills the message entered above in WhatsApp Web/App</p>
                      </div>
                      <div className="w-full sm:w-64">
                        <Input
                          placeholder="Search recipients by name, email..."
                          value={commSearch}
                          onChange={(e) => setCommSearch(e.target.value)}
                          className="text-xs py-1"
                        />
                      </div>
                    </div>

                    <div className="max-h-60 overflow-auto border rounded-xl divide-y text-xs">
                      {filteredRecipients.map((rec) => (
                        <div key={rec.id} className="flex flex-wrap items-center justify-between gap-2 p-3 hover:bg-slate-50 dark:hover:bg-slate-900/30">
                          <div>
                            <div className="font-bold text-slate-850 dark:text-white">{rec.name}</div>
                            <div className="text-slate-500 text-[10px]">{rec.email} {rec.phone ? `| ${rec.phone}` : ''}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-[10px]">{rec.status.replaceAll('_', ' ')}</Badge>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => handleSendWhatsApp(rec)}
                              className="text-[10px] px-2 py-1 h-7 border-green-500/30 text-green-600 hover:bg-green-50/50 flex items-center gap-1"
                              disabled={!rec.phone}
                            >
                              <MessageCircle className="h-3.5 w-3.5" />
                              <span>Send WhatsApp</span>
                            </Button>
                          </div>
                        </div>
                      ))}
                      {filteredRecipients.length === 0 && (
                        <div className="p-8 text-center text-slate-400">
                          No matching recipients with phone numbers found for this audience.
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        );
      })()}

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

      {/* 3. CSV Import Modal */}
      {activeModal === 'CSV_IMPORT' && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 px-4">
          <Card className="w-full max-w-lg shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Layers className="h-5 w-5 text-purple-650" />
                  Direct CSV File Import
                </CardTitle>
                <CardDescription>Upload participant, volunteer, timing, or sponsor records directly.</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setActiveModal(null);
                  setSelectedFileName('');
                  setCsvContent('');
                  setCsvResult(null);
                }}
                className="h-8 w-8 rounded-full border"
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4 pt-4 text-left">
              <div className="space-y-1.5">
                <Label htmlFor="csvImportType">Data Type</Label>
                <Select
                  id="csvImportType"
                  value={csvType}
                  onChange={(e) => setCsvType(e.target.value)}
                >
                  <option value="participants">Participants</option>
                  <option value="volunteers">Volunteers</option>
                  <option value="results">Finish times</option>
                  <option value="sponsors">Sponsors</option>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>CSV File</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                
                {selectedFileName ? (
                  <div className="flex items-center justify-between rounded-xl border border-emerald-250 bg-emerald-500/5 p-4">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-green-100 dark:bg-green-950 text-green-600 flex items-center justify-center">
                        <Check className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">{selectedFileName}</div>
                        <p className="text-xs text-slate-400">CSV text file loaded</p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs border hover:bg-slate-100"
                    >
                      Change
                    </Button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-250 hover:border-purple-500 hover:bg-purple-500/5 rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 group"
                  >
                    <Layers className="h-8 w-8 text-slate-400 group-hover:text-purple-650 transition-colors" />
                    <div className="text-sm font-bold text-slate-700 dark:text-slate-300">Click to upload .csv file</div>
                    <p className="text-xs text-slate-450">Excel CSV files up to 10MB supported</p>
                  </div>
                )}
              </div>

              {csvResult && (
                <div className={`rounded-xl p-3.5 text-sm border ${
                  csvResult.success 
                    ? 'bg-emerald-500/5 border-emerald-500/20 text-green-650 dark:text-emerald-400' 
                    : 'bg-red-500/5 border-red-500/20 text-red-650 dark:text-red-400'
                }`}>
                  <div className="font-semibold">{csvResult.success ? 'Import Completed Successfully' : 'Import Failed'}</div>
                  <div className="text-xs mt-1 leading-relaxed">{csvResult.success ? csvResult.message || 'Records processed.' : csvResult.error}</div>
                </div>
              )}

              {csvJobs?.length > 0 && (
                <div className="space-y-2 border-t pt-4">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <History className="h-3.5 w-3.5" />
                    Recent Import History
                  </div>
                  <div className="max-h-28 overflow-auto space-y-1.5 pr-1 divide-y divide-slate-100 dark:divide-slate-900">
                    {csvJobs.slice(0, 4).map((job) => (
                      <div key={job.id} className="flex justify-between items-center text-xs py-1.5">
                        <div>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">{job.importType}</span>
                          <span className="text-[10px] text-slate-400 ml-1.5 font-mono">{new Date(job.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={job.status === 'COMPLETED' ? 'success' : job.status === 'PROCESSING' ? 'warning' : 'danger'}>
                            {job.status}
                          </Badge>
                          <span className="font-mono text-slate-400">({job.processedRows}/{job.totalRows})</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between items-center border-t pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSampleDownload(csvType)}
                className="text-xs"
              >
                Download Sample
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => {
                  setActiveModal(null);
                  setSelectedFileName('');
                  setCsvContent('');
                  setCsvResult(null);
                }}>Close</Button>
                <Button
                  variant="glow"
                  onClick={handleCsvImport}
                  disabled={csvImporting || !csvContent}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {csvImporting ? 'Processing...' : 'Run Import'}
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      )}

      {/* 4. CSV Export Modal */}
      {activeModal === 'CSV_EXPORT' && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 px-4">
          <Card className="w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Layers className="h-5 w-5 text-purple-650" />
                  Export Event Data
                </CardTitle>
                <CardDescription>Download event records in CSV or Excel spreadsheet format.</CardDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setActiveModal(null)} className="h-8 w-8 rounded-full border">
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4 pt-4 text-left">
              <div className="space-y-1.5">
                <Label htmlFor="csvExportType">Export Data Set</Label>
                <Select
                  id="csvExportType"
                  value={exportType}
                  onChange={(e) => setExportType(e.target.value)}
                >
                  <option value="participants">Participants List</option>
                  <option value="volunteers">Volunteers Roster</option>
                  <option value="registrations">Registrations & Payments</option>
                  <option value="sponsors">Sponsors Ledger</option>
                  <option value="tasks">Tasks Kanban Ledger</option>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="csvExportFormat">File Format</Label>
                <Select
                  id="csvExportFormat"
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value)}
                >
                  <option value="csv">Comma Separated Values (.csv)</option>
                  <option value="xlsx">Microsoft Excel (.xlsx)</option>
                </Select>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2 border-t pt-4">
              <Button type="button" variant="outline" onClick={() => setActiveModal(null)}>Cancel</Button>
              <Button
                type="button"
                variant="glow"
                className="bg-purple-600 hover:bg-purple-700"
                onClick={() => {
                  handleExport();
                  setActiveModal(null);
                }}
              >
                Download Export
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}

    </div>
  );
}
