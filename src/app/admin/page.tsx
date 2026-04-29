'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { School, ScoreEntry, CRITERIA, TOTAL_MAX } from '@/types';
import { Pen, PenBoxIcon } from 'lucide-react';

type CriterionScore = { enabled: boolean; points: number; previousPoints: number };

// SVG icons (no lucide dependency)
const IconHistory = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
    <path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>
  </svg>
);
const IconPen = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
  </svg>
);

function ScoreModal({ school, onClose, onSuccess }: {
  school: School;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [scores, setScores] = useState<Record<number, CriterionScore>>(
    Object.fromEntries(CRITERIA.map(c => [c.id, { enabled: false, points: 0, previousPoints: 0 }]))
  );
  const [loadingCurrent, setLoadingCurrent] = useState(true);
  const [adminNote, setAdminNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedCriterion, setExpandedCriterion] = useState<number | null>(null);

  // Load existing active scores for this school
  useEffect(() => {
    api.getSchoolCurrentScores(school.id)
      .then((existing: { criterion_id: number; points: number }[]) => {
        setScores(prev => {
          const next = { ...prev };
          for (const e of existing) {
            if (next[e.criterion_id] !== undefined) {
              next[e.criterion_id] = {
                enabled: false, // still off by default; admin must consciously choose to update
                points: e.points,
                previousPoints: e.points,
              };
            }
          }
          return next;
        });
      })
      .catch(() => {})
      .finally(() => setLoadingCurrent(false));
  }, [school.id]);

  // Points already locked in (not being edited right now)
  const lockedTotal = CRITERIA
    .filter(c => !scores[c.id]?.enabled && scores[c.id]?.previousPoints > 0)
    .reduce((s, c) => s + (scores[c.id]?.previousPoints || 0), 0);

  const selectedTotal = CRITERIA
    .filter(c => scores[c.id]?.enabled)
    .reduce((s, c) => s + (scores[c.id]?.points || 0), 0);

  const grandTotal = lockedTotal + selectedTotal;
  const remaining = TOTAL_MAX - grandTotal;
  const selectedCount = CRITERIA.filter(c => scores[c.id]?.enabled).length;

  function toggleCriterion(id: number) {
    setScores(prev => {
      const wasEnabled = prev[id].enabled;
      return {
        ...prev,
        [id]: {
          ...prev[id],
          enabled: !wasEnabled,
          // When enabling, keep existing points as starting value
          points: wasEnabled ? prev[id].previousPoints : prev[id].previousPoints,
        }
      };
    });
    setExpandedCriterion(prev => prev === id ? null : id);
  }

  function setPoints(id: number, val: number) {
    const c = CRITERIA.find(x => x.id === id)!;
    // Cap at criterion max AND at remaining capacity
    const otherSelected = CRITERIA
      .filter(x => x.id !== id && scores[x.id]?.enabled)
      .reduce((s, x) => s + (scores[x.id]?.points || 0), 0);
    const maxAllowed = Math.min(c.max, TOTAL_MAX - lockedTotal - otherSelected);
    setScores(prev => ({ ...prev, [id]: { ...prev[id], points: Math.max(0, Math.min(maxAllowed, val)) } }));
  }

  async function handleSubmit() {
    const selected = CRITERIA.filter(c => scores[c.id]?.enabled);
    if (selected.length === 0) { setError('Kamida 1 ta mezon tanlanishi kerak'); return; }
    setError(''); setLoading(true);
    try {
      await api.assignScores(
        school.id,
        selected.map(c => ({
          criterion_id: c.id,
          criterion_name: c.mezon,
          points: scores[c.id].points,
          max_points: c.max,
        })),
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

  const overLimit = grandTotal > TOTAL_MAX;

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
        <div style={{ padding: '20px 28px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: 'var(--green)', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Ball berish</div>
            <h2 style={{ fontFamily: 'Syne', fontSize: 20, color: 'var(--text)' }}>{school.name}</h2>
          </div>

          {/* Total meter */}
          <div style={{
            background: overLimit ? 'var(--danger-dim)' : 'var(--bg-card-2)',
            border: `1px solid ${overLimit ? 'rgba(224,82,82,0.4)' : 'var(--border)'}`,
            borderRadius: 12, padding: '8px 14px', textAlign: 'center', minWidth: 110, flexShrink: 0,
          }}>
            <div style={{ fontSize: 10, color: overLimit ? 'var(--danger)' : 'var(--text-muted)', marginBottom: 2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8 }}>
              Jami ball
            </div>
            <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 24, color: overLimit ? 'var(--danger)' : grandTotal >= 90 ? 'var(--gold)' : 'var(--green)', lineHeight: 1 }}>
              {grandTotal}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>/ {TOTAL_MAX}</div>
            {/* Progress bar */}
            <div style={{ height: 3, background: 'var(--bg-card)', borderRadius: 2, marginTop: 6, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${Math.min((grandTotal / TOTAL_MAX) * 100, 100)}%`,
                background: overLimit ? 'var(--danger)' : 'var(--green)',
                borderRadius: 2, transition: 'width 0.3s ease',
              }} />
            </div>
          </div>

          <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ minWidth: 32, flexShrink: 0 }}>✕</button>
        </div>

        {/* Criteria list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 28px' }}>
          {loadingCurrent ? (
            <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 32 }}>Yuklanmoqda...</div>
          ) : (
            <>
              {/* Remaining indicator */}
              {remaining < TOTAL_MAX && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14,
                  padding: '8px 12px',
                  background: remaining <= 0 ? 'var(--danger-dim)' : 'rgba(125,186,40,0.06)',
                  border: `1px solid ${remaining <= 0 ? 'rgba(224,82,82,0.3)' : 'var(--border)'}`,
                  borderRadius: 8, fontSize: 12,
                  color: remaining <= 0 ? 'var(--danger)' : 'var(--text-muted)',
                }}>
                  <span>{remaining <= 0 ? '⚠️' : 'ℹ️'}</span>
                  {remaining <= 0
                    ? `Ball limiti to'ldi (${TOTAL_MAX}/${TOTAL_MAX})`
                    : `Qolgan limit: ${remaining} ball (mavjud: ${lockedTotal}, tanlangan: ${selectedTotal})`}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {CRITERIA.map((criterion) => {
                  const s = scores[criterion.id];
                  const isEnabled = s.enabled;
                  const isExpanded = expandedCriterion === criterion.id;
                  const pct = criterion.max > 0 ? (s.points / criterion.max) * 100 : 0;
                  const hasPrevious = s.previousPoints > 0 && !isEnabled;
                  // Max this criterion can receive given current state
                  const otherSelected = CRITERIA
                    .filter(x => x.id !== criterion.id && scores[x.id]?.enabled)
                    .reduce((sum, x) => sum + (scores[x.id]?.points || 0), 0);
                  const effectiveMax = Math.min(criterion.max, TOTAL_MAX - lockedTotal - otherSelected);

                  return (
                    <div
                      key={criterion.id}
                      style={{
                        border: `1px solid ${isEnabled ? 'var(--border-strong)' : hasPrevious ? 'rgba(125,186,40,0.25)' : 'var(--border)'}`,
                        borderRadius: 12,
                        background: isEnabled ? 'var(--green-light)' : hasPrevious ? 'rgba(125,186,40,0.04)' : 'var(--bg-card-2)',
                        overflow: 'hidden',
                        transition: 'all 0.2s',
                      }}
                    >
                      <div
                        onClick={() => toggleCriterion(criterion.id)}
                        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px', cursor: 'pointer' }}
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

                        {/* Number + name */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{
                              fontFamily: 'Syne', fontSize: 11, fontWeight: 700,
                              color: isEnabled ? 'var(--green)' : 'var(--text-muted)',
                              background: isEnabled ? 'rgba(125,186,40,0.15)' : 'var(--bg-card)',
                              padding: '2px 7px', borderRadius: 100, flexShrink: 0,
                            }}>{criterion.id}</span>
                            <span style={{
                              fontFamily: 'Syne', fontSize: 13, fontWeight: 600,
                              color: isEnabled ? 'var(--text)' : 'var(--text-dim)',
                            }}>{criterion.mezon}</span>
                          </div>
                        </div>

                        {/* Right side: existing score OR current input OR max */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                          {isEnabled ? (
                            <span style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 15, color: 'var(--green)' }}>
                              {s.points}
                            </span>
                          ) : hasPrevious ? (
                            <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 13, color: 'var(--green)', opacity: 0.7 }}>
                              {s.previousPoints}
                            </span>
                          ) : null}
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>/ {criterion.max}</span>
                          <span style={{
                            fontSize: 10, color: 'var(--text-muted)', transition: 'transform 0.2s',
                            transform: isExpanded && isEnabled ? 'rotate(180deg)' : 'none',
                          }}>▼</span>
                        </div>
                      </div>

                      {/* Expanded content */}
                      {isEnabled && isExpanded && (
                        <div style={{ padding: '0 16px 14px', borderTop: '1px solid var(--border)' }}>
                          <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6, margin: '10px 0' }}>
                            {criterion.mazmuni}
                          </p>

                          {/* Effective max warning */}
                          {effectiveMax < criterion.max && (
                            <div style={{ fontSize: 11, color: 'var(--gold)', marginBottom: 8 }}>
                              ⚠️ Limit sababli maksimum: {effectiveMax} ball
                            </div>
                          )}

                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <button
                              onClick={e => { e.stopPropagation(); setPoints(criterion.id, s.points - 1); }}
                              className="btn btn-ghost btn-sm"
                              style={{ minWidth: 32, justifyContent: 'center', padding: '6px 10px' }}
                            >−</button>

                            <div style={{ flex: 1 }}>
                              <input
                                type="range" min={0} max={effectiveMax} value={s.points}
                                onChange={e => setPoints(criterion.id, parseInt(e.target.value))}
                                onClick={e => e.stopPropagation()}
                                style={{
                                  width: '100%', height: 6, appearance: 'none',
                                  background: `linear-gradient(to right, var(--green) ${pct}%, var(--bg-card) ${pct}%)`,
                                  borderRadius: 3, outline: 'none', border: 'none', cursor: 'pointer', padding: 0, margin: 0,
                                }}
                              />
                            </div>

                            <button
                              onClick={e => { e.stopPropagation(); setPoints(criterion.id, s.points + 1); }}
                              className="btn btn-ghost btn-sm"
                              style={{ minWidth: 32, justifyContent: 'center', padding: '6px 10px' }}
                            >+</button>

                            <input
                              type="number" min={0} max={effectiveMax}
                              value={s.points}
                              onChange={e => setPoints(criterion.id, parseInt(e.target.value) || 0)}
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

              <div style={{ marginTop: 16 }}>
                <label style={{ fontSize: 13, color: 'var(--text-dim)', display: 'block', marginBottom: 6 }}>Izoh (ixtiyoriy)</label>
                <input
                  type="text" value={adminNote} onChange={e => setAdminNote(e.target.value)}
                  placeholder="Masalan: 1-tur, yakuniy baholash..."
                  style={{ width: '100%' }}
                />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 28px', borderTop: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
          background: 'var(--bg-card)',
        }}>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', minWidth: 0 }}>
            {selectedCount > 0 ? (
              <span>
                <span style={{ color: 'var(--green)', fontFamily: 'Syne', fontWeight: 700, fontSize: 18 }}>{selectedTotal}</span>
                <span> ball · {selectedCount} mezon yangilanadi</span>
              </span>
            ) : 'Yangilash uchun mezon tanlang'}
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
            {error && <div style={{ fontSize: 12, color: 'var(--danger)', maxWidth: 220 }}>{error}</div>}
            <button onClick={onClose} className="btn btn-ghost">Bekor</button>
            <button
              onClick={handleSubmit}
              className="btn btn-primary"
              disabled={loading || selectedCount === 0 || overLimit}
            >
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
    try {
      const data = await api.getHistory(school.id);
      setHistory(data);
    } finally {
      setLoading(false);
    }
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {history.map(entry => (
                <div key={entry.id} style={{
                  background: 'var(--bg-card-2)',
                  border: `1px solid ${entry.revoked ? 'rgba(224,82,82,0.2)' : 'var(--border)'}`,
                  borderRadius: 10, padding: '12px 16px',
                  opacity: entry.revoked ? 0.55 : 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                      <span style={{
                        fontFamily: 'Syne', fontSize: 11, fontWeight: 700,
                        color: 'var(--text-muted)', background: 'var(--bg-card)',
                        padding: '2px 7px', borderRadius: 100, flexShrink: 0,
                      }}>{entry.criterion_id}</span>
                      <span style={{ fontFamily: 'Syne', fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                        {entry.criterion_name}
                      </span>
                      {entry.revoked && (
                        <span className="badge badge-red" style={{ fontSize: 10 }}>Bekor qilingan</span>
                      )}
                    </div>
                    {entry.admin_note && (
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <IconPen /> {entry.admin_note}
                      </div>
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
                      <button onClick={() => handleRestore(entry.id)} className="btn btn-ghost btn-sm" title="Tiklash">↺</button>
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
      <header style={{ borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 50, background: 'rgba(13,15,11,0.95)', backdropFilter: 'blur(12px)' }}>
        <div style={{ margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
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
        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          <input
            type="text" placeholder="Maktab nomi bo'yicha qidirish..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ flex: 1 }}
          />
          <select value={sortBy} onChange={e => setSortBy(e.target.value as 'name' | 'points')} style={{ minWidth: 160 }}>
            <option value="name">Nom bo'yicha</option>
            <option value="points">Ball bo'yicha</option>
          </select>
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} style={{ height: 90, borderRadius: 'var(--radius)', background: 'var(--bg-card)', animation: 'shimmer 1.4s infinite' }} />
            ))}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {filtered.map((school, idx) => {
              const pct = TOTAL_MAX > 0 ? (school.total_points / TOTAL_MAX) * 100 : 0;
              const hasPoints = school.total_points > 0;
              const isFull = school.total_points >= TOTAL_MAX;

              return (
                <div
                  key={school.id}
                  className="animate-fadeUp"
                  style={{
                    animationDelay: `${idx * 0.02}s`, opacity: 0,
                    background: 'var(--bg-card)',
                    border: `1px solid ${isFull ? 'var(--green)' : hasPoints ? 'var(--border-strong)' : 'var(--border)'}`,
                    borderRadius: 'var(--radius)',
                    padding: '16px 18px',
                    transition: 'border-color 0.2s',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div>
                      <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 15, color: 'var(--text)', marginBottom: 2 }}>
                        {school.name}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                        <span style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 22, color: isFull ? 'var(--gold)' : hasPoints ? 'var(--green)' : 'var(--text-muted)' }}>
                          {school.total_points}
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>/ {TOTAL_MAX}</span>
                        {isFull && <span style={{ fontSize: 11, color: 'var(--gold)', marginLeft: 4 }}>✓ To'liq</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => setHistoryModal(school)} className="btn btn-ghost btn-sm" title="Tarixni ko'rish">
                        <IconHistory />
                      </button>
                      <button onClick={() => setScoreModal(school)} className="btn btn-primary btn-sm">
                        {hasPoints ? <PenBoxIcon size={12}/> : '+ Ball'}
                      </button>
                    </div>
                  </div>

                  <div style={{ height: 4, background: 'var(--bg-card-2)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', width: `${Math.min(pct, 100)}%`,
                      background: isFull
                        ? 'linear-gradient(90deg, var(--gold), #e6a800)'
                        : 'linear-gradient(90deg, var(--green), var(--green-dim))',
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
        <ScoreModal school={scoreModal} onClose={() => setScoreModal(null)} onSuccess={fetchSchools} />
      )}
      {historyModal && (
        <HistoryModal school={historyModal} onClose={() => setHistoryModal(null)} />
      )}
    </div>
  );
}
