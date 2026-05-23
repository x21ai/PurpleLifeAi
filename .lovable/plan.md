
# Purple — Backend, Schema, Auth

Enable Lovable Cloud, build the full schema with RLS, set up magic-link auth, and build the onboarding/sign-in screen.

## 1. Enable Lovable Cloud

Provisions Supabase, generates the three Supabase clients (`client.ts`, `client.server.ts`, `auth-middleware.ts`) plus env vars. No code changes needed before this — just enable.

## 2. Database schema (one migration)

All tables get `id uuid primary key default gen_random_uuid()` unless noted, `user_id uuid not null references auth.users(id) on delete cascade`, `created_at timestamptz default now()`, and `enable row level security`. Each gets a single permissive policy `auth.uid() = user_id` for ALL with check (profiles uses `auth.uid() = id`).

Tables created exactly per spec:
- `profiles` (pk = `id` referencing `auth.users(id) on delete cascade`)
- `journal_entries` — `linked_seizure_id`/`linked_medication_dose_id` are nullable uuids with FKs to the respective tables (`on delete set null`)
- `seizure_events`
- `medications`
- `medication_doses` — FK to `medications(id) on delete cascade`
- `biometrics` — every metric column nullable as listed
- `oura_tokens` (`user_id` is PK)
- `whoop_tokens` (`user_id` is PK)
- `risk_forecasts` — unique `(user_id, for_date)`
- `alerts`

Helpful indexes: `journal_entries(user_id, captured_at desc)`, `seizure_events(user_id, started_at desc)`, `medication_doses(user_id, scheduled_at)`, `biometrics(user_id, recorded_at desc)`, `risk_forecasts(user_id, for_date desc)`, `alerts(user_id, created_at desc) where acknowledged = false`.

Profile auto-create trigger:
```sql
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id) values (new.id) on conflict do nothing;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

## 3. Private storage bucket

Create bucket `journal-media` (private). Four storage policies on `storage.objects` for that bucket, each requiring `(storage.foldername(name))[1] = auth.uid()::text`: SELECT, INSERT, UPDATE, DELETE. Convention: paths must start with `<user_id>/...`.

## 4. Auth configuration

Email magic link only. No password, no social. Site URL + redirect URL set to current origin (Cloud handles defaults). No `configure_social_auth` call.

## 5. Onboarding / sign-in screen

New public route `src/routes/sign-in.tsx`:
- Centered, calm composition on `bg-background`
- Large "PURPLE" wordmark in Inter SemiBold with wide letter-spacing (`tracking-[0.35em]`)
- Tagline in Source Serif 4: "A quiet intelligence for your health."
- Three short sentences (sans, muted) — paraphrased from the brand: write/speak/snap anything; Purple notices patterns over time; your data stays yours, always.
- Email input + "Send me a sign-in link" button
- On submit: `supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin + "/" } })`
- Success state: "Check your inbox — the link will sign you in."
- Footer microcopy: "Free forever. Open source. No ads."

## 6. Auth state + route guard

- `src/integrations/supabase/use-auth.ts` — small hook subscribing to `onAuthStateChange` (listener BEFORE `getSession()`), stores `{ session, loading }` in a React context provider mounted in `__root.tsx` `RootComponent`.
- `src/routes/_app.tsx` — add `beforeLoad` that checks the session via the browser supabase client; redirect to `/sign-in` if unauthenticated. Keep the AppShell component as the route component.
- Update `__root.tsx` to wrap children with the AuthProvider and invalidate the router on auth state change.
- Sign-in route redirects to `/` if already authenticated.

## 7. Settings page touch-up

Add a "Sign out" button to `_app/settings.tsx` calling `supabase.auth.signOut()`. (Tiny addition — keeps the placeholder text but adds a real action.)

## Files

- New migration under `supabase/migrations/` (schema + RLS + trigger + storage bucket + storage policies)
- `src/routes/sign-in.tsx` (public)
- `src/integrations/supabase/auth-context.tsx`
- `src/routes/__root.tsx` (wrap with AuthProvider, invalidate on auth change)
- `src/routes/_app.tsx` (add `beforeLoad` redirect)
- `src/routes/_app/settings.tsx` (add sign-out)

## Out of scope this turn

Wearable OAuth flows, AI pipelines, journal capture UI, reminders, risk forecast computation. Tables and storage are ready for those to be wired up next.

## Verification

After build: visit `/` → redirects to `/sign-in`. Submit email → success message. Inspect Cloud → tables, policies, bucket, trigger all present. `auth.users` insert produces a `profiles` row.
