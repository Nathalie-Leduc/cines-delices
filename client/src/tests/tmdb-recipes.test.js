import { fetchMedia } from '../services/mediaService.js';
import { describe, test, expect, it} from 'vitest';
import { getPublishedRecipes, getRecipesCatalog, getMyRecipes } from '../services/recipesService.js';

describe('Test films', () => {
  test('fetchMedia should return data', async () => {
    const data = await fetchMedia();
    console.log('Fetched data:', data);
    expect(data).toBeDefined(); // assertion basique
  });
});

describe('Test recettes', () => {
  it('getPublishedRecipes should return published recipes', async () => {
    const recipes = await getPublishedRecipes();
    console.log('--- Test recettes publiées ---\n', recipes);
    expect(Array.isArray(recipes)).toBe(true);
  });

  it('getRecipesCatalog should return catalog', async () => {
    const catalog = await getRecipesCatalog();
    console.log('--- Catalogue complet ---\n', catalog);
    expect(Array.isArray(catalog)).toBe(true);
  });

  it('getMyRecipes should return my recipes', async () => {
    const myRecipes = await getMyRecipes();
    console.log('--- Mes recettes ---\n', myRecipes);
    expect(Array.isArray(myRecipes)).toBe(true);
  });
});