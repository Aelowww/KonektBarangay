# Supabase security setup

## Current status (applied 2026-10-04)

| Step | Status |
|---|---|
| 1. Confirm email, 8-char passwords with all character types, 6-digit codes, 15-min expiry | ✅ Done |
| 2. "Confirm signup" and "Reset password" templates include `{{ .Token }}` | ✅ Done |
| 3. Site URL → `https://konektbarangay.vercel.app`; redirect URLs for live site + localhost | ✅ Done |
| 4. `security.sql` applied and tested (role escalation + self-approval blocked) | ✅ Done |
| 4b. All 58 existing accounts marked **approved**; 9 accounts that had no profile got one | ✅ Done |
| 4c. `id-verification.sql` applied: private `resident-ids` bucket, ID upload + admin review (tested) | ✅ Done |
| 4d. `features.sql` applied: News & Events, Blotter reports, full name collected at ID verification | ✅ Done |
| 5. Cloudflare Turnstile | ⏳ Needs the project owner (secret key) |
| 6. Custom SMTP (sender name "KonektBarangay" instead of "Supabase Auth") | ⏳ Needs the project owner (email provider credentials) |
| 7. Branded email templates in `email-templates/` | ⏳ Paste into Authentication → Emails → Templates |
| 8. `handle_new_user()` given a fixed `search_path` (advisor warning) | ✅ Done |

**Security issues found and fixed during setup:**

- `handle_new_user_profile()` copied the `role` from sign-up metadata (browser-controlled) with
  `on conflict do update`, so anyone could register as an **admin**. It now always creates residents.
- The `Residents can update own requests` policy let residents set their own request to **approved** via
  the API. A trigger now only lets residents cancel their own pending requests.
- Site URL was `http://localhost:3000`, so email links sent to real residents pointed at localhost.
- Email confirmation was off, so anyone could sign up with an email they don't own.

---

The sections below explain each setting, in case it needs to be redone on another project.

## 1. Require email verification

**Authentication → Sign In / Providers → Email**

- **Confirm email:** ON
- **Secure email change:** ON
- **Email OTP expiration:** `900` seconds (15 minutes) is a good balance
- **Email OTP length:** `6`
- **Minimum password length:** `8`
- **Password requirements:** *Lowercase, uppercase letters, digits and symbols* (matches the sign-up form)

## 2. Put the code in the emails

**Authentication → Emails → Templates**

By default Supabase only sends a link. Add `{{ .Token }}` so residents get a 6-digit code.

**Confirm signup** — subject: `Your KonektBarangay verification code`

```html
<h2>Verify your KonektBarangay account</h2>
<p>Enter this code in the app to activate your account:</p>
<p style="font-size:28px;font-weight:700;letter-spacing:6px">{{ .Token }}</p>
<p>This code expires in 15 minutes. If you didn't create an account, you can ignore this email.</p>
```

**Reset password** — subject: `Your KonektBarangay password reset code`

```html
<h2>Reset your KonektBarangay password</h2>
<p>Enter this code in the app:</p>
<p style="font-size:28px;font-weight:700;letter-spacing:6px">{{ .Token }}</p>
<p>Or <a href="{{ .ConfirmationURL }}">click here to reset your password</a>.</p>
<p>If you didn't ask for this, you can ignore this email — your password won't change.</p>
```

**Branded versions** of these templates (navy header, big code box) are in [`email-templates/`](./email-templates).
Paste each whole file into the matching template body and set the subject:

| File | Template | Subject |
|---|---|---|
| `confirm-signup.html` | Confirm sign up | Your KonektBarangay verification code |
| `reset-password.html` | Reset password | Your KonektBarangay password reset code |
| `change-email.html` | Change email address | Confirm your new KonektBarangay email |

> **Email sending limits:** Supabase's built-in email service only sends a few emails per hour and is meant for
> testing. For real residents, connect your own SMTP (e.g. Resend, Brevo, SendGrid) under
> **Authentication → Emails → SMTP Settings**, otherwise verification codes will stop arriving.

## 3. Allow the reset-password page

**Authentication → URL Configuration**

- **Site URL:** `https://konektbarangay.vercel.app`
- **Redirect URLs:** add
  - `https://konektbarangay.vercel.app/reset-password`
  - `http://localhost:3000/reset-password`

## 4. Run the database hardening script

**SQL Editor → New query →** paste [`security.sql`](./security.sql) **→ Run**

It adds triggers that enforce, on the server:

| Rule | Why |
|---|---|
| New profiles are always `resident`; only admins can change roles | Stops people signing up as admin by editing the request |
| Residents can only cancel their own pending request | Stops self-approving or editing a request through the API |
| Admins can't file requests | Admins process requests only |
| Email must be verified to file a request | Blocks throwaway accounts |
| Max 3 pending requests, no duplicate pending document, max 5 per 24 h | Request spam |
| Weekday, today-or-later appointments; field length caps | Junk / oversized data |

To make someone an admin afterwards:

```sql
update public.profiles set role = 'admin' where id = '<user uuid>';
```

## 5. (Recommended) "Verify you're human" with Cloudflare Turnstile

1. Create a free widget at **Cloudflare dashboard → Turnstile** for `konektbarangay.vercel.app` and `localhost`.
2. In Supabase: **Authentication → Attack Protection → Enable CAPTCHA protection** → provider **Turnstile** → paste the **secret key**.
3. Add the **site key** to `.env.local` and to Vercel → Project → Settings → Environment Variables:

   ```env
   NEXT_PUBLIC_TURNSTILE_SITE_KEY=your_site_key
   ```

4. Redeploy. The check then appears on register, login, resend code and forgot password.

> Turn on steps 2 and 3 together. If CAPTCHA is on in Supabase but the site key is missing, sign-in will fail.

## 6. Rate limits

**Authentication → Rate Limits** — the defaults are fine for a barangay. If you see spam sign-ups, lower
*sign-ups and sign-ins* and *OTP / verification* per IP.

## What the app already does

- Email OTP verification before a new account can sign in
- ID verification: after signing in, unverified residents upload a photo of a valid ID (`/verify-identity`).
  Admins compare it with the registered name on the **Residents** page and approve or reject (with a reason).
  Residents are notified either way and can re-upload after a rejection.
- Separate staff sign-in at `/admin/login` (not linked anywhere, `noindex`). Admin accounts can't sign in on the
  resident login page, and residents can't use the staff page.
- Database-level check that an account is approved (`KB_NOT_APPROVED`)
- Username collected at sign-up; full name (as on the ID) collected at ID verification
- News & Events posts (admins publish; everyone can read published posts)
- Blotter reports: verified residents only, max 3 open and 3 per day, case numbers `BLT-YYYY-0001`,
  residents notified on status changes
- Hidden honeypot field that silently drops bot sign-ups
- Terms & Privacy consent at sign-up
- Login lockout for 60 s after 5 failed attempts (per browser)
- 60 s cooldown on "resend code" / "request new code"
- Password reset by code or link, then sign-out from all devices
- Same response for reset requests whether or not the email exists (no account probing)
- Safe post-login redirects (no open redirect via `?next=`)
- Admins can't open the request flow (menu, page guard, and server proxy)
- Security headers: no framing, no MIME sniffing, strict referrer, HSTS
