import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Users, ShoppingBag, Truck, FileText, LogOut, Menu, X, Settings } from 'lucide-react';
import Modal from '../ui/Modal';
import * as userService from '../../services/userService';

const MainLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [settingsError, setSettingsError] = useState('');
  const [settingsSuccess, setSettingsSuccess] = useState('');

  useEffect(() => {
    if (user?.role) {
      document.documentElement.setAttribute('data-role', user.role.toLowerCase());
    }
  }, [user?.role]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleBasePath = (role) => {
    switch (role) {
      case 'Admin': return '/admin';
      case 'Sales': return '/seller';
      case 'Warehouse': return '/warehouse';
      case 'Accounts': return '/accounts';
      default: return '/';
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setSettingsError('');
    setSettingsSuccess('');
    if (newPassword !== confirmPassword) {
      return setSettingsError("New passwords do not match");
    }
    try {
      await userService.changePassword({ currentPassword, newPassword });
      setSettingsSuccess("Password changed successfully!");
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setIsSettingsOpen(false), 2000);
    } catch (err) {
      setSettingsError(err.response?.data?.message || 'Failed to change password');
    }
  };

  const basePath = getRoleBasePath(user?.role);

  return (
    <div className="app-container">
      {/* Mobile Overlay */}
      <div 
        className={`sidebar-overlay ${isSidebarOpen ? 'active' : ''}`}
        onClick={closeSidebar}
      ></div>

      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand" style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '30px', height: '30px', backgroundColor: 'var(--primary-accent)', borderRadius: '8px' }}></div>
            ERP Portal
          </div>
          <button className="menu-toggle" onClick={closeSidebar}>
            <X size={24} />
          </button>
        </div>
        
        <nav className="nav-menu">
          <NavLink to={`${basePath}/dashboard`} className={({ isActive }) => isActive ? "nav-link active" : "nav-link"} onClick={closeSidebar}>
            <LayoutDashboard size={20} /> Dashboard
          </NavLink>

          {(user?.role === 'Admin' || user?.role === 'Sales') && (
            <>
              <NavLink to={`${basePath}/customers`} className={({ isActive }) => isActive ? "nav-link active" : "nav-link"} onClick={closeSidebar}>
                <Users size={20} /> Customers CRM
              </NavLink>
              <NavLink to={`${basePath}/challans`} className={({ isActive }) => isActive ? "nav-link active" : "nav-link"} onClick={closeSidebar}>
                <FileText size={20} /> Sales Challans
              </NavLink>
            </>
          )}

          {(user?.role === 'Admin' || user?.role === 'Warehouse' || user?.role === 'Sales') && (
            <>
              <NavLink to={`${basePath}/products`} className={({ isActive }) => isActive ? "nav-link active" : "nav-link"} onClick={closeSidebar}>
                <ShoppingBag size={20} /> Products Catalog
              </NavLink>
              {(user?.role === 'Admin' || user?.role === 'Warehouse') && (
                <NavLink to={`${basePath}/stock-movements`} className={({ isActive }) => isActive ? "nav-link active" : "nav-link"} onClick={closeSidebar}>
                  <Truck size={20} /> Stock Movements
                </NavLink>
              )}
            </>
          )}

          {user?.role === 'Accounts' && (
            <NavLink to={`${basePath}/financials`} className={({ isActive }) => isActive ? "nav-link active" : "nav-link"} onClick={closeSidebar}>
              <FileText size={20} /> Confirmed Challans
            </NavLink>
          )}
          {user?.role === 'Admin' && (
            <NavLink to={`${basePath}/users`} className={({ isActive }) => isActive ? "nav-link active" : "nav-link"} onClick={closeSidebar}>
              <Users size={20} /> System Users
            </NavLink>
          )}
        </nav>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button className="menu-toggle" onClick={toggleSidebar}>
              <Menu size={24} />
            </button>
            <span className="badge success">{user?.role} Workspace</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>{user?.email}</span>
            <button onClick={() => setIsSettingsOpen(true)} className="btn-secondary" style={{ padding: '0.5rem' }} title="Settings">
              <Settings size={18} />
            </button>
            <button onClick={handleLogout} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}>
              <LogOut size={16} /> Logout
            </button>
          </div>
        </header>
        
        <div className="page-content">
          {children}
        </div>
      </main>

      <Modal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} title="Account Settings">
        <h4 style={{ marginBottom: '1rem', fontFamily: 'Georgia, serif' }}>Change Password</h4>
        {settingsError && (
          <div style={{ padding: '0.75rem', backgroundColor: 'var(--status-danger-bg)', color: 'var(--status-danger-text)', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem' }}>
            {settingsError}
          </div>
        )}
        {settingsSuccess && (
          <div style={{ padding: '0.75rem', backgroundColor: 'var(--status-success-bg)', color: 'var(--status-success-text)', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem' }}>
            {settingsSuccess}
          </div>
        )}
        <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Current Password</label>
            <input type="password" required className="input-field" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>New Password</label>
            <input type="password" required className="input-field" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Confirm New Password</label>
            <input type="password" required className="input-field" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <button type="button" className="btn-secondary" onClick={() => setIsSettingsOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary">Update Password</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default MainLayout;
