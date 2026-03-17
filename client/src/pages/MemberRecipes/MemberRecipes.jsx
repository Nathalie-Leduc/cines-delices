import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './MemberRecipes.module.scss';

const mockRecettes = [
  {
    id: 1,
    titre: 'Bruschetta Toscane',
    categorie: 'Entrée',
    film: 'Le Parrain',
    temps: '25 min',
    type: 'F',
    image: 'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?w=400',
  },
  {
    id: 2,
    titre: 'Mini Burgers BBQ',
    categorie: 'Entrée',
    film: 'Stranger Things',
    temps: '50 min',
    type: 'S',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400',
  },
  {
    id: 3,
    titre: 'Bruschetta Toscane',
    categorie: 'Plat',
    film: 'Le Parrain',
    temps: '25 min',
    type: 'F',
    image: 'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?w=400',
  },
  {
    id: 4,
    titre: 'Mini Burgers BBQ',
    categorie: 'Dessert',
    film: 'Stranger Things',
    temps: '50 min',
    type: 'S',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400',
  },
];

const categories = [
  { label: 'Tous', count: mockRecettes.length, color: 'tous' },
  { label: 'Entrée', count: mockRecettes.filter(r => r.categorie === 'Entrée').length, color: 'entree' },
  { label: 'Plat', count: mockRecettes.filter(r => r.categorie === 'Plat').length, color: 'plat' },
  { label: 'Dessert', count: mockRecettes.filter(r => r.categorie === 'Dessert').length, color: 'dessert' },
  { label: 'Boisson', count: mockRecettes.filter(r => r.categorie === 'Boisson').length, color: 'boisson' },
];

export default function MesRecettes() {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('Tous');
  const [newRecipeName, setNewRecipeName] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [recetteToDelete, setRecetteToDelete] = useState(null);

  const filtered = activeFilter === 'Tous'
    ? mockRecettes
    : mockRecettes.filter(r => r.categorie === activeFilter);

  // Grouper par catégorie
  const grouped = filtered.reduce((acc, recette) => {
    if (!acc[recette.categorie]) acc[recette.categorie] = [];
    acc[recette.categorie].push(recette);
    return acc;
  }, {});

  function handleDeleteClick(recette) {
    setRecetteToDelete(recette);
    setShowDeleteModal(true);
  }

  function handleDeleteConfirm() {
    // suppression réelle plus tard
    setShowDeleteModal(false);
    setRecetteToDelete(null);
  }

  return (
    <div className={styles.mesRecettes}>

      {/* MODALE SUPPRESSION */}
      {showDeleteModal && (
        <div className={styles.overlay}>
          <div className={styles.modal}>
            <p className={styles.modalText}>
              Êtes-vous sûr de vouloir supprimer cette recette ?
            </p>
            <div className={styles.modalButtons}>
              <button
                className={styles.cancelBtn}
                aria-label="Annuler la suppression de la recette"
                onClick={() => setShowDeleteModal(false)}
              >
                Annuler
              </button>
              <button
                className={styles.confirmBtn}
                aria-label="Confirmer la suppression de la recette"
                onClick={handleDeleteConfirm}
              >
                Valider
              </button>
            </div>
          </div>
        </div>
      )}

      <h1 className={styles.title}>Mes recettes</h1>

      {/* CRÉER UNE RECETTE */}
      <div className={styles.createBlock}>
        <p className={styles.createLabel}>Créer une nouvelle recette</p>
        <div className={styles.createInput}>
          <input
            className={styles.createNameInput}
            type="text"
            aria-label="Nom de la nouvelle recette"
            placeholder="Nom de la recette"
            value={newRecipeName}
            onChange={e => setNewRecipeName(e.target.value)}
          />
          <button className={styles.createBtn} aria-label="Aller au formulaire de création de recette" onClick={() => navigate('/membre/creer-recette')}>
            +
          </button>
        </div>
      </div>

      {/* FILTRES */}
      <div className={styles.filters}>
        {categories.map(cat => (
          <div key={cat.label} className={styles.filterItem}>
            <span className={`${styles.filterCount} ${styles[cat.color]}`}>
              {cat.count}
            </span>
            <button
              className={`${styles.filterBtn} ${activeFilter === cat.label ? styles[`active_${cat.color}`] : ''}`}
              aria-label={`Filtrer les recettes: ${cat.label}`}
              onClick={() => setActiveFilter(cat.label)}
            >
              {cat.label}
            </button>
          </div>
        ))}
      </div>

      {/* RECETTES GROUPÉES */}
      {Object.entries(grouped).map(([categorie, recettes]) => (
        <div key={categorie} className={styles.section}>
          <h2 className={styles.sectionTitle}>{categorie}s</h2>
          <div className={styles.grid}>
            {recettes.map(recette => (
              <div key={recette.id} className={styles.card}>
                <div className={styles.cardImage}>
                  <img src={recette.image} alt="Photo de recette" />
                  <div className={styles.cardActions}>
                    <button
                      className={styles.actionBtn}
                      aria-label={`Modifier la recette ${recette.titre}`}
                      onClick={() => navigate(`/recettes/${recette.id}/edit`)}
                    >
                      ✏️
                    </button>
                    <button
                      className={styles.actionBtn}
                      aria-label={`Supprimer la recette ${recette.titre}`}
                      onClick={() => handleDeleteClick(recette)}
                    >
                      🗑️
                    </button>
                  </div>
                  <span className={`${styles.cardTag} ${styles[recette.categorie.toLowerCase()]}`}>
                    {recette.categorie}
                  </span>
                </div>
                <div className={styles.cardBody}>
                  <h3 className={styles.cardTitle}>{recette.titre}</h3>
                  <p className={styles.cardFilm}>🎬 {recette.film}</p>
                  <div className={styles.cardFooter}>
                    <span className={styles.cardTemps}>⏱ {recette.temps}</span>
                    <span className={styles.cardType}>{recette.type}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

    </div>
  );
}