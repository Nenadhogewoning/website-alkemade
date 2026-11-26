# International SEO — phase 4

Ten existing Dutch canonical URLs remain unchanged. Each template is built in Dutch,
English and Spanish, with language-specific static HTML, title, description, image
descriptions, Open Graph, JSON-LD and internal links. The existing translation
dictionary in js/main.js is reused directly at build time; the browser does not
retranslate or override static pages from storage. Additional mission bullets,
gallery captions and generic alt text are translated. Company names and the
brand slogan remain as appropriate. Every page has self-canonical, reciprocal
nl/en/es and x-default (Dutch) links. The sitemap contains 30 canonical URLs and
120 alternate links. All pages share fingerprinted CSS/JS/images.

The dropdown uses real links to the equivalent page in another language.
URL language takes priority over stored language; no automatic language redirect.
Contact submission still uses /api/contact and existing Turnstile logic. Since
switching language loads another page, an unsent draft triggers a confirmation
before leaving; no contact data is stored in browser storage. Search results
use the current language's route map and retain existing ranking/content.
Existing search availability per page is unchanged. Gallery categories, news
modal and placeholder legal links are preserved. Local preview: npm run build
then npm start. Vercel routes redirect slashless and directory index aliases to
the canonical slash URL, preserving API and cache routing.

Review all 30 pages, translations, mobile/desktop menu, search, gallery, news,
and contact submissions. No DNS/domain/production change until reviewed PR is
merged. Submit the updated sitemap after deployment.
