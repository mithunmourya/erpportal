import React, { useState, useEffect } from 'react';
import * as inventoryService from '../services/inventoryService';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';

const StockMovements = () => {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchMovements = async () => {
      try {
        const res = await inventoryService.getMovements();
        if (res.data.success) {
          setMovements(res.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch movements");
      } finally {
        setLoading(false);
      }
    };
    fetchMovements();
  }, []);

  const filteredMovements = movements.filter(m => 
    m.product_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (m.reason && m.reason.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>Stock Movement Logs</h1>
          <p style={{ color: 'var(--text-muted)' }}>Immutable ledger of all IN and OUT inventory changes.</p>
        </div>
        <input 
          type="search" 
          placeholder="🔍 Search Product or Challan..." 
          className="input-field" 
          style={{ width: '400px' }}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="table-container">
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Type</th>
                <th>Product</th>
                <th>Quantity</th>
                <th>Reason</th>
                <th>User ID</th>
              </tr>
            </thead>
            <tbody>
              {filteredMovements.map(m => (
                <tr key={m.id}>
                  <td style={{ color: 'var(--text-muted)' }}>{new Date(m.created_at).toLocaleString()}</td>
                  <td>
                    {m.movement_type === 'IN' ? (
                      <span className="badge success" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        <ArrowDownRight size={14} /> IN
                      </span>
                    ) : (
                      <span className="badge warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'rgb(239, 68, 68)' }}>
                        <ArrowUpRight size={14} /> OUT
                      </span>
                    )}
                  </td>
                  <td style={{ fontWeight: 500 }}>{m.product_name}</td>
                  <td style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{m.quantity_changed}</td>
                  <td>{m.reason}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{m.created_by}</td>
                </tr>
              ))}
              {filteredMovements.length === 0 && (
                <tr><td colSpan="6" style={{ textAlign: 'center' }}>No stock movements found</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default StockMovements;
