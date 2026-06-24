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
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-500"></div>
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
    <div className="min-h-screen bg-[#0a0a0f] text-gray-100">
      {/* Header */}
      <header className="bg-[#111118] border-b border-purple-900/30 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold font-mono text-purple-400">ADMIN PANEL</h1>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-gray-500">Last update: {lastUpdate}</span>
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          <span className="text-gray-400">{user.name}</span>
        </div>
      </header>

      {/* Tabs */}
      <nav className="bg-[#111118] border-b border-purple-900/20 px-6 flex gap-1 overflow-x-auto">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-3 text-sm font-medium transition-all border-b-2 ${
              tab === t.key
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {/* Content */}
      <main className="p-6 max-w-7xl mx-auto">
        {error && <div className="bg-red-900/20 border border-red-700 text-red-400 p-3 rounded mb-4 text-sm">{error}</div>}

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

/* --- Tab Components --- */

const StatCard: React.FC<{ label: string; value: number | string; color?: string }> = ({ label, value, color = 'purple' }) => (
  <div className="bg-[#111118] border border-gray-800 rounded-lg p-5">
    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{label}</p>
    <p className={`text-3xl font-bold font-mono text-${color}-400`}>{value}</p>
  </div>
);

const OverviewTab: React.FC<{ data: DashboardData }> = ({ data }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      <StatCard label="Total Users" value={data.stats.total_users} />
      <StatCard label="Users Today" value={data.stats.users_today} color="green" />
      <StatCard label="Active Sessions" value={data.stats.active_sessions} color="blue" />
      <StatCard label="Submissions" value={data.stats.total_submissions} />
      <StatCard label="Today" value={data.stats.submissions_today} color="green" />
      <StatCard label="Teams" value={data.stats.total_teams} />
      <StatCard label="Full Teams" value={data.stats.full_teams} color="green" />
      <StatCard label="Challenges" value={data.stats.total_challenges} />
      <StatCard label="Failed Logins" value={data.stats.failed_logins_today} color="red" />
    </div>
  </div>
);

const UsersTab: React.FC<{ users: any[] }> = ({ users }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-sm">
      <thead className="text-gray-500 border-b border-gray-800">
        <tr>
          <th className="text-left py-3 px-2">HTPID</th>
          <th className="text-left py-3 px-2">Name</th>
          <th className="text-left py-3 px-2">Email</th>
          <th className="text-left py-3 px-2">College</th>
          <th className="text-left py-3 px-2">Dept</th>
          <th className="text-left py-3 px-2">Admin</th>
          <th className="text-left py-3 px-2">Registered</th>
        </tr>
      </thead>
      <tbody>
        {users.map(u => (
          <tr key={u.id} className="border-b border-gray-800/50 hover:bg-gray-900/50">
            <td className="py-2 px-2 font-mono text-purple-400">{u.htp_id}</td>
            <td className="py-2 px-2">{u.name}</td>
            <td className="py-2 px-2 text-gray-400">{u.email}</td>
            <td className="py-2 px-2 text-gray-400">{u.college_name}</td>
            <td className="py-2 px-2 text-gray-400">{u.department}</td>
            <td className="py-2 px-2">{u.is_admin ? '✓' : ''}</td>
            <td className="py-2 px-2 text-gray-500">{new Date(u.created_at).toLocaleString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const TeamsTab: React.FC<{ teams: any[] }> = ({ teams }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-sm">
      <thead className="text-gray-500 border-b border-gray-800">
        <tr>
          <th className="text-left py-3 px-2">Team Name</th>
          <th className="text-left py-3 px-2">Code</th>
          <th className="text-left py-3 px-2">Leader</th>
          <th className="text-left py-3 px-2">Member</th>
          <th className="text-left py-3 px-2">Status</th>
          <th className="text-left py-3 px-2">Created</th>
        </tr>
      </thead>
      <tbody>
        {teams.map(t => (
          <tr key={t.id} className="border-b border-gray-800/50 hover:bg-gray-900/50">
            <td className="py-2 px-2 font-semibold">{t.name}</td>
            <td className="py-2 px-2 font-mono text-purple-400">{t.invite_code}</td>
            <td className="py-2 px-2">{t.leader__name} <span className="text-gray-500">({t.leader__htp_id})</span></td>
            <td className="py-2 px-2">{t.member__name ? `${t.member__name} (${t.member__htp_id})` : <span className="text-gray-600">—</span>}</td>
            <td className="py-2 px-2">
              <span className={`px-2 py-0.5 rounded text-xs ${t.is_full ? 'bg-green-900/30 text-green-400' : 'bg-yellow-900/30 text-yellow-400'}`}>
                {t.is_full ? 'Full' : 'Waiting'}
              </span>
            </td>
            <td className="py-2 px-2 text-gray-500">{new Date(t.created_at).toLocaleString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const SubmissionsTab: React.FC<{ submissions: any[] }> = ({ submissions }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-sm">
      <thead className="text-gray-500 border-b border-gray-800">
        <tr>
          <th className="text-left py-3 px-2">User</th>
          <th className="text-left py-3 px-2">Challenge</th>
          <th className="text-left py-3 px-2">Difficulty</th>
          <th className="text-left py-3 px-2">Length</th>
          <th className="text-left py-3 px-2">Score</th>
          <th className="text-left py-3 px-2">Status</th>
          <th className="text-left py-3 px-2">Type</th>
          <th className="text-left py-3 px-2">Time</th>
        </tr>
      </thead>
      <tbody>
        {submissions.map(s => (
          <tr key={s.id} className="border-b border-gray-800/50 hover:bg-gray-900/50">
            <td className="py-2 px-2">{s.user__name} <span className="text-gray-500 font-mono text-xs">({s.user__htp_id})</span></td>
            <td className="py-2 px-2">{s.challenge__title}</td>
            <td className="py-2 px-2">
              <span className={`px-2 py-0.5 rounded text-xs ${
                s.challenge__difficulty === 'easy' ? 'bg-green-900/30 text-green-400' :
                s.challenge__difficulty === 'medium' ? 'bg-yellow-900/30 text-yellow-400' :
                'bg-red-900/30 text-red-400'
              }`}>{s.challenge__difficulty}</span>
            </td>
            <td className="py-2 px-2 font-mono">{s.code_length}</td>
            <td className="py-2 px-2 font-mono">{s.similarity_score ? (s.similarity_score * 100).toFixed(1) + '%' : '—'}</td>
            <td className="py-2 px-2">
              <span className={`px-2 py-0.5 rounded text-xs ${
                s.status === 'completed' ? 'bg-green-900/30 text-green-400' :
                s.status === 'failed' ? 'bg-red-900/30 text-red-400' :
                'bg-blue-900/30 text-blue-400'
              }`}>{s.status}</span>
            </td>
            <td className="py-2 px-2">{s.is_auto_save ? <span className="text-gray-500">auto</span> : <span className="text-purple-400">manual</span>}</td>
            <td className="py-2 px-2 text-gray-500">{new Date(s.submitted_at).toLocaleTimeString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const SessionsTab: React.FC<{ sessions: any[] }> = ({ sessions }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-sm">
      <thead className="text-gray-500 border-b border-gray-800">
        <tr>
          <th className="text-left py-3 px-2">User</th>
          <th className="text-left py-3 px-2">IP</th>
          <th className="text-left py-3 px-2">Location</th>
          <th className="text-left py-3 px-2">Started</th>
          <th className="text-left py-3 px-2">Last Activity</th>
        </tr>
      </thead>
      <tbody>
        {sessions.map((s, i) => (
          <tr key={i} className="border-b border-gray-800/50 hover:bg-gray-900/50">
            <td className="py-2 px-2">{s.user__name} <span className="text-gray-500 font-mono text-xs">({s.user__htp_id})</span></td>
            <td className="py-2 px-2 font-mono text-gray-400">{s.ip_address}</td>
            <td className="py-2 px-2 text-gray-400">{s.city || '?'}, {s.country || '?'}</td>
            <td className="py-2 px-2 text-gray-500">{new Date(s.created_at).toLocaleString()}</td>
            <td className="py-2 px-2 text-gray-500">{new Date(s.last_activity).toLocaleTimeString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const SecurityTab: React.FC<{ security: { alerts: any[]; flagged_ips: any[]; recent_logins: any[] } }> = ({ security }) => (
  <div className="space-y-6">
    {/* Alerts */}
    <div>
      <h3 className="text-lg font-semibold text-red-400 mb-3">Unresolved Alerts ({security.alerts.length})</h3>
      {security.alerts.length === 0 ? (
        <p className="text-gray-500 text-sm">No unresolved alerts</p>
      ) : (
        <div className="space-y-2">
          {security.alerts.map(a => (
            <div key={a.id} className="bg-red-900/10 border border-red-900/30 rounded p-3 text-sm">
              <div className="flex justify-between">
                <span className="font-semibold text-red-400">{a.alert_type}</span>
                <span className={`px-2 py-0.5 rounded text-xs ${
                  a.severity === 'high' ? 'bg-red-900/30 text-red-400' : 'bg-yellow-900/30 text-yellow-400'
                }`}>{a.severity}</span>
              </div>
              <p className="text-gray-400 mt-1">{a.description}</p>
              <p className="text-gray-600 text-xs mt-1">{a.ip_address} • {a.user__htp_id || 'Unknown'} • {new Date(a.created_at).toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>

    {/* Flagged IPs */}
    <div>
      <h3 className="text-lg font-semibold text-yellow-400 mb-3">Flagged IPs ({security.flagged_ips.length})</h3>
      {security.flagged_ips.length === 0 ? (
        <p className="text-gray-500 text-sm">No flagged IPs</p>
      ) : (
        <table className="w-full text-sm">
          <thead className="text-gray-500 border-b border-gray-800">
            <tr>
              <th className="text-left py-2">IP</th>
              <th className="text-left py-2">Users</th>
              <th className="text-left py-2">Location</th>
              <th className="text-left py-2">Last Seen</th>
            </tr>
          </thead>
          <tbody>
            {security.flagged_ips.map((ip, i) => (
              <tr key={i} className="border-b border-gray-800/50">
                <td className="py-2 font-mono">{ip.ip_address}</td>
                <td className="py-2 text-red-400 font-bold">{ip.user_count}</td>
                <td className="py-2 text-gray-400">{ip.city || '?'}, {ip.country || '?'}</td>
                <td className="py-2 text-gray-500">{new Date(ip.last_seen).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>

    {/* Recent Logins */}
    <div>
      <h3 className="text-lg font-semibold text-blue-400 mb-3">Recent Login Attempts</h3>
      <table className="w-full text-sm">
        <thead className="text-gray-500 border-b border-gray-800">
          <tr>
            <th className="text-left py-2">HTPID</th>
            <th className="text-left py-2">IP</th>
            <th className="text-left py-2">Country</th>
            <th className="text-left py-2">Status</th>
            <th className="text-left py-2">Time</th>
          </tr>
        </thead>
        <tbody>
          {security.recent_logins.map((l, i) => (
            <tr key={i} className="border-b border-gray-800/50">
              <td className="py-2 font-mono">{l.register_number}</td>
              <td className="py-2 font-mono text-gray-400">{l.ip_address}</td>
              <td className="py-2 text-gray-400">{l.country || '?'}</td>
              <td className="py-2">
                <span className={l.success ? 'text-green-400' : 'text-red-400'}>{l.success ? 'OK' : 'FAIL'}</span>
              </td>
              <td className="py-2 text-gray-500">{new Date(l.timestamp).toLocaleTimeString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const ChallengesTab: React.FC<{ challenges: any[] }> = ({ challenges }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-sm">
      <thead className="text-gray-500 border-b border-gray-800">
        <tr>
          <th className="text-left py-3 px-2">Challenge</th>
          <th className="text-left py-3 px-2">Difficulty</th>
          <th className="text-left py-3 px-2">Points</th>
          <th className="text-left py-3 px-2">Total Submissions</th>
          <th className="text-left py-3 px-2">Completed</th>
        </tr>
      </thead>
      <tbody>
        {challenges.map(c => (
          <tr key={c.id} className="border-b border-gray-800/50 hover:bg-gray-900/50">
            <td className="py-2 px-2 font-semibold">{c.title}</td>
            <td className="py-2 px-2">
              <span className={`px-2 py-0.5 rounded text-xs ${
                c.difficulty === 'easy' ? 'bg-green-900/30 text-green-400' :
                c.difficulty === 'medium' ? 'bg-yellow-900/30 text-yellow-400' :
                'bg-red-900/30 text-red-400'
              }`}>{c.difficulty}</span>
            </td>
            <td className="py-2 px-2 font-mono">{c.points}</td>
            <td className="py-2 px-2 font-mono">{c.submission_count}</td>
            <td className="py-2 px-2 font-mono text-green-400">{c.completed_count}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
