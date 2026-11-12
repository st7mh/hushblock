(function () {
  const S = window.SITE || {};
  const all = (sel) => document.querySelectorAll(sel);
  all('.js-store').forEach((a) => {
    if (S.storeUrl) {
      a.href = S.storeUrl;
      a.target = '_blank';
      a.rel = 'noopener';
    } else {
      a.href = '#pricing';
    }
  });
  if (!S.storeUrl) all('.js-store-label').forEach((el) => (el.textContent = 'Coming soon to the Chrome Web Store'));
  // Windows download buttons go straight to the installer.
  const D = S.desktop || {};
  if (D.windowsUrl) all('.js-dl-win').forEach((a) => { a.href = D.windowsUrl; a.setAttribute('download', ''); });
  // Browser stores: show the ones that are live.
  const stores = S.stores || {};
  const names = { chrome: 'Chrome', edge: 'Edge', firefox: 'Firefox' };
  const live = Object.keys(names).filter((k) => stores[k]);
  all('.js-stores').forEach((box) => {
    live.forEach((k) => {
      const a = document.createElement('a');
      a.className = 'btn ghost sm';
      a.href = stores[k];
      a.target = '_blank';
      a.rel = 'noopener';
      a.textContent = 'Add to ' + names[k];
      box.append(a);
    });
  });
  if (live.length) {
    all('.js-ext-tag').forEach((el) => (el.textContent = 'Available now'));
    all('.js-ext-note').forEach((el) => (el.textContent = live.length < 3 ? 'More stores coming soon.' : 'Works in Brave, Arc and Opera too.'));
  }
  all('.js-notify-mac').forEach((a) => S.email && (a.href = 'mailto:' + S.email + '?subject=' + encodeURIComponent('Notify me: Hushblock for Mac') + '&body=' + encodeURIComponent('Please email me when Hushblock for Mac is available.')));
  all('.js-email').forEach((a) => {
    if (S.email) {
      a.href = 'mailto:' + S.email;
      if (a.dataset.show !== undefined) a.textContent = S.email;
    } else a.removeAttribute('href');
  });
  all('.js-owner').forEach((el) => (el.textContent = S.owner || 'the Hushblock developer'));
  all('.js-price-month').forEach((el) => (el.textContent = S.priceMonth || el.textContent));
  all('.js-price-year').forEach((el) => (el.textContent = S.priceYear || el.textContent));
  all('.js-price-year-mo').forEach((el) => (el.textContent = S.priceYearPerMonth || el.textContent));
  all('.js-buy-month').forEach((a) => S.checkoutMonthly && (a.href = S.checkoutMonthly));
  all('.js-buy-year').forEach((a) => S.checkoutYearly && (a.href = S.checkoutYearly));
  all('.js-portal').forEach((a) => S.portalUrl && (a.href = S.portalUrl));
  all('.js-year').forEach((el) => (el.textContent = String(new Date().getFullYear())));
})();
