import { startWorker, QUEUE_NAMES } from './index.js';

// Start workers for all queues
const workers = [];

for (const queueName of Object.values(QUEUE_NAMES)) {
  const worker = startWorker(queueName);
  workers.push(worker);
}

console.log(`Started ${workers.length} queue workers`);

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down workers...');
  for (const worker of workers) {
    await worker.close();
  }
  process.exit(0);
});
