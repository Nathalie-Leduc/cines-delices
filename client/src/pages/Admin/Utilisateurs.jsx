import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import AdminModal from '../../components/AdminModal';
import Alert from '../../components/Alert/Alert.jsx';
import StatusBlock from '../../components/StatusBlock/StatusBlock.jsx';
import { deleteAdminUser, getAdminUsers, updateAdminUserRole } from '../../services/adminService.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import styles from './AdminPages.module.scss';

function getRoleLabel(role) {
  return role === 'ADMIN' ? 'Administrateur' : 'Membre';
}

function getUserIdentityLabel(user) {
  return [user?.nom, user?.displayName || user?.prenom]
    .filter(Boolean)
    .join(' ')
    .trim() || 'Utilisateur';
}

function AdminUtilisateurs() {
  const { user: currentUser } = useAuth();
  const location = useLocation();
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Calcul du total des recettes pour l'utilisateur sélectionné
  const usersWithTotals = useMemo(() => {
    return users.map((user) => ({
    ...user,
    totalRecipes:
      (user.recipeCounts?.entree || 0) +
      (user.recipeCounts?.plat || 0) +
      (user.recipeCounts?.dessert || 0) +
      (user.recipeCounts?.boisson || 0),
  }));
}, [users]);

  useEffect(() => {
    setSelectedUser(null);
  }, [location.key]);

  useEffect(() => {
    setIsLoading(true);
    getAdminUsers()
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.data ?? [];
        setUsers(list);
      })
      .catch((err) => setError(err.message || 'Impossible de charger les utilisateurs.'))
      .finally(() => setIsLoading(false));
  }, []);

  const filteredUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return usersWithTotals;
    }
    return usersWithTotals.filter((user) => {
      return `${user.nom} ${user.displayName || user.prenom || ''} ${user.email}`.toLowerCase().includes(normalizedQuery);
    });
  }, [query, usersWithTotals]);

  async function handleDeleteUser() {
    if (!selectedUser) return;
    try {
      setError('');
      setSuccessMessage('');
      await deleteAdminUser(selectedUser.id);
      setUsers((previous) => previous.filter((user) => user.id !== selectedUser.id));
      setSelectedUser(null);
      setShowDeleteModal(false);
    } catch (deleteError) {
      setError(deleteError.message || 'Suppression impossible.');
    }
  }

  async function handleToggleRole() {
    if (!selectedUser) return;
    const newRole = selectedUser.role === 'ADMIN' ? 'MEMBER' : 'ADMIN';
    setIsUpdatingRole(true);
    setError('');
    setSuccessMessage('');
    try {
      const updated = await updateAdminUserRole(selectedUser.id, newRole);
      const nextUser = updated?.id === selectedUser.id
        ? updated
        : { ...selectedUser, role: newRole };

      setUsers((previous) => previous.map((user) => (
        user.id === selectedUser.id
          ? { ...user, ...nextUser }
          : user
      )));
      setSelectedUser((previous) => (previous ? { ...previous, ...nextUser } : previous));
      setSuccessMessage(`Rôle mis à jour : ${getRoleLabel(newRole)}.`);
    } catch (roleError) {
      setError(roleError.message || 'Modification du rôle impossible.');
    } finally {
      setIsUpdatingRole(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.headerLine}>
        <h2>Gérer les utilisateurs</h2>
      </div>

      {!selectedUser && (
        <>
          <div className={styles.usersSearchRow}>
            <input
              className={styles.usersSearchInput}
              type="text"
              placeholder="Rechercher un utilisateur"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <img src="/icon/Search.svg" alt="" aria-hidden="true" />
          </div>

          <div className={styles.sectionTitle}>
            <h3>Liste des utilisateurs</h3>
          </div>

          {isLoading ? (
            <StatusBlock
              variant="loading"
              title="Chargement des utilisateurs"
              className={styles.pageState}
            />
          ) : null}
          <Alert type="error" message={error} onClose={() => setError('')} className={styles.pageState} />

          <div className={styles.list}>
            {filteredUsers.map((user) => (
              <button key={user.id} type="button" className={styles.rowCard} onClick={() => setSelectedUser(user)}>
                <span className={styles.userAvatar}>
                  <img src="/icon/User.svg" alt="" aria-hidden="true" />
                </span>
                <span className={styles.rowText}>
                  <strong>{getUserIdentityLabel(user)}</strong>
                  <span className={styles.rowMeta}>
                    <small>{user.email}</small>
                    <span className={`${styles.statusPill} ${user.role === 'ADMIN' ? styles.statusAdmin : styles.statusMember}`.trim()}>
                      {getRoleLabel(user.role)}
                    </span>
                  </span>
                </span>
                <span className={styles.recipesBadgeCentered}>
                  {user.totalRecipes} recette{user.totalRecipes > 1 ? 's' : ''}
                </span>
                <span className={styles.rowArrow}>›</span>
              </button>
            ))}

            {!isLoading && !error && filteredUsers.length === 0 ? (
              <StatusBlock
                variant="empty"
                title={query.trim() ? 'Aucun utilisateur trouvé' : 'Aucun utilisateur disponible'}
                message={query.trim()
                  ? 'Essaie une autre recherche pour retrouver un membre ou un administrateur.'
                  : 'La liste des utilisateurs apparaîtra ici dès qu’un compte sera disponible.'}
                className={styles.pageState}
              />
            ) : null}
          </div>
        </>
      )}

      {selectedUser && (
        <>
          <Alert type="success" message={successMessage} onClose={() => setSuccessMessage('')} className={styles.pageState} />
          <Alert type="error" message={error} onClose={() => setError('')} className={styles.pageState} />

          <div className={styles.detailBox}>
            <div className={styles.field}>
              <label>Prénom</label>
              <p>{selectedUser.prenom || '—'}</p>
            </div>
            <div className={styles.field}>
              <label>Nom</label>
              <p>{selectedUser.nom || '—'}</p>
            </div>
            <div className={styles.field}>
              <label>E-mail</label>
              <p>{selectedUser.email}</p>
            </div>
            <div className={styles.field}>
              <label>Rôle</label>
              <p>
                <span className={`${styles.statusPill} ${selectedUser.role === 'ADMIN' ? styles.statusAdmin : styles.statusMember}`.trim()}>
                  {getRoleLabel(selectedUser.role)}
                </span>
              </p>
            </div>

            <div className={styles.recipesBlock}>
              <span className={styles.blockLabel}>Recettes</span>

              <div className={styles.countersRow}>
                <span className={styles.counter}>{selectedUser.recipeCounts?.entree || 0}</span>
                <span className={styles.counter}>{selectedUser.recipeCounts?.plat || 0}</span>
                <span className={styles.counter}>{selectedUser.recipeCounts?.dessert || 0}</span>
                <span className={styles.counter}>{selectedUser.recipeCounts?.boisson || 0}</span>
              </div>

              <div className={styles.badgesRow}>
                <span className={`${styles.badge} ${styles.entree}`.trim()}>Entrée</span>
                <span className={`${styles.badge} ${styles.plat}`.trim()}>Plat</span>
                <span className={`${styles.badge} ${styles.dessert}`.trim()}>Dessert</span>
                <span className={`${styles.badge} ${styles.boisson}`.trim()}>Boisson</span>
              </div>
            </div>
          </div>

          <div className={styles.actionButtons}>
            {currentUser?.id !== selectedUser.id && (
              <button
                type="button"
                className={`${styles.btnMuted} ${styles.fullWidthBtn}`.trim()}
                onClick={handleToggleRole}
                disabled={isUpdatingRole}
              >
                {isUpdatingRole
                  ? 'Modification…'
                  : selectedUser.role === 'ADMIN'
                  ? 'Rétrograder en Membre'
                  : 'Promouvoir en Admin'}
              </button>
            )}
            <button type="button" className={`${styles.btnDanger} ${styles.fullWidthBtn}`.trim()} onClick={() => setShowDeleteModal(true)}>
              Supprimer cet utilisateur
            </button>
          </div>
        </>
      )}

      {showDeleteModal && (
        <AdminModal
          title="Supprimer l’utilisateur"
          confirmLabel="Supprimer"
          onCancel={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteUser}
        >
          Êtes-vous sûr de vouloir supprimer cet utilisateur ?
        </AdminModal>
      )}
    </div>
  );
}

export default AdminUtilisateurs;
