import { useState } from 'react';
import { motion } from 'motion/react';
import { adminLogin } from './session';

// Login form for the real Administrator account (Supabase email and
// password). Shown when the Administrator file or session is opened without
// a session.
export default function AdminLogin({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    const err = await adminLogin(email.trim(), password);
    setBusy(false);
    if (err) {
      setError(err);
      setPassword('');
    } else onDone();
  };

  return (
    <motion.div
      className="admin-login-back"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onPointerDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.form
        className="box admin-login"
        initial={{ y: 12, scale: 0.98 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 12, scale: 0.98 }}
        onSubmit={submit}
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
      >
        <div className="label">Administrator-Ebene · Freigabe Stufe 6</div>
        <h2>Anmeldung</h2>
        <label>
          <span className="label">Kennung</span>
          <input className="search" type="text" autoComplete="username" autoFocus required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label>
          <span className="label">Passwort</span>
          <input
            className="search"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {error && <p className="admin-login-error small">{error}</p>}
        <div className="admin-login-actions">
          <button type="button" className="card action ghost" onClick={onClose}>
            ABBRECHEN
          </button>
          <button type="submit" className="card action" disabled={busy}>
            {busy ? 'PRÜFE…' : 'ANMELDEN'}
          </button>
        </div>
      </motion.form>
    </motion.div>
  );
}
