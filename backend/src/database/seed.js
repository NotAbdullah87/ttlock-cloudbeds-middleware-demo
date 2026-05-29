import { initializeDatabase, query, getClient } from './init.js';

async function seed() {
  console.log('Starting database seed...');

  await initializeDatabase();

  // Clear existing data
  await query('TRUNCATE properties, rooms, locks, reservations, passcodes, audit_logs CASCADE');

  // Create properties
  const properties = [
    { name: 'Grand Plaza Hotel', address: '123 Main Street, New York, NY 10001' },
    { name: 'Seaside Resort', address: '456 Ocean Drive, Miami, FL 33139' },
    { name: 'Mountain View Lodge', address: '789 Peak Road, Denver, CO 80202' },
    { name: 'City Center Inn', address: '321 Business Ave, Chicago, IL 60601' },
    { name: 'Harbor Hotel', address: '654 Waterfront Blvd, Boston, MA 02210' },
    { name: 'Desert Oasis Resort', address: '987 Cactus Lane, Phoenix, AZ 85001' },
    { name: 'Forest Retreat', address: '147 Pine Trail, Seattle, WA 98101' },
    { name: 'Lakeside Motel', address: '258 Lake View, Minneapolis, MN 55401' }
  ];

  const propertyIds = [];
  for (const prop of properties) {
    const result = await query(
      'INSERT INTO properties (name, address) VALUES ($1, $2) RETURNING id',
      [prop.name, prop.address]
    );
    propertyIds.push(result.rows[0].id);
  }

  console.log(`Created ${properties.length} properties`);

  // Create rooms for each property
  const roomIds = [];
  for (let p = 0; p < propertyIds.length; p++) {
    const roomCount = 80 + Math.floor(Math.random() * 30); // 80-110 rooms per property
    for (let r = 1; r <= roomCount; r++) {
      const roomNumber = r.toString().padStart(3, '0');
      const cloudbedsRoomId = `CB-${propertyIds[p].slice(0, 8)}-${roomNumber}`;
      const result = await query(
        'INSERT INTO rooms (property_id, room_number, cloudbeds_room_id) VALUES ($1, $2, $3) RETURNING id',
        [propertyIds[p], roomNumber, cloudbedsRoomId]
      );
      roomIds.push(result.rows[0].id);
    }
  }

  console.log(`Created ${roomIds.length} rooms`);

  // Create locks for each room
  const lockStatuses = ['online', 'online', 'online', 'online', 'offline', 'low_battery'];
  const lockIds = [];
  for (const roomId of roomIds) {
    const status = lockStatuses[Math.floor(Math.random() * lockStatuses.length)];
    const batteryLevel = status === 'low_battery'
      ? Math.floor(Math.random() * 15) + 5
      : Math.floor(Math.random() * 40) + 60;
    const ttlockLockId = `TT-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const result = await query(
      'INSERT INTO locks (room_id, ttlock_lock_id, battery_level, status) VALUES ($1, $2, $3, $4) RETURNING id',
      [roomId, ttlockLockId, batteryLevel, status]
    );
    lockIds.push(result.rows[0].id);
  }

  console.log(`Created ${lockIds.length} locks`);

  // Create reservations
  const guestNames = [
    'John Smith', 'Sarah Johnson', 'Michael Brown', 'Emily Davis', 'David Wilson',
    'Jennifer Taylor', 'Robert Anderson', 'Lisa Martinez', 'William Garcia', 'Jessica Thomas',
    'James Rodriguez', 'Mary Hernandez', 'John Lopez', 'Patricia Gonzalez', 'Charles Lee'
  ];

  const reservationStatuses = ['pending', 'confirmed', 'checked_in', 'checked_out'];
  const reservationIds = [];

  for (let i = 0; i < 150; i++) {
    const resId = `RES${(1000 + i).toString()}`;
    const guest = guestNames[Math.floor(Math.random() * guestNames.length)];
    const daysFromNow = Math.floor(Math.random() * 60) - 10;
    const checkIn = new Date();
    checkIn.setDate(checkIn.getDate() + daysFromNow);
    const checkOut = new Date(checkIn);
    checkOut.setDate(checkOut.getDate() + Math.floor(Math.random() * 7) + 1);

    const roomIndex = Math.floor(Math.random() * roomIds.length);
    const status = daysFromNow < 0
      ? (daysFromNow < -1 ? 'checked_out' : 'checked_in')
      : reservationStatuses[Math.floor(Math.random() * 2)];

    const result = await query(
      'INSERT INTO reservations (reservation_id, guest_name, check_in, check_out, room_id, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [resId, guest, checkIn.toISOString(), checkOut.toISOString(), roomIds[roomIndex], status]
    );
    reservationIds.push({ id: result.rows[0].id, reservationId: resId });
  }

  console.log(`Created ${reservationIds.length} reservations`);

  // Create passcodes for active reservations
  for (const res of reservationIds.slice(0, 100)) {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const validFrom = new Date();
    validFrom.setDate(validFrom.getDate() - 1);
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 7);
    const status = Math.random() > 0.2 ? 'active' : 'revoked';

    await query(
      'INSERT INTO passcodes (reservation_id, code, valid_from, valid_until, status) VALUES ($1, $2, $3, $4, $5)',
      [res.id, code, validFrom.toISOString(), validUntil.toISOString(), status]
    );
  }

  console.log('Created passcodes for reservations');

  // Create audit logs
  const actions = [
    'passcode_generated', 'passcode_revoked', 'guest_checked_in', 'guest_checked_out', 'room_reassigned'
  ];

  for (let i = 0; i < 200; i++) {
    const action = actions[Math.floor(Math.random() * actions.length)];
    const lockId = lockIds[Math.floor(Math.random() * lockIds.length)];
    const resIndex = Math.floor(Math.random() * reservationIds.length);
    const details = {
      guestName: guestNames[Math.floor(Math.random() * guestNames.length)],
      code: Math.floor(100000 + Math.random() * 900000).toString()
    };

    await query(
      'INSERT INTO audit_logs (action, lock_id, reservation_id, details) VALUES ($1, $2, $3, $4)',
      [action, lockId, reservationIds[resIndex].id, JSON.stringify(details)]
    );
  }

  console.log('Created audit logs');

  console.log('Database seeding completed successfully!');
  console.log('');
  console.log('Summary:');
  console.log(`  Properties: ${properties.length}`);
  console.log(`  Rooms: ${roomIds.length}`);
  console.log(`  Locks: ${lockIds.length}`);
  console.log(`  Reservations: ${reservationIds.length}`);
  console.log(`  Passcodes: ~100`);
  console.log(`  Audit Logs: 200`);

  process.exit(0);
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
