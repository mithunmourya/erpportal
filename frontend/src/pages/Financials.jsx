import React, { useState, useEffect } from 'react';
import * as challanService from '../services/challanService';

const Financials = () => {
  const [challans, setChallans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchConfirmed = async () => {
      try {
        const res = await challanService.getChallans();
        if (res.data.success) {
          // Accounts only sees confirmed/invoiced challans
          const confirmed = res.data.data.filter(c => c.status === 'Confirmed');
          
          // In a real app, we would fetch the /api/challans/:id endpoint for each 
          // to get the total_price from the items. For this MVP frontend view, 
          // we'll just show the high-level data returned from the bulk GET.
          setChallans(confirmed);
        }
      } catch (err) {
        console.error("Failed to fetch financials");
      } finally {
        setLoading(false);
      }
    };
    fetchConfirmed();
  }, []);

  const filteredChallans = challans.filter(c => 
    c.challan_number.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.customer_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>Financial Billing Review</h1>
          <p style={{ color: 'var(--text-muted)' }}>Read-only view of dispatched (Confirmed) Sales Challans for invoicing.</p>
        </div>
        <input 
          type="search" 
          placeholder="🔍 Search Challan No or Customer..." 
          className="input-field" 
          style={{ width: '400px' }}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="dashboard-grid">
        <div className="card" style={{ borderLeft: '4px solid var(--status-success-text)' }}>
          <h3 style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase' }}>Ready to Invoice</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{challans.length}</p>
        </div>
        <div className="card" style={{ borderLeft: '4px solid var(--primary-accent)' }}>
          <h3 style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase' }}>Total Revenue (₹)</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>
            {challans.reduce((acc, c) => acc + (c.items ? c.items.reduce((sum, item) => sum + parseFloat(item.total_price), 0) : 0), 0).toFixed(2)}
          </p>
        </div>
      </div>

      <div className="table-container">
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Challan No.</th>
                <th>Date Confirmed</th>
                <th>Customer</th>
                <th>Revenue</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredChallans.map(c => {
                const revenue = c.items ? c.items.reduce((sum, item) => sum + parseFloat(item.total_price), 0).toFixed(2) : '0.00';
                return (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 'bold', color: 'var(--primary-accent)' }}>{c.challan_number}</td>
                    <td>{new Date(c.created_at).toLocaleDateString()}</td>
                    <td>{c.customer_name}</td>
                    <td style={{ fontWeight: '500' }}>₹{revenue}</td>
                    <td><span className="badge success">Ready for Billing</span></td>
                  </tr>
                );
              })}
              {filteredChallans.length === 0 && (
                <tr><td colSpan="5" style={{ textAlign: 'center' }}>No confirmed challans awaiting review.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Financials;
