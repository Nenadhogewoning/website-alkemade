// Same-origin contact endpoint for Vercel and local Express.
const attempts = new Map();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const limits = { name: 120, email: 254, company: 160, phone: 60, subject: 160, message: 5000 };
const emailPattern = /^[^\s@<>,;:"\\]+@[^\s@<>,;:"\\]+\.[^\s@<>,;:"\\]+$/;

function limited(req) {
  // Best-effort per-instance throttling; not a distributed rate limiter.
  const now = Date.now();
  for (const [key, value] of attempts) {
    if (value.until <= now) attempts.delete(key);
  }
  const forwarded = process.env.VERCEL ? req.headers['x-vercel-forwarded-for'] : null;
  const ip = (typeof forwarded === 'string' && forwarded.split(',')[0].trim()) || req.socket?.remoteAddress || 'unknown';
  let entry = attempts.get(ip);
  if (!entry) {
    if (attempts.size >= 5000) return true;
    entry = { count: 0, until: now + WINDOW_MS };
    attempts.set(ip, entry);
  }
  if (entry.count >= MAX_ATTEMPTS) return true;
  entry.count++;
  return false;
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const fail = (status, error) => res.status(status).json({ success: false, error });
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return fail(405, 'method_not_allowed');
  }
  try {
    const origin = new URL(req.headers.origin || '');
    if (origin.host !== req.headers.host || !['https:', 'http:'].includes(origin.protocol)) {
      return fail(403, 'forbidden_origin');
    }
  } catch {
    return fail(403, 'forbidden_origin');
  }
  if (!/^application\/json(?:\s*;|$)/i.test(req.headers['content-type'] || '')) {
    return fail(415, 'unsupported_content_type');
  }
  if (Number(req.headers['content-length']) > 32768) return fail(413, 'payload_too_large');

  let body = req.body;
  if (typeof body === 'string') {
    if (Buffer.byteLength(body, 'utf8') > 32768) return fail(413, 'payload_too_large');
    try { body = JSON.parse(body); } catch { return fail(400, 'invalid_json'); }
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return fail(400, 'invalid_input');
  if (Buffer.byteLength(JSON.stringify(body), 'utf8') > 32768) return fail(413, 'payload_too_large');
  if (body.website_url !== undefined && body.website_url !== '') return fail(400, 'invalid_input');

  const fields = {};
  for (const [key, max] of Object.entries(limits)) {
    const raw = body[key] ?? '';
    if (typeof raw !== 'string' || raw.length > max) return fail(400, 'invalid_input');
    fields[key] = raw.trim();
  }
  const { name, email, company, phone, subject, message } = fields;
  if (!name || !emailPattern.test(email) || !subject || !message ||
      [name, email, company, phone, subject].some(value => /[\r\n\0]/.test(value))) {
    return fail(400, 'invalid_input');
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.CONTACT_FROM_EMAIL;
  const to = process.env.CONTACT_TO_EMAIL;
  if (!apiKey || !from || !to || !emailPattern.test(from) || !emailPattern.test(to)) {
    console.error('Contact email configuration missing or invalid');
    return fail(503, 'mail_unavailable');
  }
  if (limited(req)) {
    res.setHeader('Retry-After', '600');
    return fail(429, 'rate_limited');
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Alkemade International <' + from + '>',
        to: [to],
        reply_to: email,
        subject: 'Nieuw contactverzoek: ' + subject,
        text: ['Naam: ' + name, 'Bedrijf: ' + (company || '-'), 'E-mail: ' + email,
          'Telefoon: ' + (phone || '-'), 'Onderwerp: ' + subject, '', 'Bericht:', message].join('\n')
      }),
      signal: AbortSignal.timeout(10000)
    });
    const result = await response.json();
    if (!response.ok || typeof result.id !== 'string' || !result.id) {
      console.error('Resend contact request failed, HTTP status:', response.status);
      return fail(502, 'mail_unavailable');
    }
    console.info('Resend accepted contact email:', result.id);
    return res.status(200).json({ success: true });
  } catch {
    console.error('Resend contact request failed');
    return fail(502, 'mail_unavailable');
  }
};
