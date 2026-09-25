import { nanoid } from 'nanoid';
import { logger } from '../lib/logger.js';
import { weightAudit } from '../services/weightAudit.js';

export interface TrackingEvent {
  trackerId: string;
  status: 'pre_transit' | 'in_transit' | 'delivered' | 'anomaly';
  scannedWeightG?: number;
  weightAuditResult?: 'MATCH' | 'ANOMALY';
  location: string;
  message: string;
  timestamp: string;
}

interface StoredTracker {
  trackerId: string;
  orderId: string;
  carrier: string;
  declaredWeightG: number;
}

const trackerStore = new Map<string, StoredTracker>();

export const mockEasyPost = {
  async createTracker(params: {
    orderId: string;
    carrier?: string;
    declaredWeightG: number;
  }): Promise<{ trackerId: string }> {
    const trackerId = `trk_mock_${nanoid(18)}`;
    trackerStore.set(trackerId, {
      trackerId,
      orderId: params.orderId,
      carrier: params.carrier || 'USPS',
      declaredWeightG: params.declaredWeightG,
    });
    logger.info({ ...params, trackerId }, '[MockEasyPost] Created Tracker with Pre-Declared Weight');
    return { trackerId };
  },

  async simulateIntakeScan(trackerId: string, scannedWeightG: number): Promise<TrackingEvent> {
    const tracker = trackerStore.get(trackerId);
    const declaredG = tracker ? tracker.declaredWeightG : 1000;
    const audit = weightAudit(declaredG, scannedWeightG);

    const event: TrackingEvent = {
      trackerId,
      status: audit.match ? 'in_transit' : 'anomaly',
      scannedWeightG,
      weightAuditResult: audit.match ? 'MATCH' : 'ANOMALY',
      location: 'Carrier Processing Station #97201 — Postal Scale #4',
      message: audit.match
        ? `NIST postal scale intake confirmed: ${scannedWeightG}g matches declared ${declaredG}g manifest.`
        : `CRITICAL DEFICIT: Intake scale recorded ${scannedWeightG}g vs declared ${declaredG}g (-${audit.deltaG}g delta).`,
      timestamp: new Date().toISOString(),
    };

    logger.info({ trackerId, audit, event }, '[MockEasyPost] Intake Scale Scan Event');
    return event;
  },

  async simulateDelivery(trackerId: string, zip = '78701'): Promise<TrackingEvent> {
    const event: TrackingEvent = {
      trackerId,
      status: 'delivered',
      location: `Austin, TX ${zip} — Front Porch / Doorstep`,
      message: 'Delivered to recipient address. Doorstep handoff verified.',
      timestamp: new Date().toISOString(),
    };

    logger.info({ trackerId, event }, '[MockEasyPost] Delivery Scan Event');
    return event;
  },

  getTracker(trackerId: string): StoredTracker | undefined {
    return trackerStore.get(trackerId);
  },
};
