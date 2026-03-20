import { useEffect, useMemo, useState } from 'react';
import AdminModal from '../../components/AdminModal';
import { deleteAdminUser, getAdminUsers } from '../../services/adminService.js';
import { mockUsers } from '../../data/admin.mock.js';
import styles from './AdminPages.module.scss';

function AdminUtilisateurs() {
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Using mock data for testing
    setUsers(mockUsers);
  }, []);

  const filteredUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return users;
    }

    return users.filter((user) => {
      return `${user.nom} ${user.prenom} ${user.email}`.toLowerCase().includes(normalizedQuery);
    });
  }, [query]);

  async function handleDeleteUser() {
    if (!selectedUser) {
      return;
    }

    try {
      // Mock deletion for testing
      setUsers((previous) => previous.filter((user) => user.id !== selectedUser.id));
      setSelectedUser(null);
      setShowDeleteModal(false);
    } catch (deleteError) {
      setError(deleteError.message || 'Suppression impossible.');
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
            <h3>Listes des utilisateurs</h3>
          </div>

          {error ? <p>{error}</p> : null}

          <div className={styles.list}>
            {filteredUsers.map((user) => (
              <button key={user.id} type="button" className={styles.rowCard} onClick={() => setSelectedUser(user)}>
                <span className={styles.userAvatar}>
                  <img src="/icon/User.svg" alt="" aria-hidden="true" />
                </span>
                <span className={styles.rowText}>
                  <strong>{user.nom}</strong>
                  <small>{user.email}</small>
                </span>
                <span className={styles.rowArrow}>›</span>
              </button>
            ))}
          </div>
        </>
      )}

      {selectedUser && (
        <>
          <div className={styles.detailBox}>
            <div className={styles.field}>
              <label>Nom</label>
              <p>{selectedUser.nom}</p>
            </div>
            <div className={styles.field}>
              <label>Prénom</label>
              <p>{selectedUser.prenom}</p>
            </div>
            <div className={styles.field}>
              <label>E-mail</label>
              <p>{selectedUser.email}</p>
            </div>

            <div className={styles.recipesBlock}>
              <span className={styles.blockLabel}>Recettes</span>

              <div className={styles.badgesRow}>
                <span className={`${styles.badge} ${styles.entree}`.trim()}>Entrée</span>
                <span className={`${styles.badge} ${styles.plat}`.trim()}>Plat</span>
                <span className={`${styles.badge} ${styles.dessert}`.trim()}>Dessert</span>
                <span className={`${styles.badge} ${styles.boisson}`.trim()}>Boisson</span>
              </div>

              <div className={styles.countersRow}>
                <span className={styles.counter}>{selectedUser.recipeCounts?.entree || 0}</span>
                <span className={styles.separator}>|</span>
                <span className={styles.counter}>{selectedUser.recipeCounts?.plat || 0}</span>
                <span className={styles.separator}>|</span>
                <span className={styles.counter}>{selectedUser.recipeCounts?.dessert || 0}</span>
                <span className={styles.separator}>|</span>
                <span className={styles.counter}>{selectedUser.recipeCounts?.boisson || 0}</span>
              </div>
            </div>
          </div>

          <div className={styles.actionButtons}>
            <button type="button" className={`${styles.btnDanger} ${styles.fullWidthBtn}`.trim()} onClick={() => setShowDeleteModal(true)}>
              Supprimer cet utilisateur
            </button>
          </div>
        </>
      )}

      {showDeleteModal && (
        <AdminModal onCancel={() => setShowDeleteModal(false)} onConfirm={handleDeleteUser}>
          Êtes-vous sûr de vouloir supprimer cet utilisateur ?
        </AdminModal>
      )}
    </div>
  );
}

export default AdminUtilisateurs;