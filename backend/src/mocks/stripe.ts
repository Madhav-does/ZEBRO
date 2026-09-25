import { nanoid } from 'nanoid';
import { logger } from '../lib/logger.js';

function randomDelay(min = 200, max = 500): Promise<void> {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const mockStripe = {
  async createConnectAccount(sellerId: string): Promise<{ accountId: string }> {
    await randomDelay();
    const accountId = `acct_mock_${nanoid(16)}`;
    logger.info({ sellerId, accountId }, '[MockStripe] Created Connect Account');
    return { accountId };
  },

  async createOnboardingLink(accountId: string): Promise<{ url: string }> {
    await randomDelay();
    const url = `https://connect.stripe.com/setup/s/mock_${accountId}`;
    logger.info({ accountId, url }, '[MockStripe] Generated Connect Onboarding Link');
    return { url };
  },

  async createPaymentIntent(params: {
    amountCents: number;
    transferGroup: string;
  }): Promise<{ id: string; clientSecret: string }> {
    await randomDelay();
    const id = `pi_mock_${nanoid(24)}`;
    const clientSecret = `${id}_secret_${nanoid(16)}`;
    logger.info({ ...params, id }, '[MockStripe] Created PaymentIntent');
    return { id, clientSecret };
  },

  async createTransfer(params: {
    accountId: string;
    amountCents: number;
    transferGroup: string;
    idempotencyKey?: string;
  }): Promise<{ transferId: string }> {
    await randomDelay();
    const transferId = `tr_mock_${nanoid(24)}`;
    logger.info({ ...params, transferId }, '[MockStripe] Executed Transfer to Connect Account');
    return { transferId };
  },

  async createRefund(params: {
    paymentIntentId: string;
    amountCents: number;
  }): Promise<{ refundId: string }> {
    await randomDelay();
    const refundId = `re_mock_${nanoid(24)}`;
    logger.info({ ...params, refundId }, '[MockStripe] Issued Refund');
    return { refundId };
  },
};
