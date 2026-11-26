# Technical SEO foundation

Canonical origin: https://alkemadeinternational.com (verified production domain).
The generated HTML and sitemap share the same list of ten existing pages.
The homepage canonical is /; existing subpage URLs retain their .html suffixes.
Internal links to index.html are normalized to / in generated HTML.
The sitemap contains no invented modification dates. robots.txt allows public pages
and points to the sitemap; /api/ is excluded from crawling, not secured by robots.txt.

The Vercel route table redirects /index.html permanently (308), keeps the existing
immutable cache header for /assets/, checks the filesystem (including the contact
function), and returns 404 for unmatched paths instead of the homepage. The new
404 page has noindex and links back to the homepage. The local Express server
returns corresponding status codes and serves the SEO endpoints.
The normal page markup and contact handler remain unchanged.

The verified apex and default Vercel hostname both serve the project.
Canonical tags designate the apex. No DNS records, domain bindings, preview
protection, or live project settings are changed in this PR. A separate domain
redirect can be considered after approval; preview URLs must remain usable.

Run node scripts/test-seo.js for the unit checks. Review preview sitemap XML,
robots text, all ten canonicals, /index.html redirect, nonexistent URLs, asset
caching, contact API configuration, and visual parity.
Submit the sitemap in Search Console only after production deployment.
Separate language URLs and hreflang are reserved for the international SEO phase.
