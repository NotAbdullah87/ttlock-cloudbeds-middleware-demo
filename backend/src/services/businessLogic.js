import { ttlockService } from './ttlock.js';
import * as models from '../database/models.js';
import { addJob } from '../queues/index.js';

export const businessLogic = {
  // Handle new reservation - generate passcode
  async handleReservationCreated(reservationId, roomId, guestName, checkIn, checkOut) {
    console.log(`Processing reservation created: ${reservationId}`);

    // Find or create reservation
    let reservation = await models.getReservationByReservationId(reservationId);

    if (!reservation) {
      // Find room by cloudbeds ID or room number
      let room = await models.getRoomByCloudbedsId(roomId);
      if (!room) {
        // Try finding by room number
        const rooms = await models.getAllRooms();
        room = rooms.find(r => r.room_number === roomId);
      }

      reservation = await models.createReservation(
        reservationId,
        guestName,
        new Date(checkIn),
        new Date(checkOut),
        room?.id
      );
    }

    // Get the lock for this room
    let lock = null;
    if (reservation.room_id) {
      const locks = await models.getAllLocks();
      lock = locks.find(l => l.room_id === reservation.room_id);
    }

    // Generate passcode via TTLock
    if (lock) {
      const passcodeResult = await ttlockService.generatePasscode(
        lock.ttlock_lock_id,
        checkIn,
        checkOut
      );

      // Store passcode
      const passcode = await models.createPasscode(
        reservation.id,
        passcodeResult.code,
        new Date(passcodeResult.validFrom),
        new Date(passcodeResult.validUntil)
      );

      // Create audit log
      await models.createAuditLog(
        'passcode_generated',
        lock.id,
        reservation.id,
        { code: passcodeResult.code, guestName, checkIn, checkOut }
      );

      return { reservation, passcode, lock };
    }

    return { reservation };
  },

  // Handle check-in
  async handleCheckIn(reservationId) {
    console.log(`Processing check-in: ${reservationId}`);

    const reservation = await models.getReservationByReservationId(reservationId);
    if (!reservation) {
      throw new Error(`Reservation not found: ${reservationId}`);
    }

    await models.updateReservationStatus(reservation.id, 'checked_in');

    // Create audit log
    const locks = await models.getAllLocks();
    const lock = locks.find(l => l.room_id === reservation.room_id);

    if (lock) {
      await models.createAuditLog(
        'guest_checked_in',
        lock.id,
        reservation.id,
        { guestName: reservation.guest_name }
      );
    }

    return reservation;
  },

  // Handle check-out
  async handleCheckOut(reservationId) {
    console.log(`Processing check-out: ${reservationId}`);

    const reservation = await models.getReservationByReservationId(reservationId);
    if (!reservation) {
      throw new Error(`Reservation not found: ${reservationId}`);
    }

    // Revoke active passcode
    const activePasscode = await models.getActivePasscodeForReservation(reservation.id);
    if (activePasscode) {
      await models.revokePasscode(activePasscode.id);
    }

    await models.updateReservationStatus(reservation.id, 'checked_out');

    // Create audit log
    const locks = await models.getAllLocks();
    const lock = locks.find(l => l.room_id === reservation.room_id);

    if (lock) {
      await models.createAuditLog(
        'guest_checked_out',
        lock.id,
        reservation.id,
        { guestName: reservation.guest_name }
      );

      // Also notify TTLock to revoke
      try {
        await ttlockService.revokePasscode(lock.ttlock_lock_id, activePasscode?.id);
      } catch (e) {
        console.log('TTLock revoke (fake):', e.message);
      }
    }

    return reservation;
  },

  // Handle room move
  async handleRoomMove(reservationId, oldRoom, newRoom) {
    console.log(`Processing room move: ${reservationId} from ${oldRoom} to ${newRoom}`);

    const reservation = await models.getReservationByReservationId(reservationId);
    if (!reservation) {
      throw new Error(`Reservation not found: ${reservationId}`);
    }

    // Find new room
    const rooms = await models.getAllRooms();
    const newRoomData = rooms.find(r => r.room_number === newRoom || r.cloudbeds_room_id === newRoom);

    if (!newRoomData) {
      throw new Error(`Room not found: ${newRoom}`);
    }

    // Revoke old passcode
    const activePasscode = await models.getActivePasscodeForReservation(reservation.id);
    if (activePasscode) {
      await models.revokePasscode(activePasscode.id);
    }

    // Update reservation room
    await models.updateReservationRoom(reservation.id, newRoomData.id);

    // Get new lock
    const locks = await models.getAllLocks();
    const newLock = locks.find(l => l.room_id === newRoomData.id);

    // Generate new passcode
    let newPasscode = null;
    if (newLock) {
      const passcodeResult = await ttlockService.generatePasscode(
        newLock.ttlock_lock_id,
        reservation.check_in,
        reservation.check_out
      );

      newPasscode = await models.createPasscode(
        reservation.id,
        passcodeResult.code,
        new Date(passcodeResult.validFrom),
        new Date(passcodeResult.validUntil)
      );

      // Create audit log
      await models.createAuditLog(
        'room_reassigned',
        newLock.id,
        reservation.id,
        {
          oldRoom,
          newRoom,
          guestName: reservation.guest_name,
          newCode: passcodeResult.code
        }
      );
    }

    return { reservation, newRoom: newRoomData, newPasscode };
  }
};

export default businessLogic;
