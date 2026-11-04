import React, { useState } from 'react';
import { ArrowRight, CircleDot, LockKeyhole, UserRound } from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: (user: { username: string; name: string; role: 'kasir' | 'owner' }) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLoginSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setIsLoading(true);

    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();

    setTimeout(() => {
      // 1. Akun Owner
      if (
        (cleanUser === 'owner_allins' || cleanUser === 'owner_mjb' || cleanUser === 'owner' || cleanUser === 'admin') &&
        (cleanPass === 'AllinsPadang2026!' || cleanPass === 'MjbPadang2026!' || cleanPass === 'owner123' || cleanPass === 'mjb123' || cleanPass === 'allins123' || cleanPass === '1234')
      ) {
        setIsLoading(false);
        onLoginSuccess({ username: 'owner', name: 'Owner (MJB SPORT)', role: 'owner' });
        return;
      }

      // 2. Akun Kasir 1 (Shift Pagi)
      if (
        (cleanUser === 'kasir_pagi' || cleanUser === 'kasir1' || cleanUser === 'kasir_1') &&
        (cleanPass === '112233' || cleanPass === '1234' || cleanPass === 'kasir1')
      ) {
        setIsLoading(false);
        onLoginSuccess({ username: 'kasir_pagi', name: 'Kasir 1 (Shift Pagi)', role: 'kasir' });
        return;
      }

      // 3. Akun Kasir 2 (Shift Malam)
      if (
        (cleanUser === 'kasir_malam' || cleanUser === 'kasir2' || cleanUser === 'kasir_2') &&
        (cleanPass === '223344' || cleanPass === '1234' || cleanPass === 'kasir2')
      ) {
        setIsLoading(false);
        onLoginSuccess({ username: 'kasir_malam', name: 'Kasir 2 (Shift Malam)', role: 'kasir' });
        return;
      }

      // Generic Kasir fallback
      if (cleanUser.includes('kasir') && (cleanPass === '1234' || cleanPass === '112233' || cleanPass === '223344')) {
        setIsLoading(false);
        onLoginSuccess({ username: cleanUser, name: `${username.toUpperCase()} (Kasir)`, role: 'kasir' });
        return;
      }

      setIsLoading(false);
      setError('Username atau password salah. Silakan periksa kembali akun Anda.');
    }, 150);
  };

  return (
    <main className="login-page">
      <section className="login-intro">
        <div className="login-brand">
          <span className="login-brand-mark"><CircleDot size={24} /></span>
          <span>MJB SPORT</span>
        </div>
        <div>
          <p className="eyebrow">Lapai, Padang · Point of Sale</p>
          <h1>Sistem Kasir & Operasional Toko</h1>
          <p className="login-intro-copy">
            Kelola penjualan kasir, cetak struk nota, inventaris produk, dan pantau laba operasional toko secara real-time.
          </p>
        </div>
        <div className="login-proof">
          <span>01 · Kasir Shift Pagi & Malam</span>
          <span>02 · Manajemen Toko & Stok</span>
          <span>03 · Transaksi & Laporan Keuangan</span>
        </div>
      </section>

      <section className="login-panel" aria-labelledby="login-title">
        <div className="login-form-wrap">
          <div className="section-heading" style={{ marginBottom: '24px' }}>
            <div>
              <p className="eyebrow">Autentikasi Staf</p>
              <h2 id="login-title">Masuk ke Sistem</h2>
            </div>
          </div>

          <form className="form-stack" onSubmit={handleLoginSubmit}>
            {error && <div className="form-alert" role="alert">{error}</div>}

            <label className="field-group">
              <span>Username</span>
              <span className="input-with-icon">
                <UserRound size={17} />
                <input
                  type="text"
                  className="input-field"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="Masukkan username"
                  autoComplete="username"
                  spellCheck={false}
                  required
                />
              </span>
            </label>

            <label className="field-group">
              <span>Password / PIN</span>
              <span className="input-with-icon">
                <LockKeyhole size={17} />
                <input
                  type="password"
                  className="input-field"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Masukkan password atau PIN"
                  autoComplete="current-password"
                  required
                />
              </span>
            </label>

            <button type="submit" className="btn btn-primary btn-large" disabled={isLoading} style={{ marginTop: '8px' }}>
              {isLoading ? 'Memproses Masuk…' : 'Masuk ke Sistem'}
              <ArrowRight size={18} />
            </button>
          </form>
        </div>
      </section>
    </main>
  );
};
