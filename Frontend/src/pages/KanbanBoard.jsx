import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Input, Label, Select } from '../components/ui';
import { Kanban, Plus, Trash2, Calendar, User, AlignLeft, ShieldAlert, X, AlertCircle } from 'lucide-react';

const COLUMNS = [
  { id: 'TODO', label: 'To Do', border: 'border-blue-500/20 bg-blue-500/5', text: 'text-blue-500' },
  { id: 'IN_PROGRESS', label: 'In Progress', border: 'border-amber-500/20 bg-amber-500/5', text: 'text-amber-500' },
  { id: 'DONE', label: 'Done', border: 'border-green-500/20 bg-green-500/5', text: 'text-green-500' }
];

export default function KanbanBoard() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [allUsers, setAllUsers] = useState([]); // For task assignment dropdown
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals & form state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({ title: '', category: 'General', deadline: '', assignedUserIds: [] });
  const [createLoading, setCreateLoading] = useState(false);

  // Fetch tasks and users list
  const fetchKanbanData = async () => {
    try {
      const [tasksRes, participantsRes] = await Promise.all([
        api.get('/tasks'),
        user?.role === 'ORGANIZER' ? api.get('/admin/participants') : Promise.resolve({ data: [] })
      ]);
      
      setTasks(tasksRes.data);
      
      // If organizer, get all volunteers/staff to assign tasks to
      if (user?.role === 'ORGANIZER') {
        // Collect all participants with volunteer accounts, or we can just fetch all users
        // For local simplicity, we let organizers assign tasks to any user (runners or organizers/volunteers)
        // Let's filter unique user profiles in the ledger
        const usersList = participantsRes.data.map(p => p.user);
        
        // Add current logged-in user too
        usersList.push(user);
        
        // Remove duplicates by ID
        const uniqueUsers = Array.from(new Map(usersList.map(u => [u.id, u])).values());
        setAllUsers(uniqueUsers);
      }
      
      setError('');
    } catch (err) {
      console.error(err);
      setError('Failed to load Kanban tasks.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKanbanData();
  }, [user]);

  // DRAG & DROP HANDLERS (HTML5 Drag & Drop)
  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData('text/plain', taskId);
  };

  const handleDragOver = (e) => {
    e.preventDefault(); // Required to allow dropping!
  };

  const handleDrop = async (e, targetStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (!taskId) return;

    // Optimistic Update
    const previousTasks = [...tasks];
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: targetStatus } : t));

    try {
      await api.put(`/tasks/${taskId}`, { status: targetStatus });
      fetchKanbanData(); // Sync with DB
    } catch (err) {
      setTasks(previousTasks); // Rollback on error
      alert('Failed to update task column status.');
    }
  };

  // Submit Task Creation
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.category) return alert('Title and category are required.');

    setCreateLoading(true);
    try {
      await api.post('/tasks', formData);
      setShowCreateModal(false);
      setFormData({ title: '', category: 'General', deadline: '', assignedUserIds: [] });
      fetchKanbanData();
    } catch (err) {
      alert('Failed to create task.');
    } finally {
      setCreateLoading(false);
    }
  };

  // Delete Task
  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this event task?')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      fetchKanbanData();
    } catch (err) {
      alert('Failed to delete task.');
    }
  };

  const handleUserSelectionChange = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    setFormData(prev => ({ ...prev, assignedUserIds: selectedOptions }));
  };

  if (loading) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
        <p className="mt-4 text-sm text-slate-500">Loading Kanban board...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Kanban Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white m-0 tracking-tight flex items-center gap-2">
            <Kanban className="h-8 w-8 text-purple-650" />
            Task Kanban Board
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Organize event coordination, volunteers staffing and checklists in real-time
          </p>
        </div>
        
        {user?.role === 'ORGANIZER' && (
          <Button onClick={() => setShowCreateModal(true)} variant="glow" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            <span>Create Task</span>
          </Button>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 p-4 text-sm text-red-650">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* THREE DRAGGABLE KANBAN COLUMNS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {COLUMNS.map((column) => {
          const colTasks = tasks.filter(t => t.status === column.id);

          return (
            <div 
              key={column.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
              className={`rounded-2xl border p-4 min-h-[500px] flex flex-col space-y-4 transition-all duration-300 ${column.border}`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between border-b pb-2">
                <span className={`font-bold text-sm uppercase tracking-wider ${column.text}`}>{column.label}</span>
                <Badge variant="secondary" className="font-mono">{colTasks.length}</Badge>
              </div>

              {/* Task list container */}
              <div className="flex-1 space-y-4 overflow-y-auto">
                {colTasks.length > 0 ? (
                  colTasks.map((task) => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200/80 dark:border-slate-850 p-4 shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing transition-all duration-300 group hover:border-purple-500/30"
                    >
                      <div className="space-y-3">
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-xs uppercase font-extrabold tracking-widest text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20 w-max">
                            {task.category}
                          </span>
                          
                          {user?.role === 'ORGANIZER' && (
                            <button
                              onClick={() => handleDeleteTask(task.id)}
                              className="text-slate-400 hover:text-red-500 p-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-900 transition-all duration-200"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>

                        <h4 className="font-bold text-sm text-slate-800 dark:text-white leading-tight">
                          {task.title}
                        </h4>

                        {/* Assignments & Deadlines Info footer */}
                        <div className="border-t border-slate-100 dark:border-slate-900 pt-3 flex flex-col gap-2 text-[10px] text-slate-400">
                          {task.deadline && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 shrink-0" />
                              <span>Due: {new Date(task.deadline).toLocaleDateString()}</span>
                            </div>
                          )}

                          {task.assignments && task.assignments.length > 0 && (
                            <div className="flex items-start gap-1">
                              <User className="h-3 w-3 shrink-0 mt-0.5" />
                              <div className="leading-tight">
                                Assigned to: <strong className="text-slate-600 dark:text-slate-350">{task.assignments.map(a => a.user.name).join(', ')}</strong>
                              </div>
                            </div>
                          )}
                        </div>

                      </div>
                    </div>
                  ))
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400 text-center py-12 border border-dashed rounded-xl">
                    Drag items here
                  </div>
                )}
              </div>

            </div>
          );
        })}
      </div>

      {/* --- CREATE TASK MODAL (Phase 9) --- */}
      {showCreateModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 px-4">
          <Card className="w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
              <div>
                <CardTitle className="text-lg">Create Marathon Task</CardTitle>
                <CardDescription>Add new tasks to the coordination timeline</CardDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowCreateModal(false)} className="h-8 w-8 rounded-full border">
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <form onSubmit={handleCreateSubmit}>
              <CardContent className="space-y-4 pt-4">
                <div className="space-y-1.5">
                  <Label htmlFor="title">Task Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g. Set up BIB distribution tables"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    required
                    disabled={createLoading}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="category">Category</Label>
                  <Select 
                    id="category" 
                    value={formData.category} 
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    disabled={createLoading}
                  >
                    <option value="General">General</option>
                    <option value="Logistics">Logistics</option>
                    <option value="Staffing">Staffing</option>
                    <option value="Water Stations">Water Stations</option>
                    <option value="First Aid">First Aid</option>
                    <option value="Media/PR">Media/PR</option>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="deadline">Deadline Date</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                    disabled={createLoading}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="assignments">Assign Staff / Volunteers</Label>
                  <Select 
                    id="assignments" 
                    multiple 
                    className="h-28" 
                    onChange={handleUserSelectionChange}
                    disabled={createLoading}
                  >
                    {allUsers.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.role})
                      </option>
                    ))}
                  </Select>
                  <p className="text-[10px] text-slate-400 leading-normal mt-1">Hold Ctrl (Windows) or Cmd (Mac) to select multiple assignees.</p>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2 border-t pt-4">
                <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>Cancel</Button>
                <Button type="submit" variant="glow" disabled={createLoading}>
                  {createLoading ? "Creating..." : "Add to Board"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      )}

    </div>
  );
}
