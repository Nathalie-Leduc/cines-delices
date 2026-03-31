import express from 'express';
import { sendResetPasswordMail } from './lib/mailer.js';

const app = express();
app.use(express.json());

app.get('/test-mail', async (req, res) => {
  try {
    await sendResetPasswordMail('emilie.vatelin@gmail.com', 'https://example.com/reset/12345');
    res.send('Mail envoyé ✅');
  } catch (err) {
    console.error(err);
    res.status(500).send('Erreur mail ❌');
  }
});

app.listen(3000, () => console.log('Serveur démarré sur le port 3000'));