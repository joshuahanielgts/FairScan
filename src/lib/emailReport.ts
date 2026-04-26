import type { ScanResult } from '../types';

export interface EmailReportOptions {
  to: string;
  scanResult: ScanResult;
  pdfBase64?: string;
  mode: 'summary' | 'full';
}

export interface EmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

export async function emailReport({
  to,
  scanResult,
  pdfBase64,
  mode,
}: EmailReportOptions): Promise<EmailResult> {
  const topSlices = scanResult.slices.slice(0, 5).map(s => ({
    groupLabel: s.groupLabel,
    worstMetric: s.worstMetric.metricName,
    value: s.worstMetric.value,
    severity: s.severity,
  }));

  const payload = {
    to,
    filename: scanResult.filename,
    fairscanScore: scanResult.fairscanScore,
    riskLevel: scanResult.riskLevel,
    totalSlices: scanResult.overallStats.totalSlices,
    criticalCount: scanResult.overallStats.criticalCount,
    highCount: scanResult.overallStats.highCount,
    mediumCount: scanResult.overallStats.mediumCount,
    topSlices,
    pdfBase64,
    mode,
  };

  try {
    const res = await fetch('/api/send-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      return { success: false, error: data.error ?? 'Failed to send email' };
    }

    return { success: true, id: data.id };
  } catch (err) {
    return { success: false, error: 'Network error — could not reach email service' };
  }
}
