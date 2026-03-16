import styles from './Home.module.scss';

function Home() {
  return (
    <main className={styles.container}>
      <h1 className={styles.title}>CinéDélices</h1>
      <p className={styles.subtitle}>Bienvenue sur CinéDélices</p>
    </main>
  );
}

export default Home;
