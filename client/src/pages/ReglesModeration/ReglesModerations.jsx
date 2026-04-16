import { Link } from 'react-router-dom';
import styles from './ReglesModeration.module.scss';

// ============================================================
// PAGE RÈGLES DE MODÉRATION — Cinés Délices
// ============================================================
// Ton : principalement fun avec des références cinéma partout.
// L'admin est le réalisateur, les membres sont les acteurs,
// les recettes sont les scénarios, la publication est la sortie en salle.
// ============================================================

export default function ReglesModeration() {
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>🎬 Les règles du tournage</h1>

      {/* ── Introduction ── */}
      <section className={styles.section}>
        <p>
          Bienvenue sur le plateau de Cinés Délices ! Ici, chaque membre
          est un <strong>acteur</strong> et chaque recette est
          un <strong>scénario</strong>. Mais comme sur tout bon tournage,
          il y a un <strong>réalisateur</strong> (l'admin) qui décide
          quand on crie « Coupez, c'est dans la boîte ! » ou quand
          on demande une nouvelle prise.
        </p>
        <p>
          Ces règles sont là pour que notre film soit un chef-d'œuvre
          collectif, pas un navet en série B. Lisez-les attentivement
          avant de monter sur scène !
        </p>
      </section>

      {/* ── 1. Le casting ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          🎭 Acte 1 — Le casting (comportement général)
        </h2>
        <p>
          Sur notre plateau, tout le monde mérite son étoile sur le
          Walk of Fame. Voici les règles pour garder une ambiance digne
          d'une avant-première :
        </p>
        <ul className={styles.list}>
          <li>
            <span className={styles.label}>Respect entre acteurs :</span> pas
            d'insultes, de propos discriminatoires, haineux ou diffamatoires.
            On est ici pour partager des recettes, pas pour refaire
            « Les Dents de la Mer » entre nous.
          </li>
          <li>
            <span className={styles.label}>Pas de spam :</span> publier
            la même recette en boucle, c'est comme repasser le même film
            en salle pendant 6 mois. Personne n'en veut.
          </li>
          <li>
            <span className={styles.label}>Pas de pub :</span> ce n'est
            pas une page de pub entre deux films. Aucun lien commercial,
            aucune promotion personnelle.
          </li>
          <li>
            <span className={styles.label}>Contenu légal uniquement :</span> pas
            de contenu illicite, violent ou inapproprié. On n'est pas
            sur un tournage de Tarantino ici.
          </li>
          <li>
            <span className={styles.label}>Un pseudo, un acteur :</span> les
            comptes multiples, c'est comme un acteur qui joue tous les
            rôles — ça ne trompe personne et ça gâche le film.
          </li>
        </ul>
      </section>

      {/* ── 2. Le scénario ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          📝 Acte 2 — Le scénario (règles sur les recettes)
        </h2>
        <p>
          Votre recette, c'est votre scénario. Et comme tout bon scénario,
          elle doit être claire, originale et donner envie au public.
          N'oubliez pas : <strong>toute recette passe par la validation
          du réalisateur (l'admin) avant sa sortie en salle</strong>.
        </p>

        <h3 className={styles.sectionTitle}>🎬 Le titre — votre affiche de film</h3>
        <ul className={styles.list}>
          <li>
            <span className={styles.label}>Clair et évocateur :</span> « La
            Ratatouille de Rémy » c'est bien. « truc machin bidule » c'est
            un film qui ne trouvera jamais son public.
          </li>
          <li>
            <span className={styles.label}>En rapport avec le film/série :</span> le
            lien entre la recette et l'œuvre doit être évident. C'est
            le concept du site !
          </li>
          <li>
            <span className={styles.label}>Pas de spoilers :</span> ne
            révélez pas la fin du film dans le titre de votre recette.
            « Le gâteau de la mort de [personnage] » — non merci.
          </li>
        </ul>

        <h3 className={styles.sectionTitle}>🎥 Les instructions — votre script de tournage</h3>
        <ul className={styles.list}>
          <li>
            <span className={styles.label}>Étapes claires :</span> comme
            un script, chaque étape doit être compréhensible. Si même
            un figurant peut suivre, c'est gagné.
          </li>
          <li>
            <span className={styles.label}>En français :</span> les recettes
            doivent être rédigées en français. Les termes techniques
            culinaires étrangers sont acceptés (al dente, wok, etc.).
          </li>
          <li>
            <span className={styles.label}>Quantités précises :</span> « un
            peu de sel » c'est flou comme un film en 144p.
            Préférez « 1 cuillère à café de sel ».
          </li>
          <li>
            <span className={styles.label}>Temps indiqués :</span> précisez
            le temps de préparation et de cuisson. Le public aime
            savoir combien de temps dure le film avant de s'installer.
          </li>
        </ul>

        <h3 className={styles.sectionTitle}>📸 La photo — votre bande-annonce</h3>
        <ul className={styles.list}>
          <li>
            <span className={styles.label}>Photo de la recette :</span> une
            bonne bande-annonce donne envie d'aller voir le film.
            Une bonne photo donne envie de cuisiner.
          </li>
          <li>
            <span className={styles.label}>Pas de photos volées :</span> uniquement
            vos propres photos ou des images libres de droits. On ne
            pique pas les affiches des autres productions.
          </li>
          <li>
            <span className={styles.label}>Contenu approprié :</span> la
            photo doit montrer de la nourriture. Pas votre chat,
            pas votre salon, pas un mème de Gordon Ramsay.
          </li>
        </ul>

        <h3 className={styles.sectionTitle}>🎞️ Le lien film/série — votre genre cinématographique</h3>
        <ul className={styles.list}>
          <li>
            <span className={styles.label}>Obligatoire :</span> chaque
            recette DOIT être associée à un film ou une série. C'est
            le pitch de notre production.
          </li>
          <li>
            <span className={styles.label}>Lien cohérent :</span> la recette
            doit avoir un rapport avec l'œuvre choisie — inspirée d'une
            scène, d'un personnage, d'un univers. « Salade verte »
            associée à « Fast & Furious » ne passera pas le casting.
          </li>
        </ul>
      </section>

      {/* ── 3. Les accessoires ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          🧂 Acte 3 — Les accessoires (règles sur les ingrédients)
        </h2>
        <p>
          Les ingrédients sont les accessoires de votre tournage.
          Comme les props d'un film, ils doivent être identifiables
          et validés par la production avant d'apparaître à l'écran.
        </p>
        <ul className={styles.list}>
          <li>
            <span className={styles.label}>Nom clair et précis :</span> « tomates »
            c'est bien. « le truc rouge qui pousse dans le jardin »,
            c'est un accessoire qui ne passera pas la porte du studio.
          </li>
          <li>
            <span className={styles.label}>En français :</span> utilisez
            le nom français des ingrédients. Les noms d'origine sont
            acceptés quand ils sont courants (wasabi, mozzarella,
            chorizo...).
          </li>
          <li>
            <span className={styles.label}>Pas de doublons :</span> avant
            de soumettre un ingrédient, vérifiez qu'il n'existe pas
            déjà. « Tomate » et « tomates » et « TOMATE », c'est
            comme tourner 3 fois la même scène — une seule suffit.
          </li>
          <li>
            <span className={styles.label}>Validation obligatoire :</span> chaque
            nouvel ingrédient est soumis à l'approbation de l'admin.
            C'est le directeur artistique qui valide les accessoires
            avant qu'ils n'apparaissent dans le film.
          </li>
          <li>
            <span className={styles.label}>Ingrédients légaux :</span> uniquement
            des ingrédients alimentaires légaux. On ne tourne pas
            « Breaking Bad » ici.
          </li>
        </ul>
      </section>

      {/* ── 4. Le workflow ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          🎬 Acte 4 — De l'écriture à la sortie en salle
        </h2>
        <p>
          Comme au cinéma, une recette passe par plusieurs étapes
          avant d'être projetée au public. Voici le processus de
          production :
        </p>
        <ul className={styles.list}>
          <li>
            <span className={styles.label}>📝 Brouillon (DRAFT) :</span> vous
            écrivez votre scénario. C'est votre espace de travail privé.
            Prenez votre temps, peaufinez, réécrivez. Hitchcock faisait
            pareil.
          </li>
          <li>
            <span className={styles.label}>📤 Soumission (PENDING) :</span> quand
            vous êtes satisfait, vous soumettez votre recette au
            réalisateur. C'est comme envoyer votre script au producteur.
            Pas de retour en arrière possible sans l'avis de l'admin.
          </li>
          <li>
            <span className={styles.label}>✅ Publication (PUBLISHED) :</span> le
            réalisateur crie « Coupez, c'est dans la boîte ! ».
            Votre recette est en salle, visible par tout le public.
            Bravo, vous êtes une star !
          </li>
          <li>
            <span className={styles.label}>❌ Refus (retour en DRAFT) :</span> le
            réalisateur demande des modifications. Pas de panique,
            même Spielberg a dû refaire des prises ! Consultez le
            motif du refus dans votre espace membre et retravaillez
            votre scénario.
          </li>
        </ul>
        <p className={styles.tmdb}>
          🎯 Rappel important : l'admin est le seul juge de la
          publication. Toute recette, qu'elle soit nouvelle ou modifiée,
          repasse systématiquement par la validation. Pas de
          négociation possible — c'est le réalisateur qui a le
          dernier mot sur le montage final.
        </p>
      </section>

      {/* ── 5. Les sanctions ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          🚫 Acte 5 — Le clap de fin (sanctions)
        </h2>
        <p>
          Personne ne veut être viré du plateau, mais parfois le
          réalisateur doit sévir. Voici l'échelle des sanctions,
          du simple rappel à l'ordre au générique de fin :
        </p>
        <ul className={styles.list}>
          <li>
            <span className={styles.label}>🟡 Prise 1 — Le rappel :</span> un
            simple mot du réalisateur. Votre recette est refusée avec
            un motif explicatif. Corrigez et resoumettez. Tout le
            monde a droit à une deuxième prise.
          </li>
          <li>
            <span className={styles.label}>🟠 Prise 2 — L'avertissement :</span> en
            cas de récidive ou de contenu clairement inapproprié.
            Votre recette est supprimée et vous recevez un avertissement.
            Comme un carton jaune, mais version cinéma.
          </li>
          <li>
            <span className={styles.label}>🔴 Prise 3 — Le clap de fin :</span> en
            cas de violations graves ou répétées, votre compte est
            supprimé. Fondu au noir. Générique. Vos recettes publiées
            restent visibles de manière anonyme, mais vous quittez
            la distribution.
          </li>
        </ul>
        <p>
          Les violations graves (contenu illégal, harcèlement, usurpation
          d'identité) entraînent une suppression immédiate sans avertissement
          préalable. Même les plus grandes stars peuvent être coupées
          au montage.
        </p>
      </section>

      {/* ── 6. Le mot du réalisateur ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          🎤 Épilogue — Le mot du réalisateur
        </h2>
        <p>
          Cinés Délices, c'est avant tout une aventure collective. Chaque
          recette que vous partagez enrichit notre catalogue et fait vivre
          la communauté. Ces règles ne sont pas là pour brider votre
          créativité, mais pour que chaque contribution soit digne
          d'une projection en salle.
        </p>
        <p>
          Alors, enfilez votre tablier, choisissez votre film préféré,
          et... <strong>Action !</strong> 🎬
        </p>
        <p>
          Pour toute question sur la modération, contactez l'équipe via
          la <Link to="/contact" className={styles.link}>page Contact</Link>.
          Pour comprendre comment nous protégeons vos données, consultez nos{' '}
          <Link to="/mentions-legales" className={styles.link}>mentions légales</Link>.
        </p>
      </section>

      {/* ── Dernière mise à jour ── */}
      <p style={{ textAlign: 'center', opacity: 0.4, fontSize: '0.8rem', marginTop: '2rem' }}>
        Dernière mise à jour : mars 2026
      </p>
    </div>
  );
}
