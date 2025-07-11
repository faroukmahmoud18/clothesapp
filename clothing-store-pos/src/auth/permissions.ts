// @/auth/permissions.ts

import { UserRole } from "./mockAuth"; // Assuming UserRole is in mockAuth.ts

// Define specific action permissions
// These are examples and should be expanded based on application features
export const PERMISSIONS = {
  // POS Permissions
  CAN_PROCESS_SALE: 'pos:process_sale',
  CAN_APPLY_ITEM_DISCOUNT: 'pos:apply_item_discount',
  CAN_APPLY_INVOICE_DISCOUNT: 'pos:apply_invoice_discount',
  CAN_VOID_INVOICE: 'pos:void_invoice',
  CAN_OPEN_CASH_DRAWER: 'pos:open_cash_drawer',
  CAN_VIEW_SALES_HISTORY: 'pos:view_sales_history', // Own sales or branch sales

  // Inventory Permissions
  CAN_CREATE_PRODUCT: 'inventory:create_product',
  CAN_EDIT_PRODUCT: 'inventory:edit_product',
  CAN_DELETE_PRODUCT: 'inventory:delete_product',
  CAN_VIEW_PRODUCT_COST_PRICE: 'inventory:view_product_cost_price',
  CAN_IMPORT_PRODUCTS: 'inventory:import_products',
  CAN_PRINT_BARCODES: 'inventory:print_barcodes',
  CAN_PERFORM_STOCKTAKE: 'inventory:perform_stocktake',
  CAN_MANAGE_CATEGORIES: 'inventory:manage_categories',
  CAN_TRANSFER_STOCK: 'inventory:transfer_stock',
  CAN_RECEIVE_STOCK: 'inventory:receive_stock',

  // Reporting Permissions
  CAN_VIEW_SALES_REPORTS: 'reports:view_sales',
  CAN_VIEW_INVENTORY_REPORTS: 'reports:view_inventory',
  CAN_VIEW_STAFF_REPORTS: 'reports:view_staff',
  CAN_VIEW_CUSTOMER_REPORTS: 'reports:view_customer',
  CAN_VIEW_FINANCIAL_REPORTS: 'reports:view_financial',
  CAN_EXPORT_REPORTS: 'reports:export',
  CAN_VIEW_BRANCH_PERFORMANCE_REPORTS: 'reports:view_branch_performance',

  // User Management Permissions
  CAN_CREATE_USER: 'users:create_user',
  CAN_EDIT_USER: 'users:edit_user',
  CAN_DELETE_USER: 'users:delete_user',
  CAN_ASSIGN_USER_ROLES: 'users:assign_user_roles', // Potentially restricted to certain roles

  // Customer & Loyalty Permissions
  CAN_REGISTER_CUSTOMER: 'loyalty:register_customer',
  CAN_EDIT_CUSTOMER: 'loyalty:edit_customer',
  CAN_VIEW_CUSTOMER_DETAILS: 'loyalty:view_customer_details',
  CAN_REDEEM_LOYALTY_POINTS: 'loyalty:redeem_points',
  CAN_ADJUST_LOYALTY_POINTS: 'loyalty:adjust_points',
  CAN_MANAGE_LOYALTY_SETTINGS: 'loyalty:manage_settings',

  // Branch Management (for Brand Owner, Super Admin)
  CAN_CREATE_BRANCH: 'branch:create_branch',
  CAN_EDIT_BRANCH: 'branch:edit_branch',
  CAN_VIEW_BRANCH_DETAILS: 'branch:view_branch_details',

  // Settings & Configuration
  CAN_MANAGE_GENERAL_SETTINGS: 'settings:manage_general',
  CAN_MANAGE_TAX_SETTINGS: 'settings:manage_tax',
  CAN_MANAGE_PAYMENT_TYPES: 'settings:manage_payment_types',
  CAN_MANAGE_PRINTER_SETTINGS: 'settings:manage_printer',

  // License Management (Super Admin)
  CAN_MANAGE_BRANDS: 'license:manage_brands',
  CAN_MANAGE_SUBSCRIPTIONS: 'license:manage_subscriptions',

  // Special Permissions
  CAN_ACCESS_GLOBAL_SETTINGS: 'admin:access_global_settings', // Super Admin
  CAN_COMPARE_BRANCH_PERFORMANCE: 'admin:compare_branch_performance', // Brand Owner
} as const;

// Type for a single permission string
export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

// Role to Permissions Mapping
export const roleToActionPermissions: Record<UserRole, Permission[]> = {
  [UserRole.SUPER_ADMIN]: [
    // Full access
    ...Object.values(PERMISSIONS),
  ],
  [UserRole.BRAND_OWNER]: [
    PERMISSIONS.CAN_PROCESS_SALE,
    PERMISSIONS.CAN_APPLY_ITEM_DISCOUNT,
    PERMISSIONS.CAN_APPLY_INVOICE_DISCOUNT,
    PERMISSIONS.CAN_VIEW_SALES_HISTORY,
    PERMISSIONS.CAN_CREATE_PRODUCT,
    PERMISSIONS.CAN_EDIT_PRODUCT,
    PERMISSIONS.CAN_DELETE_PRODUCT,
    PERMISSIONS.CAN_VIEW_PRODUCT_COST_PRICE,
    PERMISSIONS.CAN_IMPORT_PRODUCTS,
    PERMISSIONS.CAN_PRINT_BARCODES,
    PERMISSIONS.CAN_PERFORM_STOCKTAKE,
    PERMISSIONS.CAN_MANAGE_CATEGORIES,
    PERMISSIONS.CAN_TRANSFER_STOCK,
    PERMISSIONS.CAN_RECEIVE_STOCK,
    PERMISSIONS.CAN_VIEW_SALES_REPORTS,
    PERMISSIONS.CAN_VIEW_INVENTORY_REPORTS,
    PERMISSIONS.CAN_VIEW_STAFF_REPORTS,
    PERMISSIONS.CAN_VIEW_CUSTOMER_REPORTS,
    PERMISSIONS.CAN_EXPORT_REPORTS,
    PERMISSIONS.CAN_VIEW_BRANCH_PERFORMANCE_REPORTS,
    PERMISSIONS.CAN_CREATE_USER, // Manage users within their brand
    PERMISSIONS.CAN_EDIT_USER,
    PERMISSIONS.CAN_DELETE_USER,
    PERMISSIONS.CAN_ASSIGN_USER_ROLES, // Assign roles up to Branch Manager
    PERMISSIONS.CAN_REGISTER_CUSTOMER,
    PERMISSIONS.CAN_EDIT_CUSTOMER,
    PERMISSIONS.CAN_VIEW_CUSTOMER_DETAILS,
    PERMISSIONS.CAN_REDEEM_LOYALTY_POINTS,
    PERMISSIONS.CAN_MANAGE_LOYALTY_SETTINGS,
    PERMISSIONS.CAN_CREATE_BRANCH,
    PERMISSIONS.CAN_EDIT_BRANCH,
    PERMISSIONS.CAN_VIEW_BRANCH_DETAILS,
    PERMISSIONS.CAN_MANAGE_GENERAL_SETTINGS, // Brand-specific settings
    PERMISSIONS.CAN_COMPARE_BRANCH_PERFORMANCE,
  ],
  [UserRole.BRANCH_MANAGER]: [
    PERMISSIONS.CAN_PROCESS_SALE,
    PERMISSIONS.CAN_APPLY_ITEM_DISCOUNT,
    PERMISSIONS.CAN_APPLY_INVOICE_DISCOUNT,
    PERMISSIONS.CAN_VOID_INVOICE,
    PERMISSIONS.CAN_OPEN_CASH_DRAWER,
    PERMISSIONS.CAN_VIEW_SALES_HISTORY, // Branch sales
    PERMISSIONS.CAN_EDIT_PRODUCT, // Limited editing? Or full?
    PERMISSIONS.CAN_VIEW_PRODUCT_COST_PRICE,
    PERMISSIONS.CAN_PRINT_BARCODES,
    PERMISSIONS.CAN_PERFORM_STOCKTAKE,
    PERMISSIONS.CAN_MANAGE_CATEGORIES, // Branch-level?
    PERMISSIONS.CAN_TRANSFER_STOCK, // Within branch or to/from main warehouse
    PERMISSIONS.CAN_RECEIVE_STOCK,
    PERMISSIONS.CAN_VIEW_SALES_REPORTS, // Branch reports
    PERMISSIONS.CAN_VIEW_INVENTORY_REPORTS, // Branch reports
    PERMISSIONS.CAN_VIEW_STAFF_REPORTS, // Branch staff
    PERMISSIONS.CAN_EXPORT_REPORTS,
    PERMISSIONS.CAN_CREATE_USER, // Manage Cashiers, Warehouse Staff in their branch
    PERMISSIONS.CAN_EDIT_USER,
    PERMISSIONS.CAN_REGISTER_CUSTOMER,
    PERMISSIONS.CAN_EDIT_CUSTOMER,
    PERMISSIONS.CAN_VIEW_CUSTOMER_DETAILS,
    PERMISSIONS.CAN_REDEEM_LOYALTY_POINTS,
  ],
  [UserRole.CASHIER]: [
    PERMISSIONS.CAN_PROCESS_SALE,
    PERMISSIONS.CAN_APPLY_ITEM_DISCOUNT,
    PERMISSIONS.CAN_APPLY_INVOICE_DISCOUNT, // With limits?
    PERMISSIONS.CAN_OPEN_CASH_DRAWER, // With manager approval?
    PERMISSIONS.CAN_VIEW_SALES_HISTORY, // Own sales
    PERMISSIONS.CAN_REGISTER_CUSTOMER,
    PERMISSIONS.CAN_VIEW_CUSTOMER_DETAILS,
    PERMISSIONS.CAN_REDEEM_LOYALTY_POINTS,
  ],
  [UserRole.WAREHOUSE_MANAGER]: [
    PERMISSIONS.CAN_CREATE_PRODUCT, // Or only receive?
    PERMISSIONS.CAN_EDIT_PRODUCT,
    PERMISSIONS.CAN_VIEW_PRODUCT_COST_PRICE,
    PERMISSIONS.CAN_PRINT_BARCODES,
    PERMISSIONS.CAN_PERFORM_STOCKTAKE,
    PERMISSIONS.CAN_TRANSFER_STOCK,
    PERMISSIONS.CAN_RECEIVE_STOCK,
    PERMISSIONS.CAN_VIEW_INVENTORY_REPORTS,
    PERMISSIONS.CAN_MANAGE_CATEGORIES, // If central warehouse
  ],
  [UserRole.WAREHOUSE_STAFF]: [
    PERMISSIONS.CAN_RECEIVE_STOCK,
    PERMISSIONS.CAN_PERFORM_STOCKTAKE, // Assist
    PERMISSIONS.CAN_PRINT_BARCODES, // For received items
  ],
  [UserRole.ACCOUNTANT]: [
    PERMISSIONS.CAN_VIEW_SALES_REPORTS,
    PERMISSIONS.CAN_VIEW_INVENTORY_REPORTS, // For valuation
    PERMISSIONS.CAN_VIEW_FINANCIAL_REPORTS,
    PERMISSIONS.CAN_EXPORT_REPORTS,
    PERMISSIONS.CAN_VIEW_PRODUCT_COST_PRICE,
    PERMISSIONS.CAN_MANAGE_TAX_SETTINGS, // View or propose changes?
  ],
};

/**
 * Checks if a user with a given role has a specific permission.
 * @param role The UserRole of the user.
 * @param permission The Permission to check for.
 * @returns True if the user has the permission, false otherwise.
 */
export const userHasPermission = (role: UserRole | undefined, permission: Permission): boolean => {
  if (!role) return false;
  const userPermissions = roleToActionPermissions[role];
  if (!userPermissions) return false;
  return userPermissions.includes(permission);
};

// Example of a hook to use in components:
// import { useAuthStore } from '@/store/authStore';
// import { Permission, userHasPermission } from '@/auth/permissions';
//
// export const usePermission = (permission: Permission) => {
//   const currentUser = useAuthStore((state) => state.currentUser);
//   return userHasPermission(currentUser?.role, permission);
// };
//
// Usage in a component:
// const canCreate = usePermission(PERMISSIONS.CAN_CREATE_PRODUCT);
// if (canCreate) { /* render button */ }

// Note: The route-based permissions in mockAuth.ts (rolePermissions and hasPermission)
// are still useful for general route guarding in ProtectedRoute.tsx.
// This new action-based permission system (roleToActionPermissions and userHasPermission)
// will be used for fine-grained control within components/pages.
// For example, a Branch Manager and Cashier might both access /pos,
// but only the manager can void an invoice.
