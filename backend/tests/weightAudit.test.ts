import { describe, it, expect } from 'vitest';
import { weightAudit } from '../src/services/weightAudit.js';

describe('Postal Scale Weight Audit (NIST Hardware Telemetry)', () => {
  it('detects anomaly when 1200g declared and 25g scanned (delta 1175, tolerance 120)', () => {
    const result = weightAudit(1200, 25);
    expect(result.match).toBe(false);
    expect(result.deltaG).toBe(1175);
    expect(result.toleranceG).toBe(120);
  });

  it('verifies match when 1200g declared and 1150g scanned (delta 50, tolerance 120)', () => {
    const result = weightAudit(1200, 1150);
    expect(result.match).toBe(true);
    expect(result.deltaG).toBe(50);
    expect(result.toleranceG).toBe(120);
  });

  it('verifies match when 100g declared and 60g scanned (delta 40, tolerance 50)', () => {
    const result = weightAudit(100, 60);
    expect(result.match).toBe(true);
    expect(result.deltaG).toBe(40);
    expect(result.toleranceG).toBe(50); // max(10% of 100 = 10, 50) = 50
  });

  it('detects anomaly when 100g declared and 20g scanned (delta 80, tolerance 50)', () => {
    const result = weightAudit(100, 20);
    expect(result.match).toBe(false);
    expect(result.deltaG).toBe(80);
    expect(result.toleranceG).toBe(50);
  });

  it('correctly handles exact match (0 delta)', () => {
    const result = weightAudit(500, 500);
    expect(result.match).toBe(true);
    expect(result.deltaG).toBe(0);
    expect(result.toleranceG).toBe(50);
  });
});
