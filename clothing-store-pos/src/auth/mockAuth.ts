export enum UserRole {
  SUPER_ADMIN = 'Super Admin',
  BRAND_OWNER = 'Brand Owner',
  BRANCH_MANAGER = 'Branch Manager',
  CASHIER = 'Cashier',
  WAREHOUSE_MANAGER = 'Warehouse Manager',
  WAREHOUSE_STAFF = 'Warehouse Staff',
  ACCOUNTANT = 'Accountant',
}

export interface User {
  id: string;
  username: string;
  password; // In a real app, this would be a hash
  role: UserRole;
  name: string; // Display name
}

export const mockUsers: User[] = [
  { id: '1', username: 'superadmin', password: 'password', role: UserRole.SUPER_ADMIN, name: 'Super Admin User' },
  { id: '2', username: 'brandowner', password: 'password', role: UserRole.BRAND_OWNER, name: 'Brand Owner User' },
  { id: '3', username: 'manager', password: 'password', role: UserRole.BRANCH_MANAGER, name: 'Branch Manager User' },
  { id: '4', username: 'cashier', password: 'password', role: UserRole.CASHIER, name: 'Cashier User' },
  { id: '5', username: 'warehousemgr', password: 'password', role: UserRole.WAREHOUSE_MANAGER, name: 'Warehouse Manager User' },
  { id: '6', username: 'warehousestaff', password: 'password', role: UserRole.WAREHOUSE_STAFF, name: 'Warehouse Staff User' },
  { id: '7', username: 'accountant', password: 'password', role: UserRole.ACCOUNTANT, name: 'Accountant User' },
];

// Define which routes are accessible by which roles
// This is a simplified representation. A more complex system might involve permissions.
export const rolePermissions: Record<UserRole, string[]> = {
  [UserRole.SUPER_ADMIN]: ['/pos', '/inventory', '/admin', '/settings', '/reports', '/users'], // Example routes
  [UserRole.BRAND_OWNER]: ['/pos', '/inventory', '/reports', '/users'],
  [UserRole.BRANCH_MANAGER]: ['/pos', '/inventory', '/reports/branch', '/staff'],
  [UserRole.CASHIER]: ['/pos'],
  [UserRole.WAREHOUSE_MANAGER]: ['/inventory', '/transfers', '/stock-alerts'],
  [UserRole.WAREHOUSE_STAFF]: ['/inventory/receive'],
  [UserRole.ACCOUNTANT]: ['/reports/financial', '/tax'],
};

// Function to check if a role has access to a specific path
export const hasPermission = (role: UserRole | undefined, path: string): boolean => {
  if (!role) return false;
  const allowedRoutes = rolePermissions[role];
  // For simplicity, checking if the path starts with an allowed route.
  // A more robust check would match exact routes or use a more structured permission system.
  return allowedRoutes?.some(allowedPath => path.startsWith(allowedPath)) || false;
};
