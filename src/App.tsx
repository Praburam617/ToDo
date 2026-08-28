import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import {
  Bell, CalendarDays, Check, CircleHelp, Edit3, Grid2X2, Inbox, 
  ListTodo, LogOut, Plus, Search, Settings, Sparkles, Trash2, X, Zap, Target, Filter, FileText
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
type User = { username: string; password: string; onboarded?: boolean };

const categories: { label: Category; emoji: string; color: string }[] = [
  { label: 'Home', emoji: '🏠', color: 'green' }, { label: 'Work', emoji: '🏢', color: 'blue' },
  { label: 'Health/Fitness', emoji: '💪', color: 'yellow' }, { label: 'Education', emoji: '📚', color: 'orange' },
  { label: 'Personal', emoji: '👤', color: 'pink' },
];
const emojis = ['😀', '😎', '🥳', '🤩', '📝', '💼', '🎯', '💡', '🏠', '🏃', '📚', '💪', '🧠', '🎨', '🎵', '🍎', '✈️', '❤️', '🔥', '✅', '🚀', '🌈', '☕', '🎁', '📅', '💻', '📌', '🌱', '⭐', '🔔', '🧘', '🏋️'];
const taskColors: { value: TaskColor; label: string; hex: string }[] = [
  { value: 'violet', label: 'Violet', hex: '#b42cff' }, { value: 'blue', label: 'Sky Blue', hex: '#42a5f5' },
  { value: 'green', label: 'Neon Green', hex: '#54df70' }, { value: 'orange', label: 'Orange', hex: '#ff983d' },
  { value: 'pink', label: 'Hot Pink', hex: '#f06ad7' },
];

const prioWeight: Record<string, number> = { High: 3, Medium: 2, Low: 1 };

const triggerVibrate = (duration: number | number[] = 50) => {
  if (typeof window !== 'undefined' && navigator.vibrate) navigator.vibrate(duration as VibratePattern);
};

// Safe Local ISO string format (YYYY-MM-DDTHH:mm) for input type="datetime-local"
const getLocalISOTime = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

export default function App() {
  const [session, setSession] = useState(() => localStorage.getItem('todo_session'));
  // Safety Fallback for Users array
  const [users, setUsers] = useState<User[]>(() => {
    const data = readData<User[]>('todo_users', []);
    return Array.isArray(data) ? data : [];
  });
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');

  const currentUser = users.find(u => u.username === session);

  const authenticate = (username: string, password: string, mode: 'login' | 'signup') => {
    triggerVibrate(30);
    const cleanName = username.trim().toLowerCase();
    
    if (mode === 'signup') {
      if (cleanName.length < 3 || password.length < 6) return 'Use a username with 3+ characters and a password with 6+ characters.';
      if (users.some((user) => user.username === cleanName)) return 'That username is already registered.';
      
      const nextUsers = [...users, { username: cleanName, password, onboarded: false }];
      setUsers(nextUsers);
      saveData('todo_users', nextUsers);
      return 'SUCCESS_SIGNUP'; 
    }
    
    const found = users.find((user) => user.username === cleanName && user.password === password);
    if (!found) return 'Incorrect username or password.';
    localStorage.setItem('todo_session', found.username);
    setSession(found.username);
    return '';
  };

  const finishOnboarding = () => {
    const updated = users.map(u => u.username === session ? { ...u, onboarded: true } : u);
    setUsers(updated);
    saveData('todo_users', updated);
  };

  if (!session || !currentUser) return <AuthScreen mode={authMode} onModeChange={setAuthMode} onAuthenticate={authenticate} />;
  
  if (!currentUser.onboarded) return <OnboardingWizard onFinish={finishOnboarding} />;

  return <Dashboard key={session} username={session} onLogout={() => { triggerVibrate(50); localStorage.removeItem('todo_session'); setSession(null); }} />;
}

// PREMIUM 6-STEP ONBOARDING WIZARD
function OnboardingWizard({ onFinish }: { onFinish: () => void }) {
  const [step, setStep] = useState(1);
  const [animKey, setAnimKey] = useState(1);
  const [name, setName] = useState('');
  
  const [st1, setSt1] = useState(false); const [dn1, setDn1] = useState(false);
  const [st2, setSt2] = useState(false); const [dn2, setDn2] = useState(false);
  const [st3, setSt3] = useState(false); const [dn3, setDn3] = useState(false);
  const [st4, setSt4] = useState(false);

  useEffect(() => {
    if (step === 1) {
      setTimeout(() => setSt1(true), 300); setTimeout(() => setDn1(true), 1200);
      setTimeout(() => setSt2(true), 1500); setTimeout(() => setDn2(true), 2400);
      setTimeout(() => setSt3(true), 2700); setTimeout(() => setDn3(true), 3600);
      setTimeout(() => setSt4(true), 4000);
    }
  }, [step]);

  const nextStep = (n: number) => { triggerVibrate(20); setStep(n); setAnimKey(n); };

  if (step === 1) {
    return (
      <main className="auth-shell">
        <div key={animKey} className="wizard-card wizard-step-anim">
          <div className="wizard-content">
            <h1 className="wizard-title">Welcome to Todo App!</h1>
            <p className="wizard-subtitle">We can help you...</p>
            <div className="wizard-checklist">
              <div className={`wizard-check-item ${st1 ? 'active' : ''} ${dn1 ? 'done' : ''}`}><div className={`check-dot ${dn1 ? 'checked' : ''}`}>{dn1 && <Check size={14} />}</div><span className="text" style={{flex: 1, lineHeight: 1.4}}>Organize the everyday chaos</span></div>
              <div className={`wizard-check-item ${st2 ? 'active' : ''} ${dn2 ? 'done' : ''}`}><div className={`check-dot ${dn2 ? 'checked' : ''}`}>{dn2 && <Check size={14} />}</div><span className="text" style={{flex: 1, lineHeight: 1.4}}>Focus on the right things</span></div>
              <div className={`wizard-check-item ${st3 ? 'active' : ''} ${dn3 ? 'done' : ''}`}><div className={`check-dot ${dn3 ? 'checked' : ''}`}>{dn3 && <Check size={14} />}</div><span className="text" style={{flex: 1, lineHeight: 1.4}}>Achieve goals & finish projects</span></div>
              {st4 && (
                <div className="wizard-select-card selected" style={{ margin: '10px 0 0', padding: '12px 20px', justifyContent: 'center' }} onClick={() => nextStep(2)}>
                  <div className="check-dot checked" style={{borderColor: '#b42cff', background: 'transparent', boxShadow: 'none'}}><Check size={14} color="#b42cff" /></div>
                  <span style={{ color: '#dca2ff', fontWeight: 700, fontSize: '16px' }}>Now it’s your turn! ✨</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (step === 2) {
    return (
      <main className="auth-shell">
        <div key={animKey} className="wizard-card wizard-step-anim">
          <div className="wizard-content">
            <h1 className="wizard-title">What’s your name?</h1>
            <p className="wizard-subtitle">Let's personalize your workspace.</p>
            <input className="wizard-input" value={name} onChange={e => setName(e.target.value)} autoFocus placeholder="e.g. Surya" />
            <button className="primary-btn" style={{ width: '100%', fontSize: '16px', padding: '16px' }} onClick={() => nextStep(3)}>Next Step</button>
          </div>
        </div>
      </main>
    );
  }

  if (step === 3) {
    return (
      <main className="auth-shell">
        <div key={animKey} className="wizard-card wizard-step-anim">
          <div className="wizard-content">
            <h1 className="wizard-title">How will you use it?</h1>
            <p className="wizard-subtitle">Select your primary goal.</p>
            <div className="wizard-select-card" onClick={() => nextStep(4)}>
              <div className="wizard-icon-box">👤</div>
              <div><strong style={{color: '#fff', fontSize: '15px', display:'block'}}>For myself</strong><p style={{color:'#858798', fontSize:'13px', margin:0}}>Organize personal work and life.</p></div>
            </div>
            <div className="wizard-select-card" onClick={() => nextStep(4)}>
              <div className="wizard-icon-box">👥</div>
              <div><strong style={{color: '#fff', fontSize: '15px', display:'block'}}>With my team</strong><p style={{color:'#858798', fontSize:'13px', margin:0}}>Simple workspace for team projects.</p></div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (step === 4) {
    const opts = [{t: 'I write them on paper', i: '📝'}, {t: 'I use a different app', i: '📱'}, {t: 'Create events in calendar', i: '📅'}, {t: 'I try to remember them', i: '🧠'}];
    return (
      <main className="auth-shell">
        <div key={animKey} className="wizard-card wizard-step-anim">
          <div className="wizard-content">
            <h1 className="wizard-title">Current workflow?</h1>
            <p className="wizard-subtitle">How do you usually track tasks?</p>
            {opts.map((opt) => (
              <div key={opt.t} className="wizard-select-card" onClick={() => nextStep(5)}>
                <div className="wizard-icon-box" style={{fontSize: '20px'}}>{opt.i}</div>
                <span style={{ color: '#fff', fontWeight: 600, fontSize: '15px' }}>{opt.t}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (step === 5) {
    return (
      <main className="auth-shell">
        <div key={animKey} className="wizard-card wizard-step-anim">
          <div className="wizard-content">
            <h1 className="wizard-title">Manage events?</h1>
            <p className="wizard-subtitle">Sync tasks with your calendar.</p>
            <div className="wizard-select-card" onClick={() => nextStep(6)}>
              <div className="wizard-icon-box" style={{ background: '#e8f0fe', color: '#1a73e8', fontWeight: 700, fontSize: '16px' }}>31</div>
              <strong style={{color: '#fff', fontSize: '15px'}}>Connect Google Calendar</strong>
            </div>
            <div className="wizard-select-card" onClick={() => nextStep(6)}>
              <div className="wizard-icon-box" style={{ background: '#e0eaff', color: '#0078d4', fontWeight: 700, fontSize: '16px' }}>O</div>
              <strong style={{color: '#fff', fontSize: '15px'}}>Connect Outlook Calendar</strong>
            </div>
            <button className="ghost-btn" style={{ width: '100%', marginTop: '10px', padding: '16px' }} onClick={() => nextStep(6)}>Skip for now</button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="auth-shell">
      <div key={animKey} className="wizard-card wizard-step-anim" style={{ textAlign: 'center' }}>
        <div className="wizard-content">
          <div style={{ fontSize: '60px', margin: '10px 0 20px', filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.4))' }}>🎉</div>
          <h1 className="wizard-title">You’re all set!</h1>
          <p className="wizard-subtitle">Ready to conquer your goals?</p>
          <button className="primary-btn" style={{ width: '100%', padding: '16px', fontSize: '16px' }} onClick={onFinish}>Enter Workspace 🚀</button>
        </div>
      </div>
    </main>
  );
}

function AuthScreen({ mode, onModeChange, onAuthenticate }: { mode: 'login' | 'signup'; onModeChange: (mode: 'login' | 'signup') => void; onAuthenticate: (username: string, password: string, mode: 'login' | 'signup') => string }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [animKey, setAnimKey] = useState(0); 

  const signup = mode === 'signup';

  const switchMode = (newMode: 'login' | 'signup') => {
    triggerVibrate(20); setError(''); setSuccess(''); onModeChange(newMode); setAnimKey(prev => prev + 1);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault(); setError(''); setSuccess('');
    if (signup && password !== confirm) { setError('Passwords do not match.'); triggerVibrate([50, 50]); return; }
    
    const result = onAuthenticate(username, password, mode);
    if (result === 'SUCCESS_SIGNUP') {
      triggerVibrate(100);
      setSuccess('Account created successfully! Please log in.');
      setUsername(''); setPassword(''); setConfirm('');
      onModeChange('login'); setAnimKey(prev => prev + 1);
    } else if (result) {
      setError(result); triggerVibrate([50, 50]);
    }
  };

  return (
    <main className="auth-shell">
      <div className="auth-orbit orbit-one" /><div className="auth-orbit orbit-two" />
      <section key={animKey} className="auth-card auth-switch-anim">
        <div className="brand large"><span className="brand-mark"><Zap size={24} fill="currentColor" /></span><span>Todo App</span></div>
        <div className="auth-copy">
          <span className="eyebrow"><Sparkles size={14} /> YOUR PERSONAL WORKSPACE</span>
          <h1>{signup ? 'Start flowing.' : 'Welcome back.'}</h1>
        </div>
        <div className="auth-tabs">
          <button type="button" className={!signup ? 'active' : ''} onClick={() => switchMode('login')}>Sign in</button>
          <button type="button" className={signup ? 'active' : ''} onClick={() => switchMode('signup')}>Register</button>
        </div>
        <form onSubmit={submit} className="auth-form">
          <label>Username<input autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="e.g. alex" required /></label>
          <label>Password<input type="password" autoComplete={signup ? 'new-password' : 'current-password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={signup ? 'At least 6 characters' : 'Your password'} required /></label>
          {signup && <label>Confirm password<input type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Repeat your password" required /></label>}
          {error && <p className="form-error">{error}</p>}
          {success && <p className="form-success">{success}</p>}
          <button className="primary-btn auth-btn" type="submit">{signup ? 'Create my workspace' : 'Enter Todo App'} <span>→</span></button>
        </form>
      </section>
    </main>
  );
}

function Dashboard({ username, onLogout }: { username: string; onLogout: () => void }) {
  const storageKey = `todo_tasks_${username}`;
  // Safe Fallback for Tasks Array
  const [tasks, setTasks] = useState<Task[]>(() => {
    const data = readData<Task[]>(storageKey, []);
    return Array.isArray(data) ? data : [];
  });
  
  const navItems = ['Inbox', 'Today', 'Upcoming', 'Filters & Labels', 'Reporting / PDF'] as const;
  const [activeNav, setActiveNav] = useState<typeof navItems[number]>('Today');
  
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Completed'>('All');
  
  const [showModal, setShowModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false); 
  const [editing, setEditing] = useState<Task | null>(null);
  const [toast, setToast] = useState('');
  const alerted = useRef(new Set<string>());

  useEffect(() => { saveData(storageKey, tasks); }, [tasks, storageKey]);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') void Notification.requestPermission();
    const interval = window.setInterval(() => {
      const now = new Date().getTime();
      setTasks((current) => current.map((task) => {
        // Safe check for missing/corrupted deadline
        if (!task.deadline) return task;
        const d = new Date(task.deadline);
        if (isNaN(d.getTime())) return task; // Stop crash if date is invalid

        const due = d.getTime();
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
  
  useEffect(() => { if (!toast) return; const timer = window.setTimeout(() => setToast(''), 3500); return () => window.clearTimeout(timer); }, [toast]);

  // Date Logic for correct filtering
  const todayISO = getLocalISOTime().split('T')[0];
  const getFutureISO = (daysToAdd: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysToAdd);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split('T')[0];
  };
  const tomorrowISO = getFutureISO(1);
  const next7ISO = getFutureISO(7);

  // Logic for different Views (Tasks Sorting and Filtering with Fallbacks)
  const viewTasks = useMemo(() => {
    let list = [...tasks];

    // Safe Search Query
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(t => (t.title || '').toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q) || (t.categories || []).some(c => c.toLowerCase().includes(q)));
    }

    // View specific filtering
    if (activeNav === 'Today') {
      list = list.filter(t => (t.deadline || '').startsWith(todayISO));
    } else if (activeNav === 'Upcoming') {
      list = list.filter(t => {
        const datePart = (t.deadline || '').split('T')[0];
        return datePart >= tomorrowISO && datePart <= next7ISO;
      });
    } 

    if (statusFilter === 'Pending') list = list.filter(t => !t.completed);
    if (statusFilter === 'Completed') list = list.filter(t => t.completed);
    
    // Universal Date Sorting Logic for Inbox and All views
    list.sort((a, b) => {
      // 1. Always move completed tasks to the bottom
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      
      // 2. Sort chronologically by Date & Time (Overdue/Earliest comes first)
      const timeA = new Date(a.deadline || 0).getTime();
      const timeB = new Date(b.deadline || 0).getTime();
      const dateDiff = (isNaN(timeA) ? 0 : timeA) - (isNaN(timeB) ? 0 : timeB);
      if (dateDiff !== 0) return dateDiff;
      
      // 3. If exact same time, sort by Priority
      return (prioWeight[b.priority] || 0) - (prioWeight[a.priority] || 0);
    });

    return list;
  }, [tasks, activeNav, todayISO, tomorrowISO, next7ISO, query, statusFilter]);
  
  const openCreate = () => { triggerVibrate(30); setEditing(null); setShowModal(true); };
  const saveTask = (task: Task) => { triggerVibrate([30, 50]); setTasks((current) => editing ? current.map((item) => item.id === task.id ? task : item) : [task, ...current]); setShowModal(false); };
  const toggleTask = (id: string) => { triggerVibrate(40); setTasks((current) => current.map((task) => task.id === id ? { ...task, completed: !task.completed } : task)); };
  const deleteTask = (id: string) => { triggerVibrate([50, 100]); setTasks((current) => current.filter((task) => task.id !== id)); };

  const handleClearCompleted = () => { triggerVibrate(50); setTasks((current) => current.filter((t) => !t.completed)); setShowSettings(false); setProfileMenuOpen(false); };
  const handleWipeData = () => { if (confirm('Are you sure you want to delete all tasks?')) { triggerVibrate([100, 100]); setTasks([]); setShowSettings(false); setProfileMenuOpen(false); } };

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark"><Zap size={18} fill="currentColor" /></span><span>Todo App</span></div>
      <nav className="main-nav">
        <button className={activeNav === 'Inbox' ? 'selected' : ''} onClick={() => { setActiveNav('Inbox'); triggerVibrate(20); }}>
          <Inbox size={18} /> Inbox <span className="nav-count">{tasks.length}</span>
        </button>
        <button className={activeNav === 'Today' ? 'selected' : ''} onClick={() => { setActiveNav('Today'); triggerVibrate(20); }}>
          <CalendarDays size={18} /> Today
        </button>
        <button className={activeNav === 'Upcoming' ? 'selected' : ''} onClick={() => { setActiveNav('Upcoming'); triggerVibrate(20); }}>
          <Target size={18} /> Upcoming
        </button>
        <button className={activeNav === 'Filters & Labels' ? 'selected' : ''} onClick={() => { setActiveNav('Filters & Labels'); triggerVibrate(20); }}>
          <Filter size={18} /> Filters & Labels
        </button>
        <button className={activeNav === 'Reporting / PDF' ? 'selected' : ''} onClick={() => { setActiveNav('Reporting / PDF'); triggerVibrate(20); }}>
          <FileText size={18} /> Reporting / PDF
        </button>
      </nav>
      <div className="sidebar-bottom">
        <button onClick={() => { triggerVibrate(20); setShowSettings(true); }}><Settings size={18} /> Settings</button>
        <button onClick={() => { triggerVibrate(20); setShowHelp(true); }}><CircleHelp size={18} /> Help center</button>
        <div className="profile"><div className="avatar">{username.slice(0, 1).toUpperCase()}</div><div><strong>{username}</strong><small>Personal workspace</small></div><button className="logout-btn" onClick={onLogout} title="Logout"><LogOut size={16} /></button></div>
      </div>
    </aside>
    
    <section className="content">
      <header className="topbar">
        <div className="breadcrumb">{activeNav}</div>
        <div className="mobile-brand"><span className="brand-mark"><Zap size={16} fill="currentColor"/></span> Todo App</div>
        <div className="topbar-actions">
          <button className="primary-btn" onClick={openCreate} style={{ padding: '8px 14px', fontSize: '13px' }}><Plus size={16} /> Add Task</button>
          <button className="mobile-profile-btn" onClick={() => { triggerVibrate(20); setProfileMenuOpen(true); }}><div className="avatar">{username.slice(0, 1).toUpperCase()}</div></button>
        </div>
      </header>
      
      <main className="main-content">
        {activeNav === 'Reporting / PDF' ? (
           <ReportView tasks={tasks} />
        ) : (
          <div className="task-section" style={{ marginTop: 0 }}>
            <div className="hero-row" style={{ marginBottom: '20px' }}>
              <div>
                <h1>{activeNav}</h1>
                <p>{activeNav === 'Inbox' ? 'All your tasks in one place.' : activeNav === 'Filters & Labels' ? 'Sorted by Date and Priority.' : 'Focus on what matters.'}</p>
              </div>
            </div>
            
            {activeNav === 'Upcoming' && (
              <div className="timeline-group">
                <div className="timeline-header"><CalendarDays size={18} color="#b42cff" /> Next 7 Days</div>
              </div>
            )}

            <div className="task-tools">
              <label className="search-box">
                <Search size={17} />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search tasks..." />
              </label>
            </div>

            <div className="filter-row">
              <button className={statusFilter === 'All' ? 'active' : ''} onClick={() => setStatusFilter('All')}>All tasks</button>
              <button className={statusFilter === 'Pending' ? 'active' : ''} onClick={() => setStatusFilter('Pending')}>Pending</button>
              <button className={statusFilter === 'Completed' ? 'active' : ''} onClick={() => setStatusFilter('Completed')}>Completed</button>
            </div>

            <div className="task-list">
              {viewTasks.length ? viewTasks.map((task) => (
                <TaskCard key={task.id} task={task} onToggle={toggleTask} onEdit={() => { triggerVibrate(20); setEditing(task); setShowModal(true); }} onDelete={deleteTask} />
              )) : (
                <div className="empty-state" style={{textAlign: 'center', padding: '60px', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '20px'}}>
                  <div style={{color: '#858798', marginBottom: '15px'}}><ListTodo size={40} /></div>
                  <h3 style={{color: '#fff', margin: '0 0 5px'}}>No tasks found here</h3>
                  <p style={{color: '#858798', fontSize: '14px'}}>Add a new task to get started.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </section>

    <nav className="bottom-nav">
      <button className={activeNav === 'Inbox' ? 'selected' : ''} onClick={() => setActiveNav('Inbox')}><Inbox size={22} /><span>Inbox</span></button>
      <button className={activeNav === 'Today' ? 'selected' : ''} onClick={() => setActiveNav('Today')}><CalendarDays size={22} /><span>Today</span></button>
      <button className={activeNav === 'Filters & Labels' ? 'selected' : ''} onClick={() => setActiveNav('Filters & Labels')}><Filter size={22} /><span>Filters</span></button>
      <button className={activeNav === 'Reporting / PDF' ? 'selected' : ''} onClick={() => setActiveNav('Reporting / PDF')}><FileText size={22} /><span>Report</span></button>
    </nav>
    
    {profileMenuOpen && (
      <div className="modal-backdrop" onClick={() => setProfileMenuOpen(false)}>
        <div className="task-modal" onClick={e => e.stopPropagation()} style={{ padding: '30px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '20px' }}>
            <div className="avatar" style={{ width: '50px', height: '50px', fontSize: '20px' }}>{username.slice(0, 1).toUpperCase()}</div>
            <div><strong style={{ color: '#fff', fontSize: '18px', display: 'block' }}>{username}</strong><small style={{ color: '#858798', fontSize: '13px' }}>Personal workspace</small></div>
            <button onClick={() => setProfileMenuOpen(false)} style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.08)', border: 0, color: '#fff', padding: '8px', borderRadius: '50%', cursor: 'pointer' }}><X size={18}/></button>
          </div>
          <div className="mobile-menu-sheet">
            <button type="button" onClick={() => { setProfileMenuOpen(false); setTimeout(() => setShowSettings(true), 100); }}><Settings size={20} color="#b42cff" /> App Settings</button>
            <button type="button" onClick={() => { setProfileMenuOpen(false); setTimeout(() => setShowHelp(true), 100); }}><CircleHelp size={20} color="#42a5f5" /> Help Center</button>
            <button type="button" className="danger" onClick={onLogout}><LogOut size={20} /> Log Out securely</button>
          </div>
        </div>
      </div>
    )}

    {showModal && <TaskModal initial={editing} onClose={() => setShowModal(false)} onSave={saveTask} />}
    {showSettings && <SettingsModal onClear={handleClearCompleted} onWipe={handleWipeData} onClose={() => setShowSettings(false)} />}
    {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
  </div>;
}

function ReportView({ tasks }: { tasks: Task[] }) {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const setRange = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    end.setMinutes(end.getMinutes() - end.getTimezoneOffset());
    start.setMinutes(start.getMinutes() - start.getTimezoneOffset());
    
    setToDate(end.toISOString().split('T')[0]);
    setFromDate(start.toISOString().split('T')[0]);
  };

  const downloadCustomPDF = () => {
    triggerVibrate(30);
    const doc = new jsPDF();
    doc.text(`Todo App - Custom PDF Report`, 14, 15);
    doc.setFontSize(10);
    doc.text(`Date Range: ${fromDate || 'All Time'} to ${toDate || 'All Time'}`, 14, 22);
    
    let filtered = tasks;
    if (fromDate) filtered = filtered.filter(t => (t.deadline || '').split('T')[0] >= fromDate);
    if (toDate) filtered = filtered.filter(t => (t.deadline || '').split('T')[0] <= toDate);

    const tableData = filtered.map(t => [ t.title, (t.categories || []).join(', '), t.priority, t.completed ? 'Completed' : 'Pending', formatDate(t.deadline) ]);
    
    autoTable(doc, { head: [['Task Name', 'Categories', 'Priority', 'Status', 'Deadline']], body: tableData, startY: 30, theme: 'grid', styles: { fontSize: 10 }, headStyles: { fillColor: [180, 44, 255] } });
    doc.save(`Todo_App_Report.pdf`);
  };

  return (
    <div className="task-section" style={{ marginTop: 0 }}>
      <div className="hero-row">
        <div><h1>Productivity Reports</h1><p>Filter tasks by dates and export your activity as PDF.</p></div>
      </div>
      <div className="report-box">
        <div className="report-quick-btns">
          <button onClick={() => setRange(7)}>Weekly</button>
          <button onClick={() => setRange(30)}>Monthly</button>
          <button onClick={() => setRange(365)}>Yearly</button>
        </div>
        <div className="report-inputs">
          <label>From Date<input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} /></label>
          <label>To Date<input type="date" value={toDate} onChange={e => setToDate(e.target.value)} /></label>
        </div>
        <button className="primary-btn" onClick={downloadCustomPDF} style={{ width: '100%', marginTop: '20px' }}><FileText size={18} /> Export Custom PDF</button>
      </div>
    </div>
  );
}

function TaskCard({ task, onToggle, onEdit, onDelete }: { task: Task; onToggle: (id: string) => void; onEdit: () => void; onDelete: (id: string) => void }) { 
  const taskDate = new Date(task.deadline || 0);
  const isOverdue = !task.completed && !isNaN(taskDate.getTime()) && taskDate.getTime() < new Date().getTime();
  
  return (
    <article className={`task-card ${task.color} ${task.completed ? 'done' : ''}`} style={isOverdue ? { borderColor: 'rgba(255, 80, 80, 0.5)' } : {}}>
      <button className={`check-circle ${task.completed ? 'checked' : ''}`} style={isOverdue ? { borderColor: 'rgba(255, 80, 80, 0.5)' } : {}} onClick={() => onToggle(task.id)}>{task.completed && <Check size={15} />}</button>
      <div className="task-emoji">{task.emoji}</div>
      <div className="task-info">
        <div className="task-title-row">
          <h3 style={isOverdue && !task.completed ? { color: '#ff8f9c' } : {}}>{task.title}</h3>
          {!task.completed && <span className="due-chip" style={isOverdue ? { background: 'rgba(255,80,80,0.15)', color: '#ff6b6b', borderColor: 'rgba(255,80,80,0.3)' } : {}}>{isOverdue ? 'Overdue' : timeLabel(task.deadline)}</span>}
        </div>
        <p>{task.description || 'No description added.'}</p>
        <div className="task-meta">
          <span style={isOverdue && !task.completed ? { color: '#ff8f9c' } : {}}><CalendarDays size={13} /> {formatDate(task.deadline)}</span>
          {(task.categories || []).map((category) => <span key={category} className={`category-pill ${categoryClass(category)}`}>{categories.find((item) => item.label === category)?.emoji} {category}</span>)}
          <span className="category-pill" style={{border: '1px solid rgba(255,255,255,0.1)', opacity: 0.8}}>⚡ {task.priority}</span>
        </div>
      </div>
      <div className="task-actions"><button onClick={onEdit}><Edit3 size={16} /></button><button onClick={() => onDelete(task.id)}><Trash2 size={16} /></button></div>
    </article>
  ); 
}

function TaskModal({ initial, onClose, onSave }: { initial: Task | null; onClose: () => void; onSave: (task: Task) => void }) {
  const nowISO = getLocalISOTime();
  const [title, setTitle] = useState(initial?.title ?? ''); const [description, setDescription] = useState(initial?.description ?? ''); const [deadline, setDeadline] = useState(initial?.deadline ?? nowISO); const [selected, setSelected] = useState<Category[]>(initial?.categories ?? []); const [color, setColor] = useState<TaskColor>(initial?.color ?? 'violet'); const [priority, setPriority] = useState<Priority>(initial?.priority ?? 'Medium'); const [emoji, setEmoji] = useState(initial?.emoji ?? '✨'); const [emojiOpen, setEmojiOpen] = useState(false); const [emojiSearch, setEmojiSearch] = useState(''); const [error, setError] = useState('');
  
  const submit = (event: FormEvent) => { event.preventDefault(); if (!title.trim() || !deadline || selected.length === 0) { setError('Add a task name, deadline, and at least one category.'); triggerVibrate([50,50]); return; } onSave({ id: initial?.id ?? crypto.randomUUID(), title: title.trim(), description: description.trim(), deadline, categories: selected, color, emoji, completed: initial?.completed ?? false, priority }); };
  return <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}><div className="task-modal"><div className="modal-header"><div><span className="eyebrow"><Sparkles size={14} /> {initial ? 'REFINE YOUR TASK' : 'CREATE A NEW TASK'}</span><h2>{initial ? 'Edit task' : 'Add new task'}</h2></div><button type="button" onClick={onClose}><X size={20} /></button></div><form onSubmit={submit}><div className="emoji-picker"><button type="button" className="emoji-orb" onClick={() => { triggerVibrate(20); setEmojiOpen(!emojiOpen); }}>{emoji}<span><Edit3 size={13} /></span></button>{emojiOpen && <div className="emoji-popover"><div className="emoji-search"><Search size={15} /><input autoFocus value={emojiSearch} onChange={(e) => setEmojiSearch(e.target.value)} placeholder="Search emoji..." /></div><div className="emoji-grid">{emojis.filter((item) => !emojiSearch || item.includes(emojiSearch)).map((item) => <button type="button" key={item} onClick={() => { triggerVibrate(20); setEmoji(item); setEmojiOpen(false); }}>{item}</button>)}</div></div>}</div><div className="form-grid"><label>Task name *<input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What needs your attention?" autoFocus={!initial} /></label><label>Date & Time *<input type="datetime-local" min={initial ? undefined : nowISO} value={deadline} onChange={(e) => setDeadline(e.target.value)} /></label><label className="full">Task description<textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Add a little context..." rows={3} /></label></div><div className="modal-label">Priority</div><div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>{(['High', 'Medium', 'Low'] as Priority[]).map((p) => ( <button type="button" key={p} onClick={() => { triggerVibrate(15); setPriority(p); }} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: priority === p ? '2px solid #b42cff' : '1px solid rgba(255,255,255,0.1)', background: priority === p ? 'rgba(180,44,255,0.15)' : 'transparent', color: '#fff', cursor: 'pointer', transition: '0.2s' }}>{p}</button> ))}</div><div className="modal-label">Categories <span>Select up to 3</span></div><div className="category-options">{categories.map((category) => <button type="button" key={category.label} className={`${categoryClass(category.label)} ${selected.includes(category.label) ? 'selected' : ''}`} onClick={() => { triggerVibrate(15); setSelected((current) => current.includes(category.label) ? current.filter((item) => item !== category.label) : current.length < 3 ? [...current, category.label] : current); }} style={{cursor: 'pointer'}}>{category.emoji} {category.label}{selected.includes(category.label) && <Check size={14} />}</button>)}</div><div className="modal-label">Task color</div><div className="color-options">{taskColors.map((item) => <button type="button" key={item.value} className={color === item.value ? 'selected' : ''} onClick={() => { triggerVibrate(15); setColor(item.value); }} style={{cursor: 'pointer'}}><i style={{ background: item.hex }} />{item.label}{color === item.value && <Check size={14} />}</button>)}</div>{error && <p className="form-error">{error}</p>}<div className="modal-footer"><button type="button" className="ghost-btn" onClick={onClose}>Cancel</button><button className="primary-btn" type="submit">{initial ? 'Save changes' : 'Create task'}</button></div></form></div></div>;
}

function HelpModal({ onClose }: { onClose: () => void }) { return ( <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}><div className="task-modal" style={{ maxWidth: '500px' }}><div className="modal-header"><div><span className="eyebrow"><CircleHelp size={14} /> SUPPORT</span><h2>Help Center</h2></div><button type="button" onClick={onClose}><X size={20} /></button></div><div style={{ marginTop: '20px', color: '#b7b8c5', fontSize: '13px', lineHeight: '1.6' }}><h3 style={{ color: '#fff', fontSize: '15px', margin: '15px 0 5px' }}>📌 How to add a task?</h3><p>Click the "Add task" button on the dashboard. Fill in the task name, select a deadline, and choose categories.</p><h3 style={{ color: '#fff', fontSize: '15px', margin: '15px 0 5px' }}>⚡ How to set priority?</h3><p>While creating or editing a task, use the Priority buttons (High, Medium, Low) to set importance.</p></div><div className="modal-footer"><button type="button" className="primary-btn" onClick={onClose}>Got it</button></div></div></div> ); }
function SettingsModal({ onClear, onWipe, onClose }: { onClear: () => void; onWipe: () => void; onClose: () => void }) { return ( <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}><div className="task-modal" style={{ maxWidth: '450px' }}><div className="modal-header"><div><span className="eyebrow"><Settings size={14} /> PREFERENCES</span><h2>Settings</h2></div><button type="button" onClick={onClose}><X size={20} /></button></div><div style={{ marginTop: '20px', display: 'grid', gap: '15px' }}><div style={{ padding: '15px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}><strong style={{ color: '#fff', display: 'block', marginBottom: '5px' }}>Clear Completed Tasks</strong><button type="button" className="ghost-btn" style={{ padding: '8px 12px', fontSize: '12px' }} onClick={onClear}>Clear Completed</button></div><div style={{ padding: '15px', background: 'rgba(255,80,80,0.1)', borderRadius: '12px', border: '1px solid rgba(255,80,80,0.2)' }}><strong style={{ color: '#ff6b6b', display: 'block', marginBottom: '5px' }}>Wipe All Data</strong><button type="button" className="primary-btn" style={{ background: '#ff4757', boxShadow: 'none', padding: '8px 12px', fontSize: '12px' }} onClick={onWipe}>Delete All Data</button></div></div></div></div> ); }

function greeting() { const hour = new Date().getHours(); return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'; }

function formatDate(value: string) { 
  if (!value) return ''; 
  const d = new Date(value);
  if (isNaN(d.getTime())) return value; 
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(d); 
}

function timeLabel(value: string) { 
  if (!value) return ''; 
  const d = new Date(value);
  if (isNaN(d.getTime())) return ''; 

  const difference = d.getTime() - new Date().getTime(); 
  const hours = Math.round(difference / (1000 * 3600)); 
  const days = Math.round(difference / (1000 * 3600 * 24)); 
  if (difference < 0) return 'Overdue'; 
  if (hours < 24) { 
    if (hours <= 0) return 'Due soon'; 
    return `In ${hours} h`; 
  } 
  if (days === 1) return 'Tomorrow'; 
  return `In ${days} days`; 
}

function categoryClass(category: Category) { return category === 'Home' ? 'cat-green' : category === 'Work' ? 'cat-blue' : category === 'Health/Fitness' ? 'cat-yellow' : category === 'Education' ? 'cat-orange' : 'cat-pink'; }