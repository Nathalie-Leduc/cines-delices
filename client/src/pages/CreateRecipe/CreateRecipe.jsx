import { useRef, useState } from 'react';
import styles from './CreateRecipe.module.scss';

const categoriesOptions = ['Entrée', 'Plat', 'Dessert', 'Boisson'];
const unitesOptions = ['g', 'kg', 'ml', 'L', 'cl', 'pièce(s)', 'cuillère(s) à soupe', 'cuillère(s) à café', 'pincée(s)'];
const INGREDIENT_SEARCH_API = import.meta.env.VITE_INGREDIENT_SEARCH_API || 'http://localhost:3000/api/ingredients/search';
const INGREDIENT_CREATE_API = import.meta.env.VITE_INGREDIENT_CREATE_API || 'http://localhost:3000/api/ingredients';

export default function CreerRecette() {
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [imageError, setImageError] = useState('');
  const [ingredientSearchResults, setIngredientSearchResults] = useState({});
  const [ingredientSearchLoading, setIngredientSearchLoading] = useState({});
  const [ingredientSearchError, setIngredientSearchError] = useState({});
  const [creatingIngredient, setCreatingIngredient] = useState({});
  const ingredientSearchTimeouts = useRef({});
  const [form, setForm] = useState({
    titre: '',
    film: '',
    type: '',
    image: null,
    imageUrl: '',
    categorie: '',
    tempsPréparation: '',
    tempsCuisson: '',
    nbPersonnes: '',
    ingredients: [{ ingredientId: null, nom: '', quantite: '', unite: '' }],
    etapes: [''],
  });

  // ===== HANDLERS GÉNÉRAUX =====
  function handleChange(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function isPngFile(file) {
    return Boolean(file) && (file.type === 'image/png' || file.name.toLowerCase().endsWith('.png'));
  }

  function isPngUrl(url) {
    if (!url) {
      return false;
    }

    const normalizedUrl = url.trim().toLowerCase();
    if (normalizedUrl.startsWith('data:image/png')) {
      return true;
    }

    try {
      const parsedUrl = new URL(url.trim());
      return parsedUrl.pathname.toLowerCase().endsWith('.png');
    } catch {
      return false;
    }
  }

  function handleImageSelection(file) {
    if (!file) {
      return;
    }

    if (!isPngFile(file)) {
      setImageError('Veuillez utiliser une image au format .png uniquement.');
      setForm(prev => ({ ...prev, image: null }));
      return;
    }

    setImageError('');
    setForm(prev => ({ ...prev, image: file, imageUrl: '' }));
  }

  function handleImageUrlChange(value) {
    setForm(prev => ({ ...prev, imageUrl: value }));
    if (value.trim() === '') {
      setImageError('');
    }
  }

  function validateImageUrl() {
    if (form.imageUrl.trim() === '') {
      return;
    }

    if (!isPngUrl(form.imageUrl)) {
      setImageError('Veuillez coller une URL valide qui pointe vers une image .png.');
      return;
    }

    setImageError('');
    setForm(prev => ({ ...prev, image: null }));
  }

  // ===== INGRÉDIENTS =====
  function handleIngredientChange(index, field, value) {
    const updated = [...form.ingredients];
    updated[index][field] = value;

    if (field === 'nom') {
      updated[index].ingredientId = null;
    }

    setForm(prev => ({ ...prev, ingredients: updated }));
  }

  function clearIngredientSearchState(index) {
    setIngredientSearchResults(prev => ({ ...prev, [index]: [] }));
    setIngredientSearchLoading(prev => ({ ...prev, [index]: false }));
    setIngredientSearchError(prev => ({ ...prev, [index]: '' }));
  }

  async function searchIngredients(index, query) {
    const trimmed = query.trim();

    if (trimmed.length < 2) {
      clearIngredientSearchState(index);
      return;
    }

    setIngredientSearchLoading(prev => ({ ...prev, [index]: true }));
    setIngredientSearchError(prev => ({ ...prev, [index]: '' }));

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

      setIngredientSearchResults(prev => ({ ...prev, [index]: normalized }));
    } catch {
      setIngredientSearchResults(prev => ({ ...prev, [index]: [] }));
      setIngredientSearchError(prev => ({
        ...prev,
        [index]: "Impossible de rechercher les ingrédients pour l'instant.",
      }));
    } finally {
      setIngredientSearchLoading(prev => ({ ...prev, [index]: false }));
    }
  }

  function handleIngredientNameInput(index, value) {
    handleIngredientChange(index, 'nom', value);

    clearTimeout(ingredientSearchTimeouts.current[index]);
    ingredientSearchTimeouts.current[index] = setTimeout(() => {
      searchIngredients(index, value);
    }, 300);
  }

  function selectIngredient(index, ingredient) {
    const updated = [...form.ingredients];
    updated[index].ingredientId = ingredient.id || null;
    updated[index].nom = ingredient.name;
    setForm(prev => ({ ...prev, ingredients: updated }));
    clearIngredientSearchState(index);
  }

  async function createIngredient(index) {
    const name = form.ingredients[index]?.nom?.trim();
    if (!name) {
      return;
    }

    setCreatingIngredient(prev => ({ ...prev, [index]: true }));
    setIngredientSearchError(prev => ({ ...prev, [index]: '' }));

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
      selectIngredient(index, {
        id: created.id,
        name: created.name || created.nom || name,
      });
    } catch {
      setIngredientSearchError(prev => ({
        ...prev,
        [index]: "Impossible de créer l'ingrédient pour l'instant.",
      }));
    } finally {
      setCreatingIngredient(prev => ({ ...prev, [index]: false }));
    }
  }

  function addIngredient() {
    setForm(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, { ingredientId: null, nom: '', quantite: '', unite: '' }]
    }));
  }

  function removeIngredient(index) {
    setForm(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index)
    }));

    clearIngredientSearchState(index);
  }

  // ===== ÉTAPES =====
  function handleEtapeChange(index, value) {
    const updated = [...form.etapes];
    updated[index] = value;
    setForm(prev => ({ ...prev, etapes: updated }));
  }

  function addEtape() {
    setForm(prev => ({ ...prev, etapes: [...prev.etapes, ''] }));
  }

  function removeEtape(index) {
    setForm(prev => ({
      ...prev,
      etapes: prev.etapes.filter((_, i) => i !== index)
    }));
  }

  // ===== SUBMIT =====
  function handleSubmit() {
    console.log('Formulaire soumis :', form);
    setShowSubmitModal(false);
  }

  function openSubmitModal() {
    setShowSubmitModal(true);
  }

  return (
    <div className={styles.creerRecette}>
      {showSubmitModal && (
        <div className={styles.overlay}>
          <div className={styles.modal}>
            <p className={styles.modalText}>
              Voulez vous créer cette recette?
            </p>
            <div className={styles.modalButtons}>
              <button
                className={styles.cancelBtn}
                aria-label="Annuler la création de la recette"
                onClick={() => setShowSubmitModal(false)}
              >
                Annuler
              </button>
              <button className={styles.confirmBtn} aria-label="Valider la création de la recette" onClick={handleSubmit}>
                Valider
              </button>
            </div>
          </div>
        </div>
      )}

      <h1 className={styles.title}>Mes recettes</h1>

      {/* TITRE */}
      <div className={styles.titreBlock}>
        <span className={styles.titreDash}>—</span>
        <input
          className={styles.titreInput}
          type="text"
          aria-label="Titre de la recette"
          placeholder="Spaghetti de Tony & Joe"
          value={form.titre}
          onChange={e => handleChange('titre', e.target.value)}
        />
        <span className={styles.titreDash}>—</span>
      </div>

      {/* FILM / SÉRIE */}
      <div className={styles.field}>
        <label className={styles.label}>Choisir un film ou une série</label>
        <div className={styles.inputIcon}>
          <input
            className={styles.input}
            type="text"
            aria-label="Film ou série"
            placeholder="Rechercher un film ou une série"
            value={form.film}
            onChange={e => handleChange('film', e.target.value)}
          />
          <span className={styles.inputIconRight}>🔍</span>
        </div>
        <p className={styles.hint}>* L'appel à l'API TMDB sera branché ici</p>
      </div>

      {/* TYPE */}
      <div className={styles.field}>
        <label className={styles.label}>Type</label>
        <div className={styles.selectWrapper}>
          <select
            className={styles.select}
            aria-label="Type de contenu, film ou série"
            value={form.type}
            onChange={e => handleChange('type', e.target.value)}
          >
            <option value="">Sélectionner</option>
            <option value="F">Film</option>
            <option value="S">Série</option>
          </select>
        </div>
      </div>

      {/* IMAGE */}
      <div className={styles.field}>
        <label className={styles.label}>Ajouter une image</label>
        <div
          className={`${styles.dropZone} ${isDraggingImage ? styles.dropZoneActive : ''}`}
          onDragOver={e => {
            e.preventDefault();
            setIsDraggingImage(true);
          }}
          onDragLeave={() => setIsDraggingImage(false)}
          onDrop={e => {
            e.preventDefault();
            setIsDraggingImage(false);
            const droppedFile = e.dataTransfer.files?.[0];
            handleImageSelection(droppedFile);
          }}
        >
          <input
            id="create-recipe-image"
            className={styles.hiddenFileInput}
            type="file"
            aria-label="Choisir une image PNG"
            accept=".png,image/png"
            onChange={e => handleImageSelection(e.target.files?.[0])}
          />
          <span className={styles.inputPlaceholder}>
            {form.image ? form.image.name : 'Glisser un .png ici ou choisir un fichier'}
          </span>
          <label htmlFor="create-recipe-image" className={styles.iconBtn}>
            +
          </label>
        </div>
        <div className={styles.inputIcon}>
          <input
            className={styles.input}
            type="url"
            aria-label="URL de l'image PNG"
            placeholder="Ou collez l'URL d'une image .png"
            value={form.imageUrl}
            onChange={e => handleImageUrlChange(e.target.value)}
            onBlur={validateImageUrl}
          />
        </div>
        {imageError && <p className={styles.errorText}>{imageError}</p>}
      </div>

      {/* CATÉGORIE */}
      <div className={styles.field}>
        <label className={styles.label}>Catégorie</label>
        <div className={styles.selectWrapper}>
          <select
            className={styles.select}
            aria-label="Catégorie de la recette"
            value={form.categorie}
            onChange={e => handleChange('categorie', e.target.value)}
          >
            <option value="">Sélectionner</option>
            {categoriesOptions.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* TEMPS PRÉPARATION */}
      <div className={styles.field}>
        <label className={styles.label}>Temps de préparation</label>
        <div className={styles.selectWrapper}>
          <input
            className={styles.input}
            type="text"
            aria-label="Temps de préparation"
            placeholder="15 min"
            value={form.tempsPréparation}
            onChange={e => handleChange('tempsPréparation', e.target.value)}
          />
        </div>
      </div>

      {/* TEMPS CUISSON */}
      <div className={styles.field}>
        <label className={styles.label}>Temps de cuisson</label>
        <div className={styles.selectWrapper}>
          <input
            className={styles.input}
            type="text"
            aria-label="Temps de cuisson"
            placeholder="30 min"
            value={form.tempsCuisson}
            onChange={e => handleChange('tempsCuisson', e.target.value)}
          />
        </div>
      </div>

      {/* NOMBRE DE PERSONNES */}
      <div className={styles.field}>
        <label className={styles.label}>Nombre de personnes</label>
        <div className={styles.selectWrapper}>
          <input
            className={styles.input}
            type="number"
            aria-label="Nombre de personnes"
            placeholder="5"
            value={form.nbPersonnes}
            onChange={e => handleChange('nbPersonnes', e.target.value)}
          />
        </div>
      </div>

      {/* INGRÉDIENTS */}
      <div className={styles.field}>
        <label className={styles.label}>Ingrédients</label>

        {form.ingredients.map((ing, index) => (
          <div key={index} className={styles.ingredientRow}>
            <div className={styles.inputIcon}>
              <input
                className={styles.input}
                type="text"
                aria-label={`Nom de l'ingredient ${index + 1}`}
                placeholder="Rechercher un ingrédient..."
                value={ing.nom}
                onChange={e => handleIngredientNameInput(index, e.target.value)}
              />
              <span className={styles.inputIconRight}>🔍</span>
            </div>
            {(ingredientSearchLoading[index]
              || (ingredientSearchResults[index] && ingredientSearchResults[index].length > 0)
              || ingredientSearchError[index]
              || (ing.nom.trim().length >= 2 && !ingredientSearchLoading[index]
                && (!ingredientSearchResults[index] || ingredientSearchResults[index].length === 0))) && (
              <div className={styles.ingredientSearchBox}>
                {ingredientSearchLoading[index] && (
                  <p className={styles.ingredientSearchText}>Recherche en cours...</p>
                )}

                {ingredientSearchError[index] && (
                  <p className={styles.ingredientSearchError}>{ingredientSearchError[index]}</p>
                )}

                {ingredientSearchResults[index] && ingredientSearchResults[index].length > 0 && (
                  <ul className={styles.ingredientSuggestionList}>
                    {ingredientSearchResults[index].map(result => (
                      <li key={result.id || result.name}>
                        <button
                          type="button"
                          className={styles.ingredientSuggestionBtn}
                          aria-label={`Selectionner l'ingredient ${result.name}`}
                          onClick={() => selectIngredient(index, result)}
                        >
                          {result.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                {!ingredientSearchLoading[index]
                  && !ingredientSearchError[index]
                  && ing.nom.trim().length >= 2
                  && (!ingredientSearchResults[index] || ingredientSearchResults[index].length === 0) && (
                    <button
                      type="button"
                      className={styles.createIngredientBtn}
                      aria-label={`Creer l'ingredient ${ing.nom.trim()}`}
                      onClick={() => createIngredient(index)}
                      disabled={creatingIngredient[index]}
                    >
                      {creatingIngredient[index]
                        ? 'Creation...'
                        : `Creer l'ingredient "${ing.nom.trim()}"`}
                    </button>
                  )}
              </div>
            )}
<div className={styles.ingredientBottom}>

  <input
    className={styles.inputQuantite}
    type="number"
    aria-label={`Quantite de l'ingredient ${index + 1}`}
    placeholder="Qté"
    value={ing.quantite}
    onChange={e => handleIngredientChange(index, 'quantite', e.target.value)}
  />

  <div className={styles.selectWrapper} style={{ flex: 1 }}>
    <select
      className={styles.select}
      aria-label={`Unite de l'ingredient ${index + 1}`}
      value={ing.unite}
      onChange={e => handleIngredientChange(index, 'unite', e.target.value)}
    >
      <option value="">Unité</option>
      {unitesOptions.map(u => (
        <option key={u} value={u}>{u}</option>
      ))}
    </select>
  </div>

  {form.ingredients.length > 1 && (
    <button
      className={styles.removeBtn}
      aria-label={`Supprimer l'ingredient ${index + 1}`}
      onClick={() => removeIngredient(index)}
    >
      −
    </button>
  )}

</div>
      
          </div>
        ))}

        <button className={styles.addIngredientBtn} aria-label="Ajouter un ingredient" onClick={addIngredient}>
          + Ajouter un ingrédient
        </button>
      </div>

      {/* ÉTAPES */}
      <div className={styles.field}>
        <label className={styles.label}>Étapes de préparation</label>

        {form.etapes.map((etape, index) => (
          <div key={index} className={styles.etapeRow}>
            <div className={styles.etapeNumber}>{index + 1}</div>
            <textarea
              className={styles.textarea}
              aria-label={`Etape de preparation ${index + 1}`}
              placeholder={`Étape ${index + 1}...`}
              value={etape}
              onChange={e => handleEtapeChange(index, e.target.value)}
              rows={2}
            />
            {form.etapes.length > 1 && (
              <button
                className={styles.removeBtn}
                aria-label={`Supprimer l'etape ${index + 1}`}
                onClick={() => removeEtape(index)}
              >
                −
              </button>
            )}
          </div>
        ))}

        <div className={styles.inputIcon}>
          <span className={styles.inputPlaceholder}>Étape {form.etapes.length + 1}...</span>
          <button className={styles.iconBtn} aria-label="Ajouter une etape" onClick={addEtape}>+</button>
        </div>
      </div>

      {/* SUBMIT */}
      <button className={styles.submitBtn} aria-label="Ouvrir la confirmation de creation de recette" onClick={openSubmitModal}>
        Valider
      </button>

    </div>
  );
}