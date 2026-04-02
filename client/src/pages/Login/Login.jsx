import { useState } from 'react';
import { useNavigate, NavLink, useLocation } from 'react-router-dom';
import Alert from '../../components/Alert/Alert.jsx';
import AuthShell from '../../components/AuthShell/AuthShell.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { loginUser, forgotPassword } from '../../services/authService.js';
import styles from './Login.module.scss';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [emailForReset, setEmailForReset] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [resetError, setResetError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const payload = await loginUser({ email, password });
      login({ token: payload?.token, user: payload?.user ?? null });

      let redirectPath = location.state?.from?.pathname || '/membre/mes-recettes';
      if (payload?.user?.role === 'ADMIN') {
        redirectPath = '/admin';
      }

      navigate(redirectPath, { replace: true });
    } catch (requestError) {
      setError(requestError.message || 'Connexion impossible');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    setResetMessage('');
    setResetError('');

    if (!emailForReset.trim()) {
      setResetError('Veuillez entrer votre email.');
      return;
    }

    try {
      await forgotPassword(emailForReset);
      setResetMessage('Email envoyé si le compte existe !');
      setEmailForReset('');
    } catch (requestError) {
      console.error(requestError);
      setResetError(
        requestError?.response?.data?.message || 'Une erreur est survenue, réessaie.',
      );
    }
  };
  const handleCloseModal = () => {
    setShowModal(false);
    setEmailForReset('');
    setResetMessage('');
    setResetError('');
  };

  return (
    <AuthShell
      title="Bienvenue"
      subtitle="Connectez-vous à votre compte"
    >
      <form className={styles.form} onSubmit={handleSubmit}>
        {/* EMAIL */}
        <div className={styles.fieldGroup}>
          <label htmlFor="email" className={styles.label}>
            Adresse e-mail
          </label>
          <div className={styles.inputWrapper}>
            <input
              id="email"
              type="email"
              className={styles.input}
              placeholder="Entrez votre e-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>
        </div>

        {/* PASSWORD */}
        <div className={styles.fieldGroup}>
          <label htmlFor="password" className={styles.label}>
            Mot de passe
          </label>
          <div className={styles.inputWrapper}>
            <span
              className={`${styles.leadingIcon} ${styles.lockIcon}`}
              aria-hidden="true"
            />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              className={styles.input}
              placeholder="Entrez votre mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              className={styles.togglePassword}
              onClick={() => setShowPassword((current) => !current)}
              aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              aria-pressed={showPassword}
            >
              👁️
            </button>
          </div>

          <button
            type="button"
            className={styles.forgotPassword}
            onClick={() => setShowModal(true)}
          >
            Mot de passe oublié ?
          </button>
        </div>

        <button
          type="submit"
          className={styles.submitButton}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Connexion...' : 'Se connecter'}
        </button>

        {/* MODAL MOT DE PASSE OUBLIÉ */}
        {showModal && (
          <div className={styles.overlay}>
            <div className={styles.modal}>
              <h2 className={styles.title}>Mot de passe oublié</h2>
              <input
                className={styles.inputShowModal}
                type="email"
                placeholder="Entrez votre email"
                value={emailForReset}
                onChange={(e) => setEmailForReset(e.target.value)}
              />
              {resetMessage && (
                <div className={styles.successMsg}>{resetMessage}</div>
              )}
              {resetError && (
                <div className={styles.formAlert}>{resetError}</div>
              )}
              <div className={styles.modalButtons}>
                <button type="button" className={styles.submitButtonMDPbrown} onClick={handleForgotPassword}>
                  Envoyer
                </button>
                <button type="button" className={styles.submitButtonMDP} onClick={() => setShowModal(false)}>
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* INSCRIPTION */}
        <p className={styles.noAccount}>
          Nouveau sur notre site ?{' '}
          <NavLink to="/signup" className={styles.link}>
            Créer un compte
          </NavLink>
        </p>

        {/* ALERT */}
        <Alert
          type="error"
          message={error}
          onClose={() => setError('')}
          className={styles.formAlert}
        />

        <p className={styles.noAccount}>
          Nouveau sur notre site ?{' '}
          <NavLink to="/signup" className={styles.link}>
            Créer un compte
          </NavLink>
        </p>
      </form>

      {showModal && (
        <div className={styles.overlay}>
          <div className={styles.modal}>
            <h2>Mot de passe oublié</h2>

            <input
              type="email"
              placeholder="Votre email"
              value={emailForReset}
              onChange={(e) => setEmailForReset(e.target.value)}
            />
            {resetMessage && (
              <p className={styles.resetSuccess}>{resetMessage}</p>
            )}
            {resetError && (
              <p className={styles.resetError}>{resetError}</p>
            )}

            <button
              type="button"
              className={styles.submitButtonMDP}
              onClick={handleForgotPassword}
            >
              Envoyer
            </button>

            <button
              type="button"
              className={styles.submitButtonMDP}
              onClick={handleCloseModal}
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </AuthShell>
  );
}
