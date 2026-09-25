import { logger } from '../lib/logger.js';

export const mockKYC = {
  async verifyUser(userId: string): Promise<{ verified: boolean; kycVerifiedAt: string }> {
    const kycVerifiedAt = new Date().toISOString();
    logger.info({ userId, kycVerifiedAt }, '[MockKYC] Government ID and Biometric Liveness Verified');
    return { verified: true, kycVerifiedAt };
  },
};
