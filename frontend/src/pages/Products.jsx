import React, { useState, useEffect } from 'react';
import * as catalogService from '../services/catalogService';
import Modal from '../components/ui/Modal';
import { Edit2, Ban, ArrowRightLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useLocation } from 'react-router-dom';

const Products = () => {
  const { user } = useAuth();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialLowStock = queryParams.get('filter') === 'low_stock';
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showLowStockOnly, setShowLowStockOnly] = useState(initialLowStock);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '', sku: '', category: 'Electronics', unit_price: '', min_stock_alert: '', location: 'Bin A'
  });
  
  const toast = useToast();
  const [errors, setErrors] = useState({});

  // Stock Adjust State
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustData, setAdjustData] = useState({
    adjustment_type: 'ADD', quantity: 1, reason: ''
  });

  const fetchProducts = async () => {
    try {
      const res = await catalogService.getProducts();
      if (res.data.success) {
        setProducts(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const openModal = (product = null) => {
    if (product) {
      setCurrentProduct(product);
      setFormData({
        name: product.name,
        sku: product.sku,
        category: product.category,
        unit_price: product.unit_price,
        min_stock_alert: product.min_stock_alert,
        location: product.location
      });
    } else {
      setCurrentProduct(null);
      setFormData({ name: '', sku: '', category: 'Electronics', unit_price: '', min_stock_alert: '', location: 'Bin A' });
    }
    setErrors({});
    setIsModalOpen(true);
  };

  const validateProductForm = () => {
    const isNameValid = formData.name.trim() !== '';
    const isSkuValid = formData.sku.trim() !== '';
    const isPriceValid = formData.unit_price !== '';
    const isAlertValid = formData.min_stock_alert !== '';
    
    setErrors({
      name: !isNameValid ? 'Product name is required' : '',
      sku: !isSkuValid ? 'SKU is required' : '',
      unit_price: !isPriceValid ? 'Unit price is required' : '',
      min_stock_alert: !isAlertValid ? 'Alert threshold is required' : ''
    });

    return isNameValid && isSkuValid && isPriceValid && isAlertValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateProductForm()) {
      toast.error('Validation Error', 'Check the highlighted fields');
      return;
    }
    
    try {
      if (currentProduct) {
        await catalogService.updateProduct(currentProduct.id, formData);
        toast.success('Product Updated', `${formData.name} was updated successfully.`);
      } else {
        await catalogService.createProduct(formData);
        toast.success('Product Created', `${formData.name} was added to catalog.`);
      }
      setIsModalOpen(false);
      fetchProducts();
    } catch (err) {
      toast.error('Operation Failed', err.response?.data?.message || 'Failed to save product');
    }
  };

  const openAdjustModal = (product) => {
    setCurrentProduct(product);
    setAdjustData({ adjustment_type: 'ADD', quantity: 1, reason: '' });
    setErrors({});
    setIsAdjustModalOpen(true);
  };

  const validateAdjustForm = () => {
    const isQuantityValid = adjustData.quantity !== '' && parseInt(adjustData.quantity, 10) >= 0;
    const isReasonValid = adjustData.reason.trim() !== '';

    setErrors({
      quantity: !isQuantityValid ? 'Valid quantity is required' : '',
      reason: !isReasonValid ? 'Reason is required' : ''
    });

    return isQuantityValid && isReasonValid;
  };

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    if (!validateAdjustForm()) {
      toast.error('Validation Error', 'Check the highlighted fields');
      return;
    }

    try {
      await catalogService.adjustStock(currentProduct.id, {
        adjustment_type: adjustData.adjustment_type,
        quantity: parseInt(adjustData.quantity, 10),
        reason: adjustData.reason
      });
      toast.success('Stock Adjusted', `Inventory for ${currentProduct.name} updated.`);
      setIsAdjustModalOpen(false);
      fetchProducts();
    } catch (err) {
      toast.error('Adjustment Failed', err.response?.data?.message || 'Failed to adjust stock');
    }
  };

  const toggleStatus = async (id, isActive) => {
    try {
      if (isActive) {
        await catalogService.deactivateProduct(id);
        toast.warning('Product Deactivated', 'The product is now inactive.');
      } else {
        toast.error('Not Supported', 'Reactivation not supported in this demo.');
        return;
      }
      fetchProducts();
    } catch (err) {
      toast.error('Status Error', 'Failed to update status');
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStock = showLowStockOnly ? p.current_stock <= p.min_stock_alert : true;
    return matchesSearch && matchesStock;
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1>Inventory Catalog</h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button 
            className="btn-secondary"
            onClick={() => setShowLowStockOnly(!showLowStockOnly)}
            style={{ 
              backgroundColor: showLowStockOnly ? 'var(--status-danger-bg)' : 'transparent',
              color: showLowStockOnly ? 'var(--status-danger-text)' : 'var(--text-header)',
              border: showLowStockOnly ? '1px solid var(--status-danger-text)' : '1px solid var(--border-color)',
              display: 'flex', alignItems: 'center', gap: '0.5rem'
            }}
          >
            ⚠️ Low Stock Only
          </button>
          <input 
            type="search" 
            placeholder="🔍 Search Name or SKU..." 
            className="input-field" 
            style={{ width: '400px' }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {(user?.role === 'Admin' || user?.role === 'Warehouse') && (
            <button className="btn-primary" onClick={() => openModal()}>+ Add Product</button>
          )}
        </div>
      </div>
      
      <div style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>
        Showing {filteredProducts.length} record(s)
      </div>

      <div className="table-container">
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Product Name</th>
                <th>SKU</th>
                <th>Category</th>
                <th>Unit Price</th>
                <th>Stock On Hand</th>
                {(user?.role === 'Admin' || user?.role === 'Warehouse') && <th>Location</th>}
                {(user?.role === 'Admin' || user?.role === 'Warehouse') && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map(p => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 500 }}>{p.name}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{p.sku}</td>
                  <td>{p.category}</td>
                  <td>₹{parseFloat(p.unit_price).toFixed(2)}</td>
                  <td>
                    {p.current_stock <= p.min_stock_alert ? (
                      <span style={{ color: 'var(--status-danger-text)', fontWeight: 600 }}>
                        {p.current_stock} units <span className="badge danger" style={{ marginLeft: '0.25rem', fontSize: '0.7rem' }}>⚠️ Low</span>
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-header)' }}>{p.current_stock} units</span>
                    )}
                  </td>
                  {(user?.role === 'Admin' || user?.role === 'Warehouse') && (
                    <td>{p.location || '—'}</td>
                  )}
                  {(user?.role === 'Admin' || user?.role === 'Warehouse') && (
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <>
                          {p.is_active && (
                            <button onClick={() => openAdjustModal(p)} style={{ background: 'none', border: 'none', color: 'var(--status-warning-text)', cursor: 'pointer', padding: '0.25rem' }} title="Adjust Stock">
                              <ArrowRightLeft size={18} />
                            </button>
                          )}
                          <button onClick={() => openModal(p)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem' }} title="Edit Product">
                            <Edit2 size={18} />
                          </button>
                          {p.is_active && (
                            <button onClick={() => toggleStatus(p.id, p.is_active)} style={{ background: 'none', border: 'none', color: 'var(--status-danger-text)', cursor: 'pointer', padding: '0.25rem' }} title="Deactivate">
                              <Ban size={18} />
                            </button>
                          )}
                        </>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={(user?.role === 'Admin' || user?.role === 'Warehouse') ? 7 : 5} style={{ textAlign: 'center' }}>
                    No products found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={currentProduct ? "Edit Product" : "New Product"}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }} noValidate>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Product Name</label>
            <input 
              type="text" 
              className={`input-field ${errors.name ? 'has-error' : ''}`} 
              value={formData.name} 
              onChange={e => {
                setFormData({...formData, name: e.target.value});
                if (errors.name) setErrors({...errors, name: ''});
              }} 
              onBlur={() => {
                if (!formData.name.trim()) setErrors(prev => ({...prev, name: 'Product name is required'}));
              }}
            />
            <div className={`field-error-container ${errors.name ? 'show' : ''}`}>
              <div className="field-error-text">{errors.name}</div>
            </div>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>SKU</label>
            <input 
              type="text" 
              className={`input-field ${errors.sku ? 'has-error' : ''}`} 
              value={formData.sku} 
              onChange={e => {
                setFormData({...formData, sku: e.target.value});
                if (errors.sku) setErrors({...errors, sku: ''});
              }}
              onBlur={() => {
                if (!formData.sku.trim()) setErrors(prev => ({...prev, sku: 'SKU is required'}));
              }}
            />
            <div className={`field-error-container ${errors.sku ? 'show' : ''}`}>
              <div className="field-error-text">{errors.sku}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Unit Price (₹)</label>
              <input 
                type="number" 
                className={`input-field ${errors.unit_price ? 'has-error' : ''}`} 
                value={formData.unit_price} 
                onChange={e => {
                  setFormData({...formData, unit_price: e.target.value});
                  if (errors.unit_price) setErrors({...errors, unit_price: ''});
                }}
                onBlur={() => {
                  if (formData.unit_price === '') setErrors(prev => ({...prev, unit_price: 'Unit price is required'}));
                }}
              />
              <div className={`field-error-container ${errors.unit_price ? 'show' : ''}`}>
                <div className="field-error-text">{errors.unit_price}</div>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Min Alert Threshold</label>
              <input 
                type="number" 
                className={`input-field ${errors.min_stock_alert ? 'has-error' : ''}`} 
                value={formData.min_stock_alert} 
                onChange={e => {
                  setFormData({...formData, min_stock_alert: e.target.value});
                  if (errors.min_stock_alert) setErrors({...errors, min_stock_alert: ''});
                }}
                onBlur={() => {
                  if (formData.min_stock_alert === '') setErrors(prev => ({...prev, min_stock_alert: 'Alert threshold is required'}));
                }}
              />
              <div className={`field-error-container ${errors.min_stock_alert ? 'show' : ''}`}>
                <div className="field-error-text">{errors.min_stock_alert}</div>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary">Save Product</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isAdjustModalOpen} onClose={() => setIsAdjustModalOpen(false)} title="Manual Stock Adjustment">
        {currentProduct && (
          <div style={{ padding: '1rem', backgroundColor: 'var(--bg-main)', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid var(--border-color)' }}>
            <h3 style={{ margin: 0, color: 'var(--text-header)' }}>{currentProduct.name}</h3>
            <p style={{ margin: '0.25rem 0', color: 'var(--text-muted)' }}>SKU: {currentProduct.sku}</p>
            <div style={{ marginTop: '0.5rem', fontSize: '1.1rem' }}>
              Current Stock: <strong>{currentProduct.current_stock}</strong> units
            </div>
          </div>
        )}
        <form onSubmit={handleAdjustSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }} noValidate>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 2 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Adjustment Type</label>
              <select className="input-field" value={adjustData.adjustment_type} onChange={e => setAdjustData({...adjustData, adjustment_type: e.target.value})}>
                <option value="ADD">Add Stock [+]</option>
                <option value="REMOVE">Remove Stock [-]</option>
                <option value="SET">Physical Audit Reset [=]</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Quantity</label>
              <input 
                type="number" 
                className={`input-field ${errors.quantity ? 'has-error' : ''}`} 
                value={adjustData.quantity} 
                onChange={e => {
                  setAdjustData({...adjustData, quantity: e.target.value});
                  if (errors.quantity) setErrors({...errors, quantity: ''});
                }}
                onBlur={() => {
                  if (adjustData.quantity === '') setErrors(prev => ({...prev, quantity: 'Quantity is required'}));
                }}
              />
              <div className={`field-error-container ${errors.quantity ? 'show' : ''}`}>
                <div className="field-error-text">{errors.quantity}</div>
              </div>
            </div>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Reason / Reference</label>
            <input 
              type="text" 
              className={`input-field ${errors.reason ? 'has-error' : ''}`} 
              value={adjustData.reason} 
              onChange={e => {
                setAdjustData({...adjustData, reason: e.target.value});
                if (errors.reason) setErrors({...errors, reason: ''});
              }}
              onBlur={() => {
                if (!adjustData.reason.trim()) setErrors(prev => ({...prev, reason: 'Reason is required'}));
              }}
              placeholder="e.g. Damaged goods written off" 
            />
            <div className={`field-error-container ${errors.reason ? 'show' : ''}`}>
              <div className="field-error-text">{errors.reason}</div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <button type="button" className="btn-secondary" onClick={() => setIsAdjustModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary">Apply Adjustment</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Products;
