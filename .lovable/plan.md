Strip "Your data stays yours. Always." (and its Spanish equivalent) from every surface where it appears:

1. **Translations**
   - Remove `dataStaysYours` key from `src/i18n/locales/en.json` and `src/i18n/locales/es.json`

2. **Sign-in page**
   - Remove the small `<p>` tag at the bottom of the sign-in card that renders `{t("signIn.dataStaysYours")}` in `src/routes/sign-in.tsx`

3. **Meta descriptions**
   - Trim the sentence "Your data stays yours." from `og:description` and `twitter:description` in `src/routes/__root.tsx`

4. **Site footer**
   - Remove " · Your data stays yours." from the footer tagline in `src/components/layout/site-footer.tsx`

No new strings or replacements are needed — the surrounding copy already carries the privacy message (footer has a Privacy link, meta descriptions still say "No ads", etc.)