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
import { Customer } from '@/customers/types'; // Import Customer type
import * as customerRepository from '@/db/customerRepository'; // Import customerRepository
import * as syncQueueManager from './syncQueueManager'; // Import syncQueueManager
import { v4 as uuidv4 } from 'uuid'; // For generating local IDs if needed

// === Loyalty Configuration ===
export const LOYALTY_POINTS_PER_AMOUNT = 1; // e.g., 1 point
export const LOYALTY_AMOUNT_FOR_POINTS = 10; // e.g., per 10 EGP spent

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


// === Customer Sync Services ===

export const registerCustomer = async (
  customerData: Omit<Customer, 'id' | 'loyaltyPoints' | 'createdAt' | 'updatedAt' | 'memberCode'> & { memberCode?: string, branchId?: string }
): Promise<Customer> => {
  console.log('[SyncService] registerCustomer initiated with data:', customerData);
  const now = new Date().toISOString();
  const newCustomer: Customer = {
    id: uuidv4(),
    name: customerData.name,
    phone: customerData.phone,
    email: customerData.email,
    memberCode: customerData.memberCode || `MC-${Date.now().toString().slice(-6)}`, // Auto-generate if not provided
    loyaltyPoints: 0,
    address: customerData.address,
    createdAt: now,
    updatedAt: now,
    branchId: customerData.branchId // Can be undefined
  };

  try {
    const dbSavedCustomer = customerRepository.dbAddCustomer(newCustomer);
    console.log('[SyncService] Customer saved to local DB:', dbSavedCustomer);

    // Async API call
    mockApi.createCustomer(customerData) // Pass original data for API (which doesn't have the local ID)
      .then(apiCustomer => {
        console.log('[SyncService] API createCustomer success:', apiCustomer);
        // Potentially update local customer with API ID or mark as synced
      })
      .catch(async (err) => {
        console.error('[SyncService] API createCustomer error, adding to queue:', err);
        try {
          // Queue with the full customer object saved locally (includes local ID)
          await syncQueueManager.addToQueue('CREATE_CUSTOMER', dbSavedCustomer, dbSavedCustomer.id);
        } catch (qErr) {
          console.error(`[SyncService] Failed to add CREATE_CUSTOMER (ID: ${dbSavedCustomer.id}) to queue:`, qErr);
        }
      });

    return dbSavedCustomer;
  } catch (error) {
    console.error('[SyncService] Error saving customer to local DB:', error);
    throw error;
  }
};

export const findCustomer = async (identifier: string): Promise<Customer | undefined> => {
  console.log(`[SyncService] findCustomer initiated for identifier: ${identifier}`);
  try {
    // Try finding by phone first, then by member code
    let customer = customerRepository.dbGetCustomerByPhone(identifier);
    if (!customer) {
      customer = customerRepository.dbGetCustomerByMemberCode(identifier);
    }
    // Could also add search by name if identifier is not numeric/specific format
    // For now, this primarily targets phone/memberCode

    // Optionally, sync with API if not found locally or if data is stale (more advanced)
    // if (!customer) {
    //   const apiCustomers = await mockApi.fetchCustomers(identifier);
    //   if (apiCustomers.length > 0) {
    //      customer = apiCustomers[0]; // Assume first match is best for now
    //      customerRepository.dbAddCustomer(customer); // Cache it
    //   }
    // }
    console.log(`[SyncService] findCustomer from DB for identifier: ${identifier}`, customer ? 'Found' : 'Not Found');
    return customer;
  } catch (error) {
    console.error(`[SyncService] Error in findCustomer for identifier: ${identifier}:`, error);
    throw error;
  }
};

export const getCustomers = async (searchQuery?: string, branchId?: string): Promise<Customer[]> => {
    console.log(`[SyncService] getCustomers initiated. Query: "${searchQuery}", Branch: ${branchId}`);
    try {
        // For now, primarily rely on local DB.
        // Could implement logic to fetch from API and update local DB if needed.
        const customers = customerRepository.dbGetAllCustomers({ searchQuery, branchId });
        console.log(`[SyncService] getCustomers from DB successful, count: ${customers.length}`);
        return customers;
    } catch (error) {
        console.error('[SyncService] Error in getCustomers:', error);
        throw error;
    }
};


export const updateCustomerDetails = async (
  customerId: string,
  data: Partial<Omit<Customer, 'id' | 'loyaltyPoints' | 'createdAt' | 'updatedAt'>>
): Promise<Customer | undefined> => {
  console.log(`[SyncService] updateCustomerDetails for ID: ${customerId} with data:`, data);
  const customerUpdateDataWithTimestamp = { ...data, updatedAt: new Date().toISOString() };
  try {
    const updatedDbCustomer = customerRepository.dbUpdateCustomer(customerId, customerUpdateDataWithTimestamp);
    if (updatedDbCustomer) {
      console.log('[SyncService] Customer updated in local DB:', updatedDbCustomer);
      mockApi.updateCustomer(customerId, data) // Pass original data for API
        .then(apiCust => console.log('[SyncService] API updateCustomer success:', apiCust))
        .catch(async (err) => {
          console.error(`[SyncService] API updateCustomer error for ID ${customerId}, adding to queue:`, err);
          try {
            await syncQueueManager.addToQueue('UPDATE_CUSTOMER', data, customerId);
          } catch (qErr) {
            console.error(`[SyncService] Failed to add UPDATE_CUSTOMER (ID: ${customerId}) to queue:`, qErr);
          }
        });
    } else {
      console.warn(`[SyncService] Customer ID ${customerId} not found in local DB for update.`);
    }
    return updatedDbCustomer;
  } catch (error) {
    console.error(`[SyncService] Error updating customer in local DB (ID: ${customerId}):`, error);
    throw error;
  }
};

export const addLoyaltyPointsForSale = async (customerId: string, saleAmount: number): Promise<boolean> => {
  console.log(`[SyncService] addLoyaltyPointsForSale for customer ${customerId}, sale amount ${saleAmount}`);
  if (saleAmount <= 0 || LOYALTY_AMOUNT_FOR_POINTS <= 0) {
    return false; // No points for zero/negative sale or invalid config
  }

  const pointsToAdd = Math.floor(saleAmount / LOYALTY_AMOUNT_FOR_POINTS) * LOYALTY_POINTS_PER_AMOUNT;
  if (pointsToAdd <= 0) {
    console.log('[SyncService] No loyalty points to add for this sale amount.');
    return false;
  }

  try {
    const customer = customerRepository.dbGetCustomerById(customerId);
    if (!customer) {
      console.error(`[SyncService] Customer ${customerId} not found for adding loyalty points.`);
      return false;
    }

    const newPointsTotal = customer.loyaltyPoints + pointsToAdd;
    const successInDb = customerRepository.dbUpdateCustomerLoyaltyPoints(customerId, newPointsTotal, new Date().toISOString());

    if (successInDb) {
      console.log(`[SyncService] Updated loyalty points for ${customerId} to ${newPointsTotal} in DB.`);
      // Async API call
      mockApi.updateCustomerLoyaltyPointsApi(customerId, newPointsTotal)
        .then(apiCust => console.log(`[SyncService] API updateCustomerLoyaltyPoints success for ${customerId}:`, apiCust))
        .catch(async (err) => {
          console.error(`[SyncService] API updateCustomerLoyaltyPoints error for ${customerId}, adding to queue:`, err);
          try {
            // The payload for the queue should be what the API expects or what the queue processor needs.
            // Here, it's the new total points.
            await syncQueueManager.addToQueue('UPDATE_CUSTOMER_LOYALTY', { customerId, newPointsTotal }, customerId);
          } catch (qErr) {
            console.error(`[SyncService] Failed to add UPDATE_CUSTOMER_LOYALTY (ID: ${customerId}) to queue:`, qErr);
          }
        });
      return true;
    } else {
      console.error(`[SyncService] Failed to update loyalty points for ${customerId} in DB.`);
      return false;
    }
  } catch (error) {
    console.error(`[SyncService] Error adding loyalty points for customer ${customerId}:`, error);
    throw error; // Or return false
  }
};

export const addProductsBatch = async (
  productsData: Array<Omit<Product, 'id' | 'branchId'> & { branchId?: string }>
): Promise<{ successCount: number; errorCount: number; errors: Array<{ productData: any; error: string }> }> => {
  console.log(`[SyncService] addProductsBatch initiated with ${productsData.length} products.`);
  const results = { successCount: 0, errorCount: 0, errors: [] as Array<{ productData: any; error: string }> };

  const productsToInsert: Product[] = productsData.map(pd => ({
    ...pd,
    id: uuidv4(), // Generate local ID
    branchId: pd.branchId || 'branch_001', // Default branch or ensure it's provided
    category: pd.category || 'Uncategorized',
    purchasePrice: pd.purchasePrice || 0,
    sellingPrice: pd.sellingPrice || 0, // Should be required by validation though
    stockQuantity: pd.stockQuantity || 0,
    // Ensure all required Product fields have defaults if not in Omit type
    name: pd.name || 'Unnamed Product', // Should be required by validation
    sku: pd.sku || `SKU-${Date.now()}-${Math.random()}`, // Should be required & unique
  }));

  try {
    productRepository.dbUpsertProductsBatch(productsToInsert); // This handles individual errors by logging them
    results.successCount = productsToInsert.length; // Assume all DB inserts are successful for now with upsert
    console.log(`[SyncService] Batch of ${productsToInsert.length} products upserted to local DB.`);

    // Async API call for the batch
    // mockApi.createProductsBatch is designed to take Omit<Product, 'id' | 'branchId'>[]
    // We need to pass the original productsData or strip IDs from productsToInsert
    mockApi.createProductsBatch(productsData)
      .then(apiResult => {
        console.log('[SyncService] API createProductsBatch finished:', apiResult);
        if (apiResult.errorCount > 0) {
          // Handle partial failures from API batch: queue only the failed ones
          apiResult.results.forEach(async (itemOrError) => {
            if ('error' in itemOrError) { // Type guard for error object
              const originalFailedData = itemOrError.data as Omit<Product, 'id' | 'branchId'>;
              // Find the corresponding locally saved product to get its local ID for the queue
              const locallySavedProduct = productsToInsert.find(p => p.sku === originalFailedData.sku); // Assuming SKU is a good enough match here
              if (locallySavedProduct) {
                console.warn(`[SyncService] API createProductsBatch item failed for SKU ${originalFailedData.sku}, adding to queue.`);
                try {
                  await syncQueueManager.addToQueue('CREATE_PRODUCT', locallySavedProduct, locallySavedProduct.id);
                } catch (qErr) {
                  console.error(`[SyncService] Failed to add failed batch item (SKU: ${originalFailedData.sku}) to queue:`, qErr);
                }
              }
            }
          });
        }
      })
      .catch(async (batchErr) => { // If the whole batch API call fails
        console.error('[SyncService] API createProductsBatch error, adding all items to queue:', batchErr);
        for (const product of productsToInsert) {
          try {
            await syncQueueManager.addToQueue('CREATE_PRODUCT', product, product.id);
          } catch (qErr) {
            console.error(`[SyncService] Failed to add product (ID: ${product.id}) from failed batch to queue:`, qErr);
          }
        }
      });

  } catch (dbError) {
    console.error('[SyncService] Error batch saving products to local DB:', dbError);
    results.errorCount = productsData.length; // All failed if DB batch fails
    productsData.forEach(pd => results.errors.push({productData: pd, error: (dbError as Error).message || "DB batch save error"}));
    // Do not attempt API call if DB save failed
  }
  return results;
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

    // Asynchronously try to sync with the mock API
    mockApi.createProduct(productData) // Pass original data for API (without local ID)
      .then(apiProduct => {
        console.log('[SyncService] API createProduct success:', apiProduct);
        // Optionally, update localProduct with apiProduct.id if they differ and it's important
        // Or mark localProduct as synced if the API version is considered canonical
      })
      .catch(async (err) => { // Make catch async
        console.error('[SyncService] API createProduct error, adding to queue:', err);
        try {
          // Queue the operation with the locally saved product data (which includes the local ID)
          await syncQueueManager.addToQueue('CREATE_PRODUCT', localProduct, localProduct.id);
        } catch (qErr) {
          console.error('[SyncService] Failed to add CREATE_PRODUCT to queue:', qErr);
        }
      });

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
        .catch(async (err) => {
          console.error(`[SyncService] API updateProduct error for ID ${productId}, adding to queue:`, err);
          try {
            // Queue the update operation. Payload should be the intended update data.
            await syncQueueManager.addToQueue('UPDATE_PRODUCT', productUpdateData, productId);
          } catch (qErr) {
            console.error(`[SyncService] Failed to add UPDATE_PRODUCT (ID: ${productId}) to queue:`, qErr);
          }
        });
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
        .catch(async (err) => {
          console.error(`[SyncService] API deleteProduct error for ID ${productId}, adding to queue:`, err);
          try {
            // For delete, payload might be minimal or just the ID if API designed that way.
            // Here, we queue the entityId, and the queue processor knows it's a delete.
            await syncQueueManager.addToQueue('DELETE_PRODUCT', { id: productId }, productId);
          } catch (qErr) {
            console.error(`[SyncService] Failed to add DELETE_PRODUCT (ID: ${productId}) to queue:`, qErr);
          }
        });
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
      .catch(async (err) => { // Make catch async
        console.error('[SyncService] API recordSale error, adding to queue:', err);
        // The invoice is already in DB, marked as synced: false.
        // We queue the operation to attempt submitting this specific invoice again.
        try {
          await syncQueueManager.addToQueue('SUBMIT_SALE', dbSavedInvoice, dbSavedInvoice.id);
        } catch (qErr) {
          console.error(`[SyncService] Failed to add SUBMIT_SALE (ID: ${dbSavedInvoice.id}) to queue:`, qErr);
        }
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
