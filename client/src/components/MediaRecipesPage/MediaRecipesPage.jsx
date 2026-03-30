import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import RecipeCatalogView from "../RecipeCatalogView";
import StatusBlock from "../StatusBlock/StatusBlock.jsx";
import { getRecipesCatalog } from "../../services/recipesService";
import styles from "../../pages/RecipesPage/RecipesPage.module.scss";

export default function MediaRecipesPage({
  entityLabel,
  articleLabel,
  listPath,
  getMediaBySlug,
  payloadKey,
  fallbackPoster,
  loadingEntityMessage,
  loadEntityErrorMessage,
  missingEntityTitle,
  missingEntityMessage,
}) {
  const { slug } = useParams();
  const [mediaItem, setMediaItem] = useState(null);
  const [isLoadingMedia, setIsLoadingMedia] = useState(true);
  const [mediaError, setMediaError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const fetchMedia = async () => {
      try {
        const payload = await getMediaBySlug(slug);

        if (!isMounted) {
          return;
        }

        setMediaItem(payload?.[payloadKey] || null);
        setMediaError("");
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setMediaItem(null);
        setMediaError(error?.message || loadEntityErrorMessage);
      } finally {
        if (isMounted) {
          setIsLoadingMedia(false);
        }
      }
    };

    fetchMedia();

    return () => {
      isMounted = false;
    };
  }, [getMediaBySlug, loadEntityErrorMessage, payloadKey, slug]);

  const getMediaCatalog = useCallback((params = {}) => {
    return getRecipesCatalog({
      ...params,
      mediaSlug: slug,
    });
  }, [slug]);

  if (isLoadingMedia) {
    return (
      <main className={styles.container}>
        <section className={styles.catalogue}>
          <div className={styles.catalogueInner}>
            <StatusBlock
              variant="loading"
              title={loadingEntityMessage}
              className={styles.catalogState}
            />
            <p>{loadingEntityMessage}</p>
          </div>
        </section>
      </main>
    );
  }

  if (!mediaItem || mediaError) {
    return (
      <main className={styles.container}>
        <section className={styles.catalogue}>
          <div className={styles.catalogueInner}>
            <div className={styles.titleRow}>
              <h1 className={styles.title}>{missingEntityTitle}</h1>
              <span className={styles.titleLine} />
            </div>

            {!mediaError ? (
              <StatusBlock
                variant="empty"
                title={missingEntityTitle}
                message={missingEntityMessage}
                className={styles.catalogState}
              />
            ) : (
              <StatusBlock
                variant="error"
                title={loadEntityErrorMessage}
                message={mediaError}
                fallbackMessage={loadEntityErrorMessage}
                className={styles.catalogState}
              />
            )}
            <p className={styles.summaryText}>{mediaError || missingEntityMessage}</p>

            <Link className={styles.cta} to={listPath}>
              Retour aux {entityLabel}s
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const mediaTitle = mediaItem.title || `${articleLabel} ${entityLabel}`;
  const mediaOverview = mediaItem.overview || `Retrouve toutes les recettes associées à ${mediaTitle}.`;

  const buildSummaryText = ({ totalItems, activeFilter, currentQuery }) => {
    return `${totalItems} recette${totalItems > 1 ? "s" : ""} liée${totalItems > 1 ? "s" : ""} à ${mediaTitle}${activeFilter !== "Tous" ? ` en ${activeFilter}` : ""}${currentQuery ? ` pour "${currentQuery}"` : ""}.`;
  };

  return (
    <RecipeCatalogView
      heroImage={mediaItem.poster || fallbackPoster}
      heroAlt={`Affiche ${articleLabel} ${entityLabel} ${mediaTitle}`}
      heroObjectPosition="center 30%"
      heroTitle={mediaTitle}
      heroSubtitle={mediaOverview}
      ctaTo={listPath}
      ctaLabel={`Voir toutes les ${entityLabel}s`}
      catalogTitle={`Recettes de ${articleLabel} ${entityLabel} ${mediaTitle}`}
      searchPlaceholder={`Rechercher une recette liée à ${mediaTitle}`}
      searchAriaLabel={`Rechercher une recette liée à ${articleLabel} ${entityLabel} ${mediaTitle}`}
      loadingMessage={`Chargement des recettes de ${mediaTitle}...`}
      updatingMessage={`Mise à jour des recettes de ${mediaTitle}...`}
      errorFallbackMessage={`Impossible de charger les recettes liées à ${mediaTitle}.`}
      emptyMessage={`Aucune recette publiée n'est encore liée à ${mediaTitle}.`}
      buildSummaryText={buildSummaryText}
      getCatalog={getMediaCatalog}
    />
  );
}
