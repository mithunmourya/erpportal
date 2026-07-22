import React, { useState, useEffect } from 'react';
import * as crmService from '../services/crmService';
import Modal from '../components/ui/Modal';
import { Edit2, Ban, Eye, Calendar, User, MessageCircle } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '', mobile: '', email: '', business_name: '', customer_type: 'Retail', address: '', status: 'Lead', follow_up_date: ''
  });
  
  const toast = useToast();
  const [errors, setErrors] = useState({});

  // Follow-up state
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [followUpNote, setFollowUpNote] = useState('');
  const [nextFollowUpDate, setNextFollowUpDate] = useState('');
  const [followUpsFeed, setFollowUpsFeed] = useState([]);

  const fetchCustomers = async () => {
    try {
      const res = await crmService.getCustomers();
      if (res.data.success) {
        setCustomers(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch customers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const openModal = (customer = null) => {
    if (customer) {
      setCurrentCustomer(customer);
      setFormData({
        name: customer.name,
        mobile: customer.mobile,
        email: customer.email,
        business_name: customer.business_name,
        customer_type: customer.customer_type,
        address: customer.address,
        status: customer.status,
        follow_up_date: customer.follow_up_date ? new Date(customer.follow_up_date).toISOString().split('T')[0] : ''
      });
    } else {
      setCurrentCustomer(null);
      setFormData({ name: '', mobile: '', email: '', business_name: '', customer_type: 'Retail', address: '', status: 'Lead', follow_up_date: '' });
    }
    setErrors({});
    setIsModalOpen(true);
  };

  const validateCustomerForm = () => {
    const isNameValid = formData.name.trim() !== '';
    const isMobileValid = formData.mobile.trim() !== '';
    const isEmailValid = formData.email.trim() !== '' && /\S+@\S+\.\S+/.test(formData.email);
    const isBusinessValid = formData.business_name.trim() !== '';
    const isAddressValid = formData.address.trim() !== '';

    setErrors({
      name: !isNameValid ? 'Contact name is required' : '',
      mobile: !isMobileValid ? 'Mobile number is required' : '',
      email: !isEmailValid ? 'Valid email is required' : '',
      business_name: !isBusinessValid ? 'Business name is required' : '',
      address: !isAddressValid ? 'Address is required' : ''
    });

    return isNameValid && isMobileValid && isEmailValid && isBusinessValid && isAddressValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateCustomerForm()) {
      toast.error('Validation Error', 'Check the highlighted fields');
      return;
    }

    try {
      if (currentCustomer) {
        await crmService.updateCustomer(currentCustomer.id, formData);
        toast.success('Customer Updated', `${formData.business_name} was updated.`);
      } else {
        await crmService.createCustomer(formData);
        toast.success('Customer Created', `${formData.business_name} was added.`);
      }
      setIsModalOpen(false);
      fetchCustomers();
    } catch (err) {
      toast.error('Operation Failed', err.response?.data?.message || 'Failed to save customer');
    }
  };

  const deactivateCustomer = async (id) => {
    if (!window.confirm("Are you sure you want to deactivate this customer?")) return;
    try {
      await crmService.deactivateCustomer(id);
      toast.warning('Customer Deactivated', 'The customer is now inactive.');
      fetchCustomers();
    } catch (err) {
      toast.error('Status Error', 'Failed to deactivate customer');
    }
  };

  const openFollowUpModal = async (customer) => {
    try {
      const res = await crmService.getCustomerById(customer.id);
      if (res.data.success) {
        setCurrentCustomer(res.data.data);
        setFollowUpsFeed(res.data.data.follow_ups || []);
      }
      setFollowUpNote('');
      setNextFollowUpDate('');
      setErrors({});
      setIsFollowUpModalOpen(true);
    } catch (err) {
      toast.error('Loading Error', "Failed to load customer details");
    }
  };

  const validateFollowUpForm = () => {
    const isNoteValid = followUpNote.trim() !== '';
    setErrors({ note: !isNoteValid ? 'Follow-up note is required' : '' });
    return isNoteValid;
  };

  const handleFollowUpSubmit = async (e) => {
    e.preventDefault();
    if (!validateFollowUpForm()) {
      toast.error('Validation Error', 'Check the highlighted fields');
      return;
    }

    try {
      await crmService.addFollowUp(currentCustomer.id, followUpNote, nextFollowUpDate || null);

      
      // Refresh the timeline instantly
      const res = await crmService.getCustomerById(currentCustomer.id);
      if (res.data.success) {
        setFollowUpsFeed(res.data.data.follow_ups || []);
        setCurrentCustomer(res.data.data);
      }
      
      setFollowUpNote('');
      setNextFollowUpDate('');
      fetchCustomers(); // Refresh background table for next date
      toast.success('Follow-up Logged', 'Your note has been saved.');
    } catch (err) {
      toast.error('Logging Failed', err.response?.data?.message || 'Failed to log follow-up');
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.business_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.mobile.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1>Customers CRM</h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <input 
            type="search" 
            placeholder="🔍 Search Business, Name, or Mobile..." 
            className="input-field" 
            style={{ width: '400px' }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button className="btn-primary" onClick={() => openModal()}>+ Add Customer</button>
        </div>
      </div>
      
      <div style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>
        Showing {filteredCustomers.length} record(s)
      </div>

      <div className="table-container">
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Business Name</th>
                <th>Phone</th>
                <th>Type</th>
                <th>Status</th>
                <th>Next Follow-up</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map(c => (
                <tr key={c.id}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{c.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{c.email}</div>
                  </td>
                  <td style={{ fontWeight: 500 }}>{c.business_name}</td>
                  <td>{c.mobile}</td>
                  <td>
                    <span className="badge" style={{ backgroundColor: 'var(--border-color)' }}>{c.customer_type.toUpperCase()}</span>
                  </td>
                  <td>
                    {!c.is_active ? (
                      <span className="badge" style={{ backgroundColor: 'var(--border-color)', color: 'var(--text-muted)' }}>INACTIVE</span>
                    ) : c.status === 'Active' ? (
                      <span className="badge success">ACTIVE</span>
                    ) : (
                      <span className="badge warning">LEAD</span>
                    )}
                  </td>
                  <td style={{ color: 'var(--text-muted)' }}>
                    {c.follow_up_date ? new Date(c.follow_up_date).toLocaleDateString() : '—'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button onClick={() => openFollowUpModal(c)} style={{ background: 'none', border: 'none', color: 'var(--primary-accent)', cursor: 'pointer', padding: '0.25rem' }} title="Notes">
                        <Eye size={18} />
                      </button>
                      <button onClick={() => openModal(c)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem' }} title="Edit">
                        <Edit2 size={18} />
                      </button>
                      {c.is_active && (
                        <button onClick={() => deactivateCustomer(c.id)} style={{ background: 'none', border: 'none', color: 'var(--status-danger-text)', cursor: 'pointer', padding: '0.25rem' }} title="Deactivate">
                          <Ban size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredCustomers.length === 0 && (
                <tr><td colSpan="7" style={{ textAlign: 'center' }}>No customers found</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={currentCustomer ? "Edit Customer" : "New Customer"}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }} noValidate>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Contact Name</label>
              <input 
                type="text" 
                className={`input-field ${errors.name ? 'has-error' : ''}`} 
                value={formData.name} 
                onChange={e => {
                  setFormData({...formData, name: e.target.value});
                  if (errors.name) setErrors({...errors, name: ''});
                }}
                onBlur={() => {
                  if (!formData.name.trim()) setErrors(prev => ({...prev, name: 'Contact name is required'}));
                }}
              />
              <div className={`field-error-container ${errors.name ? 'show' : ''}`}>
                <div className="field-error-text">{errors.name}</div>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Business Name</label>
              <input 
                type="text" 
                className={`input-field ${errors.business_name ? 'has-error' : ''}`} 
                value={formData.business_name} 
                onChange={e => {
                  setFormData({...formData, business_name: e.target.value});
                  if (errors.business_name) setErrors({...errors, business_name: ''});
                }}
                onBlur={() => {
                  if (!formData.business_name.trim()) setErrors(prev => ({...prev, business_name: 'Business name is required'}));
                }}
              />
              <div className={`field-error-container ${errors.business_name ? 'show' : ''}`}>
                <div className="field-error-text">{errors.business_name}</div>
              </div>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Mobile</label>
              <input 
                type="text" 
                className={`input-field ${errors.mobile ? 'has-error' : ''}`} 
                value={formData.mobile} 
                onChange={e => {
                  setFormData({...formData, mobile: e.target.value});
                  if (errors.mobile) setErrors({...errors, mobile: ''});
                }}
                onBlur={() => {
                  if (!formData.mobile.trim()) setErrors(prev => ({...prev, mobile: 'Mobile number is required'}));
                }}
              />
              <div className={`field-error-container ${errors.mobile ? 'show' : ''}`}>
                <div className="field-error-text">{errors.mobile}</div>
              </div>
            </div>
            <div style={{ flex: 1 }}>
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
              />
              <div className={`field-error-container ${errors.email ? 'show' : ''}`}>
                <div className="field-error-text">{errors.email}</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Customer Type</label>
              <select className="input-field" value={formData.customer_type} onChange={e => setFormData({...formData, customer_type: e.target.value})}>
                <option value="Retail">Retail</option>
                <option value="Wholesale">Wholesale</option>
                <option value="Distributor">Distributor</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Status</label>
              <select className="input-field" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                <option value="Lead">Lead</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Address</label>
              <input 
                type="text" 
                className={`input-field ${errors.address ? 'has-error' : ''}`} 
                value={formData.address} 
                onChange={e => {
                  setFormData({...formData, address: e.target.value});
                  if (errors.address) setErrors({...errors, address: ''});
                }}
                onBlur={() => {
                  if (!formData.address.trim()) setErrors(prev => ({...prev, address: 'Address is required'}));
                }}
              />
              <div className={`field-error-container ${errors.address ? 'show' : ''}`}>
                <div className="field-error-text">{errors.address}</div>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>GST Number</label>
              <input type="text" className="input-field" value={formData.gst_number || ''} onChange={e => setFormData({...formData, gst_number: e.target.value})} />
            </div>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary">Save Customer</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isFollowUpModalOpen} onClose={() => setIsFollowUpModalOpen(false)} title={`Follow-up Timeline`}>
        {currentCustomer && (
          <div style={{ padding: '1rem', backgroundColor: 'var(--bg-main)', borderRadius: '8px', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0, color: 'var(--text-header)' }}>{currentCustomer.business_name}</h3>
            <p style={{ margin: '0.25rem 0', color: 'var(--text-muted)' }}>{currentCustomer.name} | {currentCustomer.mobile}</p>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <span className="badge" style={{ backgroundColor: 'var(--border-color)' }}>{currentCustomer.customer_type}</span>
              <span className={`badge ${currentCustomer.status === 'Active' ? 'success' : 'warning'}`}>{currentCustomer.status}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleFollowUpSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem', paddingBottom: '2rem', borderBottom: '1px solid var(--border-color)' }} noValidate>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Record customer response, requirement, or call outcome...</label>
            <textarea 
              className={`input-field ${errors.note ? 'has-error' : ''}`} 
              rows="3" 
              value={followUpNote} 
              onChange={e => {
                setFollowUpNote(e.target.value);
                if (errors.note) setErrors({...errors, note: ''});
              }}
              onBlur={() => {
                if (!followUpNote.trim()) setErrors(prev => ({...prev, note: 'Follow-up note is required'}));
              }}
              placeholder="E.g., Customer requested a new catalog..."
            />
            <div className={`field-error-container ${errors.note ? 'show' : ''}`}>
              <div className="field-error-text">{errors.note}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Next Date (Optional)</label>
              <input 
                type="date" 
                className="input-field" 
                value={nextFollowUpDate} 
                onChange={e => setNextFollowUpDate(e.target.value)} 
              />
            </div>
            <button type="submit" className="btn-primary" style={{ marginTop: '1.75rem' }}>Add Note</button>
          </div>
        </form>

        <div>
          <h4 style={{ marginBottom: '1rem' }}>Interaction History</h4>
          {followUpsFeed.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No follow-up notes yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {followUpsFeed.slice().reverse().map(f => (
                <div key={f.id} style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ color: 'var(--primary-accent)', paddingTop: '0.25rem' }}><MessageCircle size={20} /></div>
                  <div style={{ flex: 1, backgroundColor: 'var(--bg-main)', padding: '1rem', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{f.created_by_name || 'User'}</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(f.created_at).toLocaleString()}</span>
                    </div>
                    <p style={{ color: 'var(--text-header)', fontSize: '0.95rem', margin: 0 }}>{f.note}</p>
                    {/* To highlight next date, since we didn't store next_date per note in DB explicitly except on Customer, 
                        we can't perfectly retrospect historical next dates unless they are in the note. 
                        Wait, we don't have next_date in customer_followups table. I'll just show the note. */}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default Customers;
