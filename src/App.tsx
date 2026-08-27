import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import {
  Bell, CalendarDays, Check, ChevronDown, CircleHelp, Clock3, Edit3, Grid2X2,
  ListTodo, LogOut, Menu, Plus, Search, Settings, Sparkles, Tags, Trash2, X, Zap
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { readData, saveData } from './database';

type Category = 'Home' | 'Work' | 'Health/Fitness' | 'Education' | 'Personal';
type TaskColor = 'violet' | 'blue' | 'green' | 'orange' | 'pink';
type Priority = 'High' | 'Medium' | 'Low';

type Task = {
  id: string; title: string; description: string; deadline: string;
  categories: Category[]; color: TaskColor; emoji: string;
  completed: boolean; priority: Priority; alerted?: boolean;
};
type User = { username: string; password: string };

const categories: { label: Category; emoji: string; color: string }[] = [
  { label: 'Home', emoji: '🏠', color: 'green' },
  { label: 'Work', emoji: '🏢', color: 'blue' },
  { label: 'Health/Fitness', emoji: '💪', color: 'yellow' },
  { label: 'Education', emoji: '📚', color: 'orange' },
  { label: 'Personal', emoji: '👤', color: 'pink' },
];
const emojis = ['😀', '😎', '🥳', '🤩', '📝', '💼', '🎯', '💡', '🏠', '🏃', '📚', '💪', '🧠', '🎨', '🎵', '🍎', '✈️', '❤️', '🔥', '✅', '🚀', '🌈', '☕', '🎁', '📅', '💻', '📌', '🌱', '⭐', '🔔', '🧘', '🏋️'];
const taskColors: { value: TaskColor; label: string; hex: string }[] = [
  { value: 'violet', label: 'Electric Violet', hex: '#b42cff' },
  { value: 'blue', label: 'Sky Blue', hex: '#42a5f5' },
  { value: 'green', label: 'Neon Green', hex: '#54df70' },
  { value: 'orange', label: 'Sunset Orange', hex: '#ff983d' },
  { value: 'pink', label: 'Hot Pink', hex: '#f06ad7' },
];

const triggerVibrate = (duration: number | number[] = 50) => {
  if (typeof window !== 'undefined' && navigator.vibrate) navigator.vibrate(duration as VibratePattern);
};

function App() {
  const [session, setSession] = useState(() => localStorage.getItem('todo_session'));
  const [users, setUsers] = useState<User[]>(() => readData<User[]>('todo_users', []));
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  const authenticate = (username: string, password: string, mode: 'login' | 'signup') => {
    triggerVibrate(30);
    const cleanName = username.trim().toLowerCase();
    if (mode === 'signup') {
      if (cleanName.length < 3 || password.length < 6) return 'Use a username with 3+ characters and a password with 6+ characters.';
      if (users.some((user) => user.username === cleanName)) return 'That username is already registered.';
      const nextUsers = [...users, { username: cleanName, password }];
      setUsers(nextUsers);
      saveData('todo_users', nextUsers);
      localStorage.setItem('todo_session', cleanName);
      setSession(cleanName);
      return '';
    }
    const found = users.find((user) => user.username === cleanName && user.password === password);
    if (!found) return 'Incorrect username or password.';
    localStorage.setItem('todo_session', found.username);
    setSession(found.username);
    return '';
  };

  if (!session) return <AuthScreen mode={authMode} onModeChange={setAuthMode} onAuthenticate={authenticate} />;
  return <Dashboard key={session} username={session} onLogout={() => { triggerVibrate(50); localStorage.removeItem('todo_session'); setSession(null); }} />;
}

function AuthScreen({ mode, onModeChange, onAuthenticate }: { mode: 'login' | 'signup'; onModeChange: (mode: 'login' | 'signup') => void; onAuthenticate: (username: string, password: string, mode: 'login' | 'signup') => string }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const signup = mode === 'signup';
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (signup && password !== confirm) { setError('Passwords do not match.'); triggerVibrate([50, 50]); return; }
    setError(onAuthenticate(username, password, mode));
  };
  return (
    <main className="auth-shell">
      <div className="auth-orbit orbit-one" /><div className="auth-orbit orbit-two" />
      <section className="auth-card">
        <div className="brand large"><span className="brand-mark"><Zap size={24} fill="currentColor" /></span><span>Todo</span></div>
        <div className="auth-copy"><span className="eyebrow"><Sparkles size={14} /> YOUR PERSONAL WORKSPACE</span><h1>{signup ? 'Start flowing.' : 'Welcome back.'}</h1><p>{signup ? 'Create your space, capture your momentum, and make every day count.' : 'Pick up where you left off and keep your day moving forward.'}</p></div>
        <div className="auth-tabs"><button type="button" className={!signup ? 'active' : ''} onClick={() => { onModeChange('login'); setError(''); triggerVibrate(20); }}>Sign in</button><button type="button" className={signup ? 'active' : ''} onClick={() => { onModeChange('signup'); setError(''); triggerVibrate(20); }}>Create account</button></div>
        <form onSubmit={submit} className="auth-form">
          <label>Username<input autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="e.g. alex" required /></label>
          <label>Password<input type="password" autoComplete={signup ? 'new-password' : 'current-password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={signup ? 'At least 6 characters' : 'Your password'} required /></label>
          {signup && <label>Confirm password<input type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Repeat your password" required /></label>}
          {error && <p className="form-error">{error}</p>}
          <button className="primary-btn auth-btn" type="submit">{signup ? 'Create my workspace' : 'Enter Todo'}<span>→</span></button>
        </form>
      </section>
    </main>
  );
}

function Dashboard({ username, onLogout }: { username: string; onLogout: () => void }) {
  const storageKey = `todo_tasks_${username}`;
  const [tasks, setTasks] = useState<Task[]>(() => readData<Task[]>(storageKey, []));
  
  // Navigation array updated (Database removed)
  const navItems = ['Dashboard', 'Pending', 'Completed'] as const;
  const [activeNav, setActiveNav] = useState<typeof navItems[number]>('Dashboard');
  
  const [filter, setFilter] = useState<Category | 'All'>('All');
  const [query, setQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [toast, setToast] = useState('');
  const [pdfMenuOpen, setPdfMenuOpen] = useState(false); // New state for PDF dropdown
  const alerted = useRef(new Set<string>());

  useEffect(() => { saveData(storageKey, tasks); }, [tasks, storageKey]);
  
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') void Notification.requestPermission();
    const interval = window.setInterval(() => {
      const now = Date.now();
      setTasks((current) => current.map((task) => {
        const due = new Date(task.deadline).getTime();
        if (!task.completed && due <= now && due > now - 60000 && !alerted.current.has(task.id)) {
          alerted.current.add(task.id);
          setToast(`Task due: ${task.title}`);
          triggerVibrate([100, 50, 100]); 
          if ('Notification' in window && Notification.permission === 'granted') new Notification('Todo reminder', { body: task.title });
          const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'); 
          void audio.play().catch(() => {});
        }
        return task;
      }));
    }, 15000);
    return () => window.clearInterval(interval);
  }, []);
  
  useEffect(() => { if (!toast) return; const timer = window.setTimeout(() => setToast(''), 4500); return () => window.clearTimeout(timer); }, [toast]);

  const completed = tasks.filter((task) => task.completed).length;
  const filtered = useMemo(() => tasks.filter((task) => {
    const matchesNav = activeNav === 'Completed' ? task.completed : activeNav === 'Pending' ? !task.completed : true;
    const matchesFilter = filter === 'All' || task.categories.includes(filter);
    const haystack = `${task.title} ${task.description} ${task.categories.join(' ')}`.toLowerCase();
    return matchesNav && matchesFilter && haystack.includes(query.toLowerCase());
  }).sort((a, b) => Number(a.completed) - Number(b.completed) || new Date(a.deadline).getTime() - new Date(b.deadline).getTime()), [tasks, activeNav, filter, query]);
  
  const upcoming = tasks.filter((task) => !task.completed).sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()).slice(0, 3);
  
  const openCreate = () => { triggerVibrate(30); setEditing(null); setShowModal(true); };
  const saveTask = (task: Task) => { triggerVibrate([30, 50]); setTasks((current) => editing ? current.map((item) => item.id === task.id ? task : item) : [task, ...current]); setShowModal(false); };
  const toggleTask = (id: string) => { triggerVibrate(40); setTasks((current) => current.map((task) => task.id === id ? { ...task, completed: !task.completed } : task)); };
  const deleteTask = (id: string) => { triggerVibrate([50, 100]); setTasks((current) => current.filter((task) => task.id !== id)); };

  const handleClearCompleted = () => { triggerVibrate(50); setTasks((current) => current.filter((t) => !t.completed)); setToast('Completed tasks cleared'); setShowSettings(false); };
  const handleWipeData = () => { if (confirm('Are you sure you want to delete all tasks?')) { triggerVibrate([100, 100]); setTasks([]); setToast('All tasks deleted'); setShowSettings(false); } };

  const downloadReport = (timeframe: 'Daily' | 'Weekly' | 'Monthly' | 'Yearly') => {
    const doc = new jsPDF();
    doc.text(`Todo Workspace - ${timeframe} Progress Report`, 14, 15);
    const now = new Date().getTime();
    const timeLimits = { 'Daily': 1, 'Weekly': 7, 'Monthly': 30, 'Yearly': 365 };
    const limitMs = timeLimits[timeframe] * 24 * 60 * 60 * 1000;
    
    const filteredTasks = tasks.filter(task => (now - new Date(task.deadline).getTime()) <= limitMs);
    const tableData = filteredTasks.map(t => [ t.title, t.categories.join(', '), t.priority, t.completed ? 'Completed' : (new Date(t.deadline).getTime() < now ? 'Overdue' : 'Pending'), new Date(t.deadline).toLocaleDateString() ]);
    
    autoTable(doc, { head: [['Task Name', 'Categories', 'Priority', 'Status', 'Deadline']], body: tableData, startY: 25, theme: 'grid', styles: { fontSize: 10 }, headStyles: { fillColor: [180, 44, 255] } });
    doc.save(`Todo_${timeframe}_Report.pdf`);
    setToast(`${timeframe} Report Downloaded!`);
  };

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark"><Zap size={18} fill="currentColor" /></span><span>Todo</span></div>
      <nav className="main-nav">
        {navItems.map((item) => (
          <button key={item} className={activeNav === item ? 'selected' : ''} onClick={() => { setActiveNav(item); triggerVibrate(20); }}>
            {item === 'Dashboard' ? <Grid2X2 size={18} /> : item === 'Pending' ? <Clock3 size={18} /> : <Check size={18} />}
            {item} {item === 'Pending' && <span className="nav-count">{tasks.filter((task) => !task.completed).length}</span>}
          </button>
        ))}
      </nav>
      <div className="sidebar-bottom"><button onClick={() => { triggerVibrate(20); setShowSettings(true); }}><Settings size={18} /> Settings</button><button onClick={() => { triggerVibrate(20); setShowHelp(true); }}><CircleHelp size={18} /> Help center</button><div className="profile"><div className="avatar">{username.slice(0, 1).toUpperCase()}</div><div><strong>{username}</strong><small>Personal workspace</small></div><button className="logout-btn" onClick={onLogout}><LogOut size={16} /></button></div></div>
    </aside>
    
    <section className="content">
      <header className="topbar">
        <div className="breadcrumb">{activeNav === 'Dashboard' ? 'Your Workspace' : activeNav}</div>
        <button className="notification-btn" onClick={() => { triggerVibrate(20); setToast('You’re all caught up'); }}><Bell size={19} /><i /></button>
      </header>
      
      <main className="main-content">
        <div className="hero-row"><div><span className="eyebrow"><Sparkles size={15} /> YOUR WORKSPACE</span><h1>{greeting()}, {username}</h1><p>Here’s your task overview for today.</p></div><button className="primary-btn" onClick={openCreate}><Plus size={19} /> Add task</button></div>
        <div className="stats-grid"><Stat icon={<ListTodo />} label="Total tasks" value={tasks.length} detail="in your workspace" /><Stat icon={<Clock3 />} label="Pending tasks" value={tasks.filter((task) => !task.completed).length} detail="keep the momentum" /><Stat icon={<Check />} label="Completed" value={completed} detail="nice work" /><Stat icon={<Zap />} label="High priority" value={tasks.filter((task) => !task.completed && task.priority === 'High').length} detail="High priority tasks" /></div>
        
        <div className="overview-grid"><div className="progress-card"><div className="card-heading"><div><strong>Task progress</strong><p>Keep your momentum going</p></div><b>{tasks.length ? Math.round(completed / tasks.length * 100) : 0}%</b></div><div className="progress-track"><span style={{ width: `${tasks.length ? completed / tasks.length * 100 : 0}%` }} /></div><small>{completed} of {tasks.length} tasks completed</small></div><div className="upcoming-card"><div className="upcoming-heading"><CalendarDays size={17} /><strong>Upcoming tasks</strong><span>{upcoming.length}</span></div>{upcoming.length ? upcoming.map((task) => <div className="upcoming-item" key={task.id}><span>{task.emoji} {task.title}</span><small>{timeLabel(task.deadline)}</small></div>) : <p className="empty-mini">Your next wins will appear here.</p>}</div></div>
        
        <div className="task-section">
          <div className="section-heading">
            <div><h2>{activeNav === 'Dashboard' ? 'Your tasks' : activeNav}</h2><p>Stay organized and make progress every day.</p></div>
            <div className="task-tools">
              
              {/* Refined PDF Button with Dropdown */}
              <div style={{ position: 'relative' }}>
                <button type="button" className="ghost-btn" style={{ padding: '8px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }} onClick={() => setPdfMenuOpen(!pdfMenuOpen)}>
                  📄 Download PDF <ChevronDown size={14} />
                </button>
                {pdfMenuOpen && (
                  <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '8px', background: '#272532', border: '1px solid rgba(255,255,255,0.1)', padding: '5px', borderRadius: '10px', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '2px', minWidth: '130px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
                    {['Daily', 'Weekly', 'Monthly', 'Yearly'].map(tf => (
                      <button key={tf} type="button" onClick={() => { downloadReport(tf as any); setPdfMenuOpen(false); }} style={{ background: 'transparent', border: 'none', color: '#fff', padding: '10px 12px', textAlign: 'left', cursor: 'pointer', fontSize: '13px', borderRadius: '6px' }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                        {tf} Tasks
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <label className="search-box"><Search size={17} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search tasks..." /></label>
              <button className="view-btn"><Tags size={16} /> Filters <ChevronDown size={15} /></button>
            </div>
          </div>
          <div className="filter-row"><button className={filter === 'All' ? 'active' : ''} onClick={() => { setFilter('All'); triggerVibrate(15); }}>All tasks <span>{tasks.length}</span></button>{categories.map((category) => <button key={category.label} className={filter === category.label ? 'active' : ''} onClick={() => { setFilter(category.label); triggerVibrate(15); }}>{category.emoji} {category.label} <span>{tasks.filter((task) => task.categories.includes(category.label)).length}</span></button>)}</div>
          
          {/* Task List Rendering */}
          <div className="task-list">{filtered.length ? filtered.map((task) => <TaskCard key={task.id} task={task} onToggle={toggleTask} onEdit={() => { triggerVibrate(20); setEditing(task); setShowModal(true); }} onDelete={deleteTask} />) : <div className="empty-state"><div className="empty-icon"><ListTodo size={27} /></div><h3>{tasks.length ? 'No matching tasks' : 'Your flow starts here'}</h3><p>{tasks.length ? 'Try another search or category.' : 'Add your first task and turn intention into momentum.'}</p>{!tasks.length && <button className="primary-btn" onClick={openCreate}><Plus size={18} /> Add your first task</button>}</div>}</div>
        </div>
      </main>
    </section>

    <nav className="bottom-nav">
      {navItems.map((item) => (
        <button type="button" key={item} className={activeNav === item ? 'selected' : ''} onClick={() => { setActiveNav(item); triggerVibrate(20); }}>
          {item === 'Dashboard' ? <Grid2X2 size={22} /> : item === 'Pending' ? <Clock3 size={22} /> : <Check size={22} />}
          <span>{item}</span>
        </button>
      ))}
    </nav>
    
    {showModal && <TaskModal initial={editing} onClose={() => setShowModal(false)} onSave={saveTask} />}
    {showSettings && <SettingsModal onClear={handleClearCompleted} onWipe={handleWipeData} onClose={() => setShowSettings(false)} />}
    {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
    {toast && <div className="toast"><Bell size={18} /><span>{toast}</span><button onClick={() => setToast('')}><X size={15} /></button></div>}
  </div>;
}


function Stat({ icon, label, value, detail }: { icon: React.ReactNode; label: string; value: number; detail: string }) { return <div className="stat-card"><div className="stat-icon">{icon}</div><div><span>{label}</span><strong>{value}</strong><small>{detail}</small></div></div>; }

function TaskCard({ task, onToggle, onEdit, onDelete }: { task: Task; onToggle: (id: string) => void; onEdit: () => void; onDelete: (id: string) => void }) { 
  // Miss aanatha (overdue) check panra logic
  const isOverdue = !task.completed && new Date(task.deadline).getTime() < Date.now();
  
  return (
    <article className={`task-card ${task.color} ${task.completed ? 'done' : ''}`} style={isOverdue ? { borderColor: 'rgba(255, 80, 80, 0.5)', backgroundColor: 'rgba(255, 80, 80, 0.05)' } : {}}>
      <button className={`check-circle ${task.completed ? 'checked' : ''}`} style={isOverdue ? { borderColor: 'rgba(255, 80, 80, 0.5)' } : {}} onClick={() => onToggle(task.id)}>{task.completed && <Check size={15} />}</button>
      <div className="task-emoji">{task.emoji}</div>
      <div className="task-info">
        <div className="task-title-row">
          <h3 style={isOverdue ? { color: '#ff8f9c' } : {}}>{task.title}</h3>
          {!task.completed && <span className="due-chip" style={isOverdue ? { background: 'rgba(255,80,80,0.15)', color: '#ff6b6b' } : {}}>{isOverdue ? 'Overdue' : timeLabel(task.deadline)}</span>}
        </div>
        <p>{task.description || 'No description added.'}</p>
        <div className="task-meta">
          <span style={isOverdue ? { color: '#ff8f9c' } : {}}><CalendarDays size={13} /> {formatDate(task.deadline)}</span>
          {task.categories.map((category) => <span key={category} className={`category-pill ${categoryClass(category)}`}>{categories.find((item) => item.label === category)?.emoji} {category}</span>)}
          <span className="category-pill" style={{border: '1px solid currentColor', opacity: 0.8}}>⚡ {task.priority} Priority</span>
        </div>
      </div>
      <div className="task-actions"><button onClick={onEdit} title="Edit task"><Edit3 size={16} /></button><button onClick={() => onDelete(task.id)} title="Delete task"><Trash2 size={16} /></button></div>
    </article>
  ); 
}

function TaskModal({ initial, onClose, onSave }: { initial: Task | null; onClose: () => void; onSave: (task: Task) => void }) {
  const [title, setTitle] = useState(initial?.title ?? ''); const [description, setDescription] = useState(initial?.description ?? ''); const [deadline, setDeadline] = useState(initial?.deadline ?? ''); const [selected, setSelected] = useState<Category[]>(initial?.categories ?? []); const [color, setColor] = useState<TaskColor>(initial?.color ?? 'violet'); const [priority, setPriority] = useState<Priority>(initial?.priority ?? 'Medium'); const [emoji, setEmoji] = useState(initial?.emoji ?? '✨'); const [emojiOpen, setEmojiOpen] = useState(false); const [emojiSearch, setEmojiSearch] = useState(''); const [error, setError] = useState('');
  const submit = (event: FormEvent) => { event.preventDefault(); if (!title.trim() || !deadline || selected.length === 0) { setError('Add a task name, deadline, and at least one category.'); triggerVibrate([50,50]); return; } onSave({ id: initial?.id ?? crypto.randomUUID(), title: title.trim(), description: description.trim(), deadline, categories: selected, color, emoji, completed: initial?.completed ?? false, priority }); };
  return <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}><div className="task-modal"><div className="modal-header"><div><span className="eyebrow"><Sparkles size={14} /> {initial ? 'REFINE YOUR TASK' : 'CREATE A NEW TASK'}</span><h2>{initial ? 'Edit task' : 'Add new task'}</h2></div><button type="button" onClick={onClose}><X size={20} /></button></div><form onSubmit={submit}><div className="emoji-picker"><button type="button" className="emoji-orb" onClick={() => { triggerVibrate(20); setEmojiOpen(!emojiOpen); }}>{emoji}<span><Edit3 size={13} /></span></button><p>Choose the feeling for this task</p>{emojiOpen && <div className="emoji-popover"><div className="emoji-search"><Search size={15} /><input autoFocus value={emojiSearch} onChange={(e) => setEmojiSearch(e.target.value)} placeholder="Search emoji" /></div><div className="emoji-grid">{emojis.filter((item) => !emojiSearch || item.includes(emojiSearch)).map((item) => <button type="button" key={item} onClick={() => { triggerVibrate(20); setEmoji(item); setEmojiOpen(false); }}>{item}</button>)}</div></div>}</div><div className="form-grid"><label>Task name *<input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What needs your attention?" autoFocus={!initial} /></label><label>Task deadline *<input type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} /></label><label className="full">Task description<textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Add a little context..." rows={3} /></label></div><div className="modal-label">Priority</div><div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>{(['High', 'Medium', 'Low'] as Priority[]).map((p) => ( <button type="button" key={p} onClick={() => { triggerVibrate(15); setPriority(p); }} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: priority === p ? '2px solid #b42cff' : '1px solid #333', background: priority === p ? '#b42cff20' : 'transparent', color: '#fff', cursor: 'pointer' }}>{p}</button> ))}</div><div className="modal-label">Categories <span>Select up to 3</span></div><div className="category-options">{categories.map((category) => <button type="button" key={category.label} className={`${categoryClass(category.label)} ${selected.includes(category.label) ? 'selected' : ''}`} onClick={() => { triggerVibrate(15); setSelected((current) => current.includes(category.label) ? current.filter((item) => item !== category.label) : current.length < 3 ? [...current, category.label] : current); }}>{category.emoji} {category.label}{selected.includes(category.label) && <Check size={15} />}</button>)}</div><div className="modal-label">Task color</div><div className="color-options">{taskColors.map((item) => <button type="button" key={item.value} className={color === item.value ? 'selected' : ''} onClick={() => { triggerVibrate(15); setColor(item.value); }}><i style={{ background: item.hex }} />{item.label}{color === item.value && <Check size={14} />}</button>)}</div>{error && <p className="form-error">{error}</p>}<div className="modal-footer"><button type="button" className="ghost-btn" onClick={onClose}>Cancel</button><button className="primary-btn" type="submit">{initial ? 'Save changes' : 'Create task'} <span>→</span></button></div></form></div></div>;
}

function HelpModal({ onClose }: { onClose: () => void }) { return ( <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}><div className="task-modal" style={{ maxWidth: '500px' }}><div className="modal-header"><div><span className="eyebrow"><CircleHelp size={14} /> SUPPORT</span><h2>Help Center</h2></div><button type="button" onClick={onClose}><X size={20} /></button></div><div style={{ marginTop: '20px', color: '#b7b8c5', fontSize: '13px', lineHeight: '1.6' }}><h3 style={{ color: '#fff', fontSize: '15px', margin: '15px 0 5px' }}>📌 How to add a task?</h3><p>Click the "Add task" button on the dashboard. Fill in the task name, select a deadline, and choose categories.</p><h3 style={{ color: '#fff', fontSize: '15px', margin: '15px 0 5px' }}>⚡ How to set priority?</h3><p>While creating or editing a task, use the Priority buttons (High, Medium, Low) to set importance.</p></div><div className="modal-footer"><button type="button" className="primary-btn" onClick={onClose}>Got it</button></div></div></div> ); }
function SettingsModal({ onClear, onWipe, onClose }: { onClear: () => void; onWipe: () => void; onClose: () => void }) { return ( <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}><div className="task-modal" style={{ maxWidth: '450px' }}><div className="modal-header"><div><span className="eyebrow"><Settings size={14} /> PREFERENCES</span><h2>Settings</h2></div><button type="button" onClick={onClose}><X size={20} /></button></div><div style={{ marginTop: '20px', display: 'grid', gap: '15px' }}><div style={{ padding: '15px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}><strong style={{ color: '#fff', display: 'block', marginBottom: '5px' }}>Clear Completed Tasks</strong><button type="button" className="ghost-btn" style={{ padding: '8px 12px', fontSize: '12px' }} onClick={onClear}>Clear Completed</button></div><div style={{ padding: '15px', background: 'rgba(255,80,80,0.1)', borderRadius: '12px', border: '1px solid rgba(255,80,80,0.2)' }}><strong style={{ color: '#ff6b6b', display: 'block', marginBottom: '5px' }}>Wipe All Data</strong><button type="button" className="primary-btn" style={{ background: '#ff4757', boxShadow: 'none', padding: '8px 12px', fontSize: '12px' }} onClick={onWipe}>Delete All Data</button></div></div></div></div> ); }

function greeting() { const hour = new Date().getHours(); return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'; }
function formatDate(value: string) { return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(value)); }
function timeLabel(value: string) { const difference = new Date(value).getTime() - Date.now(); const minutes = Math.round(Math.abs(difference) / 60000); if (minutes < 1) return 'due now'; if (difference > 0) return minutes < 60 ? `in ${minutes}m` : `in ${Math.round(minutes / 60)}h`; return minutes < 60 ? `${minutes}m ago` : `${Math.round(minutes / 60)}h ago`; }
function categoryClass(category: Category) { return category === 'Home' ? 'cat-green' : category === 'Work' ? 'cat-blue' : category === 'Health/Fitness' ? 'cat-yellow' : category === 'Education' ? 'cat-orange' : 'cat-pink'; }

export default App;