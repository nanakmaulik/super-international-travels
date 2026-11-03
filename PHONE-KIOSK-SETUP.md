# WorkPulse Mobile Kiosk (PWA)

## What's included
- Installable standalone kiosk at `/kiosk` with branded Home Screen icon and fullscreen-friendly layout
- Front camera, Clock In / Clock Out, current clock, network status, camera retry, screen wake lock (where supported), accessible feedback
- Device token persists in the browser, so the same phone remains a registered office kiosk
- No offline attendance, cached API responses, or cached biometrics. Every punch must be confirmed by the server.

## How to update your existing working project
This ZIP contains the entire upgraded project, but you can alternatively copy only:

- `app/kiosk/page.tsx`
- `app/kiosk/layout.tsx` (new)
- `app/globals.css` (append the section starting `/* WorkPulse installable mobile kiosk */` rather than overwriting if you've made other CSS changes)
- `public/manifest.webmanifest` (new)
- `public/sw.js` (new)
- `public/icons/*` (new)

**Do not overwrite `.env.local`**, `face-service/.env`, or your downloaded ONNX models. These files are intentionally NOT distributed in this ZIP.

## Local smoke test

```bash
cd ~/Downloads/workpulse-selfhost-face-upgrade
npm install
npm run dev
```

Open `http://localhost:3000/kiosk` on Mac and verify you can activate the kiosk, start the camera and see both punch actions. Real face matching requires the Python face service and a working Supabase connection.

## Real phone deployment

1. Build and deploy the updated Next.js project to **Vercel**. Use HTTPS on the deployed domain (required for camera access).
2. Host the FastAPI `face-service` on an **internet-reachable HTTPS backend**. The Mac-only URL `http://127.0.0.1:8000` is NOT reachable from Vercel or from office phones.
3. On Vercel set **server-side** `FACE_SERVICE_URL=https://your-face-service-domain` and `FACE_SERVICE_TOKEN` to the same token configured for the Python service. Keep the token and Supabase service-role key private.
4. Verify the full enrollment → face identification → attendance event in a test environment before relying on it for payroll. A successful `/health` is not proof of identity verification accuracy.
5. On an office phone open `https://YOUR-DOMAIN/kiosk`, paste the token created by Admin → Office Kiosks, and start the camera.
6. iPhone/iPad: open in **Safari** → Share → **Add to Home Screen** → Add. Android: open in **Chrome** → menu → **Install app** / **Add to Home screen**.
7. Open the WorkPulse icon to launch the standalone kiosk. Set the device to stay awake or use Guided Access/Screen Pinning as appropriate; Screen Wake Lock is best-effort and not supported everywhere.

## Security and readiness
- Kiosk tokens are stored in localStorage on the phone; use a dedicated locked office device and revoke/replace device tokens if compromised.
- No anti-spoofing/liveness is implemented. This is not yet sufficient for unattended high-assurance identification or payroll automation.
- Don't deploy face recognition commercially until model-weight licensing, privacy notices/lawful basis, retention/deletion, access controls, and real-world error testing are complete.
- No PWA feature can make a localhost-only Python server available on Vercel. Face backend hosting is a required separate step.
