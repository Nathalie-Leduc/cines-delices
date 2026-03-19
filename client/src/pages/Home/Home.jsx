import { Link } from "react-router-dom";
import HomeCategories from "../../components/HomeCategories";
import styles from "./Home.module.scss";

function Home() {
  return (
    <main className={styles.container}>
      <section className={styles.hero}>
        <img
          src="/img/hero-home.png"
          alt="CinéDélices"
          className={styles.heroImage}
        />

        <div className={styles.heroOverlay} />

        <div className={styles.heroContent}>
          <h1 className={styles.title}>
            Cuisine le cinéma,
            <br />
            Savoure les séries.
          </h1>

          <p className={styles.subtitle}>
            Découvre les recettes inspirées des films et séries cultes.
          </p>

          <Link className={styles.cta} to="/recipes">
            Découvrez nos recettes
          </Link>
        </div>
      </section>

      <HomeCategories />
    </main>
  );
}

export default Home;
