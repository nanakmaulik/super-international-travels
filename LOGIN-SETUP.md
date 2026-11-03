# WorkPulse — Two separate sign-in experiences

## Company owner / administrator
- URL: `/` (your Vercel domain root)
- Email and password via Supabase Auth.
- Access to employees, face enrollment, salary, attendance, payroll and office device registrations.
- Only server-verified `owner` or `admin` memberships can call admin API routes.

## Office kiosk (phone or tablet)
- URL: `/kiosk`
- Full-screen, installable PWA. No company email or password on a shared employee-facing device.
- First-time device activation uses the 64-character kiosk key generated from **Admin → Office Kiosks**.
- Activation checks the token hash in Supabase via `/api/kiosk/activate`; revoked/unknown keys are rejected.
- Device remembers its key in browser storage and verifies again when reopened; settings offer device sign-out.
- Kiosk only sends face capture and `in`/`out` to `/api/kiosk/punch`. It cannot call admin APIs because it has no Supabase admin user token.

## Local setup
1. Copy your existing *rotated* `.env.local` into this project. Never send secrets or commit the file.
2. `npm install && npm run build && npm run dev`.
3. Open `http://localhost:3000` for owner login and `http://localhost:3000/kiosk` for device activation.
4. Enroll an authorized test employee from the dashboard, create a kiosk key, activate one phone, then test one attendance event.

## Deployment
Link to existing Vercel `workpulse` project and deploy only after verifying `npm run build` and current env vars. Configure a deployed private HTTPS face-service URL and matching token for live phone recognition. A Python service bound to Mac localhost is *not reachable from Vercel*.

## Operational security
- Existing registration generates reusable *device credentials*, not one-time human passwords. Protect them from staff; revoke lost devices.
- Browser localStorage stores the device key. A supervised fixed kiosk is recommended. For high-security production, use short-lived device sessions, hardware binding, kiosk lock-down, rate limiting, biometric liveness, and explicit revocation controls.
- Staff biometric collection requires appropriate authorization/privacy notices and retention. Current prototype has no liveness detection.
- Never treat biometric attendance alone as final payroll without human review and applicable payroll compliance.
