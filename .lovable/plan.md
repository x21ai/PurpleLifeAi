## Improve invalid-credentials error UX on /sign-in

Right now, when sign-in fails (e.g. `Invalid login credentials`), the page shows a small red text line under the submit button. The user wants stronger feedback: a toast **and** red borders on the email + password fields.

### Changes (single file: `src/routes/sign-in.tsx`)

1. **Toast on auth failure** — after `signInWithPassword`/`signUp` returns an error, call `toast.error(...)` with a friendly message:
   - `Invalid login credentials` → "Email or password is incorrect."
   - `Email not confirmed` → "Please confirm your email first."
   - Other errors → the Supabase message as-is.

2. **Red borders on email + password fields** when `status === "error"`:
   - Add `aria-invalid={status === "error"}` to both `<Input>` and `<PasswordInput>`.
   - Append a conditional class: `border-destructive focus-visible:ring-destructive` when invalid.
   - Clear the error state on the next `onChange` of either field so the red border disappears as soon as the user starts correcting.

3. **Keep the inline message** under the submit button for accessibility (`role="alert"`), but it becomes a secondary signal — the toast and red borders are the primary cue.

4. **Forgot-password and sign-up** errors get the same toast treatment for consistency.

### Out of scope

- No changes to social sign-in, OAuth handling, password reset flow, or the verify-email panel.
- No copy changes outside the error messages above.
- No styling changes to the form when there's no error.
