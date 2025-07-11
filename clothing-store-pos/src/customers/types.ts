// @/customers/types.ts

export interface Customer {
  id: string; // UUID
  name: string;
  phone: string; // Should be unique
  email?: string;
  memberCode?: string; // System-generated or manual, should be unique if present
  loyaltyPoints: number;
  address?: string; // Could be a more structured address object later
  createdAt: string; // ISO8601 Date string
  updatedAt: string; // ISO8601 Date string
  branchId?: string; // Optional: Branch where registered or primarily associated
  // Additional fields like birthday, preferences, notes can be added later.
}

// You might also want types for customer creation payloads if they differ, e.g.:
// export type NewCustomerData = Omit<Customer, 'id' | 'loyaltyPoints' | 'createdAt' | 'updatedAt' | 'memberCode'> & {
//   memberCode?: string; // Make memberCode optional on creation, can be auto-generated
// };
