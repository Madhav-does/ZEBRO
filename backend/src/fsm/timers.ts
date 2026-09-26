import { prisma } from '../lib/db.js';
import { logger } from '../lib/logger.js';

let pollerInterval: NodeJS.Timeout | null = null;

export const timers = {
  getWindowSeconds(): number {
    const envVal = process.env.INSPECTION_WINDOW_SECONDS;
    return envVal ? parseInt(envVal, 10) : 48; // 48s default for demo reactivity
  },

  async scheduleInspectionTimer(orderId: string, customSeconds?: number): Promise<void> {
    const seconds = customSeconds ?? this.getWindowSeconds();
    const firesAt = new Date(Date.now() + seconds * 1000);

    // Cancel any previous pending timers for this order
    await prisma.pendingTimer.updateMany({
      where: { orderId, processed: false },
      data: { processed: true },
    });

    await prisma.pendingTimer.create({
      data: {
        orderId,
        firesAt,
        action: 'RELEASE_ESCROW',
        processed: false,
      },
    });

    logger.info(
      { orderId, firesAt: firesAt.toISOString(), seconds },
      '[Timer] Scheduled inspection window auto-release timer'
    );
  },

  async cancelTimer(orderId: string): Promise<void> {
    const updated = await prisma.pendingTimer.updateMany({
      where: { orderId, processed: false },
      data: { processed: true },
    });
    logger.info({ orderId, count: updated.count }, '[Timer] Cancelled inspection timer');
  },

  startPoller(
    onTimerFired: (orderId: string, action: string) => Promise<void>,
    intervalMs = 3000
  ): void {
    if (pollerInterval) return;

    logger.info({ intervalMs }, '[Timer] Starting background timer poller');
    pollerInterval = setInterval(async () => {
      try {
        const now = new Date();
        const dueTimers = await prisma.pendingTimer.findMany({
          where: {
            processed: false,
            firesAt: { lte: now },
          },
          take: 10,
        });

        for (const timer of dueTimers) {
          // Atomically mark processed
          await prisma.pendingTimer.update({
            where: { id: timer.id },
            data: { processed: true },
          });

          logger.info(
            { timerId: timer.id, orderId: timer.orderId, action: timer.action },
            '[Timer] Fired inspection timer!'
          );

          try {
            await onTimerFired(timer.orderId, timer.action);
          } catch (err) {
            logger.error({ err, timerId: timer.id, orderId: timer.orderId }, '[Timer] Error executing timer callback');
          }
        }
      } catch (err) {
        logger.error({ err }, '[Timer] Error in timer poller loop');
      }
    }, intervalMs);
  },

  stopPoller(): void {
    if (pollerInterval) {
      clearInterval(pollerInterval);
      pollerInterval = null;
      logger.info('[Timer] Stopped timer poller');
    }
  },
};
