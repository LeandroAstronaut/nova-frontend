import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/Auth/LoginPage';
import Dashboard from './pages/Dashboard';
import OrdersPage from './pages/Orders/OrdersPage';
import BudgetCreationPage from './pages/Orders/BudgetCreationPage';
import CompaniesPage from './pages/Admin/CompaniesPage';
import MainLayout from './components/layout/MainLayout';
import './App.css';

const ProtectedRoute = ({ children, requireCompany = false }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-body)]">
        <div className="w-12 h-12 border-4 border-primary-200 dark:border-primary-800 border-t-primary-600 dark:border-t-primary-400 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  // Superadmin puede acceder a todo sin compañía
  const isSuperadmin = user?.role?.name === 'superadmin';
  
  // Si requiere compañía y no tiene (y no es superadmin), redirigir
  if (requireCompany && !user?.company && !isSuperadmin) {
    return <Navigate to="/" />;
  }

  return <MainLayout>{children}</MainLayout>;
};

// Componente wrapper para BudgetCreationPage que maneja la navegación
const BudgetCreationWrapper = () => {
  const navigate = useNavigate();
  
  return (
    <BudgetCreationPage 
      onCancel={() => navigate('/presupuestos')}
      onSave={() => navigate('/presupuestos')}
    />
  );
};

function App() {
  return (
    <div className="theme-transition">
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        {/* Placeholder routes for navigation */}
        <Route path="/pedidos" element={<ProtectedRoute><OrdersPage mode="order" /></ProtectedRoute>} />
        <Route path="/presupuestos" element={<ProtectedRoute><OrdersPage mode="budget" /></ProtectedRoute>} />
        <Route path="/presupuestos/nuevo" element={<ProtectedRoute><BudgetCreationWrapper /></ProtectedRoute>} />
        <Route path="/recibos" element={<ProtectedRoute><div className="card">Módulo de Recibos</div></ProtectedRoute>} />
        <Route path="/catalogo" element={<ProtectedRoute><div className="card">Módulo de Catálogo</div></ProtectedRoute>} />
        <Route path="/clientes" element={<ProtectedRoute><div className="card">Autogestión de Clientes</div></ProtectedRoute>} />
        <Route path="/cuentas" element={<ProtectedRoute><div className="card">Cuentas Corrientes</div></ProtectedRoute>} />
        <Route path="/admin/companies" element={<ProtectedRoute><CompaniesPage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
}

export default App;
