// @/sync/syncService.ts

import { Product, Invoice } from '@/pos/types';
import * as mockApi from './mockApi'; // Import all exports from mockApi

// === Product Sync Services ===

export const getProducts = async (): Promise<Product[]> => {
  console.log('[SyncService] getProducts initiated');
  try {
    const products = await mockApi.fetchProducts();
    console.log('[SyncService] getProducts successful, count:', products.length);
    return products;
  } catch (error) {
    console.error('[SyncService] Error in getProducts:', error);
    // In a real app, handle this more gracefully, maybe return cached data or throw a custom error
    throw error;
  }
};

export const getProductById = async (id: string): Promise<Product | undefined> => {
  console.log(`[SyncService] getProductById initiated for ID: ${id}`);
  try {
    const product = await mockApi.fetchProductById(id);
    console.log(`[SyncService] getProductById successful for ID: ${id}`, product ? 'Found' : 'Not Found');
    return product;
  } catch (error) {
    console.error(`[SyncService] Error in getProductById for ID: ${id}:`, error);
    throw error;
  }
};

export const addProduct = async (productData: Omit<Product, 'id'>): Promise<Product> => {
  console.log('[SyncService] addProduct initiated with data:', productData);
  try {
    // In a real scenario, you might add more logic here, e.g., validation,
    // adding metadata before sending to API, or handling offline queuing.
    const newProduct = await mockApi.createProduct(productData);
    console.log('[SyncService] addProduct successful, new product:', newProduct);
    return newProduct;
  } catch (error) {
    console.error('[SyncService] Error in addProduct:', error);
    throw error;
  }
};

export const editProduct = async (productId: string, productUpdateData: Partial<Omit<Product, 'id'>>): Promise<Product | undefined> => {
  console.log(`[SyncService] editProduct initiated for ID: ${productId} with data:`, productUpdateData);
  try {
    const updatedProduct = await mockApi.updateProduct(productId, productUpdateData);
    console.log(`[SyncService] editProduct successful for ID: ${productId}`, updatedProduct ? 'Updated' : 'Not Found or Failed');
    return updatedProduct;
  } catch (error) {
    console.error(`[SyncService] Error in editProduct for ID: ${productId}:`, error);
    throw error;
  }
};

export const removeProduct = async (productId: string): Promise<boolean> => {
  console.log(`[SyncService] removeProduct initiated for ID: ${productId}`);
  try {
    const success = await mockApi.deleteProduct(productId);
    console.log(`[SyncService] removeProduct for ID: ${productId}`, success ? 'Successful' : 'Failed or Not Found');
    return success;
  } catch (error) {
    console.error(`[SyncService] Error in removeProduct for ID: ${productId}:`, error);
    throw error;
  }
};


// === Sales Sync Services ===

export const submitSale = async (saleData: Invoice): Promise<Invoice> => {
  console.log('[SyncService] submitSale initiated with data:', saleData);
  try {
    // Here you could add logic for offline handling: if offline, store locally.
    // If online, attempt to submit to mockApi.
    const recordedSale = await mockApi.recordSale(saleData);
    console.log('[SyncService] submitSale successful, recorded sale:', recordedSale);
    return recordedSale;
  } catch (error) {
    console.error('[SyncService] Error in submitSale:', error);
    // Handle offline queuing or error feedback
    throw error;
  }
};

export const getSalesHistory = async (params?: { branchId?: string; dateFrom?: string; dateTo?: string }): Promise<Invoice[]> => {
  console.log('[SyncService] getSalesHistory initiated with params:', params);
  try {
    const sales = await mockApi.fetchSales(params);
    console.log('[SyncService] getSalesHistory successful, count:', sales.length);
    return sales;
  } catch (error) {
    console.error('[SyncService] Error in getSalesHistory:', error);
    throw error;
  }
};

// More sync-related functions can be added here later, e.g.:
// - syncAllUnsyncedData()
// - checkServerStatus()
// - handleConflictResolution(localData, serverData)
