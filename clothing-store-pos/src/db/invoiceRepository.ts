// @/db/invoiceRepository.ts
import { getDb } from './dbManager';
import { Invoice, InvoiceItem, PaymentMethod } from '@/pos/types';

// Helper to convert DB row to Invoice
// Handles parsing of JSON fields
const rowToInvoice = (row: any): Invoice => {
  if (!row) return row; // Should not happen if called with valid row
  try {
    return {
      ...row,
      items: JSON.parse(row.items || '[]') as InvoiceItem[],
      paymentMethods: JSON.parse(row.paymentMethods || '[]') as Array<{ method: PaymentMethod; amount: number }>,
      createdAt: new Date(row.createdAt), // Convert ISO string back to Date object
      subtotal: Number(row.subtotal),
      invoiceDiscountAmount: row.invoiceDiscountAmount !== null ? Number(row.invoiceDiscountAmount) : undefined,
      taxTotal: Number(row.taxTotal),
      grandTotal: Number(row.grandTotal),
      amountPaid: Number(row.amountPaid),
      changeDue: row.changeDue !== null ? Number(row.changeDue) : undefined,
      synced: Boolean(row.synced), // Convert 0/1 from SQLite to boolean
    } as Invoice;
  } catch (error) {
    console.error(`[InvoiceRepository] Error parsing JSON for invoice ID ${row.id}:`, error);
    // Return a partially parsed row or throw, depending on desired error handling
    // For now, let's return the row as is, which might cause issues upstream if JSON is critical
    return { ...row, items: [], paymentMethods: [] } as Invoice; // Fallback with empty arrays
  }
};

export const dbAddInvoice = (invoice: Invoice): Invoice => {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO invoices (
      id, items, subtotal, invoiceDiscountAmount, taxTotal, grandTotal,
      paymentMethods, amountPaid, changeDue, createdAt, cashierId,
      branchId, customerId, status, synced
    ) VALUES (
      @id, @items, @subtotal, @invoiceDiscountAmount, @taxTotal, @grandTotal,
      @paymentMethods, @amountPaid, @changeDue, @createdAt, @cashierId,
      @branchId, @customerId, @status, @synced
    )
  `);

  try {
    // Ensure createdAt is ISO string for DB
    const createdAtISO = invoice.createdAt instanceof Date ? invoice.createdAt.toISOString() : invoice.createdAt;

    stmt.run({
      ...invoice,
      items: JSON.stringify(invoice.items),
      paymentMethods: JSON.stringify(invoice.paymentMethods),
      createdAt: createdAtISO,
      synced: invoice.synced ? 1 : 0, // Convert boolean to integer for SQLite
      invoiceDiscountAmount: invoice.invoiceDiscountAmount ?? null,
      changeDue: invoice.changeDue ?? null,
      cashierId: invoice.cashierId ?? null,
      branchId: invoice.branchId ?? null,
      customerId: invoice.customerId ?? null,
    });
    return invoice; // Return the input invoice as it was successfully inserted
  } catch (error) {
    console.error(`[InvoiceRepository] Error in dbAddInvoice for ID ${invoice.id}:`, error);
    throw error;
  }
};

export const dbGetInvoices = (params?: { branchId?: string; dateFrom?: string; dateTo?: string; synced?: boolean }): Invoice[] => {
  const db = getDb();
  let query = 'SELECT * FROM invoices';
  const queryParams: any[] = [];
  const conditions: string[] = [];

  if (params?.branchId) {
    conditions.push('branchId = ?');
    queryParams.push(params.branchId);
  }
  if (params?.dateFrom) {
    conditions.push('createdAt >= ?');
    queryParams.push(params.dateFrom); // Assuming dateFrom is ISO string
  }
  if (params?.dateTo) {
    conditions.push('createdAt <= ?');
    queryParams.push(params.dateTo); // Assuming dateTo is ISO string
  }
  if (params?.synced !== undefined) {
    conditions.push('synced = ?');
    queryParams.push(params.synced ? 1 : 0);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }
  query += ' ORDER BY createdAt DESC'; // Default ordering

  try {
    const stmt = db.prepare(query);
    const rows = stmt.all(...queryParams);
    return rows.map(rowToInvoice);
  } catch (error) {
    console.error('[InvoiceRepository] Error in dbGetInvoices:', error);
    throw error;
  }
};

export const dbGetInvoiceById = (id: string): Invoice | undefined => {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM invoices WHERE id = ?');
  try {
    const row = stmt.get(id);
    return row ? rowToInvoice(row) : undefined;
  } catch (error) {
    console.error(`[InvoiceRepository] Error in dbGetInvoiceById for ID ${id}:`, error);
    throw error;
  }
};

export const dbUpdateInvoiceSyncStatus = (invoiceId: string, synced: boolean): boolean => {
  const db = getDb();
  const stmt = db.prepare('UPDATE invoices SET synced = ? WHERE id = ?');
  try {
    const result = stmt.run(synced ? 1 : 0, invoiceId);
    return result.changes > 0;
  } catch (error) {
    console.error(`[InvoiceRepository] Error updating sync status for invoice ID ${invoiceId}:`, error);
    throw error;
  }
};

// Get all unsynced invoices (example utility function)
export const dbGetUnsyncedInvoices = (): Invoice[] => {
  return dbGetInvoices({ synced: false });
};
