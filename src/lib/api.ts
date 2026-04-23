const BASE = process.env.NEXT_PUBLIC_API_URL ;

function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('ideaton_token');
}

async function apiFetch(path: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };
  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Xato yuz berdi');
  return data;
}

export const api = {
  login: (username: string, password: string) =>
    apiFetch('/api/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),

  getRecentActivity: () =>
    apiFetch('/api/schools/recent-activity'),

  getLeaderboard: () =>
    apiFetch('/api/schools/leaderboard'),

  getSchools: () =>
    apiFetch('/api/schools'),

  assignScores: (schoolId: number, scores: object[], adminNote?: string) =>
    apiFetch(`/api/schools/${schoolId}/scores`, {
      method: 'POST',
      body: JSON.stringify({ scores, admin_note: adminNote }),
    }),

  getHistory: (schoolId: number) =>
    apiFetch(`/api/schools/${schoolId}/history`),

  revokeEntry: (entryId: number) =>
    apiFetch(`/api/schools/scores/${entryId}/revoke`, { method: 'PATCH' }),

  restoreEntry: (entryId: number) =>
    apiFetch(`/api/schools/scores/${entryId}/restore`, { method: 'PATCH' }),
};
