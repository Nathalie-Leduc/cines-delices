import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Alert from '../../components/Alert/Alert.jsx';
import AuthShell from '../../components/AuthShell/AuthShell.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { getMe } from '../../services/api.js';
import styles from './Contact.module.scss';

const EMPTY_IDENTITY = {
  nom: '',
  prenom: '',
  email: '',
};

function mapProfileToIdentity(profile) {
  return {
    nom: String(profile?.nom || '').trim(),
    prenom: String(profile?.prenom || profile?.pseudo || '').trim(),
    email: String(profile?.email || '').trim(),
  };
}

export default function Contact() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [prefilledIdentity, setPrefilledIdentity] = useState(EMPTY_IDENTITY);
  const [form, setForm] = useState({
    nom: '',
    prenom: '',
    email: '',
    demande: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    let isMounted = true;

    if (!isAuthenticated) {
      setPrefilledIdentity(EMPTY_IDENTITY);
      return () => {
        isMounted = false;
      };
    }

    const hydrateIdentity = async () => {
      const fromContext = mapProfileToIdentity(user);
      const fromStorage = (() => {
        try {
          const raw = localStorage.getItem('auth_user');
          return raw ? mapProfileToIdentity(JSON.parse(raw)) : EMPTY_IDENTITY;
        } catch {
          return EMPTY_IDENTITY;
        }
      })();

      const fallbackIdentity = {
        nom: fromContext.nom || fromStorage.nom,
        prenom: fromContext.prenom || fromStorage.prenom,
        email: fromContext.email || fromStorage.email,
      };

      if (isMounted) {
        setPrefilledIdentity(fallbackIdentity);
        setForm((prev) => ({
          ...prev,
          nom: prev.nom || fallbackIdentity.nom,
          prenom: prev.prenom || fallbackIdentity.prenom,
          email: prev.email || fallbackIdentity.email,
        }));
      }

      try {
        const profile = await getMe();
        if (!isMounted) {
          return;
        }

        const resolvedIdentity = mapProfileToIdentity(profile);
        setPrefilledIdentity(resolvedIdentity);
        setForm((prev) => ({
          ...prev,
          nom: prev.nom || resolvedIdentity.nom,
          prenom: prev.prenom || resolvedIdentity.prenom,
          email: prev.email || resolvedIdentity.email,
        }));
      } catch {
        // On garde le fallback (context/localStorage) si l'API échoue.
      }
    };

    hydrateIdentity();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, user]);

  function handleChange(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
    // Effacer l'erreur pour ce champ quand l'utilisateur commence à taper
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  }

  function validateForm() {
    const newErrors = {};

    if (!form.nom.trim()) {
      newErrors.nom = 'Le nom est requis.';
    }

    if (!form.prenom.trim()) {
      newErrors.prenom = 'Le prénom est requis.';
    }

    if (!form.email.trim()) {
      newErrors.email = 'L\'adresse e-mail est requise.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      newErrors.email = 'L\'adresse e-mail n\'est pas valide.';
    }

    if (!form.demande.trim()) {
      newErrors.demande = 'Veuillez décrire votre demande.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulation d'un délai réseau
      await new Promise(resolve => setTimeout(resolve, 800));

      // Le message est validé et prêt à être envoyé
      // Affiche le modal de succès
      setShowSuccessModal(true);

      // Réinitialise le formulaire
      setForm({
        nom: prefilledIdentity.nom,
        prenom: prefilledIdentity.prenom,
        email: prefilledIdentity.email,
        demande: '',
      });
    } catch {
      setErrors({
        submit: 'Impossible d\'envoyer le message. Réessaie dans quelques instants.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleSuccessClose() {
    setShowSuccessModal(false);
    navigate('/');
  }

  return (
    <>
      {showSuccessModal && (
        <div className={styles.overlay}>
          <div className={styles.modalStack}>
            <div className={styles.successModal}>
              <p className={styles.successMessage}>Message envoyé !</p>
              <p className={styles.successSubtext}>Nous reviendrons vers vous rapidement.</p>
            </div>
            <button
              className={styles.okBtn}
              onClick={handleSuccessClose}
            >
              OK
            </button>
          </div>
        </div>
      )}

      <AuthShell
        title="Contact"
        subtitle="help@support.cine-delices.com"
        contentClassName={styles.shellContent}
        bodyClassName={styles.shellBody}
      >
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.identityRow}>
            <div className={styles.formGroup}>
              <label htmlFor="nom" className={styles.label}>
                Nom
              </label>
              <div className={`${styles.inputWrapper} ${errors.nom ? styles.inputError : ''}`.trim()}>
                <span
                  className={`${styles.leadingIcon} ${styles.userIcon}`}
                  aria-hidden="true"
                />
                <input
                  id="nom"
                  type="text"
                  className={styles.input}
                  placeholder="Entrez votre nom"
                  value={form.nom}
                  onChange={e => handleChange('nom', e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              {errors.nom && (
                <p className={styles.errorText}>{errors.nom}</p>
              )}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="prenom" className={styles.label}>
                Prénom
              </label>
              <div className={`${styles.inputWrapper} ${errors.prenom ? styles.inputError : ''}`.trim()}>
                <span
                  className={`${styles.leadingIcon} ${styles.userIcon}`}
                  aria-hidden="true"
                />
                <input
                  id="prenom"
                  type="text"
                  className={styles.input}
                  placeholder="Entrez votre prénom"
                  value={form.prenom}
                  onChange={e => handleChange('prenom', e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              {errors.prenom && (
                <p className={styles.errorText}>{errors.prenom}</p>
              )}
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.label}>
              Adresse e-mail
            </label>
            <div className={`${styles.inputWrapper} ${errors.email ? styles.inputError : ''}`.trim()}>
              <span className={`${styles.leadingIcon} ${styles.emailIcon}`} aria-hidden="true" />
              <input
                id="email"
                type="email"
                className={styles.input}
                placeholder="Entrez votre e-mail"
                value={form.email}
                onChange={e => handleChange('email', e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            {errors.email && (
              <p className={styles.errorText}>{errors.email}</p>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="demande" className={styles.label}>
              Indiquez votre demande :
            </label>
            <div className={`${styles.textareaWrapper} ${errors.demande ? styles.inputError : ''}`.trim()}>
              <textarea
                id="demande"
                className={styles.textarea}
                placeholder="Bonjour, ..."
                rows="6"
                value={form.demande}
                onChange={e => handleChange('demande', e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            {errors.demande && (
              <p className={styles.errorText}>{errors.demande}</p>
            )}
          </div>

          {errors.submit && (
            <Alert type="error" title="Envoi impossible" className={styles.formAlert}>
              {errors.submit}
            </Alert>
          )}

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Envoi en cours...' : 'Envoyer'}
          </button>
        </form>
      </AuthShell>
    </>
  );
}
