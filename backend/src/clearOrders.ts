import { prisma } from './lib/db.js';

async function main() {
  console.log('[Clear] Deleting all pending timers...');
  await prisma.pendingTimer.deleteMany({});
  
  console.log('[Clear] Deleting all disputes...');
  await prisma.dispute.deleteMany({});
  
  console.log('[Clear] Deleting all escrow events...');
  await prisma.escrowEvent.deleteMany({});
  
  console.log('[Clear] Deleting all orders...');
  await prisma.order.deleteMany({});
  
  console.log('[Clear] Deleting all idempotency keys...');
  await prisma.idempotencyKey.deleteMany({});

  console.log('✅ [Clear] Successfully deleted all orders and escrow data from database.');
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('❌ [Clear] Error:', e);
  await prisma.$disconnect();
  process.exit(1);
});
