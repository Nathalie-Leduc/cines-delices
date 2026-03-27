import { useState } from 'react';
import { useNavigate, NavLink, useLocation } from 'react-router-dom';
import Alert from '../../components/Alert/Alert.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { loginUser } from '../../services/authService.js';
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

  return (
    <div className={styles.loginPage}>
      <div className={styles.container}>
        <h1 className={styles.title}>Bienvenue</h1>
        <p className={styles.subtitle}>Connectez-vous à votre compte</p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.fieldGroup}>
            <label htmlFor="email" className={styles.label}>
              Adresse e-mail
            </label>
            <div className={styles.inputWrapper}>
              <span className={styles.icon}>@</span>
              <input
                id="email"
                type="email"
                className={styles.input}
                placeholder="Entrez votre e-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="password" className={styles.label}>
              Mot de passe
            </label>
            <div className={styles.inputWrapper}>
              <span className={styles.icon}>🔒</span>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className={styles.input}
                placeholder="Entrez votre mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
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
            <NavLink to="#" className={styles.forgotPassword}>
              mot de passe oublié
            </NavLink>
          </div>

          <button type="submit" className={styles.submitButton}>
            {isSubmitting ? 'Connexion...' : 'Se connecter'}
          </button>

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

        <div className={styles.logoContainer}>
          <img
            src="/img/logo-cine-delices.png"
            alt="CinéDélices"
            className={styles.logo}
          />
        </div>
      </div>
    </div>
  );
}
