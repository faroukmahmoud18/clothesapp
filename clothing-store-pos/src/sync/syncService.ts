// @/sync/syncService.ts

import { Product, Invoice } from '@/pos/types';
import * as mockApi from './mockApi'; // Import all exports from mockApi
import * as productRepository from '@/db/productRepository'; // Import productRepository
import * as invoiceRepository from '@/db/invoiceRepository'; // Import invoiceRepository
import { v4 as uuidv4 } from 'uuid'; // For generating local IDs if needed

// === Product Sync Services ===

export const getProducts = async (): Promise<Product[]> => {
  console.log('[SyncService] getProducts initiated');
  try {
    let localProducts = productRepository.dbGetAllProducts();
    if (localProducts.length === 0) { // Or some other condition for initial sync / force refresh
      console.log('[SyncService] No local products found or refresh needed. Fetching from API.');
      const apiProducts = await mockApi.fetchProducts();
      if (apiProducts && apiProducts.length > 0) {
        productRepository.dbUpsertProductsBatch(apiProducts); // Save/update fetched products to local DB
        console.log(`[SyncService] Synced ${apiProducts.length} products from API to local DB.`);
        localProducts = apiProducts; // Use API products for this return
      }
    }
    console.log('[SyncService] getProducts successful, count:', localProducts.length);
    return localProducts;
  } catch (error) {
    console.error('[SyncService] Error in getProducts:', error);
    // Fallback to local data if API fails but local data exists? Or throw?
    // For now, if error occurs during API fetch & DB upsert, it might throw.
    // If only API fails after local fetch, local data is returned.
    // If local fetch fails, it throws.
    throw error; // Rethrow for UI to handle
  }
};

export const getProductById = async (id: string): Promise<Product | undefined> => {
  console.log(`[SyncService] getProductById initiated for ID: ${id}`);
  try {
    // Primarily fetch from local DB for speed after initial sync
    const product = productRepository.dbGetProductById(id);
    console.log(`[SyncService] getProductById from DB for ID: ${id}`, product ? 'Found' : 'Not Found');
    // Optionally, could add logic here to fetch from API if not found locally, then cache.
    // For now, assume what's in DB is the source of truth for reads post-initial sync.
    return product;
  } catch (error) {
    console.error(`[SyncService] Error in getProductById for ID: ${id}:`, error);
    throw error;
  }
};

export const addProduct = async (productData: Omit<Product, 'id' | 'branchId'> & { branchId?: string }): Promise<Product> => {
  console.log('[SyncService] addProduct initiated with data:', productData);

  // Create a full product object with a local ID first for DB insertion
  const localProduct: Product = {
    ...productData,
    id: uuidv4(), // Generate local ID
    branchId: productData.branchId || 'branch_001', // Ensure branchId, default if not provided
    // Ensure all other required fields for Product type are present or defaulted if necessary
    category: productData.category || 'Uncategorized',
    purchasePrice: productData.purchasePrice || 0,
    sellingPrice: productData.sellingPrice || 0,
    stockQuantity: productData.stockQuantity || 0,
  };

  try {
    const dbSavedProduct = productRepository.dbAddProduct(localProduct);
    console.log('[SyncService] Product saved to local DB:', dbSavedProduct);

    // Asynchronously try to sync with the mock API (fire-and-forget for now)
    mockApi.createProduct(productData) // Pass original Omit<Product,'id'> data
      .then(apiProduct => console.log('[SyncService] API createProduct success:', apiProduct))
      .catch(err => console.error('[SyncService] API createProduct error:', err));

    return dbSavedProduct; // Return product from DB (with local ID)
  } catch (error) {
    console.error('[SyncService] Error saving product to local DB:', error);
    throw error;
  }
};

export const editProduct = async (productId: string, productUpdateData: Partial<Omit<Product, 'id'>>): Promise<Product | undefined> => {
  console.log(`[SyncService] editProduct initiated for ID: ${productId} with data:`, productUpdateData);
  try {
    const updatedDbProduct = productRepository.dbUpdateProduct(productId, productUpdateData);
    if (updatedDbProduct) {
      console.log('[SyncService] Product updated in local DB:', updatedDbProduct);
      // Async API call
      mockApi.updateProduct(productId, productUpdateData)
        .then(apiProduct => console.log('[SyncService] API updateProduct success:', apiProduct))
        .catch(err => console.error('[SyncService] API updateProduct error:', err));
    } else {
      console.warn(`[SyncService] Product ID ${productId} not found in local DB for update.`);
    }
    return updatedDbProduct;
  } catch (error) {
    console.error(`[SyncService] Error updating product in local DB (ID: ${productId}):`, error);
    throw error;
  }
};

export const removeProduct = async (productId: string): Promise<boolean> => {
  console.log(`[SyncService] removeProduct initiated for ID: ${productId}`);
  try {
    const successInDb = productRepository.dbDeleteProduct(productId);
    if (successInDb) {
      console.log(`[SyncService] Product ID ${productId} deleted from local DB.`);
      // Async API call
      mockApi.deleteProduct(productId)
        .then(apiSuccess => console.log(`[SyncService] API deleteProduct for ID ${productId} success: ${apiSuccess}`))
        .catch(err => console.error(`[SyncService] API deleteProduct for ID ${productId} error:`, err));
    } else {
      console.warn(`[SyncService] Product ID ${productId} not found in local DB for deletion.`);
    }
    return successInDb;
  } catch (error)
    console.error(`[SyncService] Error deleting product from local DB (ID: ${productId}):`, error);
    throw error;
  }
};


// === Sales Sync Services ===

export const submitSale = async (saleData: Invoice): Promise<Invoice> => {
  console.log('[SyncService] submitSale initiated with data:', saleData);

  const localInvoiceData: Invoice = {
    ...saleData,
    id: saleData.id || uuidv4(), // Ensure ID exists
    synced: false, // Mark as unsynced initially
  };

  try {
    const dbSavedInvoice = invoiceRepository.dbAddInvoice(localInvoiceData);
    console.log('[SyncService] Sale saved to local DB:', dbSavedInvoice);

    // Asynchronously try to sync with the mock API
    mockApi.recordSale(dbSavedInvoice) // Pass the locally saved invoice data (with ID)
      .then(apiInvoice => {
        console.log('[SyncService] API recordSale success:', apiInvoice);
        // If API call is successful, update sync status in local DB
        invoiceRepository.dbUpdateInvoiceSyncStatus(dbSavedInvoice.id, true);
        console.log(`[SyncService] Updated sync status for invoice ID ${dbSavedInvoice.id} to true.`);
      })
      .catch(err => {
        console.error('[SyncService] API recordSale error:', err);
        // Keep synced as false. A background process could retry later.
      });

    return dbSavedInvoice; // Return invoice from DB
  } catch (error) {
    console.error('[SyncService] Error saving sale to local DB:', error);
    throw error;
  }
};

export const getSalesHistory = async (params?: { branchId?: string; dateFrom?: string; dateTo?: string }): Promise<Invoice[]> => {
  console.log('[SyncService] getSalesHistory initiated with params:', params);
  try {
    // Fetch directly from local DB
    const sales = invoiceRepository.dbGetInvoices(params);
    console.log('[SyncService] getSalesHistory from DB successful, count:', sales.length);
    return sales;
  } catch (error) {
    console.error('[SyncService] Error in getSalesHistory from DB:', error);
    throw error;
  }
};

// More sync-related functions can be added here later, e.g.:
// - syncAllUnsyncedData()
// - checkServerStatus()
// - handleConflictResolution(localData, serverData)
