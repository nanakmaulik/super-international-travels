# Super International Travels — Luxury Travel Website

**Ready-to-upload static website:** no React, Vite, npm, Node, database or build command required.

## Open the website immediately

1. Unzip the folder.
2. Double-click `index.html`. The website will open in your browser.
3. Internet access is needed for the Unsplash destination photographs and Google Fonts. Local logo, navigation, layouts, visa content, package details and enquiry preparation also work offline.
4. Use the menu to open the other pages. Every package has its own detailed itinerary.

## Pages included

- `index.html` — Luxury homepage
- `services.html` — Travel/visa services
- `packages.html` — Six destination cards with category filters
- `singapore-visa.html` — Dedicated Singapore visa guide, checklist, fee breakdown and FAQs
- `contact.html` — Client enquiry preparation form
- `destinations/*.html` — Individual Singapore, Thailand, Dubai, Goa, Germany and Switzerland itineraries

## Client details — edit only one file

Open **`assets/site-config.js`** and replace the blank values with actual information:

```js
window.SIT_CONFIG = {
  brand: "Super International Travels",
  whatsapp: "919876543210", // REPLACE with real WhatsApp number, digits only
  phone: "+91 98765 43210", // REPLACE
  email: "hello@your-domain.com", // REPLACE
  address: "Real office address, India", // REPLACE
  logoFile: "logo-placeholder.svg"
};
```

**Important:** The sample numbers and email shown above are documentation EXAMPLES, not set in the actual website. No rival firm's details are used. The contact form does not collect or transmit information to a server. With WhatsApp configured, the prepared message opens WhatsApp; the user must click Send. With only email configured it opens a mailto draft. Without either, the form offers a copyable enquiry in preview mode. For automatic CRM/email delivery use a secure form backend later.

## Change logo later

1. Put the client logo in `assets/` as `logo.png` (or SVG).
2. Change `logoFile` to `"logo.png"` inside `assets/site-config.js`.
3. Both header and footer logos update automatically. The current compass mark is an editable placeholder, not the client's official logo.

## Upload to GitHub Pages — no build needed

1. Create a **public GitHub repository** (e.g. `super-international-travels`).
2. Upload the **contents of this extracted folder** (not the ZIP itself) into the repository root.
3. Go to **Settings → Pages → Build and deployment**.
4. Choose **Deploy from a branch**, branch **main**, folder **/(root)**, then **Save**.
5. The published website will be at `https://YOUR-USERNAME.github.io/super-international-travels/`.
6. For a custom domain open **Settings → Pages → Custom domain**, enter the purchased domain and follow GitHub's current DNS instructions. Don't guess DNS IP values; use the official GitHub documentation.
7. Turn on **Enforce HTTPS** once the certificate is issued. Add a `CNAME` file containing only the custom domain if GitHub Pages didn't automatically create one.

**Alternative:** Import the repo into Vercel, select **Other** framework, leave build command blank, output directory `.` and deploy as static. For GitHub Pages, the included relative page links and assets are already compatible with project subpaths.

## Must confirm before launch

- Real contact phone, WhatsApp, email, office address, logo and domain.
- Any direct authorisation/partnership claims: this website **does not** claim that the agency itself is an appointed Singapore visa agent.
- Singapore visa displayed **₹4,634 is a draft illustrative quote**, not a confirmed charge. Based on a third-party ₹3,634 published fee plus proposed ₹1,000 assistance; governmental/authorised agent charges are separate. Tax/legal review and real supplier quote are needed before publishing a rate.
- The six holiday packages are **original sample itinerary concepts**, with prices on request. No supplier inventory, flights or hotels have been booked, checked or priced. These are **not** copied tour packages from another website.
- Final terms, refund policies, privacy notice and business registration details should be approved by the client before taking payment or collecting sensitive documents.

## Reference information

Singapore High Commission (New Delhi) — visa requirements, Form 14A and government fees:
https://new-delhi.mfa.gov.sg/consular-services/visa-information/

Published reference Singapore visa charge (Pristine Visas, 2026):
https://pristinevisas.com/documents.html

Singapore ICA visa processing info:
https://ask.gov.sg/ica/questions/clos83fw101o55k0w392mpaai

## Photography

Destination photographs are pulled from the official **images.unsplash.com** CDN with verified matching subject matter. The site requires Internet access to display them. For a totally offline visual build, download appropriately licensed photos and replace their URLs in the generated HTML files with local paths; follow licence/attribution requirements. See `IMAGE_CREDITS.md`.
