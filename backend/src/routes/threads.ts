import { FastifyInstance, FastifyRequest } from 'fastify';
import { NotFoundError } from '../lib/errors.js';

export const mockThreadsData = [
  {
    id: 'th_1',
    participant: {
      name: 'Maya Lin',
      handle: 'urban_ceramics',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=128&h=128&q=80',
      role: 'seller',
    },
    lastMessage: 'Your package was safely intake weighed (1.25 kg) at Portland station! Let me know when it arrives.',
    timestamp: '11:25 AM',
    unread: true,
    stateChip: 'Open',
    orderId: 'TL-8829104',
  },
  {
    id: 'th_2',
    participant: {
      name: 'TrustLink Oracle',
      handle: 'trustlink_guard',
      avatarUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=128&h=128&q=80',
      role: 'support',
    },
    lastMessage: 'Carrier telemetry confirmed: NIST postal scale calibrated. 48-hour inspection clock is active.',
    timestamp: 'Yesterday',
    unread: false,
    stateChip: 'Resolved',
    orderId: 'TL-8829104',
  },
  {
    id: 'th_3',
    participant: {
      name: 'Atelier Cloth Co.',
      handle: 'atelier_cloth',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=128&h=128&q=80',
      role: 'seller',
    },
    lastMessage: 'Thanks for ordering! Pre-paid insured label generated.',
    timestamp: 'Sep 23',
    unread: false,
    stateChip: 'Resolved',
  },
];

export async function threadRoutes(fastify: FastifyInstance) {
  const getThreads = async () => {
    return mockThreadsData;
  };

  fastify.get('/threads', getThreads);
  fastify.get('/inbox/threads', getThreads);

  fastify.get('/threads/:id', async (request: FastifyRequest<{ Params: { id: string } }>) => {
    const thread = mockThreadsData.find((t) => t.id === request.params.id);
    if (!thread) throw new NotFoundError('Thread', request.params.id);
    return thread;
  });
}
