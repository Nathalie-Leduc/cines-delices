# Instructions pour Claude Code — Corrections Ciné Délices

> **À lire en premier** : Ce fichier est destiné à **Claude Code dans VS Code**.
> Il décrit le workflow Git complet et les 6 corrections à appliquer une par une,
> chacune dans sa propre branche.
>
> **Avant de commencer** : s'assurer d'être sur la branche `dev` et que le
> working tree est propre (`git status` doit être vide).

---

## Workflow Git à respecter pour CHAQUE correction

```
1. git checkout dev                          # toujours partir de dev
2. git pull perso dev                        # récupérer les dernières modifs
3. git checkout -b fix/nom-de-la-correction  # créer la branche dédiée
4. ... appliquer les modifications ...
5. git add -p                                # relire chaque chunk avant d'ajouter
6. git commit -m "fix: description courte"  # message en anglais, présent
7. git push perso fix/nom-de-la-correction  # pousser la branche
8. # Ouvrir une PR vers dev sur GitHub
```

> **Règles de commit** :
> - Messages en anglais, verbe au présent impératif
> - Préfixes : `fix:` (bug), `feat:` (nouvelle fonctionnalité), `refactor:` (restructuration)
> - Ne jamais commiter `node_modules`, `.env`, fichiers générés

---

## Correction 1 — Bug image recette en validation

**Branche** : `fix/recipe-card-image-fallback`
**Priorité** : 🔴 Haute — bug visible par tous les membres

### Contexte

Sur `/membre/mes-recettes/recettes-en-validation`, les cartes RecipeCard
affichent le poster TMDB du film au lieu de l'image uploadée par le membre.
Si pas d'image uploadée, l'appareil photo barré (SVG dans RecipeCard) devrait
apparaître mais ne l'est jamais car un fallback image est toujours fourni.

### Fichier à modifier

`client/src/pages/MemberRecipes/MemberRecipes.jsx`

### Modification 1 — Dans `normalizeRecipe()`

Chercher la ligne (vers ligne 187) :

```js
// AVANT
image: rawRecipe?.image || rawRecipe?.imageURL || rawRecipe?.imageUrl || rawRecipe?.media?.posterUrl || 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=400',
```

Remplacer par :

```js
// APRÈS
// On ne garde que l'image uploadée par le membre.
// media?.posterUrl et l'URL Unsplash sont retirés intentionnellement :
// si pas d'image propre → null → RecipeCard affiche le placeholder SVG.
image: rawRecipe?.image || rawRecipe?.imageURL || rawRecipe?.imageUrl || null,
```

### Modification 2 — Dans `mapMemberRecipeToCard()`

Chercher et remplacer la fonction entière (vers ligne 208) :

```js
// AVANT
function mapMemberRecipeToCard(recipe) {
  const mediaType = String(recipe?.type || '').toUpperCase() === 'F' ? 'film' : 'serie';
  const durationValue = String(recipe?.temps || '').match(/\d+/);
  const duration = durationValue ? Number(durationValue[0]) : 0;
  const primaryImage = recipe?.image || '/img/hero-home.webp';
  const mediaPoster = recipe?.media?.posterUrl || '';
  const fallbackImage = mediaPoster && mediaPoster !== primaryImage ? mediaPoster : '/img/hero-home.webp';

  return {
    id: recipe?.id,
    slug: recipe?.slug,
    title: recipe?.titre || 'Recette sans titre',
    category: recipe?.categorie || 'Autre',
    mediaTitle: recipe?.film || 'Sans média',
    mediaType,
    duration,
    image: primaryImage,
    fallbackImage,
  };
}
```

```js
// APRÈS
function mapMemberRecipeToCard(recipe) {
  const mediaType = String(recipe?.type || '').toUpperCase() === 'F' ? 'film' : 'serie';
  const durationValue = String(recipe?.temps || '').match(/\d+/);
  const duration = durationValue ? Number(durationValue[0]) : 0;

  // null si pas d'image uploadée → RecipeCard affiche son SVG appareil photo barré.
  // Aucun fallback (ni hero-home.webp, ni poster TMDB) : l'absence d'image
  // doit être visible pour inciter le membre à en ajouter une.
  const recipeImage = recipe?.image || null;

  return {
    id: recipe?.id,
    slug: recipe?.slug,
    title: recipe?.titre || 'Recette sans titre',
    category: recipe?.categorie || 'Autre',
    mediaTitle: recipe?.film || 'Sans média',
    mediaType,
    duration,
    image: recipeImage,
  };
}
```

### Commit

```bash
git add client/src/pages/MemberRecipes/MemberRecipes.jsx
git commit -m "fix: remove TMDB poster and Unsplash fallback from member recipe cards"
git push perso fix/recipe-card-image-fallback
```

---

## Correction 3 — Fuzzy/singulier trop agressif sur les ingrédients composés

**Branche** : `fix/ingredient-compound-name-normalization`
**Priorité** : 🔴 Haute — bloque les membres à la création de recette

### Contexte

`normalizeIngredientName()` coupe le `s` final de **tous** les mots, y compris
dans les noms composés. Exemple : `"fraise des bois"` → `"fraise des boi"`.
Ce nom corrompu provoque un fuzzy match sur `"fraise"` (existant) → le bouton
"Créer l'ingrédient" disparaît et le membre est bloqué.

### Fichiers à modifier (même correction dans les 4)

1. `client/src/pages/CreateRecipe/CreateRecipe.jsx`
2. `client/src/pages/Admin/AdminIngredients.jsx`
3. `client/src/pages/Admin/IngredientsValidation.jsx`
4. `api/src/controllers/ingredientsController.js`

### Modification A — `normalizeIngredientName()` dans les 4 fichiers

Dans chaque fichier, trouver `normalizeIngredientName` et ajouter
**une ligne de garde** après la construction de `str`, juste avant le bloc
`exceptions` :

```js
// AVANT (dans chacun des 4 fichiers)
function normalizeIngredientName(name) {
  const str = String(name || '').trim().toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  const exceptions = new Set([...]);
  // ...
}
```

```js
// APRÈS (dans chacun des 4 fichiers)
function normalizeIngredientName(name) {
  const str = String(name || '').trim().toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  // CORRECTIF — noms composés (avec espace) : pas de singularisation.
  // "fraise des bois" → "fraise des bois" ✅ (était "fraise des boi" ❌)
  // "fraises"         → "fraise"          ✅ (inchangé)
  if (str.includes(' ')) return str;

  const exceptions = new Set([...]);
  // ...
}
```

### Modification B — Exact match dans `searchIngredients()` (CreateRecipe.jsx uniquement)

Chercher dans `CreateRecipe.jsx` (vers ligne 417) :

```js
// AVANT
const exactMatch = normalized.find(
  item => item.name.trim().toLowerCase() === normalizedQuery,
);
```

```js
// APRÈS
// On compare avec trimmed (texte brut saisi) et non normalizedQuery (singulier).
// "fraise des bois" !== "fraise" → pas de sélection automatique erronée.
const exactMatch = normalized.find(
  item => item.name.trim().toLowerCase() === trimmed.toLowerCase(),
);
```

### Commit

```bash
git add \
  client/src/pages/CreateRecipe/CreateRecipe.jsx \
  client/src/pages/Admin/AdminIngredients.jsx \
  client/src/pages/Admin/IngredientsValidation.jsx \
  api/src/controllers/ingredientsController.js
git commit -m "fix: skip singularization for compound ingredient names (fraise des bois)"
git push perso fix/ingredient-compound-name-normalization
```

---

## Correction 4 — Admin : supprimer un ingrédient en validation + notifier le membre

**Branche** : `feat/admin-reject-ingredient-with-notification`
**Priorité** : 🟠 Moyenne — fonctionnalité admin manquante

### Contexte

L'admin peut valider ou modifier un ingrédient soumis mais ne peut pas
le refuser/supprimer avec notification au membre. Or si l'ingrédient
est en attente, la recette liée n'est pas encore publiée — l'admin doit
pouvoir refuser proprement.

### Fichiers à modifier

1. `api/src/controllers/adminController.js` (ou `adminIngredientsController.js` si déjà découpé)
2. `client/src/services/adminService.js`
3. `client/src/pages/Admin/IngredientsValidation.jsx`

### Modification 1 — Back : `deleteIngredient()` avec notification membre

Dans `adminController.js`, remplacer la fonction `deleteIngredient` entière :

```js
// AVANT — version simplifiée sans notification
export async function deleteIngredient(req, res) {
  try {
    const ingredientId = req.params.id;
    const ingredient = await prisma.ingredient.findUnique({
      where: { id: req.params.id },
      select: {
        nom: true,
        _count: { select: { recipes: true } },
      },
    });

    if (!ingredient) return res.status(404).json({ message: 'Ingrédient introuvable.' });

    if ((ingredient._count?.recipes || 0) > 0) {
      return res.status(409).json({
        message: 'Impossible de supprimer un ingrédient déjà utilisé dans une recette.',
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.recipeIngredient.deleteMany({ where: { ingredientId } });
      await tx.ingredient.delete({ where: { id: ingredientId } });
      await tx.notification.updateMany({
        where: {
          userId: req.user.id,
          isRead: false,
          message: `Nouvel ingrédient soumis: ${ingredient.nom}`,
        },
        data: { isRead: true },
      });
    });

    return res.status(204).send();
  } catch (error) {
    return sendError(res, error, "Erreur lors de la suppression de l'ingrédient.");
  }
}
```

```js
// APRÈS — avec notification membre et motif de refus
export async function deleteIngredient(req, res) {
  try {
    const ingredientId = req.params.id;
    const rejectionReason = String(req.body?.rejectionReason || '').trim();

    // Récupérer l'ingrédient + la première recette liée pour identifier le membre
    const ingredient = await prisma.ingredient.findUnique({
      where: { id: ingredientId },
      select: {
        nom: true,
        approved: true,
        _count: { select: { recipes: true } },
        recipes: {
          take: 1,
          include: {
            recipe: {
              select: { id: true, titre: true, userId: true, status: true },
            },
          },
        },
      },
    });

    if (!ingredient) return res.status(404).json({ message: 'Ingrédient introuvable.' });

    // Seuls les ingrédients non approuvés ET non utilisés dans des recettes publiées
    // peuvent être supprimés via cette route.
    if (ingredient.approved && (ingredient._count?.recipes || 0) > 0) {
      return res.status(409).json({
        message: 'Impossible de supprimer un ingrédient approuvé utilisé dans une recette.',
      });
    }

    const linkedRecipe = ingredient.recipes[0]?.recipe || null;
    const memberUserId = linkedRecipe?.userId || null;

    await prisma.$transaction(async (tx) => {
      await tx.recipeIngredient.deleteMany({ where: { ingredientId } });
      await tx.ingredient.delete({ where: { id: ingredientId } });

      // Marquer la notif admin "Nouvel ingrédient soumis" comme lue
      await tx.notification.updateMany({
        where: {
          userId: req.user.id,
          isRead: false,
          message: `Nouvel ingrédient soumis: ${ingredient.nom}`,
        },
        data: { isRead: true },
      });

      // Notifier le membre si on a pu l'identifier via la recette liée
      if (memberUserId) {
        const motif = rejectionReason ? ` Motif : ${rejectionReason}` : '';
        await tx.notification.create({
          data: {
            userId: memberUserId,
            recipeId: linkedRecipe?.id || null,
            type: 'RECIPE_SUBMITTED',
            message: `Votre ingrédient "${ingredient.nom}" a été refusé par l'administrateur.${motif} Veuillez modifier votre recette avec un ingrédient existant.`,
          },
        });
      }
    });

    return res.status(204).send();
  } catch (error) {
    return sendError(res, error, "Erreur lors de la suppression de l'ingrédient.");
  }
}
```

### Modification 2 — Front service : transmettre le motif

Dans `adminService.js`, remplacer :

```js
// AVANT
export const deleteAdminIngredient = (id) =>
  request(`${ADMIN_API_BASE}/ingredients/${id}`, { method: 'DELETE' });
```

```js
// APRÈS
// Le motif de refus est transmis en body pour notifier le membre.
export const deleteAdminIngredient = (id, rejectionReason = '') =>
  request(`${ADMIN_API_BASE}/ingredients/${id}`, {
    method: 'DELETE',
    body: rejectionReason ? { rejectionReason } : undefined,
  });
```

### Modification 3 — Front page : modale avec champ motif

Dans `IngredientsValidation.jsx` :

**3a — Ajouter l'état** après `const [editedName, setEditedName] = useState('');` :

```js
const [deleteRejectionReason, setDeleteRejectionReason] = useState('');
```

**3b — Modifier `handleDeleteIngredient()`** :

```js
// Remplacer
await deleteAdminIngredient(selectedIngredient.id);

// Par
await deleteAdminIngredient(selectedIngredient.id, deleteRejectionReason);
// Puis après setShowDeleteModal(false) :
setDeleteRejectionReason('');
```

**3c — Dans le onClick du bouton supprimer**, ajouter avant `setShowDeleteModal(true)` :

```js
setDeleteRejectionReason('');
```

**3d — Remplacer la modale `showDeleteModal`** :

```jsx
// AVANT
{showDeleteModal && (
  <AdminModal
    title="Supprimer l'ingrédient"
    confirmLabel="Supprimer"
    onCancel={() => setShowDeleteModal(false)}
    onConfirm={handleDeleteIngredient}
  >
    Êtes-vous sûr de vouloir supprimer cet ingrédient ?
  </AdminModal>
)}
```

```jsx
// APRÈS
{showDeleteModal && (
  <AdminModal
    title="Refuser et supprimer l'ingrédient"
    confirmLabel="Refuser"
    onCancel={() => {
      setShowDeleteModal(false);
      setDeleteRejectionReason('');
    }}
    onConfirm={handleDeleteIngredient}
  >
    <p>
      Êtes-vous sûr de vouloir refuser l&apos;ingrédient{' '}
      <strong>&quot;{selectedIngredient?.name}&quot;</strong> ?
    </p>
    <p style={{ marginTop: '0.5rem', marginBottom: '0.5rem', fontSize: '0.85rem', opacity: 0.8 }}>
      Le membre recevra une notification de refus. Motif (optionnel) :
    </p>
    <input
      className={styles.modalInput}
      type="text"
      value={deleteRejectionReason}
      onChange={(event) => setDeleteRejectionReason(event.target.value)}
      placeholder="Ex : doublon avec 'fraise', nom trop générique..."
    />
  </AdminModal>
)}
```

### Commit

```bash
git add \
  api/src/controllers/adminController.js \
  client/src/services/adminService.js \
  client/src/pages/Admin/IngredientsValidation.jsx
git commit -m "feat: admin can reject pending ingredient with member notification and reason"
git push perso feat/admin-reject-ingredient-with-notification
```

---

## Correction 5 — Admin : créer des ingrédients et des recettes

**Branche** : `feat/admin-create-ingredient-and-recipe`
**Priorité** : 🟠 Moyenne — fonctionnalités admin manquantes

### Contexte

L'admin n'a aucun moyen de créer directement un ingrédient validé,
ni de créer une recette. Il doit passer par le workflow membre, ce qui
est incohérent puisqu'il est lui-même le validateur.

### Fichiers à modifier

1. `api/src/controllers/adminController.js`
2. `api/src/routes/adminRoutes.js`
3. `client/src/services/adminService.js`
4. `client/src/pages/Admin/AdminIngredients.jsx`
5. `client/src/App.jsx`
6. `client/src/pages/Admin/Recettes.jsx`

---

### Partie A — Créer un ingrédient (admin)

#### A1 — Back : nouvelle fonction dans `adminController.js`

Ajouter cette fonction **avant** `updateIngredient` :

```js
// L'admin crée un ingrédient directement approuvé (approved: true).
// Si l'ingrédient existe déjà non approuvé, il est approuvé en même temps.
export async function createAdminIngredient(req, res) {
  try {
    const name = String(req.body?.name || req.body?.nom || '').trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    if (!name) {
      return res.status(400).json({ message: "Le nom de l'ingrédient est requis." });
    }

    const existing = await prisma.ingredient.findUnique({ where: { nom: name } });

    if (existing) {
      if (!existing.approved) {
        const approved = await prisma.ingredient.update({
          where: { id: existing.id },
          data: { approved: true },
          include: {
            _count: { select: { recipes: true } },
            recipes: {
              include: {
                recipe: {
                  select: { createdAt: true, user: { select: { nom: true, pseudo: true } } },
                },
              },
            },
          },
        });
        return res.status(200).json(formatIngredient(approved));
      }
      const withCount = await prisma.ingredient.findUnique({
        where: { id: existing.id },
        include: {
          _count: { select: { recipes: true } },
          recipes: {
            include: {
              recipe: {
                select: { createdAt: true, user: { select: { nom: true, pseudo: true } } },
              },
            },
          },
        },
      });
      return res.status(200).json(formatIngredient(withCount));
    }

    const ingredient = await prisma.ingredient.create({
      data: { nom: name, approved: true },
      include: {
        _count: { select: { recipes: true } },
        recipes: {
          include: {
            recipe: {
              select: { createdAt: true, user: { select: { nom: true, pseudo: true } } },
            },
          },
        },
      },
    });

    return res.status(201).json(formatIngredient(ingredient));
  } catch (error) {
    return sendError(res, error, "Erreur lors de la création de l'ingrédient.");
  }
}
```

#### A2 — Back : route dans `adminRoutes.js`

Ajouter l'import de `createAdminIngredient` dans le destructuring existant, puis
ajouter la route **après** `router.get('/ingredients/validated', ...)` et
**avant** toute route `/:id` :

```js
// Ajouter dans les imports en haut du fichier :
// createAdminIngredient,

// Ajouter la route (DOIT être avant router.get('/ingredients/:id/recipes', ...))
router.post('/ingredients', createAdminIngredient);
```

#### A3 — Front service : `adminService.js`

Ajouter avant `updateAdminIngredient` :

```js
// Crée un ingrédient directement approuvé (admin uniquement).
export const createAdminIngredient = (name) =>
  request(`${ADMIN_API_BASE}/ingredients`, { method: 'POST', body: { name } });
```

#### A4 — Front page : `AdminIngredients.jsx`

**4a — Import** : ajouter `createAdminIngredient` dans les imports depuis `adminService.js`

**4b — États** : ajouter après les états existants :

```js
const [showCreateModal, setShowCreateModal] = useState(false);
const [newIngredientName, setNewIngredientName] = useState('');
const [isCreating, setIsCreating] = useState(false);
```

**4c — Handler** : ajouter avant `openMergeModal` :

```js
async function handleCreateIngredient() {
  const name = newIngredientName.trim();
  if (!name) return;

  setIsCreating(true);
  setError('');
  try {
    const created = await createAdminIngredient(name);
    setIngredients((previous) => {
      const exists = previous.find((i) => i.id === created.id);
      if (exists) return previous.map((i) => (i.id === created.id ? created : i));
      return [...previous, created];
    });
    setShowCreateModal(false);
    setNewIngredientName('');
  } catch (createError) {
    setError(createError.message || 'Création impossible.');
  } finally {
    setIsCreating(false);
  }
}
```

**4d — Dans le JSX** : dans `headerLine`, ajouter après `<h2>Gérer les ingrédients</h2>` :

```jsx
<button
  type="button"
  className={styles.addRecipeButton}
  onClick={() => { setNewIngredientName(''); setError(''); setShowCreateModal(true); }}
>
  + Ajouter un ingrédient
</button>
```

**4e — Modale de création** : ajouter avant les modales existantes :

```jsx
{showCreateModal && (
  <AdminModal
    title="Ajouter un ingrédient"
    confirmLabel={isCreating ? 'Création...' : 'Créer'}
    confirmVariant="success"
    onCancel={() => { setShowCreateModal(false); setNewIngredientName(''); }}
    onConfirm={handleCreateIngredient}
  >
    <p style={{ marginBottom: '0.5rem', fontSize: '0.9rem', opacity: 0.8 }}>
      L&apos;ingrédient sera directement validé et disponible pour tous les membres.
    </p>
    <input
      className={styles.modalInput}
      type="text"
      value={newIngredientName}
      onChange={(event) => setNewIngredientName(event.target.value)}
      placeholder="Nom de l'ingrédient (ex: fraise des bois)"
      onKeyDown={(event) => { if (event.key === 'Enter' && !isCreating) handleCreateIngredient(); }}
      autoFocus
    />
  </AdminModal>
)}
```

---

### Partie B — Créer une recette (admin)

#### B1 — Route dans `App.jsx`

Dans le bloc `<Route path="/admin" element={<AdminRoute />}>`,
ajouter **AVANT** `<Route element={<AdminLayout />}>` :

```jsx
{/* L'admin accède au même formulaire que le membre, hors AdminLayout */}
<Route path="creer-recette" element={<CreateRecipe />} />
```

S'assurer que `CreateRecipe` est bien importé en haut du fichier.

#### B2 — Lien dans `Recettes.jsx` (admin)

Dans `headerLine`, ajouter après `<h2>Gérer les recettes</h2>` :

```jsx
<Link to="/admin/creer-recette" className={styles.addRecipeButton}>
  + Créer une recette
</Link>
```

S'assurer que `Link` est importé depuis `react-router-dom`.

### Commit

```bash
git add \
  api/src/controllers/adminController.js \
  api/src/routes/adminRoutes.js \
  client/src/services/adminService.js \
  client/src/pages/Admin/AdminIngredients.jsx \
  client/src/App.jsx \
  client/src/pages/Admin/Recettes.jsx
git commit -m "feat: admin can create validated ingredients and recipes directly"
git push perso feat/admin-create-ingredient-and-recipe
```

---

## Correction 6 — Membre : supprimer une recette refusée

**Branche** : `fix/member-can-delete-rejected-recipe`
**Priorité** : 🟠 Moyenne — bloquant pour les membres avec recettes refusées

### Contexte

Quand le membre clique sur une notification de refus, il est redirigé vers
`/recipes/:slug` (page publique) sans bouton Supprimer ni Modifier.
De plus, le bouton Supprimer est visible sur les recettes PENDING alors
qu'elles ne devraient pas être supprimables (l'admin les examine).

### Fichier à modifier

`client/src/pages/MemberRecipes/MemberRecipes.jsx`

### Modification 1 — `openNotificationTarget()`

Remplacer le bloc de navigation final de la fonction :

```js
// AVANT
const targetId = String(matchedRecipe?.id || notificationRecipeId).trim();
const targetSlugOrId = String(matchedRecipe?.slug || notificationRecipeSlug || targetId).trim();

if (targetSlugOrId) {
  navigate(`/recipes/${targetSlugOrId}`, {
    state: {
      fromMemberRecipes: true,
      openEditRecipeId: targetId || undefined,
    },
  });
  return;
}

navigate('/membre/mes-recettes');
```

```js
// APRÈS
const targetId = String(matchedRecipe?.id || notificationRecipeId).trim();
const targetStatus = String(matchedRecipe?.status || '').toUpperCase();
const targetSlug = String(matchedRecipe?.slug || notificationRecipeSlug || '').trim();

// Recette publiée → page publique (le membre veut la voir telle quelle)
if (targetStatus === 'PUBLISHED' && targetSlug) {
  navigate(`/recipes/${targetSlug}`, {
    state: { fromMemberRecipes: true },
  });
  return;
}

// Recette PENDING ou DRAFT (refusée) → espace membre avec actions
// (boutons Modifier + Supprimer disponibles ici, pas sur la page publique)
if (targetId) {
  navigate('/membre/mes-recettes', {
    state: { openEditRecipeId: targetId },
  });
  return;
}

navigate('/membre/mes-recettes');
```

### Modification 2 — Masquer le bouton Supprimer sur les PENDING

Dans le JSX des cartes recettes, trouver le bouton `actionBtnDelete` et
l'entourer d'une condition :

```jsx
// AVANT — bouton toujours visible
<button
  type="button"
  className={`${styles.actionBtn} ${styles.actionBtnDelete}`}
  aria-label={`Supprimer la recette ${recette.titre}`}
  onClick={() => handleDeleteClick(recette)}
>
  <img src="/icon/Trash.svg" alt="" aria-hidden="true" />
</button>
```

```jsx
// APRÈS — invisible si PENDING (l'admin examine la recette)
{String(recette.status || '').toUpperCase() !== 'PENDING' && (
  <button
    type="button"
    className={`${styles.actionBtn} ${styles.actionBtnDelete}`}
    aria-label={`Supprimer la recette ${recette.titre}`}
    onClick={() => handleDeleteClick(recette)}
  >
    <img src="/icon/Trash.svg" alt="" aria-hidden="true" />
  </button>
)}
```

### Commit

```bash
git add client/src/pages/MemberRecipes/MemberRecipes.jsx
git commit -m "fix: redirect notification to member space and hide delete on pending recipes"
git push perso fix/member-can-delete-rejected-recipe
```

---

## Correction 2 — Découpage des gros fichiers

**Branche** : `refactor/split-admin-controller-and-member-recipes`
**Priorité** : 🟡 Basse — maintenabilité, aucun impact fonctionnel

### Contexte

Deux fichiers dépassent 1800 lignes :
- `adminController.js` (1837 lignes) → découpé en 6 fichiers thématiques
- `MemberRecipes.jsx` (1801 lignes) → modale d'édition extraite dans un composant

### Partie A — Découper `adminController.js`

#### Nouveaux fichiers à créer dans `api/src/controllers/`

| Fichier | Contenu |
|---|---|
| `adminHelpers.js` | Tous les formatters et helpers partagés |
| `adminRecipesController.js` | getAdminRecipes, getPendingRecipes, publishRecipe, rejectRecipe, deleteRecipe, updateAdminRecipe |
| `adminUsersController.js` | getAdminUsers, deleteUser, updateUserRole |
| `adminCategoriesController.js` | getAdminCategories, createCategory, updateCategory, deleteCategory |
| `adminIngredientsController.js` | Tout ce qui concerne les ingrédients + getCategoryRecipes |
| `adminNotificationsController.js` | getAdminNotifications, deleteAdminNotification |

#### Structure de `adminHelpers.js`

```js
// Copier depuis adminController.js (tout ce qui est avant la première export async function)
// puis ajouter export devant chaque function :
import { prisma } from '../lib/prisma.js';
import { generateUniqueSlug } from '../utils/slug.js';
import { downloadAndConvertPoster } from '../lib/posterService.js';

export function getCategoryColor(...) { ... }
export function normalizeNamePart(...) { ... }
export function toDisplayWords(...) { ... }
export function formatSubmitter(...) { ... }
export function formatRecipe(...) { ... }
export function formatUser(...) { ... }
export function formatCategory(...) { ... }
export function formatIngredient(...) { ... }
export function formatNotification(...) { ... }
export function sendError(...) { ... }
export function normalizeMediaKind(...) { ... }
export function extractDirector(...) { ... }
export function parseEditedFieldsSummary(...) { ... }
export function normalizeIngredientNameForMatch(...) { ... }
export function extractRejectedIngredientNameFromReason(...) { ... }
export function stringifyEditedFieldsSummary(...) { ... }
export function buildAdminEditedFieldsSentence(...) { ... }
export async function resolveAdminMediaId(...) { ... }
```

#### Structure de chaque controller thématique

```js
// Exemple : adminRecipesController.js
import { prisma } from '../lib/prisma.js';
import { generateUniqueSlug } from '../utils/slug.js';
import { downloadAndConvertPoster } from '../lib/posterService.js';
import {
  formatRecipe,
  sendError,
  normalizeIngredientNameForMatch,
  extractRejectedIngredientNameFromReason,
  stringifyEditedFieldsSummary,
  buildAdminEditedFieldsSentence,
  parseEditedFieldsSummary,
  resolveAdminMediaId,
} from './adminHelpers.js';

// Redéfinir localement pour éviter une dépendance circulaire avec recipesController
const recipeRelationsInclude = {
  category: true,
  media: true,
  user: { select: { nom: true, prenom: true, pseudo: true } },
  ingredients: { include: { ingredient: true } },
};

export async function getAdminRecipes(req, res) { ... }
// ... copier les autres fonctions recettes
```

#### `adminController.js` devient un barrel re-export

```js
// adminController.js — barrel re-export (60 lignes)
export {
  getAdminRecipes, getPendingRecipes, publishRecipe,
  approveRecipe, rejectRecipe, deleteRecipe, updateAdminRecipe,
} from './adminRecipesController.js';

export { getAdminUsers, deleteUser, updateUserRole } from './adminUsersController.js';

export {
  getAdminCategories, createCategory, updateCategory, deleteCategory,
} from './adminCategoriesController.js';

export {
  getAdminIngredients, createAdminIngredient, updateIngredient,
  approveIngredient, deleteIngredient, getValidatedIngredients,
  getIngredientRecipes, mergeIngredients, getCategoryRecipes,
} from './adminIngredientsController.js';

export {
  getAdminNotifications, deleteAdminNotification,
} from './adminNotificationsController.js';
```

> ⚠️ **Vérification critique** : après le découpage, s'assurer que toutes
> les fonctions importées par `adminRoutes.js` sont bien exportées par le barrel.
> Lancer `node -e "require('./api/src/controllers/adminController.js')"` pour
> détecter les imports manquants.

---

### Partie B — Extraire `RecipeEditModal` de `MemberRecipes.jsx`

#### Nouveau fichier à créer

`client/src/components/RecipeEditModal/RecipeEditModal.jsx`

#### Structure du composant

```jsx
// RecipeEditModal.jsx
// Reçoit toute la logique via props — zéro state propre, zéro handler direct.
import styles from '../MemberRecipes/MemberRecipes.module.scss';
import {
  getMediaSuggestionMeta,
  MEDIA_SUGGESTION_POSTER_FALLBACK,
} from '../../utils/mediaSearch.js';
import { buildCategoryFilters } from '../../components/RecipeCatalogView/recipeCatalog.shared.js';

export default function RecipeEditModal({
  showEditModal, showEditConfirmModal, isSavingEdit,
  editForm, editImageError,
  filmResults, filmSearchLoading, filmSearchError,
  editIngredientSearchResults, editIngredientSearchLoading,
  editIngredientSearchError, creatingEditIngredient,
  availableCategories, unitesOptions,
  onClose, onCloseConfirm, onSave, onOpenConfirm,
  onEditChange, onFilmInput, onSelectFilm,
  onIngredientNameInput, onSelectIngredient, onCreateIngredient,
  onIngredientChange, onAddIngredient, onRemoveIngredient,
  onEtapeChange, onAddEtape, onRemoveEtape, onImageChange,
}) {
  if (!showEditModal && !showEditConfirmModal) return null;

  return (
    <>
      {/* Couper-coller ici les blocs JSX {showEditModal && (...)} et
          {showEditConfirmModal && (...)} depuis MemberRecipes.jsx,
          puis remplacer chaque référence directe par la prop correspondante :
          setShowEditModal(false)     → onClose()
          setShowEditConfirmModal(false) → onCloseConfirm()
          openEditConfirmModal()      → onOpenConfirm()
          handleEditSave              → onSave
          handleEditChange(           → onEditChange(
          handleFilmInput(            → onFilmInput(
          selectFilm(                 → onSelectFilm(
          handleEditIngredientNameInput( → onIngredientNameInput(
          selectEditIngredient(       → onSelectIngredient(
          createEditIngredient(       → onCreateIngredient(
          handleEditIngredientChange( → onIngredientChange(
          addEditIngredient           → onAddIngredient
          removeEditIngredient(       → onRemoveIngredient(
          handleEditEtapeChange(      → onEtapeChange(
          addEditEtape                → onAddEtape
          removeEditEtape(            → onRemoveEtape(
          handleEditImageChange(      → onImageChange( */}
    </>
  );
}
```

#### `client/src/components/RecipeEditModal/index.js`

```js
export { default } from './RecipeEditModal.jsx';
```

#### Dans `MemberRecipes.jsx` — remplacer les 2 modales par le composant

```jsx
// Ajouter l'import en haut :
import RecipeEditModal from '../../components/RecipeEditModal';

// Remplacer les blocs {showEditModal && ...} et {showEditConfirmModal && ...} par :
<RecipeEditModal
  showEditModal={showEditModal}
  showEditConfirmModal={showEditConfirmModal}
  isSavingEdit={isSavingEdit}
  editForm={editForm}
  editImageError={editImageError}
  filmResults={filmResults}
  filmSearchLoading={filmSearchLoading}
  filmSearchError={filmSearchError}
  editIngredientSearchResults={editIngredientSearchResults}
  editIngredientSearchLoading={editIngredientSearchLoading}
  editIngredientSearchError={editIngredientSearchError}
  creatingEditIngredient={creatingEditIngredient}
  availableCategories={availableCategories}
  unitesOptions={unitesOptions}
  onClose={() => setShowEditModal(false)}
  onCloseConfirm={() => setShowEditConfirmModal(false)}
  onSave={handleEditSave}
  onOpenConfirm={openEditConfirmModal}
  onEditChange={handleEditChange}
  onFilmInput={handleFilmInput}
  onSelectFilm={selectFilm}
  onIngredientNameInput={handleEditIngredientNameInput}
  onSelectIngredient={selectEditIngredient}
  onCreateIngredient={createEditIngredient}
  onIngredientChange={handleEditIngredientChange}
  onAddIngredient={addEditIngredient}
  onRemoveIngredient={removeEditIngredient}
  onEtapeChange={handleEditEtapeChange}
  onAddEtape={addEditEtape}
  onRemoveEtape={removeEditEtape}
  onImageChange={handleEditImageChange}
/>
```

### Commit

```bash
git add \
  api/src/controllers/adminController.js \
  api/src/controllers/adminHelpers.js \
  api/src/controllers/adminRecipesController.js \
  api/src/controllers/adminUsersController.js \
  api/src/controllers/adminCategoriesController.js \
  api/src/controllers/adminIngredientsController.js \
  api/src/controllers/adminNotificationsController.js \
  client/src/pages/MemberRecipes/MemberRecipes.jsx \
  client/src/components/RecipeEditModal/RecipeEditModal.jsx \
  client/src/components/RecipeEditModal/index.js
git commit -m "refactor: split adminController into themed modules and extract RecipeEditModal"
git push perso refactor/split-admin-controller-and-member-recipes
```

---

## Checklist finale

Après toutes les corrections, vérifier sur `dev` :

```bash
# Merger chaque branche dans dev (via PR ou localement)
git checkout dev
git merge fix/recipe-card-image-fallback
git merge fix/ingredient-compound-name-normalization
git merge feat/admin-reject-ingredient-with-notification
git merge feat/admin-create-ingredient-and-recipe
git merge fix/member-can-delete-rejected-recipe
git merge refactor/split-admin-controller-and-member-recipes

# Vérifier que tout tourne
cd api && node -e "import('./src/controllers/adminController.js').then(m => console.log('✅ Back OK', Object.keys(m).length, 'exports'))"
cd client && pnpm run build
```

- [ ] `/membre/mes-recettes/recettes-en-validation` : placeholder SVG si pas d'image
- [ ] `"fraise des bois"` : bouton "Créer" visible et fonctionnel
- [ ] Admin `/validation-ingredients` : bouton Supprimer actif + champ motif
- [ ] Admin `/ingredients` : bouton "+ Ajouter un ingrédient" visible
- [ ] Admin `/recettes` : lien "+ Créer une recette" visible
- [ ] `/admin/creer-recette` : formulaire accessible
- [ ] Notification de refus → redirige vers `/membre/mes-recettes`
- [ ] Recette PENDING : bouton Supprimer masqué
- [ ] `pnpm run build` sans erreur côté client
