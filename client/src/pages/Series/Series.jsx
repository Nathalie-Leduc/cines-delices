import MediaCatalog from "../MediaCatalog";
import { getSeriesCatalog } from "../../services/mediaService";

function mapSeriesToCard(series) {
  return {
    id: series?.id,
    slug: series?.slug,
    to: series?.slug ? `/series/${series.slug}` : undefined,
    title: series?.title || "Série sans titre",
    poster: series?.poster || "/img/stranger-thing-poster.webp",
    fallbackPoster: "/img/stranger-thing-poster.webp",
    genre: series?.genre || "Genre non renseigné",
    creator: series?.creator || "Créateur non renseigné",
  };
}

async function fetchSeriesCatalog(params) {
  const payload = await getSeriesCatalog(params);

  return {
    items: Array.isArray(payload?.series) ? payload.series : [],
    pagination: payload?.pagination || {},
  };
}

export default function Series() {
  return (
    <MediaCatalog
      title="Séries"
      heroImage="/img/fond-cinema-contact.webp"
      heroAlt="Catalogue des séries"
      heroObjectPosition="center 38%"
      heroSubtitle="Retrouve les séries qui inspirent l’univers gourmand de Cinés Délices."
      searchPlaceholder="Rechercher une série"
      singularLabel="série"
      pluralLabel="séries"
      badgeLabel="Série"
      badgeVariant="serie"
      creatorFallback="Créateur non renseigné"
      loadingMessage="Chargement des séries..."
      updatingMessage="Mise à jour des séries..."
      errorMessage="Impossible de charger les séries."
      emptyMessage="Aucune série disponible pour le moment."
      suggestionMetaFallback="Série"
      getCatalog={fetchSeriesCatalog}
      mapItemToCard={mapSeriesToCard}
    />
  );
}
