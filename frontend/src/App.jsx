import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/layout/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Customers from './pages/Customers';
import Users from './pages/Users';
import SalesChallans from './pages/SalesChallans';
import StockMovements from './pages/StockMovements';
import Financials from './pages/Financials';

function App() {
  return (
    <Router>
      <ToastProvider>
        <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />

          {/* Admin Workspace */}
          <Route element={<ProtectedRoute allowedRoles={['Admin']} />}>
            <Route path="/admin/dashboard" element={<Dashboard />} />
            <Route path="/admin/customers" element={<Customers />} />
            <Route path="/admin/products" element={<Products />} />
            <Route path="/admin/challans" element={<SalesChallans />} />
            <Route path="/admin/stock-movements" element={<StockMovements />} />
            <Route path="/admin/users" element={<Users />} />
          </Route>

          {/* Seller Workspace */}
          <Route element={<ProtectedRoute allowedRoles={['Sales']} />}>
            <Route path="/seller/dashboard" element={<Dashboard />} />
            <Route path="/seller/customers" element={<Customers />} />
            <Route path="/seller/products" element={<Products />} />
            <Route path="/seller/challans" element={<SalesChallans />} />
          </Route>

          {/* Warehouse Workspace */}
          <Route element={<ProtectedRoute allowedRoles={['Warehouse']} />}>
            <Route path="/warehouse/dashboard" element={<Dashboard />} />
            <Route path="/warehouse/products" element={<Products />} />
            <Route path="/warehouse/stock-movements" element={<StockMovements />} />
          </Route>

          {/* Accounts Workspace */}
          <Route element={<ProtectedRoute allowedRoles={['Accounts']} />}>
            <Route path="/accounts/dashboard" element={<Dashboard />} />
            <Route path="/accounts/financials" element={<Financials />} />
          </Route>
        </Routes>
        </AuthProvider>
      </ToastProvider>
    </Router>
  );
}

export default App;
