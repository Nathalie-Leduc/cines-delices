import { useState } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import Alert from '../../components/Alert/Alert.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { registerUser } from '../../services/authService.js';
import styles from './Signup.module.scss';

export default function Signup() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedPolicies, setAcceptedPolicies] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorTitle, setErrorTitle] = useState('');
  const [errorMessages, setErrorMessages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function showFormError(messages, title = 'Vérifiez le formulaire') {
    const normalizedMessages = Array.isArray(messages)
      ? messages.filter(Boolean)
      : [messages].filter(Boolean);

    setErrorTitle(title);
    setErrorMessages(normalizedMessages);
  }

  function getUserFriendlyRegisterError(requestError) {
    if (requestError?.status === 409) {
      return {
        title: 'Compte déjà existant',
        messages: [requestError?.message || 'Cet email ou ce pseudo est déjà utilisé.'],
      };
    }

    if (requestError?.status === 400 || requestError?.status === 422) {
      const details = Array.isArray(requestError?.data?.details)
        ? requestError.data.details
            .map((detail) => String(detail || '').replace(/^body\s*:\s*/i, '').trim())
            .filter(Boolean)
        : [];

      if (details.length > 0) {
        return {
          title: 'Informations manquantes ou invalides',
          messages: Array.from(new Set(details)),
        };
      }

      return {
        title: 'Informations invalides',
        messages: [requestError?.message || 'Données invalides. Vérifiez les champs du formulaire.'],
      };
    }

    return {
      title: 'Inscription impossible',
      messages: [requestError?.message || 'Inscription impossible pour le moment.'],
    };
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    setErrorTitle('');
    setErrorMessages([]);

    if (!nom.trim() || !prenom.trim()) {
      showFormError('Le nom et le prénom sont obligatoires.');
      return;
    }

    if (password !== confirmPassword) {
      showFormError('Les mots de passe ne correspondent pas.');
      return;
    }

    if (!acceptedPolicies) {
      showFormError('Vous devez accepter la politique de confidentialité et la politique de cookies.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = await registerUser({
        email: email.trim(),
        nom: nom.trim(),
        prenom: prenom.trim(),
        password,
        acceptedPolicies,
      });

      login({ token: payload?.token, user: payload?.user ?? null });
      navigate('/membre', { replace: true });
    } catch (requestError) {
      const { title, messages } = getUserFriendlyRegisterError(requestError);
      showFormError(messages, title);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.signupPage}>
      <div className={styles.container}>
        <h1 className={styles.title}>Créer un compte</h1>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.fieldGroup}>
            <label htmlFor="nom" className={styles.label}>
              Nom
            </label>
            <input
              id="nom"
              type="text"
              className={styles.input}
              placeholder="Entrez votre nom"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              required
              minLength={2}
              maxLength={60}
            />
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="prenom" className={styles.label}>
              Prénom
            </label>
            <input
              id="prenom"
              type="text"
              className={styles.input}
              placeholder="Entrez votre prénom"
              value={prenom}
              onChange={(e) => setPrenom(e.target.value)}
              required
              minLength={2}
              maxLength={60}
            />
          </div>

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

          <div className={styles.policyConsent}>
            <label htmlFor="acceptedPolicies" className={styles.policyLabel}>
              <input
                id="acceptedPolicies"
                type="checkbox"
                className={styles.policyCheckbox}
                checked={acceptedPolicies}
                onChange={(e) => setAcceptedPolicies(e.target.checked)}
                required
              />
              <span>
                J'accepte la{' '}
                  <NavLink to="/politique-confidentialite" className={styles.link}>
                    politique de confidentialité
                </NavLink>{' '}
                et la{' '}
                  <NavLink to="/politique-cookies" className={styles.link}>
                  politique de cookies
                </NavLink>
              </span>
            </label>
          </div>

          <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
            {isSubmitting ? 'Création...' : 'Créer un compte'}
          </button>

          {errorMessages.length > 0 ? (
            <Alert type="error" title={errorTitle} className={styles.formAlert}>
              <ul className={styles.errorList}>
                {errorMessages.map((message) => (
                  <li key={message}>{message}</li>
                ))}
              </ul>
            </Alert>
          ) : null}
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
