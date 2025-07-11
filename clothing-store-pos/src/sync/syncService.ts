// @/sync/syncService.ts

import { Product, Invoice, InvoiceItem } from '@/pos/types'; // Added InvoiceItem
import * as mockApi from './mockApi'; // Import all exports from mockApi
import * as productRepository from '@/db/productRepository'; // Import productRepository
import * as invoiceRepository from '@/db/invoiceRepository'; // Import invoiceRepository
import {
  DailySalesReportData,
  SalesSummaryReportData,
  CurrentInventoryReportData,
  SalesReportMetrics, // For internal use
  PaymentMethodSummary,
  // TopSellingProduct, // If we implement it
} from '@/reports/types';
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


// === Reporting Services ===

// Helper to get start and end of a given date string (YYYY-MM-DD)
const getDayBoundaries = (dateStr: string): { startOfDay: string, endOfDay: string } => {
    // Assuming dateStr is 'YYYY-MM-DD'
    const startOfDay = new Date(`${dateStr}T00:00:00.000Z`).toISOString();
    const endOfDay = new Date(`${dateStr}T23:59:59.999Z`).toISOString();
    return { startOfDay, endOfDay };
};

export const getSalesSummaryReport = async (
  dateFrom: string, // Expected format 'YYYY-MM-DD' or full ISO string
  dateTo: string,   // Expected format 'YYYY-MM-DD' or full ISO string
  branchId?: string
): Promise<SalesSummaryReportData> => {
  console.log(`[SyncService] getSalesSummaryReport initiated for ${dateFrom} - ${dateTo}, branch: ${branchId}`);

  // Adjust dates to be full ISO strings if only date part is provided
  const queryDateFrom = dateFrom.includes('T') ? dateFrom : getDayBoundaries(dateFrom).startOfDay;
  const queryDateTo = dateTo.includes('T') ? dateTo : getDayBoundaries(dateTo).endOfDay;

  try {
    // 1. Get SQL aggregated data
    const aggData = invoiceRepository.dbGetAggregatedSalesQuery(queryDateFrom, queryDateTo, branchId);

    // 2. Fetch all invoices in range to calculate metrics not easily done in SQL (due to JSON items)
    // We must ensure dbGetInvoices filters by status='completed' if aggData does
    const relevantInvoices = invoiceRepository.dbGetInvoices({
      dateFrom: queryDateFrom,
      dateTo: queryDateTo,
      branchId
      // TODO: Ensure dbGetInvoices can filter by status or filter here:
    }).filter(inv => inv.status === 'completed');

    let totalItemsSold = 0;
    let totalItemLevelDiscounts = 0;

    relevantInvoices.forEach(invoice => {
      invoice.items.forEach((item: InvoiceItem) => {
        totalItemsSold += item.quantity;
        totalItemLevelDiscounts += (item.discountAmount || 0);
      });
    });

    const totalDiscounts = totalItemLevelDiscounts + aggData.sumInvoiceDiscountAmount;

    // totalNetSales = sum of (invoice.subtotal - invoice.invoiceDiscountAmount)
    // invoice.subtotal is sum of (item.lineTotal) which is (qty * price - itemDiscount)
    // So, aggData.sumSubtotalBeforeInvoiceDiscount is SUM(invoice.subtotal which is post-item-discount)
    // And aggData.sumInvoiceDiscountAmount is SUM(invoice.invoiceDiscountAmount)
    // So, totalNetSales = aggData.sumSubtotalBeforeInvoiceDiscount - aggData.sumInvoiceDiscountAmount
    const totalNetSales = aggData.sumSubtotalBeforeInvoiceDiscount - aggData.sumInvoiceDiscountAmount;


    // 3. Get payment method breakdown
    const paymentMethodBreakdown = invoiceRepository.dbGetSalesByPaymentMethodQuery(queryDateFrom, queryDateTo, branchId);

    // 4. Assemble report
    const reportData: SalesSummaryReportData = {
      dateFrom: dateFrom, // Original dateFrom for display
      dateTo: dateTo,     // Original dateTo for display
      totalInvoices: aggData.totalInvoices,
      totalItemsSold,
      totalDiscounts,
      totalTax: aggData.sumTaxTotal || 0,
      totalNetSales: totalNetSales,
      totalGrossSales: aggData.sumGrandTotal || 0,
      paymentMethodBreakdown,
      // topSellingProducts: [], // TODO if time permits or for next iteration
    };
    console.log('[SyncService] getSalesSummaryReport successful.');
    return reportData;

  } catch (error) {
    console.error('[SyncService] Error in getSalesSummaryReport:', error);
    throw error;
  }
};


export const getDailySalesReport = async (
  date: string, // YYYY-MM-DD
  branchId?: string
): Promise<DailySalesReportData> => {
  console.log(`[SyncService] getDailySalesReport initiated for ${date}, branch: ${branchId}`);
  const { startOfDay, endOfDay } = getDayBoundaries(date);

  try {
    const summaryReport = await getSalesSummaryReport(startOfDay, endOfDay, branchId);

    const dailyReport: DailySalesReportData = {
      date: date,
      ...summaryReport, // Spread all metrics from summary
    };
    console.log('[SyncService] getDailySalesReport successful.');
    return dailyReport;
  } catch (error) {
    console.error(`[SyncService] Error in getDailySalesReport for date ${date}:`, error);
    throw error;
  }
};


export const getCurrentInventoryReport = async (branchId?: string): Promise<CurrentInventoryReportData> => {
  console.log(`[SyncService] getCurrentInventoryReport initiated, branch: ${branchId}`);
  try {
    const repoData = productRepository.dbGetInventoryReportData(branchId);
    const reportData: CurrentInventoryReportData = {
      generatedAt: new Date().toISOString(),
      totalItems: repoData.totalItemsCount,
      totalUniqueProducts: repoData.totalUniqueProducts,
      overallTotalValueAtCost: repoData.overallTotalValueAtCost,
      overallTotalValueAtSellingPrice: repoData.overallTotalValueAtSellingPrice,
      items: repoData.items,
      // lowStockItems: productRepository.dbGetLowStockItems(branchId) // Optionally include this
    };
    console.log('[SyncService] getCurrentInventoryReport successful.');
    return reportData;
  } catch (error) {
    console.error('[SyncService] Error in getCurrentInventoryReport:', error);
    throw error;
  }
};
