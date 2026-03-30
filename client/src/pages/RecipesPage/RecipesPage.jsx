import RecipeCatalogView from "../../components/RecipeCatalogView";
import { getRecipesCatalog } from "../../services/recipesService";

export default function RecipesPage() {
  return (
    <RecipeCatalogView
      heroImage="/img/hero-home.png"
      heroAlt="Catalogue des recettes"
      heroTitle={(
        <>
          Cuisine le cinéma,
          <br />
          Savoure les séries.
        </>
      )}
      heroSubtitle="Découvre le catalogue complet des recettes inspirées des films et séries cultes."
      ctaTo="/contact"
      ctaLabel="Nous contacter"
      catalogTitle="Catalogue des recettes"
      getCatalog={getRecipesCatalog}
    />
  );
}
