import { useState } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import styles from './Login.module.scss';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Appel API de connexion
    console.log('Login:', { email, password });
    // Après connexion réussie, stocker le token et rediriger
    // localStorage.setItem('token', response.token);
    // navigate('/membre');
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
            Se connecter
          </button>
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