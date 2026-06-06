# Project Memory

## Core
Never use em dashes (`—`, U+2014) anywhere. Replace with `,`, `and`, `or`, `:`, `.`, or split the sentence. Enforced by `npm run check:em-dash`.
SiteFooter renders on all viewports for marketing/auth routes only. The signed-in AppShell never renders it. Do not gate the footer on `lg:` or larger breakpoints.

## Memories
- [Footer visibility](mem://design/footer-visibility) - Footer shown on mobile/tablet/desktop for marketing pages, hidden in the signed-in app shell.
- [No em dashes](mem://constraint/no-em-dash) - Banned char `—` and the replacement table by context (comma, and/or, colon, period, ·, en dash for "no data").