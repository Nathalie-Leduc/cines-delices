import { useState } from 'react';
import styles from './Contact.module.scss';

export default function Contact() {
  const [form, setForm] = useState({
    nom: '',
    prenom: '',
    email: '',
    demande: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

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
        nom: '',
        prenom: '',
        email: '',
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

  return (
    <div className={styles.contact}>
      {/* MODAL SUCCÈS */}
      {showSuccessModal && (
        <div className={styles.overlay}>
          <div className={styles.successModal}>
            <p className={styles.successMessage}>Message envoyé !</p>
            <p className={styles.successSubtext}>Nous reviendrons vers vous rapidement.</p>
            <button
              className={styles.okBtn}
              onClick={() => setShowSuccessModal(false)}
            >
              OK
            </button>
          </div>
        </div>
      )}

      <div className={styles.container}>
        <h1 className={styles.title}>Contact</h1>
        <p className={styles.subtitle}>help@support.cine-delices.com</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* NOM */}
          <div className={styles.formGroup}>
            <label htmlFor="nom" className={styles.label}>
              Nom
            </label>
            <input
              id="nom"
              type="text"
              className={`${styles.input} ${errors.nom ? styles.inputError : ''}`}
              placeholder="Dupont"
              value={form.nom}
              onChange={e => handleChange('nom', e.target.value)}
              disabled={isSubmitting}
            />
            {errors.nom && (
              <p className={styles.errorText}>{errors.nom}</p>
            )}
          </div>

          {/* PRÉNOM */}
          <div className={styles.formGroup}>
            <label htmlFor="prenom" className={styles.label}>
              Prénom
            </label>
            <input
              id="prenom"
              type="text"
              className={`${styles.input} ${errors.prenom ? styles.inputError : ''}`}
              placeholder="Jean"
              value={form.prenom}
              onChange={e => handleChange('prenom', e.target.value)}
              disabled={isSubmitting}
            />
            {errors.prenom && (
              <p className={styles.errorText}>{errors.prenom}</p>
            )}
          </div>

          {/* EMAIL */}
          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.label}>
              Adresse e-mail
            </label>
            <div className={styles.emailField}>
              <span className={styles.emailIcon} aria-hidden="true" />
              <input
                id="email"
                type="email"
                className={`${styles.emailInput} ${errors.email ? styles.inputError : ''}`}
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

          {/* DEMANDE */}
          <div className={styles.formGroup}>
            <label htmlFor="demande" className={styles.label}>
              Indiquez votre demande :
            </label>
            <textarea
              id="demande"
              className={`${styles.textarea} ${errors.demande ? styles.inputError : ''}`}
              placeholder="Bonjour, ..."
              rows="6"
              value={form.demande}
              onChange={e => handleChange('demande', e.target.value)}
              disabled={isSubmitting}
            />
            {errors.demande && (
              <p className={styles.errorText}>{errors.demande}</p>
            )}
          </div>

          {/* ERREUR GÉNÉRALE */}
          {errors.submit && (
            <p className={styles.errorAlert}>{errors.submit}</p>
          )}

          {/* BOUTON SOUMETTRE */}
          <button
            type="submit"
            className={styles.submitBtn}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Envoi en cours...' : 'Envoyer'}
          </button>
        </form>
      </div>
    </div>
  );
}
