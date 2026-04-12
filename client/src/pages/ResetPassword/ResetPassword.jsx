import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { resetPassword } from '../../services/authService.js';
import styles from './ResetPassword.module.scss';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    try {
      await resetPassword({ token, password });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (requestError) {
      setError(requestError.message || 'Erreur lors de la réinitialisation');
    }
  };

  if (!token) {
    return <p className={styles.formAlert}>Lien invalide.</p>;
  }

  return (
    <div className={styles.resetPasswordPage}>
      <div className={styles.container}>
        <h1 className={styles.title}>Nouveau mot de passe</h1>
        {success ? (
          <p className={styles.successMsg}>Mot de passe mis à jour ! Redirection...</p>
        ) : (
          <form className={styles.form} onSubmit={handleSubmit} autoComplete="off">
            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="password">
                Nouveau mot de passe
              </label>
              <div className={styles.inputWrapper}>
                <input
                  className={styles.input}
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Nouveau mot de passe"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className={styles.togglePassword}
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  aria-pressed={showPassword}
                >
                 <img
                  src={showPassword ? '/icon/View_hide_fill.svg' : '/icon/View_fill.svg'}
                  alt={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  style={{ width: 24, height: 24 }}></img>
                </button>
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="confirm">
                Confirmer le mot de passe
              </label>
              <div className={styles.inputWrapper}>
                <input
                  className={styles.input}
                  id="confirm"
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Confirmer le mot de passe"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className={styles.togglePassword}
                  onClick={() => setShowConfirm((value) => !value)}
                  aria-label={showConfirm ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  aria-pressed={showConfirm}
                >
                  <img
                  src={showPassword ? '/icon/View_hide_fill.svg' : '/icon/View_fill.svg'}
                  alt={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  style={{ width: 24, height: 24 }}></img>
                </button>
              </div>
            </div>

            {error && <p className={styles.formAlert}>{error}</p>}
            <button className={styles.submitButton} type="submit">
              Valider
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
