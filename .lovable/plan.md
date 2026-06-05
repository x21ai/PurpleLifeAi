Do I know what the issue is? Yes.

The login itself is not the failing part. After sign-in, Purple redirects to `/today`; the app shell then renders multiple `PendingInboxBadge` components in the sidebar/top bar. Each one opens the same realtime channel name: `care-pending-inbox`. The current realtime client throws when a `postgres_changes` callback is added to a channel that is already subscribing/subscribed, so the route error boundary shows “This page didn’t load.”

Plan:

1. Fix the realtime channel crash
   - Update `src/components/care/pending-inbox-badge.tsx` so every mounted badge subscription uses a unique channel topic, instead of reusing the shared `care-pending-inbox` topic.
   - Keep the existing query key shared, so all badge instances still share the same pending count.
   - Keep cleanup with `removeChannel(channel)`.

2. Verify the login landing route no longer crashes
   - Reopen `/today` in the preview and confirm the app shell renders instead of the error page.
   - Check browser console for the previous error: `cannot add postgres_changes callbacks for realtime:care-pending-inbox after subscribe()`.

3. If the same symptom remains after this fix
   - Inspect the next console/server error and fix that specific failing component, but do not change auth code unless the failing signal points to auth itself.