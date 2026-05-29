import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';
import dotenv from 'dotenv';
import { businessLogic } from '../services/businessLogic.js';

dotenv.config();

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Create Redis connection
const connection = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false
});

// Queue names
export const QUEUE_NAMES = {
  RESERVATION_CREATED: 'reservation-created',
  CHECK_IN: 'check-in',
  CHECK_OUT: 'check-out',
  ROOM_MOVE: 'room-move'
};

// Create queues
export const queues = {};

export async function initializeQueues() {
  // Create a connection config
  const queueConnection = {
    connection: new Redis(REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false
    })
  };

  // Create queues
  queues.reservationCreated = new Queue(QUEUE_NAMES.RESERVATION_CREATED, queueConnection);
  queues.checkIn = new Queue(QUEUE_NAMES.CHECK_IN, queueConnection);
  queues.checkOut = new Queue(QUEUE_NAMES.CHECK_OUT, queueConnection);
  queues.roomMove = new Queue(QUEUE_NAMES.ROOM_MOVE, queueConnection);

  console.log('All queues initialized');
  return queues;
}

// Add job helpers
export async function addJob(queueName, data) {
  const queue = queues[queueName];
  if (!queue) {
    throw new Error(`Queue not found: ${queueName}`);
  }

  const job = await queue.add(queueName, data, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000
    },
    removeOnComplete: 100,
    removeOnFail: 1000
  });

  console.log(`Job added to ${queueName}:`, job.id);
  return job;
}

// Job processors
const jobProcessors = {
  [QUEUE_NAMES.RESERVATION_CREATED]: async (job) => {
    const { reservationId, roomId, guestName, checkIn, checkOut } = job.data;
    console.log(`Processing reservation created: ${reservationId}`);
    return await businessLogic.handleReservationCreated(
      reservationId,
      roomId,
      guestName,
      checkIn,
      checkOut
    );
  },

  [QUEUE_NAMES.CHECK_IN]: async (job) => {
    const { reservationId } = job.data;
    console.log(`Processing check-in: ${reservationId}`);
    return await businessLogic.handleCheckIn(reservationId);
  },

  [QUEUE_NAMES.CHECK_OUT]: async (job) => {
    const { reservationId } = job.data;
    console.log(`Processing check-out: ${reservationId}`);
    return await businessLogic.handleCheckOut(reservationId);
  },

  [QUEUE_NAMES.ROOM_MOVE]: async (job) => {
    const { reservationId, oldRoom, newRoom } = job.data;
    console.log(`Processing room move: ${reservationId} from ${oldRoom} to ${newRoom}`);
    return await businessLogic.handleRoomMove(reservationId, oldRoom, newRoom);
  }
};

// Start a worker
export function startWorker(queueName) {
  const workerConnection = {
    connection: new Redis(REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false
    })
  };

  const worker = new Worker(queueName, jobProcessors[queueName], {
    connection: workerConnection,
    concurrency: 5
  });

  worker.on('completed', (job, result) => {
    console.log(`Job ${job.id} in ${queueName} completed:`, result);
  });

  worker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} in ${queueName} failed:`, err.message);
  });

  console.log(`Worker started for queue: ${queueName}`);
  return worker;
}

// Export connection for health checks
export { connection };
