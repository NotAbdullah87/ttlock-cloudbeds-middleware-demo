import express from 'express';
import * as models from '../database/models.js';
import { ttlockService } from '../services/ttlock.js';

export const apiRouter = express.Router();

// Stats / Dashboard data
apiRouter.get('/stats', async (req, res) => {
  try {
    const stats = await models.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Properties
apiRouter.get('/properties', async (req, res) => {
  try {
    const properties = await models.getAllProperties();
    res.json(properties);
  } catch (error) {
    console.error('Error fetching properties:', error);
    res.status(500).json({ error: 'Failed to fetch properties' });
  }
});

apiRouter.get('/properties/:id', async (req, res) => {
  try {
    const property = await models.getPropertyById(req.params.id);
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }
    res.json(property);
  } catch (error) {
    console.error('Error fetching property:', error);
    res.status(500).json({ error: 'Failed to fetch property' });
  }
});

// Rooms
apiRouter.get('/rooms', async (req, res) => {
  try {
    const rooms = await models.getAllRooms();
    res.json(rooms);
  } catch (error) {
    console.error('Error fetching rooms:', error);
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
});

apiRouter.get('/rooms/:id', async (req, res) => {
  try {
    const room = await models.getRoomById(req.params.id);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    res.json(room);
  } catch (error) {
    console.error('Error fetching room:', error);
    res.status(500).json({ error: 'Failed to fetch room' });
  }
});

// Locks
apiRouter.get('/locks', async (req, res) => {
  try {
    const locks = await models.getAllLocks();
    res.json(locks);
  } catch (error) {
    console.error('Error fetching locks:', error);
    res.status(500).json({ error: 'Failed to fetch locks' });
  }
});

apiRouter.get('/locks/:id', async (req, res) => {
  try {
    const lock = await models.getLockById(req.params.id);
    if (!lock) {
      return res.status(404).json({ error: 'Lock not found' });
    }
    res.json(lock);
  } catch (error) {
    console.error('Error fetching lock:', error);
    res.status(500).json({ error: 'Failed to fetch lock' });
  }
});

// Reservations
apiRouter.get('/reservations', async (req, res) => {
  try {
    const reservations = await models.getAllReservations();
    res.json(reservations);
  } catch (error) {
    console.error('Error fetching reservations:', error);
    res.status(500).json({ error: 'Failed to fetch reservations' });
  }
});

apiRouter.get('/reservations/:id', async (req, res) => {
  try {
    const reservation = await models.getReservationById(req.params.id);
    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }
    res.json(reservation);
  } catch (error) {
    console.error('Error fetching reservation:', error);
    res.status(500).json({ error: 'Failed to fetch reservation' });
  }
});

// Passcodes
apiRouter.get('/passcodes', async (req, res) => {
  try {
    const passcodes = await models.getAllPasscodes();
    res.json(passcodes);
  } catch (error) {
    console.error('Error fetching passcodes:', error);
    res.status(500).json({ error: 'Failed to fetch passcodes' });
  }
});

// Audit Logs
apiRouter.get('/logs', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const logs = await models.getAllAuditLogs(limit);
    res.json(logs);
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

// Fake TTLock endpoints (for testing)
apiRouter.post('/ttlock/generate-passcode', async (req, res) => {
  try {
    const { lockId, startDate, endDate } = req.body;
    const result = await ttlockService.generatePasscode(lockId, startDate, endDate);
    res.json(result);
  } catch (error) {
    console.error('Error generating passcode:', error);
    res.status(500).json({ error: 'Failed to generate passcode' });
  }
});

apiRouter.post('/ttlock/revoke-passcode', async (req, res) => {
  try {
    const { lockId, passcodeId } = req.body;
    const result = await ttlockService.revokePasscode(lockId, passcodeId);
    res.json(result);
  } catch (error) {
    console.error('Error revoking passcode:', error);
    res.status(500).json({ error: 'Failed to revoke passcode' });
  }
});

apiRouter.get('/ttlock/lock/:lockId', async (req, res) => {
  try {
    const result = await ttlockService.getLockInfo(req.params.lockId);
    res.json(result);
  } catch (error) {
    console.error('Error fetching lock info:', error);
    res.status(500).json({ error: 'Failed to fetch lock info' });
  }
});

apiRouter.post('/ttlock/unlock/:lockId', async (req, res) => {
  try {
    const result = await ttlockService.unlock(req.params.lockId);
    res.json(result);
  } catch (error) {
    console.error('Error unlocking:', error);
    res.status(500).json({ error: 'Failed to unlock' });
  }
});
