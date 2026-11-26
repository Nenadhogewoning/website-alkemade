# Image optimization — phase 1

The Vercel build now runs `npm run build`, which generates the static website in `dist/`. It preserves all original photos and logos in Git and keeps original image URLs accessible. Only the generated HTML references the optimized copies. The original HTML remains usable for local development with `npm start`.

The build uses pinned Sharp 0.35.5, rotates according to EXIF, scales down without cropping or upscaling, and uses lossless WebP for logos (at the reduced resolution) and quality 88 WebP for photos. If an optimized file is not smaller, the original remains in use. The build fails on missing/corrupt files instead of silently publishing broken images.

The build logs contain exact before/after bytes and dimensions for the 26 referenced local assets, plus a total. External photos, CSS, layout, and JavaScript are unchanged. Original files are not deleted; the size of the Git repository and deployment storage is not reduced by this phase. The contact API remains in the root api directory, outside the static build output.

Preview review: compare logos and photos on desktop and mobile, check that all image requests succeed, inspect transparency and colors, confirm the contact form GET config and end-to-end sending with Turnstile (add the exact preview hostname to Cloudflare first), and compare PageSpeed measurements. Do not merge until explicitly approved.
