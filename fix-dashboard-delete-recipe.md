# Fix : Suppression de recette dans la page Validation des recettes

## Contexte

Sur la page `/admin/validation-recettes` (`Dashboard.jsx`) :

- **Bug 1** — La modale de suppression s'affiche mais sans textarea → impossible d'écrire un message
- **Bug 2** — Le bouton "Supprimer" ne fait rien (erreur "Erreur lors de la suppression")
- **Bug 3** — Sur la vue détail d'une recette (après avoir cliqué dessus), il n'y a pas de bouton Supprimer

## Branche de travail

```bash
git checkout develop
git pull
git checkout -b fix/dashboard-delete-recipe-notification
```

---

## Fichiers à modifier (2 fichiers)

---

### 1. `api/src/controllers/adminRecipesController.js`

**Fonction à remplacer : `deleteRecipe`**

Trouve :

```js
export async function deleteRecipe(req, res) {
  try {
    await prisma.recipe.delete({ where: { id: req.params.id } });
    return res.status(204).send();
  } catch (error) {
    return sendError(res, error, 'Erreur lors de la suppression de la recette.');
  }
}
```

Remplace par :

```js
export async function deleteRecipe(req, res) {
  try {
    const { notifMessage } = req.body;

    // Récupérer la recette AVANT suppression
    // Une fois supprimée elle n'existe plus — on ne peut plus lire son userId ni son titre
    const recipe = await prisma.recipe.findUnique({
      where: { id: req.params.id },
    });

    if (!recipe) {
      return res.status(404).json({ message: 'Recette introuvable.' });
    }

    // Créer la notification avant de supprimer
    // recipeId: null — obligatoire car la recette sera supprimée juste après
    // (une FK vers une recette inexistante provoquerait une erreur Prisma)
    if (recipe.userId) {
      const message =
        String(notifMessage || '').trim() ||
        `Votre recette "${recipe.titre}" a été supprimée par l'administrateur.`;

      await prisma.notification.create({
        data: {
          userId: recipe.userId,
          recipeId: null,
          type: 'RECIPE_SUBMITTED',
          message,
        },
      });
    }

    await prisma.recipe.delete({ where: { id: req.params.id } });
    return res.status(204).send();
  } catch (error) {
    return sendError(res, error, 'Erreur lors de la suppression de la recette.');
  }
}
```

---

### 2. `client/src/services/adminService.js`

**Fonction à modifier : `deleteAdminRecipe`**

Trouve :

```js
export const deleteAdminRecipe = (id) =>
  request(`${ADMIN_API_BASE}/recipes/${id}`, { method: 'DELETE' });
```

Remplace par :

```js
// notifMessage : message optionnel transmis au membre lors de la suppression
export const deleteAdminRecipe = (id, notifMessage) =>
  request(`${ADMIN_API_BASE}/recipes/${id}`, {
    method: 'DELETE',
    body: notifMessage ? { notifMessage } : undefined,
  });
```

---

### 3. `client/src/pages/Admin/Dashboard.jsx`

**Trois modifications dans ce fichier.**

#### 3a. Ajouter le state pour le message

Trouve le bloc des `useState` (vers la ligne avec `const [isDeletingRecipe, setIsDeletingRecipe] = useState(false);`) et ajoute juste après :

```js
const [deleteNotifMessage, setDeleteNotifMessage] = useState('');
```

#### 3b. Modifier `handleDeleteRecipe`

Trouve :

```js
async function handleDeleteRecipe() {
  if (!recipeToDelete?.id) return;
  setIsDeletingRecipe(true);
  try {
    await deleteAdminRecipe(recipeToDelete.id);
    setPendingRecipes(prev => prev.filter(r => r.id !== recipeToDelete.id));
    setShowDeleteRecipeModal(false);
    setRecipeToDelete(null);
  } catch (err) {
    setError(err?.message || 'Impossible de supprimer la recette.');
  } finally {
    setIsDeletingRecipe(false);
  }
}
```

Remplace par :

```js
async function handleDeleteRecipe() {
  if (!recipeToDelete?.id) return;
  setIsDeletingRecipe(true);
  try {
    const message =
      deleteNotifMessage.trim() ||
      `Votre recette "${recipeToDelete.title}" a été supprimée par l'administrateur.`;

    await deleteAdminRecipe(recipeToDelete.id, message);

    // Si on était en vue détail, on revient à la liste
    if (selectedRecipe?.id === recipeToDelete.id) {
      setSelectedRecipe(null);
    }

    setPendingRecipes(prev => prev.filter(r => r.id !== recipeToDelete.id));
    setShowDeleteRecipeModal(false);
    setRecipeToDelete(null);
    setDeleteNotifMessage(''); // reset pour la prochaine ouverture
  } catch (err) {
    setError(err?.message || 'Impossible de supprimer la recette.');
  } finally {
    setIsDeletingRecipe(false);
  }
}
```

#### 3c. Modifier la modale de suppression dans le JSX

Trouve :

```jsx
{showDeleteRecipeModal && (
  <AdminModal
    title="Supprimer la recette"
    confirmLabel={isDeletingRecipe ? 'Suppression...' : 'Supprimer'}
    confirmVariant="danger"
    onCancel={() => {
      if (!isDeletingRecipe) {
        setShowDeleteRecipeModal(false);
        setRecipeToDelete(null);
      }
    }}
    onConfirm={handleDeleteRecipe}
  >
    <p>
      Êtes-vous sûr de vouloir supprimer la recette{' '}
      <strong>&quot;{recipeToDelete?.title}&quot;</strong> ?
    </p>
    <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', opacity: 0.8 }}>
      Cette action est irréversible. Le membre sera notifié.
    </p>
  </AdminModal>
)}
```

Remplace par :

```jsx
{showDeleteRecipeModal && (
  <AdminModal
    title="Supprimer la recette"
    confirmLabel={isDeletingRecipe ? 'Suppression...' : 'Supprimer'}
    confirmVariant="danger"
    onCancel={() => {
      if (!isDeletingRecipe) {
        setShowDeleteRecipeModal(false);
        setRecipeToDelete(null);
        setDeleteNotifMessage('');
      }
    }}
    onConfirm={handleDeleteRecipe}
  >
    <p>
      Êtes-vous sûr de vouloir supprimer{' '}
      <strong>&quot;{recipeToDelete?.title}&quot;</strong> ?
    </p>
    <label style={{ display: 'block', marginTop: '1rem' }}>
      <span style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>
        Message au membre (optionnel)
      </span>
      <textarea
        className={styles.modalTextarea}
        rows={3}
        placeholder={`Votre recette "${recipeToDelete?.title}" a été supprimée par l'administrateur.`}
        value={deleteNotifMessage}
        onChange={(e) => setDeleteNotifMessage(e.target.value)}
        disabled={isDeletingRecipe}
      />
    </label>
  </AdminModal>
)}
```

#### 3d. Ajouter le bouton Supprimer dans la vue détail (Bug 3)

Trouve le bloc des boutons d'action de la vue détail :

```jsx
<div className={`${styles.actionButtons} ${styles.heroActionButtons}`.trim()}>
  <button
    type="button"
    className={`${styles.btnMuted} ${styles.fullWidthBtn}`.trim()}
    onClick={() => openEditFromValidation(selectedRecipe)}
  >
    Modifier
  </button>
  <button type="button" className={`${styles.btnDanger} ${styles.fullWidthBtn}`.trim()} onClick={() => setShowRefuseModal(true)}>
    Refuser
  </button>
  <button type="button" className={`${styles.btnSuccess} ${styles.fullWidthBtn}`.trim()} onClick={() => setShowValidateModal(true)}>
    Valider
  </button>
</div>
```

Remplace par :

```jsx
<div className={`${styles.actionButtons} ${styles.heroActionButtons}`.trim()}>
  <button
    type="button"
    className={`${styles.btnMuted} ${styles.fullWidthBtn}`.trim()}
    onClick={() => openEditFromValidation(selectedRecipe)}
  >
    Modifier
  </button>
  <button
    type="button"
    className={`${styles.btnDanger} ${styles.fullWidthBtn}`.trim()}
    onClick={() => setShowRefuseModal(true)}
  >
    Refuser
  </button>
  <button
    type="button"
    className={`${styles.btnSuccess} ${styles.fullWidthBtn}`.trim()}
    onClick={() => setShowValidateModal(true)}
  >
    Valider
  </button>
  <button
    type="button"
    className={`${styles.btnDanger} ${styles.fullWidthBtn}`.trim()}
    style={{ opacity: 0.75 }}
    onClick={() => {
      setRecipeToDelete(selectedRecipe);
      setShowDeleteRecipeModal(true);
    }}
  >
    Supprimer
  </button>
</div>
```

---

## Commit

```bash
git add api/src/controllers/adminRecipesController.js
git add client/src/services/adminService.js
git add client/src/pages/Admin/Dashboard.jsx

git commit -m "fix(admin): add notif message textarea on delete modal + fix delete handler + add delete btn on recipe detail view"
```

---

## Push et PR

```bash
git push origin fix/dashboard-delete-recipe-notification
```

Puis ouvre une Pull Request vers `develop` sur GitHub.

---

## Résumé des corrections

| Bug | Cause | Fix |
|---|---|---|
| Textarea non éditable | Pas de `<textarea>` dans la modale | Ajout textarea avec `className={styles.modalTextarea}` (même style que la modale Refus) |
| Bouton Supprimer inactif | `deleteAdminRecipe` n'envoyait pas de body + back ne créait pas la notif avant suppression | Service mis à jour + back corrigé |
| Pas de bouton Supprimer en vue détail | Bouton absent du JSX | Ajout d'un 4e bouton dans `heroActionButtons` |
