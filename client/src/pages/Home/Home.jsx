import { Link } from "react-router-dom";
import HomeCategories from "../../components/HomeCategories";
import styles from "./Home.module.scss";

function Home() {
  const [medias, setMedias] = useState([]);

  useEffect(() => {
    fetchMedia('movie').then(setMedias);
  }, []);

  return (
    <section className={styles.container}>
      <h1 className={styles.title}>CinéDélices</h1>
      <p className={styles.subtitle}>Bienvenue sur CinéDélices</p>
      <p className={styles.description}>
        Explorez des films et trouvez l&apos;inspiration pour vos prochaines recettes.
      </p>
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

      <div className={styles.searchBlock}>
        <label className={styles.searchLabel} htmlFor="home-search">
          Rechercher un film
        </label>
        
      </div>
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