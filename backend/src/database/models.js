import { query } from './init.js';
import { v4 as uuidv4 } from 'uuid';

// Properties
export async function getAllProperties() {
  const result = await query('SELECT * FROM properties ORDER BY created_at DESC');
  return result.rows;
}

export async function getPropertyById(id) {
  const result = await query('SELECT * FROM properties WHERE id = $1', [id]);
  return result.rows[0];
}

export async function createProperty(name, address) {
  const result = await query(
    'INSERT INTO properties (name, address) VALUES ($1, $2) RETURNING *',
    [name, address]
  );
  return result.rows[0];
}

// Rooms
export async function getAllRooms() {
  const result = await query(`
    SELECT r.*, p.name as property_name, l.status as lock_status, l.battery_level
    FROM rooms r
    LEFT JOIN properties p ON r.property_id = p.id
    LEFT JOIN locks l ON r.id = l.room_id
    ORDER BY r.room_number
  `);
  return result.rows;
}

export async function getRoomById(id) {
  const result = await query(`
    SELECT r.*, p.name as property_name, l.status as lock_status, l.battery_level
    FROM rooms r
    LEFT JOIN properties p ON r.property_id = p.id
    LEFT JOIN locks l ON r.id = l.room_id
    WHERE r.id = $1
  `, [id]);
  return result.rows[0];
}

export async function getRoomByCloudbedsId(cloudbedsRoomId) {
  const result = await query(
    'SELECT * FROM rooms WHERE cloudbeds_room_id = $1',
    [cloudbedsRoomId]
  );
  return result.rows[0];
}

export async function createRoom(propertyId, roomNumber, cloudbedsRoomId) {
  const result = await query(
    'INSERT INTO rooms (property_id, room_number, cloudbeds_room_id) VALUES ($1, $2, $3) RETURNING *',
    [propertyId, roomNumber, cloudbedsRoomId]
  );
  return result.rows[0];
}

// Locks
export async function getAllLocks() {
  const result = await query(`
    SELECT l.*, r.room_number, p.name as property_name
    FROM locks l
    LEFT JOIN rooms r ON l.room_id = r.id
    LEFT JOIN properties p ON r.property_id = p.id
    ORDER BY l.created_at DESC
  `);
  return result.rows;
}

export async function getLockById(id) {
  const result = await query(`
    SELECT l.*, r.room_number, p.name as property_name
    FROM locks l
    LEFT JOIN rooms r ON l.room_id = r.id
    LEFT JOIN properties p ON r.property_id = p.id
    WHERE l.id = $1
  `, [id]);
  return result.rows[0];
}

export async function getLockByTTLockId(ttlockLockId) {
  const result = await query(
    'SELECT * FROM locks WHERE ttlock_lock_id = $1',
    [ttlockLockId]
  );
  return result.rows[0];
}

export async function createLock(roomId, ttlockLockId) {
  const result = await query(
    'INSERT INTO locks (room_id, ttlock_lock_id) VALUES ($1, $2) RETURNING *',
    [roomId, ttlockLockId]
  );
  return result.rows[0];
}

export async function updateLockStatus(id, status, batteryLevel) {
  const result = await query(
    'UPDATE locks SET status = $2, battery_level = $3, last_seen = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
    [id, status, batteryLevel]
  );
  return result.rows[0];
}

// Reservations
export async function getAllReservations() {
  const result = await query(`
    SELECT res.*, r.room_number, p.name as property_name,
           pc.code as passcode, pc.status as passcode_status
    FROM reservations res
    LEFT JOIN rooms r ON res.room_id = r.id
    LEFT JOIN properties p ON r.property_id = p.id
    LEFT JOIN passcodes pc ON res.id = pc.reservation_id AND pc.status = 'active'
    ORDER BY res.check_in DESC
  `);
  return result.rows;
}

export async function getReservationById(id) {
  const result = await query(`
    SELECT res.*, r.room_number, p.name as property_name
    FROM reservations res
    LEFT JOIN rooms r ON res.room_id = r.id
    LEFT JOIN properties p ON r.property_id = p.id
    WHERE res.id = $1
  `, [id]);
  return result.rows[0];
}

export async function getReservationByReservationId(reservationId) {
  const result = await query(
    'SELECT * FROM reservations WHERE reservation_id = $1',
    [reservationId]
  );
  return result.rows[0];
}

export async function createReservation(reservationId, guestName, checkIn, checkOut, roomId) {
  const result = await query(
    'INSERT INTO reservations (reservation_id, guest_name, check_in, check_out, room_id, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
    [reservationId, guestName, checkIn, checkOut, roomId, 'confirmed']
  );
  return result.rows[0];
}

export async function updateReservationStatus(id, status) {
  const result = await query(
    'UPDATE reservations SET status = $2 WHERE id = $1 RETURNING *',
    [id, status]
  );
  return result.rows[0];
}

export async function updateReservationRoom(id, roomId) {
  const result = await query(
    'UPDATE reservations SET room_id = $2 WHERE id = $1 RETURNING *',
    [id, roomId]
  );
  return result.rows[0];
}

// Passcodes
export async function getAllPasscodes() {
  const result = await query(`
    SELECT pc.*, res.guest_name, res.check_in, res.check_out, r.room_number
    FROM passcodes pc
    LEFT JOIN reservations res ON pc.reservation_id = res.id
    LEFT JOIN rooms r ON res.room_id = r.id
    ORDER BY pc.created_at DESC
  `);
  return result.rows;
}

export async function getActivePasscodeForReservation(reservationId) {
  const result = await query(
    'SELECT * FROM passcodes WHERE reservation_id = $1 AND status = $2 ORDER BY created_at DESC LIMIT 1',
    [reservationId, 'active']
  );
  return result.rows[0];
}

export async function createPasscode(reservationId, code, validFrom, validUntil) {
  const result = await query(
    'INSERT INTO passcodes (reservation_id, code, valid_from, valid_until, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [reservationId, code, validFrom, validUntil, 'active']
  );
  return result.rows[0];
}

export async function revokePasscode(id) {
  const result = await query(
    'UPDATE passcodes SET status = $2 WHERE id = $1 RETURNING *',
    [id, 'revoked']
  );
  return result.rows[0];
}

export async function revokeAllPasscodesForReservation(reservationId) {
  const result = await query(
    'UPDATE passcodes SET status = $2 WHERE reservation_id = $1 AND status = $3 RETURNING *',
    [reservationId, 'revoked', 'active']
  );
  return result.rows;
}

// Audit Logs
export async function getAllAuditLogs(limit = 100) {
  const result = await query(`
    SELECT al.*, l.ttlock_lock_id, r.room_number, res.guest_name
    FROM audit_logs al
    LEFT JOIN locks l ON al.lock_id = l.id
    LEFT JOIN reservations res ON al.reservation_id = res.id
    LEFT JOIN rooms r ON l.room_id = r.id
    ORDER BY al.created_at DESC
    LIMIT $1
  `, [limit]);
  return result.rows;
}

export async function createAuditLog(action, lockId, reservationId, details) {
  const result = await query(
    'INSERT INTO audit_logs (action, lock_id, reservation_id, details) VALUES ($1, $2, $3, $4) RETURNING *',
    [action, lockId, reservationId, JSON.stringify(details)]
  );
  return result.rows[0];
}

// Statistics
export async function getStats() {
  const properties = await query('SELECT COUNT(*) as count FROM properties');
  const rooms = await query('SELECT COUNT(*) as count FROM rooms');
  const locks = await query('SELECT COUNT(*) as count FROM locks');
  const locksOnline = await query("SELECT COUNT(*) as count FROM locks WHERE status = 'online'");
  const locksLowBattery = await query('SELECT COUNT(*) as count FROM locks WHERE battery_level < 20');
  const locksOffline = await query("SELECT COUNT(*) as count FROM locks WHERE status = 'offline'");
  const reservations = await query('SELECT COUNT(*) as count FROM reservations');
  const activePasscodes = await query("SELECT COUNT(*) as count FROM passcodes WHERE status = 'active'");

  return {
    properties: parseInt(properties.rows[0].count),
    rooms: parseInt(rooms.rows[0].count),
    locksTotal: parseInt(locks.rows[0].count),
    locksOnline: parseInt(locksOnline.rows[0].count),
    locksLowBattery: parseInt(locksLowBattery.rows[0].count),
    locksOffline: parseInt(locksOffline.rows[0].count),
    reservations: parseInt(reservations.rows[0].count),
    activePasscodes: parseInt(activePasscodes.rows[0].count)
  };
}
