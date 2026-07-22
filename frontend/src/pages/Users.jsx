import React, { useState, useEffect } from 'react';
import * as userService from '../services/userService';
import Modal from '../components/ui/Modal';
import { Edit2, Ban, Key } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', role: 'Sales'
  });
  
  const toast = useToast();
  const [errors, setErrors] = useState({});

  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetUser, setResetUser] = useState(null);
  const [resetPasswordValue, setResetPasswordValue] = useState('');

  const fetchUsers = async () => {
    try {
      const res = await userService.getUsers();
      if (res.data.success) {
        setUsers(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openModal = (u = null) => {
    if (u) {
      setCurrentUser(u);
      setFormData({
        name: u.name,
        email: u.email,
        password: '', // Leave empty for edit unless they want to change it
        role: u.role
      });
    } else {
      setCurrentUser(null);
      setFormData({ name: '', email: '', password: '', role: 'Sales' });
    }
    setErrors({});
    setIsModalOpen(true);
  };

  const validateUserForm = () => {
    const isNameValid = formData.name.trim() !== '';
    const isEmailValid = formData.email.trim() !== '' && /\S+@\S+\.\S+/.test(formData.email);
    const isPasswordValid = currentUser || formData.password.length >= 6;

    setErrors({
      name: !isNameValid ? 'Name is required' : '',
      email: !isEmailValid ? 'Valid email is required' : '',
      password: !isPasswordValid ? 'Password must be at least 6 characters' : ''
    });

    return isNameValid && isEmailValid && isPasswordValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateUserForm()) {
      toast.error('Validation Error', 'Check the highlighted fields');
      return;
    }

    try {
      if (currentUser) {
        const updateData = { name: formData.name, role: formData.role };
        await userService.updateUser(currentUser.id, updateData);
        toast.success('User Updated', `${formData.name} was updated.`);
      } else {
        await userService.createUser(formData);
        toast.success('User Created', `${formData.name} was added.`);
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (err) {
      toast.error('Operation Failed', err.response?.data?.message || 'Failed to save user');
    }
  };

  const deactivateUser = async (id) => {
    try {
      await userService.deactivateUser(id);
      toast.warning('Access Revoked', 'The user is now deactivated.');
      fetchUsers();
    } catch (err) {
      toast.error('Status Error', 'Failed to deactivate user');
    }
  };

  const openResetModal = (u) => {
    setResetUser(u);
    setResetPasswordValue('');
    setErrors({});
    setIsResetModalOpen(true);
  };

  const validateResetForm = () => {
    const isValid = resetPasswordValue.length >= 6;
    setErrors({ resetPassword: !isValid ? 'Password must be at least 6 characters' : '' });
    return isValid;
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!validateResetForm()) {
      toast.error('Validation Error', 'Check the highlighted fields');
      return;
    }

    try {
      await userService.resetPassword(resetUser.id, { newPassword: resetPasswordValue });
      toast.success('Password Reset', `Password for ${resetUser.name} reset successfully!`);
      setResetPasswordValue('');
      setTimeout(() => setIsResetModalOpen(false), 800);
    } catch (err) {
      toast.error('Operation Failed', err.response?.data?.message || 'Failed to reset password');
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1>System Users</h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <input 
            type="search" 
            placeholder="🔍 Search Name, Email, or Role..." 
            className="input-field" 
            style={{ width: '400px' }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button className="btn-primary" onClick={() => openModal()}>+ New Employee</button>
        </div>
      </div>

      <div className="table-container">
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(u => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td><span className="badge" style={{ backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-color)' }}>{u.role}</span></td>
                  <td>
                    {u.is_active ? (
                      <span className="badge success">Active</span>
                    ) : (
                      <span className="badge" style={{ backgroundColor: 'var(--border-color)', color: 'var(--text-muted)' }}>Revoked</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => openModal(u)} style={{ background: 'none', border: 'none', color: 'var(--primary-accent)', cursor: 'pointer' }} title="Edit User">
                        <Edit2 size={18} />
                      </button>
                      <button onClick={() => openResetModal(u)} style={{ background: 'none', border: 'none', color: 'var(--status-warning-text)', cursor: 'pointer' }} title="Reset Password">
                        <Key size={18} />
                      </button>
                      {u.is_active && u.email !== 'admin@erp.com' && (
                        <button onClick={() => deactivateUser(u.id)} style={{ background: 'none', border: 'none', color: 'var(--status-danger-text)', cursor: 'pointer' }} title="Revoke Access">
                          <Ban size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr><td colSpan="5" style={{ textAlign: 'center' }}>No users found</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={currentUser ? "Edit Employee" : "New Employee"}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }} noValidate>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Name</label>
            <input 
              type="text" 
              className={`input-field ${errors.name ? 'has-error' : ''}`} 
              value={formData.name} 
              onChange={e => {
                setFormData({...formData, name: e.target.value});
                if (errors.name) setErrors({...errors, name: ''});
              }}
              onBlur={() => {
                if (!formData.name.trim()) setErrors(prev => ({...prev, name: 'Name is required'}));
              }}
            />
            <div className={`field-error-container ${errors.name ? 'show' : ''}`}>
              <div className="field-error-text">{errors.name}</div>
            </div>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Email</label>
            <input 
              type="email" 
              className={`input-field ${errors.email ? 'has-error' : ''}`} 
              value={formData.email} 
              onChange={e => {
                setFormData({...formData, email: e.target.value});
                if (errors.email) setErrors({...errors, email: ''});
              }}
              onBlur={() => {
                if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) {
                  setErrors(prev => ({...prev, email: 'Valid email is required'}));
                }
              }}
              disabled={!!currentUser} 
            />
            <div className={`field-error-container ${errors.email ? 'show' : ''}`}>
              <div className="field-error-text">{errors.email}</div>
            </div>
          </div>
          {!currentUser && (
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Password</label>
              <input 
                type="password" 
                className={`input-field ${errors.password ? 'has-error' : ''}`} 
                value={formData.password} 
                onChange={e => {
                  setFormData({...formData, password: e.target.value});
                  if (errors.password) setErrors({...errors, password: ''});
                }}
                onBlur={() => {
                  if (formData.password.length < 6) {
                    setErrors(prev => ({...prev, password: 'Password must be at least 6 characters'}));
                  }
                }}
              />
              <div className={`field-error-container ${errors.password ? 'show' : ''}`}>
                <div className="field-error-text">{errors.password}</div>
              </div>
            </div>
          )}
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Role</label>
            <select className="input-field" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
              <option value="Admin">Admin</option>
              <option value="Sales">Sales</option>
              <option value="Warehouse">Warehouse</option>
              <option value="Accounts">Accounts</option>
            </select>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary">Save Employee</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isResetModalOpen} onClose={() => setIsResetModalOpen(false)} title={`Reset Password for ${resetUser?.name}`}>
        <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }} noValidate>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Force New Password</label>
            <input 
              type="password" 
              className={`input-field ${errors.resetPassword ? 'has-error' : ''}`} 
              value={resetPasswordValue} 
              onChange={e => {
                setResetPasswordValue(e.target.value);
                if (errors.resetPassword) setErrors({...errors, resetPassword: ''});
              }}
              onBlur={() => {
                if (resetPasswordValue.length < 6) {
                  setErrors(prev => ({...prev, resetPassword: 'Password must be at least 6 characters'}));
                }
              }}
            />
            <div className={`field-error-container ${errors.resetPassword ? 'show' : ''}`}>
              <div className="field-error-text">{errors.resetPassword}</div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <button type="button" className="btn-secondary" onClick={() => setIsResetModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary" style={{ backgroundColor: 'var(--status-warning-text)' }}>Reset Password</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Users;
