import styles from '../../pages/MemberRecipes/MemberRecipes.module.scss';
import {
  getMediaSuggestionMeta,
  MEDIA_SUGGESTION_POSTER_FALLBACK,
} from '../../utils/mediaSearch.js';
import { buildCategoryFilters } from '../RecipeCatalogView/recipeCatalog.shared.js';

export default function RecipeEditModal({
  showEditModal,
  showEditConfirmModal,
  isSavingEdit,
  editForm,
  editImageError,
  filmResults,
  filmSearchLoading,
  filmSearchError,
  editIngredientSearchResults,
  editIngredientSearchLoading,
  editIngredientSearchError,
  creatingEditIngredient,
  availableCategories,
  unitesOptions,
  onClose,
  onCloseConfirm,
  onSave,
  onOpenConfirm,
  onEditChange,
  onFilmInput,
  onSelectFilm,
  onIngredientNameInput,
  onSelectIngredient,
  onCreateIngredient,
  onIngredientChange,
  onAddIngredient,
  onRemoveIngredient,
  onEtapeChange,
  onAddEtape,
  onRemoveEtape,
  onImageChange,
}) {
  if (!showEditModal && !showEditConfirmModal) return null;

  return (
    <>
      {showEditModal && (
        <div
          className={styles.overlay}
          onClick={() => {
            if (!isSavingEdit) {
              onClose();
            }
          }}
        >
          <div
            className={`${styles.modal} ${styles.editModal}`}
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className={styles.editTitle}>Modifier la recette</h2>

            <div className={styles.editFields}>
              <label className={styles.editLabel}>
                Titre
                <input
                  className={styles.editInput}
                  type="text"
                  value={editForm.titre}
                  onChange={e => onEditChange('titre', e.target.value)}
                />
              </label>

              <label className={styles.editLabel}>
                Catégorie
                <select
                  className={styles.editInput}
                  value={editForm.categorie}
                  onChange={e => onEditChange('categorie', e.target.value)}
                >
                  {buildCategoryFilters(availableCategories)
                    .filter((category) => category.value !== 'Tous')
                    .map((category) => (
                      <option key={category.key} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                </select>
              </label>

              <label className={styles.editLabel}>
                Film ou série
                <input
                  className={styles.editInput}
                  type="text"
                  value={editForm.film}
                  onChange={e => onFilmInput(e.target.value)}
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
                            onClick={() => onSelectFilm(result)}
                          >
                            <img
                              src={result.poster || MEDIA_SUGGESTION_POSTER_FALLBACK}
                              alt=""
                              aria-hidden="true"
                              className={styles.filmSuggestionPoster}
                            />
                            <span className={styles.filmSuggestionCopy}>
                              <span className={styles.filmSuggestionTitle}>{result.title}</span>
                              <span className={styles.filmSuggestionMeta}>{getMediaSuggestionMeta(result)}</span>
                            </span>
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
                  onChange={e => onEditChange('type', e.target.value)}
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
                  onChange={e => onEditChange('nbPersonnes', e.target.value)}
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
                      onChange={e => onIngredientNameInput(index, e.target.value)}
                    />

                    {(editIngredientSearchLoading[index]
                      || (editIngredientSearchResults[index] && editIngredientSearchResults[index].length > 0)
                      || editIngredientSearchError[index]
                      || (!ing.ingredientId && ing.nom.trim().length >= 2 && !editIngredientSearchLoading[index]
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
                                  onClick={() => onSelectIngredient(index, result)}
                                >
                                  {result.name}
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}

                        {!editIngredientSearchLoading[index]
                          && !editIngredientSearchError[index]
                          && !ing.ingredientId
                          && ing.nom.trim().length >= 2
                          && (!editIngredientSearchResults[index] || editIngredientSearchResults[index].length === 0) && (
                            <button
                              type="button"
                              className={styles.createIngredientBtn}
                              onClick={() => onCreateIngredient(index)}
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
                        onChange={e => onIngredientChange(index, 'quantite', e.target.value)}
                      />

                      <select
                        className={styles.editInput}
                        value={ing.unite}
                        onChange={e => onIngredientChange(index, 'unite', e.target.value)}
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
                          onClick={() => onRemoveIngredient(index)}
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
                  onClick={onAddIngredient}
                >
                  + Ajouter un ingrédient
                </button>
              </div>

              <label className={styles.editLabel}>
                Temps de préparation
                <input
                  className={styles.editInput}
                  type="text"
                  placeholder="ex: 20, 1h, 1h30"
                  value={editForm.tempsPreparation}
                  onChange={e => onEditChange('tempsPreparation', e.target.value)}
                />
              </label>

              <label className={styles.editLabel}>
                Temps de cuisson
                <input
                  className={styles.editInput}
                  type="text"
                  placeholder="ex: 30, 1h, 1h10"
                  value={editForm.tempsCuisson}
                  onChange={e => onEditChange('tempsCuisson', e.target.value)}
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
                      onChange={e => onEtapeChange(index, e.target.value)}
                      rows={2}
                    />
                    {editForm.etapes.length > 1 && (
                      <button
                        type="button"
                        className={styles.removeSmallBtn}
                        onClick={() => onRemoveEtape(index)}
                      >
                        −
                      </button>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  className={styles.addSmallBtn}
                  onClick={onAddEtape}
                >
                  + Ajouter une étape
                </button>
              </div>

              <label className={styles.editLabel}>
                Image (.png, .jpg, .jpeg, .webp)
                <input
                  className={styles.editInput}
                  type="file"
                  accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
                  onChange={e => onImageChange(e.target.files?.[0])}
                />
              </label>

              <label className={styles.editLabel}>
                Ou URL image
                <input
                  className={styles.editInput}
                  type="url"
                  value={editForm.image}
                  onChange={e => onEditChange('image', e.target.value)}
                />
              </label>

              {editImageError && <p className={styles.editErrorText}>{editImageError}</p>}
            </div>

            <div className={styles.modalButtons}>
              <button
                className={styles.cancelBtn}
                disabled={isSavingEdit}
                onClick={onClose}
              >
                Annuler
              </button>
              <button
                className={styles.confirmBtn}
                disabled={isSavingEdit}
                onClick={onOpenConfirm}
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditConfirmModal && (
        <div
          className={`${styles.overlay} ${styles.confirmOverlay}`}
          onClick={() => {
            if (!isSavingEdit) {
              onCloseConfirm();
            }
          }}
        >
          <div
            className={`${styles.modal} ${styles.confirmModal}`}
            onClick={(event) => event.stopPropagation()}
          >
            <p className={styles.modalText}>
              Voulez-vous confirmer les modifications de cette recette ?
            </p>
            <div className={styles.modalButtons}>
              <button
                className={styles.cancelBtn}
                disabled={isSavingEdit}
                onClick={onCloseConfirm}
              >
                Annuler
              </button>
              <button
                className={styles.confirmBtn}
                disabled={isSavingEdit}
                onClick={onSave}
              >
                {isSavingEdit ? 'Enregistrement...' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
