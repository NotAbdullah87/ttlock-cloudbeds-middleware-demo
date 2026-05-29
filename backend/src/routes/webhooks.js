import express from 'express';
import { addJob, QUEUE_NAMES } from '../queues/index.js';

export const webhookRouter = express.Router();

// POST /webhooks/reservation-created
webhookRouter.post('/reservation-created', async (req, res) => {
  try {
    const { reservationId, roomId, guest, checkIn, checkOut } = req.body;

    // Validate required fields
    if (!reservationId || !roomId || !guest || !checkIn || !checkOut) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['reservationId', 'roomId', 'guest', 'checkIn', 'checkOut']
      });
    }

    // Add to queue for processing
    await addJob(QUEUE_NAMES.RESERVATION_CREATED, {
      reservationId,
      roomId,
      guestName: guest,
      checkIn,
      checkOut
    });

    res.status(202).json({
      status: 'accepted',
      message: 'Reservation created event queued for processing',
      reservationId
    });
  } catch (error) {
    console.error('Error processing reservation-created webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /webhooks/check-in
webhookRouter.post('/check-in', async (req, res) => {
  try {
    const { reservationId } = req.body;

    if (!reservationId) {
      return res.status(400).json({
        error: 'Missing required field: reservationId'
      });
    }

    // Add to queue for processing
    await addJob(QUEUE_NAMES.CHECK_IN, { reservationId });

    res.status(202).json({
      status: 'accepted',
      message: 'Check-in event queued for processing',
      reservationId
    });
  } catch (error) {
    console.error('Error processing check-in webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /webhooks/check-out
webhookRouter.post('/check-out', async (req, res) => {
  try {
    const { reservationId } = req.body;

    if (!reservationId) {
      return res.status(400).json({
        error: 'Missing required field: reservationId'
      });
    }

    // Add to queue for processing
    await addJob(QUEUE_NAMES.CHECK_OUT, { reservationId });

    res.status(202).json({
      status: 'accepted',
      message: 'Check-out event queued for processing',
      reservationId
    });
  } catch (error) {
    console.error('Error processing check-out webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /webhooks/room-move
webhookRouter.post('/room-move', async (req, res) => {
  try {
    const { reservationId, oldRoom, newRoom } = req.body;

    if (!reservationId || !oldRoom || !newRoom) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['reservationId', 'oldRoom', 'newRoom']
      });
    }

    // Add to queue for processing
    await addJob(QUEUE_NAMES.ROOM_MOVE, { reservationId, oldRoom, newRoom });

    res.status(202).json({
      status: 'accepted',
      message: 'Room move event queued for processing',
      reservationId,
      oldRoom,
      newRoom
    });
  } catch (error) {
    console.error('Error processing room-move webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check for webhooks
webhookRouter.get('/health', (req, res) => {
  res.json({ status: 'webhook service healthy', timestamp: new Date().toISOString() });
});
