import MediaRecipesPage from "../../components/MediaRecipesPage";
import { getMovieBySlug } from "../../services/mediaService";

export default function MovieRecipes() {
  return (
    <MediaRecipesPage
      entityLabel="film"
      articleLabel="du"
      listPath="/films"
      getMediaBySlug={getMovieBySlug}
      payloadKey="movie"
      fallbackPoster="/img/parrain-poster.webp"
      loadingEntityMessage="Chargement du film..."
      loadEntityErrorMessage="Impossible de charger le film."
      missingEntityTitle="Film introuvable"
      missingEntityMessage="Ce film n'est pas disponible."
    />
  );
}
