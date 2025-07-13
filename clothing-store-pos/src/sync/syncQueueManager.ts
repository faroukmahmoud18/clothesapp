// @/sync/syncQueueManager.ts
import * as syncQueueRepository from '@/db/syncQueueRepository';
import * as mockApi from './mockApi'; // To make the actual API calls
import { SyncOperationType, QueueItem } from './syncTypes';

export const addToQueue = async (
  type: SyncOperationType,
  payload: any,
  entityId?: string
): Promise<QueueItem> => {
  console.log(`[SyncQueueManager] Adding to queue: ${type}`, { entityId, payload });
  try {
    const newItem = syncQueueRepository.dbAddQueueItem(type, payload, entityId);
    console.log(`[SyncQueueManager] Item added to queue with ID: ${newItem.id}`);
    return newItem;
  } catch (error) {
    console.error(`[SyncQueueManager] Error adding item of type ${type} to queue:`, error);
    throw error; // Rethrow or handle more gracefully
  }
};

export const processQueue = async (): Promise<{ successCount: number; failureCount: number; totalProcessed: number }> => {
  console.log('[SyncQueueManager] Starting queue processing...');
  const itemsToProcess = syncQueueRepository.dbGetPendingQueueItems(10); // Process in batches of 10

  if (itemsToProcess.length === 0) {
    console.log('[SyncQueueManager] Queue is empty. Nothing to process.');
    return { successCount: 0, failureCount: 0, totalProcessed: 0 };
  }

  let successCount = 0;
  let failureCount = 0;

  for (const item of itemsToProcess) {
    console.log(`[SyncQueueManager] Processing item ID: ${item.id}, Type: ${item.type}`);
    syncQueueRepository.dbUpdateQueueItem(item.id, { status: 'PROCESSING' }); // Mark as processing

    try {
      let apiCallSuccessful = false;
      // Based on item.type, call the appropriate mockApi function
      switch (item.type) {
        case 'CREATE_PRODUCT':
          await mockApi.createProduct(item.payload); // Assumes payload is Omit<Product, 'id'|'branchId'>
          apiCallSuccessful = true;
          break;
        case 'UPDATE_PRODUCT':
          await mockApi.updateProduct(item.entityId!, item.payload); // Assumes entityId is productId, payload is Partial<Omit<Product,'id'>>
          apiCallSuccessful = true;
          break;
        case 'DELETE_PRODUCT':
          await mockApi.deleteProduct(item.entityId!); // Assumes entityId is productId
          apiCallSuccessful = true;
          break;
        case 'SUBMIT_SALE':
          await mockApi.recordSale(item.payload as any); // payload is Invoice
          // After successful API call for SUBMIT_SALE, update the original invoice's sync status
          if (item.entityId) { // entityId should be invoice.id for SUBMIT_SALE
            const invoiceRepository = await import('@/db/invoiceRepository');
            invoiceRepository.dbUpdateInvoiceSyncStatus(item.entityId, true);
          }
          apiCallSuccessful = true;
          break;
        case 'CREATE_CUSTOMER':
          await mockApi.createCustomer(item.payload);
          apiCallSuccessful = true;
          break;
        case 'UPDATE_CUSTOMER':
          await mockApi.updateCustomer(item.entityId!, item.payload);
          apiCallSuccessful = true;
          break;
        case 'UPDATE_CUSTOMER_LOYALTY':
          await mockApi.updateCustomerLoyaltyPointsApi(item.entityId!, item.payload.newPointsTotal); // Assuming payload = { newPointsTotal: number }
          apiCallSuccessful = true;
          break;
        default:
          console.warn(`[SyncQueueManager] Unknown queue item type: ${item.type}`);
          // Mark as failed to avoid reprocessing unknown types indefinitely
          syncQueueRepository.dbUpdateQueueItem(item.id, {
            status: 'FAILED',
            attempts: item.attempts + 1,
            lastAttemptAt: new Date().toISOString(),
            errorDetails: `Unknown item type: ${item.type}`,
          });
          failureCount++;
          continue; // Skip to next item
      }

      if (apiCallSuccessful) {
        console.log(`[SyncQueueManager] Successfully processed item ID: ${item.id} (Type: ${item.type}). Removing from queue.`);
        syncQueueRepository.dbRemoveQueueItem(item.id);
        successCount++;
      }
    } catch (error: any) {
      console.error(`[SyncQueueManager] Error processing item ID: ${item.id} (Type: ${item.type}):`, error);
      const MAX_RETRIES = 5;
      const newAttempts = item.attempts + 1;
      const newStatus = newAttempts >= MAX_RETRIES ? 'FAILED' : 'PENDING';

      syncQueueRepository.dbUpdateQueueItem(item.id, {
        status: newStatus,
        attempts: newAttempts,
        lastAttemptAt: new Date().toISOString(),
        errorDetails: error.message || 'Unknown error during processing',
      });
      failureCount++;
    }
  }
  console.log(`[SyncQueueManager] Queue processing finished. Success: ${successCount}, Failed: ${failureCount}`);
  return { successCount, failureCount, totalProcessed: itemsToProcess.length };
};

export const getPendingQueueCount = async (): Promise<number> => {
    return syncQueueRepository.dbGetPendingQueueCount();
};
