import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { UserRole, hasPermission } from '@/auth/mockAuth';

interface ProtectedRouteProps {
  element: React.ReactElement;
  requiredRoles?: UserRole[]; // Optional: specific roles required for this route
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ element, requiredRoles }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const currentUser = useAuthStore((state) => state.currentUser);
  const location = useLocation();

  if (!isAuthenticated) {
    // Redirect them to the /login page, but save the current location they were
    // trying to go to when they were redirected. This allows us to send them
    // along to that page after they login, which is a nicer user experience
    // than dropping them off on the home page.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check general path-based permission first (from mockAuth.ts)
  const generalAccess = hasPermission(currentUser?.role, location.pathname);

  // Check specific roles if requiredRoles are provided
  let specificRoleAccess = true;
  if (requiredRoles && currentUser) {
    specificRoleAccess = requiredRoles.includes(currentUser.role);
  }

  if (!generalAccess || !specificRoleAccess) {
    // User is authenticated but does not have the required role or general permission for this path
    // Redirect to a 'Forbidden' page or back to a default page (e.g., POS or home)
    // For now, redirecting to a simple "forbidden" text page or back to POS.
    // A dedicated /forbidden page would be better.
    console.warn(`User ${currentUser?.username} with role ${currentUser?.role} tried to access ${location.pathname} without permission.`);
    // return <Navigate to="/pos" state={{ message: "Access Denied" }} replace />;
     return (
      <div>
        <h2>Access Denied</h2>
        <p>You do not have permission to view this page.</p>
        <button onClick={() => window.history.back()}>Go Back</button>
      </div>
    );
  }

  return element;
};

export default ProtectedRoute;
