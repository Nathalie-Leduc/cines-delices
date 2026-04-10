# Fix : Notification lors de la suppression d'une recette (admin)

## Contexte

Quand l'admin supprime une recette depuis la page "Gérer les recettes" :
- La modale s'affiche mais **aucun textarea** ne permet de saisir un message
- **Aucune notification** n'est envoyée au membre qui avait créé la recette

## Branche de travail

```bash
git checkout develop
git pull
git checkout -b fix/admin-delete-recipe-notification
```

---

## Fichiers à modifier (3 fichiers)

---

### 1. `api/src/controllers/adminRecipesController.js`

**Fonction à remplacer : `deleteRecipe`**

Trouve cette fonction :

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

Remplace-la par :

```js
export async function deleteRecipe(req, res) {
  try {
    const { notifMessage } = req.body;

    // Récupérer la recette AVANT suppression
    // (une fois supprimée, elle n'existe plus en BDD)
    const recipe = await prisma.recipe.findUnique({
      where: { id: req.params.id },
    });

    if (!recipe) {
      return res.status(404).json({ message: 'Recette introuvable.' });
    }

    // Créer la notification pour le membre auteur (si la recette appartient à quelqu'un)
    if (recipe.userId) {
      const message =
        String(notifMessage || '').trim() ||
        `Votre recette "${recipe.titre}" a été supprimée par l'administrateur.`;

      await prisma.notification.create({
        data: {
          userId: recipe.userId,
          recipeId: null, // null obligatoire : la recette va être supprimée juste après
          type: 'RECIPE_SUBMITTED',
          message,
        },
      });
    }

    // Supprimer la recette après avoir créé la notification
    await prisma.recipe.delete({ where: { id: req.params.id } });
    return res.status(204).send();
  } catch (error) {
    return sendError(res, error, 'Erreur lors de la suppression de la recette.');
  }
}
```

> ⚠️ `recipeId: null` est intentionnel : si on mettait l'id, la FK en BDD pointerait vers
> une recette qui n'existe plus → erreur Prisma P2025. On notifie d'abord, on supprime ensuite.

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
// notifMessage : message optionnel envoyé au membre lors de la suppression
export const deleteAdminRecipe = (id, notifMessage) =>
  request(`${ADMIN_API_BASE}/recipes/${id}`, {
    method: 'DELETE',
    body: notifMessage ? { notifMessage } : undefined,
  });
```

---

### 3. `client/src/pages/Admin/Recettes.jsx`

**Trois modifications dans ce fichier.**

#### 3a. Ajouter le state pour le message de notification

Trouve le bloc des `useState` (vers la ligne avec `const [modalState, setModalState] = useState(null);`) et ajoute juste après :

```js
const [deleteNotifMessage, setDeleteNotifMessage] = useState('');
```

#### 3b. Modifier `handleDeleteRecipe`

Trouve :

```js
async function handleDeleteRecipe() {
  if (!modalState?.recipeId) {
    return;
  }

  try {
    await deleteAdminRecipe(modalState.recipeId);
    setRecipes((previous) => previous.filter((recipe) => recipe.id !== modalState.recipeId));
    setModalState(null);
  } catch (deleteError) {
    setError(deleteError.message || 'Suppression impossible.');
  }
}
```

Remplace par :

```js
async function handleDeleteRecipe() {
  if (!modalState?.recipeId) {
    return;
  }

  try {
    // Passe le message saisi, ou un message par défaut si le champ est vide
    const message =
      deleteNotifMessage.trim() ||
      `Votre recette "${modalState.recipeTitle}" a été supprimée par l'administrateur.`;

    await deleteAdminRecipe(modalState.recipeId, message);
    setRecipes((previous) => previous.filter((recipe) => recipe.id !== modalState.recipeId));
    setModalState(null);
    setDeleteNotifMessage(''); // reset du textarea pour la prochaine ouverture
  } catch (deleteError) {
    setError(deleteError.message || 'Suppression impossible.');
  }
}
```

#### 3c. Modifier la modale de suppression dans le JSX

Trouve :

```jsx
{modalState?.type === 'delete' && (
  <AdminModal
    title="Supprimer la recette"
    confirmLabel="Supprimer"
    onCancel={() => setModalState(null)}
    onConfirm={handleDeleteRecipe}
  >
    Êtes-vous sûr de vouloir supprimer cette recette ?
  </AdminModal>
)}
```

Remplace par :

```jsx
{modalState?.type === 'delete' && (
  <AdminModal
    title="Supprimer la recette"
    confirmLabel="Supprimer"
    onCancel={() => {
      setModalState(null);
      setDeleteNotifMessage(''); // reset si l'admin annule
    }}
    onConfirm={handleDeleteRecipe}
  >
    <p>
      Êtes-vous sûr de vouloir supprimer{' '}
      <strong>"{modalState.recipeTitle}"</strong> ?
    </p>
    <label style={{ display: 'block', marginTop: '1rem' }}>
      <span style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>
        Message au membre (optionnel)
      </span>
      <textarea
        rows={3}
        style={{ display: 'block', width: '100%' }}
        placeholder={`Votre recette "${modalState.recipeTitle}" a été supprimée par l'administrateur.`}
        value={deleteNotifMessage}
        onChange={(e) => setDeleteNotifMessage(e.target.value)}
      />
    </label>
  </AdminModal>
)}
```

---

## Commit

```bash
git add api/src/controllers/adminRecipesController.js
git add client/src/services/adminService.js
git add client/src/pages/Admin/Recettes.jsx

git commit -m "fix(admin): notify member on recipe deletion with optional custom message"
```

---

## Push et PR

```bash
git push origin fix/admin-delete-recipe-notification
```

Puis ouvre une Pull Request vers `develop` sur GitHub.

---

## Comportement attendu après le fix

| Avant | Après |
|---|---|
| Modale : texte statique, pas de textarea | Modale : nom de la recette affiché + textarea pré-rempli éditable |
| Membre : aucune notification reçue | Membre : notification créée avec le message de l'admin (ou message par défaut) |
| Annuler la modale : textarea conservait son état | Annuler : textarea remis à vide pour la prochaine ouverture |
