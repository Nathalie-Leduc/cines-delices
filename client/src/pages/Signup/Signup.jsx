import { useState } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import styles from './Signup.module.scss';

export default function Signup() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      alert('Les mots de passe ne correspondent pas');
      return;
    }

    // TODO: Appel API d'inscription
    console.log('Signup:', { email, password });
    // Après inscription réussie, stocker le token et rediriger
    // localStorage.setItem('token', response.token);
    // navigate('/membre');
  };

  return (
    <div className={styles.signupPage}>
      <div className={styles.container}>
        <h1 className={styles.title}>Créer un compte</h1>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.fieldGroup}>
            <label htmlFor="email" className={styles.label}>
              Adresse e-mail
            </label>
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

          <div className={styles.fieldGroup}>
            <label htmlFor="password" className={styles.label}>
              Mot de passe
            </label>
            <div className={styles.inputWrapper}>
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
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="confirmPassword" className={styles.label}>
              Confirmer le mot de passe
            </label>
            <div className={styles.inputWrapper}>
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                className={styles.input}
                placeholder="Confirmez votre mot de passe"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className={styles.togglePassword}
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              >
                👁️
              </button>
            </div>
          </div>

          <button type="submit" className={styles.submitButton}>
            Créer un compte
          </button>
        </form>

        <p className={styles.hasAccount}>
          Déjà un compte ?{' '}
          <NavLink to="/login" className={styles.link}>
            Se connecter
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
