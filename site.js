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
