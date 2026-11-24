// Edit these values after publishing. Everything on the site updates automatically.
window.SITE = {
  // Your Chrome Web Store link (fill in after the extension is approved)
  storeUrl: '',
  // Browser extension store pages — paste each link once the listing is live.
  stores: {
    chrome: '',
    edge: 'https://microsoftedge.microsoft.com/addons/detail/gakneiepmaeffhdfcacgcjfiakiibmfn',
    firefox: 'https://addons.mozilla.org/firefox/addon/hushblock/',
  },
  // Support email shown on the site and in the privacy policy
  email: 'grytsaims@gmail.com',
  // Seller name shown in the Terms
  owner: 'Hushblock',
  // Prices — keep these the same as the products in Dodo Payments
  priceMonth: '$4.99',
  priceYear: '$29.99',
  priceYearPerMonth: '$2.50',
  // Dodo Payments checkout links (static payment links)
  checkoutMonthly: 'https://checkout.dodopayments.com/buy/pdt_0NrmYGNB15mZohFfnClwT?quantity=1&redirect_url=https%3A%2F%2Fhushblock.app%2Fthanks.html&metadata_source=website',
  checkoutYearly: 'https://checkout.dodopayments.com/buy/pdt_0NrmYGRc2VuDUfbc9Rr93?quantity=1&redirect_url=https%3A%2F%2Fhushblock.app%2Fthanks.html&metadata_source=website',
  // Accounts (Supabase). Both values are public — safe to keep in the site.
  supabaseUrl: 'https://cskmxkpxpybhrewwgiqb.supabase.co',
  supabaseKey: 'sb_publishable_pBCLKvw2ohvGkEjI6Ql_Tg_axI4vplc',
  // Windows app download (the installer lives in the download/ folder of this site)
  desktop: {
    version: '1.1.0',
    windowsUrl: 'https://hushblock.app/download/Hushblock-Setup.exe',
    size: '2.7 MB',
    mac: {
      version: '1.1.0',
      url: 'https://hushblock.app/download/Hushblock-mac.zip',
      size: '6.5 MB',
      sha256: '63b1fbe469ab5cf2ac4c6050e343c54d430050714a71e8513f5020257851a23e',
    },
    sha256: '55742dd39907b9d41dc3caecf50815d30d563ab20722c91625d9cfc5fa79d642',
  },
  // Where customers manage or cancel their subscription
  portalUrl: 'https://customer.dodopayments.com/login/bus_0NUrZESLEBLpA1DuJyvEQ',
};
