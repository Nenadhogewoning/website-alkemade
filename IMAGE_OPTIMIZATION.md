# Image optimization — phase 1

The Vercel build now runs `npm run build`, which generates the static website in `dist/`. It preserves all original photos and logos in Git and keeps original image URLs accessible. Only the generated HTML references the optimized copies. The original HTML remains usable for local development with `npm start`.

The build uses pinned Sharp 0.35.5, rotates according to EXIF, scales down without cropping or upscaling, and uses lossless WebP for logos (at the reduced resolution) and quality 88 WebP for photos. If an optimized file is not smaller, the original remains in use. The build fails on missing/corrupt files instead of silently publishing broken images.

The build logs contain exact before/after bytes and dimensions for the 26 referenced local assets, plus a total. External photos, CSS, layout, and JavaScript are unchanged. Original files are not deleted; the size of the Git repository and deployment storage is not reduced by this phase. The contact API remains in the root api directory, outside the static build output.

Preview review: compare logos and photos on desktop and mobile, check that all image requests succeed, inspect transparency and colors, confirm the contact form GET config and end-to-end sending with Turnstile (add the exact preview hostname to Cloudflare first), and compare PageSpeed measurements. Do not merge until explicitly approved.

## Phase 2 — responsive loading

Generated HTML assigns eager loading to the header logo and likely above-the-fold photos, lazy loading and asynchronous decoding to other images, and high fetch priority to selected key photos. All local images receive measured intrinsic dimensions unless already provided. External gallery/news images use native loading attributes; their existing CSS fixes the display boxes and the URLs are unchanged.

Responsive WebP widths (240–1440 px, where applicable) are generated from the original, never upscaled, and kept only when smaller than the existing primary image. The phase-1 primary quality/settings are unchanged. The `sizes` hints approximate the existing CSS and account for large fixed-height crops. The homepage hero uses a tiny inline placeholder through `picture` at the exact existing hidden-image breakpoint (1024px); desktop retains the photo. The new Hogewoning Flowers WebP remains unchanged and the unused old logo is no longer converted.

The changes apply to built output (`npm run build`), not the raw HTML used by local development. No new runtime dependencies or external services. Test desktop/mobile visual parity and use browser Network/Performance tools to verify actual candidate selection, lazy loading, CLS and LCP. Build logs report variant byte sizes and per-page loading counts. Contact API and functionality are unchanged. Do not merge without explicit approval.
