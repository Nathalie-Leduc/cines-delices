import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { resetPassword } from '../../services/authService.js';
import styles from './resetPassword.module.scss';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirm) {
      return setError('Les mots de passe ne correspondent pas');
    }

    try {
      await resetPassword({ token, password });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.message || 'Erreur lors de la réinitialisation');
    }
  };

  if (!token) return <p className={styles.formAlert}>Lien invalide.</p>;

  return (
    <div className={styles.resetPasswordPage}>
      <div className={styles.container}>
        <h1 className={styles.title}>Nouveau mot de passe</h1>
        {success ? (
          <p className={styles.successMsg}>Mot de passe mis à jour ! Redirection...</p>
        ) : (
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="password">Nouveau mot de passe</label>
              <input
                className={styles.input}
                id="password"
                type="password"
                placeholder="Nouveau mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="confirm">Confirmer le mot de passe</label>
              <input
                className={styles.input}
                id="confirm"
                type="password"
                placeholder="Confirmer le mot de passe"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
            </div>
            {error && <p className={styles.formAlert}>{error}</p>}
            <button className={styles.submitButton} type="submit">Valider</button>
          </form>
        )}
      </div>
    </div>
  );
}