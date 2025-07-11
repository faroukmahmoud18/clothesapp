// @/db/dbManager.ts
import Database from 'better-sqlite3';
// No longer need path and fs here for DB path construction if received from main.
// import path from 'path';
// import fs from 'fs';

// TODO: Define window.electronApi properly for TypeScript, e.g., in a global.d.ts file
// declare global {
//   interface Window {
//     electronApi: {
//       getDbPath: () => string | null;
//     };
//   }
// }

let dbInstance: Database.Database | null = null;
let resolvedDbPath: string | null = null;

export const getDb = (): Database.Database => {
  if (!resolvedDbPath) {
    // Access the path exposed by preload script
    // Need to cast window to any or define electronApi globally for TypeScript
    const pathFromPreload = (window as any).electronApi?.getDbPath();
    if (!pathFromPreload) {
      // This might happen if getDb is called before 'db-path' IPC message is received by preload
      // or if preload script didn't work as expected.
      console.error('[DBManager] DB path not available from preload. Ensure main process sends it and preload exposes it.');
      throw new Error('Database path not available. Application cannot initialize database.');
    }
    resolvedDbPath = pathFromPreload;
    console.log(`[DBManager] Using DB path from preload: ${resolvedDbPath}`);
  }

  if (!dbInstance) {
    if (!resolvedDbPath) { // Should be caught above, but as a safeguard
        throw new Error('DB path not resolved, cannot initialize database.');
    }
    try {
      console.log(`[DBManager] Attempting to open/create database at: ${resolvedDbPath}`);
      // The directory for resolvedDbPath (userData) should exist by default by Electron.
      // If it's a subdirectory, ensure it's created (main process could do this).
      // For now, better-sqlite3 will create the file if it doesn't exist, but not the directory.
      // Assuming the parent directory (userDataPath) exists.
      dbInstance = new Database(resolvedDbPath, { verbose: console.log /*, fileMustExist: false */ });
      console.log('[DBManager] Database connection established.');
      initializeDatabaseSchema(dbInstance);
    } catch (error) {
      console.error('[DBManager] Error connecting to SQLite database:', error);
      throw new Error(`Failed to initialize database: ${(error as Error).message}`);
    }
  }
  return dbInstance;
};

const initializeDatabaseSchema = (db: Database.Database) => {
  console.log('[DBManager] Initializing database schema...');

  // Products Table
  // Note: `branchId` was added to Product type.
  // `productTypeId` and `supplierId` reference other new tables.
  // `taxRate` on product is optional, specific tax rate.
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      sku TEXT NOT NULL UNIQUE,
      barcode TEXT UNIQUE,
      category TEXT,
      purchasePrice REAL DEFAULT 0,
      sellingPrice REAL NOT NULL DEFAULT 0,
      stockQuantity INTEGER NOT NULL DEFAULT 0,
      lowStockThreshold INTEGER DEFAULT 0,
      taxRate REAL,
      imageUrl TEXT,
      productTypeId TEXT,
      supplierId TEXT,
      branchId TEXT,
      lastStocktakeDate TEXT,
      notes TEXT,
      FOREIGN KEY (productTypeId) REFERENCES product_types(id),
      FOREIGN KEY (supplierId) REFERENCES suppliers(id),
      FOREIGN KEY (branchId) REFERENCES branches(id)
    );
  `);

  // Invoices Table
  // Storing items and paymentMethods as JSON strings for simplicity in this phase.
  // `status` field from Invoice type.
  // `cashierId` and `branchId` from Invoice type.
  db.exec(`
    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      items TEXT NOT NULL, -- JSON array of InvoiceItem
      subtotal REAL NOT NULL,
      invoiceDiscountAmount REAL DEFAULT 0,
      taxTotal REAL NOT NULL,
      grandTotal REAL NOT NULL,
      paymentMethods TEXT NOT NULL, -- JSON array of { method: PaymentMethod; amount: number }
      amountPaid REAL NOT NULL,
      changeDue REAL DEFAULT 0,
      createdAt TEXT NOT NULL, -- ISO8601 string
      cashierId TEXT,
      branchId TEXT,
      customerId TEXT,
      status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'voided', 'parked'
      synced INTEGER DEFAULT 0, -- 0 for false, 1 for true
      FOREIGN KEY (branchId) REFERENCES branches(id)
    );
  `);
  // Consider adding indexes for performance later, e.g., on invoice.createdAt, invoice.branchId

  // Product Types Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS product_types (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      taxRate REAL NOT NULL DEFAULT 0
    );
  `);

  // Suppliers Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS suppliers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      contactPerson TEXT,
      email TEXT,
      phone TEXT,
      address TEXT
    );
  `);

  // Branches Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS branches (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      location TEXT,
      contactPhone TEXT,
      ipAddress TEXT
    );
  `);

  // Customers Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT NOT NULL UNIQUE,
      email TEXT,
      memberCode TEXT UNIQUE,
      loyaltyPoints INTEGER NOT NULL DEFAULT 0,
      address TEXT,
      createdAt TEXT NOT NULL, -- ISO8601 string
      updatedAt TEXT NOT NULL, -- ISO8601 string
      branchId TEXT,
      FOREIGN KEY (branchId) REFERENCES branches(id)
    );
  `);
  // Consider indexes on customers.phone, customers.memberCode, customers.name

  // Sync Queue Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS sync_queue (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,                  -- e.g., 'CREATE_PRODUCT', 'SUBMIT_SALE'
      payload TEXT NOT NULL,               -- JSON string of the data for the API call
      entityId TEXT,                       -- Optional: ID of the entity (product, invoice, customer)
      attempts INTEGER NOT NULL DEFAULT 0,
      lastAttemptAt TEXT,                  -- ISO8601 string
      status TEXT NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'FAILED', 'PROCESSING'
      createdAt TEXT NOT NULL,               -- ISO8601 string
      errorDetails TEXT                    -- JSON string or text of the last error
    );
  `);
  // Consider indexes on sync_queue.status, sync_queue.createdAt, sync_queue.attempts

  console.log('[DBManager] Database schema initialization complete.');
};

// Close the database connection (e.g., on app quit)
export const closeDb = () => {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
    console.log('[DBManager] Database connection closed.');
  }
};

// Ensure DB is initialized when this module is first imported in a way that calls getDb()
// Or, explicitly call getDb() once during application setup.
// For example, in your main application setup file:
// import { getDb } from './db/dbManager';
// getDb(); // This will initialize it if not already done.
