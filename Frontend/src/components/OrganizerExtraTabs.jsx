import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label, Select } from './ui';
import { API_BASE_URL } from '../services/api';

export default function OrganizerExtraTabs({
  activeTab,
  events,
  activeEventId,
  paymentData,
  paymentLoading,
  whatsappGroups,
  waForm,
  setWaForm,
  waSaving,
  handleSaveWhatsapp,
  auditLogs,
  auditLoading,
  bulkAction,
  setBulkAction,
  bulkLoading,
  bulkResult,
  selectedBulkIds,
  setSelectedBulkIds,
  filteredParticipants,
  handleBulkAction,
  startBibNumber,
  setStartBibNumber,
  bulkNotifySubject,
  setBulkNotifySubject,
  bulkNotifyBody,
  setBulkNotifyBody,
  handleAutoAssign,
}) {
  const eventId = activeEventId || events[0]?.id;
  const activeEvent = events.find((e) => e.id === eventId) || events[0];

  if (activeTab === 'payments') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment dashboard</CardTitle>
          <CardDescription>Revenue, pending payments, and refunds for the active event.</CardDescription>
        </CardHeader>
        <CardContent>
          {paymentLoading ? (
            <p className="text-sm text-slate-500">Loading payment data…</p>
          ) : paymentData ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ['Total revenue', paymentData.totalRevenue ?? paymentData.revenue ?? 0],
                ['Successful', paymentData.successfulPayments ?? paymentData.successful ?? 0],
                ['Pending', paymentData.pendingPayments ?? paymentData.pending ?? 0],
                ['Failed', paymentData.failedPayments ?? paymentData.failed ?? 0],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-slate-200 p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">{label}</p>
                  <p className="mt-1 text-2xl font-black">{value}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No payment data for this event yet.</p>
          )}
        </CardContent>
      </Card>
    );
  }



  if (activeTab === 'whatsapp') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>WhatsApp groups</CardTitle>
          <CardDescription>Community and volunteer group links shared after registration.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSaveWhatsapp} className="grid gap-3 sm:grid-cols-2">
            <Select value={waForm.groupType} onChange={(e) => setWaForm({ ...waForm, groupType: e.target.value })}>
              <option value="COMMUNITY">Community</option>
              <option value="GENERAL_VOLUNTEER">General volunteer</option>
              <option value="MEDICAL_VOLUNTEER">Medical volunteer</option>
            </Select>
            <Input placeholder="Group name" value={waForm.name} onChange={(e) => setWaForm({ ...waForm, name: e.target.value })} />
            <Input placeholder="WhatsApp invite link" className="sm:col-span-2" value={waForm.link} onChange={(e) => setWaForm({ ...waForm, link: e.target.value })} required />
            <Button type="submit" variant="glow" disabled={waSaving}>{waSaving ? 'Saving…' : 'Save group'}</Button>
          </form>
          <div className="space-y-2">
            {whatsappGroups.map((g) => (
              <div key={g.id} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
                <span className="font-bold">{g.groupType}</span> — <a href={g.link} className="text-brand-primary underline" target="_blank" rel="noreferrer">{g.link}</a>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (activeTab === 'audit') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment audit logs</CardTitle>
          <CardDescription>Gateway and refund activity for this event.</CardDescription>
        </CardHeader>
        <CardContent>
          {auditLoading ? (
            <p className="text-sm text-slate-500">Loading…</p>
          ) : auditLogs.length === 0 ? (
            <p className="text-sm text-slate-500">No audit entries yet.</p>
          ) : (
            <div className="max-h-96 overflow-auto space-y-2 text-sm">
              {auditLogs.map((log) => (
                <div key={log.id} className="rounded-lg border border-slate-200 px-3 py-2">
                  <span className="font-bold">{log.action}</span> — {log.details || log.amount}
                  <span className="block text-xs text-slate-400">{new Date(log.timestamp).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  if (activeTab === 'bulk') {
    const toggleId = (id) => {
      setSelectedBulkIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    };

    // Filter to only show unassigned participants if action is 'bibs'
    const participantsToShow = bulkAction === 'bibs'
      ? filteredParticipants.filter((p) => !p.bib && !p.bibId)
      : filteredParticipants;

    const handleSelectAll = () => {
      const shownIds = participantsToShow.slice(0, 50).map(p => p.id);
      const allSelected = shownIds.every(id => selectedBulkIds.includes(id));
      if (allSelected) {
        setSelectedBulkIds(prev => prev.filter(id => !shownIds.includes(id)));
      } else {
        setSelectedBulkIds(prev => [...new Set([...prev, ...shownIds])]);
      }
    };

    const isAllSelected = participantsToShow.slice(0, 50).length > 0 && 
      participantsToShow.slice(0, 50).every(p => selectedBulkIds.includes(p.id));

    return (
      <Card>
        <CardHeader>
          <CardTitle>Bulk actions</CardTitle>
          <CardDescription>Approve, assign BIBs, notify, or regenerate certificates in batch.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Select value={bulkAction} onChange={(e) => setBulkAction(e.target.value)}>
              <option value="approve">Approve registrations</option>
              <option value="bibs">Assign BIB numbers</option>
              <option value="notify">Send email announcement</option>
              <option value="certs">Regenerate certificates</option>
            </Select>
            {bulkAction === 'bibs' && (
              <Input placeholder="Start BIB #" value={startBibNumber} onChange={(e) => setStartBibNumber(e.target.value)} className="w-32" />
            )}
          </div>
          {bulkAction === 'notify' && (
            <div className="space-y-2">
              <Input placeholder="Email subject" value={bulkNotifySubject} onChange={(e) => setBulkNotifySubject(e.target.value)} />
              <textarea className="w-full rounded-xl border border-slate-200 p-3 text-sm min-h-[80px]" placeholder="Message body" value={bulkNotifyBody} onChange={(e) => setBulkNotifyBody(e.target.value)} />
            </div>
          )}

          {participantsToShow.length > 0 && (
            <div className="flex justify-between items-center px-1 text-xs">
              <span className="text-slate-500 font-semibold">
                Showing {participantsToShow.length} runner{participantsToShow.length !== 1 ? 's' : ''} {bulkAction === 'bibs' ? 'without BIBs' : ''}
              </span>
              <button 
                type="button" 
                onClick={handleSelectAll} 
                className="text-brand-primary font-bold hover:underline"
              >
                {isAllSelected ? 'Deselect All' : 'Select All Shown'}
              </button>
            </div>
          )}

          <div className="max-h-48 overflow-auto rounded-lg border border-slate-200 divide-y text-sm">
            {participantsToShow.slice(0, 50).map((p) => (
              <label key={p.id} className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-slate-50">
                <input type="checkbox" checked={selectedBulkIds.includes(p.id)} onChange={() => toggleId(p.id)} />
                <span>{p.user?.name}</span>
                {p.bib?.bibNumber && <span className="text-xs font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">BIB: {p.bib.bibNumber}</span>}
                <span className="text-slate-400 ml-auto">{p.status}</span>
              </label>
            ))}
            {participantsToShow.length === 0 && (
              <div className="p-8 text-center text-slate-400 text-sm">
                No matching participants found for this action.
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="glow" onClick={handleBulkAction} disabled={bulkLoading}>
              {bulkLoading ? 'Processing…' : 'Run bulk action'}
            </Button>
            {bulkAction === 'bibs' && (
              <Button variant="outline" onClick={handleAutoAssign} disabled={bulkLoading}>
                Auto Assign BIBs
              </Button>
            )}
          </div>

          {bulkResult && (
            <div className={`rounded-lg p-3 text-sm ${bulkResult.success ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700'}`}>
              {bulkResult.message}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  if (activeTab === 'broadcast') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Broadcast notification</CardTitle>
          <CardDescription>Email all participants or volunteers for event {activeEvent?.name || '—'}.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500">Use the events API broadcast from the backend. Configure via POST /events/:eventId/notifications/broadcast.</p>
          {!eventId && <p className="text-amber-600 text-sm mt-2">Create an event first.</p>}
        </CardContent>
      </Card>
    );
  }

  return null;
}
