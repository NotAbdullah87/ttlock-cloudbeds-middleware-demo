// Fake TTLock OpenAPI Service
// Simulates TTLock API without needing actual credentials

const generateRandomCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const simulateDelay = () => new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));

export const ttlockService = {
  // Generate a passcode for a lock
  async generatePasscode(lockId, startDate, endDate) {
    await simulateDelay();

    const validFrom = new Date(startDate);
    const validUntil = new Date(endDate);

    // Validate dates
    if (validFrom >= validUntil) {
      throw new Error('validFrom must be before validUntil');
    }

    const passcode = generateRandomCode();

    return {
      success: true,
      lockId,
      code: passcode,
      validFrom: validFrom.toISOString(),
      validUntil: validUntil.toISOString(),
      // TTLock returns these additional fields
      lockNumber: Math.floor(1000 + Math.random() * 9000).toString(),
      keyboardPwdId: Math.floor(100000 + Math.random() * 900000).toString(),
      keyboardPwdType: 3, // One-time passcode
      date: Date.now(),
      dateStr: validFrom.toISOString().split('T')[0]
    };
  },

  // Revoke a passcode
  async revokePasscode(lockId, passcodeId) {
    await simulateDelay();

    return {
      success: true,
      lockId,
      passcodeId,
      status: 'revoked',
      revokedAt: new Date().toISOString()
    };
  },

  // Get lock info
  async getLockInfo(lockId) {
    await simulateDelay();

    // Simulate random battery levels
    const batteryLevel = Math.floor(20 + Math.random() * 80);
    const isOnline = Math.random() > 0.05; // 95% online

    return {
      success: true,
      lockId,
      lockAlias: `Lock-${lockId.slice(0, 8)}`,
      lockMac: Array(6).fill(0).map(() =>
        Math.floor(16 + Math.random() * 240).toString(16)
      ).join(':').toUpperCase(),
      batteryLevel,
      isOnline,
      lockStatus: isOnline ? 1 : 0,
      // Signal strength (0-100)
      signalStrength: Math.floor(50 + Math.random() * 50),
      // Lock firmware
      firmwareVersion: `4.${Math.floor(1 + Math.random() * 9)}.${Math.floor(1 + Math.random() * 99)}`,
      // Last sync time
      lastSyncTime: new Date(Date.now() - Math.random() * 3600000).toISOString()
    };
  },

  // Check battery status
  async checkBattery(lockId) {
    await simulateDelay();

    const batteryLevel = Math.floor(20 + Math.random() * 80);

    return {
      success: true,
      lockId,
      batteryLevel,
      batteryStatus: batteryLevel < 20 ? 'low' : batteryLevel < 50 ? 'medium' : 'high',
      isCharging: false
    };
  },

  // Unlock remotely (for testing)
  async unlock(lockId) {
    await simulateDelay();

    return {
      success: true,
      lockId,
      unlockedAt: new Date().toISOString(),
      unlockType: 'remote_api'
    };
  },

  // Get passcode list for a lock
  async getPasscodes(lockId) {
    await simulateDelay();

    return {
      success: true,
      lockId,
      passcodes: [],
      totalCount: 0
    };
  }
};

export default ttlockService;
