# Contact form deployment (Resend)

The contact form posts JSON to /api/contact. The function uses Resend's HTTPS API and sends one plain-text message to the configured business mailbox. Replies go to the visitor. No automatic visitor email is sent.

Configure these server-only Vercel variables for Preview and Production:

- RESEND_API_KEY: a sending-only API key restricted to the verified domain
- CONTACT_FROM_EMAIL: noreply@alkemadeinternational.com
- CONTACT_TO_EMAIL: alkemade@nl-alkemade.com

Never commit secrets. Redeploy after changing variables. For local development, set the same variables in an ignored .env file and run npm start with a current Node.js version supporting fetch.

Verify in a preview: submit synthetic contact data, check the Resend email ID and delivery status, confirm arrival in the target mailbox, and verify Reply-To. Test invalid input and a failed API configuration separately. The honeypot and in-memory throttling are basic safeguards; configure a distributed rate limit or verified bot challenge before relying on them for sustained abuse prevention.

A successful API response means Resend accepted the message, not that the recipient inbox necessarily received it. Review data processing and the privacy notice before production.
