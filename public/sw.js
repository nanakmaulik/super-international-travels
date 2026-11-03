/* WorkPulse Kiosk PWA: no attendance requests, camera frames, API responses, or face data are cached. */
self.addEventListener('install',event=>{self.skipWaiting();});
self.addEventListener('activate',event=>{event.waitUntil(self.clients.claim());});
// Deliberately network-only: offline attendance must never be mistaken for a saved punch.
