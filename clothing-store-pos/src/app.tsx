import React, { Suspense } from 'react';
import { HashRouter as Router, Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom'; // Added useNavigate
import { useTranslation } from 'react-i18next';
import './i18n'; // Initialize i18next
import LoginPage from '@/pages/LoginPage'; // Actual LoginPage
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuthStore } from '@/store/authStore';
import { UserRole } from '@/auth/mockAuth';

// Placeholder pages for POS and Inventory (can be expanded later)
const POSPage = () => {
  const { t } = useTranslation();
  return <div className="p-4"> <h2 className="text-xl font-semibold">{t('posPage')}</h2> <p>Welcome to the Point of Sale.</p> </div>;
};
const InventoryPage = () => {
  const { t } = useTranslation();
  return <div className="p-4"> <h2 className="text-xl font-semibold">{t('inventoryPage')}</h2> <p>Welcome to Inventory Management.</p> </div>;
};


// A simple layout component to conditionally show nav
const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t, i18n } = useTranslation();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const logout = useAuthStore((state) => state.logout);
  const currentUser = useAuthStore((state) => state.currentUser);
  const navigate = useNavigate();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {isAuthenticated && (
        <nav className="p-4 bg-primary text-primary-foreground shadow-md">
          <div className="container mx-auto flex justify-between items-center">
            <ul className="flex space-x-4 items-center">
              <li><Link to="/pos" className="hover:text-secondary-foreground">{t('pos')}</Link></li>
              <li><Link to="/inventory" className="hover:text-secondary-foreground">{t('inventory')}</Link></li>
            </ul>
            <div className="flex items-center space-x-4">
              {currentUser && <span className="text-sm">Welcome, {currentUser.name} ({currentUser.role})</span>}
              <button onClick={() => changeLanguage('en')} className="mr-2 p-1 bg-secondary text-secondary-foreground rounded hover:bg-secondary/80">English</button>
              <button onClick={() => changeLanguage('ar')} className="p-1 bg-secondary text-secondary-foreground rounded hover:bg-secondary/80">العربية</button>
              <button onClick={handleLogout} className="p-1 bg-destructive text-destructive-foreground rounded hover:bg-destructive/80">{t('logout')}</button>
            </div>
          </div>
        </nav>
      )}
      <main className="flex-grow container mx-auto p-4">
        <Suspense fallback={<div className="flex justify-center items-center h-full">Loading translations...</div>}>
          {children}
        </Suspense>
      </main>
    </div>
  );
};


const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/*"
          element={
            <Layout>
              <Routes>
                <Route path="/pos" element={
                  <ProtectedRoute
                    element={<POSPage />}
                    requiredRoles={[UserRole.SUPER_ADMIN, UserRole.BRAND_OWNER, UserRole.BRANCH_MANAGER, UserRole.CASHIER]}
                  />}
                />
                <Route path="/inventory" element={
                  <ProtectedRoute
                    element={<InventoryPage />}
                    requiredRoles={[UserRole.SUPER_ADMIN, UserRole.BRAND_OWNER, UserRole.BRANCH_MANAGER, UserRole.WAREHOUSE_MANAGER, UserRole.WAREHOUSE_STAFF]}
                  />}
                />
                {/* Add other protected routes here */}
                <Route path="/" element={<Navigate to="/pos" replace />} /> {/* Default authenticated route */}
                <Route path="*" element={<div><h2>404 Not Found</h2><Link to="/">Go Home</Link></div>} />
              </Routes>
            </Layout>
          }
        />
      </Routes>
    </Router>
  );
};

export default App;
