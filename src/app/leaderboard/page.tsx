'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { api } from '@/lib/api';
import { School } from '@/types';
import { RefreshCcwIcon } from 'lucide-react';

const REFRESH_INTERVAL = 3 * 60 * 1000;
const ACTIVITY_REFRESH = 20 * 1000;
const TOTAL_MAX = 100;

interface ActivityEntry {
  id: number;
  school_name: string;
  criterion_name: string;
  points: number;
  max_points: number;
  created_at: string;
}

function getMedalColor(rank: number) {
  if (rank === 1) return '#f5c842';
  if (rank === 2) return '#b0bec5';
  if (rank === 3) return '#cd7c3a';
  return 'var(--text-muted)';
}

function getMedalEmoji(rank: number) {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return null;
}



function ActivityTicker({ items }: { items: ActivityEntry[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [duration, setDuration] = useState(50);

  useEffect(() => {
    if (!trackRef.current || items.length === 0) return;
    // Re-measure after render
    const id = setTimeout(() => {
      if (!trackRef.current) return;
      const halfW = trackRef.current.scrollWidth / 2;
      setDuration(Math.max(25, halfW / 90));
    }, 100);
    return () => clearTimeout(id);
  }, [items]);

  if (items.length === 0) return null;

  // Duplicate for seamless infinite scroll
  const doubled = [...items, ...items];

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 200,
      background: 'rgba(9,11,7,0.98)',
      borderTop: '1px solid var(--border-strong)',
      backdropFilter: 'blur(16px)',
      height: 46,
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
    }}>
      {/* LIVE label */}
      <div style={{
        flexShrink: 0,
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '0 14px 0 16px',
        borderRight: '1px solid var(--border-strong)',
        height: '100%',
        background: 'linear-gradient(135deg, var(--green), var(--green-dim))',
      }}>
        <span style={{
          width: 6, height: 6, borderRadius: '50%',
          background: '#0d0f0b',
          animation: 'pulse-dot 1.4s ease-in-out infinite',
          display: 'block', flexShrink: 0,
        }} />
        <span style={{
          fontSize: 10, fontFamily: 'Syne', fontWeight: 800,
          color: '#0d0f0b', letterSpacing: 1.5, textTransform: 'uppercase',
          whiteSpace: 'nowrap',
        }}>JONLI</span>
      </div>

      {/* Scroll container */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        {/* Fade edges */}
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0, width: 32, zIndex: 2,
          background: 'linear-gradient(to right, rgba(9,11,7,0.98), transparent)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', right: 0, top: 0, bottom: 0, width: 32, zIndex: 2,
          background: 'linear-gradient(to left, rgba(9,11,7,0.98), transparent)',
          pointerEvents: 'none',
        }} />

        <div
          ref={trackRef}
          style={{
            display: 'flex',
            alignItems: 'center',
            width: 'max-content',
            animation: `ticker-move ${duration}s linear infinite`,
            willChange: 'transform',
          }}
        >
          {doubled.map((entry, i) => (
            <div
              key={`${entry.id}-${i}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '0 20px',
                borderRight: '1px solid var(--border)',
                height: 46,
                flexShrink: 0,
              }}
            >
              {/* School */}
              <span style={{
                fontFamily: 'Syne', fontWeight: 700, fontSize: 13,
                color: 'var(--text)', whiteSpace: 'nowrap',
              }}>
                {entry.school_name}
              </span>

              {/* Arrow */}
              <span style={{ color: 'var(--green)', fontSize: 11, opacity: 0.7 }}>›</span>

              {/* Criterion name (truncated) */}
              <span style={{
                fontSize: 12, color: 'var(--text-dim)',
                whiteSpace: 'nowrap',
              }}>
                {entry.criterion_name.length > 30
                  ? entry.criterion_name.slice(0, 30) + '…'
                  : entry.criterion_name}
              </span>

              {/* Points pill */}
              <span style={{
                display: 'inline-flex', alignItems: 'baseline', gap: 2,
                background: 'var(--green-light)',
                border: '1px solid var(--border-strong)',
                borderRadius: 100,
                padding: '1px 9px',
                fontFamily: 'Syne', fontWeight: 800, fontSize: 13,
                color: 'var(--green)',
                whiteSpace: 'nowrap',
              }}>
                +{entry.points}
                <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 400 }}>
                  /{entry.max_points}
                </span>
              </span>

              
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes ticker-move {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.4; transform: scale(0.7); }
        }
      `}</style>
    </div>
  );
}

export default function LeaderboardPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL / 1000);
  const [animKey, setAnimKey] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      const data = await api.getLeaderboard();
      setSchools(data);
      setLastUpdated(new Date());
      setCountdown(REFRESH_INTERVAL / 1000);
      setAnimKey(k => k + 1);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchActivity = useCallback(async () => {
    try {
      const data = await api.getRecentActivity();
      setActivity(data);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchActivity();
    const leaderInterval = setInterval(fetchData, REFRESH_INTERVAL);
    const activityInterval = setInterval(fetchActivity, ACTIVITY_REFRESH);
    return () => {
      clearInterval(leaderInterval);
      clearInterval(activityInterval);
    };
  }, [fetchData, fetchActivity]);

  useEffect(() => {
    const timer = setInterval(() => setCountdown(c => c > 0 ? c - 1 : 0), 1000);
    return () => clearInterval(timer);
  }, [lastUpdated]);

  const formatCountdown = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const hasActivity = activity.length > 0;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: hasActivity ? 46 : 0 }}>
      {/* Header */}
      <header style={{
        borderBottom: '1px solid var(--border)',
        background: 'rgba(13,15,11,0.9)',
        backdropFilter: 'blur(12px)',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Syne', fontWeight: 800, fontSize: 18, color: '#0d0f0b',
            }}>I</div>
            <div>
              <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 18, color: 'var(--text)', letterSpacing: '-0.5px' }}>
                IDEATON <span style={{ color: 'var(--green)' }}>2026</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: -2 }}>Musobaqa reytingi</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ textAlign: 'right', display:"flex",fontSize: 12, width:"100px", justifyContent:"space-between", color: 'var(--text-muted)' }}>
              <p >Yangilanadi:</p>
              <div style={{ color: countdown < 30 ? 'var(--green)' : 'var(--text-dim)', fontFamily: 'Syne', fontWeight: 700 ,marginLeft:"10px"}}>
                {formatCountdown(countdown)}
              </div>
            </div>
            <button onClick={fetchData} className="btn btn-ghost btn-sm"><RefreshCcwIcon size={16} /> Yangilash</button>
          </div>
        </div>
      </header>

      <main style={{ margin: '0 auto', padding: '40px 24px' }}>
       

        {/* Rankings */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontFamily: 'Syne', fontSize: 20, color: 'var(--text)' }}>Umumiy reyting</h2>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{schools.length} ta maktab</span>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} style={{
                  height: 60, borderRadius: 'var(--radius)', background: 'var(--bg-card)',
                  animation: 'shimmer 1.4s infinite', backgroundSize: '200% 100%',
                  animationDelay: `${i * 0.08}s`,
                }} />
              ))}
            </div>
          ) : (
            <div key={animKey} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {schools.map((school, idx) => {
                const rank = idx + 1;
                const pct = TOTAL_MAX > 0 ? (school.total_points / TOTAL_MAX) * 100 : 0;
                const isTop3 = rank <= 3;
                const medalColor = getMedalColor(rank);

                return (
                  <div
                    key={school.id}
                    className="animate-fadeUp"
                    style={{
                      animationDelay: `${idx * 0.03}s`, opacity: 0,
                      background: isTop3
                        ? `linear-gradient(135deg, var(--bg-card), rgba(${rank===1?'245,200,66':rank===2?'176,190,197':'205,124,58'},0.06))`
                        : 'var(--bg-card)',
                      border: `1px solid ${isTop3 ? `${medalColor}33` : 'var(--border)'}`,
                      borderRadius: 'var(--radius)',
                      padding: '14px 20px',
                      display: 'flex', alignItems: 'center', gap: 16,
                      transition: 'all 0.2s',
                      position: 'relative', overflow: 'hidden',
                    }}
                  >
                    <div style={{
                      minWidth: 36, textAlign: 'center',
                      fontFamily: 'Syne', fontWeight: 800, fontSize: 16,
                      color: isTop3 ? medalColor : 'var(--text-muted)',
                    }}>
                      {getMedalEmoji(rank) || rank}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: 'Syne', fontWeight: 600, fontSize: 15, color: 'var(--text)', marginBottom: 6 }}>
                        {school.name}
                      </div>
                      <div style={{ height: 4, background: 'var(--bg-card-2)', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', width: `${Math.min(pct, 100)}%`,
                          background: isTop3
                            ? `linear-gradient(90deg, ${medalColor}, ${medalColor}88)`
                            : 'linear-gradient(90deg, var(--green), var(--green-dim))',
                          borderRadius: 2,
                          transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                        }} />
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{
                        fontFamily: 'Syne', fontWeight: 800, fontSize: 22,
                        color: isTop3 ? medalColor : school.total_points > 0 ? 'var(--green)' : 'var(--text-muted)',
                      }}>
                        {school.total_points}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>/ {TOTAL_MAX}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {lastUpdated && (
          <div style={{ textAlign: 'center', marginTop: 32, fontSize: 12, color: 'var(--text-muted)' }}>
            So'nggi yangilanish: {lastUpdated.toLocaleTimeString('uz-UZ')}
          </div>
        )}
      </main>

      <ActivityTicker items={activity} />
    </div>
  );
}
