import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import RecipeCard from '../../components/RecipeCard';
import Alert from '../../components/Alert/Alert.jsx';
import StatusBlock from '../../components/StatusBlock/StatusBlock.jsx';
import { getAdminCategoryRecipes } from '../../services/adminService.js';
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

export default function AdminCategoryRecipes() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [category, setCategory] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadCategoryRecipes = async () => {
      setIsLoading(true);
      setError('');

      try {
        const payload = await getAdminCategoryRecipes(id);

        if (!isMounted) {
          return;
        }

        setCategory(payload?.category || null);
        setRecipes(Array.isArray(payload?.recipes) ? payload.recipes : []);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setError(loadError.message || 'Impossible de charger les recettes liées à cette catégorie.');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadCategoryRecipes();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const heading = useMemo(() => {
    if (!category?.name) {
      return 'Recettes liées à cette catégorie';
    }

    return `Recettes de la catégorie ${category.name}`;
  }, [category]);

  return (
    <div className={styles.page}>
      <div className={styles.headerLine}>
        <h2>{heading}</h2>
      </div>

      <p className={styles.pageIntro}>
        {category?.recipesCount
          ? `${category.recipesCount} recette${category.recipesCount > 1 ? 's utilisent' : ' utilise'} cette catégorie.`
          : 'Retrouve ici toutes les recettes associées à cette catégorie.'}
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
          message="Cette catégorie n’est encore utilisée dans aucune recette."
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
                    className={`${styles.cardActionButton} ${styles.cardActionEdit}`.trim()}
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
                    <img src="/icon/Edit_duotone_line.svg" alt="" aria-hidden="true" />
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
