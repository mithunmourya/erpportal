import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import * as challanService from '../services/challanService';
import * as crmService from '../services/crmService';
import * as catalogService from '../services/catalogService';
import * as reportService from '../services/reportService';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState({
    activeCustomers: 0,
    draftChallans: 0,
    lowStock: 0
  });
  
  const [reportData, setReportData] = useState({
    dailyData: [],
    monthlyData: [],
    currentMonthRevenue: 0,
    totalAllTime: 0
  });
  const [loading, setLoading] = useState(true);

  const getBasePath = () => {
    switch (user?.role) {
      case 'Admin': return '/admin';
      case 'Sales': return '/seller';
      case 'Warehouse': return '/warehouse';
      case 'Accounts': return '/accounts';
      default: return '';
    }
  };
  const basePath = getBasePath();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const promises = [
          challanService.getChallans(),
          crmService.getCustomers(),
          catalogService.getProducts()
        ];
        
        if (user?.role === 'Admin' || user?.role === 'Accounts') {
          promises.push(reportService.getDailyReport({ range: 'last_30_days' }));
          promises.push(reportService.getMonthlyReport({ range: 'last_12_months' }));
          promises.push(reportService.getMonthlyReport({})); 
        }
        
        const results = await Promise.all(promises);
        const [chRes, custRes, prodRes] = results;
        
        let draftCount = 0;
        if (chRes.data.success) {
           draftCount = chRes.data.data.filter(c => c.status === 'Draft').length;
        }
        
        let activeCount = 0;
        if (custRes.data.success) {
           activeCount = custRes.data.data.filter(c => c.is_active && c.status === 'Active').length;
        }
        
        let lowCount = 0;
        if (prodRes.data.success) {
           lowCount = prodRes.data.data.filter(p => p.is_active && p.current_stock <= p.min_stock_alert).length;
        }

        setStats({
          activeCustomers: activeCount,
          draftChallans: draftCount,
          lowStock: lowCount
        });
        
        if (user?.role === 'Admin' || user?.role === 'Accounts') {
           const dailyRes = results[3];
           const monthlyRes = results[4];
           const currentMonthRes = results[5];
           
           setReportData({
             dailyData: dailyRes.data?.data?.records || [],
             monthlyData: monthlyRes.data?.data || [],
             currentMonthRevenue: currentMonthRes.data?.data?.revenue || 0,
             totalAllTime: dailyRes.data?.data?.total_all_time || 0
           });
        }
      } catch (err) {
        console.error("Failed to fetch dashboard stats", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, [user]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          backgroundColor: 'var(--paper-raised)',
          padding: '10px 14px',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          fontFamily: 'IBM Plex Mono, monospace'
        }}>
          <p style={{ margin: '0 0 6px', fontWeight: 600, color: 'var(--ink)' }}>{label}</p>
          <p style={{ margin: 0, color: 'var(--accent)', fontWeight: 'bold' }}>
            ₹{parseFloat(payload[0].value).toLocaleString()}
          </p>
          {payload[0].payload.challan_count !== undefined && (
            <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--ink-soft)' }}>
              Challans: {payload[0].payload.challan_count}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1>Welcome, {user?.name}</h1>
        <p>You are logged into the {user?.role} Workspace.</p>
      </div>

      <div className="dashboard-grid">
        {(user?.role === 'Admin' || user?.role === 'Accounts') && (
          <>
            <div className="card" style={{ borderLeft: '4px solid var(--accent)' }}>
              <h3 style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase' }}>Total Revenue</h3>
              <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                {loading ? '...' : `₹${parseFloat(reportData.totalAllTime).toLocaleString()}`}
              </p>
            </div>
            
            <div className="card" style={{ borderLeft: '4px solid var(--accent)' }}>
              <h3 style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase' }}>Revenue — MTD</h3>
              <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                {loading ? '...' : `₹${parseFloat(reportData.currentMonthRevenue).toLocaleString()}`}
              </p>
            </div>
          </>
        )}

        {(user?.role === 'Admin' || user?.role === 'Sales') && (
          <>
            <div className="card" style={{ cursor: 'pointer' }} onClick={() => navigate(`${basePath}/customers`)}>
              <h3 style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase' }}>Active Customers</h3>
              <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{loading ? '...' : stats.activeCustomers}</p>
            </div>
            
            <div className="card" style={{ cursor: 'pointer' }} onClick={() => navigate(`${basePath}/challans`)}>
              <h3 style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase' }}>Draft Challans</h3>
              <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{loading ? '...' : stats.draftChallans}</p>
            </div>
          </>
        )}
        
        <div className="card" style={{ cursor: 'pointer', borderColor: stats.lowStock > 0 ? 'var(--alert)' : 'var(--border)' }} onClick={() => navigate(`${basePath}/products?filter=low_stock`)}>
          <h3 style={{ color: stats.lowStock > 0 ? 'var(--alert)' : 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase' }}>⚠ Low Stock Alerts</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: stats.lowStock > 0 ? 'var(--alert)' : 'inherit' }}>{loading ? '...' : stats.lowStock}</p>
        </div>
      </div>

      {user?.role === 'Accounts' && (
        <div style={{ marginTop: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="card" style={{ padding: '2rem' }}>
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>Daily Revenue Trend (Last 30 Days)</h2>
            {loading ? (
              <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-soft)' }}>
                Loading chart data...
              </div>
            ) : reportData.dailyData.length === 0 ? (
              <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-soft)' }}>
                No sales recorded for this period
              </div>
            ) : (
              <div style={{ height: '300px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={reportData.dailyData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fill: 'var(--ink-soft)', fontSize: 12 }} 
                      tickLine={false} 
                      axisLine={false} 
                      tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    />
                    <YAxis 
                      tick={{ fill: 'var(--ink-soft)', fontSize: 12 }} 
                      tickLine={false} 
                      axisLine={false} 
                      tickFormatter={(val) => `₹${val/1000}k`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="var(--accent)" 
                      strokeWidth={3}
                      dot={{ r: 4, fill: 'var(--paper)', stroke: 'var(--accent)', strokeWidth: 2 }}
                      activeDot={{ r: 6, fill: 'var(--accent)', stroke: 'var(--paper)', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="card" style={{ padding: '2rem' }}>
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>Monthly Revenue (Last 12 Months)</h2>
            {loading ? (
              <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-soft)' }}>
                Loading chart data...
              </div>
            ) : reportData.monthlyData.length === 0 ? (
              <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-soft)' }}>
                No sales recorded for this period
              </div>
            ) : (
              <div style={{ height: '300px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={reportData.monthlyData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fill: 'var(--ink-soft)', fontSize: 12 }} 
                      tickLine={false} 
                      axisLine={false} 
                      tickFormatter={(val) => {
                        const [y, m] = val.split('-');
                        const d = new Date(y, parseInt(m)-1, 1);
                        return d.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
                      }}
                    />
                    <YAxis 
                      tick={{ fill: 'var(--ink-soft)', fontSize: 12 }} 
                      tickLine={false} 
                      axisLine={false} 
                      tickFormatter={(val) => `₹${val/1000}k`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar 
                      dataKey="revenue" 
                      fill="var(--accent)" 
                      radius={[4, 4, 0, 0]} 
                      barSize={40}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      )}

      {user?.role !== 'Accounts' && (
        <div className="card" style={{ marginTop: '2.5rem' }}>
          <h2>Quick Actions</h2>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            {(user?.role === 'Admin' || user?.role === 'Sales') && (
              <button className="btn-primary" onClick={() => navigate(`${basePath}/challans`)}>New Challan</button>
            )}
            {(user?.role === 'Admin' || user?.role === 'Warehouse') && (
              <button className="btn-secondary" onClick={() => navigate(`${basePath}/products`)}>Log Stock Movement</button>
            )}
            {(user?.role === 'Admin' || user?.role === 'Sales') && (
              <button className="btn-secondary" onClick={() => navigate(`${basePath}/customers`)}>View CRM</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
