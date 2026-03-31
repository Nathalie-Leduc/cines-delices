import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import RecipeCard from '../../components/RecipeCard';
import Alert from '../../components/Alert/Alert.jsx';
import StatusBlock from '../../components/StatusBlock/StatusBlock.jsx';
import { getAdminIngredientRecipes } from '../../services/adminService.js';
import styles from './AdminPages.module.scss';

function toSlug(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function getDurationMinutes(duration) {
  if (typeof duration === 'number' && Number.isFinite(duration)) {
    return duration;
  }

  const parsed = parseInt(String(duration || '').replace(/[^\d]/g, ''), 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export default function AdminIngredientRecipes() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ingredient, setIngredient] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadIngredientRecipes = async () => {
      setIsLoading(true);
      setError('');

      try {
        const payload = await getAdminIngredientRecipes(id);

        if (!isMounted) {
          return;
        }

        setIngredient(payload?.ingredient || null);
        setRecipes(Array.isArray(payload?.recipes) ? payload.recipes : []);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setError(loadError.message || 'Impossible de charger les recettes liées à cet ingrédient.');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadIngredientRecipes();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const heading = useMemo(() => {
    if (!ingredient?.name) {
      return 'Recettes liées à cet ingrédient';
    }

    return `Recettes avec ${ingredient.name}`;
  }, [ingredient]);

  return (
    <div className={styles.page}>
      <div className={styles.headerLine}>
        <h2>{heading}</h2>
      </div>

      <p className={styles.pageIntro}>
        {ingredient?.recipesCount
          ? `${ingredient.recipesCount} recette${ingredient.recipesCount > 1 ? 's' : ''} ${ingredient.recipesCount > 1 ? 'utilisent' : 'utilise'} cet ingrédient.`
          : 'Retrouve ici toutes les recettes associées à cet ingrédient.'}
      </p>

      <Alert
        type="error"
        message={error}
        onClose={() => setError('')}
        className={styles.pageState}
      />

      {isLoading ? (
        <StatusBlock
          variant="loading"
          title="Chargement des recettes liées"
          className={styles.pageState}
        />
      ) : null}

      {!isLoading && !error && recipes.length === 0 ? (
        <StatusBlock
          variant="empty"
          title="Aucune recette liée"
          message="Cet ingrédient n’est encore utilisé dans aucune recette."
          className={styles.pageState}
        />
      ) : null}

      {!isLoading && !error && recipes.length > 0 ? (
        <div className={styles.recipesGridExact}>
          {recipes.map((recipe) => {
            const slug = recipe.slug || toSlug(recipe.title);
            const recipeForCatalogCard = {
              id: recipe.id,
              slug,
              image: recipe.image || '/img/placeholder.jpg',
              title: recipe.title,
              category: recipe.category,
              mediaTitle: recipe.movie || 'Film non renseigné',
              mediaType: recipe.media === 'S' ? 'serie' : 'film',
              duration: getDurationMinutes(recipe.duration),
            };

            return (
              <div key={recipe.id} className={styles.adminRecipeCardWrap}>
                <RecipeCard recipe={recipeForCatalogCard} />
                <Link
                  to={`/recipes/${slug}`}
                  state={{ recipe }}
                  className={styles.cardNavOverlay}
                  aria-label={`Voir la recette ${recipe.title}`}
                />
                <span className={styles.submittedByCardTag}>Soumis par {recipe.submittedByLabel}</span>
                <div className={styles.cardActionsExact}>
                  <button
                    type="button"
                    aria-label="Modifier la recette"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      navigate('/admin/recettes', {
                        state: {
                          openEditRecipeId: recipe.id,
                        },
                      });
                    }}
                  >
                    <img src="/icon/Edit.svg" alt="" aria-hidden="true" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
