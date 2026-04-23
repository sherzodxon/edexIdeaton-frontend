'use client';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function AdminLoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const data = await api.login(username, password);
      localStorage.setItem('ideaton_token', data.token);
      router.push('/admin');
    } catch (err: any) {
      setError(err.message || 'Kirish xatosi');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)',
      backgroundImage: `radial-gradient(ellipse 600px 400px at 50% 40%, rgba(125,186,40,0.04) 0%, transparent 70%)`,
    }}>
      <div style={{ width: '100%', maxWidth: 400, padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Syne', fontWeight: 900, fontSize: 28, color: '#0d0f0b',
            margin: '0 auto 16px',
          }}>I</div>
          <h1 style={{ fontFamily: 'Syne', fontSize: 28, letterSpacing: '-1px' }}>Admin panel</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 8, fontSize: 14 }}>Ideaton musobaqa boshqaruvi</p>
        </div>

        <div className="card" style={{ padding: 32 }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 13, color: 'var(--text-dim)', display: 'block', marginBottom: 6, fontWeight: 500 }}>
                Foydalanuvchi nomi
              </label>
              <input
                type="text" value={username} onChange={e => setUsername(e.target.value)}
                placeholder="admin" style={{ width: '100%' }} required autoFocus
              />
            </div>
            <div>
              <label style={{ fontSize: 13, color: 'var(--text-dim)', display: 'block', marginBottom: 6, fontWeight: 500 }}>
                Parol
              </label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" style={{ width: '100%' }} required
              />
            </div>
            {error && (
              <div style={{
                background: 'var(--danger-dim)', border: '1px solid rgba(224,82,82,0.3)',
                borderRadius: 'var(--radius)', padding: '10px 14px', fontSize: 13, color: 'var(--danger)',
              }}>{error}</div>
            )}
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>
              {loading ? 'Kirish...' : 'Kirish'}
            </button>
          </form>
        </div>

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <a href="/leaderboard" style={{ fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none' }}>
            ← Reytingga qaytish
          </a>
        </div>
      </div>
    </div>
  );
}
