/**
 * Admin Panel — /jaswanth
 * Real-time monitoring dashboard. Polls every 5 seconds.
 * Only accessible by is_admin users.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '@/api/client';
import { useAuth } from '@/contexts/AuthContext';

interface DashboardData {
  stats: {
    total_users: number;
    users_today: number;
    total_submissions: number;
    submissions_today: number;
    total_teams: number;
    full_teams: number;
    active_sessions: number;
    total_challenges: number;
    failed_logins_today: number;
  };
  recent_users: any[];
  teams: any[];
  recent_submissions: any[];
  sessions: any[];
  security: { alerts: any[]; flagged_ips: any[]; recent_logins: any[] };
  challenge_stats: any[];
  timestamp: string;
}

type Tab = 'overview' | 'users' | 'teams' | 'submissions' | 'sessions' | 'security' | 'challenges' | 'audit' | 'system' | 'export' | 'notifications';

export const AdminPanel: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [tab, setTab] = useState<Tab>('overview');
  const [error, setError] = useState('');
  const [lastUpdate, setLastUpdate] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const res = await apiClient.get('/api/auth/admin/dashboard/');
      setData(res.data);
      setLastUpdate(new Date().toLocaleTimeString());
      setError('');
    } catch (err: any) {
      if (err.response?.status === 403) {
        navigate('/dashboard');
      }
      setError('Failed to fetch data');
    }
  }, [navigate]);

  useEffect(() => {
    if (!user?.is_admin) {
      navigate('/dashboard');
      return;
    }
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [user, navigate, fetchData]);

  if (!user?.is_admin) return null;
  if (!data) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-primary"></div>
      </div>
    );
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'users', label: 'Users' },
    { key: 'teams', label: 'Teams' },
    { key: 'submissions', label: 'Submissions' },
    { key: 'sessions', label: 'Sessions' },
    { key: 'security', label: 'Security' },
    { key: 'challenges', label: 'Challenges' },
    { key: 'audit', label: 'Audit' },
    { key: 'system', label: 'System' },
    { key: 'export', label: 'Export' },
    { key: 'notifications', label: 'Notifs' },
  ];

  return (
    <div className="min-h-screen bg-dark-bg text-text-primary">
      {/* Header */}
      <header className="bg-dark-surface border-b border-purple-primary/20 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold font-orbitron tracking-wider">
          <span className="text-purple-primary">ADMIN</span> PANEL
        </h1>
        <div className="flex items-center gap-4 text-sm font-rajdhani">
          <span className="text-text-secondary">Last update: {lastUpdate}</span>
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          <span className="text-text-secondary">{user.name}</span>
        </div>
      </header>

      {/* Tabs */}
      <nav className="bg-dark-surface border-b border-purple-primary/10 px-6 flex gap-1 overflow-x-auto">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-3 text-sm font-semibold font-rajdhani transition-all border-b-2 ${
              tab === t.key
                ? 'border-purple-primary text-purple-primary'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {/* Content */}
      <main className="p-6 max-w-7xl mx-auto">
        {error && <div className="bg-red-600/10 border border-red-600/30 text-red-400 p-3 rounded-lg mb-4 text-sm font-rajdhani">{error}</div>}

        {tab === 'overview' && <OverviewTab data={data} />}
        {tab === 'users' && <UsersTab users={data.recent_users} />}
        {tab === 'teams' && <TeamsTab teams={data.teams} />}
        {tab === 'submissions' && <SubmissionsTab submissions={data.recent_submissions} />}
        {tab === 'sessions' && <SessionsTab sessions={data.sessions} />}
        {tab === 'security' && <SecurityTab security={data.security} />}
        {tab === 'challenges' && <ChallengesTab challenges={data.challenge_stats} />}
        {tab === 'audit' && <AuditTab />}
        {tab === 'system' && <SystemTab />}
        {tab === 'export' && <ExportTab />}
        {tab === 'notifications' && <NotificationsManager />}
      </main>
    </div>
  );
};

/* --- Shared --- */

const StatCard: React.FC<{ label: string; value: number | string; accent?: string }> = ({ label, value, accent }) => (
  <div className="bg-dark-surface border border-purple-primary/10 rounded-lg p-5">
    <p className="text-xs text-text-secondary uppercase tracking-wider mb-1 font-rajdhani">{label}</p>
    <p className={`text-3xl font-bold font-orbitron ${accent || 'text-purple-primary'}`}>{value}</p>
  </div>
);

const TableWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="overflow-x-auto bg-dark-surface border border-purple-primary/10 rounded-lg">
    {children}
  </div>
);

const Th: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <th className="text-left py-3 px-3 text-xs text-text-secondary uppercase tracking-wider font-rajdhani font-semibold">{children}</th>
);

const Td: React.FC<{ children: React.ReactNode; mono?: boolean; muted?: boolean }> = ({ children, mono, muted }) => (
  <td className={`py-2.5 px-3 text-sm ${mono ? 'font-mono' : 'font-rajdhani'} ${muted ? 'text-text-secondary' : 'text-text-primary'}`}>{children}</td>
);

const Badge: React.FC<{ children: React.ReactNode; color: 'green' | 'yellow' | 'red' | 'blue' | 'purple' }> = ({ children, color }) => {
  const styles = {
    green: 'bg-green-500/10 text-green-400 border-green-500/20',
    yellow: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    red: 'bg-red-500/10 text-red-400 border-red-500/20',
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    purple: 'bg-purple-primary/10 text-purple-primary border-purple-primary/20',
  };
  return <span className={`px-2 py-0.5 rounded border text-xs font-rajdhani font-semibold ${styles[color]}`}>{children}</span>;
};

/* --- Tab Components --- */

const OverviewTab: React.FC<{ data: DashboardData }> = ({ data }) => {
  const [customMinutes, setCustomMinutes] = useState('');
  const [annTitle, setAnnTitle] = useState('');
  const [annMessage, setAnnMessage] = useState('');
  const [annType, setAnnType] = useState('info');
  const [annPinned, setAnnPinned] = useState(false);

  const handlePause = async () => {
    try { await apiClient.post('/api/submissions/pause/'); } catch {}
  };
  const handleResume = async () => {
    try { await apiClient.post('/api/submissions/resume/'); } catch {}
  };
  const handleExtend = async (minutes: number) => {
    try {
      await apiClient.post('/api/submissions/extend/', { minutes });
    } catch {}
  };
  const handleAnnounce = async () => {
    if (!annTitle.trim() || !annMessage.trim()) return;
    try {
      await apiClient.post('/api/announcements/create/', {
        title: annTitle, message: annMessage, type: annType, is_pinned: annPinned
      });
      setAnnTitle(''); setAnnMessage(''); setAnnPinned(false);
    } catch {}
  };

  const handleLockAll = async () => { try { await apiClient.post('/api/submissions/pause/'); } catch {} };
  const handleUnlockAll = async () => { try { await apiClient.post('/api/submissions/resume/'); } catch {} };
  const handleFreezeLeaderboard = async () => { /* Requires env change — show info */ };
  const quickAction = async (url: string) => { try { await apiClient.post(url); } catch {} };

  return (
  <div className="space-y-6">
    {/* Competition Controls */}
    <div className="bg-dark-surface border border-purple-primary/10 rounded-lg p-5">
      <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider font-rajdhani mb-3">Competition Controls</h3>
      <div className="flex flex-wrap items-center gap-3">
        <button onClick={handlePause} className="px-4 py-2 bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 rounded font-rajdhani font-semibold text-sm hover:bg-yellow-500/20 transition-colors">Pause</button>
        <button onClick={handleResume} className="px-4 py-2 bg-green-500/10 text-green-400 border border-green-500/20 rounded font-rajdhani font-semibold text-sm hover:bg-green-500/20 transition-colors">Resume</button>
      </div>
    </div>

    {/* Extend Time */}
    <div className="bg-dark-surface border border-purple-primary/10 rounded-lg p-5">
      <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider font-rajdhani mb-3">Extend Time</h3>
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => handleExtend(5)} className="px-3 py-2 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded font-rajdhani font-semibold text-sm hover:bg-blue-500/20">+5 min</button>
        <button onClick={() => handleExtend(10)} className="px-3 py-2 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded font-rajdhani font-semibold text-sm hover:bg-blue-500/20">+10 min</button>
        <button onClick={() => handleExtend(15)} className="px-3 py-2 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded font-rajdhani font-semibold text-sm hover:bg-blue-500/20">+15 min</button>
        <div className="flex items-center gap-1">
          <input
            type="number"
            value={customMinutes}
            onChange={(e) => setCustomMinutes(e.target.value)}
            placeholder="min"
            className="w-16 px-2 py-2 bg-dark-bg border border-purple-primary/20 rounded text-text-primary text-sm font-mono text-center"
          />
          <button onClick={() => { if (customMinutes) { handleExtend(parseInt(customMinutes)); setCustomMinutes(''); }}} className="px-3 py-2 bg-purple-primary/10 text-purple-primary border border-purple-primary/20 rounded font-rajdhani font-semibold text-sm hover:bg-purple-primary/20">Add</button>
        </div>
      </div>
    </div>

    {/* Competition Status */}
    <div className="bg-dark-surface border border-purple-primary/10 rounded-lg p-5">
      <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider font-rajdhani mb-3">Broadcast Announcement</h3>
      <div className="space-y-3">
        <input value={annTitle} onChange={e => setAnnTitle(e.target.value)} placeholder="Title" className="w-full px-3 py-2 bg-dark-bg border border-purple-primary/20 rounded text-text-primary text-sm font-rajdhani" />
        <textarea value={annMessage} onChange={e => setAnnMessage(e.target.value)} placeholder="Message" rows={2} className="w-full px-3 py-2 bg-dark-bg border border-purple-primary/20 rounded text-text-primary text-sm font-rajdhani resize-none" />
        <div className="flex items-center gap-3">
          <select value={annType} onChange={e => setAnnType(e.target.value)} className="px-3 py-2 bg-dark-bg border border-purple-primary/20 rounded text-text-primary text-sm font-rajdhani">
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="success">Success</option>
            <option value="urgent">Urgent</option>
          </select>
          <label className="flex items-center gap-1 text-xs text-text-secondary font-rajdhani">
            <input type="checkbox" checked={annPinned} onChange={e => setAnnPinned(e.target.checked)} /> Pin
          </label>
          <button onClick={handleAnnounce} className="px-4 py-2 bg-purple-primary/10 text-purple-primary border border-purple-primary/20 rounded font-rajdhani font-semibold text-sm hover:bg-purple-primary/20">Send</button>
        </div>
      </div>
    </div>

    {/* Competition Status */}
    <div className="bg-dark-surface border border-purple-primary/10 rounded-lg p-5">
      <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider font-rajdhani mb-3">Competition Status</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm font-rajdhani">
        <div>
          <span className="text-text-secondary">State: </span>
          <span className={data.stats.active_sessions > 0 ? 'text-green-400 font-semibold' : 'text-text-primary'}>
            {data.stats.total_submissions > 0 ? 'Live' : 'Waiting'}
          </span>
        </div>
        <div>
          <span className="text-text-secondary">Registration: </span>
          <span className="text-text-primary">{data.stats.total_users} registered</span>
        </div>
        <div>
          <span className="text-text-secondary">Teams Ready: </span>
          <span className="text-text-primary">{data.stats.full_teams}/{data.stats.total_teams}</span>
        </div>
        <div>
          <span className="text-text-secondary">Online Now: </span>
          <span className="text-green-400 font-semibold">{data.stats.active_sessions}</span>
        </div>
      </div>
    </div>

    {/* Stats Grid */}
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      <StatCard label="Total Users" value={data.stats.total_users} />
      <StatCard label="Users Today" value={data.stats.users_today} accent="text-green-400" />
      <StatCard label="Active Sessions" value={data.stats.active_sessions} accent="text-blue-400" />
      <StatCard label="Submissions" value={data.stats.total_submissions} />
      <StatCard label="Submissions Today" value={data.stats.submissions_today} accent="text-green-400" />
      <StatCard label="Teams" value={data.stats.total_teams} />
      <StatCard label="Full Teams" value={data.stats.full_teams} accent="text-green-400" />
      <StatCard label="Challenges" value={data.stats.total_challenges} />
      <StatCard label="Failed Logins Today" value={data.stats.failed_logins_today} accent="text-red-400" />
    </div>

    {/* Quick Actions */}
    <div className="bg-dark-surface border border-purple-primary/10 rounded-lg p-5">
      <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider font-rajdhani mb-3">Quick Actions</h3>
      <div className="flex flex-wrap gap-2">
        <button onClick={handlePause} className="px-3 py-2 bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 rounded font-rajdhani text-xs font-semibold hover:bg-yellow-500/20">Pause</button>
        <button onClick={handleResume} className="px-3 py-2 bg-green-500/10 text-green-400 border border-green-500/20 rounded font-rajdhani text-xs font-semibold hover:bg-green-500/20">Resume</button>
        <button onClick={() => handleExtend(5)} className="px-3 py-2 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded font-rajdhani text-xs font-semibold hover:bg-blue-500/20">+5 min</button>
        <button onClick={() => handleExtend(10)} className="px-3 py-2 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded font-rajdhani text-xs font-semibold hover:bg-blue-500/20">+10 min</button>
        <button onClick={() => apiClient.post('/api/announcements/create/', {title:'Update',message:'Please stand by',type:'info',is_pinned:false})} className="px-3 py-2 bg-purple-primary/10 text-purple-primary border border-purple-primary/20 rounded font-rajdhani text-xs font-semibold hover:bg-purple-primary/20">Quick Announce</button>
      </div>
    </div>

    {/* Recent Activity */}
    {data.recent_submissions.length > 0 && (
      <div className="bg-dark-surface border border-purple-primary/10 rounded-lg p-5">
        <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider font-rajdhani mb-3">Recent Activity</h3>
        <div className="space-y-1.5 max-h-40 overflow-y-auto">
          {data.recent_submissions.slice(0, 8).map((s: any, i: number) => (
            <div key={i} className="flex items-center gap-3 text-xs">
              <span className="text-text-secondary font-mono w-14">{new Date(s.submitted_at).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</span>
              <span className={`w-1.5 h-1.5 rounded-full ${s.status === 'completed' ? 'bg-green-500' : s.status === 'failed' ? 'bg-red-500' : 'bg-blue-500'}`}></span>
              <span className="text-text-primary font-rajdhani">{s.user__name} → {s.challenge__title}</span>
              <span className="text-text-secondary font-mono ml-auto">{s.similarity_score ? (s.similarity_score * 100).toFixed(0) + '%' : s.status}</span>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
  );
};

const UsersTab: React.FC<{ users: any[] }> = ({ users }) => {
  const [search, setSearch] = useState('');
  const filtered = users.filter(u => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (u.htp_id || '').toLowerCase().includes(s) ||
           (u.name || '').toLowerCase().includes(s) ||
           (u.email || '').toLowerCase().includes(s) ||
           (u.college_name || '').toLowerCase().includes(s) ||
           (u.department || '').toLowerCase().includes(s);
  });
  return (
  <div className="space-y-3">
    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, HTPID, email, college..." className="w-full px-4 py-2 bg-dark-bg border border-purple-primary/20 rounded-lg text-text-primary text-sm font-rajdhani" />
    <TableWrapper>
    <table className="w-full text-sm">
      <thead className="border-b border-purple-primary/10">
        <tr><Th>HTPID</Th><Th>Name</Th><Th>Email</Th><Th>College</Th><Th>Dept</Th><Th>Admin</Th><Th>Registered</Th></tr>
      </thead>
      <tbody>
        {filtered.map(u => (
          <tr key={u.id} className="border-b border-dark-border/30 hover:bg-purple-primary/5 transition-colors">
            <Td mono>{u.htp_id}</Td>
            <Td>{u.name}</Td>
            <Td muted>{u.email}</Td>
            <Td muted>{u.college_name}</Td>
            <Td muted>{u.department}</Td>
            <Td>{u.is_admin ? <Badge color="purple">Admin</Badge> : ''}</Td>
            <Td muted>{new Date(u.created_at).toLocaleString()}</Td>
          </tr>
        ))}
      </tbody>
    </table>
  </TableWrapper>
  </div>
  );
};

const TeamsTab: React.FC<{ teams: any[] }> = ({ teams }) => {
  const [search, setSearch] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  const filtered = teams.filter(t => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (t.name || '').toLowerCase().includes(s) ||
           (t.invite_code || '').toLowerCase().includes(s) ||
           (t.leader__name || '').toLowerCase().includes(s) ||
           (t.leader__htp_id || '').toLowerCase().includes(s) ||
           (t.member__name || '').toLowerCase().includes(s) ||
           (t.member__htp_id || '').toLowerCase().includes(s);
  });

  const viewTeam = async (name: string) => {
    try {
      const res = await apiClient.get(`/api/teams/profile/${encodeURIComponent(name)}/`);
      setSelectedTeam(res.data);
    } catch {}
  };

  return (
  <div className="space-y-3">
    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search teams, members, invite codes..." className="w-full px-4 py-2 bg-dark-bg border border-purple-primary/20 rounded-lg text-text-primary text-sm font-rajdhani" />

    {/* Team Detail Modal */}
    {selectedTeam && (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-dark-bg/90 backdrop-blur-sm" onClick={() => setSelectedTeam(null)}>
        <div className="bg-dark-surface border border-purple-primary/20 rounded-lg p-6 max-w-lg w-full mx-4 shadow-2xl max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-bold text-text-primary font-orbitron">{selectedTeam.name}</h2>
              <p className="text-text-secondary font-rajdhani">
                {selectedTeam.rank ? `#${selectedTeam.rank}` : '—'} • {selectedTeam.total_score} pts • {selectedTeam.challenges_solved} solved
              </p>
            </div>
            <button onClick={() => setSelectedTeam(null)} className="text-text-secondary hover:text-text-primary">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div className="mb-4">
            <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider font-rajdhani mb-2">Members</h3>
            <div className="space-y-2">
              {selectedTeam.members?.map((m: any) => (
                <div key={m.htp_id} className="bg-dark-bg rounded p-2 border border-purple-primary/10 flex justify-between">
                  <span className="text-text-primary font-rajdhani font-semibold text-sm">{m.name}</span>
                  <span className="text-text-secondary font-mono text-xs">{m.htp_id} • {m.role}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider font-rajdhani mb-2">Solves</h3>
            {selectedTeam.solves?.length > 0 ? (
              <table className="w-full text-xs">
                <thead className="border-b border-purple-primary/10">
                  <tr><th className="text-left py-1 text-text-secondary font-rajdhani">Challenge</th><th className="text-right py-1 text-text-secondary font-rajdhani">Score</th><th className="text-right py-1 text-text-secondary font-rajdhani">Match</th><th className="text-right py-1 text-text-secondary font-rajdhani">By</th></tr>
                </thead>
                <tbody>
                  {selectedTeam.solves.map((s: any, i: number) => (
                    <tr key={i} className="border-b border-dark-border/30">
                      <td className="py-1.5 text-text-primary font-rajdhani">{s.challenge}</td>
                      <td className="py-1.5 text-right font-mono text-purple-primary">{s.score}</td>
                      <td className="py-1.5 text-right font-mono text-text-secondary">{(s.similarity * 100).toFixed(1)}%</td>
                      <td className="py-1.5 text-right text-text-secondary font-rajdhani">{s.submitted_by}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-text-secondary text-xs font-rajdhani">No solves yet</p>
            )}
          </div>
        </div>
      </div>
    )}

    <TableWrapper>
    <table className="w-full text-sm">
      <thead className="border-b border-purple-primary/10">
        <tr><Th>Team</Th><Th>Code</Th><Th>Leader</Th><Th>Member</Th><Th>Status</Th><Th>Created</Th></tr>
      </thead>
      <tbody>
        {filtered.map(t => (
          <tr key={t.id} className="border-b border-dark-border/30 hover:bg-purple-primary/5 transition-colors">
            <Td><button onClick={() => viewTeam(t.name)} className="text-purple-primary hover:underline font-semibold">{t.name}</button></Td>
            <Td mono>{t.invite_code}</Td>
            <Td>{t.leader__name} <span className="text-text-secondary text-xs">({t.leader__htp_id})</span></Td>
            <Td>{t.member__name ? <>{t.member__name} <span className="text-text-secondary text-xs">({t.member__htp_id})</span></> : <span className="text-text-secondary">—</span>}</Td>
            <Td>{t.is_full ? <Badge color="green">Full</Badge> : <Badge color="yellow">Waiting</Badge>}</Td>
            <Td muted>{new Date(t.created_at).toLocaleString()}</Td>
          </tr>
        ))}
      </tbody>
    </table>
  </TableWrapper>
  </div>
  );
};

const SubmissionsTab: React.FC<{ submissions: any[] }> = ({ submissions }) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const filtered = submissions.filter(s => {
    if (statusFilter && s.status !== statusFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (s.user__name || '').toLowerCase().includes(q) ||
           (s.user__htp_id || '').toLowerCase().includes(q) ||
           (s.challenge__title || '').toLowerCase().includes(q);
  });
  return (
  <div className="space-y-3">
    <div className="flex gap-2">
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search user, challenge..." className="flex-1 px-4 py-2 bg-dark-bg border border-purple-primary/20 rounded-lg text-text-primary text-sm font-rajdhani" />
      <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 bg-dark-bg border border-purple-primary/20 rounded-lg text-text-primary text-sm font-rajdhani">
        <option value="">All Status</option>
        <option value="queued">Queued</option>
        <option value="rendering">Rendering</option>
        <option value="scoring">Scoring</option>
        <option value="completed">Completed</option>
        <option value="failed">Failed</option>
      </select>
    </div>
    <TableWrapper>
    <table className="w-full text-sm">
      <thead className="border-b border-purple-primary/10">
        <tr><Th>User</Th><Th>Challenge</Th><Th>Difficulty</Th><Th>Length</Th><Th>Score</Th><Th>Status</Th><Th>Type</Th><Th>Time</Th><Th>Action</Th></tr>
      </thead>
      <tbody>
        {filtered.map(s => (
          <tr key={s.id} className="border-b border-dark-border/30 hover:bg-purple-primary/5 transition-colors">
            <Td>{s.user__name} <span className="text-text-secondary text-xs font-mono">({s.user__htp_id})</span></Td>
            <Td>{s.challenge__title}</Td>
            <Td>
              {s.challenge__difficulty === 'easy' && <Badge color="green">Easy</Badge>}
              {s.challenge__difficulty === 'medium' && <Badge color="yellow">Medium</Badge>}
              {s.challenge__difficulty === 'hard' && <Badge color="red">Hard</Badge>}
            </Td>
            <Td mono>{s.code_length}</Td>
            <Td mono>{s.similarity_score ? (s.similarity_score * 100).toFixed(1) + '%' : '—'}</Td>
            <Td>
              {s.status === 'completed' && <Badge color="green">Done</Badge>}
              {s.status === 'failed' && <Badge color="red">Failed</Badge>}
              {(s.status === 'queued' || s.status === 'rendering' || s.status === 'scoring') && <Badge color="blue">{s.status}</Badge>}
            </Td>
            <Td>{s.is_auto_save ? <span className="text-text-secondary">auto</span> : <Badge color="purple">manual</Badge>}</Td>
            <Td muted>{new Date(s.submitted_at).toLocaleTimeString()}</Td>
            <td className="py-2 px-3">
              {s.status === 'failed' && (
                <button onClick={() => apiClient.post(`/api/submissions/${s.id}/retry/`)} className="text-xs text-green-400 border border-green-500/30 px-2 py-0.5 rounded hover:bg-green-500/10 font-rajdhani">Retry</button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </TableWrapper>
  </div>
  );
};

const SessionsTab: React.FC<{ sessions: any[] }> = ({ sessions }) => (
  <TableWrapper>
    <table className="w-full text-sm">
      <thead className="border-b border-purple-primary/10">
        <tr><Th>User</Th><Th>Activity</Th><Th>IP</Th><Th>Location</Th><Th>Last Active</Th></tr>
      </thead>
      <tbody>
        {sessions.map((s, i) => (
          <tr key={i} className="border-b border-dark-border/30 hover:bg-purple-primary/5 transition-colors">
            <Td>{s.user__name} <span className="text-text-secondary text-xs font-mono">({s.user__htp_id})</span></Td>
            <Td><span className="text-purple-primary text-xs font-rajdhani">{s.current_page || 'Unknown'}</span></Td>
            <Td mono>{s.ip_address}</Td>
            <Td muted>{s.city || '?'}, {s.country || '?'}</Td>
            <Td muted>{new Date(s.last_activity).toLocaleTimeString()}</Td>
          </tr>
        ))}
      </tbody>
    </table>
  </TableWrapper>
);

const SecurityTab: React.FC<{ security: { alerts: any[]; flagged_ips: any[]; recent_logins: any[] } }> = ({ security }) => (
  <div className="space-y-8">
    {/* Alerts */}
    <div>
      <h3 className="text-lg font-bold text-red-400 mb-4 font-orbitron">Unresolved Alerts ({security.alerts.length})</h3>
      {security.alerts.length === 0 ? (
        <p className="text-text-secondary text-sm font-rajdhani">No unresolved alerts</p>
      ) : (
        <div className="space-y-3">
          {security.alerts.map(a => (
            <div key={a.id} className="bg-dark-surface border border-red-500/20 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-red-400 font-rajdhani">{a.alert_type}</span>
                <Badge color={a.severity === 'high' ? 'red' : 'yellow'}>{a.severity}</Badge>
              </div>
              <p className="text-text-secondary text-sm font-rajdhani">{a.description}</p>
              <p className="text-text-secondary text-xs mt-2 font-mono">{a.ip_address} • {a.user__htp_id || 'Unknown'} • {new Date(a.created_at).toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>

    {/* Flagged IPs */}
    <div>
      <h3 className="text-lg font-bold text-yellow-400 mb-4 font-orbitron">Flagged IPs ({security.flagged_ips.length})</h3>
      {security.flagged_ips.length === 0 ? (
        <p className="text-text-secondary text-sm font-rajdhani">No flagged IPs</p>
      ) : (
        <TableWrapper>
          <table className="w-full text-sm">
            <thead className="border-b border-purple-primary/10">
              <tr><Th>IP</Th><Th>Users</Th><Th>Location</Th><Th>Last Seen</Th></tr>
            </thead>
            <tbody>
              {security.flagged_ips.map((ip, i) => (
                <tr key={i} className="border-b border-dark-border/30">
                  <Td mono>{ip.ip_address}</Td>
                  <td className="py-2.5 px-3 text-sm font-bold text-red-400">{ip.user_count}</td>
                  <Td muted>{ip.city || '?'}, {ip.country || '?'}</Td>
                  <Td muted>{new Date(ip.last_seen).toLocaleString()}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrapper>
      )}
    </div>

    {/* Recent Logins */}
    <div>
      <h3 className="text-lg font-bold text-purple-primary mb-4 font-orbitron">Recent Logins</h3>
      <TableWrapper>
        <table className="w-full text-sm">
          <thead className="border-b border-purple-primary/10">
            <tr><Th>HTPID</Th><Th>IP</Th><Th>Country</Th><Th>Status</Th><Th>Time</Th></tr>
          </thead>
          <tbody>
            {security.recent_logins.map((l, i) => (
              <tr key={i} className="border-b border-dark-border/30">
                <Td mono>{l.register_number}</Td>
                <Td mono>{l.ip_address}</Td>
                <Td muted>{l.country || '?'}</Td>
                <Td>{l.success ? <Badge color="green">OK</Badge> : <Badge color="red">FAIL</Badge>}</Td>
                <Td muted>{new Date(l.timestamp).toLocaleTimeString()}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrapper>
    </div>
  </div>
);

const ChallengesTab: React.FC<{ challenges: any[] }> = ({ challenges }) => {
  const handleAction = async (id: number, action: string) => {
    try {
      await apiClient.post(`/api/challenges/${id}/${action}/`);
    } catch { /* admin panel will refresh on next poll */ }
  };

  return (
    <TableWrapper>
      <table className="w-full text-sm">
        <thead className="border-b border-purple-primary/10">
          <tr><Th>Challenge</Th><Th>Difficulty</Th><Th>Points</Th><Th>Released</Th><Th>Locked</Th><Th>Submissions</Th><Th>Actions</Th></tr>
        </thead>
        <tbody>
          {challenges.map(c => (
            <tr key={c.id} className="border-b border-dark-border/30 hover:bg-purple-primary/5 transition-colors">
              <Td>{c.title}</Td>
              <Td>
                {c.difficulty === 'easy' && <Badge color="green">Easy</Badge>}
                {c.difficulty === 'medium' && <Badge color="yellow">Medium</Badge>}
                {c.difficulty === 'hard' && <Badge color="red">Hard</Badge>}
              </Td>
              <Td mono>{c.points}</Td>
              <Td>{c.is_released ? <Badge color="green">Yes</Badge> : <Badge color="yellow">No</Badge>}</Td>
              <Td>{c.is_locked ? <Badge color="red">Locked</Badge> : <Badge color="green">Open</Badge>}</Td>
              <Td mono>{c.completed_count}/{c.submission_count}</Td>
              <td className="py-2.5 px-3 text-xs space-x-2">
                {c.is_released ? (
                  <button onClick={() => handleAction(c.id, 'unrelease')} className="px-2 py-1 bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 rounded hover:bg-yellow-500/20 transition-colors font-rajdhani">Hide</button>
                ) : (
                  <button onClick={() => handleAction(c.id, 'release')} className="px-2 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded hover:bg-green-500/20 transition-colors font-rajdhani">Release</button>
                )}
                {c.is_locked ? (
                  <button onClick={() => handleAction(c.id, 'unlock')} className="px-2 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded hover:bg-green-500/20 transition-colors font-rajdhani">Unlock</button>
                ) : (
                  <button onClick={() => handleAction(c.id, 'lock')} className="px-2 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded hover:bg-red-500/20 transition-colors font-rajdhani">Lock</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableWrapper>
  );
};


const AuditTab: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const params = new URLSearchParams({ page: String(page), per_page: '30' });
    if (search) params.set('search', search);
    apiClient.get(`/api/audit/?${params}`)
      .then(res => { setLogs(res.data.logs); setTotalPages(res.data.total_pages); })
      .catch(() => {});
  }, [page, search]);

  return (
    <div className="space-y-4">
      <input
        value={search}
        onChange={e => { setSearch(e.target.value); setPage(1); }}
        placeholder="Search logs..."
        className="w-full px-4 py-2 bg-dark-bg border border-purple-primary/20 rounded-lg text-text-primary text-sm font-rajdhani"
      />
      <TableWrapper>
        <table className="w-full text-sm">
          <thead className="border-b border-purple-primary/10">
            <tr><Th>Time</Th><Th>Event</Th><Th>User</Th><Th>Description</Th><Th>IP</Th></tr>
          </thead>
          <tbody>
            {logs.map(log => (
              <tr key={log.id} className="border-b border-dark-border/30 hover:bg-purple-primary/5">
                <Td muted>{new Date(log.timestamp).toLocaleTimeString()}</Td>
                <Td><Badge color="purple">{log.event_type}</Badge></Td>
                <Td>{log.user_name || log.user || '—'}</Td>
                <Td>{log.description}</Td>
                <Td mono>{log.ip_address || '—'}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrapper>
      <div className="flex justify-between text-xs text-text-secondary font-rajdhani">
        <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1} className="px-3 py-1 border border-purple-primary/20 rounded disabled:opacity-30">Prev</button>
        <span>Page {page} / {totalPages}</span>
        <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page >= totalPages} className="px-3 py-1 border border-purple-primary/20 rounded disabled:opacity-30">Next</button>
      </div>
    </div>
  );
};


const SystemTab: React.FC = () => {
  const [health, setHealth] = useState<any>(null);

  useEffect(() => {
    const fetch = () => {
      apiClient.get('/api/submissions/health/').then(res => setHealth(res.data)).catch(() => {});
    };
    fetch();
    const interval = setInterval(fetch, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!health) return <div className="text-text-secondary font-rajdhani">Loading...</div>;

  const ServiceStatus: React.FC<{ name: string; data: any }> = ({ name, data }) => (
    <div className="bg-dark-bg border border-purple-primary/10 rounded-lg p-4 flex items-center justify-between">
      <div>
        <p className="text-text-primary font-rajdhani font-semibold">{name}</p>
        {data.response_ms && <p className="text-xs text-text-secondary font-mono">{data.response_ms}ms</p>}
        {data.workers !== undefined && <p className="text-xs text-text-secondary font-rajdhani">{data.workers} worker(s)</p>}
      </div>
      <span className={`w-3 h-3 rounded-full ${data.status === 'online' ? 'bg-green-500' : 'bg-red-500'}`}></span>
    </div>
  );

  const handleRetry = async (id: number) => {
    try { await apiClient.post(`/api/submissions/${id}/retry/`); } catch {}
  };

  return (
    <div className="space-y-6">
      {/* Health Alerts */}
      {health.alerts && health.alerts.length > 0 && (
        <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-4">
          <h3 className="text-sm font-bold text-red-400 uppercase tracking-wider font-rajdhani mb-3">Active Alerts ({health.alert_count})</h3>
          <div className="space-y-2">
            {health.alerts.map((a: any, i: number) => (
              <div key={i} className="flex items-center justify-between bg-dark-bg rounded p-3 border border-red-500/10">
                <div>
                  <span className="text-text-primary font-rajdhani font-semibold text-sm">{a.service}</span>
                  <span className="ml-2 text-text-secondary text-xs font-rajdhani">{a.description}</span>
                </div>
                <Badge color={a.severity === 'critical' ? 'red' : 'yellow'}>{a.severity}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Services */}
      <div>
        <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider font-rajdhani mb-3">Services</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <ServiceStatus name="Database" data={health.health.database} />
          <ServiceStatus name="Redis" data={health.health.redis} />
          <ServiceStatus name="Celery" data={health.health.celery} />
          <ServiceStatus name="Playwright" data={health.health.playwright} />
          <ServiceStatus name="Storage" data={health.health.storage} />
        </div>
      </div>

      {/* Queue */}
      <div>
        <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider font-rajdhani mb-3">Submission Queue</h3>
        <div className="grid grid-cols-5 gap-3">
          {Object.entries(health.queue).map(([key, val]) => (
            <div key={key} className="bg-dark-surface border border-purple-primary/10 rounded-lg p-4 text-center">
              <p className={`text-2xl font-bold font-orbitron ${key === 'failed' ? 'text-red-400' : key === 'completed' ? 'text-green-400' : 'text-purple-primary'}`}>{val as number}</p>
              <p className="text-xs text-text-secondary font-rajdhani capitalize">{key}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-dark-surface border border-purple-primary/10 rounded-lg p-4 text-center">
          <p className="text-xl font-bold font-orbitron text-text-primary">{health.stats.total_today}</p>
          <p className="text-xs text-text-secondary font-rajdhani">Submissions Today</p>
        </div>
        <div className="bg-dark-surface border border-purple-primary/10 rounded-lg p-4 text-center">
          <p className="text-xl font-bold font-orbitron text-green-400">{health.stats.completed_today}</p>
          <p className="text-xs text-text-secondary font-rajdhani">Completed</p>
        </div>
        <div className="bg-dark-surface border border-purple-primary/10 rounded-lg p-4 text-center">
          <p className="text-xl font-bold font-orbitron text-red-400">{health.stats.failed_today}</p>
          <p className="text-xs text-text-secondary font-rajdhani">Failed</p>
        </div>
      </div>

      {/* Failed Jobs */}
      {health.failed_jobs.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-red-400 uppercase tracking-wider font-rajdhani mb-3">Failed Jobs</h3>
          <TableWrapper>
            <table className="w-full text-sm">
              <thead className="border-b border-purple-primary/10">
                <tr><Th>ID</Th><Th>User</Th><Th>Challenge</Th><Th>Error</Th><Th>Time</Th><Th>Action</Th></tr>
              </thead>
              <tbody>
                {health.failed_jobs.map((j: any) => (
                  <tr key={j.id} className="border-b border-dark-border/30">
                    <Td mono>{j.id}</Td>
                    <Td>{j.user__name}</Td>
                    <Td>{j.challenge__title}</Td>
                    <Td muted>{(j.error_message || '').substring(0, 60)}</Td>
                    <Td muted>{new Date(j.submitted_at).toLocaleTimeString()}</Td>
                    <td className="py-2 px-3">
                      <button onClick={() => handleRetry(j.id)} className="text-xs text-green-400 border border-green-500/30 px-2 py-0.5 rounded hover:bg-green-500/10 font-rajdhani">Retry</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrapper>
        </div>
      )}
    </div>
  );
};


const ExportTab: React.FC = () => {
  const apiBase = import.meta.env.VITE_API_URL || '';
  const token = localStorage.getItem('access_token');
  
  const download = (endpoint: string, filename: string) => {
    window.open(`${apiBase}/api/export/${endpoint}?format=csv`, '_blank');
    // Use fetch for auth
    fetch(`${apiBase}/api/export/${endpoint}`, {
      headers: { 'Authorization': `Token ${token}` }
    }).then(res => res.blob()).then(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  const exports = [
    { label: 'Leaderboard', desc: 'Final rankings with scores', endpoint: 'leaderboard/', file: 'leaderboard.csv' },
    { label: 'Teams', desc: 'All teams with members and status', endpoint: 'teams/', file: 'teams.csv' },
    { label: 'Participants', desc: 'All registered users', endpoint: 'participants/', file: 'participants.csv' },
    { label: 'Submissions', desc: 'All submissions with scores', endpoint: 'submissions/', file: 'submissions.csv' },
    { label: 'Challenge Scores', desc: 'Score matrix (teams × challenges)', endpoint: 'challenge-scores/', file: 'challenge_scores.csv' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {exports.map(e => (
        <div key={e.endpoint} className="bg-dark-surface border border-purple-primary/10 rounded-lg p-5">
          <h3 className="text-text-primary font-rajdhani font-semibold mb-1">{e.label}</h3>
          <p className="text-text-secondary text-xs font-rajdhani mb-4">{e.desc}</p>
          <button
            onClick={() => download(e.endpoint, e.file)}
            className="px-4 py-2 bg-purple-primary/10 text-purple-primary border border-purple-primary/20 rounded font-rajdhani font-semibold text-sm hover:bg-purple-primary/20 transition-colors"
          >
            Download CSV
          </button>
        </div>
      ))}
    </div>
  );
};


const NotificationsManager: React.FC = () => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('system');
  const [link, setLink] = useState('');
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    // Fetch recent notifications (reuse announcements list for now)
    apiClient.get('/api/announcements/').then(res => {
      setNotifications(res.data.announcements || []);
    }).catch(() => {});
  }, []);

  const handleSend = async () => {
    if (!title.trim()) return;
    try {
      await apiClient.post('/api/announcements/create/', {
        title, message, type, is_pinned: false
      });
      setTitle(''); setMessage(''); setLink('');
      // Refresh
      const res = await apiClient.get('/api/announcements/');
      setNotifications(res.data.announcements || []);
    } catch {}
  };

  const handleDelete = async (id: number) => {
    try {
      await apiClient.post(`/api/announcements/${id}/delete/`);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch {}
  };

  const handlePin = async (id: number) => {
    try {
      await apiClient.post(`/api/announcements/${id}/pin/`);
      const res = await apiClient.get('/api/announcements/');
      setNotifications(res.data.announcements || []);
    } catch {}
  };

  return (
    <div className="space-y-4">
      {/* Create */}
      <div className="bg-dark-surface border border-purple-primary/10 rounded-lg p-5">
        <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider font-rajdhani mb-3">Send Notification</h3>
        <div className="space-y-3">
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" className="w-full px-3 py-2 bg-dark-bg border border-purple-primary/20 rounded text-text-primary text-sm font-rajdhani" />
          <input value={message} onChange={e => setMessage(e.target.value)} placeholder="Message (optional)" className="w-full px-3 py-2 bg-dark-bg border border-purple-primary/20 rounded text-text-primary text-sm font-rajdhani" />
          <div className="flex gap-2">
            <select value={type} onChange={e => setType(e.target.value)} className="px-3 py-2 bg-dark-bg border border-purple-primary/20 rounded text-text-primary text-sm font-rajdhani">
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="success">Success</option>
              <option value="urgent">Urgent</option>
            </select>
            <button onClick={handleSend} className="px-4 py-2 bg-purple-primary/10 text-purple-primary border border-purple-primary/20 rounded font-rajdhani font-semibold text-sm hover:bg-purple-primary/20">Send</button>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="bg-dark-surface border border-purple-primary/10 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-purple-primary/10">
          <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider font-rajdhani">Active Notifications ({notifications.length})</h3>
        </div>
        <div className="divide-y divide-dark-border/30">
          {notifications.map(n => (
            <div key={n.id} className="px-4 py-3 flex items-center justify-between hover:bg-purple-primary/5">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Badge color={n.type === 'urgent' ? 'red' : n.type === 'warning' ? 'yellow' : n.type === 'success' ? 'green' : 'purple'}>{n.type}</Badge>
                  <span className="text-sm text-text-primary font-rajdhani font-semibold">{n.title}</span>
                  {n.is_pinned && <span className="text-xs text-yellow-400">pinned</span>}
                </div>
                {n.message && <p className="text-xs text-text-secondary font-rajdhani mt-0.5">{n.message}</p>}
              </div>
              <div className="flex gap-1 flex-shrink-0 ml-2">
                <button onClick={() => handlePin(n.id)} className="text-xs text-yellow-400 border border-yellow-500/30 px-2 py-0.5 rounded hover:bg-yellow-500/10 font-rajdhani">{n.is_pinned ? 'Unpin' : 'Pin'}</button>
                <button onClick={() => handleDelete(n.id)} className="text-xs text-red-400 border border-red-500/30 px-2 py-0.5 rounded hover:bg-red-500/10 font-rajdhani">Delete</button>
              </div>
            </div>
          ))}
          {notifications.length === 0 && (
            <p className="px-4 py-6 text-center text-text-secondary text-sm font-rajdhani">No active notifications</p>
          )}
        </div>
      </div>
    </div>
  );
};
