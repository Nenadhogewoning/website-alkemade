# Contact form deployment (Resend)

The contact form posts JSON to /api/contact. The function uses Resend's HTTPS API and sends one plain-text message to the configured business mailbox. Replies go to the visitor. No automatic visitor email is sent.

Configure these server-only Vercel variables for Preview and Production:

- RESEND_API_KEY: a sending-only API key restricted to the verified domain
- CONTACT_FROM_EMAIL: noreply@alkemadeinternational.com
- CONTACT_TO_EMAIL: alkemade@nl-alkemade.com
- TURNSTILE_SITE_KEY: public widget identifier (GET /api/contact returns this value only)
- TURNSTILE_SECRET_KEY: private Cloudflare Siteverify key

Never commit secrets. Redeploy after changing variables. For local development, set the same variables in an ignored .env file and run npm start with a current Node.js version supporting fetch.

Verify in a preview: submit synthetic contact data, check the Resend email ID and delivery status, confirm arrival in the target mailbox, and verify Reply-To. Test invalid input and a failed API configuration separately. Turnstile is mandatory: Siteverify must accept the token, hostname and contact_form action before any email is sent. Configure the real production hostname and exact Vercel preview hostname in the widget settings, never the shared vercel.app domain. Test successful delivery, missing and expired/duplicate tokens, and a blocked challenge. Use a fresh token for retries. The existing honeypot and per-instance throttling remain additional safeguards; distributed rate limiting is a possible follow-up.

A successful API response means Resend accepted the message, not that the recipient inbox necessarily received it. Review data processing and the privacy notice before production.

Turnstile communicates with Cloudflare in the visitor's browser; include it in the privacy assessment. Do not enable a bypass if the widget or secret is unavailable.
