import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from '../../components/AdminSidebar';
import AdminHeader from '../../components/AdminHeader';
import styles from './AdminLayout.module.scss';

export default function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className={styles.adminLayout}>
      {isSidebarOpen && <AdminSidebar className={!isSidebarOpen ? styles.closed : ''} />}
      <div className={styles.adminContent}
       style={{ marginLeft: isSidebarOpen ? '250px' : '0' }}>
        <AdminHeader toggleSidebar={toggleSidebar} />
        <main className={styles.adminMain}>
         <Outlet />
        </main>
      </div>
    </div>
  );
}
