import React, { Suspense, useEffect } from 'react'; // Added useEffect
import { HashRouter as Router, Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom'; // Added useNavigate
import { useTranslation } from 'react-i18next';
import './i18n'; // Initialize i18next
import { getDb } from '@/db/dbManager'; // Import getDb
import LoginPage from '@/pages/LoginPage';
import UnauthorizedPage from '@/pages/UnauthorizedPage';
import POSPage from '@/pages/POSPage';
import InventoryPage from '@/pages/InventoryPage'; // Import InventoryPage from its new file
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuthStore } from '@/store/authStore';
import { UserRole } from '@/auth/mockAuth';

// InventoryPage is now in its own file. This placeholder can be removed.

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
  useEffect(() => {
    try {
      console.log('[App] Initializing database connection...');
      getDb(); // This will initialize the DB and schema if not already done
      console.log('[App] Database connection checked/initialized.');
    } catch (error) {
      console.error('[App] Failed to initialize database on app load:', error);
      // TODO: Show a critical error message to the user, as the app might not function.
      // This could be a full-screen error overlay.
    }
  }, []); // Empty dependency array ensures this runs once on mount

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
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
