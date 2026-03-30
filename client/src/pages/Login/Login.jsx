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
  
  const handleSubmit = async (e) => {
    e.preventDefault();

    setError('');
    setIsSubmitting(true);

    try {
      const payload = await loginUser({ email, password });
      login({ token: payload?.token, user: payload?.user ?? null });

      // Déterminer la redirection selon le rôle
      let redirectPath = location.state?.from?.pathname || '/membre';
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
   try {
    // Appel de la fonction API avec l'email saisi
    const res = await forgotPassword(emailForReset);
     console.log("SUCCESS :", res);
    // Message pour l'utilisateur
    alert("Email envoyé si le compte existe !");

    // Ferme la modal
    setShowModal(false);

  } catch (err) {
    console.error(err);

    // Message en cas d'erreur
    alert("Erreur, réessaie");
  }
};

  return (
    <AuthShell title="Bienvenue" subtitle="Connectez-vous à votre compte">
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.fieldGroup}>
          <label htmlFor="email" className={styles.label}>
            Adresse e-mail
          </label>
          <div className={styles.inputWrapper}>
            <span
              className={`${styles.leadingIcon} ${styles.emailIcon}`}
              aria-hidden="true"
            />
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

        <div className={styles.fieldGroup}>
          <label htmlFor="password" className={styles.label}>
            Mot de passe
          </label>
          <div className={styles.inputWrapper}>
            <span className={`${styles.leadingIcon} ${styles.lockIcon}`} aria-hidden="true" />
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
              onClick={() => setShowPassword((currentValue) => !currentValue)}
              aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              aria-pressed={showPassword}
            >
              <span
                className={`${styles.eyeIcon} ${showPassword ? styles.eyeVisible : styles.eyeHidden}`}
                aria-hidden="true"
              />
              <button
                type="button"
                className={styles.togglePassword}
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              >
                👁️
              </button>
            </div>
            <NavLink to="#" className={styles.forgotPassword} onClick={() => setShowModal(true)}>
              mot de passe oublié
            </NavLink>
          </div>
          <NavLink to="#" className={styles.forgotPassword}>
            mot de passe oublié
          </NavLink>
        </div>

        <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
          {isSubmitting ? 'Connexion...' : 'Se connecter'}
        </button>

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

              <button className={styles.submitButtonMDP} onClick={handleForgotPassword}>
                Envoyer
              </button>

              <button className={styles.submitButtonMDP} onClick={() => setShowModal(false)}>
                Fermer
              </button>
            </div>
          </div>
        )}

        <p className={styles.noAccount}>
          Nouveau sur notre site ?{' '}
          <NavLink to="/signup" className={styles.link}>
            Créer un compte
          </NavLink>
        </p>
        <Alert
          type="error"
          message={error}
          onClose={() => setError('')}
          className={styles.formAlert}
        />
      </form>

      <p className={styles.noAccount}>
        Nouveau sur notre site ?{' '}
        <NavLink to="/signup" className={styles.link}>
          Créer un compte
        </NavLink>
      </p>
    </AuthShell>
  );
}
