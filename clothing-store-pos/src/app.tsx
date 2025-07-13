import React, { Suspense, useEffect } from 'react'; // Added useEffect
import { HashRouter as Router, Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom'; // Added useNavigate
import { useTranslation } from 'react-i18next';
import './i18n'; // Initialize i18next
import { getDb } from '@/db/dbManager'; // Import getDb
import { useAppStore } from '@/store/appStore'; // Import appStore
import { Button } from '@/components/ui/button'; // Import Button for Sync button
import { RefreshCwIcon, CheckCircle, AlertTriangleIcon } from 'lucide-react'; // Icons for sync status
import LoginPage from '@/pages/LoginPage';
import UnauthorizedPage from '@/pages/UnauthorizedPage';
import POSPage from '@/pages/POSPage';
import InventoryPage from '@/pages/InventoryPage'; // Import InventoryPage from its new file
import ReportsPage from '@/pages/ReportsPage'; // Import ReportsPage
import BackupPage from '@/pages/BackupPage';
import LicensePage from '@/pages/LicensePage';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuthStore } from '@/store/authStore';
import { UserRole } from '@/auth/mockAuth';
import { usePermission, PERMISSIONS } from '@/auth/permissions';
import { Toaster } from 'react-hot-toast'; // Import Toaster
import { checkLicense, handleLicenseExpiry } from '@/licensing/licenseService';

// InventoryPage is now in its own file. This placeholder can be removed.

// A simple layout component to conditionally show nav
const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t, i18n } = useTranslation();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const logout = useAuthStore((state) => state.logout);
  const currentUser = useAuthStore((state) => state.currentUser);
  const navigate = useNavigate();

  // Permissions for navigation links
  const canViewPos = usePermission(PERMISSIONS.VIEW_POS);
  const canViewInventory = usePermission(PERMISSIONS.VIEW_INVENTORY);
  const canViewReports = usePermission(PERMISSIONS.VIEW_REPORTS);

  const {
    isSyncing,
    lastSyncTimestamp,
    syncError,
    pendingQueueCount,
    triggerSync,
    updatePendingQueueCount
  } = useAppStore();

  useEffect(() => {
    const cleanup = useAppStore.getState().initializeSyncInterval();
    return cleanup;
  }, []);


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
              {canViewPos && <li><Link to="/pos" className="hover:text-secondary-foreground">{t('pos')}</Link></li>}
              {canViewInventory && <li><Link to="/inventory" className="hover:text-secondary-foreground">{t('inventory')}</Link></li>}
              {canViewReports && <li><Link to="/reports" className="hover:text-secondary-foreground">{t('reports')}</Link></li>}
              <li><Link to="/backup" className="hover:text-secondary-foreground">{t('backup')}</Link></li>
              <li><Link to="/license" className="hover:text-secondary-foreground">{t('license')}</Link></li>
            </ul>
            <div className="flex items-center space-x-2"> {/* Reduced space-x for tighter group */}
              {/* Sync Status & Button */}
              <div className="flex items-center space-x-1 text-xs mr-2 p-1 rounded">
                {isSyncing ? (
                  <RefreshCwIcon className="h-4 w-4 animate-spin" />
                ) : syncError ? (
                  <AlertTriangleIcon className="h-4 w-4 text-destructive" title={syncError}/>
                ) : (
                  <CheckCircle className="h-4 w-4 text-green-400" />
                )}
                <span className="hidden md:inline">
                  {isSyncing ? t('syncStatus.syncing') :
                   syncError ? t('syncStatus.error') :
                   lastSyncTimestamp ? `${t('syncStatus.lastSynced')}: ${new Date(lastSyncTimestamp).toLocaleTimeString()}` : t('syncStatus.ready')}
                </span>
                {pendingQueueCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs font-semibold bg-amber-500 text-white rounded-full" title={`${pendingQueueCount} ${t('syncStatus.itemsPending')}`}>
                    {pendingQueueCount}
                  </span>
                )}
              </div>
              <Button onClick={triggerSync} disabled={isSyncing} variant="ghost" size="sm" className="p-1 h-auto hover:bg-primary-foreground/20">
                <RefreshCwIcon className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                <span className="ml-1 hidden lg:inline">{t('syncStatus.syncNowButton')}</span>
              </Button>

              {currentUser && <span className="text-sm hidden md:inline">Welcome, {currentUser.name} ({currentUser.role})</span>}
              <button onClick={() => changeLanguage('en')} className="p-1 bg-secondary text-secondary-foreground rounded hover:bg-secondary/80 text-xs">EN</button>
              <button onClick={() => changeLanguage('ar')} className="p-1 bg-secondary text-secondary-foreground rounded hover:bg-secondary/80 text-xs">AR</button>
              <Button onClick={handleLogout} variant="destructive" size="sm" className="p-1 h-auto text-xs">{t('logout')}</Button>
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

      const checkAndHandleLicense = async () => {
        const license = await checkLicense();
        if (license.isValid && license.expiryDate) {
          handleLicenseExpiry(license.expiryDate);
        } else {
          // Handle invalid license
        }
      };
      checkAndHandleLicense();
    } catch (error) {
      console.error('[App] Failed to initialize database on app load:', error);
      // TODO: Show a critical error message to the user, as the app might not function.
      // This could be a full-screen error overlay.
    }
  }, []); // Empty dependency array ensures this runs once on mount

  return (
    <>
      <Toaster
        position="bottom-right"
        toastOptions={{
          // Define default options
          className: '',
          duration: 5000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          // Default options for specific types
          success: {
            duration: 3000,
            theme: {
              primary: 'green',
              secondary: 'black',
            },
          },
        }}
      />
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
                <Route path="/reports" element={
                  <ProtectedRoute
                    element={<ReportsPage />}
                    requiredRoles={[UserRole.SUPER_ADMIN, UserRole.BRAND_OWNER, UserRole.BRANCH_MANAGER, UserRole.ACCOUNTANT]}
                  />}
                />
                <Route path="/backup" element={
                  <ProtectedRoute
                    element={<BackupPage />}
                    requiredRoles={[UserRole.SUPER_ADMIN]}
                  />}
                />
                <Route path="/license" element={<LicensePage />} />
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
