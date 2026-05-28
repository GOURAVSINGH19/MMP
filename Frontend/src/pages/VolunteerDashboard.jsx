import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import QRScanner from '../components/QRScanner';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, TableContainer, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui';
import { QrCode, ClipboardList, CheckCircle, ShieldAlert, Clock, LogOut, Camera, X, Play } from 'lucide-react';

export default function VolunteerDashboard() {
  const { user, logout } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [scanLogs, setScanLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Scanner toggle and result state
  const [showScanner, setShowScanner] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [scanError, setScanError] = useState('');
  const [scannerLoading, setScannerLoading] = useState(false);

  // Fetch volunteer assignments & scan log feeds
  const fetchVolunteerData = async () => {
    try {
      const [tasksRes, logsRes] = await Promise.all([
        api.get('/tasks'),
        api.get('/volunteer/scan-logs')
      ]);

      // Filter tasks assigned to this specific volunteer
      const myTasks = tasksRes.data.filter(task => 
        task.assignments.some(assignment => assignment.userId === user.id)
      );

      setTasks(myTasks);
      setScanLogs(logsRes.data);
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
            <ClipboardList className="h-8 w-8 text-purple-650" />
            Volunteer Portal
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Welcome, <span className="font-semibold text-purple-650">{user?.name}</span>! Thank you for supporting the marathon!
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

        </div>

        {/* QR Scanner Controls (Right 1 col) */}
        <div className="space-y-8">
          
          {/* CAMERA RUNTIME PANEL */}
          <Card className="border-2 border-purple-550 shadow-xl overflow-hidden">
            <CardHeader className="text-center bg-slate-50/50 dark:bg-slate-900/30 border-b pb-4">
              <CardTitle className="text-base flex items-center justify-center gap-1.5">
                <QrCode className="h-5 w-5 text-purple-650" />
                <span>BIB QR Scanner</span>
              </CardTitle>
              <CardDescription>
                Scan timing tags or kit barcodes
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

        </div>

      </div>

    </div>
  );
}
