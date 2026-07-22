import React, { useState, useEffect } from 'react';
import * as challanService from '../services/challanService';
import * as crmService from '../services/crmService';
import * as catalogService from '../services/catalogService';
import Modal from '../components/ui/Modal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Plus, Trash2, CheckCircle, FileText, Printer, Edit2 } from 'lucide-react';

const SalesChallans = () => {
  const { user } = useAuth();
  const [challans, setChallans] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [productSearchQuery, setProductSearchQuery] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentChallan, setCurrentChallan] = useState(null);
  const toast = useToast();
  const [errors, setErrors] = useState({});
  
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [invoiceChallan, setInvoiceChallan] = useState(null);
  
  // Dynamic Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [lineItems, setLineItems] = useState([
    { product_id: '', quantity: 1 }
  ]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [chRes, custRes, prodRes] = await Promise.all([
        challanService.getChallans(),
        crmService.getCustomers(),
        catalogService.getProducts()
      ]);
      if (chRes.data.success) setChallans(chRes.data.data);
      if (custRes.data.success) setCustomers(custRes.data.data.filter(c => c.is_active));
      if (prodRes.data.success) setProducts(prodRes.data.data.filter(p => p.is_active));
    } catch (err) {
      console.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openModal = async (challan = null) => {
    if (challan) {
      try {
        const res = await challanService.getChallanById(challan.id);
        const fullChallan = res.data.data;
        setCurrentChallan(fullChallan);
        setSelectedCustomerId(fullChallan.customer_id);
        const existingItems = fullChallan.items && fullChallan.items.length > 0 
          ? fullChallan.items.map(i => ({ product_id: i.product_id, quantity: i.quantity }))
          : [{ product_id: '', quantity: 1 }];
        setLineItems(existingItems);
      } catch (err) {
        toast.error('Load Error', "Failed to load draft details");
        return;
      }
    } else {
      setCurrentChallan(null);
      setSelectedCustomerId('');
      setLineItems([{ product_id: '', quantity: 1 }]);
    }
    setProductSearchQuery('');
    setErrors({});
    setIsModalOpen(true);
  };

  const openInvoiceModal = async (challan) => {
    try {
      const res = await challanService.getChallanById(challan.id);
      setInvoiceChallan(res.data.data);
      setIsInvoiceModalOpen(true);
    } catch (err) {
      toast.error('Load Error', "Failed to load invoice details");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleAddLine = () => {
    setLineItems([...lineItems, { product_id: '', quantity: 1 }]);
  };

  const handleRemoveLine = (index) => {
    const updated = [...lineItems];
    updated.splice(index, 1);
    setLineItems(updated.length > 0 ? updated : [{ product_id: '', quantity: 1 }]);
  };

  const handleLineChange = (index, field, value) => {
    const updated = [...lineItems];
    updated[index][field] = value;
    setLineItems(updated);
  };

  const calculateTotal = () => {
    return lineItems.reduce((acc, item) => {
      const product = products.find(p => p.id.toString() === item.product_id.toString());
      const price = product ? product.unit_price : 0;
      return acc + (price * (item.quantity || 0));
    }, 0);
  };

  const validateChallanForm = () => {
    let isValid = true;
    let newErrors = {};

    if (!selectedCustomerId) {
      newErrors.customerId = 'Customer is required';
      isValid = false;
    }

    const validItems = lineItems.filter(item => item.product_id && item.quantity > 0);
    if (validItems.length === 0) {
      toast.warning('Empty Order', 'Add at least one valid product');
      isValid = false;
    }

    // Stock check
    let hasStockError = false;
    lineItems.forEach((item, index) => {
      if (!item.product_id) return;
      const p = products.find(prod => prod.id.toString() === item.product_id?.toString());
      if (p) {
        const totalReq = lineItems.filter(i => i.product_id === item.product_id).reduce((sum, i) => sum + parseInt(i.quantity || 0), 0);
        if (totalReq > p.current_stock) {
           hasStockError = true;
           isValid = false;
        }
      }
    });

    if (hasStockError) {
      toast.error('Stock Error', 'Cannot submit order due to insufficient stock');
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e, forceStatus) => {
    e.preventDefault();
    
    if (!validateChallanForm()) {
      if (!selectedCustomerId) toast.error('Validation Error', 'Check the highlighted fields');
      return;
    }
    
    const validItems = lineItems.filter(item => item.product_id && item.quantity > 0);

    try {
      const payload = {
        customer_id: selectedCustomerId,
        status: forceStatus,
        items: validItems.map(item => ({
          product_id: parseInt(item.product_id),
          quantity: parseInt(item.quantity)
        }))
      };

      if (currentChallan) {
        await challanService.updateChallan(currentChallan.id, payload);
        toast.success('Draft Updated', 'Challan draft saved.');
      } else {
        await challanService.createDraftChallan(payload);
        toast.success('Draft Created', 'New challan draft saved.');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error('Operation Failed', err.response?.data?.message || 'Failed to save Challan');
    }
  };

  const handleConfirm = async (id) => {
    if (!window.confirm("Are you sure you want to confirm and dispatch this order? This will instantly deduct stock.")) return;
    try {
      await challanService.confirmChallan(id);
      toast.success('Challan Confirmed', 'The order has been dispatched and stock deducted.');
      fetchData();
    } catch (err) {
      toast.error('Confirmation Failed', err.response?.data?.message || 'Failed to confirm Challan');
    }
  };

  const filteredChallans = challans.filter(c => 
    c.challan_number.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.customer_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredDropdownProducts = products.filter(p => 
    p.name.toLowerCase().includes(productSearchQuery.toLowerCase()) || 
    p.sku.toLowerCase().includes(productSearchQuery.toLowerCase())
  );

  const isSubmitDisabled = lineItems.some(item => {
    const p = products.find(prod => prod.id.toString() === item.product_id?.toString());
    if (!p) return false;
    const totalReq = lineItems.filter(i => i.product_id === item.product_id).reduce((sum, i) => sum + parseInt(i.quantity || 0), 0);
    return totalReq > p.current_stock;
  });

  return (
    <div>
      <style>
        {`
          @media print {
            body * {
              visibility: hidden;
            }
            .print-section, .print-section * {
              visibility: visible;
            }
            .print-section {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              height: 100%;
              background: white;
              color: black;
              padding: 2cm;
            }
            .no-print {
              display: none !important;
            }
            .print-table {
               border-collapse: collapse;
               width: 100%;
            }
            .print-table th, .print-table td {
               border: 1px solid #ddd;
               padding: 8px;
            }
          }
        `}
      </style>

      <div className="no-print">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h1>Sales Challans</h1>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <input 
              type="search" 
              placeholder="🔍 Search Challan No or Customer..." 
              className="input-field" 
              style={{ width: '400px' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {(user?.role === 'Sales' || user?.role === 'Admin') && (
              <button className="btn-primary" onClick={() => openModal()}>+ New Sales Challan</button>
            )}
          </div>
        </div>
        
        <div style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>
          Showing {filteredChallans.length} record(s)
        </div>

        <div className="table-container">
          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>CHALLAN #</th>
                  <th>CUSTOMER BUSINESS</th>
                  <th>TOTAL UNITS</th>
                  <th>STATUS</th>
                  <th>CREATED DATE</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredChallans.map(c => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 500 }}>{c.challan_number}</td>
                    <td>{c.customer_name}</td>
                    <td>{c.total_quantity}</td>
                    <td>
                      {c.status === 'Draft' ? (
                        <span className="badge warning">DRAFT</span>
                      ) : c.status === 'Confirmed' ? (
                        <span className="badge success">CONFIRMED</span>
                      ) : (
                        <span className="badge danger">CANCELLED</span>
                      )}
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>{new Date(c.created_at).toLocaleDateString()}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        {/* Edit logic for Sales/Admin on Drafts */}
                        {(user?.role === 'Sales' || user?.role === 'Admin') && c.status === 'Draft' && (
                          <>
                            <button onClick={() => openModal(c)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem' }} title="Edit Draft">
                              <Edit2 size={18} />
                            </button>
                            <button className="btn-primary" onClick={() => handleConfirm(c.id)} style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', backgroundColor: 'var(--status-success-text)' }} title="Confirm & Dispatch">
                              Confirm
                            </button>
                          </>
                        )}
                        
                        {/* Print logic */}
                        {c.status === 'Confirmed' && (
                          <button onClick={() => openInvoiceModal(c)} style={{ background: 'none', border: 'none', color: 'var(--primary-accent)', cursor: 'pointer', padding: '0.25rem' }} title="View / Print Invoice">
                            <Printer size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredChallans.length === 0 && (
                  <tr><td colSpan="6" style={{ textAlign: 'center' }}>No challans found</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={currentChallan ? `Edit Draft: ${currentChallan.challan_number}` : "Create Sales Challan"}>
          <form style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }} noValidate>
            
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Select Customer</label>
              <select 
                className={`input-field ${errors.customerId ? 'has-error' : ''}`} 
                value={selectedCustomerId} 
                onChange={e => {
                  setSelectedCustomerId(e.target.value);
                  if (errors.customerId) setErrors({...errors, customerId: ''});
                }}
                onBlur={() => {
                  if (!selectedCustomerId) setErrors(prev => ({...prev, customerId: 'Customer is required'}));
                }}
              >
                <option value="">-- Choose Customer --</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.business_name} ({c.name})</option>
                ))}
              </select>
              <div className={`field-error-container ${errors.customerId ? 'show' : ''}`}>
                <div className="field-error-text">{errors.customerId}</div>
              </div>
            </div>

            <div style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h4 style={{ fontSize: '1rem', margin: 0, fontFamily: 'Georgia, serif' }}>Line Items</h4>
                <input 
                  type="search" 
                  placeholder="🔍 Filter Products by Name/SKU..." 
                  className="input-field" 
                  style={{ width: '300px', padding: '0.4rem', fontSize: '0.85rem' }}
                  value={productSearchQuery}
                  onChange={(e) => setProductSearchQuery(e.target.value)}
                />
              </div>
              
              {lineItems.map((item, index) => {
                const aggregatedRequested = lineItems.reduce((acc, curr) => {
                  if (curr.product_id) {
                     acc[curr.product_id] = (acc[curr.product_id] || 0) + parseInt(curr.quantity || 0);
                  }
                  return acc;
                }, {});

                const selectedProduct = products.find(p => p.id.toString() === item.product_id?.toString());
                const hasStockError = selectedProduct && aggregatedRequested[selectedProduct.id] > selectedProduct.current_stock;

                return (
                  <div key={index} style={{ marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <select 
                        className="input-field" 
                        style={{ flex: 2, borderColor: hasStockError ? '#DC2626' : undefined }}
                        value={item.product_id} 
                        onChange={e => handleLineChange(index, 'product_id', e.target.value)}
                        required
                      >
                        <option value="">-- Product --</option>
                        {item.product_id && !filteredDropdownProducts.find(p => p.id.toString() === item.product_id.toString()) && (
                          <option value={item.product_id}>
                            {selectedProduct?.name || 'Unknown'} (Selected)
                          </option>
                        )}
                        {filteredDropdownProducts.map(p => (
                          <option key={p.id} value={p.id} disabled={p.current_stock === 0} style={{ color: p.current_stock === 0 ? 'var(--text-muted)' : 'inherit' }}>
                            {p.name} (₹{p.unit_price}) [Available: {p.current_stock}] {p.current_stock === 0 ? ' [Out of Stock]' : ''}
                          </option>
                        ))}
                      </select>
                      
                      <input 
                        type="number" 
                        className="input-field" 
                        style={{ flex: 1, borderColor: hasStockError ? '#DC2626' : undefined }}
                        placeholder="Qty" 
                        min="1"
                        value={item.quantity} 
                        onChange={e => handleLineChange(index, 'quantity', e.target.value)}
                        required
                      />
                      
                      <button type="button" onClick={() => handleRemoveLine(index)} style={{ background: 'none', border: 'none', color: 'var(--status-danger-text)', cursor: 'pointer', padding: '0.5rem' }}>
                        <Trash2 size={18} />
                      </button>
                    </div>
                    {hasStockError && (
                      <div style={{ color: '#DC2626', fontSize: '0.85rem', marginTop: '0.25rem', marginLeft: '0.25rem' }}>
                        ❌ Insufficient Stock: Only {selectedProduct.current_stock} units available in warehouse.
                      </div>
                    )}
                  </div>
                );
              })}

              <button type="button" onClick={handleAddLine} style={{ background: 'none', border: 'none', color: 'var(--primary-accent)', cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Plus size={16} /> Add Product
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', padding: '1rem', backgroundColor: 'var(--bg-main)', borderRadius: '8px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Estimated Total:</span>
              <span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>₹{calculateTotal().toFixed(2)}</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '0.5rem' }}>
              <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>
                Cancel
              </button>
              <button type="button" className="btn-primary" onClick={(e) => handleSubmit(e, 'Draft')} disabled={isSubmitDisabled}>
                {currentChallan ? 'Update Draft' : 'Save as Draft'}
              </button>
            </div>
          </form>
        </Modal>

        {/* Invoice Modal */}
        <Modal isOpen={isInvoiceModalOpen} onClose={() => setIsInvoiceModalOpen(false)} title="View Invoice">
          {invoiceChallan && (
            <div>
              <div className="print-section" style={{ backgroundColor: 'white', color: 'black', padding: '2rem', borderRadius: '8px' }}>
                
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #eee', paddingBottom: '1rem', marginBottom: '2rem' }}>
                  <div>
                    <h2 style={{ fontFamily: 'Georgia, serif', color: 'black', margin: 0 }}>ABC Distributors Pvt. Ltd.</h2>
                    <p style={{ color: '#555', margin: 0 }}>123 Industrial Area, Phase 1</p>
                    <p style={{ color: '#555', margin: 0 }}>Bengaluru, Karnataka 560001</p>
                    <p style={{ color: '#555', margin: 0 }}>GSTIN: 29ABCDE1234F1Z5</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <h1 style={{ color: '#333', fontSize: '2rem', margin: 0 }}>INVOICE</h1>
                    <p style={{ margin: 0 }}><strong>No:</strong> {invoiceChallan.challan_number}</p>
                    <p style={{ margin: 0 }}><strong>Date:</strong> {new Date(invoiceChallan.created_at).toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Bill To */}
                <div style={{ marginBottom: '2rem' }}>
                  <h4 style={{ color: '#666', marginBottom: '0.5rem' }}>BILL TO:</h4>
                  <p style={{ margin: 0, fontWeight: 'bold' }}>{invoiceChallan.customer_name}</p>
                  <p style={{ margin: 0, color: '#444' }}>{invoiceChallan.customer?.business_name}</p>
                  <p style={{ margin: 0, color: '#444' }}>{invoiceChallan.customer?.mobile}</p>
                </div>

                {/* Items */}
                <table className="print-table" style={{ width: '100%', marginBottom: '2rem', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f9f9f9' }}>
                      <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Item</th>
                      <th style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '2px solid #ddd' }}>Qty</th>
                      <th style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '2px solid #ddd' }}>Price</th>
                      <th style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '2px solid #ddd' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoiceChallan.items && invoiceChallan.items.map((item, idx) => (
                      <tr key={idx}>
                        <td style={{ padding: '0.75rem', borderBottom: '1px solid #eee' }}>{item.product_name_snapshot}</td>
                        <td style={{ padding: '0.75rem', borderBottom: '1px solid #eee', textAlign: 'right' }}>{item.quantity}</td>
                        <td style={{ padding: '0.75rem', borderBottom: '1px solid #eee', textAlign: 'right' }}>₹{parseFloat(item.unit_price_snapshot).toFixed(2)}</td>
                        <td style={{ padding: '0.75rem', borderBottom: '1px solid #eee', textAlign: 'right' }}>₹{parseFloat(item.total_price).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Totals */}
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <div style={{ width: '300px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #eee' }}>
                      <span>Subtotal</span>
                      <span>₹{parseFloat(invoiceChallan.items?.reduce((sum, i) => sum + parseFloat(i.total_price), 0) || 0).toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #eee' }}>
                      <span>Tax (18% GST)</span>
                      <span>₹{parseFloat((invoiceChallan.items?.reduce((sum, i) => sum + parseFloat(i.total_price), 0) || 0) * 0.18).toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', fontWeight: 'bold', fontSize: '1.25rem' }}>
                      <span>Grand Total</span>
                      <span>₹{parseFloat((invoiceChallan.items?.reduce((sum, i) => sum + parseFloat(i.total_price), 0) || 0) * 1.18).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '4rem', textAlign: 'center', color: '#777', fontSize: '0.85rem' }}>
                  <p>This is a computer generated invoice and does not require a physical signature.</p>
                </div>
              </div>

              <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setIsInvoiceModalOpen(false)}>Close</button>
                <button type="button" className="btn-primary" onClick={handlePrint}><Printer size={18} /> Print Invoice</button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
};

export default SalesChallans;
