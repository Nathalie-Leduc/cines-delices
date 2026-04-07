import MediaRecipesPage from "../../components/MediaRecipesPage";
import { getSeriesBySlug } from "../../services/mediaService";

export default function SeriesRecipes() {
  return (
    <MediaRecipesPage
      entityLabel="série"
      articleLabel="de la"
      listPath="/series"
      getMediaBySlug={getSeriesBySlug}
      payloadKey="series"
      fallbackPoster="/img/stranger-thing-poster.webp"
      loadingEntityMessage="Chargement de la série..."
      loadEntityErrorMessage="Impossible de charger la série."
      missingEntityTitle="Série introuvable"
      missingEntityMessage="Cette série n'est pas disponible."
    />
  );
}
