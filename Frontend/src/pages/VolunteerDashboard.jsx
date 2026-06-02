import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import QRScanner from '../components/QRScanner';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, TableContainer, TableHeader, TableBody, TableRow, TableHead, TableCell, Select, Label, Input } from '../components/ui';
import { QrCode, ClipboardList, CheckCircle, ShieldAlert, Camera, X, Play, HeartPulse, Droplets, PackageCheck, Map, ShieldCheck, Flag, PhoneCall, FileWarning } from 'lucide-react';

const roleDashboards = {
  CHECK_IN: {
    label: 'Check-In Volunteer',
    scannerLabel: 'Participant Check-In Scanner',
    canScan: true,
    icon: QrCode,
    panels: ['Assigned Event', 'Participant Check-In Queue', 'QR Scanner', 'Recent Scans', 'Assigned Tasks'],
  },
  FINISH_LINE: {
    label: 'Finish Line Volunteer',
    scannerLabel: 'Finish Scanner',
    canScan: true,
    icon: Flag,
    panels: ['Assigned Event', 'Finish Scanner', 'Recent Finishers', 'Assigned Tasks'],
  },
  REGISTRATION_DESK: {
    label: 'Registration Desk Volunteer',
    scannerLabel: 'Registration Verification Scanner',
    canScan: true,
    icon: ClipboardList,
    panels: ['Assigned Event', 'Registration Verification', 'QR Scanner', 'Assigned Tasks'],
  },
  MEDICAL: {
    label: 'Medical Volunteer',
    canScan: false,
    icon: HeartPulse,
    panels: ['Assigned Event', 'Medical Tasks', 'Emergency Contacts', 'Incident Reporting'],
  },
  WATER_STATION: {
    label: 'Water Station Volunteer',
    canScan: false,
    icon: Droplets,
    panels: ['Assigned Event', 'Water Point Assignment', 'Supply Checklist', 'Assigned Tasks'],
  },
  ROUTE_MARSHAL: {
    label: 'Route Marshal',
    canScan: false,
    icon: Map,
    panels: ['Assigned Event', 'Route Flow', 'Participant Guidance', 'Assigned Tasks'],
  },
  SECURITY: {
    label: 'Security Volunteer',
    canScan: false,
    icon: ShieldCheck,
    panels: ['Assigned Event', 'Crowd Control Posts', 'Security Tasks', 'Incident Reporting'],
  },
  LOGISTICS: {
    label: 'Logistics Volunteer',
    canScan: false,
    icon: PackageCheck,
    panels: ['Assigned Event', 'Equipment Checklist', 'Operational Tasks', 'Status Updates'],
  },
  END_OF_TRACK: {
    label: 'End-of-Track Volunteer',
    canScan: false,
    icon: CheckCircle,
    panels: ['Assigned Event', 'Participant Recovery', 'Exit Flow', 'Assigned Tasks'],
  },
};

export default function VolunteerDashboard() {
  const { user, logout } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [scanLogs, setScanLogs] = useState([]);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const assignedRole = user?.volunteerRole || user?.roleType || user?.assignment?.volunteerRole || 'CHECK_IN';
  const [previewRole, setPreviewRole] = useState(assignedRole);
  const activeRoleKey = user?.role === 'ORGANIZER' || user?.role === 'EVENT_MANAGER' || user?.role === 'SUPER_ADMIN' ? previewRole : assignedRole;
  const activeRole = roleDashboards[activeRoleKey] || roleDashboards.CHECK_IN;
  const ActiveRoleIcon = activeRole.icon;
  
  // Scanner toggle and result state
  const [showScanner, setShowScanner] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [scanError, setScanError] = useState('');
  const [scannerLoading, setScannerLoading] = useState(false);
  const [manualBibInput, setManualBibInput] = useState('');

  // Fetch volunteer assignments & scan log feeds
  const fetchVolunteerData = async () => {
    try {
      const [tasksRes, logsRes, eventsRes] = await Promise.all([
        api.get('/tasks'),
        api.get('/volunteer/scan-logs'),
        api.get('/volunteer/my-events').catch(() => ({ data: { current: null } })),
      ]);

      // Filter tasks assigned to this specific volunteer
      const myTasks = tasksRes.data.filter(task => 
        task.assignments.some(assignment => assignment.userId === user.id)
      );

      setTasks(myTasks);
      setScanLogs(logsRes.data);
      setCurrentEvent(eventsRes.data?.current?.event || null);
    } catch (err) {
      console.error(err);
      setError('Failed to load volunteer tasks or scanner data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVolunteerData();
  }, [user]);

  // Handle checking a task (marks it DONE or TODO)
  const handleToggleTask = async (task) => {
    const nextStatus = task.status === 'DONE' ? 'TODO' : 'DONE';
    try {
      await api.put(`/tasks/${task.id}`, { status: nextStatus });
      fetchVolunteerData();
    } catch (err) {
      alert('Failed to update task status');
    }
  };

  // Handle successful QR scan
  const handleScanSuccess = async (qrData) => {
    // Prevent duplicate triggers
    if (scannerLoading) return;
    
    setScannerLoading(true);
    setScanError('');
    setScanResult(null);

    try {
      const response = await api.post('/volunteer/scan', { qrData });
      setScanResult(response.data);
      setShowScanner(false); // Close scanner on successful hit
      fetchVolunteerData(); // Reload scan logs
    } catch (err) {
      setScanError(err.response?.data?.error || 'Failed to process scanned QR code. Verify the BIB card is valid.');
    } finally {
      setScannerLoading(false);
    }
  };

  const handleManualBibSubmit = async (e) => {
    e.preventDefault();
    if (!manualBibInput) return;

    setScannerLoading(true);
    setScanError('');
    setScanResult(null);

    try {
      const response = await api.post('/volunteer/scan', { bibNumber: manualBibInput });
      setScanResult(response.data);
      setManualBibInput('');
      fetchVolunteerData();
    } catch (err) {
      setScanError(err.response?.data?.error || 'Failed to check-in participant by BIB number. Verify the BIB exists.');
    } finally {
      setScannerLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
        <p className="mt-4 text-sm text-slate-500">Loading volunteer portal...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Volunteer Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white m-0 tracking-tight flex items-center gap-2">
            <ActiveRoleIcon className="h-8 w-8 text-purple-650" />
            {activeRole.label}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Welcome, <span className="font-semibold text-purple-650">{user?.name}</span>. Your dashboard is shaped by your race-day assignment.
          </p>
        </div>

      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 p-4 text-sm text-red-650">
          <ShieldAlert className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {(user?.role === 'ORGANIZER' || user?.role === 'EVENT_MANAGER' || user?.role === 'SUPER_ADMIN') && (
        <Card className="shadow-sm border-slate-200/60 dark:border-slate-800/40">
          <CardContent className="p-4 flex flex-col md:flex-row md:items-end gap-4 text-left">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="rolePreview">Organizer Role Preview</Label>
              <Select id="rolePreview" value={previewRole} onChange={(e) => setPreviewRole(e.target.value)}>
                {Object.entries(roleDashboards).map(([key, role]) => (
                  <option key={key} value={key}>{role.label}</option>
                ))}
              </Select>
            </div>
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 px-4 py-3 text-sm text-slate-600 dark:text-slate-350">
              Scanner permission: <span className="font-black text-slate-900 dark:text-white">{activeRole.canScan ? 'Granted' : 'Blocked'}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        {activeRole.panels.map((panel) => (
          <div key={panel} className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 text-left shadow-sm">
            <div className="text-xs font-black uppercase tracking-wide text-purple-650">{panel}</div>
            <div className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              {panel === 'Assigned Event'
                ? (currentEvent?.name || 'No event assigned yet')
                : 'Ready for race-day operations'}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Assigned Tasks & Scan History (Left 2 cols) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* ASSIGNED TASKS */}
          <Card className="shadow-lg border-slate-200/60 dark:border-slate-800/40">
            <CardHeader>
              <CardTitle className="text-lg">My Assigned Event Tasks</CardTitle>
              <CardDescription>Check off items as you complete them during the event</CardDescription>
            </CardHeader>
            <CardContent>
              {tasks.length > 0 ? (
                <div className="space-y-3">
                  {tasks.map((task) => (
                    <div 
                      key={task.id} 
                      onClick={() => handleToggleTask(task)}
                      className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-300 cursor-pointer ${
                        task.status === 'DONE' 
                          ? 'border-green-500/20 bg-green-500/5 text-slate-400' 
                          : 'border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/30 hover:border-purple-500/30 text-slate-700 dark:text-slate-250'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                          task.status === 'DONE' ? 'border-green-500 bg-green-500 text-white' : 'border-slate-300'
                        }`}>
                          {task.status === 'DONE' && <Check className="h-3 w-3" />}
                        </div>
                        <div>
                          <div className={`text-sm font-semibold ${task.status === 'DONE' ? 'line-through' : ''}`}>
                            {task.title}
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5">{task.category}</div>
                        </div>
                      </div>
                      <Badge variant={task.status === 'DONE' ? 'success' : 'warning'}>
                        {task.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500 border border-dashed rounded-xl text-sm">
                  No event tasks currently assigned to you. Contact the race organizer.
                </div>
              )}
            </CardContent>
          </Card>

          {/* HISTORICAL SCAN LOGS */}
          {activeRole.canScan ? (
          <Card className="shadow-md border-slate-200/60 dark:border-slate-800/40 overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Recent Checkin Scan Logs</CardTitle>
              <CardDescription>Audit feed of participant BIB scans at checkpoints</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <TableContainer>
                <TableHeader>
                  <TableRow>
                    <TableHead>BIB Code</TableHead>
                    <TableHead>Scan Type</TableHead>
                    <TableHead>Scanned By</TableHead>
                    <TableHead>Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scanLogs.length > 0 ? (
                    scanLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-mono font-bold text-slate-800 dark:text-slate-100">{log.bib}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              log.scanType === 'BIB_COLLECTION' ? 'success' :
                              log.scanType === 'FINISH_LINE' ? 'default' : 'secondary'
                            }
                          >
                            {log.scanType.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">{log.scannedBy}</TableCell>
                        <TableCell className="text-xs text-slate-400 font-mono">
                          {new Date(log.scannedAt).toLocaleTimeString()}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-slate-500 text-xs">
                        No recent scans logged.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </TableContainer>
            </CardContent>
          </Card>
          ) : (
            <Card className="shadow-md border-slate-200/60 dark:border-slate-800/40">
              <CardHeader>
                <CardTitle className="text-lg">Operational Workspace</CardTitle>
                <CardDescription>{activeRole.label} tools without QR scanner access</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-850 dark:text-white">
                    <PhoneCall className="h-4 w-4 text-purple-650" />
                    Emergency Contacts
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-slate-500">Race director, medical lead, security desk, and route command contacts stay visible here.</p>
                </div>
                <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-850 dark:text-white">
                    <FileWarning className="h-4 w-4 text-purple-650" />
                    Incident Reporting
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-slate-500">Log route issues, medical incidents, supply shortages, and escalation status.</p>
                </div>
              </CardContent>
            </Card>
          )}

        </div>

        {/* QR Scanner Controls (Right 1 col) */}
        <div className="space-y-8">
          
          {/* CAMERA RUNTIME PANEL */}
          {activeRole.canScan ? (
          <Card className="border-2 border-purple-550 shadow-xl overflow-hidden">
            <CardHeader className="text-center bg-slate-50/50 dark:bg-slate-900/30 border-b pb-4">
              <CardTitle className="text-base flex items-center justify-center gap-1.5">
                <QrCode className="h-5 w-5 text-purple-650" />
                <span>{activeRole.scannerLabel}</span>
              </CardTitle>
              <CardDescription>
                Scanner access is granted for this volunteer role
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 flex flex-col items-center gap-6">
              
              {!showScanner ? (
                <div className="py-8 text-center space-y-4">
                  <div className="mx-auto h-20 w-20 rounded-full bg-purple-100 dark:bg-purple-950/40 text-purple-650 flex items-center justify-center shadow-md animate-pulse">
                    <Camera className="h-10 w-10" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-sm">Scanner Suspended</h4>
                    <p className="text-xs text-slate-400 max-w-[200px] leading-relaxed mx-auto">
                      Click the button below to grant camera access and activate the scanner feed.
                    </p>
                  </div>
                  <Button onClick={() => setShowScanner(true)} variant="glow" className="flex items-center justify-center gap-2 mx-auto">
                    <Play className="h-4 w-4" />
                    <span>Launch Camera</span>
                  </Button>
                </div>
              ) : (
                <div className="w-full space-y-4">
                  <QRScanner 
                    onScanSuccess={handleScanSuccess} 
                    onScanError={(err) => {}}
                  />
                  <Button 
                    onClick={() => setShowScanner(false)} 
                    variant="outline" 
                    className="w-full border-red-500/20 text-red-650 hover:bg-red-500/10 flex items-center justify-center gap-2"
                  >
                    <X className="h-4 w-4" />
                    <span>Cancel Scanner</span>
                  </Button>
                </div>
              )}

              {/* Manual BIB Checkin Form */}
              <div className="w-full border-t border-slate-200 dark:border-slate-800 pt-5 text-left">
                <form onSubmit={handleManualBibSubmit} className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="manualBibNumber" className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Manual BIB Check-in
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="manualBibNumber"
                        placeholder="Enter BIB # (e.g. 1001)"
                        value={manualBibInput}
                        onChange={(e) => setManualBibInput(e.target.value)}
                        disabled={scannerLoading}
                        required
                        className="flex-grow"
                      />
                      <Button type="submit" variant="glow" disabled={scannerLoading}>
                        Check
                      </Button>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">Check-in or record finish status manually by BIB number.</p>
                  </div>
                </form>
              </div>

              {/* Scan Error Alerts */}
              {scanError && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 p-3 text-xs text-red-650 w-full animate-shake">
                  <ShieldAlert className="h-4 w-4 shrink-0" />
                  <span>{scanError}</span>
                </div>
              )}

              {/* Scanned Hit Confirmation Panel */}
              {scanResult && (
                <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-4 space-y-3 w-full border-dashed animate-in slide-in-from-bottom duration-300">
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-extrabold text-sm border-b border-green-500/10 pb-1.5">
                    <CheckCircle className="h-4 w-4" />
                    <span>Scanned Confirmation</span>
                  </div>
                  
                  <div className="space-y-2 text-xs text-slate-600 dark:text-slate-350">
                    <div>Runner: <strong className="text-slate-800 dark:text-white">{scanResult.participantName}</strong></div>
                    <div>Category: <strong className="text-slate-800 dark:text-white">{scanResult.participantDistance}</strong></div>
                    <div>BIB Code: <strong className="text-slate-800 dark:text-white font-mono">{scanResult.scanLog.bib}</strong></div>
                    <div>Checkpoint: <span className="font-bold uppercase text-purple-650">{scanResult.scanType}</span></div>
                    
                    <div className="text-[10px] text-slate-400 border-t border-slate-200 dark:border-slate-800 pt-1.5 mt-1 flex items-center justify-between">
                      <span>Status transition:</span>
                      <span className="font-mono text-purple-500 font-bold">{scanResult.previousStatus} ➜ {scanResult.currentStatus}</span>
                    </div>
                  </div>
                </div>
              )}

            </CardContent>
          </Card>
          ) : (
            <Card className="border-slate-200 dark:border-slate-800 shadow-md">
              <CardHeader className="text-center border-b">
                <CardTitle className="text-base flex items-center justify-center gap-1.5">
                  <ShieldAlert className="h-5 w-5 text-amber-600" />
                  Scanner Hidden
                </CardTitle>
                <CardDescription>
                  {activeRole.label} does not require QR scanning access.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 text-center text-sm text-slate-500">
                Only Check-In, Finish Line, and Registration Desk volunteers can open the QR scanner module.
              </CardContent>
            </Card>
          )}

        </div>

      </div>

    </div>
  );
}
