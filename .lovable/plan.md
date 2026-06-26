## Plan

1. **Stop using hashed build assets for home marketing photos**
   - Move or copy the four home page image files into `public/assets/marketing/` with stable filenames.
   - This avoids published pages pointing at generated hashed files that may not exist on the live deployment.

2. **Make the home image registry use stable public URLs**
   - Update the home image definitions so they reference `/assets/marketing/...` directly.
   - Keep width, height, and alt text so layout remains stable and accessible.

3. **Make `ResponsiveImage` support both image sources safely**
   - Keep existing `vite-imagetools` picture support for other pages.
   - Add support for stable public image URLs used by the home page.
   - Render a normal `<img>` for public URL assets so the browser always loads the exact file.

4. **Verify against the published failure mode**
   - Check that the image URLs return actual image files instead of the app 404 page.
   - Load the home page and confirm the hero and lower home images render rather than showing alt text.

## Expected result

The home page images will use durable public paths, so they stay visible on the live website across reloads and future deployments instead of depending on missing generated asset hashes.