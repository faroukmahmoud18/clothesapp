// @/sync/syncTypes.ts

export type SyncOperationType =
  | 'CREATE_PRODUCT'
  | 'UPDATE_PRODUCT'
  | 'DELETE_PRODUCT'
  | 'CREATE_CUSTOMER'
  | 'UPDATE_CUSTOMER'
  // | 'DELETE_CUSTOMER' // If needed
  | 'UPDATE_CUSTOMER_LOYALTY'
  | 'SUBMIT_SALE';
  // Add more types as operations are added to the queue

export type QueueItemStatus = 'PENDING' | 'FAILED' | 'PROCESSING' | 'SUCCESS'; // SUCCESS items are typically removed

export interface QueueItem {
  id: string; // UUID for the queue item itself
  type: SyncOperationType;
  payload: any; // JSON stringified version will be in DB, but here it's the actual object before stringification for add, or after parsing for get
  entityId?: string; // ID of the main entity being affected (e.g., product.id, invoice.id)
  attempts: number;
  lastAttemptAt?: string; // ISO8601 string
  status: QueueItemStatus;
  createdAt: string; // ISO8601 string
  errorDetails?: string; // Could be JSON string or plain text
}
