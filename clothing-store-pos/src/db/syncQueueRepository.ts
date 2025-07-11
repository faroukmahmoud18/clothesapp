// @/db/syncQueueRepository.ts
import { getDb } from './dbManager';
import { QueueItem, QueueItemStatus, SyncOperationType } from '@/sync/syncTypes';
import { v4 as uuidv4 } from 'uuid';

const rowToQueueItem = (row: any): QueueItem | undefined => {
  if (!row) return undefined;
  try {
    return {
      id: row.id,
      type: row.type as SyncOperationType,
      payload: JSON.parse(row.payload), // Assuming payload is stored as JSON string
      entityId: row.entityId,
      attempts: Number(row.attempts),
      lastAttemptAt: row.lastAttemptAt,
      status: row.status as QueueItemStatus,
      createdAt: row.createdAt,
      errorDetails: row.errorDetails,
    };
  } catch (error) {
    console.error(`[SyncQueueRepository] Error parsing payload for queue item ID ${row.id}:`, error);
    // Return item with raw payload or handle error differently
    return { ...row, payload: row.payload }; // Potentially problematic if payload isn't valid JSON
  }
};

export const dbAddQueueItem = (
  type: SyncOperationType,
  payload: any,
  entityId?: string
): QueueItem => {
  const db = getDb();
  const now = new Date().toISOString();
  const newItem: QueueItem = {
    id: uuidv4(),
    type,
    payload, // Will be stringified by stmt.run
    entityId,
    attempts: 0,
    status: 'PENDING',
    createdAt: now,
    lastAttemptAt: undefined, // Not attempted yet
    errorDetails: undefined,
  };

  const stmt = db.prepare(`
    INSERT INTO sync_queue (
      id, type, payload, entityId, attempts, status, createdAt, lastAttemptAt, errorDetails
    ) VALUES (
      @id, @type, @payload, @entityId, @attempts, @status, @createdAt, @lastAttemptAt, @errorDetails
    )
  `);

  try {
    stmt.run({
      ...newItem,
      payload: JSON.stringify(newItem.payload), // Stringify payload for DB
      lastAttemptAt: newItem.lastAttemptAt ?? null,
      errorDetails: newItem.errorDetails ?? null,
      entityId: newItem.entityId ?? null,
    });
    return newItem; // Return the object with potentially parsed payload (though here it's input payload)
  } catch (error) {
    console.error(`[SyncQueueRepository] Error in dbAddQueueItem for type ${type}:`, error);
    throw error;
  }
};

export const dbGetPendingQueueItems = (limit: number = 50): QueueItem[] => {
  const db = getDb();
  // Fetch PENDING or FAILED items, oldest first, or by attempts (less attempts first)
  const stmt = db.prepare(`
    SELECT * FROM sync_queue
    WHERE status = 'PENDING' OR status = 'FAILED'
    ORDER BY createdAt ASC, attempts ASC
    LIMIT ?
  `);
  try {
    const rows = stmt.all(limit);
    return rows.map(row => rowToQueueItem(row)).filter(item => item !== undefined) as QueueItem[];
  } catch (error) {
    console.error('[SyncQueueRepository] Error in dbGetPendingQueueItems:', error);
    throw error;
  }
};

export const dbUpdateQueueItem = (
  id: string,
  updates: {
    attempts?: number;
    lastAttemptAt?: string;
    status?: QueueItemStatus;
    errorDetails?: string | null; // Allow setting error to null
  }
): boolean => {
  const db = getDb();

  const setClauses: string[] = [];
  const params: any = { id };

  if (updates.attempts !== undefined) {
    setClauses.push('attempts = @attempts');
    params.attempts = updates.attempts;
  }
  if (updates.lastAttemptAt !== undefined) {
    setClauses.push('lastAttemptAt = @lastAttemptAt');
    params.lastAttemptAt = updates.lastAttemptAt;
  }
  if (updates.status !== undefined) {
    setClauses.push('status = @status');
    params.status = updates.status;
  }
  if (updates.errorDetails !== undefined) { // Allows setting errorDetails to null
    setClauses.push('errorDetails = @errorDetails');
    params.errorDetails = updates.errorDetails;
  }

  if (setClauses.length === 0) {
    console.warn('[SyncQueueRepository] dbUpdateQueueItem called with no updates.');
    return false;
  }

  const stmt = db.prepare(`UPDATE sync_queue SET ${setClauses.join(', ')} WHERE id = @id`);
  try {
    const result = stmt.run(params);
    return result.changes > 0;
  } catch (error) {
    console.error(`[SyncQueueRepository] Error updating queue item ID ${id}:`, error);
    throw error;
  }
};


export const dbRemoveQueueItem = (id: string): boolean => {
  const db = getDb();
  const stmt = db.prepare('DELETE FROM sync_queue WHERE id = ?');
  try {
    const result = stmt.run(id);
    return result.changes > 0;
  } catch (error) {
    console.error(`[SyncQueueRepository] Error removing queue item ID ${id}:`, error);
    throw error;
  }
};

// Not strictly needed per plan but good utility
export const dbGetQueueItemById = (id: string): QueueItem | undefined => {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM sync_queue WHERE id = ?');
  const row = stmt.get(id);
  return rowToQueueItem(row);
};

export const dbGetPendingQueueCount = (): number => {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT COUNT(id) as count FROM sync_queue
    WHERE status = 'PENDING' OR status = 'FAILED'
  `);
  try {
    const result = stmt.get() as { count: number };
    return result.count;
  } catch (error) {
    console.error('[SyncQueueRepository] Error in dbGetPendingQueueCount:', error);
    throw error;
  }
};
