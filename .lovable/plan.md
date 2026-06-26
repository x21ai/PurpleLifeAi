## Plan

1. Update the Tools page “Wear and care” rows so **How Purple thinks** links directly to the authenticated in-app route `/settings/how-purple-thinks` instead of the public redirect route.

2. Keep the row styling unchanged and continue using TanStack `Link`, so navigation stays in-app and preserves the current session.

3. Check the related rows:
   - Leave `Privacy & data` and `About Purple` as public in-app pages unless you want those moved into authenticated settings too.

4. Verify by clicking **How Purple thinks** from `/tools` while signed in and confirming it opens the in-app page without showing the sign-in screen.