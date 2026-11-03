# WorkPulse: Separate owner and kiosk logins

## 1. Supabase
Run **only** `supabase/kiosk_credentials_upgrade.sql` in SQL Editor on your existing WorkPulse project. Do not rerun the original schema or erase devices.

## 2. Environment
In the Next.js project `.env.local`, add `KIOSK_SESSION_SECRET` as 64+ random hex characters generated with `python3 -c "import secrets; print(secrets.token_hex(32))"`. Add this same secret to Vercel Project > Environment Variables > Production. Do not put it in `NEXT_PUBLIC_` and never commit `.env.local`.
Keep your existing Supabase and FACE_SERVICE credentials. Rotate the previously exposed service-role key before production use.

## 3. Owner creates a kiosk login
Owner logs in at `/`, opens Office Kiosks, enters device name, clicks **Create Kiosk Login**. Copy the generated Kiosk ID and password immediately. Password is only shown once. Each phone gets distinct credentials. Existing legacy devices keep their original token authorization for compatibility, but new logins use signed device sessions.

## 4. Phone login
On a dedicated phone, open `https://YOUR_DOMAIN/kiosk`, enter the Kiosk ID + password, choose **Sign In to Kiosk**. Then Start Camera and Clock In/Out. Add the URL to the phone home screen for PWA mode. The device session persists locally for seven days and is invalidated when the kiosk is revoked. Do not use shared/public phones and use device lock.

## 5. Reset or revoke
In Office Kiosks click Reset Password to change login password (already logged-in devices retain sessions until expiry or revoke), or Revoke to immediately block punch and session verification. Reset requires copying the new password. Restored kiosks can be enabled in dashboard.

## 6. Testing and deployment
`npm install && npx tsc --noEmit && npm run build` (with `.env.local` configured). Test a new kiosk login, refresh, revoke, then confirm further scans fail. Deploy to existing Vercel project only after checks pass. Python face engine still needs HTTPS hosting for phones; localhost:8000 does not work from Vercel. Liveness/anti-spoofing remains unimplemented. Don't use untested recognition for real payroll.

## Security note
This initial deployment includes password hashing (scrypt), 7-day signed kiosk sessions, server-side membership checks for admins, and active-device checking on every punch. Add rate limiting, credential lockouts, device-bound sessions and session version revocation before production-scale use. Biometric privacy notices and proper permission/legal basis remain required.
