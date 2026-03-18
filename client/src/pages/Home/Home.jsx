import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchMedia } from '../../services/mediaService';
import styles from './Home.module.scss';

function Home() {
  const [medias, setMedias] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchMedia('movie').then(setMedias);
  }, []);

  function handleSearch(event) {
    const value = event.target.value;
    setSearch(value);

    if (value.length > 2) {
      fetchMedia('movie', value).then(setMedias);
      return;
    }

    if (value.length === 0) {
      fetchMedia('movie').then(setMedias);
    }
  }

  return (
    <section className={styles.container}>
      <h1 className={styles.title}>CinéDélices</h1>
      <p className={styles.subtitle}>Bienvenue sur CinéDélices</p>
      <p className={styles.description}>
        Explorez des films et trouvez l&apos;inspiration pour vos prochaines recettes.
      </p>

      <div className={styles.buttonGroup}>
        <Link className={styles.primaryBtn} to="/recipes">Voir les recettes</Link>
        <Link className={styles.secondaryBtn} to="/films">Parcourir les films</Link>
      </div>

      <div className={styles.searchBlock}>
        <label className={styles.searchLabel} htmlFor="home-search">
          Rechercher un film
        </label>
        <input
          id="home-search"
          className={styles.searchInput}
          type="text"
          value={search}
          onChange={handleSearch}
          placeholder="Tapez au moins 3 lettres"
        />
      </div>

      <ul className={styles.mediaList}>
        {medias.map((media) => (
          <li key={media.id} className={styles.mediaItem}>
            {media.title || media.name}
          </li>
        ))}
      </ul>
    </section>
  );
}

export default Home;
