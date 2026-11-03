(function () {
  'use strict';
  const config = window.SIT_CONFIG || {};
  const root = document.body?.dataset.root || '';
  const menuButton = document.querySelector('.menu-toggle');
  const menu = document.getElementById('primary-nav');
  const setMenu = (open) => {
    if (!menu || !menuButton) return;
    menu.classList.toggle('is-open', open);
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  };
  menuButton?.addEventListener('click', () => setMenu(menuButton.getAttribute('aria-expanded') !== 'true'));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
  menu?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  document.querySelectorAll('[data-year]').forEach(el => el.textContent = String(new Date().getFullYear()));

  // Client branding: replace placeholder graphic by editing site-config.js and adding the asset file.
  const logoName = (config.logoFile || 'logo-placeholder.svg').replace(/^.*[\\/]/, '');
  document.querySelectorAll('.brand-logo,.footer-brand img').forEach(img => {
    img.src = root + 'assets/' + logoName;
  });
  document.querySelectorAll('[data-email-display]').forEach(el => el.textContent = config.email || 'Business email to be added');
  document.querySelectorAll('[data-phone-display]').forEach(el => el.textContent = config.phone || 'Business phone number to be added');
  document.querySelectorAll('[data-address-display]').forEach(el => el.textContent = config.address || 'Office address to be added');
  document.querySelectorAll('[data-contact-links]').forEach(el => {
    if (config.email) { const a = document.createElement('a'); a.textContent = config.email; a.href = 'mailto:' + config.email; el.appendChild(a); }
    if (config.phone) { const a = document.createElement('a'); a.textContent = config.phone; a.href = 'tel:' + config.phone.replace(/[^\d+]/g, ''); el.appendChild(a); }
  });

  // Destination filter, works offline or when hosted on a static platform.
  const groups = { all: null, asia: ['singapore', 'thailand', 'dubai'], europe: ['germany', 'switzerland'], india: ['goa'] };
  document.querySelectorAll('[data-filter]').forEach(btn => btn.addEventListener('click', () => {
    const value = btn.dataset.filter;
    document.querySelectorAll('[data-filter]').forEach(b => {
      const active = b === btn;
      b.classList.toggle('active', active);
      b.setAttribute('aria-pressed', String(active));
    });
    document.querySelectorAll('[data-filter-item]').forEach(card => {
      const destination = card.dataset.filterItem.split(' ')[0];
      card.hidden = groups[value] ? !groups[value].includes(destination) : false;
    });
  }));

  const form = document.getElementById('enquiry-form');
  if (!form) return;
  const interest = new URLSearchParams(window.location.search).get('interest');
  const interestSelect = form.elements.namedItem('interest');
  if (interest && interestSelect) {
    const options = Array.from(interestSelect.options);
    const matching = options.find(o => o.value.toLowerCase() === interest.toLowerCase());
    if (matching) interestSelect.value = matching.value;
  }
  const feedback = document.getElementById('enquiry-feedback');
  const messageBox = document.getElementById('enquiry-message');
  const result = document.getElementById('enquiry-result');
  const send = document.getElementById('enquiry-send');
  const copy = document.getElementById('enquiry-copy');
  const safeText = (value) => String(value || '').trim();
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const fields = new FormData(form);
    const message = [
      'Hello Super International Travels,',
      'I would like to enquire about travel services.', '',
      'Name: ' + safeText(fields.get('name')),
      'Phone: ' + safeText(fields.get('phone')),
      'Email: ' + safeText(fields.get('email')),
      'Interested in: ' + safeText(fields.get('interest')),
      'Preferred travel month: ' + (safeText(fields.get('month')) || 'Flexible'),
      'Message: ' + (safeText(fields.get('message')) || 'Please contact me with more information.')
    ].join('\n');
    messageBox.value = message;
    feedback.hidden = false;
    const wa = String(config.whatsapp || '').replace(/\D/g, '');
    if (/^\d{10,15}$/.test(wa)) {
      send.href = 'https://wa.me/' + wa + '?text=' + encodeURIComponent(message);
      send.textContent = 'Send on WhatsApp ↗';
      send.hidden = false;
      result.textContent = 'Your message is ready. Press “Send on WhatsApp” and confirm the message in WhatsApp to finish.';
    } else if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(config.email || ''))) {
      send.href = 'mailto:' + config.email + '?subject=' + encodeURIComponent('Travel enquiry — Super International Travels') + '&body=' + encodeURIComponent(message);
      send.removeAttribute('target');
      send.textContent = 'Open email draft ↗';
      send.hidden = false;
      result.textContent = 'Your message is ready. Press “Open email draft” and send it using your mail app.';
    } else {
      send.hidden = true;
      result.textContent = 'Preview mode: business contact details have not been supplied. Copy your enquiry below. After the owner adds a WhatsApp number or email, the send button will work.';
    }
    feedback.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });
  copy?.addEventListener('click', async () => {
    const value = messageBox.value;
    try {
      if (!navigator.clipboard?.writeText) throw new Error('clipboard unavailable');
      await navigator.clipboard.writeText(value);
      copy.textContent = 'Copied ✓';
      setTimeout(() => { copy.textContent = 'Copy message'; }, 2200);
    } catch {
      messageBox.focus(); messageBox.select();
      copy.textContent = 'Select text & copy';
    }
  });
})();
