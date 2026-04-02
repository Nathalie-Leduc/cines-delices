import { useEffect, useState } from 'react';
import Alert from '../Alert/Alert.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { getMe, submitContactMessage } from '../../services/api.js';
import styles from './ContactForm.module.scss';

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

function cx(...classNames) {
  return classNames.filter(Boolean).join(' ');
}

export default function ContactForm({
  theme = 'public',
  className = '',
  submitLabel = 'Envoyer le message',
  successMessage = 'Message envoyé !',
  successSubtext = 'Nous reviendrons vers vous rapidement.',
  onSuccessClose,
}) {
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

  const isDashboard = theme === 'dashboard';

  useEffect(() => {
    let isMounted = true;

    if (!isDashboard || !isAuthenticated) {
      setPrefilledIdentity(EMPTY_IDENTITY);
      setForm((prev) => ({
        ...prev,
        nom: '',
        prenom: '',
        email: '',
      }));
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
        // On garde le fallback context/localStorage si l'API échoue.
      }
    };

    hydrateIdentity();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, isDashboard, user]);

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  }

  function validateForm() {
    const nextErrors = {};

    if (!form.nom.trim()) {
      nextErrors.nom = 'Le nom est requis.';
    }

    if (!form.prenom.trim()) {
      nextErrors.prenom = 'Le prénom est requis.';
    }

    if (!form.email.trim()) {
      nextErrors.email = 'L\'adresse e-mail est requise.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      nextErrors.email = 'L\'adresse e-mail n\'est pas valide.';
    }

    if (!form.demande.trim()) {
      nextErrors.demande = 'Veuillez décrire votre demande.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await submitContactMessage({
        nom: form.nom.trim(),
        prenom: form.prenom.trim(),
        email: form.email.trim(),
        demande: form.demande.trim(),
      });

      setShowSuccessModal(true);
      setErrors({});
      setForm({
        nom: prefilledIdentity.nom,
        prenom: prefilledIdentity.prenom,
        email: prefilledIdentity.email,
        demande: '',
      });
    } catch {
      setErrors((prev) => ({
        ...prev,
        submit: 'Impossible d\'envoyer le message. Réessaie dans quelques instants.',
      }));
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleSuccessClose() {
    setShowSuccessModal(false);
    onSuccessClose?.();
  }

  const labelThemeClassName = isDashboard ? styles.labelDashboard : styles.labelPublic;
  const wrapperThemeClassName = isDashboard ? styles.wrapperDashboard : styles.wrapperPublic;
  const fieldThemeClassName = isDashboard ? styles.fieldDashboard : styles.fieldPublic;
  const iconThemeClassName = isDashboard ? styles.iconDashboard : styles.iconPublic;
  const submitThemeClassName = isDashboard ? styles.submitBtnDashboard : styles.submitBtnPublic;

  function getWrapperClassName(hasError, isTextarea = false) {
    return cx(
      isTextarea ? styles.textareaWrapper : styles.inputWrapper,
      wrapperThemeClassName,
      hasError ? styles.inputError : '',
    );
  }

  return (
    <>
      {showSuccessModal ? (
        <div className={styles.overlay}>
          <div className={styles.modalStack}>
            <div className={styles.successModal}>
              <p className={styles.successMessage}>{successMessage}</p>
              <p className={styles.successSubtext}>{successSubtext}</p>
            </div>
            <button type="button" className={styles.okBtn} onClick={handleSuccessClose}>
              OK
            </button>
          </div>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className={cx(styles.form, className)}>
        <div className={styles.identityRow}>
          <div className={styles.formGroup}>
            <label htmlFor="contact-nom" className={cx(styles.label, labelThemeClassName)}>
              Nom
            </label>
            <div className={getWrapperClassName(Boolean(errors.nom))}>
              <span className={cx(styles.leadingIcon, styles.userIcon, iconThemeClassName)} aria-hidden="true" />
              <input
                id="contact-nom"
                type="text"
                className={cx(styles.fieldInput, fieldThemeClassName)}
                placeholder="Entrez votre nom"
                value={form.nom}
                onChange={(event) => handleChange('nom', event.target.value)}
                disabled={isSubmitting}
              />
            </div>
            {errors.nom ? <p className={styles.errorText}>{errors.nom}</p> : null}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="contact-prenom" className={cx(styles.label, labelThemeClassName)}>
              Prénom
            </label>
            <div className={getWrapperClassName(Boolean(errors.prenom))}>
              <span className={cx(styles.leadingIcon, styles.userIcon, iconThemeClassName)} aria-hidden="true" />
              <input
                id="contact-prenom"
                type="text"
                className={cx(styles.fieldInput, fieldThemeClassName)}
                placeholder="Entrez votre prénom"
                value={form.prenom}
                onChange={(event) => handleChange('prenom', event.target.value)}
                disabled={isSubmitting}
              />
            </div>
            {errors.prenom ? <p className={styles.errorText}>{errors.prenom}</p> : null}
          </div>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="contact-email" className={cx(styles.label, labelThemeClassName)}>
            Adresse e-mail
          </label>
          <div className={getWrapperClassName(Boolean(errors.email))}>
            <span className={cx(styles.leadingIcon, styles.emailIcon, iconThemeClassName)} aria-hidden="true" />
            <input
              id="contact-email"
              type="email"
              className={cx(styles.fieldInput, fieldThemeClassName)}
              placeholder="Entrez votre e-mail"
              value={form.email}
              onChange={(event) => handleChange('email', event.target.value)}
              disabled={isSubmitting}
            />
          </div>
          {errors.email ? <p className={styles.errorText}>{errors.email}</p> : null}
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="contact-demande" className={cx(styles.label, labelThemeClassName)}>
            Votre demande
          </label>
          <div className={getWrapperClassName(Boolean(errors.demande), true)}>
            <textarea
              id="contact-demande"
              className={cx(styles.fieldTextarea, fieldThemeClassName)}
              placeholder="Décrivez votre demande..."
              value={form.demande}
              onChange={(event) => handleChange('demande', event.target.value)}
              disabled={isSubmitting}
              rows={6}
            />
          </div>
          {errors.demande ? <p className={styles.errorText}>{errors.demande}</p> : null}
        </div>

        <Alert
          type="error"
          message={errors.submit}
          onClose={() => setErrors((prev) => ({ ...prev, submit: '' }))}
          className={styles.formAlert}
        />

        <button
          type="submit"
          className={cx(styles.submitBtn, submitThemeClassName)}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Envoi en cours...' : submitLabel}
        </button>
      </form>
    </>
  );
}
