/**
 * Hardware Postal Scale Tare Telemetry Audit
 * 
 * Compares pre-declared package weight against verified counter scale intake measurement.
 * Tolerance: 10% of declared weight OR 50 grams, whichever is greater.
 */
export function weightAudit(
  declaredG: number,
  scannedG: number
): { match: boolean; deltaG: number; toleranceG: number } {
  const deltaG = Math.abs(scannedG - declaredG);
  const toleranceG = Math.max(Math.round(declaredG * 0.10), 50);
  return {
    match: deltaG <= toleranceG,
    deltaG,
    toleranceG,
  };
}
