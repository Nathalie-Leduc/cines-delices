import ContactForm from '../../components/ContactForm';
import styles from './MemberContact.module.scss';

export default function MemberContact() {
  return (
    <section className={styles.page}>
      <header className={styles.pageHeader}>
        <div className={styles.headingBlock}>
          <h2 className={styles.title}>Contact</h2>
        </div>
      </header>

      <div className={styles.contactCard}>
        <div className={styles.contactIntro}>
          <span className={styles.supportBadge}>Support membre</span>
          <p className={styles.introText}>
            Utilise ce formulaire sans quitter ton espace membre pour contacter
            l&apos;équipe Cinés Delices. La page publique de contact reste dédiée
            aux visiteurs.
          </p>
          <p className={styles.supportEmail}>help@support.cines-delices.com</p>
        </div>

        <ContactForm
          theme="dashboard"
          submitLabel="Envoyer le message"
          successMessage="Message envoyé !"
          successSubtext="L’équipe support reviendra vers vous à l’adresse indiquée."
        />
      </div>
    </section>
  );
}
