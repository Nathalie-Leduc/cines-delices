import { useNavigate } from 'react-router-dom';
import AuthShell from '../../components/AuthShell/AuthShell.jsx';
import ContactForm from '../../components/ContactForm';
import styles from './Contact.module.scss';

export default function Contact() {
  const navigate = useNavigate();

  return (
    <AuthShell
      title="Contact"
      subtitle="help@support.cine-delices.com"
      contentClassName={styles.shellContent}
      bodyClassName={styles.shellBody}
      showBrand={false}
    >
      <ContactForm
        theme="public"
        submitLabel="Envoyer"
        successMessage="Message envoyé !"
        successSubtext="Nous reviendrons vers vous rapidement."
        onSuccessClose={() => navigate('/')}
      />
    </AuthShell>
  );
}
