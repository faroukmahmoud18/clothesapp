// @/db/customerRepository.ts
import { getDb } from './dbManager';
import { Customer } from '@/customers/types';

// Helper to convert DB row to Customer
const rowToCustomer = (row: any): Customer | undefined => {
  if (!row) return undefined;
  return {
    ...row,
    loyaltyPoints: Number(row.loyaltyPoints),
    // Ensure any other numeric or boolean fields are correctly typed if necessary
  } as Customer;
};

export const dbAddCustomer = (customer: Customer): Customer => {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO customers (
      id, name, phone, email, memberCode, loyaltyPoints,
      address, createdAt, updatedAt, branchId
    ) VALUES (
      @id, @name, @phone, @email, @memberCode, @loyaltyPoints,
      @address, @createdAt, @updatedAt, @branchId
    )
  `);
  try {
    stmt.run({
      ...customer,
      email: customer.email ?? null,
      memberCode: customer.memberCode ?? null,
      address: customer.address ?? null,
      branchId: customer.branchId ?? null,
    });
    return customer;
  } catch (error) {
    console.error(`[CustomerRepository] Error in dbAddCustomer for ID ${customer.id}:`, error);
    throw error;
  }
};

export const dbGetCustomerById = (id: string): Customer | undefined => {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM customers WHERE id = ?');
  const row = stmt.get(id);
  return rowToCustomer(row);
};

export const dbGetCustomerByPhone = (phone: string): Customer | undefined => {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM customers WHERE phone = ?');
  const row = stmt.get(phone);
  return rowToCustomer(row);
};

export const dbGetCustomerByMemberCode = (code: string): Customer | undefined => {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM customers WHERE memberCode = ?');
  const row = stmt.get(code);
  return rowToCustomer(row);
};

export const dbUpdateCustomer = (id: string, data: Partial<Omit<Customer, 'id' | 'loyaltyPoints' | 'createdAt' | 'updatedAt'>> & { updatedAt: string }): Customer | undefined => {
  const db = getDb();

  // Build SET part of query dynamically for partial updates
  const fields = Object.keys(data).filter(key => key !== 'id' && key !== 'loyaltyPoints' && key !== 'createdAt'); // Exclude fields not directly updatable here
  const setClauses = fields.map(field => `${field} = @${field}`).join(', ');

  if (fields.length === 0) {
    console.warn('[CustomerRepository] dbUpdateCustomer called with no fields to update.');
    return dbGetCustomerById(id); // Return current state if nothing to update
  }

  const stmt = db.prepare(`
    UPDATE customers
    SET ${setClauses}
    WHERE id = @id
  `);

  try {
    const result = stmt.run({ ...data, id });
    if (result.changes > 0) {
      return dbGetCustomerById(id);
    }
    return undefined; // Not found or no changes made
  } catch (error) {
    console.error(`[CustomerRepository] Error in dbUpdateCustomer for ID ${id}:`, error);
    throw error;
  }
};

export const dbUpdateCustomerLoyaltyPoints = (customerId: string, newPointsTotal: number, updatedAt: string): boolean => {
  const db = getDb();
  const stmt = db.prepare('UPDATE customers SET loyaltyPoints = ?, updatedAt = ? WHERE id = ?');
  try {
    const result = stmt.run(newPointsTotal, updatedAt, customerId);
    return result.changes > 0;
  } catch (error) {
    console.error(`[CustomerRepository] Error updating loyalty points for customer ID ${customerId}:`, error);
    throw error;
  }
};

export const dbGetAllCustomers = (params?: { searchQuery?: string; branchId?: string }): Customer[] => {
  const db = getDb();
  let query = 'SELECT * FROM customers';
  const queryValues: any[] = [];
  const conditions: string[] = [];

  if (params?.searchQuery) {
    conditions.push('(name LIKE ? OR phone LIKE ? OR memberCode LIKE ?)');
    const likeQuery = `%${params.searchQuery}%`;
    queryValues.push(likeQuery, likeQuery, likeQuery);
  }
  if (params?.branchId) {
    conditions.push('branchId = ?');
    queryValues.push(params.branchId);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }
  query += ' ORDER BY name ASC';

  try {
    const stmt = db.prepare(query);
    const rows = stmt.all(...queryValues);
    return rows.map(row => rowToCustomer(row)).filter(c => c !== undefined) as Customer[];
  } catch (error) {
    console.error('[CustomerRepository] Error in dbGetAllCustomers:', error);
    throw error;
  }
};
