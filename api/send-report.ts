import { Resend } from 'resend';

export const config = { runtime: 'edge' };

const resend = new Resend(process.env.RESEND_API_KEY);

interface SliceSummary {
  groupLabel: string;
  worstMetric: string;
  value: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

interface RequestBody {
  to: string;
  filename: string;
  fairscanScore: number;
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
  totalSlices: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  topSlices: SliceSummary[];
  pdfBase64?: string;
  mode: 'summary' | 'full';
}

const RISK_COLORS: Record<string, string> = {
  critical: '#F05252',
  high:     '#F97316',
  medium:   '#FBBF24',
  low:      '#22C55E',
};

function buildEmailHTML(body: RequestBody): string {
  const {
    filename, fairscanScore, riskLevel,
    totalSlices, criticalCount, highCount, mediumCount, topSlices
  } = body;

  const scoreColor = RISK_COLORS[riskLevel] ?? '#4F8EF7';

  const sliceRows = topSlices.slice(0, 5).map(s => `
    <tr style="border-bottom:1px solid #1C2230;">
      <td style="padding:11px 14px;color:#F0F4FF;font-family:monospace;font-size:13px;">
        ${s.groupLabel}
      </td>
      <td style="padding:11px 14px;color:#8A97B0;font-size:12px;">
        ${s.worstMetric.replace(/_/g, ' ')}
      </td>
      <td style="padding:11px 14px;font-family:monospace;font-size:13px;color:${RISK_COLORS[s.severity] ?? '#F0F4FF'};">
        ${s.value.toFixed(3)}
      </td>
      <td style="padding:11px 14px;">
        <span style="
          background:${RISK_COLORS[s.severity]}22;
          color:${RISK_COLORS[s.severity]};
          padding:2px 10px;
          border-radius:999px;
          font-size:11px;
          font-weight:500;
          text-transform:capitalize;
        ">${s.severity}</span>
      </td>
    </tr>
  `).join('');

  const shieldSVG = `
    <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 2L4 7v8c0 7.18 5.15 13.9 12 15.5C22.85 28.9 28 22.18 28 15V7L16 2Z"
        fill="#0C0F14" stroke="#4F8EF7" stroke-width="1.5" stroke-linejoin="round"/>
      <polyline points="10.5,15.5 14,19 21.5,11"
        stroke="#4F8EF7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    </svg>
  `;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>FairScan Report — ${filename}</title>
</head>
<body style="margin:0;padding:0;background:#0C0F14;font-family:system-ui,-apple-system,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0C0F14;padding:48px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0"
  style="max-width:600px;width:100%;background:#0C0F14;">

  <!-- Logo row -->
  <tr>
    <td style="padding:0 0 28px;">
      <table cellpadding="0" cellspacing="0"><tr>
        <td style="padding-right:10px;vertical-align:middle;">${shieldSVG}</td>
        <td style="vertical-align:middle;color:#F0F4FF;font-size:17px;font-weight:600;
          letter-spacing:-0.3px;">FairScan</td>
        <td style="padding-left:12px;vertical-align:middle;">
          <span style="background:#4F8EF722;color:#4F8EF7;padding:3px 10px;
            border-radius:999px;font-size:11px;">AI Bias Auditor</span>
        </td>
      </tr></table>
    </td>
  </tr>

  <!-- Headline -->
  <tr>
    <td style="padding:0 0 24px;">
      <h1 style="margin:0 0 6px;color:#F0F4FF;font-size:22px;font-weight:600;line-height:1.3;">
        Your fairness audit is ready
      </h1>
      <p style="margin:0;color:#8A97B0;font-size:14px;">
        Dataset: <span style="color:#F0F4FF;font-family:monospace;">${filename}</span>
      </p>
    </td>
  </tr>

  <!-- Score card -->
  <tr>
    <td style="background:#141820;border:1px solid #252D3D;border-radius:16px;
      padding:28px 32px;margin-bottom:24px;">
      <table width="100%" cellpadding="0" cellspacing="0"><tr>
        <td style="vertical-align:middle;">
          <p style="margin:0 0 2px;color:#8A97B0;font-size:11px;text-transform:uppercase;
            letter-spacing:0.08em;">FairScan Score</p>
          <p style="margin:0 0 10px;">
            <span style="font-size:60px;font-weight:700;color:${scoreColor};
              line-height:1;">${fairscanScore}</span>
            <span style="font-size:18px;color:#8A97B0;"> / 100</span>
          </p>
          <span style="background:${scoreColor}22;color:${scoreColor};padding:4px 14px;
            border-radius:999px;font-size:12px;font-weight:500;text-transform:capitalize;">
            ${riskLevel} Risk
          </span>
        </td>
        <td style="vertical-align:middle;text-align:right;padding-left:20px;">
          <table cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:4px 0;">
                <span style="color:#F05252;font-size:13px;font-family:monospace;
                  font-weight:600;">${criticalCount}</span>
                <span style="color:#8A97B0;font-size:12px;"> Critical</span>
              </td>
            </tr>
            <tr>
              <td style="padding:4px 0;">
                <span style="color:#F97316;font-size:13px;font-family:monospace;
                  font-weight:600;">${highCount}</span>
                <span style="color:#8A97B0;font-size:12px;"> High</span>
              </td>
            </tr>
            <tr>
              <td style="padding:4px 0;">
                <span style="color:#FBBF24;font-size:13px;font-family:monospace;
                  font-weight:600;">${mediumCount}</span>
                <span style="color:#8A97B0;font-size:12px;"> Medium</span>
              </td>
            </tr>
            <tr>
              <td style="padding:4px 0;border-top:1px solid #252D3D;">
                <span style="color:#8A97B0;font-size:12px;font-family:monospace;">
                  ${totalSlices} total slices
                </span>
              </td>
            </tr>
          </table>
        </td>
      </tr></table>
    </td>
  </tr>

  <tr><td style="height:20px;"></td></tr>

  <!-- Flagged slices -->
  <tr>
    <td style="background:#141820;border:1px solid #252D3D;border-radius:16px;overflow:hidden;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr style="background:#1C2230;">
          <th style="padding:11px 14px;text-align:left;color:#8A97B0;font-size:11px;
            text-transform:uppercase;letter-spacing:0.06em;font-weight:500;">Slice</th>
          <th style="padding:11px 14px;text-align:left;color:#8A97B0;font-size:11px;
            text-transform:uppercase;letter-spacing:0.06em;font-weight:500;">Metric</th>
          <th style="padding:11px 14px;text-align:left;color:#8A97B0;font-size:11px;
            text-transform:uppercase;letter-spacing:0.06em;font-weight:500;">Value</th>
          <th style="padding:11px 14px;text-align:left;color:#8A97B0;font-size:11px;
            text-transform:uppercase;letter-spacing:0.06em;font-weight:500;">Risk</th>
        </tr>
        ${sliceRows}
      </table>
    </td>
  </tr>

  <tr><td style="height:28px;"></td></tr>

  <!-- CTA button -->
  <tr>
    <td align="center" style="padding:0 0 32px;">
      <a href="https://fairscan.vercel.app"
        style="display:inline-block;background:#4F8EF7;color:#ffffff;text-decoration:none;
          padding:14px 36px;border-radius:10px;font-size:15px;font-weight:500;
          letter-spacing:-0.2px;">
        Open FairScan →
      </a>
      <p style="margin:12px 0 0;color:#4A5568;font-size:12px;">
        Re-run your audit or explore fix recommendations
      </p>
    </td>
  </tr>

  <!-- Privacy note -->
  <tr>
    <td style="background:#141820;border:1px solid #252D3D;border-radius:12px;
      padding:16px 20px;margin-bottom:32px;">
      <p style="margin:0;color:#8A97B0;font-size:12px;line-height:1.7;">
        🔒 <strong style="color:#F0F4FF;">Your data never left your browser.</strong>
        FairScan computes all fairness metrics locally. Only aggregated results
        (no raw rows) were used to generate this email.
      </p>
    </td>
  </tr>

  <tr><td style="height:24px;"></td></tr>

  <!-- Footer -->
  <tr>
    <td style="border-top:1px solid #1C2230;padding-top:24px;text-align:center;">
      <p style="margin:0;color:#4A5568;font-size:12px;line-height:2;">
        Sent by FairScan · AI Bias Auditor<br/>
        Powered by Gemini 2.5 Flash<br/>
        Built for Google Developers Solution Challenge 2026<br/>
        <a href="https://fairscan.vercel.app"
          style="color:#4F8EF7;text-decoration:none;">fairscan.vercel.app</a>
      </p>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

export default async function handler(req: Request): Promise<Response> {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 });
  }

  // Validate required fields
  const { to, filename, fairscanScore, riskLevel, mode } = body;
  if (!to || !to.includes('@') || !to.includes('.')) {
    return new Response(JSON.stringify({ error: 'Invalid email address' }), { status: 400 });
  }
  if (!filename || fairscanScore === undefined || !riskLevel || !mode) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
  }

  // Build attachments only for full mode
  const attachments =
    mode === 'full' && body.pdfBase64
      ? [{
          filename: `FairScan_Report_${filename.replace(/\.csv$/i, '')}.pdf`,
          content: body.pdfBase64,
        }]
      : [];

  const subject =
    mode === 'full'
      ? `FairScan Report attached — ${fairscanScore}/100 ${riskLevel.toUpperCase()} RISK`
      : `Your FairScan audit: ${fairscanScore}/100 ${riskLevel.toUpperCase()} RISK · ${filename}`;

  try {
    const { data, error } = await resend.emails.send({
      from: 'FairScan <onboarding@resend.dev>',
      to: [to],
      subject,
      html: buildEmailHTML(body),
      attachments,
    });

    if (error) {
      console.error('Resend error:', error);
      return new Response(JSON.stringify({ error: error.message }), { status: 400 });
    }

    return new Response(JSON.stringify({ success: true, id: data?.id }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Unexpected error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    );
  }
}
