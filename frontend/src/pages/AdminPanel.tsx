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

type Tab = 'overview' | 'users' | 'teams' | 'submissions' | 'sessions' | 'security' | 'challenges';

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
  const handlePause = async () => {
    try { await apiClient.post('/api/submissions/pause/'); } catch {}
  };
  const handleResume = async () => {
    try { await apiClient.post('/api/submissions/resume/'); } catch {}
  };

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
  </div>
  );
};

const UsersTab: React.FC<{ users: any[] }> = ({ users }) => (
  <TableWrapper>
    <table className="w-full text-sm">
      <thead className="border-b border-purple-primary/10">
        <tr><Th>HTPID</Th><Th>Name</Th><Th>Email</Th><Th>College</Th><Th>Dept</Th><Th>Admin</Th><Th>Registered</Th></tr>
      </thead>
      <tbody>
        {users.map(u => (
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
);

const TeamsTab: React.FC<{ teams: any[] }> = ({ teams }) => (
  <TableWrapper>
    <table className="w-full text-sm">
      <thead className="border-b border-purple-primary/10">
        <tr><Th>Team</Th><Th>Code</Th><Th>Leader</Th><Th>Member</Th><Th>Status</Th><Th>Created</Th></tr>
      </thead>
      <tbody>
        {teams.map(t => (
          <tr key={t.id} className="border-b border-dark-border/30 hover:bg-purple-primary/5 transition-colors">
            <Td>{t.name}</Td>
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
);

const SubmissionsTab: React.FC<{ submissions: any[] }> = ({ submissions }) => (
  <TableWrapper>
    <table className="w-full text-sm">
      <thead className="border-b border-purple-primary/10">
        <tr><Th>User</Th><Th>Challenge</Th><Th>Difficulty</Th><Th>Length</Th><Th>Score</Th><Th>Status</Th><Th>Type</Th><Th>Time</Th></tr>
      </thead>
      <tbody>
        {submissions.map(s => (
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
              {s.status === 'pending' && <Badge color="blue">Pending</Badge>}
              {s.status === 'processing' && <Badge color="blue">Processing</Badge>}
            </Td>
            <Td>{s.is_auto_save ? <span className="text-text-secondary">auto</span> : <Badge color="purple">manual</Badge>}</Td>
            <Td muted>{new Date(s.submitted_at).toLocaleTimeString()}</Td>
          </tr>
        ))}
      </tbody>
    </table>
  </TableWrapper>
);

const SessionsTab: React.FC<{ sessions: any[] }> = ({ sessions }) => (
  <TableWrapper>
    <table className="w-full text-sm">
      <thead className="border-b border-purple-primary/10">
        <tr><Th>User</Th><Th>IP</Th><Th>Location</Th><Th>Started</Th><Th>Last Activity</Th></tr>
      </thead>
      <tbody>
        {sessions.map((s, i) => (
          <tr key={i} className="border-b border-dark-border/30 hover:bg-purple-primary/5 transition-colors">
            <Td>{s.user__name} <span className="text-text-secondary text-xs font-mono">({s.user__htp_id})</span></Td>
            <Td mono>{s.ip_address}</Td>
            <Td muted>{s.city || '?'}, {s.country || '?'}</Td>
            <Td muted>{new Date(s.created_at).toLocaleString()}</Td>
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
