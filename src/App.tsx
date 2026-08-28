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
  id: string; title: string; description: string; deadline: string; // Stored as ISO DateTime String
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

const prioWeight = { High: 3, Medium: 2, Low: 1 };

const triggerVibrate = (duration: number | number[] = 50) => {
  if (typeof window !== 'undefined' && navigator.vibrate) navigator.vibrate(duration as VibratePattern);
};

// Helper: Get local Date string safely format YYYY-MM-DDTHH:mm
const getLocalISOTime = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

export default function App() {
  const [session, setSession] = useState(() => localStorage.getItem('todo_session'));
  const [users, setUsers] = useState<User[]>(() => readData<User[]>('todo_users', []));
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

// 6-Step Registration Wizard (Step 1 Click to Next Fixed)
function OnboardingWizard({ onFinish }: { onFinish: () => void }) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [plan, setPlan] = useState('For myself');
  const [manageStyle, setManageStyle] = useState('');

  const [checked1, setChecked1] = useState(false);
  const [checked2, setChecked2] = useState(false);
  const [checked3, setChecked3] = useState(false);
  const [checked4, setChecked4] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (step === 1) {
      const t1 = setTimeout(() => setChecked1(true), 700);
      const t2 = setTimeout(() => setChecked2(true), 1500);
      const t3 = setTimeout(() => setChecked3(true), 2300);
      const t4 = setTimeout(() => setReady(true), 3000);
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
    }
  }, [step]);

  if (step === 1) {
    return (
      <main className="auth-shell">
        <div className="auth-card auth-switch-anim" style={{ textAlign: 'center' }}>
          <h1 style={{ color: '#fff', fontSize: '28px', fontFamily: 'Space Grotesk', margin: '0 0 10px' }}>Welcome to Todo App!</h1>
          <div className="checklist-box">
            <h4 style={{ color: '#fff', margin: 0 }}>Todo App can help you...</h4>
            <div className={`checklist-item ${checked1 ? 'done' : ''}`}><div className={`check-dot ${checked1 ? 'checked' : ''}`}>{checked1 && <Check size={14} />}</div><span>Organize the everyday chaos</span></div>
            <div className={`checklist-item ${checked2 ? 'done' : ''}`}><div className={`check-dot ${checked2 ? 'checked' : ''}`}>{checked2 && <Check size={14} />}</div><span>Focus on the right things</span></div>
            <div className={`checklist-item ${checked3 ? 'done' : ''}`}><div className={`check-dot ${checked3 ? 'checked' : ''}`}>{checked3 && <Check size={14} />}</div><span>Achieve goals and finish projects</span></div>
            {ready && (
              <div className="checklist-item" style={{ color: '#b42cff', fontWeight: 600, cursor: 'pointer' }} onClick={() => { triggerVibrate(20); setChecked4(true); setTimeout(() => setStep(2), 500); }}>
                <div className={`check-dot ${checked4 ? 'checked' : ''}`} style={{ borderColor: '#b42cff' }}>{checked4 && <Check size={14} />}</div>
                <span>Now it’s your turn! ✨</span>
              </div>
            )}
          </div>
        </div>
      </main>
    );
  }

  if (step === 2) {
    return (
      <main className="auth-shell">
        <div className="auth-card auth-switch-anim" style={{ textAlign: 'center' }}>
          <h1 style={{ color: '#fff', fontSize: '28px', fontFamily: 'Space Grotesk', margin: '0 0 10px' }}>What’s your name?</h1>
          <p style={{ color: '#888a9c', fontSize: '15px', marginBottom: '25px' }}>Complete your profile now.</p>
          <div className="form-grid" style={{ textAlign: 'left', marginBottom: '20px' }}>
            <label>Your name<input value={name} onChange={e => setName(e.target.value)} autoFocus placeholder="Enter name" /></label>
          </div>
          <button className="primary-btn" style={{ width: '100%' }} onClick={() => {triggerVibrate(20); setStep(3);}}>Next</button>
        </div>
      </main>
    );
  }

  if (step === 3) {
    return (
      <main className="auth-shell">
        <div className="auth-card auth-switch-anim" style={{ textAlign: 'center' }}>
          <h1 style={{ color: '#fff', fontSize: '28px', fontFamily: 'Space Grotesk', margin: '0 0 10px' }}>How do you plan to use it?</h1>
          <p style={{ color: '#888a9c', fontSize: '15px', marginBottom: '25px' }}>Select one to get started.</p>
          <div className={`select-card ${plan === 'For myself' ? 'selected' : ''}`} onClick={() => setPlan('For myself')}>
            <div className="select-card-icon">👤</div>
            <div><strong>For myself</strong><p>I want a personal space to organize my work and life.</p></div>
          </div>
          <div className={`select-card ${plan === 'With my team' ? 'selected' : ''}`} onClick={() => setPlan('With my team')}>
            <div className="select-card-icon">👥</div>
            <div><strong>With my team</strong><p>I want a simple yet powerful home for my team’s work.</p></div>
          </div>
          <button className="primary-btn" style={{ width: '100%', marginTop: '10px' }} onClick={() => {triggerVibrate(20); setStep(4);}}>Continue</button>
        </div>
      </main>
    );
  }

  if (step === 4) {
    const opts = ['I write them on paper', 'I use a different app', 'I create events in calendar', 'I try to remember them'];
    return (
      <main className="auth-shell">
        <div className="auth-card auth-switch-anim" style={{ textAlign: 'center' }}>
          <h1 style={{ color: '#fff', fontSize: '28px', fontFamily: 'Space Grotesk', margin: '0 0 10px' }}>Current workflow?</h1>
          <p style={{ color: '#888a9c', fontSize: '15px', marginBottom: '25px' }}>Pick the option that you use the most.</p>
          {opts.map((opt, i) => (
            <div key={opt} className="select-card" onClick={() => { triggerVibrate(20); setManageStyle(opt); setStep(5); }}>
              <div className="option-badge">{String.fromCharCode(65 + i)}</div>
              <span style={{ color: '#fff', fontWeight: 600 }}>{opt}</span>
            </div>
          ))}
        </div>
      </main>
    );
  }

  if (step === 5) {
    return (
      <main className="auth-shell">
        <div className="auth-card auth-switch-anim" style={{ textAlign: 'center' }}>
          <h1 style={{ color: '#fff', fontSize: '28px', fontFamily: 'Space Grotesk', margin: '0 0 10px' }}>Manage events?</h1>
          <p style={{ color: '#888a9c', fontSize: '15px', marginBottom: '25px' }}>Sync your calendar.</p>
          <div className="select-card" onClick={() => {triggerVibrate(20); setStep(6);}}>
            <div className="select-card-icon" style={{ background: '#e8f0fe', color: '#1a73e8', fontWeight: 700 }}>31</div>
            <div><strong>Connect Google Calendar</strong></div>
          </div>
          <div className="select-card" onClick={() => {triggerVibrate(20); setStep(6);}}>
            <div className="select-card-icon" style={{ background: '#e0eaff', color: '#0078d4', fontWeight: 700 }}>O</div>
            <div><strong>Connect Outlook Calendar</strong></div>
          </div>
          <button className="ghost-btn" style={{ width: '100%', marginTop: '10px' }} onClick={() => {triggerVibrate(20); setStep(6);}}>Skip</button>
        </div>
      </main>
    );
  }

  return (
    <main className="auth-shell">
      <div className="auth-card auth-switch-anim" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '50px', marginBottom: '10px' }}>🎉</div>
        <h1 style={{ color: '#fff', fontSize: '28px', fontFamily: 'Space Grotesk', margin: '0 0 10px' }}>You’re all set!</h1>
        <p style={{ color: '#888a9c', fontSize: '15px', marginBottom: '25px' }}>Welcome to Todo App. Ready to organize your life?</p>
        <button className="primary-btn" style={{ width: '100%' }} onClick={onFinish}>Enter Workspace</button>
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
  const [tasks, setTasks] = useState<Task[]>(() => readData<Task[]>(storageKey, []));
  
  // Navigation Options
  const navItems = ['Inbox', 'Today', 'Upcoming', 'Filters & Labels', 'Reporting / PDF'] as const;
  const [activeNav, setActiveNav] = useState<typeof navItems[number]>('Today');
  
  // States
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

  // Logic for different Views
  const viewTasks = useMemo(() => {
    let list = [...tasks];

    // Search Query
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(t => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || t.categories.some(c => c.toLowerCase().includes(q)));
    }

    // View specific filtering
    if (activeNav === 'Today') {
      list = list.filter(t => t.deadline.startsWith(todayISO));
    } else if (activeNav === 'Upcoming') {
      // Future tasks between tomorrow and next 7 days
      list = list.filter(t => t.deadline.split('T')[0] >= tomorrowISO && t.deadline.split('T')[0] <= next7ISO);
    } 

    // Status Filter (Top tabs inside tasks view)
    if (statusFilter === 'Pending') list = list.filter(t => !t.completed);
    if (statusFilter === 'Completed') list = list.filter(t => t.completed);
    
    // Sort logic
    list.sort((a, b) => {
      if (activeNav === 'Filters & Labels' || activeNav === 'Upcoming') {
        const dateDiff = new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        if (dateDiff !== 0) return dateDiff;
        return prioWeight[b.priority] - prioWeight[a.priority];
      }
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return prioWeight[b.priority] - prioWeight[a.priority];
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
    {/* DESKTOP SIDEBAR */}
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
      {/* HEADER */}
      <header className="topbar">
        <div className="breadcrumb">{activeNav}</div>
        <div className="mobile-brand"><span className="brand-mark"><Zap size={16} fill="currentColor"/></span> Todo App</div>
        <div className="topbar-actions">
          <button className="primary-btn" onClick={openCreate} style={{ padding: '8px 14px', fontSize: '13px' }}><Plus size={16} /> Add Task</button>
          <button className="mobile-profile-btn" onClick={() => { triggerVibrate(20); setProfileMenuOpen(true); }}><div className="avatar">{username.slice(0, 1).toUpperCase()}</div></button>
        </div>
      </header>
      
      <main className="main-content">
        {/* CUSTOM PDF REPORTING VIEW */}
        {activeNav === 'Reporting / PDF' ? (
           <ReportView tasks={tasks} />
        ) : (
          /* STANDARD TASK VIEWS */
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

            {/* Premium Glass Search Box */}
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

    {/* MOBILE BOTTOM NAV */}
    <nav className="bottom-nav">
      <button className={activeNav === 'Inbox' ? 'selected' : ''} onClick={() => setActiveNav('Inbox')}><Inbox size={22} /><span>Inbox</span></button>
      <button className={activeNav === 'Today' ? 'selected' : ''} onClick={() => setActiveNav('Today')}><CalendarDays size={22} /><span>Today</span></button>
      <button className={activeNav === 'Filters & Labels' ? 'selected' : ''} onClick={() => setActiveNav('Filters & Labels')}><Filter size={22} /><span>Filters</span></button>
      <button className={activeNav === 'Reporting / PDF' ? 'selected' : ''} onClick={() => setActiveNav('Reporting / PDF')}><FileText size={22} /><span>Report</span></button>
    </nav>
    
    {/* MOBILE PROFILE MENU */}
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

// Custom Reporting View Component
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
    if (fromDate) filtered = filtered.filter(t => t.deadline.split('T')[0] >= fromDate);
    if (toDate) filtered = filtered.filter(t => t.deadline.split('T')[0] <= toDate);

    const tableData = filtered.map(t => [ t.title, t.categories.join(', '), t.priority, t.completed ? 'Completed' : 'Pending', formatDate(t.deadline) ]);
    
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
  const isOverdue = !task.completed && new Date(task.deadline).getTime() < new Date().getTime();
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
          {task.categories.map((category) => <span key={category} className={`category-pill ${categoryClass(category)}`}>{categories.find((item) => item.label === category)?.emoji} {category}</span>)}
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
  return <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}><div className="task-modal"><div className="modal-header"><div><span className="eyebrow"><Sparkles size={14} /> {initial ? 'REFINE YOUR TASK' : 'CREATE A NEW TASK'}</span><h2>{initial ? 'Edit task' : 'Add new task'}</h2></div><button type="button" onClick={onClose}><X size={20} /></button></div><form onSubmit={submit}><div className="emoji-picker"><button type="button" className="emoji-orb" onClick={() => { triggerVibrate(20); setEmojiOpen(!emojiOpen); }}>{emoji}<span><Edit3 size={13} /></span></button>{emojiOpen && <div className="emoji-popover"><div className="emoji-search"><Search size={15} /><input autoFocus value={emojiSearch} onChange={(e) => setEmojiSearch(e.target.value)} placeholder="Search emoji..." /></div><div className="emoji-grid">{emojis.filter((item) => !emojiSearch || item.includes(emojiSearch)).map((item) => <button type="button" key={item} onClick={() => { triggerVibrate(20); setEmoji(item); setEmojiOpen(false); }}>{item}</button>)}</div></div>}</div><div className="form-grid"><label>Task name *<input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What needs your attention?" autoFocus={!initial} /></label><label>Date & Time *<input type="datetime-local" min={initial ? undefined : nowISO} value={deadline} onChange={(e) => setDeadline(e.target.value)} /></label><label className="full">Task description<textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Add a little context..." rows={3} /></label></div><div className="modal-label">Priority</div><div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>{(['High', 'Medium', 'Low'] as Priority[]).map((p) => ( <button type="button" key={p} onClick={() => { triggerVibrate(15); setPriority(p); }} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: priority === p ? '2px solid #b42cff' : '1px solid rgba(255,255,255,0.1)', background: priority === p ? 'rgba(180,44,255,0.15)' : 'transparent', color: '#fff', cursor: 'pointer', transition: '0.2s' }}>{p}</button> ))}</div><div className="modal-label">Categories <span>Select up to 3</span></div><div className="category-options">{categories.map((category) => <button type="button" key={category.label} className={`${categoryClass(category.label)} ${selected.includes(category.label) ? 'selected' : ''}`} onClick={() => { triggerVibrate(15); setSelected((current) => current.includes(category.label) ? current.filter((item) => item !== category.label) : current.length < 3 ? [...current, category.label] : current); cursor: 'pointer' }}>{category.emoji} {category.label}{selected.includes(category.label) && <Check size={14} />}</button>)}</div><div className="modal-label">Task color</div><div className="color-options">{taskColors.map((item) => <button type="button" key={item.value} className={color === item.value ? 'selected' : ''} onClick={() => { triggerVibrate(15); setColor(item.value); }} style={{cursor: 'pointer'}}><i style={{ background: item.hex }} />{item.label}{color === item.value && <Check size={14} />}</button>)}</div>{error && <p className="form-error">{error}</p>}<div className="modal-footer"><button type="button" className="ghost-btn" onClick={onClose}>Cancel</button><button className="primary-btn" type="submit">{initial ? 'Save changes' : 'Create task'}</button></div></form></div></div>;
}

function HelpModal({ onClose }: { onClose: () => void }) { return ( <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}><div className="task-modal" style={{ maxWidth: '500px' }}><div className="modal-header"><div><span className="eyebrow"><CircleHelp size={14} /> SUPPORT</span><h2>Help Center</h2></div><button type="button" onClick={onClose}><X size={20} /></button></div><div style={{ marginTop: '20px', color: '#b7b8c5', fontSize: '13px', lineHeight: '1.6' }}><h3 style={{ color: '#fff', fontSize: '15px', margin: '15px 0 5px' }}>📌 How to add a task?</h3><p>Click the "Add task" button on the dashboard. Fill in the task name, select a deadline, and choose categories.</p><h3 style={{ color: '#fff', fontSize: '15px', margin: '15px 0 5px' }}>⚡ How to set priority?</h3><p>While creating or editing a task, use the Priority buttons (High, Medium, Low) to set importance.</p></div><div className="modal-footer"><button type="button" className="primary-btn" onClick={onClose}>Got it</button></div></div></div> ); }
function SettingsModal({ onClear, onWipe, onClose }: { onClear: () => void; onWipe: () => void; onClose: () => void }) { return ( <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}><div className="task-modal" style={{ maxWidth: '450px' }}><div className="modal-header"><div><span className="eyebrow"><Settings size={14} /> PREFERENCES</span><h2>Settings</h2></div><button type="button" onClick={onClose}><X size={20} /></button></div><div style={{ marginTop: '20px', display: 'grid', gap: '15px' }}><div style={{ padding: '15px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}><strong style={{ color: '#fff', display: 'block', marginBottom: '5px' }}>Clear Completed Tasks</strong><button type="button" className="ghost-btn" style={{ padding: '8px 12px', fontSize: '12px' }} onClick={onClear}>Clear Completed</button></div><div style={{ padding: '15px', background: 'rgba(255,80,80,0.1)', borderRadius: '12px', border: '1px solid rgba(255,80,80,0.2)' }}><strong style={{ color: '#ff6b6b', display: 'block', marginBottom: '5px' }}>Wipe All Data</strong><button type="button" className="primary-btn" style={{ background: '#ff4757', boxShadow: 'none', padding: '8px 12px', fontSize: '12px' }} onClick={onWipe}>Delete All Data</button></div></div></div></div> ); }

function greeting() { const hour = new Date().getHours(); return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'; }
function formatDate(value: string) { return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(value)); }
function timeLabel(value: string) { const difference = new Date(value).getTime() - new Date().getTime(); const hours = Math.round(difference / (1000 * 3600)); const days = Math.round(difference / (1000 * 3600 * 24)); if (difference < 0) return 'Overdue'; if (hours < 24) { if (hours === 0) return 'Due soon'; return `In ${hours} h`; } if (days === 1) return 'Tomorrow'; return `In ${days} days`; }
function categoryClass(category: Category) { return category === 'Home' ? 'cat-green' : category === 'Work' ? 'cat-blue' : category === 'Health/Fitness' ? 'cat-yellow' : category === 'Education' ? 'cat-orange' : 'cat-pink'; }