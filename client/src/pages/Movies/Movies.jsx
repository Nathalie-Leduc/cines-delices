import MediaCatalog from "../MediaCatalog";
import { getMoviesCatalog } from "../../services/mediaService";

function mapMovieToCard(movie) {
  return {
    id: movie?.id,
    title: movie?.title || "Film sans titre",
    poster: movie?.poster || "/img/parrain-poster.png",
    fallbackPoster: "/img/parrain-poster.png",
    genre: movie?.genre || "Genre non renseigné",
    creator: movie?.director || movie?.creator || "Réalisateur non renseigné",
  };
}

async function fetchMoviesCatalog(params) {
  const payload = await getMoviesCatalog(params);

  return {
    items: Array.isArray(payload?.movies) ? payload.movies : [],
    pagination: payload?.pagination || {},
  };
}

export default function Movies() {
  return (
    <MediaCatalog
      title="Films"
      heroImage="/img/fond-cinema-contact.png"
      heroAlt="Catalogue des films"
      heroObjectPosition="center 38%"
      heroSubtitle="Explore le catalogue des films qui nourrissent l’univers Cinés Délices."
      searchPlaceholder="Rechercher un film"
      singularLabel="film"
      pluralLabel="films"
      badgeLabel="Film"
      badgeVariant="film"
      creatorFallback="Réalisateur non renseigné"
      loadingMessage="Chargement des films..."
      updatingMessage="Mise à jour des films..."
      errorMessage="Impossible de charger les films."
      emptyMessage="Aucun film disponible pour le moment."
      suggestionMetaFallback="Film"
      getCatalog={fetchMoviesCatalog}
      mapItemToCard={mapMovieToCard}
    />
  );
}
