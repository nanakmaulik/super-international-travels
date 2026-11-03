# WorkPulse — Self-Hosted Face Recognition Upgrade

This is an updated copy of the existing WorkPulse Next.js SaaS project. Replaces AWS Rekognition with a dedicated, private CPU OpenCV service (YuNet + SFace). Includes 3–5 face samples per employee, per-tenant protected templates, kiosk face matching, and existing attendance/payroll integration.

## Important before running

- **No pretrained model weights are bundled.** Download YuNet/SFace model files from official OpenCV Zoo after checking the license terms for your intended commercial deployment. OpenCV Zoo's repository is Apache-2.0; individual model licenses must be checked separately.
- **An additional inference host is required.** Vercel hosts Next.js and Supabase stores private templates. The `face-service` runs separately in Docker on a cloud VM/service supporting OpenCV (or on a company-controlled computer with a reachable HTTPS endpoint). Simply connecting Vercel + Supabase will **not** enable recognition.
- **No liveness/anti-spoofing in this build.** Do not rely on selfie recognition alone for unattended financial or payroll-related decisions. Do not enroll real employees until the company has established lawful basis, given required notice, addressed data retention and alternatives, and completed security tests.
- A key security consideration: templates are sensitive biometric identifiers; app denies direct client reads of `face_templates`, and only server routes using the service role after checking organization or kiosk token can access them.

## A. Upgrade the existing Supabase database

Run `supabase/face_upgrade.sql` in your **existing** WorkPulse Supabase project's SQL editor. It is additive; don't re-run the original `schema.sql` if you already have the tables. The private `face_templates` table stores 128-length SFace normalized vectors (JSONB), up to 5 per employee. Original AWS `face_id` string is retained for the enrollment status UI (new local values start with `local:`); no new AWS face IDs are produced.

## B. Download models and start private face inference

From `face-service/`, put the following exact files inside `models/`:

- `face_detection_yunet_2023mar.onnx` (YuNet)
- `face_recognition_sface_2021dec.onnx` (SFace)

Official repository: https://github.com/opencv/opencv_zoo

Example direct source URLs (review licenses and integrity before downloading):

```bash
mkdir -p face-service/models
curl -fL https://github.com/opencv/opencv_zoo/raw/main/models/face_detection_yunet/face_detection_yunet_2023mar.onnx -o face-service/models/face_detection_yunet_2023mar.onnx
curl -fL https://github.com/opencv/opencv_zoo/raw/main/models/face_recognition_sface/face_recognition_sface_2021dec.onnx -o face-service/models/face_recognition_sface_2021dec.onnx
```

Create a long random token, e.g. `openssl rand -hex 32`; configure **the same value** as `FACE_SERVICE_TOKEN` on the face-service host and in Vercel (server-side only). Never send this token to the browser.

For local testing:

```bash
cd face-service
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
export FACE_SERVICE_TOKEN='your-long-random-token'
uvicorn main:app --host 127.0.0.1 --port 8000
```

For cloud: build `face-service/Dockerfile`, deploy on your own host with **HTTPS** and restrict access to the WorkPulse Vercel backend where possible; use rate limiting and private network access before production. Set `FACE_SERVICE_URL=https://YOUR-INFERENCE-HOST` and `FACE_SERVICE_TOKEN` in Vercel Production variables. `http://127.0.0.1:8000` only works for locally hosted Next.js, **not** Vercel.

## C. Next.js app

```bash
npm install
cp .env.example .env.local
# Fill in Supabase, FACE_SERVICE_URL and FACE_SERVICE_TOKEN
npm run dev
```

In Vercel, add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `FACE_SERVICE_URL`, `FACE_SERVICE_TOKEN` then redeploy. Old AWS variables are no longer used by this build.

## D. Demo flow

1. Admin logs in, opens **Employees**, adds employee with hourly or monthly rate.
2. Click **Enroll Face**, capture 3–5 samples, then **Save Face Samples**. Each photo must have exactly one sufficiently large face.
3. Admin opens **Office Kiosks**, generates a unique device token, pastes it once on the `/kiosk` page for each mounted device.
4. Employee presses **CLOCK IN**, the kiosk captures image, sends it to server. Server authenticates kiosk, loads only enrolled templates in that organization, calls private match service, writes attendance on recognized match.
5. Employee presses **CLOCK OUT** when leaving. Attendance and simplified payroll draft update in admin.

## Technical details and caveats

- Python service calculates 128-d SFace embeddings and normalized cosine similarity. `FACE_COSINE_THRESHOLD=0.48` and margin `0.08` are conservative **starting values only**, not validated for your population/cameras; calibrate on a consented representative local dataset. Reject low-confidence/ambiguous matches.
- Kiosk token remains a shared device secret in its browser localStorage. Mount devices securely, limit access, rotate stolen tokens, and implement per-kiosk server-side rate limiting before production.
- Webcam photo matching **does not confirm liveness**; photo/video spoofing is possible. Add licensed liveness capability and manual exception review before wage processing.
- Store sensitive biometric data only while needed. Provide a removal path, defined retention/deletion, explicit role restrictions, privacy notice and appropriate lawful basis. Avoid sending screenshots containing secrets.
- The existing payroll is illustrative: paid leave, overtime rules, statutory deductions, shift anomalies, wage-rate history, overnight shifts and correction workflows are incomplete. Do not auto-pay wages from this MVP.
- Existing face enrollments created with AWS must be re-enrolled using the new model. Templates are not interoperable.
- Batch replacement of templates is not transactional; database RPC/transaction is recommended for production.
- Multiple concurrent scans could race on attendance state checks; use a PostgreSQL transaction/lock for commercial deployment.
- This package has not been live-tested against your deployed Vercel/Supabase project or physical kiosks. Perform staged end-to-end tests before real use.
