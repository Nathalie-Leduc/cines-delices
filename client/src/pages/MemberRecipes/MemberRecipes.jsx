import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './MemberRecipes.module.scss';

const FILM_SEARCH_API = import.meta.env.VITE_FILM_SEARCH_API || 'http://localhost:3000/api/titles/search';
const INGREDIENT_SEARCH_API = import.meta.env.VITE_INGREDIENT_SEARCH_API || 'http://localhost:3000/api/ingredients/search';
const INGREDIENT_CREATE_API = import.meta.env.VITE_INGREDIENT_CREATE_API || 'http://localhost:3000/api/ingredients';
const unitesOptions = ['g', 'kg', 'ml', 'L', 'cl', 'pièce(s)', 'cuillère(s) à soupe', 'cuillère(s) à café', 'pincée(s)'];

const mockRecettes = [
  {
    id: 1,
    titre: 'Bruschetta Toscane',
    categorie: 'Entrée',
    filmId: 101,
    film: 'Le Parrain',
    ingredients: ['Tomates', 'Basilic', 'Pain'],
    tempsPreparation: '15 min',
    tempsCuisson: '10 min',
    temps: '25 min',
    type: 'F',
    image: 'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?w=400',
  },
  {
    id: 2,
    titre: 'Mini Burgers BBQ',
    categorie: 'Entrée',
    filmId: 202,
    film: 'Stranger Things',
    ingredients: ['Pain burger', 'Steak', 'Sauce BBQ'],
    tempsPreparation: '30 min',
    tempsCuisson: '20 min',
    temps: '50 min',
    type: 'S',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400',
  },
  {
    id: 3,
    titre: 'Bruschetta Toscane',
    categorie: 'Plat',
    filmId: 101,
    film: 'Le Parrain',
    ingredients: ['Tomates', 'Basilic', 'Pain'],
    tempsPreparation: '15 min',
    tempsCuisson: '10 min',
    temps: '25 min',
    type: 'F',
    image: 'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?w=400',
  },
  {
    id: 4,
    titre: 'Mini Burgers BBQ',
    categorie: 'Dessert',
    filmId: 202,
    film: 'Stranger Things',
    ingredients: ['Pain burger', 'Steak', 'Sauce BBQ'],
    tempsPreparation: '30 min',
    tempsCuisson: '20 min',
    temps: '50 min',
    type: 'S',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400',
  },
];

export default function MesRecettes() {
  const navigate = useNavigate();
  const accountItems = [
    {
      icon: '/icon/Recipes.svg',
      label: 'Mes recettes',
      sub: `${mockRecettes.length} recettes`,
      path: '/membre/mes-recettes',
      active: true,
    },
    {
      icon: '/icon/User.svg',
      label: 'Mes informations',
      sub: 'johndoe@email.com',
      path: '/membre/profil',
      active: false,
    },
    {
      icon: '/icon/Contact.svg',
      label: 'Contact',
      sub: 'help@support.cine-delices.com',
      path: '/contact',
      active: false,
    },
  ];
  const [recipes, setRecipes] = useState(mockRecettes);
  const [activeFilter, setActiveFilter] = useState('Tous');
  const [newRecipeName, setNewRecipeName] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showEditConfirmModal, setShowEditConfirmModal] = useState(false);
  const [filmResults, setFilmResults] = useState([]);
  const [filmSearchLoading, setFilmSearchLoading] = useState(false);
  const [filmSearchError, setFilmSearchError] = useState('');
  const [editImageError, setEditImageError] = useState('');
  const [editIngredientSearchResults, setEditIngredientSearchResults] = useState({});
  const [editIngredientSearchLoading, setEditIngredientSearchLoading] = useState({});
  const [editIngredientSearchError, setEditIngredientSearchError] = useState({});
  const [creatingEditIngredient, setCreatingEditIngredient] = useState({});
  const filmSearchTimeoutRef = useRef(null);
  const editIngredientSearchTimeouts = useRef({});
  const [recetteToDelete, setRecetteToDelete] = useState(null);
  const [editForm, setEditForm] = useState({
    id: null,
    titre: '',
    categorie: 'Entrée',
    filmId: null,
    film: '',
    image: '',
    tempsPreparation: '',
    tempsCuisson: '',
    nbPersonnes: '',
    ingredients: [{ ingredientId: null, nom: '', quantite: '', unite: '' }],
    etapes: [''],
    temps: '',
    type: 'F',
  });

  const categories = [
    { label: 'Tous', count: recipes.length, color: 'tous' },
    { label: 'Entrée', count: recipes.filter(r => r.categorie === 'Entrée').length, color: 'entree' },
    { label: 'Plat', count: recipes.filter(r => r.categorie === 'Plat').length, color: 'plat' },
    { label: 'Dessert', count: recipes.filter(r => r.categorie === 'Dessert').length, color: 'dessert' },
    { label: 'Boisson', count: recipes.filter(r => r.categorie === 'Boisson').length, color: 'boisson' },
  ];

  const filtered = activeFilter === 'Tous'
    ? recipes
    : recipes.filter(r => r.categorie === activeFilter);

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
    setRecipes(prev => prev.filter(recette => recette.id !== recetteToDelete?.id));
    setShowDeleteModal(false);
    setRecetteToDelete(null);
  }

  function handleEditClick(recette) {
    setEditForm({
      id: recette.id,
      titre: recette.titre,
      categorie: recette.categorie,
      filmId: recette.filmId || null,
      film: recette.film,
      image: recette.image,
      tempsPreparation: recette.tempsPreparation || recette.temps || '',
      tempsCuisson: recette.tempsCuisson || '',
      nbPersonnes: recette.nbPersonnes || '',
      ingredients: (recette.ingredients || []).length > 0
        ? recette.ingredients.map(item => ({
            ingredientId: item?.ingredientId || null,
            nom: typeof item === 'string' ? item : (item?.nom || ''),
            quantite: typeof item === 'string' ? '' : (item?.quantite || ''),
            unite: typeof item === 'string' ? '' : (item?.unite || ''),
          }))
        : [{ ingredientId: null, nom: '', quantite: '', unite: '' }],
      etapes: recette.etapes && recette.etapes.length > 0 ? recette.etapes : [''],
      temps: recette.temps,
      type: recette.type,
    });
    setFilmResults([]);
    setFilmSearchError('');
    setEditImageError('');
    setEditIngredientSearchResults({});
    setEditIngredientSearchLoading({});
    setEditIngredientSearchError({});
    setCreatingEditIngredient({});
    setShowEditModal(true);
  }

  function handleEditChange(field, value) {
    setEditForm(prev => ({
      ...prev,
      [field]: value,
      ...(field === 'film' ? { filmId: null } : {}),
    }));
  }

  function handleEditIngredientChange(index, field, value) {
    const updated = [...editForm.ingredients];
    updated[index][field] = value;

    if (field === 'nom') {
      updated[index].ingredientId = null;
    }

    setEditForm(prev => ({ ...prev, ingredients: updated }));
  }

  function addEditIngredient() {
    setEditForm(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, { ingredientId: null, nom: '', quantite: '', unite: '' }],
    }));
  }

  function removeEditIngredient(index) {
    setEditForm(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index),
    }));

    setEditIngredientSearchResults(prev => ({ ...prev, [index]: [] }));
    setEditIngredientSearchLoading(prev => ({ ...prev, [index]: false }));
    setEditIngredientSearchError(prev => ({ ...prev, [index]: '' }));
  }

  function handleEditEtapeChange(index, value) {
    const updated = [...editForm.etapes];
    updated[index] = value;
    setEditForm(prev => ({ ...prev, etapes: updated }));
  }

  function addEditEtape() {
    setEditForm(prev => ({ ...prev, etapes: [...prev.etapes, ''] }));
  }

  function removeEditEtape(index) {
    setEditForm(prev => ({
      ...prev,
      etapes: prev.etapes.filter((_, i) => i !== index),
    }));
  }

  function clearEditIngredientSearchState(index) {
    setEditIngredientSearchResults(prev => ({ ...prev, [index]: [] }));
    setEditIngredientSearchLoading(prev => ({ ...prev, [index]: false }));
    setEditIngredientSearchError(prev => ({ ...prev, [index]: '' }));
  }

  async function searchEditIngredients(index, query) {
    const trimmed = query.trim();

    if (trimmed.length < 2) {
      clearEditIngredientSearchState(index);
      return;
    }

    setEditIngredientSearchLoading(prev => ({ ...prev, [index]: true }));
    setEditIngredientSearchError(prev => ({ ...prev, [index]: '' }));

    try {
      const response = await fetch(`${INGREDIENT_SEARCH_API}?q=${encodeURIComponent(trimmed)}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const payload = await response.json();
      const rawList = Array.isArray(payload) ? payload : payload.data || [];
      const normalized = rawList.map(item => ({
        id: item.id,
        name: item.name || item.nom || '',
      })).filter(item => item.name);

      setEditIngredientSearchResults(prev => ({ ...prev, [index]: normalized }));
    } catch {
      setEditIngredientSearchResults(prev => ({ ...prev, [index]: [] }));
      setEditIngredientSearchError(prev => ({
        ...prev,
        [index]: "Impossible de rechercher les ingrédients pour l'instant.",
      }));
    } finally {
      setEditIngredientSearchLoading(prev => ({ ...prev, [index]: false }));
    }
  }

  function handleEditIngredientNameInput(index, value) {
    handleEditIngredientChange(index, 'nom', value);

    clearTimeout(editIngredientSearchTimeouts.current[index]);
    editIngredientSearchTimeouts.current[index] = setTimeout(() => {
      searchEditIngredients(index, value);
    }, 300);
  }

  function selectEditIngredient(index, ingredient) {
    const updated = [...editForm.ingredients];
    updated[index].ingredientId = ingredient.id || null;
    updated[index].nom = ingredient.name;
    setEditForm(prev => ({ ...prev, ingredients: updated }));
    clearEditIngredientSearchState(index);
  }

  async function createEditIngredient(index) {
    const name = editForm.ingredients[index]?.nom?.trim();
    if (!name) {
      return;
    }

    setCreatingEditIngredient(prev => ({ ...prev, [index]: true }));
    setEditIngredientSearchError(prev => ({ ...prev, [index]: '' }));

    try {
      const response = await fetch(INGREDIENT_CREATE_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const created = await response.json();
      selectEditIngredient(index, {
        id: created.id,
        name: created.name || created.nom || name,
      });
    } catch {
      setEditIngredientSearchError(prev => ({
        ...prev,
        [index]: "Impossible de créer l'ingrédient pour l'instant.",
      }));
    } finally {
      setCreatingEditIngredient(prev => ({ ...prev, [index]: false }));
    }
  }

  function isPngFile(file) {
    return Boolean(file) && (file.type === 'image/png' || file.name.toLowerCase().endsWith('.png'));
  }

  function handleEditImageChange(file) {
    if (!file) {
      return;
    }

    if (!isPngFile(file)) {
      setEditImageError('Veuillez utiliser une image .png.');
      return;
    }

    setEditImageError('');
    setEditForm(prev => ({ ...prev, image: URL.createObjectURL(file) }));
  }

  async function searchFilms(query) {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setFilmResults([]);
      setFilmSearchLoading(false);
      setFilmSearchError('');
      return;
    }

    setFilmSearchLoading(true);
    setFilmSearchError('');

    try {
      const response = await fetch(`${FILM_SEARCH_API}?q=${encodeURIComponent(trimmed)}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const payload = await response.json();
      const rawList = Array.isArray(payload) ? payload : payload.data || [];
      const normalized = rawList.map(item => ({
        id: item.id,
        title: item.title || item.titre || item.name || item.nom || '',
        type: item.type || item.mediaType || '',
      })).filter(item => item.title);

      setFilmResults(normalized);
    } catch {
      setFilmResults([]);
      setFilmSearchError("Impossible de rechercher les films/series pour l'instant.");
    } finally {
      setFilmSearchLoading(false);
    }
  }

  function handleFilmInput(value) {
    handleEditChange('film', value);
    clearTimeout(filmSearchTimeoutRef.current);
    filmSearchTimeoutRef.current = setTimeout(() => {
      searchFilms(value);
    }, 300);
  }

  function selectFilm(film) {
    setEditForm(prev => ({
      ...prev,
      filmId: film.id || null,
      film: film.title,
      type: film.type?.toLowerCase().includes('serie') ? 'S' : prev.type,
    }));
    setFilmResults([]);
  }

  function handleEditSave() {
    const computedTime = [editForm.tempsPreparation, editForm.tempsCuisson]
      .filter(Boolean)
      .join(' + ')
      .trim();

    setRecipes(prev => prev.map(recette => (
      recette.id === editForm.id
        ? {
            ...recette,
            titre: editForm.titre,
            categorie: editForm.categorie,
            filmId: editForm.filmId,
            film: editForm.film,
            nbPersonnes: editForm.nbPersonnes,
            ingredients: editForm.ingredients,
            etapes: editForm.etapes,
            tempsPreparation: editForm.tempsPreparation,
            tempsCuisson: editForm.tempsCuisson,
            temps: computedTime || editForm.temps,
            type: editForm.type,
            image: editForm.image,
          }
        : recette
    )));

    setShowEditModal(false);
    setShowEditConfirmModal(false);
  }

  function openEditConfirmModal() {
    setShowEditConfirmModal(true);
  }

  function handleLogout() {
    localStorage.removeItem('token');
    navigate('/');
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

      {showEditModal && (
        <div className={styles.overlay}>
          <div className={`${styles.modal} ${styles.editModal}`}>
            <h2 className={styles.editTitle}>Modifier la recette</h2>

            <div className={styles.editFields}>
              <label className={styles.editLabel}>
                Titre
                <input
                  className={styles.editInput}
                  type="text"
                  value={editForm.titre}
                  onChange={e => handleEditChange('titre', e.target.value)}
                />
              </label>

              <label className={styles.editLabel}>
                Catégorie
                <select
                  className={styles.editInput}
                  value={editForm.categorie}
                  onChange={e => handleEditChange('categorie', e.target.value)}
                >
                  <option value="Entrée">Entrée</option>
                  <option value="Plat">Plat</option>
                  <option value="Dessert">Dessert</option>
                  <option value="Boisson">Boisson</option>
                </select>
              </label>

              <label className={styles.editLabel}>
                Film ou série
                <input
                  className={styles.editInput}
                  type="text"
                  value={editForm.film}
                  onChange={e => handleFilmInput(e.target.value)}
                />
              </label>

              {(filmSearchLoading || filmSearchError || filmResults.length > 0) && (
                <div className={styles.filmSearchBox}>
                  {filmSearchLoading && (
                    <p className={styles.filmSearchText}>Recherche en cours...</p>
                  )}

                  {filmSearchError && (
                    <p className={styles.filmSearchError}>{filmSearchError}</p>
                  )}

                  {filmResults.length > 0 && (
                    <ul className={styles.filmSuggestionList}>
                      {filmResults.map(result => (
                        <li key={result.id || result.title}>
                          <button
                            type="button"
                            className={styles.filmSuggestionBtn}
                            onClick={() => selectFilm(result)}
                          >
                            {result.title}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              <label className={styles.editLabel}>
                Type
                <select
                  className={styles.editInput}
                  value={editForm.type}
                  onChange={e => handleEditChange('type', e.target.value)}
                >
                  <option value="F">Film</option>
                  <option value="S">Série</option>
                </select>
              </label>

              <label className={styles.editLabel}>
                Nombre de personnes
                <input
                  className={styles.editInput}
                  type="number"
                  value={editForm.nbPersonnes}
                  onChange={e => handleEditChange('nbPersonnes', e.target.value)}
                />
              </label>

              <div className={styles.editLabelBlock}>
                <span className={styles.editLabelTitle}>Ingrédients</span>
                {editForm.ingredients.map((ing, index) => (
                  <div key={index} className={styles.editIngredientRow}>
                    <input
                      className={styles.editInput}
                      type="text"
                      placeholder="Rechercher un ingrédient..."
                      value={ing.nom}
                      onChange={e => handleEditIngredientNameInput(index, e.target.value)}
                    />

                    {(editIngredientSearchLoading[index]
                      || (editIngredientSearchResults[index] && editIngredientSearchResults[index].length > 0)
                      || editIngredientSearchError[index]
                      || (ing.nom.trim().length >= 2 && !editIngredientSearchLoading[index]
                        && (!editIngredientSearchResults[index] || editIngredientSearchResults[index].length === 0))) && (
                      <div className={styles.filmSearchBox}>
                        {editIngredientSearchLoading[index] && (
                          <p className={styles.filmSearchText}>Recherche en cours...</p>
                        )}

                        {editIngredientSearchError[index] && (
                          <p className={styles.filmSearchError}>{editIngredientSearchError[index]}</p>
                        )}

                        {editIngredientSearchResults[index] && editIngredientSearchResults[index].length > 0 && (
                          <ul className={styles.filmSuggestionList}>
                            {editIngredientSearchResults[index].map(result => (
                              <li key={result.id || result.name}>
                                <button
                                  type="button"
                                  className={styles.filmSuggestionBtn}
                                  onClick={() => selectEditIngredient(index, result)}
                                >
                                  {result.name}
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}

                        {!editIngredientSearchLoading[index]
                          && !editIngredientSearchError[index]
                          && ing.nom.trim().length >= 2
                          && (!editIngredientSearchResults[index] || editIngredientSearchResults[index].length === 0) && (
                            <button
                              type="button"
                              className={styles.createIngredientBtn}
                              onClick={() => createEditIngredient(index)}
                              disabled={creatingEditIngredient[index]}
                            >
                              {creatingEditIngredient[index]
                                ? 'Creation...'
                                : `Creer l'ingredient "${ing.nom.trim()}"`}
                            </button>
                          )}
                      </div>
                    )}

                    <div className={styles.editIngredientBottom}>
                      <input
                        className={`${styles.editInput} ${styles.editQuantiteInput}`}
                        type="number"
                        placeholder="Qté"
                        value={ing.quantite}
                        onChange={e => handleEditIngredientChange(index, 'quantite', e.target.value)}
                      />

                      <select
                        className={styles.editInput}
                        value={ing.unite}
                        onChange={e => handleEditIngredientChange(index, 'unite', e.target.value)}
                      >
                        <option value="">Unité</option>
                        {unitesOptions.map(unite => (
                          <option key={unite} value={unite}>{unite}</option>
                        ))}
                      </select>

                      {editForm.ingredients.length > 1 && (
                        <button
                          type="button"
                          className={styles.removeSmallBtn}
                          onClick={() => removeEditIngredient(index)}
                        >
                          −
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  className={styles.addSmallBtn}
                  onClick={addEditIngredient}
                >
                  + Ajouter un ingrédient
                </button>
              </div>

              <label className={styles.editLabel}>
                Temps de préparation
                <input
                  className={styles.editInput}
                  type="text"
                  value={editForm.tempsPreparation}
                  onChange={e => handleEditChange('tempsPreparation', e.target.value)}
                />
              </label>

              <label className={styles.editLabel}>
                Temps de cuisson
                <input
                  className={styles.editInput}
                  type="text"
                  value={editForm.tempsCuisson}
                  onChange={e => handleEditChange('tempsCuisson', e.target.value)}
                />
              </label>

              <div className={styles.editLabelBlock}>
                <span className={styles.editLabelTitle}>Étapes de préparation</span>
                {editForm.etapes.map((etape, index) => (
                  <div key={index} className={styles.editEtapeRow}>
                    <span className={styles.editEtapeNumber}>{index + 1}</span>
                    <textarea
                      className={styles.editTextarea}
                      placeholder={`Étape ${index + 1}...`}
                      value={etape}
                      onChange={e => handleEditEtapeChange(index, e.target.value)}
                      rows={2}
                    />
                    {editForm.etapes.length > 1 && (
                      <button
                        type="button"
                        className={styles.removeSmallBtn}
                        onClick={() => removeEditEtape(index)}
                      >
                        −
                      </button>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  className={styles.addSmallBtn}
                  onClick={addEditEtape}
                >
                  + Ajouter une étape
                </button>
              </div>

              <label className={styles.editLabel}>
                Image (.png)
                <input
                  className={styles.editInput}
                  type="file"
                  accept=".png,image/png"
                  onChange={e => handleEditImageChange(e.target.files?.[0])}
                />
              </label>

              <label className={styles.editLabel}>
                Ou URL image
                <input
                  className={styles.editInput}
                  type="url"
                  value={editForm.image}
                  onChange={e => handleEditChange('image', e.target.value)}
                />
              </label>

              {editImageError && <p className={styles.editErrorText}>{editImageError}</p>}
            </div>

            <div className={styles.modalButtons}>
              <button
                className={styles.cancelBtn}
                onClick={() => setShowEditModal(false)}
              >
                Annuler
              </button>
              <button
                className={styles.confirmBtn}
                onClick={openEditConfirmModal}
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditConfirmModal && (
        <div className={`${styles.overlay} ${styles.confirmOverlay}`}>
          <div className={`${styles.modal} ${styles.confirmModal}`}>
            <p className={styles.modalText}>
              Voulez-vous confirmer les modifications de cette recette ?
            </p>
            <div className={styles.modalButtons}>
              <button
                className={styles.cancelBtn}
                onClick={() => setShowEditConfirmModal(false)}
              >
                Annuler
              </button>
              <button
                className={styles.confirmBtn}
                onClick={handleEditSave}
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Mon compte</h1>
      </div>
      <p className={styles.welcomeText}>
        Bonjour <strong>John</strong>, bienvenue chez Cine Delices !
      </p>

      <div className={styles.desktopLayout}>
        <aside className={styles.accountPanel}>
          <div className={styles.accountLinks}>
            {accountItems.map(item => (
              <button
                key={item.path}
                type="button"
                className={`${styles.accountItem} ${item.active ? styles.accountItemActive : ''}`}
                onClick={() => navigate(item.path)}
              >
                <span className={styles.accountIcon}>
                  <img src={item.icon} alt="" aria-hidden="true" />
                </span>
                <span className={styles.accountContent}>
                  <strong>{item.label}</strong>
                  <small>{item.path === '/membre/mes-recettes' ? `${recipes.length} recettes` : item.sub}</small>
                </span>
                <span className={styles.accountArrow}>›</span>
              </button>
            ))}
          </div>

          <button type="button" className={styles.logoutBtn} onClick={handleLogout}>
            <span className={styles.logoutIcon}>
              <img src="/icon/Logout.svg" alt="" aria-hidden="true" />
            </span>
            <span>Se déconnecter</span>
            <span>›</span>
          </button>
        </aside>

        <section className={styles.recipesPanel}>
          <h2 className={styles.title}>Mes recettes</h2>

          {/* CRÉER UNE RECETTE */}
          <div className={styles.createBlock}>
            <p className={styles.createLabel}>Créer une nouvelle recette</p>
            <div className={styles.createInput}>
              <input
                className={styles.createNameInput}
                type="text"
                aria-label="Nom de la nouvelle recette"
                placeholder="Entrer son nom"
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
                      <img src={recette.image} alt="Illustration de la recette" />
                      <div className={styles.cardActions}>
                        <button
                          className={styles.actionBtn}
                          aria-label={`Modifier la recette ${recette.titre}`}
                          onClick={() => handleEditClick(recette)}
                        >
                          <img src="/icon/Edit.svg" alt="" aria-hidden="true" />
                        </button>
                        <button
                          className={styles.actionBtn}
                          aria-label={`Supprimer la recette ${recette.titre}`}
                          onClick={() => handleDeleteClick(recette)}
                        >
                          <img src="/icon/close_menu.svg" alt="" aria-hidden="true" />
                        </button>
                      </div>
                      <span className={`${styles.cardTag} ${styles[recette.categorie.toLowerCase()]}`}>
                        {recette.categorie}
                      </span>
                    </div>
                    <div className={styles.cardBody}>
                      <h3 className={styles.cardTitle}>{recette.titre}</h3>
                      <p className={styles.cardFilm}>
                        <img src="/icon/Menu.svg" alt="" aria-hidden="true" />
                        <span>{recette.film}</span>
                      </p>
                      <div className={styles.cardFooter}>
                        <span className={styles.cardTemps}>
                          <img src="/icon/Search.svg" alt="" aria-hidden="true" />
                          <span>{recette.temps}</span>
                        </span>
                        <span className={styles.cardType}>{recette.type}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>
      </div>

    </div>
  );
}