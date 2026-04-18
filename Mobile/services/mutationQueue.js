import AsyncStorage from '@react-native-async-storage/async-storage';
import logger from '../utils/logger';

const log = logger.create('MutationQueue');
const QUEUE_KEY = 'setgo_mutation_queue';

/**
 * Lightweight offline mutation queue backed by AsyncStorage.
 *
 * When the device is offline and a mutation fails, call enqueue() to save it.
 * When the device comes back online, call flush() to replay all queued mutations.
 *
 * Each item shape: { id, type, payload, enqueuedAt }
 * Supported types: 'SHOP_FOLLOW_TOGGLE'
 */

const loadQueue = async () => {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveQueue = async (queue) => {
  try {
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch (err) {
    log.error('Failed to save mutation queue', err);
  }
};

export const enqueue = async (type, payload) => {
  const queue = await loadQueue();
  queue.push({ id: `${Date.now()}-${Math.random()}`, type, payload, enqueuedAt: Date.now() });
  await saveQueue(queue);
  log.info('Queued mutation:', type, payload);
};

export const getQueue = loadQueue;

export const clearQueue = async () => {
  await AsyncStorage.removeItem(QUEUE_KEY);
};

/**
 * Replay all queued mutations.
 * Pass an executor map: { [type]: async (payload) => void }
 * Successfully replayed items are removed; failed items stay in the queue.
 */
export const flush = async (executors) => {
  const queue = await loadQueue();
  if (!queue.length) return;

  log.info(`Flushing ${queue.length} queued mutations`);

  const remaining = [];

  for (const item of queue) {
    const exec = executors[item.type];
    if (!exec) {
      log.warn('No executor for queued type:', item.type, '— dropping');
      continue;
    }
    try {
      await exec(item.payload);
      log.info('Replayed mutation:', item.type);
    } catch (err) {
      log.error('Failed to replay mutation:', item.type, err);
      remaining.push(item);
    }
  }

  await saveQueue(remaining);
};
