'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

import { School, ScoreEntry, CRITERIA, TOTAL_MAX } from '@/types';
import { ClipboardClockIcon, FilePenIcon } from 'lucide-react';


type CriterionScore = { enabled: boolean; points: number };

function ScoreModal({ school, onClose, onSuccess }: {
  school: School;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [scores, setScores] = useState<Record<number, CriterionScore>>(
    Object.fromEntries(CRITERIA.map(c => [c.id, { enabled: false, points: 0 }]))
  );
  const [adminNote, setAdminNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedCriterion, setExpandedCriterion] = useState<number | null>(null);

  const totalSelected = CRITERIA.filter(c => scores[c.id]?.enabled).reduce((s, c) => s + (scores[c.id]?.points || 0), 0);
  const maxSelected = CRITERIA.filter(c => scores[c.id]?.enabled).reduce((s, c) => s + c.max, 0);
  const selectedCount = CRITERIA.filter(c => scores[c.id]?.enabled).length;

  function toggleCriterion(id: number) {
    setScores(prev => ({
      ...prev,
      [id]: { ...prev[id], enabled: !prev[id].enabled, points: 0 }
    }));
    setExpandedCriterion(prev => prev === id ? null : id);
  }

  function setPoints(id: number, val: number) {
    setScores(prev => ({ ...prev, [id]: { ...prev[id], points: val } }));
  }

  async function handleSubmit() {
    const selected = CRITERIA.filter(c => scores[c.id]?.enabled);
    if (selected.length === 0) { setError('Kamida 1 ta mezon tanlanishi kerak'); return; }
    for (const c of selected) {
      const p = scores[c.id].points;
      if (p < 0 || p > c.max) { setError(`${c.mezon}: ball 0–${c.max} oralig'ida bo'lishi kerak`); return; }
    }
    setError(''); setLoading(true);
    try {
      await api.assignScores(
        school.id,
        selected.map(c => ({ criterion_id: c.id, criterion_name: c.mezon, points: scores[c.id].points, max_points: c.max })),
        adminNote
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 24, width: '100%', maxWidth: 680, maxHeight: '90vh',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
      }}>
        {/* Modal header */}
        <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--green)', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Ball berish</div>
            <h2 style={{ fontFamily: 'Syne', fontSize: 20, color: 'var(--text)' }}>{school.name}</h2>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
              Joriy: <span style={{ color: 'var(--green)', fontWeight: 700 }}>{school.total_points}</span> / {TOTAL_MAX} ball
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ minWidth: 32 }}>✕</button>
        </div>

        {/* Criteria list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px' }}>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14 }}>
            Mezonlarni tanlang va ball qo'shing:
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {CRITERIA.map((criterion) => {
              const s = scores[criterion.id];
              const isEnabled = s.enabled;
              const isExpanded = expandedCriterion === criterion.id;
              const pct = criterion.max > 0 ? (s.points / criterion.max) * 100 : 0;

              return (
                <div
                  key={criterion.id}
                  style={{
                    border: `1px solid ${isEnabled ? 'var(--border-strong)' : 'var(--border)'}`,
                    borderRadius: 12,
                    background: isEnabled ? 'var(--green-light)' : 'var(--bg-card-2)',
                    overflow: 'hidden',
                    transition: 'all 0.2s',
                  }}
                >
                  {/* Criterion header / toggle */}
                  <div
                    onClick={() => toggleCriterion(criterion.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '12px 16px', cursor: 'pointer',
                    }}
                  >
                    {/* Checkbox */}
                    <div style={{
                      width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                      border: `2px solid ${isEnabled ? 'var(--green)' : 'var(--border-strong)'}`,
                      background: isEnabled ? 'var(--green)' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.15s',
                    }}>
                      {isEnabled && <span style={{ color: '#0d0f0b', fontSize: 12, fontWeight: 900 }}>✓</span>}
                    </div>

                    {/* Criterion number + name */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{
                          fontFamily: 'Syne', fontSize: 11, fontWeight: 700,
                          color: isEnabled ? 'var(--green)' : 'var(--text-muted)',
                          background: isEnabled ? 'rgba(125,186,40,0.15)' : 'var(--bg-card)',
                          padding: '2px 7px', borderRadius: 100,
                        }}>{criterion.id}</span>
                        <span style={{
                          fontFamily: 'Syne', fontSize: 13, fontWeight: 600,
                          color: isEnabled ? 'var(--text)' : 'var(--text-dim)',
                        }}>{criterion.mezon}</span>
                      </div>
                    </div>

                    {/* Max points badge + expand */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      {isEnabled && (
                        <span style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 15, color: 'var(--green)' }}>
                          {s.points}
                        </span>
                      )}
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>max {criterion.max}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: 12, transition: 'transform 0.2s', display: 'block', transform: isExpanded && isEnabled ? 'rotate(180deg)' : 'none' }}>▼</span>
                    </div>
                  </div>

                  {/* Expanded: description + input */}
                  {isEnabled && isExpanded && (
                    <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--border)' }}>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6, margin: '12px 0' }}>
                        {criterion.mazmuni}
                      </p>

                      {/* Points input with slider-style buttons */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <button
                          onClick={() => setPoints(criterion.id, Math.max(0, s.points - 1))}
                          className="btn btn-ghost btn-sm"
                          style={{ minWidth: 32, justifyContent: 'center', padding: '6px 10px' }}
                        >−</button>

                        <div style={{ flex: 1, position: 'relative' }}>
                          <input
                            type="range" min={0} max={criterion.max} value={s.points}
                            onChange={e => setPoints(criterion.id, parseInt(e.target.value))}
                            onClick={e => e.stopPropagation()}
                            style={{
                              width: '100%', height: 6, appearance: 'none',
                              background: `linear-gradient(to right, var(--green) ${pct}%, var(--bg-card) ${pct}%)`,
                              borderRadius: 3, outline: 'none', border: 'none', cursor: 'pointer',
                              padding: 0, margin: 0,
                            }}
                          />
                        </div>

                        <button
                          onClick={() => setPoints(criterion.id, Math.min(criterion.max, s.points + 1))}
                          className="btn btn-ghost btn-sm"
                          style={{ minWidth: 32, justifyContent: 'center', padding: '6px 10px' }}
                        >+</button>

                        <input
                          type="number" min={0} max={criterion.max}
                          value={s.points}
                          onChange={e => setPoints(criterion.id, Math.min(criterion.max, Math.max(0, parseInt(e.target.value) || 0)))}
                          onClick={e => e.stopPropagation()}
                          style={{ width: 64, textAlign: 'center', fontFamily: 'Syne', fontWeight: 700, fontSize: 16 }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Admin note */}
          <div style={{ marginTop: 20 }}>
            <label style={{ fontSize: 13, color: 'var(--text-dim)', display: 'block', marginBottom: 6 }}>Izoh (ixtiyoriy)</label>
            <input
              type="text" value={adminNote} onChange={e => setAdminNote(e.target.value)}
              placeholder="Masalan: 1-tur, yakuniy baholash..."
              style={{ width: '100%' }}
            />
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 28px', borderTop: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'var(--bg-card)',
        }}>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            {selectedCount > 0 ? (
              <span>
                <span style={{ color: 'var(--green)', fontFamily: 'Syne', fontWeight: 700, fontSize: 20 }}>{totalSelected}</span>
                <span style={{ color: 'var(--text-muted)' }}> / {maxSelected} ({selectedCount} mezon)</span>
              </span>
            ) : 'Mezon tanlanmagan'}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {error && <div style={{ fontSize: 12, color: 'var(--danger)', alignSelf: 'center', maxWidth: 200 }}>{error}</div>}
            <button onClick={onClose} className="btn btn-ghost">Bekor</button>
            <button onClick={handleSubmit} className="btn btn-primary" disabled={loading || selectedCount === 0}>
              {loading ? 'Saqlanmoqda...' : 'Saqlash'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function HistoryModal({ school, onClose }: { school: School; onClose: () => void }) {
  const [history, setHistory] = useState<ScoreEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    const data = await api.getHistory(school.id);
    setHistory(data);
    setLoading(false);
  }, [school.id]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  async function handleRevoke(entryId: number) {
    await api.revokeEntry(entryId);
    fetchHistory();
  }
  async function handleRestore(entryId: number) {
    await api.restoreEntry(entryId);
    fetchHistory();
  }

  // Group by created_at (batch grouping by minute)
  const grouped: Record<string, ScoreEntry[]> = {};
  history.forEach(e => {
    const key = e.created_at.slice(0, 16) + (e.admin_note || '');
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(e);
  });

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 24, width: '100%', maxWidth: 640, maxHeight: '85vh',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
      }}>
        <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Balllar tarixi</div>
            <h2 style={{ fontFamily: 'Syne', fontSize: 20 }}>{school.name}</h2>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm">✕</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px' }}>
          {loading ? (
            <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>Yuklanmoqda...</div>
          ) : history.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>Hali ball berilmagan</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {history.map(entry => (
                <div key={entry.id} style={{
                  background: entry.revoked ? 'var(--bg-card-2)' : 'var(--bg-card-2)',
                  border: `1px solid ${entry.revoked ? 'rgba(224,82,82,0.2)' : 'var(--border)'}`,
                  borderRadius: 10, padding: '12px 16px',
                  opacity: entry.revoked ? 0.6 : 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{
                        fontFamily: 'Syne', fontSize: 11, fontWeight: 700,
                        color: 'var(--text-muted)', background: 'var(--bg-card)',
                        padding: '2px 7px', borderRadius: 100,
                      }}>{entry.criterion_id}</span>
                      <span style={{ fontFamily: 'Syne', fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                        {entry.criterion_name}
                      </span>
                      {entry.revoked && <span className="badge badge-red" style={{ fontSize: 10 }}>Bekor qilingan</span>}
                    </div>
                    {entry.admin_note && (
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}><FilePenIcon /> {entry.admin_note}</div>
                    )}
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {new Date(entry.created_at).toLocaleString('uz-UZ')}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 18, color: entry.revoked ? 'var(--text-muted)' : 'var(--green)' }}>
                        {entry.points}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>/{entry.max_points}</span>
                    </div>
                    {entry.revoked ? (
                      <button onClick={() => handleRestore(entry.id)} className="btn btn-ghost btn-sm">↺</button>
                    ) : (
                      <button onClick={() => handleRevoke(entry.id)} className="btn btn-danger btn-sm">Bekor</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [scoreModal, setScoreModal] = useState<School | null>(null);
  const [historyModal, setHistoryModal] = useState<School | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'points'>('name');

  const fetchSchools = useCallback(async () => {
    try {
      const data = await api.getSchools();
      setSchools(data);
    } catch {
      router.push('/admin/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const token = localStorage.getItem('ideaton_token');
    if (!token) { router.push('/admin/login'); return; }
    fetchSchools();
  }, [fetchSchools, router]);

  function logout() {
    localStorage.removeItem('ideaton_token');
    router.push('/admin/login');
  }

  const filtered = schools
    .filter(s => s.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => sortBy === 'name' ? a.name.localeCompare(b.name) : b.total_points - a.total_points);

  const totalAssigned = schools.filter(s => s.total_points > 0).length;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Header */}
      <header style={{ borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 50, background: 'rgba(13,15,11,0.95)', backdropFilter: 'blur(12px)' }}>
        <div style={{  margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Syne', fontWeight: 800, fontSize: 16, color: '#0d0f0b' }}>I</div>
            <div>
              <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 16, letterSpacing: '-0.5px' }}>IDEATON <span style={{ color: 'var(--green)' }}>Admin</span></div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{totalAssigned} / {schools.length} ta maktabga ball berilgan</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <a href="/leaderboard" className="btn btn-ghost btn-sm">Reyting</a>
            <button onClick={logout} className="btn btn-ghost btn-sm">Chiqish</button>
          </div>
        </div>
      </header>

      <main style={{ margin: '0 auto', padding: '32px 24px' }}>
        {/* Search + sort */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          <input
            type="text" placeholder="Maktab nomi bo'yicha qidirish..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ flex: 1 }}
          />
          <select
            value={sortBy} onChange={e => setSortBy(e.target.value as 'name' | 'points')}
            style={{ minWidth: 160 }}
          >
            <option value="name">Nom bo'yicha</option>
            <option value="points">Ball bo'yicha</option>
          </select>
        </div>

        {/* School grid */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} style={{ height: 90, borderRadius: 'var(--radius)', background: 'var(--bg-card)', animation: 'shimmer 1.4s infinite', backgroundSize: '200% 100%' }} />
            ))}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {filtered.map((school, idx) => {
              const pct = TOTAL_MAX > 0 ? (school.total_points / TOTAL_MAX) * 100 : 0;
              const hasPoints = school.total_points > 0;

              return (
                <div
                  key={school.id}
                  className="animate-fadeUp"
                  style={{
                    animationDelay: `${idx * 0.02}s`, opacity: 0,
                    background: 'var(--bg-card)',
                    border: `1px solid ${hasPoints ? 'var(--border-strong)' : 'var(--border)'}`,
                    borderRadius: 'var(--radius)',
                    padding: '16px 18px',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div>
                      <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 15, color: 'var(--text)', marginBottom: 2 }}>
                        {school.name}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                        <span style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 22, color: hasPoints ? 'var(--green)' : 'var(--text-muted)' }}>
                          {school.total_points}
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>/ {TOTAL_MAX}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => setHistoryModal(school)} className="btn btn-ghost btn-sm" title="Tarixni ko'rish"><ClipboardClockIcon size={16}/></button>
                      <button onClick={() => setScoreModal(school)} className="btn btn-primary btn-sm">+ Ball</button>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div style={{ height: 4, background: 'var(--bg-card-2)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', width: `${Math.min(pct, 100)}%`,
                      background: 'linear-gradient(90deg, var(--green), var(--green-dim))',
                      borderRadius: 2, transition: 'width 0.6s ease',
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)', fontFamily: 'Syne' }}>
            Maktab topilmadi
          </div>
        )}
      </main>

      {scoreModal && (
        <ScoreModal
          school={scoreModal}
          onClose={() => setScoreModal(null)}
          onSuccess={fetchSchools}
        />
      )}
      {historyModal && (
        <HistoryModal
          school={historyModal}
          onClose={() => setHistoryModal(null)}
        />
      )}
    </div>
  );
}
