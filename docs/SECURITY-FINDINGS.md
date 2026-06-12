# Security findings

Audit from the overnight hardening pass (PR 2). Items marked **fixed** shipped in migration `20260613010000_security_hardening.sql` or companion app changes.

## Care invite tokens

| Finding                                                                | Severity | Status    | Notes                                                                                                              |
| ---------------------------------------------------------------------- | -------- | --------- | ------------------------------------------------------------------------------------------------------------------ |
| `invite_token` readable via authenticated SELECT on own caregiver rows | High     | **Fixed** | Column REVOKE + acceptance moved to `accept_care_invite()` / `accept_assigned_care_invite()` SECURITY DEFINER RPCs |
| Token valid indefinitely                                               | Medium   | **Fixed** | Invalid after acceptance (cleared) or 7 days from `created_at`; pending rows default `expires_at`                  |
| Acceptance used service_role direct UPDATE                             | Medium   | **Fixed** | User-scoped RPC with `auth.uid()` + invite email match                                                             |
| Owner UI built links from raw token in API responses                   | Low      | **Fixed** | Server returns `accept_url` only; token stays on service_role path                                                 |

## Community public read

| Finding                                                                | Severity | Status         | Notes                                                                                                                                                                         |
| ---------------------------------------------------------------------- | -------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `user_id` on posts/comments/reactions enumerable by anon               | Medium   | **Fixed**      | Column REVOKE from anon (authenticated retains for edit UX)                                                                                                                   |
| `reporter_id` on `community_reports` visible to any authenticated user | Medium   | **Fixed**      | REVOKE from authenticated; admin reads via service_role                                                                                                                       |
| Author display name vs pseudonym for public posts                      | Low      | **Documented** | Product choice: UI uses `community_display_name` from profiles join server-side; anon never sees raw `user_id`. Changing to fully pseudonymous authors needs design sign-off. |

## SECURITY DEFINER functions

| Finding                                                 | Severity | Status    | Notes                                |
| ------------------------------------------------------- | -------- | --------- | ------------------------------------ |
| Email queue wrappers missing pinned `search_path`       | Medium   | **Fixed** | `ALTER FUNCTION ... SET search_path` |
| `care_clear_invite_token_on_accept` missing pinned path | Low      | **Fixed** | Pinned to `public`                   |

## Storage

| Finding                                                      | Severity | Status       | Notes                                                                                                          |
| ------------------------------------------------------------ | -------- | ------------ | -------------------------------------------------------------------------------------------------------------- |
| `journal-media` / `reports` buckets rely on folder = user id | Low      | **Verified** | Policies recreated explicitly owner-only; caregivers use signed URLs from server functions, not storage SELECT |

## Needs human decision

1. **Community author identity**: Should public posts show real first names, pseudonyms only, or optional per-user setting?
2. **Friend invite tokens**: Same hardening pattern as care invites not applied in this pass (friends feature dark-launched).

## RLS regression coverage

See `tests/e2e/rls-isolation.spec.ts`. Runs when `TEST_USER_EMAIL`, `TEST_USER_PASSWORD`, `TEST_USER_B_EMAIL`, and `TEST_USER_B_PASSWORD` are set. Asserts cross-user reads on meds, journal, doses, and reports return empty/error, not another user's rows.
