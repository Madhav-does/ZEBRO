import type { IncomingMessage, ServerResponse } from 'http';
import { buildApp } from './server.js';
import { connectDb } from './lib/db.js';

let appPromise: Promise<any> | null = null;

async function getApp() {
  if (!appPromise) {
    appPromise = (async () => {
      await connectDb();
      const fastifyApp = await buildApp();
      await fastifyApp.ready();
      return fastifyApp;
    })();
  }
  return appPromise;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    const fastifyApp = await getApp();
    fastifyApp.server.emit('request', req, res);
  } catch (err: any) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        error: 'InternalServerError',
        message: err?.message || 'Failed to initialize serverless application',
      })
    );
  }
}
